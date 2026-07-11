"use client";

// Concept 267 — "Vaporwave" · Pastel-mall & marble-bust dark-pastel dreamscape.
// Signature: a soft pastel-cyan / pink / lilac palette on deep violet. A one-point
// perspective grid floor recedes into the horizon, stylised marble bust & column SVG
// silhouettes sit as quiet decorative accents, and sober decorative micro-glyphs echo a
// retro-mall interface. Content lives on calm glassy dark panels with pastel glow-edges —
// readability wins over effect: body text stays light and crisp, never neon-on-neon.
// Distinct from any synthwave-sunset direction: no sun, no scanline glare — dreamy, still.
// Fonts: Space (display) + Geist Mono (labels/numbers). Accent cyan #6de3e0, pink #ff9ecf.

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
  Sparkles,
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

// Dark-pastel vaporwave palette. Light crisp foreground on deep violet keeps AA intact.
const C = {
  bg: "#1b1030",
  bg2: "#22143d",
  panel: "rgba(46,28,74,0.72)",
  panelSoft: "rgba(38,23,62,0.6)",
  glass: "rgba(60,40,96,0.5)",
  fg: "#f0e9ff",
  fgSoft: "#c9bce6",
  muted: "#9d8fc4",
  line: "rgba(150,120,210,0.28)",
  lineSoft: "rgba(150,120,210,0.16)",
  cyan: "#6de3e0",
  cyanDeep: "#2fb8b6",
  pink: "#ff9ecf",
  pinkDeep: "#e46fb0",
  lilac: "#b79cf0",
  // status tones tuned for dark bg, always AA on their soft chip fill
  green: "#7ff0c4",
  greenSoft: "rgba(60,120,96,0.34)",
  amber: "#ffcf8f",
  amberSoft: "rgba(140,96,44,0.36)",
  red: "#ff9aa0",
  redSoft: "rgba(140,58,66,0.36)",
  cyanSoft: "rgba(52,110,120,0.34)",
};

const display = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6de3e0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1030]";

// Sober decorative micro-glyphs — half-width katakana used purely as ornament (aria-hidden),
// never as meaningful text. Kept to a tiny set for a quiet retro-mall accent.
const GLYPHS = ["ｱ", "ﾐ", "ﾃ", "ﾉ", "ｾ", "ﾜ"];

function Glyph({ i, className }: { i: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{ ...mono, color: C.pink, opacity: 0.5, letterSpacing: "0.15em" }}
    >
      {GLYPHS[i % GLYPHS.length]}
    </span>
  );
}

// Receding one-point perspective grid floor — the vaporwave signature backdrop.
function GridFloor() {
  const verticals = Array.from({ length: 13 }, (_, i) => i);
  const horizontals = Array.from({ length: 8 }, (_, i) => i);
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] w-full"
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="c267-floorfade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.cyan} stopOpacity="0" />
          <stop offset="1" stopColor={C.cyan} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {verticals.map((v) => {
        const x = (v / 12) * 100;
        return (
          <line
            key={`v${v}`}
            x1={x}
            y1={40}
            x2={50}
            y2={0}
            stroke="url(#c267-floorfade)"
            strokeWidth={0.25}
          />
        );
      })}
      {horizontals.map((h) => {
        const t = h / 7;
        const y = t * t * 40; // ease so lines bunch toward the horizon
        return (
          <line
            key={`h${h}`}
            x1={0}
            y1={y}
            x2={100}
            y2={y}
            stroke={C.pink}
            strokeOpacity={0.14 + t * 0.22}
            strokeWidth={0.22}
          />
        );
      })}
    </svg>
  );
}

