"use client";

// Concept 264 — "Honingraat" · Hexagonal cell-grid on warm honey light.
// Signature: a true hexagon tessellation as information architecture. KPI's and modules live in
// six-sided cells (CSS clip-path polygons + an SVG honeycomb backdrop), warm amber/honey over
// anthracite ink. Cells lift and lighten on hover like comb catching light. Distinct from bento
// (rectangular) by the real hex geometry — yet all body text stays inside readable rectangular
// zones, with the hex used as frame/accent only. Fonts: Space (display) + Inter (body).
// Honey accent #e0a020 on paper #f6efe0, ink #2a2318.

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
  Hexagon,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
  Sparkles,
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

// Honeycomb palette: honey/amber over warm paper, deep anthracite ink for AA contrast.
const C = {
  paper: "#f6efe0",
  paper2: "#f0e6d2",
  cell: "#fffaf0",
  cellSoft: "#f7eed9",
  line: "rgba(42,35,24,0.16)",
  lineFaint: "rgba(42,35,24,0.09)",
  comb: "rgba(224,160,32,0.16)",
  combLine: "rgba(224,160,32,0.30)",
  ink: "#2a2318",
  inkSoft: "#4a4232",
  muted: "#7a7059",
  faint: "#a89a7c",
  honey: "#e0a020",
  honeyDeep: "#a9741a",
  honeySoft: "#f8ecc9",
  green: "#3a6b2f",
  greenSoft: "#e4eed9",
  amber: "#a06510",
  amberSoft: "#f6e6c6",
  red: "#a5342c",
  redSoft: "#f2ded9",
};

const display = { fontFamily: "var(--font-lab-space)" };
const sans = { fontFamily: "var(--font-lab-inter)" };

// Pointy-top hexagon clip-path for the KPI tiles, badges and avatar chips.
const HEX_CLIP_POINTY = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0a020] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6efe0]";

// A tiled honeycomb backdrop drawn as an inline SVG pattern — pure structure, aria-hidden.
function CombBackdrop() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
      style={{ opacity: 0.7 }}
    >
      <defs>
        <pattern id="c264-comb" width={56} height={96} patternUnits="userSpaceOnUse">
          <path
            d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z M28 64 L56 80 L56 112 M28 64 L0 80 L0 112"
            fill="none"
            stroke={C.combLine}
            strokeWidth={1}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#c264-comb)" />
    </svg>
  );
}

// A hexagonal frame around a small icon/number — the honeycomb "cell" accent.
function HexBadge({
  children,
  tone = C.honey,
  bg = C.honeySoft,
  size = 44,
}: {
  children: ReactNode;
  tone?: string;
  bg?: string;
  size?: number;
}) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="absolute inset-0" style={{ background: tone, clipPath: HEX_CLIP_POINTY }} />
      <span className="absolute" style={{ inset: 2, background: bg, clipPath: HEX_CLIP_POINTY }} />
      <span className="relative flex items-center justify-center" style={{ color: tone }}>
        {children}
      </span>
    </span>
  );
}

function cellStyle(soft = false): CSSProperties {
  return {
    background: soft ? C.cellSoft : C.cell,
    border: `1px solid ${C.line}`,
    borderRadius: 14,
    boxShadow: "0 1px 0 rgba(42,35,24,0.05)",
  };
}

// A card in the comb: soft rounded cell with a honey top-edge accent that brightens on hover.
function Cell({
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
    <div className={`relative ${className ?? ""}`} style={{ ...cellStyle(soft), ...style }}>
      {children}
    </div>
  );
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.green, bg: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.honeyDeep, bg: C.honeySoft };
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
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ ...sans, color: fg, background: bg, border: `1px solid ${fg}`, borderRadius: 999 }}
    >
      <Icon size={11} strokeWidth={2} aria-hidden="true" />
      {label}
    </span>
  );
}

// A honey sparkline drawn as a smooth area under a stroke.
function Spark({
  data,
  tone = C.honeyDeep,
  height = 32,
}: {
  data: number[];
  tone?: string;
  height?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 72 - 14;
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
      <polygon points={area} fill={C.honey} opacity={0.16} stroke="none" />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.2} fill={C.cell} stroke={tone} strokeWidth={0.9} />
      ))}
    </svg>
  );
}

