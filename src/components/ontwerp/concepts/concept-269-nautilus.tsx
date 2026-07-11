"use client";

// Concept 269 — "Nautilus" · Fibonacci-spiraal, phyllotaxis & de gulden snede (light).
// Signature: natuurlijke wiskunde als designtaal. Een gouden-spiraal/nautilus-motief in SVG,
// phyllotaxis-puntpatronen (stippen verdeeld op de gulden hoek van 137,5°) als rustige
// datavisualisatie, en gulden-snede-verhoudingen in de layout (grote + kleine kolom in φ-ratio).
// Match-scores lopen als een spiraal-arc op. Sereen off-white met diep inkt-groen en één warm
// goud-accent. Rustig, elegant, natuurlijk-mathematisch — en overal leesbaar (WCAG AA).
// Fonts: Cormorant (serif-koppen) + Inter (body/labels).

import { useState, useMemo, type CSSProperties, type ReactNode } from "react";
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
  Shell,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
  Leaf,
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

// The golden ratio φ and the golden angle drive the whole system.
const PHI = 1.618033988749895;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 137.5° in radians

// Serene off-white with ink-green and a single warm gold accent.
const C = {
  bg: "#f5f4ef",
  bg2: "#efeee7",
  card: "#fbfaf6",
  cardSoft: "#f2f1ea",
  line: "rgba(30,36,32,0.14)",
  lineFaint: "rgba(30,36,32,0.08)",
  fg: "#1e2420",
  fgSoft: "#3a423c",
  muted: "#6b7169",
  faint: "#9aa096",
  gold: "#b8933c",
  goldDeep: "#8a6d24",
  goldSoft: "#f3ead2",
  green: "#2f5d3f",
  greenSoft: "#e2ece3",
  greenDeep: "#204029",
  amber: "#8a5a12",
  amberSoft: "#f2e8d2",
  red: "#9c3226",
  redSoft: "#f1ddd8",
  ink: "#1e2420",
};

const serif = { fontFamily: "var(--font-lab-cormorant)" };
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b8933c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f4ef]";

// ---- Natural-math motifs ----------------------------------------------------

// A logarithmic golden spiral traced as one continuous stroke — the nautilus shell.
function goldenSpiralPath(cx: number, cy: number, a: number, turns: number, steps = 240): string {
  // r = a · φ^(θ / (π/2)) — the shell grows by φ every quarter turn.
  const b = Math.log(PHI) / (Math.PI / 2);
  const maxT = turns * 2 * Math.PI;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * maxT;
    const r = a * Math.exp(b * t);
    const x = cx + r * Math.cos(t);
    const y = cy + r * Math.sin(t);
    d += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

// Decorative nautilus glyph: nested golden spiral + faint φ-chambers.
function NautilusGlyph({
  className,
  stroke = C.gold,
  size = 96,
}: {
  className?: string;
  stroke?: string;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d={goldenSpiralPath(cx, cy, 1.1, 3.15)}
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.9}
      />
      <path
        d={goldenSpiralPath(cx, cy, 1.1, 3.0)}
        stroke={C.green}
        strokeWidth={0.7}
        strokeLinecap="round"
        opacity={0.32}
        transform={`rotate(28 ${cx} ${cy})`}
      />
      <circle cx={cx} cy={cy} r={1.6} fill={stroke} />
    </svg>
  );
}

// Phyllotaxis dot field — n seeds placed on the golden angle, radius ∝ √i (a sunflower head).
function Phyllotaxis({
  count = 120,
  size = 120,
  dot = 1.5,
  tone = C.gold,
  toneAlt = C.green,
  spread = 5.1,
  className,
  style,
}: {
  count?: number;
  size?: number;
  dot?: number;
  tone?: string;
  toneAlt?: string;
  spread?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const seeds = useMemo(() => {
    const arr: { x: number; y: number; r: number; alt: boolean }[] = [];
    for (let i = 0; i < count; i++) {
      const theta = i * GOLDEN_ANGLE;
      const r = spread * Math.sqrt(i);
      arr.push({
        x: cx + r * Math.cos(theta),
        y: cy + r * Math.sin(theta),
        r: dot * (0.55 + (i / count) * 0.9),
        alt: i % PHI < 0.62,
      });
    }
    return arr;
  }, [count, cx, cy, spread, dot]);
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden="true"
    >
      {seeds.map((s, i) => (
        <circle
          key={i}
          cx={s.x.toFixed(2)}
          cy={s.y.toFixed(2)}
          r={s.r.toFixed(2)}
          fill={s.alt ? toneAlt : tone}
          opacity={0.18 + (i / count) * 0.55}
        />
      ))}
    </svg>
  );
}