// Stylised marble bust silhouette — a quiet decorative accent in the header/empty states.
function MarbleBust({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 96"
      className={className}
      fill="none"
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <linearGradient id="c267-marble" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.cyan} stopOpacity="0.9" />
          <stop offset="0.55" stopColor={C.lilac} stopOpacity="0.7" />
          <stop offset="1" stopColor={C.pink} stopOpacity="0.85" />
        </linearGradient>
      </defs>
      {/* plinth */}
      <rect x={22} y={84} width={36} height={9} rx={1.5} fill="url(#c267-marble)" opacity={0.5} />
      <rect x={28} y={76} width={24} height={9} rx={1.5} fill="url(#c267-marble)" opacity={0.7} />
      {/* head + neck silhouette */}
      <path
        d="M40 8c-10 0-16 8-16 19 0 7 3 12 3 17 0 4-4 6-4 12 0 6 6 9 17 9s17-3 17-9c0-6-4-8-4-12 0-5 3-10 3-17C56 16 50 8 40 8Z"
        fill="url(#c267-marble)"
        opacity={0.85}
      />
      {/* profile line detail */}
      <path
        d="M40 20c-5 1-8 6-8 12 1 3 3 4 3 8"
        stroke={C.bg}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.4}
      />
      <circle cx={45} cy={30} r={1.6} fill={C.bg} opacity={0.35} />
    </svg>
  );
}

// Stylised marble column pair — decorative flanking accent.
function ColumnPair({ className }: { className?: string }) {
  const col = (x: number) => (
    <g key={x} opacity={0.5}>
      <rect x={x} y={4} width={12} height={4} rx={1} fill={C.lilac} />
      <rect x={x + 1.5} y={8} width={9} height={40} fill={C.cyan} opacity={0.5} />
      {Array.from({ length: 4 }, (_, i) => (
        <line
          key={i}
          x1={x + 3 + i * 2}
          y1={8}
          x2={x + 3 + i * 2}
          y2={48}
          stroke={C.bg}
          strokeWidth={0.6}
          opacity={0.4}
        />
      ))}
      <rect x={x - 1} y={48} width={14} height={4} rx={1} fill={C.pink} opacity={0.7} />
    </g>
  );
  return (
    <svg viewBox="0 0 48 54" className={className} fill="none" aria-hidden="true">
      {col(4)}
      {col(30)}
    </svg>
  );
}

function panelStyle(soft = false): CSSProperties {
  return {
    background: soft ? C.panelSoft : C.panel,
    border: `1px solid ${C.line}`,
    borderRadius: 16,
    boxShadow: "0 0 0 1px rgba(109,227,224,0.06), 0 18px 40px -28px rgba(0,0,0,0.9)",
    backdropFilter: "blur(8px)",
  };
}

