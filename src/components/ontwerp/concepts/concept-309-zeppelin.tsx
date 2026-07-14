"use client";

// Concept 309 — "Zeppelin" · retro-futuristische luchtvaart.
// Signature: warme lucht-tinten (hemelblauw → perzik) met messing/brass-details, ronde bull-eye
// portholes (raamvensters) als dragend motief, art-deco luchtvaart-typografie en een navigatie die
// leest als reisroute. Optimistisch retro-futurisme, premium-warm — alles op een 8pt-raster.
// Fonts: display --font-lab-anton · tekst --font-lab-jakarta · cijfers --font-lab-mono.

import { useState, type CSSProperties, type ReactNode } from "react";
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
  RefreshCw,
  Bookmark,
  BookmarkCheck,
  Navigation,
  Compass,
  Gauge,
  Plus,
  Minus,
  ShieldCheck,
  Anchor,
  Plane,
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

// Warm sky palette — dawn blue rising to peach horizon, deep navy hull, brass accents.
const C = {
  sky: "#dcecf5",
  skySoft: "#e9f2f8",
  peach: "#f6e0ce",
  peachSoft: "#fbeee1",
  card: "#fbf7f1",
  cardSoft: "#f4ede2",
  hull: "#1c2b3a",
  hullSoft: "#26394c",
  ink: "#182530",
  fg: "#33414d",
  fgSoft: "#5c6b76",
  muted: "#8593a0",
  faint: "#b3bec7",
  brass: "#b9863f",
  brassSoft: "#d9a860",
  brassDeep: "#8a5f28",
  azure: "#2f6f9e",
  azureSoft: "#4d92c4",
  line: "#d6ccbc",
  lineSoft: "#e6ddd0",
  green: "#3f8560",
  amber: "#c08a2c",
  red: "#b8493a",
};

const display = { fontFamily: "var(--font-lab-anton), Impact, sans-serif" };
const sans = { fontFamily: "var(--font-lab-jakarta), Helvetica, Arial, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9863f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#dcecf5]";

const SCREEN_INDEX: Record<ScreenKey, string> = {
  dashboard: "H1",
  marktplaats: "H2",
  opdracht: "H3",
  verificatie: "H4",
  acties: "H5",
  facturen: "H6",
  documenten: "H7",
  berichten: "H8",
};

const SCREEN_STOP: Record<ScreenKey, string> = {
  dashboard: "Vertrek",
  marktplaats: "Marktplaats",
  opdracht: "Aan boord",
  verificatie: "Douane",
  acties: "Vluchtplan",
  facturen: "Vrachtbrief",
  documenten: "Bagage",
  berichten: "Radio",
};

// ---- Aviation primitives ----------------------------------------------------

// The bull-eye porthole — a riveted brass window with the match value framed inside. The load-
// bearing motif: an arc gauge sweeps around the rim to show the value.
function Porthole({ value, size = 132, label }: { value: number; size?: number; label?: string }) {
  const cx = size / 2;
  const cy = size / 2;
  const rRim = size / 2 - 2;
  const rGlass = rRim - 9;
  const rArc = rRim - 4.5;
  const rivets = 12;
  const startA = -Math.PI / 2;
  const sweep = (value / 100) * 2 * Math.PI;
  const arcEnd = startA + sweep;
  const large = sweep > Math.PI ? 1 : 0;
  const ax1 = cx + rArc * Math.cos(startA);
  const ay1 = cy + rArc * Math.sin(startA);
  const ax2 = cx + rArc * Math.cos(arcEnd);
  const ay2 = cy + rArc * Math.sin(arcEnd);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <radialGradient id={`glass-${size}`} cx="42%" cy="34%" r="75%">
          <stop offset="0%" stopColor={C.skySoft} />
          <stop offset="60%" stopColor={C.sky} />
          <stop offset="100%" stopColor={C.peachSoft} />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={rRim} fill={C.brass} />
      <circle cx={cx} cy={cy} r={rRim - 3.5} fill={C.brassDeep} />
      <circle cx={cx} cy={cy} r={rGlass} fill={`url(#glass-${size})`} />
      {/* brass rivets around the rim */}
      {Array.from({ length: rivets }).map((_, i) => {
        const a = (i / rivets) * 2 * Math.PI - Math.PI / 2;
        return (
          <circle
            key={i}
            cx={cx + (rRim - 1.8) * Math.cos(a)}
            cy={cy + (rRim - 1.8) * Math.sin(a)}
            r={1.5}
            fill={C.brassSoft}
          />
        );
      })}
      {/* value sweep arc */}
      <path
        d={`M ${ax1} ${ay1} A ${rArc} ${rArc} 0 ${large} 1 ${ax2} ${ay2}`}
        fill="none"
        stroke={C.brassSoft}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {/* glass glare */}
      <ellipse
        cx={cx - rGlass * 0.28}
        cy={cy - rGlass * 0.34}
        rx={rGlass * 0.42}
        ry={rGlass * 0.24}
        fill="#ffffff"
        opacity={0.35}
      />
      <text
        x={cx}
        y={cy - (label ? 1 : -6)}
        textAnchor="middle"
        style={mono}
        fontSize={size > 110 ? 27 : size > 80 ? 21 : 16}
        fill={C.hull}
        fontWeight={700}
      >
        {value}
      </text>
      {label && (
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          style={mono}
          fontSize={7.5}
          fill={C.azure}
          letterSpacing={1.8}
          fontWeight={700}
        >
          {label}
        </text>
      )}
    </svg>
  );
}