// A hexagonal match gauge — a hex outline that fills with honey by score.
function MatchHex({ value, size = 60 }: { value: number; size?: number }) {
  const fill = Math.min(1, value / 100);
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-0"
        style={{ background: C.line, clipPath: HEX_CLIP_POINTY }}
      />
      <span
        className="absolute"
        style={{
          inset: 1.5,
          background: `linear-gradient(to top, ${C.honey} ${fill * 100}%, ${C.honeySoft} ${fill * 100}%)`,
          clipPath: HEX_CLIP_POINTY,
        }}
      />
      <span className="relative flex flex-col items-center justify-center leading-none">
        <span className="text-[16px] font-bold tabular-nums" style={{ ...display, color: C.ink }}>
          {value}
        </span>
        <span
          className="text-[7px] font-bold uppercase tracking-[0.14em]"
          style={{ ...display, color: C.honeyDeep }}
        >
          match
        </span>
      </span>
    </span>
  );
}

function ScreenHead({ title, sub, code }: { title: string; sub?: string; code?: string }) {
  return (
    <div className="mb-6">
      {code && (
        <div
          className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em]"
          style={{ ...display, color: C.honeyDeep }}
        >
          <Hexagon size={11} strokeWidth={2} aria-hidden="true" />
          {code}
        </div>
      )}
      <h1
        className="text-[26px] font-bold leading-tight tracking-tight sm:text-[30px]"
        style={{ ...display, color: C.ink }}
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
            className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em]"
            style={{ ...display, color: C.honeyDeep }}
          >
            Raat · {PROFIEL.plaats}
          </div>
          <h1
            className="text-[26px] font-bold leading-none tracking-tight sm:text-[30px]"
            style={{ ...display, color: C.ink }}
          >
            Dag, {voornaam}
          </h1>
          <p className="mt-2 text-[13px]" style={{ ...sans, color: C.muted }}>
            Je raat is gevuld. Eén cel vraagt vandaag om aandacht.
          </p>
        </div>
        <span className="hidden shrink-0 sm:block">
          <HexBadge size={58} tone={C.honey} bg={C.honeySoft}>
            <Sparkles size={22} strokeWidth={1.8} />
          </HexBadge>
        </span>
      </div>

      {/* KPI hex-cells: pointy-top hexagons framing the number, laid in a comb-ish row. */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <Cell key={k.label} className="group p-4 transition-transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="relative flex h-9 w-9 items-center justify-center"
                  aria-hidden="true"
                  style={{ background: C.honey, clipPath: HEX_CLIP_POINTY }}
                >
                  <span
                    className="absolute"
                    style={{ inset: 2, background: C.honeySoft, clipPath: HEX_CLIP_POINTY }}
                  />
                  <Hexagon
                    size={14}
                    strokeWidth={2}
                    className="relative"
                    style={{ color: C.honeyDeep }}
                  />
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                  style={{ ...sans, color: k.up ? C.green : C.amber }}
                >
                  <Trend size={11} strokeWidth={2} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...sans, color: C.muted }}
              >
                {k.label}
              </div>
              <div
                className="mt-0.5 text-[24px] font-bold tabular-nums leading-none"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-2">
                <Spark data={k.spark} />
              </div>
            </Cell>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Hexagon size={15} strokeWidth={2} style={{ color: C.honeyDeep }} aria-hidden="true" />
            <h2
              className="text-[13px] font-bold uppercase tracking-[0.12em]"
              style={{ ...display, color: C.ink }}
            >
              Beste match
            </h2>
          </div>
          <button
            onClick={onOpen}
            className={`group flex w-full items-start gap-4 p-5 text-left transition-transform hover:-translate-y-0.5 ${RING}`}
            style={cellStyle()}
          >
            <MatchHex value={top.match} />
            <div className="min-w-0 flex-1">
              <div
                className="text-[17px] font-bold leading-tight"
                style={{ ...display, color: C.ink }}
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
                    className="px-2.5 py-0.5 text-[11px] font-medium"
                    style={{
                      ...sans,
                      color: C.inkSoft,
                      border: `1px solid ${C.line}`,
                      borderRadius: 999,
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
              style={{ color: C.honeyDeep }}
              aria-hidden="true"
            />
          </button>

          <Cell soft className="mt-6 flex items-start gap-4 p-5">
            <HexBadge size={46} tone={C.green} bg={C.greenSoft}>
              <ShieldCheck size={20} strokeWidth={1.8} />
            </HexBadge>
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[14px] font-bold" style={{ ...display, color: C.ink }}>
                  {PROFIEL.trust}
                </span>
                <BadgeCheck
                  size={15}
                  strokeWidth={2}
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ ...sans, color: C.inkSoft }}>
                Je documenten zitten netjes in de raat en zijn geverifieerd — opdrachtgevers zien
                meteen dat het klopt.
              </p>
            </div>
          </Cell>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <ListTodo size={15} strokeWidth={2} style={{ color: C.honeyDeep }} aria-hidden="true" />
            <h2
              className="text-[13px] font-bold uppercase tracking-[0.12em]"
              style={{ ...display, color: C.ink }}
            >
              In de raat
            </h2>
          </div>
          <ul className="space-y-2.5">
            {ACTIES.map((a) => (
              <Cell key={a.titel} className="p-3.5 transition-transform hover:-translate-y-0.5">
                <div className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 h-3 w-3 shrink-0"
                    style={{
                      background: a.urgentie === "warning" ? C.amber : C.honey,
                      clipPath: HEX_CLIP_POINTY,
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
                    <div
                      className="mt-0.5 text-[11.5px] font-medium"
                      style={{ ...sans, color: C.honeyDeep }}
                    >
                      {a.cta}
                    </div>
                  </div>
                </div>
              </Cell>
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
      <ScreenHead
        code="Marktplaats · afgestemd op je profiel"
        title="Opdrachten in de raat"
        sub="We tonen eerlijk waarom een opdracht past — en waar de cel wat wringt."
      />

      <div className="mb-5 flex items-center gap-2 px-4 py-2.5" style={cellStyle()}>
        <Search size={16} className="shrink-0" style={{ color: C.honeyDeep }} aria-hidden="true" />
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
            className={`px-2.5 py-1 text-[11px] font-bold ${RING}`}
            style={{ ...sans, color: C.honeyDeep, background: C.honeySoft, borderRadius: 999 }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Cell className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <HexBadge size={58} tone={C.honey} bg={C.honeySoft}>
            <Search size={22} strokeWidth={1.8} />
          </HexBadge>
          <h3 className="text-[18px] font-bold" style={{ ...display, color: C.ink }}>
            Geen cel gevonden
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm — de raat vult zich
            zodra er een pad is.
          </p>
          <button
            onClick={() => setQuery("")}
            className={`mt-1 px-5 py-2 text-[13px] font-bold text-white ${RING}`}
            style={{ ...display, background: C.honeyDeep, borderRadius: 999 }}
          >
            Filter wissen
          </button>
        </Cell>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <Cell
                key={o.id}
                className="flex h-full flex-col p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <MatchHex value={o.match} size={52} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-9 w-9 items-center justify-center transition-colors ${RING}`}
                    style={{
                      background: isSaved ? C.honeySoft : "transparent",
                      color: isSaved ? C.honeyDeep : C.muted,
                      border: `1px solid ${isSaved ? C.honey : C.line}`,
                      borderRadius: 999,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={15} strokeWidth={2} aria-hidden="true" />
                    ) : (
                      <Bookmark size={15} strokeWidth={2} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <h3
                  className="mt-3 text-[15.5px] font-bold leading-tight"
                  style={{ ...display, color: C.ink }}
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
                      strokeWidth={2}
                      style={{ color: C.faint }}
                      aria-hidden="true"
                    />
                    {o.plaats}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wallet
                      size={13}
                      strokeWidth={2}
                      style={{ color: C.faint }}
                      aria-hidden="true"
                    />
                    {o.tarief}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock
                      size={13}
                      strokeWidth={2}
                      style={{ color: C.faint }}
                      aria-hidden="true"
                    />
                    {o.uren}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar
                      size={13}
                      strokeWidth={2}
                      style={{ color: C.faint }}
                      aria-hidden="true"
                    />
                    {o.start}
                  </div>
                </dl>
                <button
                  onClick={() => onOpen(o)}
                  className={`group mt-4 inline-flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-bold text-white transition-colors ${RING}`}
                  style={{ ...display, background: C.honeyDeep, borderRadius: 999 }}
                >
                  Bekijk opdracht
                  <ArrowRight
                    size={14}
                    strokeWidth={2}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </button>
              </Cell>
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
        className={`mb-5 inline-flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-bold ${RING}`}
        style={{
          ...display,
          color: C.inkSoft,
          background: C.cellSoft,
          border: `1px solid ${C.line}`,
          borderRadius: 999,
        }}
      >
        <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
        Terug
      </button>

      <Cell className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <MatchHex value={opdracht.match} size={66} />
            <div>
              <div
                className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ ...display, color: C.honeyDeep }}
              >
                {opdracht.id}
              </div>
              <h2
                className="text-[22px] font-bold leading-tight tracking-tight"
                style={{ ...display, color: C.ink }}
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
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold ${RING}`}
            style={{
              ...display,
              color: isSaved ? C.honeyDeep : C.inkSoft,
              background: isSaved ? C.honeySoft : C.cellSoft,
              border: `1px solid ${isSaved ? C.honey : C.line}`,
              borderRadius: 999,
            }}
          >
            {isSaved ? (
              <BookmarkCheck size={14} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Bookmark size={14} strokeWidth={2} aria-hidden="true" />
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
              style={{ background: C.cellSoft, border: `1px solid ${C.line}`, borderRadius: 10 }}
            >
              <m.Icon size={14} strokeWidth={2} style={{ color: C.honeyDeep }} aria-hidden="true" />
              <div
                className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.12em]"
                style={{ ...sans, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="text-[13.5px] font-semibold" style={{ ...sans, color: C.ink }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </Cell>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Cell className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <HexBadge size={28} tone={C.green} bg={C.greenSoft}>
              <Plus size={13} strokeWidth={2.4} />
            </HexBadge>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.1em]"
              style={{ ...display, color: C.ink }}
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
                  strokeWidth={2.4}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Cell>
        <Cell className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <HexBadge size={28} tone={C.amber} bg={C.amberSoft}>
              <Minus size={13} strokeWidth={2.4} />
            </HexBadge>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.1em]"
              style={{ ...display, color: C.ink }}
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
                  strokeWidth={2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Cell>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className={`inline-flex items-center gap-2 px-6 py-3 text-[14px] font-bold text-white transition-colors ${RING}`}
          style={{ ...display, background: applied ? C.green : C.honeyDeep, borderRadius: 999 }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.4} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />
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
        title="Documenten, cel voor cel gecontroleerd"
        sub="Je gevoelige papieren houden we privé en zorgvuldig bij — jij bepaalt wie meekijkt."
      />

      <Cell soft className="mb-6 flex items-center gap-4 p-5">
        <HexBadge size={50} tone={C.green} bg={C.greenSoft}>
          <ShieldCheck size={24} strokeWidth={1.8} />
        </HexBadge>
        <div>
          <div className="text-[14px] font-bold" style={{ ...display, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[13px]" style={{ ...sans, color: C.inkSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Cell>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            return (
              <Cell key={c.naam} className="flex items-center gap-3 p-4">
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`relative flex h-8 w-8 shrink-0 items-center justify-center transition-transform hover:scale-105 ${RING}`}
                  aria-hidden={false}
                >
                  <span
                    className="absolute inset-0"
                    style={{ background: done ? C.honey : C.line, clipPath: HEX_CLIP_POINTY }}
                  />
                  <span
                    className="absolute"
                    style={{
                      inset: 1.5,
                      background: done ? C.honey : C.cell,
                      clipPath: HEX_CLIP_POINTY,
                    }}
                  />
                  {done && (
                    <Check
                      size={15}
                      strokeWidth={2.8}
                      className="relative text-white"
                      aria-hidden="true"
                    />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...sans, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <StatusChip status={c.status} />
              </Cell>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.1em]"
              style={{ ...display, color: C.ink }}
            >
              <FileText
                size={16}
                strokeWidth={2}
                style={{ color: C.honeyDeep }}
                aria-hidden="true"
              />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center ${RING}`}
              style={{
                background: C.cellSoft,
                color: C.honeyDeep,
                border: `1px solid ${C.line}`,
                borderRadius: 999,
              }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className={`px-3 py-1 text-[11px] font-bold ${RING}`}
                style={{
                  ...display,
                  color: feedState === s ? "#fff" : C.muted,
                  background: feedState === s ? C.honeyDeep : C.cellSoft,
                  border: `1px solid ${feedState === s ? C.honeyDeep : C.line}`,
                  borderRadius: 999,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Cell key={i} className="p-3.5">
                  <div
                    className="h-3 w-2/3 animate-pulse"
                    style={{ background: C.cellSoft, borderRadius: 4 }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse"
                    style={{ background: C.cellSoft, borderRadius: 4 }}
                  />
                </Cell>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Cell className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <HexBadge size={50} tone={C.red} bg={C.redSoft}>
                <CircleAlert size={24} strokeWidth={1.8} />
              </HexBadge>
              <div className="text-[14px] font-bold" style={{ ...display, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className={`mt-1 px-4 py-2 text-[12px] font-bold text-white ${RING}`}
                style={{ ...display, background: C.honeyDeep, borderRadius: 999 }}
              >
                Opnieuw proberen
              </button>
            </Cell>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <Cell key={d.naam} className="flex items-center gap-3 p-3">
                  <span
                    className="relative flex h-9 w-9 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{ ...display }}
                    aria-hidden="true"
                  >
                    <span
                      className="absolute inset-0"
                      style={{ background: C.honeySoft, clipPath: HEX_CLIP_POINTY }}
                    />
                    <span className="relative" style={{ color: C.honeyDeep }}>
                      {d.type}
                    </span>
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
                  <StatusChip status={d.status} />
                </Cell>
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
      <ScreenHead code="Acties · takenlijst" title="Wat vandaag om aandacht vraagt" />

      {openCount === 0 ? (
        <Cell className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <HexBadge size={58} tone={C.green} bg={C.greenSoft}>
            <Check size={24} strokeWidth={2} />
          </HexBadge>
          <h3 className="text-[19px] font-bold" style={{ ...display, color: C.ink }}>
            Raat is af
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Niets meer te doen vandaag. Alle cellen zijn gevuld.
          </p>
        </Cell>
      ) : (
        <>
          <div
            className="mb-4 inline-flex items-center gap-2 px-3.5 py-2"
            style={{ background: C.honeySoft, border: `1px solid ${C.honey}`, borderRadius: 999 }}
          >
            <span
              className="relative flex h-6 w-6 items-center justify-center text-[12px] font-bold tabular-nums text-white"
              style={{ ...display }}
              aria-hidden="true"
            >
              <span
                className="absolute inset-0"
                style={{ background: C.honeyDeep, clipPath: HEX_CLIP_POINTY }}
              />
              <span className="relative">{openCount}</span>
            </span>
            <span className="text-[12.5px] font-bold" style={{ ...display, color: C.honeyDeep }}>
              {openCount} {openCount === 1 ? "cel" : "cellen"} in de wachtrij
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              return (
                <Cell key={a.titel} className="flex items-start gap-4 p-5">
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`relative flex h-8 w-8 shrink-0 items-center justify-center transition-transform hover:scale-105 ${RING}`}
                  >
                    <span
                      className="absolute inset-0"
                      style={{ background: isDone ? C.green : C.line, clipPath: HEX_CLIP_POINTY }}
                    />
                    <span
                      className="absolute"
                      style={{
                        inset: 1.5,
                        background: isDone ? C.green : C.cell,
                        clipPath: HEX_CLIP_POINTY,
                      }}
                    />
                    {isDone && (
                      <Check
                        size={16}
                        strokeWidth={2.8}
                        className="relative text-white"
                        aria-hidden="true"
                      />
                    )}
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
                        className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-bold"
                        style={{
                          ...display,
                          color: a.urgentie === "warning" ? C.amber : C.honeyDeep,
                          background: a.urgentie === "warning" ? C.amberSoft : C.honeySoft,
                          border: `1px solid ${a.urgentie === "warning" ? C.amber : C.honey}`,
                          borderRadius: 999,
                        }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </Cell>
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
  const badgeTone = (status: string): { fg: string; bg: string } =>
    status === "Betaald"
      ? { fg: C.green, bg: C.greenSoft }
      : status === "Openstaand"
        ? { fg: C.amber, bg: C.amberSoft }
        : { fg: C.muted, bg: C.cellSoft };
  return (
    <div>
      <ScreenHead
        code="Facturen · overzicht"
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
            <Cell key={s.label} className="p-4">
              <div
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...sans, color: C.muted }}
              >
                {s.label}
              </div>
              <div
                className="mt-1 text-[21px] font-bold tabular-nums"
                style={{ ...display, color: s.tone }}
              >
                {s.value}
              </div>
            </Cell>
          ))}
        </div>
        <Cell className="flex flex-col justify-between p-4">
          <div
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...sans, color: C.muted }}
          >
            Bedrag per factuur
          </div>
          <Spark data={trend} tone={C.honeyDeep} height={44} />
        </Cell>
      </div>

      <Cell className="overflow-hidden p-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.1em]"
                    style={{ ...sans, color: C.muted }}
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
                    className="transition-colors hover:bg-[#f7eed9]"
                    style={{ borderBottom: `1px solid ${C.lineFaint}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12.5px] font-bold tabular-nums"
                      style={{ ...display, color: C.honeyDeep }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3 text-[13px]" style={{ ...sans, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-3 text-[12.5px] tabular-nums"
                      style={{ ...sans, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3 text-[13px] font-bold tabular-nums"
                      style={{ ...display, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{
                          ...sans,
                          color: t.fg,
                          background: t.bg,
                          border: `1px solid ${t.fg}`,
                          borderRadius: 999,
                        }}
                      >
                        {f.status === "Betaald" ? (
                          <Check size={11} strokeWidth={2.4} aria-hidden="true" />
                        ) : f.status === "Openstaand" ? (
                          <Clock size={11} strokeWidth={2} aria-hidden="true" />
                        ) : (
                          <FileText size={11} strokeWidth={2} aria-hidden="true" />
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
      </Cell>
    </div>
  );
}

// ---- Shell -----------------------------------------------------------------

export function Concept264() {
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
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...sans, color: C.ink, background: C.paper }}
    >
      <CombBackdrop />
      <div className="relative mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <HexBadge size={46} tone={C.honey} bg={C.honeyDeep}>
              <Hexagon size={19} strokeWidth={2} className="text-white" />
            </HexBadge>
            <div className="leading-tight">
              <div
                className="text-[19px] font-bold tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Honingraat
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ ...display, color: C.muted }}
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
                style={{ ...sans, color: C.green }}
              >
                <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <HexBadge size={46} tone={C.honey} bg={C.honeySoft}>
              <span className="text-[13px] font-bold" style={{ ...display, color: C.honeyDeep }}>
                {PROFIEL.initialen}
              </span>
            </HexBadge>
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
                className={`inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-bold transition-colors ${RING}`}
                style={{
                  ...display,
                  color: on ? "#fff" : C.inkSoft,
                  background: on ? C.honeyDeep : C.cell,
                  border: `1px solid ${on ? C.honeyDeep : C.line}`,
                  borderRadius: 999,
                }}
              >
                <Icon size={14} strokeWidth={2} aria-hidden="true" />
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
          style={{ ...display, borderColor: C.line, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Hexagon size={12} strokeWidth={2} style={{ color: C.honeyDeep }} aria-hidden="true" />
            Honingraat · {ACTIES.length} cellen in wachtrij
          </span>
          <span>Cel voor cel opgebouwd</span>
        </footer>
      </div>
    </div>
  );
}