// Match score as a golden-spiral arc: the higher the match, the further the shell winds.
function MatchSpiral({ value, size = 64 }: { value: number; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const turns = 0.35 + (value / 100) * 1.55; // more match → more windings
  const path = goldenSpiralPath(cx, cy, 1.0, turns, 160);
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} fill="none">
        <path
          d={goldenSpiralPath(cx, cy, 1.0, 1.9, 160)}
          stroke={C.lineFaint}
          strokeWidth={1.2}
          strokeLinecap="round"
        />
        <path d={path} stroke={C.gold} strokeWidth={1.8} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span
          className="text-[15px] font-semibold tabular-nums"
          style={{ ...sans, color: C.greenDeep }}
        >
          {value}
        </span>
        <span
          className="text-[7.5px] font-semibold uppercase tracking-[0.14em]"
          style={{ ...sans, color: C.muted }}
        >
          match
        </span>
      </span>
    </span>
  );
}

// A quiet sparkline drawn as a smooth curve with a φ-proportioned area fill.
function Sparkline({
  data,
  tone = C.gold,
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
    const y = 100 - ((v - min) / span) * 70 - 15;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,100 ${line} 100,100`;
  const [lastX, lastY] = pts[pts.length - 1] ?? [0, 0];
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <polygon points={area} fill={tone} opacity={0.1} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r={1.6} fill={C.card} stroke={tone} strokeWidth={1} />
    </svg>
  );
}

// ---- Shared primitives ------------------------------------------------------

function cardStyle(soft = false): CSSProperties {
  return {
    background: soft ? C.cardSoft : C.card,
    border: `1px solid ${C.line}`,
    borderRadius: 12,
    boxShadow: "0 1px 2px rgba(30,36,32,0.04)",
  };
}

function Panel({
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
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.green, bg: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.goldDeep, bg: C.goldSoft };
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
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ ...sans, color: fg, background: bg }}
    >
      <Icon size={11} strokeWidth={2} aria-hidden="true" />
      {label}
    </span>
  );
}

function SectionTitle({ Icon, children }: { Icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon size={16} strokeWidth={1.7} style={{ color: C.gold }} aria-hidden="true" />
      <h2 className="text-[15px] font-semibold tracking-tight" style={{ ...sans, color: C.fg }}>
        {children}
      </h2>
    </div>
  );
}

function ScreenHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <div
        className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]"
        style={{ ...sans, color: C.gold }}
      >
        <Leaf size={12} strokeWidth={2} aria-hidden="true" />
        {eyebrow}
      </div>
      <h1
        className="text-[34px] font-medium leading-[1.05] tracking-tight sm:text-[40px]"
        style={{ ...serif, color: C.fg }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2 max-w-xl text-[14px] leading-relaxed"
          style={{ ...sans, color: C.fgSoft }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div
            className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ ...sans, color: C.gold }}
          >
            <Sparkles size={12} strokeWidth={2} aria-hidden="true" />
            Overzicht · {PROFIEL.plaats}
          </div>
          <h1
            className="text-[34px] font-medium leading-none tracking-tight sm:text-[42px]"
            style={{ ...serif, color: C.fg }}
          >
            Dag, {voornaam}
          </h1>
          <p className="mt-2 text-[14px]" style={{ ...sans, color: C.muted }}>
            Je overzicht ontvouwt zich als een spiraal — één punt vraagt vandaag om aandacht.
          </p>
        </div>
        <div className="relative shrink-0">
          <Phyllotaxis count={140} size={104} className="opacity-90" />
          <NautilusGlyph className="absolute inset-0 m-auto" size={104} stroke={C.goldDeep} />
        </div>
      </div>

      {/* Golden-ratio grid: KPI's in a φ-proportioned row */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <Panel key={k.label} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...sans, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ ...sans, color: k.up ? C.green : C.amber }}
                >
                  <Trend size={11} strokeWidth={2} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-1.5 text-[26px] font-medium tabular-nums leading-none"
                style={{ ...serif, color: C.fg }}
              >
                {k.value}
              </div>
              <div className="mt-2">
                <Sparkline data={k.spark} />
              </div>
            </Panel>
          );
        })}
      </div>

      {/* φ-split: main column ≈ 1.618× the aside */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.618fr_1fr]">
        <div>
          <SectionTitle Icon={Shell}>Beste match</SectionTitle>
          <button
            onClick={onOpen}
            className={`group flex w-full items-start gap-4 p-5 text-left transition-transform hover:-translate-y-0.5 ${RING}`}
            style={cardStyle()}
          >
            <MatchSpiral value={top.match} size={72} />
            <div className="min-w-0 flex-1">
              <div
                className="text-[20px] font-medium leading-tight tracking-tight"
                style={{ ...serif, color: C.fg }}
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
                    className="rounded-full px-2.5 py-0.5 text-[11px]"
                    style={{ ...sans, color: C.fgSoft, background: C.bg2 }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <ArrowRight
              size={20}
              className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
              style={{ color: C.gold }}
              aria-hidden="true"
            />
          </button>

          <Panel soft className="mt-6 flex items-start gap-4 p-5">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{ background: C.greenSoft, color: C.green }}
              aria-hidden="true"
            >
              <ShieldCheck size={22} strokeWidth={1.7} />
            </span>
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[16px] font-medium" style={{ ...serif, color: C.fg }}>
                  {PROFIEL.trust}
                </span>
                <BadgeCheck
                  size={15}
                  strokeWidth={2}
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ ...sans, color: C.fgSoft }}>
                Je documenten zijn geverifieerd en groeien mee — opdrachtgevers zien meteen dat het
                klopt.
              </p>
            </div>
          </Panel>
        </div>

        <div>
          <SectionTitle Icon={ListTodo}>Volgende stappen</SectionTitle>
          <ul className="space-y-3">
            {ACTIES.map((a) => (
              <Panel key={a.titel} className="p-4">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: a.urgentie === "warning" ? C.amber : C.gold }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <div
                      className="text-[13px] font-semibold leading-snug"
                      style={{ ...sans, color: C.fg }}
                    >
                      {a.titel}
                    </div>
                    <div
                      className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium"
                      style={{ ...sans, color: C.goldDeep }}
                    >
                      {a.cta}
                      <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
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
        eyebrow="Marktplaats · gericht op jouw profiel"
        title="Opdrachten, natuurlijk gerangschikt"
        sub="We tonen eerlijk waarom een opdracht past — en waar de lijn afwijkt."
      />

      <div
        className="mb-5 flex items-center gap-2 rounded-full px-4 py-2.5"
        style={{ background: C.card, border: `1px solid ${C.line}` }}
      >
        <Search size={16} className="shrink-0" style={{ color: C.gold }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[14px] outline-none placeholder:opacity-60"
          style={{ ...sans, color: C.fg }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${RING}`}
            style={{ ...sans, color: C.goldDeep, background: C.goldSoft }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <NautilusGlyph size={80} stroke={C.faint} />
          <h3 className="text-[22px] font-medium" style={{ ...serif, color: C.fg }}>
            Geen spiraal gevonden
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm — de rangschikking
            ontvouwt zich zodra er een pad is.
          </p>
          <button
            onClick={() => setQuery("")}
            className={`mt-1 rounded-full px-5 py-2 text-[13px] font-semibold text-white ${RING}`}
            style={{ ...sans, background: C.green }}
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
                className="relative flex h-full flex-col overflow-hidden p-5 transition-transform hover:-translate-y-0.5"
              >
                <Phyllotaxis
                  count={54}
                  size={90}
                  spread={4.4}
                  className="pointer-events-none absolute -right-4 -top-4 opacity-40"
                />
                <div className="relative flex items-start justify-between gap-3">
                  <MatchSpiral value={o.match} size={60} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${RING}`}
                    style={{
                      background: isSaved ? C.goldSoft : "transparent",
                      color: isSaved ? C.goldDeep : C.muted,
                      border: `1px solid ${isSaved ? C.gold : C.line}`,
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
                  className="relative mt-3 text-[19px] font-medium leading-tight tracking-tight"
                  style={{ ...serif, color: C.fg }}
                >
                  {o.titel}
                </h3>
                <div className="relative mt-0.5 text-[13px]" style={{ ...sans, color: C.muted }}>
                  {o.opdrachtgever}
                </div>
                <dl
                  className="relative mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]"
                  style={{ ...sans, color: C.fgSoft }}
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
                  className={`group relative mt-4 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-semibold text-white transition-colors ${RING}`}
                  style={{ ...sans, background: C.green }}
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
        className={`mb-5 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold ${RING}`}
        style={{ ...sans, color: C.fgSoft, background: C.cardSoft, border: `1px solid ${C.line}` }}
      >
        <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
        Terug
      </button>

      <Panel className="relative overflow-hidden p-6">
        <Phyllotaxis
          count={90}
          size={150}
          className="pointer-events-none absolute -right-8 -top-8 opacity-30"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <MatchSpiral value={opdracht.match} size={78} />
            <div>
              <div
                className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ ...sans, color: C.gold }}
              >
                {opdracht.id}
              </div>
              <h2
                className="text-[28px] font-medium leading-tight tracking-tight"
                style={{ ...serif, color: C.fg }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[14px]" style={{ ...sans, color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <button
            onClick={() => toggleSave(opdracht.id)}
            aria-pressed={isSaved}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold ${RING}`}
            style={{
              ...sans,
              color: isSaved ? C.goldDeep : C.fgSoft,
              background: isSaved ? C.goldSoft : C.cardSoft,
              border: `1px solid ${isSaved ? C.gold : C.line}`,
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

        <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-lg p-3"
              style={{ background: C.cardSoft, border: `1px solid ${C.line}` }}
            >
              <m.Icon size={14} strokeWidth={1.8} style={{ color: C.gold }} aria-hidden="true" />
              <div
                className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ ...sans, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="text-[14px] font-semibold" style={{ ...sans, color: C.fg }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: C.greenSoft, color: C.green }}
              aria-hidden="true"
            >
              <Plus size={13} strokeWidth={2.4} />
            </span>
            <span
              className="text-[15px] font-medium tracking-tight"
              style={{ ...serif, color: C.fg }}
            >
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...sans, color: C.fgSoft }}
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
        <Panel className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: C.amberSoft, color: C.amber }}
              aria-hidden="true"
            >
              <Minus size={13} strokeWidth={2.4} />
            </span>
            <span
              className="text-[15px] font-medium tracking-tight"
              style={{ ...serif, color: C.fg }}
            >
              Even op letten
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...sans, color: C.fgSoft }}
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
        </Panel>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold text-white transition-colors ${RING}`}
          style={{ ...sans, background: applied ? C.green : C.goldDeep }}
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
        eyebrow="Verificatie · privé & versleuteld"
        title="Documenten, zorgvuldig gecontroleerd"
        sub="Alles wat je gevoelige papieren betreft houden we privé en met zorg bij."
      />

      <Panel soft className="mb-6 flex items-center gap-4 p-5">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          style={{ background: C.greenSoft, color: C.green }}
          aria-hidden="true"
        >
          <ShieldCheck size={24} strokeWidth={1.7} />
        </span>
        <div>
          <div className="text-[16px] font-medium" style={{ ...serif, color: C.fg }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.618fr_1fr]">
        <div className="space-y-2.5">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            return (
              <Panel key={c.naam} className="flex items-center gap-3 p-4">
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${RING}`}
                  style={{
                    border: `1.5px solid ${done ? C.gold : C.line}`,
                    background: done ? C.gold : "transparent",
                    color: "#fff",
                  }}
                >
                  {done && <Check size={15} strokeWidth={2.6} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ ...sans, color: C.fg }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...sans, color: C.muted }}>
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
              className="inline-flex items-center gap-2 text-[15px] font-medium tracking-tight"
              style={{ ...serif, color: C.fg }}
            >
              <FileText size={16} strokeWidth={1.7} style={{ color: C.gold }} aria-hidden="true" />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center rounded-full ${RING}`}
              style={{ background: C.cardSoft, color: C.gold, border: `1px solid ${C.line}` }}
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
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? "#fff" : C.muted,
                  background: feedState === s ? C.green : C.cardSoft,
                  border: `1px solid ${feedState === s ? C.green : C.line}`,
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
                  <div className="h-3 w-2/3 animate-pulse rounded" style={{ background: C.bg2 }} />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: C.bg2 }}
                  />
                </Panel>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Panel className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: C.redSoft, color: C.red }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={1.8} />
              </span>
              <div className="text-[16px] font-medium" style={{ ...serif, color: C.fg }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className={`mt-1 rounded-full px-4 py-2 text-[12px] font-semibold text-white ${RING}`}
                style={{ ...sans, background: C.green }}
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
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold"
                    style={{ ...sans, background: C.goldSoft, color: C.goldDeep }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12.5px] font-semibold"
                      style={{ ...sans, color: C.fg }}
                    >
                      {d.naam}
                    </div>
                    <div className="text-[11px] tabular-nums" style={{ ...sans, color: C.muted }}>
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
      <ScreenHead eyebrow="Acties · volgende beste stap" title="Wat vandaag om aandacht vraagt" />

      {openCount === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <NautilusGlyph size={84} stroke={C.green} />
          <h3 className="text-[24px] font-medium" style={{ ...serif, color: C.fg }}>
            Alles in balans
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Niets meer te doen vandaag. De spiraal is rond.
          </p>
        </Panel>
      ) : (
        <>
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-2"
            style={{ background: C.goldSoft, border: `1px solid ${C.gold}` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold tabular-nums text-white"
              style={{ ...sans, background: C.goldDeep }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ ...sans, color: C.goldDeep }}>
              {openCount} {openCount === 1 ? "punt" : "punten"} open
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
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${isDone ? C.green : C.line}`,
                      background: isDone ? C.green : "transparent",
                      color: "#fff",
                    }}
                  >
                    {isDone && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[16px] font-medium leading-snug tracking-tight"
                      style={{
                        ...serif,
                        color: C.fg,
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
                        style={{
                          ...sans,
                          color: a.urgentie === "warning" ? C.amber : C.goldDeep,
                          background: a.urgentie === "warning" ? C.amberSoft : C.goldSoft,
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
        : { fg: C.muted, bg: C.bg2 };
  return (
    <div>
      <ScreenHead
        eyebrow="Facturen · helder overzicht"
        title="Je facturen"
        sub="Overzichtelijk en zonder gedoe — zodat je weet waar je aan toe bent."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.618fr_1fr]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: "Betaald (mnd)", value: "€ 5.552", tone: C.green },
            { label: "Openstaand", value: "€ 1.350", tone: C.amber },
            { label: "Concept", value: "€ 880", tone: C.muted },
          ].map((s) => (
            <Panel key={s.label} className="p-4">
              <div
                className="text-[11px] font-medium uppercase tracking-[0.1em]"
                style={{ ...sans, color: C.muted }}
              >
                {s.label}
              </div>
              <div
                className="mt-1 text-[24px] font-medium tabular-nums"
                style={{ ...serif, color: s.tone }}
              >
                {s.value}
              </div>
            </Panel>
          ))}
        </div>
        <Panel className="flex flex-col justify-between p-4">
          <div
            className="text-[11px] font-medium uppercase tracking-[0.1em]"
            style={{ ...sans, color: C.muted }}
          >
            Bedrag per factuur
          </div>
          <Sparkline data={trend} tone={C.gold} height={48} />
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
                    className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
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
                    className="transition-colors hover:bg-[#f2f1ea]"
                    style={{ borderBottom: `1px solid ${C.lineFaint}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12.5px] font-semibold tabular-nums"
                      style={{ ...sans, color: C.goldDeep }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3 text-[13px]" style={{ ...sans, color: C.fg }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-3 text-[12.5px] tabular-nums"
                      style={{ ...sans, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3 text-[13px] font-semibold tabular-nums"
                      style={{ ...sans, color: C.fg }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{ ...sans, color: t.fg, background: t.bg }}
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

// ---- Shell ------------------------------------------------------------------

export function Concept269() {
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
      style={{ ...sans, color: C.fg, background: C.bg }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: C.goldSoft, border: `1px solid ${C.gold}` }}
              aria-hidden="true"
            >
              <NautilusGlyph size={34} stroke={C.goldDeep} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[22px] font-medium tracking-tight"
                style={{ ...serif, color: C.fg }}
              >
                Nautilus
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ ...sans, color: C.muted }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...sans, color: C.fg }}>
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
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-semibold"
              style={{
                ...sans,
                background: C.greenSoft,
                color: C.greenDeep,
                border: `1px solid ${C.green}`,
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
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: on ? "#fff" : C.fgSoft,
                  background: on ? C.green : C.card,
                  border: `1px solid ${on ? C.green : C.line}`,
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
          style={{ ...sans, borderColor: C.line, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Shell size={12} strokeWidth={1.8} style={{ color: C.gold }} aria-hidden="true" />
            Gulden snede · φ {PHI.toFixed(3)}
          </span>
          <span>Gebouwd naar de natuur</span>
        </footer>
      </div>
    </div>
  );
}
