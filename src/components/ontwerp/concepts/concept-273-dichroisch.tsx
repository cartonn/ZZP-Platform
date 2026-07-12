"use client";

// Concept 273 — "Dichroisch" · Iridescent dichroic-glass, premium-dark.
// Signature: deep black-glass surfaces with hairline dichroic-film borders — thin spectral gradients
// that shift hue on hover (teal → indigo → violet → magenta → cyan) via an animated background-position.
// The iridescence is only an accent on edges, buttons and highlights; the base stays near-black with a
// single refined silver text. Elegant light-refraction glows, restrained and futuristic.
// Fonts: Geist (text) + Geist Mono (codes/numbers).

import { useId, useState, type CSSProperties, type ReactNode } from "react";
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
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Gem,
  Send,
  Loader2,
  Inbox,
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

// Deep black-glass base with a small set of spectral stops for the dichroic film.
const C = {
  bg: "#08080a",
  bg2: "#0b0b0e",
  panel: "#0a0a0c",
  panel2: "#101014",
  glass: "linear-gradient(180deg, rgba(22,22,29,0.72), rgba(9,9,12,0.92))",
  glassSoft: "linear-gradient(180deg, rgba(18,18,24,0.55), rgba(8,8,11,0.85))",
  line: "rgba(255,255,255,0.07)",
  lineSoft: "rgba(255,255,255,0.045)",
  fg: "#f3f4f7",
  fgSoft: "#c9ccd6",
  muted: "#898d99",
  faint: "#5a5e6a",
  // Spectral stops — the dichroic film.
  teal: "#4be0d0",
  cyan: "#58e5ff",
  indigo: "#7b8cff",
  violet: "#c86bff",
  magenta: "#ff6bd0",
  amber: "#ffb454",
  rose: "#ff6b8a",
};

// The dichroic film itself — a wide spectral gradient that scrolls on hover.
const SPECTRAL =
  "linear-gradient(115deg, #4be0d0 0%, #58e5ff 22%, #7b8cff 44%, #c86bff 64%, #ff6bd0 82%, #4be0d0 100%)";

const geist = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7b8cff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080a]";

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Inbox,
};

// ---- Dichroic primitives ----------------------------------------------------