// Glassy panel with a soft pastel glow edge.
function Panel({
  children,
  soft,
  glow,
  className,
  style,
}: {
  children: ReactNode;
  soft?: boolean;
  glow?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`relative ${className ?? ""}`}
      style={{
        ...panelStyle(soft),
        ...(glow
          ? { boxShadow: `0 0 0 1px ${glow}55, 0 14px 40px -26px ${glow}, 0 0 24px -14px ${glow}` }
          : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.green, bg: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.cyan, bg: C.cyanSoft };
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
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium"
      style={{ ...mono, color: fg, background: bg, border: `1px solid ${fg}66`, borderRadius: 999 }}
    >
      <Icon size={12} strokeWidth={2} aria-hidden="true" />
      {label}
    </span>
  );
}

// Soft neon sparkline on the glassy panels.
function Spark({
  data,
  tone = C.cyan,
  height = 34,
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
  const gid = `c267-spark-${tone.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tone} stopOpacity="0.4" />
          <stop offset="1" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} stroke="none" />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Circular match dial with a soft cyan→pink sweep.
function MatchDial({ value, size = 62 }: { value: number; size?: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <defs>
          <linearGradient id="c267-dial" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={C.cyan} />
            <stop offset="1" stopColor={C.pink} />
          </linearGradient>
        </defs>
        <circle cx={32} cy={32} r={r} fill="none" stroke={C.lineSoft} strokeWidth={3} />
        <circle
          cx={32}
          cy={32}
          r={r}
          fill="none"
          stroke="url(#c267-dial)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[15px] font-bold tabular-nums" style={{ ...display, color: C.fg }}>
          {value}
        </span>
        <span
          className="text-[7px] font-bold uppercase tracking-[0.14em]"
          style={{ ...mono, color: C.muted }}
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
          className="mb-2 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.28em]"
          style={{ ...mono, color: C.cyan }}
        >
          <Glyph i={1} />
          {code}
        </div>
      )}
      <h1
        className="text-[26px] font-bold leading-tight tracking-tight sm:text-[31px]"
        style={{ ...display, color: C.fg }}
      >
        {title}
      </h1>
      {sub && (
        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
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
            className="mb-1 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.28em]"
            style={{ ...mono, color: C.cyan }}
          >
            <Glyph i={0} /> Plaza · {PROFIEL.plaats}
          </div>
          <h1
            className="text-[27px] font-bold leading-none tracking-tight sm:text-[32px]"
            style={{ ...display, color: C.fg }}
          >
            Dag, {voornaam}
          </h1>
          <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
            Je plaza is rustig. Eén ding vraagt vandaag je aandacht.
          </p>
        </div>
        <div className="flex shrink-0 items-end gap-3">
          <ColumnPair className="hidden h-14 w-12 sm:block" />
          <MarbleBust className="h-20 w-16" />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const tone = i % 2 === 0 ? C.cyan : C.pink;
          return (
            <Panel key={k.label} className="p-4">
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
                  <Trend size={11} strokeWidth={2} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-1.5 text-[24px] font-bold tabular-nums leading-none"
                style={{ ...display, color: C.fg }}
              >
                {k.value}
              </div>
              <div className="mt-2">
                <Spark data={k.spark} tone={tone} />
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={15} strokeWidth={2} style={{ color: C.pink }} aria-hidden="true" />
            <h2
              className="text-[13px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.fgSoft }}
            >
              Beste match
            </h2>
          </div>
          <button
            onClick={onOpen}
            className={`group flex w-full items-start gap-4 p-5 text-left transition-transform hover:-translate-y-0.5 ${RING}`}
            style={panelStyle()}
          >
            <MatchDial value={top.match} />
            <div className="min-w-0 flex-1">
              <div
                className="text-[17px] font-bold leading-tight"
                style={{ ...display, color: C.fg }}
              >
                {top.titel}
              </div>
              <div className="mt-0.5 text-[13px]" style={{ color: C.muted }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-0.5 text-[11px]"
                    style={{
                      ...mono,
                      color: C.fgSoft,
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
              style={{ color: C.cyan }}
              aria-hidden="true"
            />
          </button>

          <Panel soft glow={C.cyan} className="mt-6 flex items-start gap-4 p-5">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center"
              style={{ background: C.cyanSoft, color: C.cyan, borderRadius: 12 }}
              aria-hidden="true"
            >
              <ShieldCheck size={22} strokeWidth={2} />
            </span>
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[14px] font-bold" style={{ ...display, color: C.fg }}>
                  {PROFIEL.trust}
                </span>
                <BadgeCheck
                  size={15}
                  strokeWidth={2}
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
                Je documenten zijn geverifieerd — opdrachtgevers zien meteen dat het klopt.
              </p>
            </div>
          </Panel>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <ListTodo size={15} strokeWidth={2} style={{ color: C.cyan }} aria-hidden="true" />
            <h2
              className="text-[13px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.fgSoft }}
            >
              Op de plaza
            </h2>
          </div>
          <ul className="space-y-2.5">
            {ACTIES.map((a) => (
              <Panel key={a.titel} className="p-3.5">
                <div className="flex items-start gap-2">
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      background: a.urgentie === "warning" ? C.amber : C.cyan,
                      boxShadow: `0 0 8px ${a.urgentie === "warning" ? C.amber : C.cyan}`,
                    }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <div
                      className="text-[12.5px] font-semibold leading-snug"
                      style={{ color: C.fg }}
                    >
                      {a.titel}
                    </div>
                    <div className="mt-0.5 text-[11.5px]" style={{ ...mono, color: C.muted }}>
                      {a.cta}
                    </div>
                  </div>
                </div>
              </Panel>
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
        code="Marktplaats · afgestemd op jou"
        title="Opdrachten in de plaza"
        sub="We tonen eerlijk waarom een opdracht past — en waar het schuurt."
      />

      <div className="mb-5 flex items-center gap-2 px-4 py-2.5" style={panelStyle()}>
        <Search size={16} className="shrink-0" style={{ color: C.cyan }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[13.5px] outline-none placeholder:opacity-60"
          style={{ color: C.fg }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`px-2.5 py-1 text-[11px] font-semibold ${RING}`}
            style={{ ...mono, color: C.bg, background: C.cyan, borderRadius: 999 }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <MarbleBust className="h-20 w-16 opacity-80" />
          <h3 className="text-[18px] font-bold" style={{ ...display, color: C.fg }}>
            Niets in de plaza
          </h3>
          <p className="max-w-xs text-[13px]" style={{ color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <button
            onClick={() => setQuery("")}
            className={`mt-1 px-5 py-2 text-[13px] font-semibold ${RING}`}
            style={{ ...mono, color: C.bg, background: C.cyan, borderRadius: 999 }}
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
                className="flex h-full flex-col p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <MatchDial value={o.match} size={54} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-9 w-9 items-center justify-center transition-colors ${RING}`}
                    style={{
                      background: isSaved ? C.cyanSoft : "transparent",
                      color: isSaved ? C.cyan : C.muted,
                      border: `1px solid ${isSaved ? C.cyan : C.line}`,
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
                  style={{ ...display, color: C.fg }}
                >
                  {o.titel}
                </h3>
                <div className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {o.opdrachtgever}
                </div>
                <dl
                  className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]"
                  style={{ color: C.fgSoft }}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin
                      size={13}
                      strokeWidth={2}
                      style={{ color: C.pink }}
                      aria-hidden="true"
                    />
                    {o.plaats}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wallet
                      size={13}
                      strokeWidth={2}
                      style={{ color: C.pink }}
                      aria-hidden="true"
                    />
                    {o.tarief}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} strokeWidth={2} style={{ color: C.pink }} aria-hidden="true" />
                    {o.uren}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar
                      size={13}
                      strokeWidth={2}
                      style={{ color: C.pink }}
                      aria-hidden="true"
                    />
                    {o.start}
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 text-[10.5px]"
                      style={{
                        ...mono,
                        color: C.lilac,
                        border: `1px solid ${C.line}`,
                        borderRadius: 999,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => onOpen(o)}
                  className={`group mt-4 inline-flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold transition-colors ${RING}`}
                  style={{ ...mono, color: C.bg, background: C.cyan, borderRadius: 999 }}
                >
                  Bekijk opdracht
                  <ArrowRight
                    size={14}
                    strokeWidth={2}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </button>
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
        className={`mb-5 inline-flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold ${RING}`}
        style={{
          ...mono,
          color: C.fgSoft,
          background: C.glass,
          border: `1px solid ${C.line}`,
          borderRadius: 999,
        }}
      >
        <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
        Terug
      </button>

      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <MatchDial value={opdracht.match} size={66} />
            <div>
              <div
                className="text-[10px] font-medium uppercase tracking-[0.26em]"
                style={{ ...mono, color: C.cyan }}
              >
                {opdracht.id}
              </div>
              <h2
                className="text-[22px] font-bold leading-tight tracking-tight"
                style={{ ...display, color: C.fg }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[13.5px]" style={{ color: C.muted }}>
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
              color: isSaved ? C.cyan : C.fgSoft,
              background: isSaved ? C.cyanSoft : C.glass,
              border: `1px solid ${isSaved ? C.cyan : C.line}`,
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
              style={{ background: C.glass, border: `1px solid ${C.line}`, borderRadius: 12 }}
            >
              <m.Icon size={14} strokeWidth={2} style={{ color: C.cyan }} aria-hidden="true" />
              <div
                className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="text-[13.5px] font-semibold" style={{ color: C.fg }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel glow={C.green} className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.greenSoft, color: C.green, borderRadius: 8 }}
              aria-hidden="true"
            >
              <Plus size={13} strokeWidth={2.4} />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.fgSoft }}
            >
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ color: C.fgSoft }}
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
        </Panel>
        <Panel glow={C.amber} className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.amberSoft, color: C.amber, borderRadius: 8 }}
              aria-hidden="true"
            >
              <Minus size={13} strokeWidth={2.4} />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.fgSoft }}
            >
              Even op letten
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ color: C.fgSoft }}
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
        </Panel>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className={`inline-flex items-center gap-2 px-6 py-3 text-[14px] font-semibold transition-colors ${RING}`}
          style={{
            ...mono,
            color: C.bg,
            background: applied ? C.green : C.cyan,
            borderRadius: 999,
          }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.4} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </button>
        {applied && (
          <span className="text-[12.5px]" style={{ color: C.muted }}>
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
        title="Documenten, zorgvuldig gecontroleerd"
        sub="Al je gevoelige papieren houden we privé en netjes bijgewerkt."
      />

      <Panel soft glow={C.cyan} className="mb-6 flex items-center gap-4 p-5">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center"
          style={{ background: C.cyanSoft, color: C.cyan, borderRadius: 14 }}
          aria-hidden="true"
        >
          <ShieldCheck size={24} strokeWidth={2} />
        </span>
        <div>
          <div className="text-[14px] font-bold" style={{ ...display, color: C.fg }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[13px]" style={{ color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            return (
              <Panel key={c.naam} className="flex items-center gap-3 p-4">
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center transition-colors ${RING}`}
                  style={{
                    border: `1.5px solid ${done ? C.cyan : C.line}`,
                    background: done ? C.cyan : "transparent",
                    color: C.bg,
                    borderRadius: 8,
                  }}
                >
                  {done && <Check size={15} strokeWidth={2.8} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ color: C.fg }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...mono, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <StatusChip status={c.status} />
              </Panel>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.fgSoft }}
            >
              <FileText size={16} strokeWidth={2} style={{ color: C.cyan }} aria-hidden="true" />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center ${RING}`}
              style={{
                background: C.glass,
                color: C.cyan,
                border: `1px solid ${C.line}`,
                borderRadius: 8,
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
                className={`px-3 py-1 text-[11px] font-semibold ${RING}`}
                style={{
                  ...mono,
                  color: feedState === s ? C.bg : C.muted,
                  background: feedState === s ? C.cyan : C.glass,
                  border: `1px solid ${feedState === s ? C.cyan : C.line}`,
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
                <Panel key={i} className="p-3.5">
                  <div
                    className="h-3 w-2/3 animate-pulse"
                    style={{ background: C.glass, borderRadius: 4 }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse"
                    style={{ background: C.glass, borderRadius: 4 }}
                  />
                </Panel>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Panel glow={C.red} className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center"
                style={{ background: C.redSoft, color: C.red, borderRadius: 14 }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[14px] font-bold" style={{ ...display, color: C.fg }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className={`mt-1 px-4 py-2 text-[12px] font-semibold ${RING}`}
                style={{ ...mono, color: C.bg, background: C.cyan, borderRadius: 999 }}
              >
                Opnieuw proberen
              </button>
            </Panel>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <Panel key={d.naam} className="flex items-center gap-3 p-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{
                      ...mono,
                      background: C.glass,
                      color: C.cyan,
                      border: `1px solid ${C.line}`,
                      borderRadius: 8,
                    }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-semibold" style={{ color: C.fg }}>
                      {d.naam}
                    </div>
                    <div className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
                      {d.grootte} · {d.bijgewerkt}
                    </div>
                  </div>
                  <StatusChip status={d.status} />
                </Panel>
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
      <ScreenHead code="Acties · wachtrij" title="Wat vandaag je aandacht vraagt" />

      {openCount === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <MarbleBust className="h-20 w-16 opacity-80" />
          <h3 className="text-[19px] font-bold" style={{ ...display, color: C.fg }}>
            Alles rustig
          </h3>
          <p className="max-w-xs text-[13px]" style={{ color: C.muted }}>
            Niets meer te doen vandaag. De plaza is stil.
          </p>
        </Panel>
      ) : (
        <>
          <div
            className="mb-4 inline-flex items-center gap-2 px-3.5 py-2"
            style={{ background: C.cyanSoft, border: `1px solid ${C.cyan}66`, borderRadius: 999 }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center text-[12px] font-bold tabular-nums"
              style={{ ...mono, color: C.bg, background: C.cyan, borderRadius: 999 }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ ...mono, color: C.cyan }}>
              {openCount} {openCount === 1 ? "punt" : "punten"} in de wachtrij
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              return (
                <Panel key={a.titel} className="flex items-start gap-4 p-5">
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${isDone ? C.green : C.line}`,
                      background: isDone ? C.green : "transparent",
                      color: C.bg,
                      borderRadius: 999,
                    }}
                  >
                    {isDone && <Check size={16} strokeWidth={2.8} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[15px] font-semibold leading-snug"
                      style={{
                        color: C.fg,
                        textDecoration: isDone ? "line-through" : "none",
                        opacity: isDone ? 0.55 : 1,
                      }}
                    >
                      {a.titel}
                    </div>
                    <p
                      className="mt-1 text-[12.5px]"
                      style={{ color: C.muted, opacity: isDone ? 0.55 : 1 }}
                    >
                      {a.detail}
                    </p>
                    {!isDone && (
                      <span
                        className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold"
                        style={{
                          ...mono,
                          color: a.urgentie === "warning" ? C.amber : C.cyan,
                          background: a.urgentie === "warning" ? C.amberSoft : C.cyanSoft,
                          border: `1px solid ${a.urgentie === "warning" ? C.amber : C.cyan}66`,
                          borderRadius: 999,
                        }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
                      </span>
                    )}
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
  const badgeTone = (status: string): { fg: string; bg: string } =>
    status === "Betaald"
      ? { fg: C.green, bg: C.greenSoft }
      : status === "Openstaand"
        ? { fg: C.amber, bg: C.amberSoft }
        : { fg: C.muted, bg: C.glass };
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
            <Panel key={s.label} className="p-4">
              <div
                className="text-[10.5px] font-medium uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.muted }}
              >
                {s.label}
              </div>
              <div
                className="mt-1 text-[21px] font-bold tabular-nums"
                style={{ ...display, color: s.tone }}
              >
                {s.value}
              </div>
            </Panel>
          ))}
        </div>
        <Panel className="flex flex-col justify-between p-4">
          <div
            className="text-[10.5px] font-medium uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.muted }}
          >
            Bedrag per factuur
          </div>
          <Spark data={trend} tone={C.pink} height={44} />
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
                    className="transition-colors hover:bg-[rgba(60,40,96,0.4)]"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12.5px] font-bold tabular-nums"
                      style={{ ...mono, color: C.cyan }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3 text-[13px]" style={{ color: C.fg }}>
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
                      style={{ ...mono, color: C.fg }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium"
                        style={{
                          ...mono,
                          color: t.fg,
                          background: t.bg,
                          border: `1px solid ${t.fg}66`,
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
      </Panel>
    </div>
  );
}

// ---- Shell -----------------------------------------------------------------

export function Concept267() {
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
      style={{
        color: C.fg,
        background: `radial-gradient(120% 90% at 50% 8%, ${C.bg2} 0%, ${C.bg} 62%)`,
      }}
    >
      <GridFloor />
      <div className="relative mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${C.cyan}, ${C.pink})`,
                color: C.bg,
                borderRadius: 14,
              }}
              aria-hidden="true"
            >
              <Sparkles size={19} strokeWidth={2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[19px] font-bold tracking-tight"
                style={{ ...display, color: C.fg }}
              >
                Vaporwave
              </div>
              <div
                className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.24em]"
                style={{ ...mono, color: C.muted }}
              >
                <Glyph i={2} /> ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ color: C.fg }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...mono, color: C.green }}
              >
                <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center text-[13px] font-bold"
              style={{
                ...display,
                background: C.cyanSoft,
                color: C.cyan,
                border: `1px solid ${C.cyan}66`,
                borderRadius: 14,
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
                  color: on ? C.bg : C.fgSoft,
                  background: on ? C.cyan : C.glass,
                  border: `1px solid ${on ? C.cyan : C.line}`,
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
          style={{ ...mono, borderColor: C.line, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Glyph i={3} /> Pastel-plaza · {ACTIES.length} acties in wachtrij
          </span>
          <span className="inline-flex items-center gap-1.5">
            Rustig ontworpen <Glyph i={4} />
          </span>
        </footer>
      </div>
    </div>
  );
}