// A horizon/altimeter bar — a rising trend drawn as an airship climb ribbon.
function ClimbRibbon({ spark, height = 26 }: { spark: number[]; height?: number }) {
  const max = Math.max(...spark);
  const min = Math.min(...spark);
  const span = max - min || 1;
  const w = 100;
  const pts = spark
    .map((v, i) => {
      const x = (i / (spark.length - 1)) * w;
      const y = height - ((v - min) / span) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const lastX = w;
  const lastY = height - ((spark[spark.length - 1]! - min) / span) * (height - 4) - 2;
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline points={`0,${height} ${pts} ${w},${height}`} fill={`${C.azure}18`} stroke="none" />
      <polyline
        points={pts}
        fill="none"
        stroke={C.azure}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r={2.4} fill={C.brass} />
    </svg>
  );
}

function Kicker({ children, tone = "brass" }: { children: ReactNode; tone?: "brass" | "muted" }) {
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-[0.26em]"
      style={{ ...mono, color: tone === "brass" ? C.brass : C.muted }}
    >
      {children}
    </span>
  );
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; color: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, color: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Hourglass, color: C.amber };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, color: C.brass };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.red };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, color } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em]"
      style={{
        ...sans,
        color,
        background: `${color}15`,
        border: `1.5px solid ${color}`,
        borderRadius: 999,
      }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

// Brass primary — a riveted boarding button.
function BrassButton({
  children,
  onClick,
  className,
  ariaLabel,
  ariaPressed,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
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
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-[12.5px] font-bold uppercase tracking-[0.06em] transition-all duration-150 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: C.card,
        background: hot
          ? `linear-gradient(180deg, ${C.brassSoft}, ${C.brass})`
          : `linear-gradient(180deg, ${C.brass}, ${C.brassDeep})`,
        border: `1.5px solid ${C.brassDeep}`,
        borderRadius: 999,
        transform: hot ? "translateY(-1px)" : "none",
        boxShadow: hot ? `0 5px 14px ${C.brass}55` : `0 2px 8px ${C.brass}33`,
      }}
    >
      {children}
    </button>
  );
}

// Outlined secondary — hull frame on sky, inverts to hull fill.
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
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 text-[12px] font-bold uppercase tracking-[0.05em] transition-colors duration-150 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: on ? C.card : C.hull,
        background: on ? C.hull : "transparent",
        border: `1.5px solid ${C.hull}`,
        borderRadius: 999,
      }}
    >
      {children}
    </button>
  );
}