// A hairline dichroic frame: a thin spectral gradient border wrapping a black-glass panel.
// The `c273-dichro` class scrolls the gradient position on hover/focus → a real hue shift.
function DichroFrame({
  children,
  radius = 14,
  pad = 1,
  interactive = true,
  glass = C.glass,
  className,
  style,
}: {
  children: ReactNode;
  radius?: number;
  pad?: number;
  interactive?: boolean;
  glass?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`${interactive ? "c273-dichro" : ""} ${className ?? ""}`}
      style={{ backgroundImage: SPECTRAL, borderRadius: radius, padding: pad, ...style }}
    >
      <div
        style={{
          background: glass,
          borderRadius: Math.max(radius - pad, 4),
          height: "100%",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// A flat glass panel with a plain hairline border (used for calmer, non-signature surfaces).
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
    <div
      className={className}
      style={{
        background: C.glassSoft,
        border: `1px solid ${C.line}`,
        borderRadius: 14,
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// A small prismatic light-refraction glow, positioned behind content.
function PrismGlow({
  tone,
  size = 220,
  style,
}: {
  tone: string;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${tone} 0%, transparent 68%)`,
        filter: "blur(46px)",
        opacity: 0.5,
        ...style,
      }}
    />
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
      return {
        label: "Geverifieerd",
        Icon: BadgeCheck,
        tone: C.teal,
        soft: "rgba(75,224,208,0.12)",
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        tone: C.indigo,
        soft: "rgba(123,140,255,0.14)",
      };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        Icon: TriangleAlert,
        tone: C.amber,
        soft: "rgba(255,180,84,0.13)",
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: XCircle,
        tone: C.rose,
        soft: "rgba(255,107,138,0.13)",
      };
  }
}

// Status is ALWAYS label + icon — never colour alone.
function StatusBadge({ status }: { status: CredStatus }) {
  const { label, Icon, tone, soft } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-[11px] font-semibold"
      style={{ ...geist, color: tone, background: soft, border: `1px solid ${tone}33` }}
    >
      <span
        className="flex h-4 w-4 items-center justify-center rounded-full"
        style={{ background: `${tone}26` }}
        aria-hidden="true"
      >
        <Icon size={11} strokeWidth={2.4} color={tone} />
      </span>
      {label}
    </span>
  );
}

function matchTone(value: number): string {
  return value >= 90 ? C.teal : value >= 82 ? C.indigo : C.violet;
}

// Match score as a mono figure with a thin spectral ring accent.
function MatchTag({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const tone = matchTone(value);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
      style={{ background: `${tone}1a`, border: `1px solid ${tone}40` }}
      aria-label={`Match ${value} procent`}
    >
      <Sparkles size={size === "sm" ? 11 : 13} strokeWidth={2.2} color={tone} aria-hidden="true" />
      <span
        className={`font-semibold tabular-nums ${size === "sm" ? "text-[12.5px]" : "text-[15px]"}`}
        style={{ ...mono, color: tone }}
      >
        {value}%
      </span>
    </span>
  );
}

// Inline-SVG sparkline with a spectral stroke gradient.
function Sparkline({ data, height = 34 }: { data: number[]; height?: number }) {
  const gid = useId().replace(/[:]/g, "");
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 66 - 16;
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
      <defs>
        <linearGradient id={`stroke-${gid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={C.teal} />
          <stop offset="50%" stopColor={C.indigo} />
          <stop offset="100%" stopColor={C.magenta} />
        </linearGradient>
        <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.indigo} stopOpacity={0.28} />
          <stop offset="100%" stopColor={C.indigo} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,100 ${line} 100,100`} fill={`url(#fill-${gid})`} />
      <polyline
        points={line}
        fill="none"
        stroke={`url(#stroke-${gid})`}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {last && (
        <circle
          cx={last[0]}
          cy={last[1]}
          r={2.4}
          fill={C.magenta}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span
      className="rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{
        ...geist,
        color: C.fgSoft,
        background: "rgba(255,255,255,0.05)",
        border: `1px solid ${C.line}`,
      }}
    >
      {label}
    </span>
  );
}

function ScreenHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-7">
      <div className="mb-2.5 flex items-center gap-2">
        <span
          className="h-px w-6"
          style={{ background: SPECTRAL, backgroundSize: "300% 300%" }}
          aria-hidden="true"
        />
        <span
          className="text-[10.5px] font-semibold uppercase tracking-[0.24em]"
          style={{ ...mono, color: C.muted }}
        >
          {eyebrow}
        </span>
      </div>
      <h1
        className="text-[27px] font-semibold leading-tight tracking-tight sm:text-[31px]"
        style={{ ...geist, color: C.fg }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2 max-w-xl text-[13.5px] leading-relaxed"
          style={{ ...geist, color: C.muted }}
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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span
              className="text-[10.5px] font-semibold uppercase tracking-[0.24em]"
              style={{ ...mono, color: C.muted }}
            >
              {PROFIEL.plaats} · {PROFIEL.rol}
            </span>
          </div>
          <h1
            className="text-[30px] font-semibold leading-none tracking-tight sm:text-[36px]"
            style={{ ...geist, color: C.fg }}
          >
            Dag, {voornaam}
          </h1>
          <p className="mt-2 text-[13.5px]" style={{ ...geist, color: C.muted }}>
            Je overzicht breekt het licht — elke kaart een dun spectrum aan de rand.
          </p>
        </div>
        <DichroFrame radius={12} className="c273-lift">
          <span className="flex items-center gap-2 px-4 py-2.5">
            <Gem size={15} strokeWidth={2} color={C.violet} aria-hidden="true" />
            <span className="text-[12px] font-semibold" style={{ ...geist, color: C.fgSoft }}>
              {PROFIEL.trust}
            </span>
          </span>
        </DichroFrame>
      </div>

      {/* KPIs with spectral sparklines */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <DichroFrame key={k.label} radius={14} className="c273-lift">
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="text-[10.5px] font-medium uppercase tracking-[0.1em]"
                    style={{ ...geist, color: C.muted }}
                  >
                    {k.label}
                  </span>
                  <span
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                    style={{ ...mono, color: k.up ? C.teal : C.amber }}
                  >
                    <Trend size={11} strokeWidth={2.2} aria-hidden="true" />
                    {k.trend}
                  </span>
                </div>
                <div
                  className="mt-1.5 text-[23px] font-semibold tabular-nums leading-none"
                  style={{ ...geist, color: C.fg }}
                >
                  {k.value}
                </div>
                <div className="mt-2.5">
                  <Sparkline data={k.spark} />
                </div>
              </div>
            </DichroFrame>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={15} strokeWidth={2} color={C.indigo} aria-hidden="true" />
            <h2
              className="text-[14px] font-semibold tracking-tight"
              style={{ ...geist, color: C.fg }}
            >
              Beste match
            </h2>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group block w-full text-left ${RING} rounded-[15px]`}
          >
            <DichroFrame radius={15} className="c273-lift">
              <div className="relative overflow-hidden p-5">
                <PrismGlow tone={C.violet} style={{ right: -60, top: -60 }} />
                <div className="relative flex items-start gap-4">
                  <MatchTag value={top.match} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[17px] font-semibold leading-tight"
                      style={{ ...geist, color: C.fg }}
                    >
                      {top.titel}
                    </div>
                    <div className="mt-1 text-[13px]" style={{ ...geist, color: C.muted }}>
                      {top.opdrachtgever} · {top.plaats} · {top.tarief}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {top.tags.map((t) => (
                        <Tag key={t} label={t} />
                      ))}
                    </div>
                  </div>
                  <ArrowRight
                    size={19}
                    className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
                    color={C.violet}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </DichroFrame>
          </button>

          <Panel className="relative mt-6 overflow-hidden">
            <PrismGlow tone={C.teal} style={{ left: -50, bottom: -70 }} />
            <div className="relative flex items-start gap-4 p-5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(75,224,208,0.12)", border: `1px solid ${C.teal}40` }}
                aria-hidden="true"
              >
                <ShieldCheck size={21} strokeWidth={2} color={C.teal} />
              </span>
              <div>
                <div className="inline-flex items-center gap-2">
                  <span className="text-[14px] font-semibold" style={{ ...geist, color: C.fg }}>
                    {PROFIEL.trust}
                  </span>
                  <BadgeCheck size={15} strokeWidth={2} color={C.teal} aria-hidden="true" />
                </div>
                <p
                  className="mt-1 text-[13px] leading-relaxed"
                  style={{ ...geist, color: C.fgSoft }}
                >
                  Je documenten zijn geverifieerd — opdrachtgevers zien meteen een helder profiel.
                </p>
              </div>
            </div>
          </Panel>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <ListTodo size={15} strokeWidth={2} color={C.amber} aria-hidden="true" />
            <h2
              className="text-[14px] font-semibold tracking-tight"
              style={{ ...geist, color: C.fg }}
            >
              Volgende stappen
            </h2>
          </div>
          <ul className="space-y-2.5">
            {ACTIES.map((a) => {
              const tone = a.urgentie === "warning" ? C.amber : C.indigo;
              return (
                <li key={a.titel}>
                  <Panel className="overflow-hidden">
                    <div className="flex">
                      <span
                        className="w-1 shrink-0"
                        style={{ background: tone }}
                        aria-hidden="true"
                      />
                      <div className="p-3.5">
                        <div
                          className="text-[12.5px] font-semibold leading-snug"
                          style={{ ...geist, color: C.fg }}
                        >
                          {a.titel}
                        </div>
                        <span
                          className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold"
                          style={{ ...geist, color: tone }}
                        >
                          {a.cta}
                          <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                  </Panel>
                </li>
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
  return (
    <div>
      <ScreenHead
        eyebrow="Marktplaats"
        title="Opdrachten, door het prisma"
        sub="We tonen eerlijk waarom een opdracht past — en waar de lijn afwijkt."
      />

      <div className="mb-5">
        <DichroFrame radius={12}>
          <div className="flex items-center gap-2 px-4 py-2.5">
            <Search size={16} className="shrink-0" color={C.indigo} aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek op titel, plaats of vaardigheid…"
              aria-label="Zoek opdrachten"
              className="w-full bg-transparent py-1 text-[14px] outline-none placeholder:text-[#5a5e6a]"
              style={{ ...geist, color: C.fg }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${RING}`}
                style={{ ...geist, color: C.indigo, background: "rgba(123,140,255,0.14)" }}
              >
                Wis
              </button>
            )}
          </div>
        </DichroFrame>
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(123,140,255,0.1)", border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Search size={24} strokeWidth={1.8} color={C.muted} />
          </span>
          <h3 className="text-[19px] font-semibold" style={{ ...geist, color: C.fg }}>
            Geen match gevonden
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...geist, color: C.muted }}>
            Geen resultaat voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <button
            onClick={() => setQuery("")}
            className={`mt-1 rounded-full ${RING}`}
            aria-label="Filter wissen"
          >
            <DichroFrame radius={10} className="c273-lift">
              <span
                className="block px-5 py-2 text-[13px] font-semibold"
                style={{ ...geist, color: C.fg }}
              >
                Filter wissen
              </span>
            </DichroFrame>
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            const reason = o.redenen.plus[0];
            return (
              <DichroFrame key={o.id} radius={15} className="c273-lift flex h-full">
                <div className="relative flex h-full w-full flex-col overflow-hidden p-4">
                  <PrismGlow
                    tone={matchTone(o.match)}
                    size={160}
                    style={{ right: -50, top: -60 }}
                  />
                  <div className="relative flex items-center justify-between">
                    <MatchTag value={o.match} size="sm" />
                    <button
                      onClick={() => toggleSave(o.id)}
                      aria-pressed={isSaved}
                      aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${RING}`}
                      style={{
                        color: isSaved ? C.violet : C.muted,
                        background: isSaved ? "rgba(200,107,255,0.14)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isSaved ? `${C.violet}55` : C.line}`,
                      }}
                    >
                      {isSaved ? (
                        <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                      ) : (
                        <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <div className="relative mt-3">
                    <span
                      className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                      style={{ ...mono, color: C.faint }}
                    >
                      {o.id}
                    </span>
                    <h3
                      className="mt-1 text-[16px] font-semibold leading-tight"
                      style={{ ...geist, color: C.fg }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[13px]" style={{ ...geist, color: C.muted }}>
                      {o.opdrachtgever}
                    </div>
                  </div>
                  <dl
                    className="relative mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]"
                    style={{ ...geist, color: C.fgSoft }}
                  >
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} strokeWidth={2} color={C.faint} aria-hidden="true" />
                      {o.plaats}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wallet size={13} strokeWidth={2} color={C.faint} aria-hidden="true" />
                      {o.tarief}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} strokeWidth={2} color={C.faint} aria-hidden="true" />
                      {o.uren}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} strokeWidth={2} color={C.faint} aria-hidden="true" />
                      {o.start}
                    </div>
                  </dl>
                  {reason && (
                    <p
                      className="relative mt-3 flex items-start gap-1.5 text-[12px] leading-snug"
                      style={{ ...geist, color: C.fgSoft }}
                    >
                      <Check
                        size={13}
                        strokeWidth={2.6}
                        className="mt-0.5 shrink-0"
                        color={C.teal}
                        aria-hidden="true"
                      />
                      {reason}
                    </p>
                  )}
                  <div className="relative mt-3 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <Tag key={t} label={t} />
                    ))}
                  </div>
                  <button
                    onClick={() => onOpen(o)}
                    className={`group relative mt-4 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-semibold transition-colors ${RING}`}
                    style={{
                      ...geist,
                      color: C.fg,
                      background: "rgba(255,255,255,0.05)",
                      border: `1px solid ${C.line}`,
                    }}
                  >
                    Bekijk opdracht
                    <ArrowRight
                      size={14}
                      strokeWidth={2.2}
                      className="transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </DichroFrame>
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
  const tone = matchTone(opdracht.match);
  return (
    <div>
      <button
        onClick={onBack}
        className={`mb-5 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold transition-colors ${RING}`}
        style={{
          ...geist,
          color: C.fgSoft,
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${C.line}`,
        }}
      >
        <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
        Terug
      </button>

      <DichroFrame radius={16}>
        <div className="relative overflow-hidden p-6">
          <PrismGlow tone={tone} style={{ right: -40, top: -70 }} />
          <PrismGlow tone={C.magenta} size={180} style={{ left: -50, bottom: -80 }} />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.muted }}
              >
                {opdracht.id}
              </span>
              <h2
                className="mt-1.5 text-[24px] font-semibold leading-tight tracking-tight"
                style={{ ...geist, color: C.fg }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[14px]" style={{ ...geist, color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MatchTag value={opdracht.match} />
              <button
                onClick={() => toggleSave(opdracht.id)}
                aria-pressed={isSaved}
                aria-label={isSaved ? "Bewaard" : "Bewaar opdracht"}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold transition-colors ${RING}`}
                style={{
                  ...geist,
                  color: isSaved ? C.violet : C.fgSoft,
                  background: isSaved ? "rgba(200,107,255,0.14)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${isSaved ? `${C.violet}55` : C.line}`,
                }}
              >
                {isSaved ? (
                  <BookmarkCheck size={14} strokeWidth={2.2} aria-hidden="true" />
                ) : (
                  <Bookmark size={14} strokeWidth={2.2} aria-hidden="true" />
                )}
                {isSaved ? "Bewaard" : "Bewaar"}
              </button>
            </div>
          </div>

          <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
              { Icon: Clock, label: "Inzet", value: opdracht.uren },
              { Icon: Calendar, label: "Start", value: opdracht.start },
              { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl p-3"
                style={{ background: "rgba(255,255,255,0.035)", border: `1px solid ${C.line}` }}
              >
                <m.Icon size={14} strokeWidth={2} color={tone} aria-hidden="true" />
                <div
                  className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...geist, color: C.muted }}
                >
                  {m.label}
                </div>
                <div className="text-[14px] font-semibold" style={{ ...geist, color: C.fg }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DichroFrame>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 pb-3 pt-4"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: "rgba(75,224,208,0.14)", border: `1px solid ${C.teal}40` }}
              aria-hidden="true"
            >
              <Plus size={13} strokeWidth={2.6} color={C.teal} />
            </span>
            <span className="text-[14px] font-semibold" style={{ ...geist, color: C.fg }}>
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-2.5 p-5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...geist, color: C.fgSoft }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  color={C.teal}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 pb-3 pt-4"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: "rgba(255,180,84,0.14)", border: `1px solid ${C.amber}40` }}
              aria-hidden="true"
            >
              <Minus size={13} strokeWidth={2.6} color={C.amber} />
            </span>
            <span className="text-[14px] font-semibold" style={{ ...geist, color: C.fg }}>
              Even op letten
            </span>
          </div>
          <ul className="space-y-2.5 p-5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...geist, color: C.fgSoft }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0"
                  color={C.amber}
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
          className={`rounded-full ${RING}`}
        >
          <DichroFrame radius={11} className="c273-lift" glass={C.glass}>
            <span
              className="flex items-center gap-2 px-6 py-3 text-[14px] font-semibold"
              style={{ ...geist, color: applied ? C.teal : C.fg }}
            >
              {applied ? (
                <Check size={17} strokeWidth={2.6} aria-hidden="true" />
              ) : (
                <Send size={16} strokeWidth={2.2} aria-hidden="true" />
              )}
              {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
            </span>
          </DichroFrame>
        </button>
        {applied && (
          <span className="text-[12.5px]" style={{ ...geist, color: C.muted }}>
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
  const allStatuses: CredStatus[] = ["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"];
  return (
    <div>
      <ScreenHead
        eyebrow="Verificatie"
        title="Documenten, helder gecontroleerd"
        sub="Elke status is herkenbaar aan label én icoon — nooit aan kleur alleen."
      />

      {/* Legend of the four statuses */}
      <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {allStatuses.map((s) => {
          const m = statusMeta(s);
          return (
            <Panel key={s} className="flex items-center gap-2.5 p-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: m.soft, border: `1px solid ${m.tone}40` }}
                aria-hidden="true"
              >
                <m.Icon size={15} strokeWidth={2.2} color={m.tone} />
              </span>
              <span className="text-[12px] font-semibold" style={{ ...geist, color: C.fgSoft }}>
                {m.label}
              </span>
            </Panel>
          );
        })}
      </div>

      <DichroFrame radius={15} interactive={false}>
        <div className="relative mb-0 flex items-center gap-4 overflow-hidden p-5">
          <PrismGlow tone={C.teal} style={{ left: -40, top: -60 }} />
          <span
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: "rgba(75,224,208,0.12)", border: `1px solid ${C.teal}40` }}
            aria-hidden="true"
          >
            <ShieldCheck size={24} strokeWidth={2} color={C.teal} />
          </span>
          <div className="relative">
            <div className="text-[15px] font-semibold" style={{ ...geist, color: C.fg }}>
              {PROFIEL.trust}
            </div>
            <p className="mt-0.5 text-[13px]" style={{ ...geist, color: C.fgSoft }}>
              Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
            </p>
          </div>
        </div>
      </DichroFrame>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            const m = statusMeta(c.status);
            return (
              <Panel key={c.naam} className="flex items-center gap-3 overflow-hidden">
                <span
                  className="w-1 self-stretch"
                  style={{ background: m.tone }}
                  aria-hidden="true"
                />
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`my-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${RING}`}
                  style={{
                    border: `1.5px solid ${done ? C.teal : C.line}`,
                    background: done ? "rgba(75,224,208,0.16)" : "transparent",
                    color: C.teal,
                  }}
                >
                  {done && <Check size={15} strokeWidth={2.6} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1 py-3">
                  <div className="text-[14px] font-semibold" style={{ ...geist, color: C.fg }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...geist, color: C.muted }}>
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
              className="inline-flex items-center gap-2 text-[14px] font-semibold"
              style={{ ...geist, color: C.fg }}
            >
              <FileText size={16} strokeWidth={2} color={C.violet} aria-hidden="true" />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center rounded-full ${RING}`}
              style={{
                background: "rgba(255,255,255,0.04)",
                color: C.violet,
                border: `1px solid ${C.line}`,
              }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => {
              const on = feedState === s;
              return (
                <button
                  key={s}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setFeedState(s)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${RING}`}
                  style={{
                    ...geist,
                    color: on ? C.fg : C.muted,
                    background: on ? "rgba(200,107,255,0.16)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${on ? `${C.violet}55` : C.line}`,
                  }}
                >
                  {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
                </button>
              );
            })}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <li key={i}>
                  <Panel className="p-3.5">
                    <div
                      className="h-3 w-2/3 animate-pulse rounded-full"
                      style={{ background: "rgba(255,255,255,0.07)" }}
                    />
                    <div
                      className="mt-2 h-2.5 w-1/3 animate-pulse rounded-full"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    />
                  </Panel>
                </li>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Panel className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: "rgba(255,107,138,0.12)", border: `1px solid ${C.rose}40` }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} color={C.rose} />
              </span>
              <div className="text-[15px] font-semibold" style={{ ...geist, color: C.fg }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...geist, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold ${RING}`}
                style={{
                  ...geist,
                  color: C.fg,
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${C.line}`,
                }}
              >
                <RefreshCw size={13} strokeWidth={2.2} aria-hidden="true" />
                Opnieuw proberen
              </button>
            </Panel>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => {
                const m = statusMeta(d.status);
                return (
                  <li key={d.naam}>
                    <Panel className="flex items-center gap-3 p-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold"
                        style={{
                          ...mono,
                          color: m.tone,
                          background: m.soft,
                          border: `1px solid ${m.tone}33`,
                        }}
                        aria-hidden="true"
                      >
                        {d.type}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className="truncate text-[12.5px] font-semibold"
                          style={{ ...geist, color: C.fg }}
                        >
                          {d.naam}
                        </div>
                        <div
                          className="text-[11px] tabular-nums"
                          style={{ ...mono, color: C.muted }}
                        >
                          {d.grootte} · {d.bijgewerkt}
                        </div>
                      </div>
                      <StatusBadge status={d.status} />
                    </Panel>
                  </li>
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
      <ScreenHead eyebrow="Acties" title="Wat vandaag om aandacht vraagt" />

      {openCount === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(75,224,208,0.1)", border: `1px solid ${C.teal}40` }}
            aria-hidden="true"
          >
            <Check size={26} strokeWidth={2.2} color={C.teal} />
          </span>
          <h3 className="text-[19px] font-semibold" style={{ ...geist, color: C.fg }}>
            Alles helder
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...geist, color: C.muted }}>
            Niets meer te doen vandaag. Het spectrum is compleet.
          </p>
        </Panel>
      ) : (
        <>
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-2"
            style={{ background: "rgba(255,180,84,0.12)", border: `1px solid ${C.amber}40` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold tabular-nums"
              style={{ ...mono, background: "rgba(255,180,84,0.2)", color: C.amber }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ ...geist, color: C.amber }}>
              {openCount} {openCount === 1 ? "actie" : "acties"} open
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const warning = a.urgentie === "warning";
              const tone = isDone ? C.teal : warning ? C.amber : C.indigo;
              return (
                <li key={a.titel}>
                  <Panel className="flex items-stretch overflow-hidden">
                    <span
                      className="w-1 shrink-0"
                      style={{ background: tone }}
                      aria-hidden="true"
                    />
                    <div className="flex flex-1 items-start gap-4 p-5">
                      <button
                        onClick={() => toggleDone(a.titel)}
                        aria-pressed={isDone}
                        aria-label={
                          isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`
                        }
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${RING}`}
                        style={{
                          border: `1.5px solid ${isDone ? C.teal : C.line}`,
                          background: isDone ? "rgba(75,224,208,0.16)" : "transparent",
                          color: C.teal,
                        }}
                      >
                        {isDone && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                            style={{
                              ...geist,
                              color: warning ? C.amber : C.indigo,
                              background: warning
                                ? "rgba(255,180,84,0.12)"
                                : "rgba(123,140,255,0.12)",
                            }}
                          >
                            {warning ? (
                              <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                            ) : (
                              <Sparkles size={10} strokeWidth={2.4} aria-hidden="true" />
                            )}
                            {warning ? "Aandacht" : "Kans"}
                          </span>
                        </div>
                        <div
                          className="mt-1.5 text-[15px] font-semibold leading-snug"
                          style={{
                            ...geist,
                            color: C.fg,
                            textDecoration: isDone ? "line-through" : "none",
                            opacity: isDone ? 0.5 : 1,
                          }}
                        >
                          {a.titel}
                        </div>
                        <p
                          className="mt-1 text-[12.5px]"
                          style={{ ...geist, color: C.muted, opacity: isDone ? 0.5 : 1 }}
                        >
                          {a.detail}
                        </p>
                        {!isDone && (
                          <button
                            onClick={() => toggleDone(a.titel)}
                            className={`mt-2.5 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${RING}`}
                            style={{
                              ...geist,
                              color: warning ? C.amber : C.indigo,
                              background: warning
                                ? "rgba(255,180,84,0.12)"
                                : "rgba(123,140,255,0.12)",
                              border: `1px solid ${warning ? `${C.amber}40` : `${C.indigo}40`}`,
                            }}
                          >
                            {a.cta}
                            <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  </Panel>
                </li>
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
  const invStatus = (status: string): { tone: string; soft: string; Icon: LucideIcon } =>
    status === "Betaald"
      ? { tone: C.teal, soft: "rgba(75,224,208,0.12)", Icon: Check }
      : status === "Openstaand"
        ? { tone: C.amber, soft: "rgba(255,180,84,0.13)", Icon: Clock }
        : { tone: C.muted, soft: "rgba(255,255,255,0.06)", Icon: FileText };
  return (
    <div>
      <ScreenHead
        eyebrow="Facturen"
        title="Je facturen"
        sub="Overzichtelijk en zonder gedoe — zodat je weet waar je aan toe bent."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-2">
          {[
            { label: "Betaald (mnd)", value: "€ 5.552", tone: C.teal },
            { label: "Openstaand", value: "€ 1.350", tone: C.amber },
            { label: "Concept", value: "€ 880", tone: C.muted },
          ].map((s) => (
            <DichroFrame key={s.label} radius={14} className="c273-lift">
              <div className="p-4">
                <div
                  className="text-[10.5px] font-medium uppercase tracking-[0.09em]"
                  style={{ ...geist, color: C.muted }}
                >
                  {s.label}
                </div>
                <div
                  className="mt-1 text-[22px] font-semibold tabular-nums"
                  style={{ ...geist, color: s.tone }}
                >
                  {s.value}
                </div>
              </div>
            </DichroFrame>
          ))}
        </div>
        <Panel className="flex flex-col justify-between p-4">
          <div
            className="text-[10.5px] font-medium uppercase tracking-[0.09em]"
            style={{ ...geist, color: C.muted }}
          >
            Bedrag per factuur
          </div>
          <Sparkline data={trend} height={46} />
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
                    className="px-3 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                    style={{ ...geist, color: C.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const sw = invStatus(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="c273-row transition-colors"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12.5px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.fg }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3 text-[13px]" style={{ ...geist, color: C.fg }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-3 text-[12.5px] tabular-nums"
                      style={{ ...mono, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3 text-[13px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.fg }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-[11px] font-semibold"
                        style={{
                          ...geist,
                          color: sw.tone,
                          background: sw.soft,
                          border: `1px solid ${sw.tone}33`,
                        }}
                      >
                        <span
                          className="flex h-4 w-4 items-center justify-center rounded-full"
                          style={{ background: `${sw.tone}26` }}
                          aria-hidden="true"
                        >
                          <sw.Icon size={10} strokeWidth={2.4} color={sw.tone} />
                        </span>
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

export function Concept273() {
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
      style={{ ...geist, color: C.fg, background: C.bg }}
    >
      {/* Scoped styles: the dichroic hue-shift micro-interaction + row hover. */}
      <style>{`
        .c273-dichro {
          background-size: 300% 300%;
          background-position: 0% 50%;
          transition: background-position 0.7s cubic-bezier(0.4, 0, 0.2, 1),
            box-shadow 0.45s ease, transform 0.35s ease;
        }
        .c273-dichro:hover,
        .c273-dichro:focus-within {
          background-position: 100% 50%;
          box-shadow: 0 0 0 1px rgba(200, 107, 255, 0.22),
            0 12px 34px -14px rgba(123, 140, 255, 0.55);
        }
        .c273-lift:hover,
        .c273-lift:focus-within {
          transform: translateY(-2px);
        }
        .c273-row:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        @media (prefers-reduced-motion: reduce) {
          .c273-dichro,
          .c273-lift {
            transition: none;
          }
        }
      `}</style>

      {/* Ambient spectral aurora behind the shell. */}
      <PrismGlow tone="rgba(75,224,208,0.35)" size={420} style={{ left: -120, top: -140 }} />
      <PrismGlow tone="rgba(200,107,255,0.32)" size={460} style={{ right: -160, top: 40 }} />
      <PrismGlow tone="rgba(255,107,208,0.22)" size={380} style={{ left: 120, bottom: -180 }} />

      <div className="relative mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <DichroFrame radius={13} interactive={false}>
              <span
                className="flex h-11 w-11 items-center justify-center"
                style={{ color: C.violet }}
                aria-hidden="true"
              >
                <Gem size={20} strokeWidth={2} />
              </span>
            </DichroFrame>
            <div className="leading-tight">
              <div
                className="text-[18px] font-semibold tracking-tight"
                style={{ ...geist, color: C.fg }}
              >
                Dichroisch
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.muted }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...geist, color: C.fg }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...geist, color: C.teal }}
              >
                <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <DichroFrame radius={13} interactive={false}>
              <span
                className="flex h-11 w-11 items-center justify-center text-[13px] font-bold"
                style={{ ...mono, color: C.fg }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </DichroFrame>
          </div>
        </header>

        <nav
          className="mb-8 flex flex-wrap gap-1.5 overflow-x-auto pb-1"
          aria-label="Hoofdnavigatie"
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICONS[s.key];
            const inner = (
              <span
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-semibold"
                style={{ ...geist, color: on ? C.fg : C.fgSoft }}
              >
                <Icon size={14} strokeWidth={2} aria-hidden="true" />
                {s.label}
              </span>
            );
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`shrink-0 rounded-[11px] transition-colors ${RING}`}
              >
                {on ? (
                  <DichroFrame radius={11}>{inner}</DichroFrame>
                ) : (
                  <span
                    className="inline-flex rounded-[11px]"
                    style={{
                      background: "rgba(255,255,255,0.035)",
                      border: `1px solid ${C.line}`,
                    }}
                  >
                    {inner}
                  </span>
                )}
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
          className="mt-10 flex flex-wrap items-center justify-between gap-2 pt-4 text-[11px]"
          style={{ ...mono, borderTop: `1px solid ${C.line}`, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Loader2 size={12} strokeWidth={2} color={C.teal} aria-hidden="true" />
            {SCREENS.length} schermen · dichroic v273
          </span>
          <span>Licht gebroken door zwart glas</span>
        </footer>
      </div>
    </div>
  );
}