// A soft panel — the airship gondola cabin card.
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
        position: "relative",
        background: C.card,
        border: `1.5px solid ${C.line}`,
        borderRadius: 14,
        boxShadow: "0 1px 2px rgba(24,37,48,0.04)",
        ...style,
      }}
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
    <div className="mb-7">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-7 items-center gap-1.5 px-2.5 text-[11px] font-bold tabular-nums"
          style={{
            ...mono,
            color: C.card,
            background: C.hull,
            borderRadius: 999,
            letterSpacing: "0.06em",
          }}
          aria-hidden="true"
        >
          <Plane size={12} strokeWidth={2.4} />
          {SCREEN_INDEX[screenKey]}
        </span>
        <span
          className="text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{ ...mono, color: C.azure }}
        >
          {SCREEN_STOP[screenKey]}
        </span>
        <div className="h-px flex-1" style={{ background: C.line }} aria-hidden="true" />
      </div>
      <h1
        className="mt-3 text-[34px] font-normal uppercase leading-none tracking-[0.01em] sm:text-[46px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed"
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
      {/* Hero — the flight-deck greeting with the porthole "best match" gauge. */}
      <div
        className="mb-8 overflow-hidden"
        style={{
          borderRadius: 18,
          border: `1.5px solid ${C.line}`,
          background: `linear-gradient(160deg, ${C.sky} 0%, ${C.skySoft} 42%, ${C.peachSoft} 100%)`,
        }}
      >
        <div className="flex items-center justify-between px-5 py-2" style={{ background: C.hull }}>
          <span
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em]"
            style={{ ...mono, color: C.brassSoft }}
          >
            <Compass size={13} strokeWidth={2.2} aria-hidden="true" />
            Aan boord · koers goed
          </span>
          <span
            className="hidden text-[10px] font-bold uppercase tracking-[0.2em] sm:inline"
            style={{ ...mono, color: C.faint }}
          >
            Vlucht 0714 · Utrecht
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-6 p-6 sm:p-8">
          <div className="min-w-0">
            <div className="mb-3">
              <Kicker>
                {PROFIEL.plaats} · {PROFIEL.rol}
              </Kicker>
            </div>
            <h1
              className="text-[42px] font-normal uppercase leading-[0.9] tracking-[0.01em] sm:text-[56px]"
              style={{ ...display, color: C.ink }}
            >
              Goedemorgen,
              <br />
              {voornaam}.
            </h1>
            <p
              className="mt-4 max-w-md text-[13.5px] leading-relaxed"
              style={{ ...sans, color: C.fg }}
            >
              De lucht is helder en je koers ligt vast. We tonen alleen wat telt en wat nu jouw
              aandacht vraagt — rustig aan het roer, nooit druk.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div
                className="inline-flex items-center gap-2.5 px-3 py-2"
                style={{
                  border: `1.5px solid ${C.brass}`,
                  borderRadius: 999,
                  background: `${C.brass}12`,
                }}
              >
                <ShieldCheck
                  size={15}
                  strokeWidth={2.2}
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                <span className="text-[12px] font-bold" style={{ ...sans, color: C.ink }}>
                  {PROFIEL.trust}
                </span>
              </div>
              <div className="hidden w-28 sm:block">
                <ClimbRibbon spark={KPIS[0]!.spark} />
              </div>
            </div>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group flex flex-col items-center rounded-2xl p-2 transition-transform hover:-translate-y-0.5 ${RING}`}
            aria-label={`Open beste match: ${top.titel}`}
          >
            <Porthole value={top.match} size={150} label="BESTE MATCH" />
            <span
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.azure }}
            >
              <Navigation
                size={11}
                strokeWidth={2.6}
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
              Zet koers
            </span>
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.muted }}
              >
                {k.label}
              </span>
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ ...mono, color: k.up ? C.green : C.brass }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2.5 text-[25px] font-normal tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <ClimbRibbon spark={k.spark} height={20} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Beste koersen</Kicker>
          </div>
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o)}
                className={`group block w-full rounded-2xl text-left ${RING}`}
              >
                <Panel
                  className="flex items-center gap-4 p-4 transition-colors group-hover:border-[color:var(--acc)]"
                  style={{ ["--acc" as string]: C.brass }}
                >
                  <Porthole value={o.match} size={72} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[10px] font-bold uppercase tracking-[0.16em]"
                      style={{ ...mono, color: C.muted }}
                    >
                      {o.id}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[16px] font-bold leading-tight"
                      style={{ ...sans, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div className="mt-0.5 text-[12.5px]" style={{ ...sans, color: C.fgSoft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    className="shrink-0 transition-transform group-hover:translate-x-1"
                    style={{ color: C.brass }}
                    aria-hidden="true"
                  />
                </Panel>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3">
            <Kicker tone="muted">Aan het roer</Kicker>
          </div>
          <div className="space-y-3">
            {ACTIES.map((a, i) => {
              const warn = a.urgentie === "warning";
              return (
                <Panel key={a.titel} className="p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center text-[10px] font-bold tabular-nums"
                      style={{
                        ...mono,
                        color: C.card,
                        background: warn ? C.brass : C.hull,
                        borderRadius: 999,
                      }}
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div
                        className="text-[13px] font-bold leading-snug"
                        style={{ ...sans, color: C.ink }}
                      >
                        {a.titel}
                      </div>
                      <div
                        className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.03em]"
                        style={{ ...sans, color: warn ? C.brass : C.azure }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>
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
        sub="Elke opdracht een bestemming op de kaart — mét de redenen waarom de koers past of schuurt."
      />

      <Panel className="mb-6 flex items-center gap-3 px-4 py-3">
        <Search size={16} className="shrink-0" style={{ color: C.brass }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-50"
          style={{ ...sans, color: C.ink }}
        />
        <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
          {String(filtered.length).padStart(2, "0")}/{String(OPDRACHTEN.length).padStart(2, "0")}
        </span>
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em] ${RING}`}
            style={{ ...sans, color: C.brass }}
          >
            Wis
          </button>
        )}
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Compass size={30} strokeWidth={1.6} style={{ color: C.brass }} aria-hidden="true" />
          <h3
            className="text-[24px] font-normal uppercase tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Geen bestemming
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Geen koers voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="mt-1">
            <LineButton onClick={() => setQuery("")}>Filter wissen</LineButton>
          </div>
        </Panel>
      ) : (
        <div className="space-y-4">
          {filtered.map((o, idx) => {
            const isSaved = saved.has(o.id);
            return (
              <div key={o.id} className="flex items-stretch gap-2">
                {/* left route rail with stop index */}
                <div
                  className="hidden flex-col items-center justify-between py-4 sm:flex"
                  style={{ width: 34, background: C.hull, borderRadius: 999 }}
                  aria-hidden="true"
                >
                  <Anchor size={13} strokeWidth={2.2} style={{ color: C.brassSoft }} />
                  <span
                    className="text-[10px] font-bold tabular-nums"
                    style={{ ...mono, color: C.sky }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <Navigation size={13} strokeWidth={2.2} style={{ color: C.brassSoft }} />
                </div>
                <Panel
                  className="flex-1 p-5 transition-colors hover:border-[color:var(--acc)]"
                  style={{ ["--acc" as string]: C.brass }}
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <Porthole value={o.match} size={92} label="MATCH" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1">
                        <Kicker>{o.id}</Kicker>
                      </div>
                      <h3
                        className="text-[19px] font-bold leading-tight"
                        style={{ ...sans, color: C.ink }}
                      >
                        {o.titel}
                      </h3>
                      <div className="mt-0.5 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
                        {o.opdrachtgever}
                      </div>
                      <dl
                        className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12px]"
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
                              style={{ color: C.azure }}
                              aria-hidden="true"
                            />
                            {m.v}
                          </div>
                        ))}
                      </dl>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2.5 py-0.5 text-[11px] font-bold"
                            style={{
                              ...sans,
                              color: C.azure,
                              border: `1.5px solid ${C.azure}44`,
                              background: `${C.azure}10`,
                              borderRadius: 999,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <button
                        onClick={() => toggleSave(o.id)}
                        aria-pressed={isSaved}
                        aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                        className={`flex h-9 w-9 items-center justify-center transition-colors ${RING}`}
                        style={{
                          color: isSaved ? C.card : C.hull,
                          background: isSaved ? C.hull : "transparent",
                          border: `1.5px solid ${C.hull}`,
                          borderRadius: 999,
                        }}
                      >
                        {isSaved ? (
                          <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                        ) : (
                          <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
                        )}
                      </button>
                      <BrassButton onClick={() => onOpen(o)}>
                        Bekijk
                        <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                      </BrassButton>
                    </div>
                  </div>
                </Panel>
              </div>
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
      <div className="mb-5">
        <LineButton onClick={onBack} ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
          Terug
        </LineButton>
      </div>

      <div
        className="mb-6 overflow-hidden"
        style={{
          borderRadius: 18,
          border: `1.5px solid ${C.line}`,
          background: `linear-gradient(160deg, ${C.sky} 0%, ${C.skySoft} 55%, ${C.peachSoft} 100%)`,
        }}
      >
        <div className="flex items-center justify-between px-5 py-2" style={{ background: C.hull }}>
          <span
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em]"
            style={{ ...mono, color: C.brassSoft }}
          >
            <Plane size={12} strokeWidth={2.2} aria-hidden="true" />
            {SCREEN_STOP.opdracht}
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ ...mono, color: C.faint }}
          >
            {opdracht.id}
          </span>
        </div>
        <div className="p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="mb-2">
                <Kicker>Instapkaart</Kicker>
              </div>
              <h2
                className="text-[32px] font-normal uppercase leading-[1] tracking-[0.01em] sm:text-[44px]"
                style={{ ...display, color: C.ink }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-2 text-[14px]" style={{ ...sans, color: C.fg }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Porthole value={opdracht.match} size={118} label="MATCH" />
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

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
              { Icon: Clock, label: "Inzet", value: opdracht.uren },
              { Icon: Calendar, label: "Start", value: opdracht.start },
              { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
            ].map((m) => (
              <div
                key={m.label}
                className="p-3"
                style={{ background: C.card, border: `1.5px solid ${C.line}`, borderRadius: 12 }}
              >
                <m.Icon size={15} strokeWidth={2} style={{ color: C.brass }} aria-hidden="true" />
                <div
                  className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.muted }}
                >
                  {m.label}
                </div>
                <div className="mt-0.5 text-[14px] font-bold" style={{ ...sans, color: C.ink }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.green, borderRadius: 999 }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={3} style={{ color: C.card }} />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.04em]"
              style={{ ...sans, color: C.ink }}
            >
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...sans, color: C.fg }}
              >
                <Check
                  size={15}
                  strokeWidth={2.8}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.brass, borderRadius: 999 }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={3} style={{ color: C.card }} />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.04em]"
              style={{ ...sans, color: C.ink }}
            >
              Even op letten
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...sans, color: C.fg }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.brass }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <BrassButton
          onClick={() => setApplied((v) => !v)}
          ariaPressed={applied}
          className="px-6 py-3 text-[13px]"
        >
          {applied ? (
            <Check size={16} strokeWidth={2.8} aria-hidden="true" />
          ) : (
            <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
          )}
          {applied ? "Aan boord — reactie verstuurd" : "Ga aan boord"}
        </BrassButton>
        {applied && (
          <span className="text-[12.5px]" style={{ ...sans, color: C.fgSoft }}>
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
        title="Douane"
        sub="Elk certificaat gestempeld en gecontroleerd — status met label én icoon, nooit op kleur alleen."
      />

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, color } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 px-3.5 py-3"
              style={{ background: `${color}12`, border: `1.5px solid ${color}`, borderRadius: 12 }}
            >
              <Icon size={16} strokeWidth={2.4} style={{ color }} aria-hidden="true" />
              <span className="text-[12px] font-bold" style={{ ...sans, color: C.ink }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Panel className="mb-6 flex items-start gap-4 p-5">
        <ShieldCheck
          size={24}
          strokeWidth={2.2}
          style={{ color: C.green }}
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        />
        <div>
          <div className="text-[15px] font-bold" style={{ ...sans, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-1 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Certificaten</Kicker>
          </div>
          <div className="space-y-3">
            {CREDENTIALS.map((c) => {
              const done = checked.has(c.naam);
              return (
                <Panel key={c.naam} className="flex items-center gap-4 p-4">
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${C.hull}`,
                      background: done ? C.hull : "transparent",
                      color: C.card,
                      borderRadius: 999,
                    }}
                  >
                    {done && <Check size={13} strokeWidth={2.8} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold" style={{ ...sans, color: C.ink }}>
                      {c.naam}
                    </div>
                    <div className="text-[12px]" style={{ ...sans, color: C.muted }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusPill status={c.status} />
                </Panel>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Kicker tone="muted">Bagage</Kicker>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-7 w-7 items-center justify-center ${RING}`}
              style={{ color: C.hull, border: `1.5px solid ${C.hull}`, borderRadius: 999 }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={13} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-4 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.04em] transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? C.card : C.hull,
                  background: feedState === s ? C.hull : "transparent",
                  border: `1.5px solid ${C.hull}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <div className="space-y-3" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Panel key={i} className="p-4">
                  <div
                    className="h-3 w-2/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </Panel>
              ))}
            </div>
          )}

          {feedState === "error" && (
            <Panel
              className="flex flex-col items-center gap-2 px-4 py-10 text-center"
              style={{ borderColor: C.red }}
            >
              <XCircle size={26} strokeWidth={2} style={{ color: C.red }} aria-hidden="true" />
              <div
                className="text-[18px] font-normal uppercase"
                style={{ ...display, color: C.ink }}
              >
                Radiostilte
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.fgSoft }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <BrassButton onClick={() => setFeedState("ok")}>Opnieuw proberen</BrassButton>
              </div>
            </Panel>
          )}

          {feedState === "ok" && (
            <div className="space-y-3">
              {DOCUMENTEN.map((d) => (
                <Panel key={d.naam} className="flex items-center gap-3 p-3.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{ ...mono, color: C.card, background: C.hull, borderRadius: 8 }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12.5px] font-bold"
                      style={{ ...sans, color: C.ink }}
                    >
                      {d.naam}
                    </div>
                    <div className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
                      {d.grootte} · {d.bijgewerkt}
                    </div>
                  </div>
                  <StatusPill status={d.status} />
                </Panel>
              ))}
            </div>
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
        title="Vluchtplan"
        sub="Wat vandaag op de route staat — punt voor punt afgevinkt."
      />

      {openCount === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Check size={30} strokeWidth={2.4} style={{ color: C.green }} aria-hidden="true" />
          <h3
            className="text-[24px] font-normal uppercase tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Route voltooid
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Niets meer te doen vandaag. Veilig aan de grond.
          </p>
        </Panel>
      ) : (
        <>
          <div className="mb-6 flex items-baseline gap-3">
            <span
              className="text-[40px] font-normal tabular-nums leading-none"
              style={{ ...display, color: C.brass }}
            >
              {String(openCount).padStart(2, "0")}
            </span>
            <span
              className="text-[12px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.muted }}
            >
              {openCount === 1 ? "punt op de route" : "punten op de route"}
            </span>
          </div>

          <div className="space-y-3">
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <Panel key={a.titel} className="flex items-start gap-4 p-5">
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${C.hull}`,
                      background: isDone ? C.hull : "transparent",
                      color: C.card,
                      borderRadius: 999,
                    }}
                  >
                    {isDone && <Check size={13} strokeWidth={2.8} aria-hidden="true" />}
                  </button>
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[10px] font-bold tabular-nums"
                    style={{
                      ...mono,
                      color: isDone ? C.faint : C.card,
                      background: isDone ? "transparent" : warn ? C.brass : C.hull,
                      border: isDone ? `1.5px solid ${C.line}` : "none",
                      borderRadius: 999,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[15px] font-bold leading-snug"
                      style={{
                        ...sans,
                        color: C.ink,
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
                        className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.03em]"
                        style={{ ...sans, color: warn ? C.brass : C.azure }}
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
  const statusColor = (status: string): string =>
    status === "Openstaand" ? C.brass : status === "Concept" ? C.muted : C.green;
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Vrachtbrief"
        sub="Overzichtelijk en zonder gedoe — je weet altijd waar je aan toe bent."
      />

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", color: C.green },
          { label: "Openstaand", value: "€ 1.350", color: C.brass },
          { label: "Concept", value: "€ 880", color: C.hull },
        ].map((s) => (
          <Panel key={s.label} className="p-5">
            <div
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.muted }}
            >
              {s.label}
            </div>
            <div
              className="mt-2 text-[26px] font-normal tabular-nums"
              style={{ ...display, color: s.color }}
            >
              {s.value}
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.hull}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ ...mono, color: C.muted, textAlign: i >= 3 ? "right" : "left" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => (
                <tr
                  key={f.nr}
                  className="transition-colors"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.cardSoft)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td
                    className="px-4 py-4 text-[12.5px] font-bold tabular-nums"
                    style={{ ...mono, color: C.azure }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-4 text-[13px]" style={{ ...sans, color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-4 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-4 py-4 text-right text-[13px] font-bold tabular-nums"
                    style={{ ...sans, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.04em]"
                      style={{ ...sans, color: statusColor(f.status) }}
                    >
                      <span
                        className="h-2 w-2"
                        style={{ background: statusColor(f.status), borderRadius: 999 }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: `1.5px solid ${C.hull}` }}>
                <td
                  className="px-4 py-4 text-[11px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.muted }}
                  colSpan={3}
                >
                  Totaal
                </td>
                <td
                  className="px-4 py-4 text-right text-[15px] font-normal tabular-nums"
                  style={{ ...display, color: C.ink }}
                >
                  € 7.782
                </td>
                <td className="px-4 py-4" />
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept309() {
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
      style={{
        ...sans,
        color: C.fg,
        background: `linear-gradient(180deg, ${C.sky} 0%, ${C.skySoft} 60%, ${C.peachSoft} 100%)`,
      }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center"
              style={{ background: C.hull, borderRadius: 999, border: `2px solid ${C.brass}` }}
              aria-hidden="true"
            >
              <Gauge size={20} strokeWidth={2.2} style={{ color: C.brassSoft }} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[20px] font-normal uppercase tracking-[0.02em]"
                style={{ ...display, color: C.ink }}
              >
                Zeppelin
              </div>
              <div
                className="text-[9px] font-bold uppercase tracking-[0.28em]"
                style={{ ...mono, color: C.brass }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-bold" style={{ ...sans, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...sans, color: C.fgSoft }}
              >
                <ShieldCheck
                  size={12}
                  strokeWidth={2}
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-10 w-10 items-center justify-center text-[12px] font-bold"
              style={{
                ...sans,
                color: C.card,
                background: C.hull,
                borderRadius: 999,
                border: `1.5px solid ${C.brass}`,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        {/* Route nav — a boarding-route rail with dashed leg between stops. */}
        <nav className="mb-8 overflow-x-auto" aria-label="Hoofdnavigatie">
          <div
            className="flex items-stretch gap-1 p-1.5"
            style={{ background: C.hull, borderRadius: 999, border: `1.5px solid ${C.hullSoft}` }}
          >
            {SCREENS.map((s, i) => {
              const on = s.key === screen;
              return (
                <div key={s.key} className="flex items-center">
                  <button
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className={`inline-flex shrink-0 items-center gap-2 px-3.5 py-2 text-[12px] font-bold uppercase tracking-[0.04em] transition-colors ${RING}`}
                    style={{
                      ...sans,
                      color: on ? C.hull : C.sky,
                      background: on ? C.card : "transparent",
                      borderRadius: 999,
                    }}
                  >
                    <span
                      className="text-[9px] font-bold tabular-nums"
                      style={{ ...mono, color: on ? C.brass : C.faint }}
                    >
                      {SCREEN_INDEX[s.key]}
                    </span>
                    {s.label}
                  </button>
                  {i < SCREENS.length - 1 && (
                    <span
                      className="mx-0.5 hidden h-px w-4 sm:block"
                      style={{
                        background: `repeating-linear-gradient(90deg, ${C.brassSoft} 0 3px, transparent 3px 6px)`,
                      }}
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>
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

        <div className="mt-9 h-px w-full" style={{ background: C.line }} aria-hidden="true" />
        <footer
          className="flex flex-wrap items-center justify-between gap-2 pt-4 text-[10.5px]"
          style={{ ...mono, color: C.muted }}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2 w-2"
              style={{ background: C.brass, borderRadius: 999 }}
              aria-hidden="true"
            />
            {SCREENS.length} schermen · zeppelin v309
          </span>
          <span className="uppercase tracking-[0.14em]">Portholes · messing · koers</span>
        </footer>
      </div>
    </div>
  );
}
