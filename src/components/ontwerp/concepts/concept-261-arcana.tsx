"use client";

// Concept 261 — "Arcana" · Tarot & esoterisch-mystiek (dark).
// Signature: a deep aubergine / night canvas engraved with fine gold linework — celestial
// motifs (stars, a crescent moon, radiating sun-rays), double-ruled "arcana card" frames with
// Roman-numeral corners, and verification rendered as a wax-seal insignia. Opdrachten are drawn
// as tarot cards; the match score is a haloed sigil. Body text stays a calm high-contrast cream
// (AA on dark) — gold is reserved for headings, rules and accents, never long-form reading text.
// Fonts: Cormorant (serif display) + Jakarta (calm sans). Gold #c9a24b on night #17121f.

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
  Moon,
  Star,
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

// Night-and-gold palette. Cream body text keeps AA on the deep aubergine canvas.
const C = {
  bg: "#17121f",
  bg2: "#1d1727",
  card: "#221a2e",
  cardSoft: "#1c1626",
  gold: "#c9a24b",
  goldBright: "#e0bd6e",
  goldDeep: "#9a7c34",
  goldLine: "rgba(201,162,75,0.34)",
  goldFaint: "rgba(201,162,75,0.15)",
  fg: "#f0e9dc",
  fgSoft: "#cdc3b2",
  muted: "#918776",
  faint: "#63594a",
  green: "#86c08f",
  greenSoft: "rgba(134,192,143,0.14)",
  blue: "#9db6df",
  blueSoft: "rgba(157,182,223,0.14)",
  amber: "#e0ab55",
  amberSoft: "rgba(224,171,85,0.15)",
  red: "#dd8880",
  redSoft: "rgba(221,136,128,0.15)",
};

const serif = { fontFamily: "var(--font-lab-cormorant)" };
const sans = { fontFamily: "var(--font-lab-jakarta)" };

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII"];

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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0bd6e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#17121f]";

// Shared celestial defs: a faint radial star-glow used behind the hero sigils.
function ArcanaDefs() {
  return (
    <svg width={0} height={0} className="absolute" aria-hidden="true">
      <defs>
        <radialGradient id="a261-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.gold} stopOpacity={0.35} />
          <stop offset="60%" stopColor={C.gold} stopOpacity={0.08} />
          <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="a261-rule" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={C.gold} stopOpacity={0} />
          <stop offset="50%" stopColor={C.gold} stopOpacity={0.7} />
          <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
}

// A small four-point star drawn in gold linework.
function StarMark({ size = 12, tone = C.gold }: { size?: number; tone?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M12 1 L14 10 L23 12 L14 14 L12 23 L10 14 L1 12 L10 10 Z" fill={tone} opacity={0.9} />
    </svg>
  );
}

// A double-ruled gold rule with a centred star — the recurring section divider.
function OrnamentRule() {
  return (
    <div className="my-4 flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1" style={{ background: "url(#a261-rule)", opacity: 0.9 }} />
      <StarMark size={11} tone={C.gold} />
      <span className="h-px flex-1" style={{ background: "url(#a261-rule)", opacity: 0.9 }} />
    </div>
  );
}

function cardStyle(soft = false): CSSProperties {
  return {
    background: soft ? C.cardSoft : C.card,
    border: `1px solid ${C.goldLine}`,
    borderRadius: 8,
    boxShadow: "0 1px 0 rgba(201,162,75,0.05), inset 0 0 0 1px rgba(201,162,75,0.05)",
  };
}

// An arcana-card frame: outer border + inner double-rule and Roman-numeral corners.
function ArcanaCard({
  children,
  numeral,
  soft,
  className,
  style,
}: {
  children: ReactNode;
  numeral?: string;
  soft?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`relative ${className ?? ""}`} style={{ ...cardStyle(soft), ...style }}>
      {/* inner double rule */}
      <span
        className="pointer-events-none absolute inset-[6px] rounded-[5px]"
        style={{ border: `1px solid ${C.goldFaint}` }}
        aria-hidden="true"
      />
      {numeral && (
        <>
          <span
            className="pointer-events-none absolute left-2.5 top-1.5 text-[10px] font-semibold tracking-[0.1em]"
            style={{ ...serif, color: C.goldDeep }}
            aria-hidden="true"
          >
            {numeral}
          </span>
          <span
            className="pointer-events-none absolute bottom-1.5 right-2.5 rotate-180 text-[10px] font-semibold tracking-[0.1em]"
            style={{ ...serif, color: C.goldDeep }}
            aria-hidden="true"
          >
            {numeral}
          </span>
        </>
      )}
      {children}
    </div>
  );
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Bezegeld", Icon: BadgeCheck, fg: C.green, bg: C.greenSoft };
    case "SUBMITTED":
      return { label: "In de sterren gelezen", Icon: Clock, fg: C.blue, bg: C.blueSoft };
    case "EXPIRING":
      return { label: "Zegel vervaagt", Icon: TriangleAlert, fg: C.amber, bg: C.amberSoft };
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
      <Icon size={12} strokeWidth={1.8} aria-hidden="true" />
      {label}
    </span>
  );
}

// A wax-seal / insignia for the trust level — concentric gold rings + a star sigil.
function SealMark({ size = 52 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <circle cx={32} cy={32} r={30} fill={C.goldFaint} stroke={C.goldLine} strokeWidth={1} />
        <circle cx={32} cy={32} r={24} fill="none" stroke={C.gold} strokeWidth={1} opacity={0.7} />
        <circle
          cx={32}
          cy={32}
          r={21}
          fill="none"
          stroke={C.gold}
          strokeWidth={0.6}
          opacity={0.4}
        />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={32 + Math.cos(a) * 24}
              y1={32 + Math.sin(a) * 24}
              x2={32 + Math.cos(a) * 27}
              y2={32 + Math.sin(a) * 27}
              stroke={C.gold}
              strokeWidth={0.8}
              opacity={0.6}
            />
          );
        })}
      </svg>
      <ShieldCheck
        size={size * 0.4}
        strokeWidth={1.6}
        style={{ position: "absolute", color: C.goldBright }}
      />
    </span>
  );
}

// The match score rendered as a haloed celestial sigil.
function MatchSigil({ value, size = 60 }: { value: number; size?: number }) {
  const r = 25;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <circle cx={32} cy={32} r={30} fill="url(#a261-halo)" />
        <circle cx={32} cy={32} r={r} fill="none" stroke={C.goldFaint} strokeWidth={2} />
        <circle
          cx={32}
          cy={32}
          r={r}
          fill="none"
          stroke={C.gold}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span
          className="text-[17px] font-semibold tabular-nums"
          style={{ ...serif, color: C.goldBright }}
        >
          {value}
        </span>
        <span
          className="text-[7px] font-semibold uppercase tracking-[0.16em]"
          style={{ ...sans, color: C.muted }}
        >
          match
        </span>
      </span>
    </span>
  );
}

// A calm gold sparkline drawn under the KPI figures.
function SparkLine({ data, height = 32 }: { data: number[]; height?: number }) {
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
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <polygon points={area} fill={C.goldFaint} stroke="none" />
      <polyline
        points={line}
        fill="none"
        stroke={C.gold}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.2} fill={C.bg} stroke={C.gold} strokeWidth={0.8} />
      ))}
    </svg>
  );
}

// A decorative celestial glyph — crescent moon amid radiating rays and stars.
function CelestialGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={60 + Math.cos(a) * 20}
            y1={45 + Math.sin(a) * 20}
            x2={60 + Math.cos(a) * 30}
            y2={45 + Math.sin(a) * 30}
            stroke={C.gold}
            strokeWidth={0.8}
            opacity={0.5}
          />
        );
      })}
      <circle cx={60} cy={45} r={16} fill="none" stroke={C.gold} strokeWidth={1} opacity={0.9} />
      <path d="M64 33 A 16 16 0 1 0 64 57 A 12 12 0 1 1 64 33 Z" fill={C.gold} opacity={0.85} />
      <path
        d="M12 14 l1.6 5.4 5.4 1.6 -5.4 1.6 -1.6 5.4 -1.6 -5.4 -5.4 -1.6 5.4 -1.6 Z"
        fill={C.gold}
        opacity={0.7}
      />
      <path
        d="M104 66 l1.2 4 4 1.2 -4 1.2 -1.2 4 -1.2 -4 -4 -1.2 4 -1.2 Z"
        fill={C.gold}
        opacity={0.6}
      />
    </svg>
  );
}

function ScreenHead({ title, sub, code }: { title: string; sub?: string; code?: string }) {
  return (
    <div className="mb-6">
      {code && (
        <div
          className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.28em]"
          style={{ ...sans, color: C.gold }}
        >
          <StarMark size={9} />
          {code}
        </div>
      )}
      <h1
        className="text-[32px] font-semibold leading-none tracking-tight sm:text-[38px]"
        style={{ ...serif, color: C.fg }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2 max-w-xl text-[13.5px] leading-relaxed"
          style={{ ...sans, color: C.fgSoft }}
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
            className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.28em]"
            style={{ ...sans, color: C.gold }}
          >
            <Moon size={11} strokeWidth={1.8} aria-hidden="true" />
            Het grote arcanum · {PROFIEL.plaats}
          </div>
          <h1
            className="text-[34px] font-semibold leading-none tracking-tight sm:text-[42px]"
            style={{ ...serif, color: C.fg }}
          >
            Wees welkom, {voornaam}
          </h1>
          <p className="mt-2 text-[13.5px]" style={{ ...sans, color: C.fgSoft }}>
            De kaarten liggen gelegd. Eén ervan vraagt vandaag om je aandacht.
          </p>
        </div>
        <CelestialGlyph className="h-20 w-28 shrink-0" />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <ArcanaCard key={k.label} numeral={ROMAN[i]} className="p-4 pt-5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{ ...sans, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ ...sans, color: k.up ? C.green : C.amber }}
                >
                  <Trend size={11} strokeWidth={1.8} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-1 text-[28px] font-semibold tabular-nums leading-none"
                style={{ ...serif, color: C.fg }}
              >
                {k.value}
              </div>
              <div className="mt-2">
                <SparkLine data={k.spark} />
              </div>
            </ArcanaCard>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles size={16} strokeWidth={1.8} style={{ color: C.gold }} aria-hidden="true" />
            <h2
              className="text-[13px] font-semibold uppercase tracking-[0.18em]"
              style={{ ...sans, color: C.fgSoft }}
            >
              De getrokken kaart
            </h2>
          </div>
          <OrnamentRule />
          <button
            onClick={onOpen}
            className={`group flex w-full items-start gap-4 p-5 pt-6 text-left transition-transform hover:-translate-y-0.5 ${RING}`}
            style={cardStyle()}
          >
            <MatchSigil value={top.match} />
            <div className="min-w-0 flex-1">
              <div
                className="text-[19px] font-semibold leading-tight"
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
                    className="px-2.5 py-0.5 text-[11px]"
                    style={{
                      ...sans,
                      color: C.fgSoft,
                      border: `1px solid ${C.goldLine}`,
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
              style={{ color: C.gold }}
              aria-hidden="true"
            />
          </button>

          <ArcanaCard soft numeral={ROMAN[4]} className="mt-6 flex items-start gap-4 p-5 pt-6">
            <SealMark />
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[16px] font-semibold" style={{ ...serif, color: C.fg }}>
                  {PROFIEL.trust}
                </span>
                <BadgeCheck
                  size={15}
                  strokeWidth={1.8}
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ ...sans, color: C.fgSoft }}>
                Je papieren dragen een geldig zegel — opdrachtgevers zien in één oogopslag dat het
                klopt.
              </p>
            </div>
          </ArcanaCard>
        </div>

        <div>
          <div className="mb-1 flex items-center gap-2">
            <ListTodo size={16} strokeWidth={1.8} style={{ color: C.gold }} aria-hidden="true" />
            <h2
              className="text-[13px] font-semibold uppercase tracking-[0.18em]"
              style={{ ...sans, color: C.fgSoft }}
            >
              In de legging
            </h2>
          </div>
          <OrnamentRule />
          <ul className="space-y-2.5">
            {ACTIES.map((a) => (
              <ArcanaCard key={a.titel} className="p-3.5">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0" aria-hidden="true">
                    <StarMark size={12} tone={a.urgentie === "warning" ? C.amber : C.gold} />
                  </span>
                  <div className="min-w-0">
                    <div
                      className="text-[13px] font-semibold leading-snug"
                      style={{ ...sans, color: C.fg }}
                    >
                      {a.titel}
                    </div>
                    <div className="mt-0.5 text-[11.5px]" style={{ ...sans, color: C.gold }}>
                      {a.cta}
                    </div>
                  </div>
                </div>
              </ArcanaCard>
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
        code="Marktplaats · gelegd voor jou"
        title="De grote legging"
        sub="Elke opdracht is een kaart — we tonen eerlijk waarom zij past en waar de schaduw valt."
      />

      <div className="mb-6 flex items-center gap-2 px-4 py-2.5" style={cardStyle()}>
        <Search size={16} className="shrink-0" style={{ color: C.gold }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[13.5px] outline-none placeholder:opacity-60"
          style={{ ...sans, color: C.fg }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`px-2.5 py-1 text-[11px] font-semibold ${RING}`}
            style={{ ...sans, color: C.gold, background: C.goldFaint, borderRadius: 999 }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <ArcanaCard className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <CelestialGlyph className="h-20 w-28" />
          <h3 className="text-[22px] font-semibold" style={{ ...serif, color: C.fg }}>
            Geen kaart gelegd
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Geen legging voor &ldquo;{query}&rdquo;. Beproef een andere zoekterm — het deck is
            groot.
          </p>
          <button
            onClick={() => setQuery("")}
            className={`mt-1 px-5 py-2 text-[13px] font-semibold ${RING}`}
            style={{ ...sans, color: C.bg, background: C.gold, borderRadius: 999 }}
          >
            Filter wissen
          </button>
        </ArcanaCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, i) => {
            const isSaved = saved.has(o.id);
            return (
              <ArcanaCard
                key={o.id}
                numeral={ROMAN[i]}
                className="flex h-full flex-col p-5 pt-6 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <MatchSigil value={o.match} size={54} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-9 w-9 items-center justify-center transition-colors ${RING}`}
                    style={{
                      background: isSaved ? C.goldFaint : "transparent",
                      color: isSaved ? C.goldBright : C.muted,
                      border: `1px solid ${isSaved ? C.gold : C.goldLine}`,
                      borderRadius: 999,
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
                  className="mt-3 text-[18px] font-semibold leading-tight"
                  style={{ ...serif, color: C.fg }}
                >
                  {o.titel}
                </h3>
                <div className="mt-0.5 text-[12.5px]" style={{ ...sans, color: C.muted }}>
                  {o.opdrachtgever}
                </div>
                <dl
                  className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]"
                  style={{ ...sans, color: C.fgSoft }}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin
                      size={13}
                      strokeWidth={1.8}
                      style={{ color: C.gold }}
                      aria-hidden="true"
                    />
                    {o.plaats}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wallet
                      size={13}
                      strokeWidth={1.8}
                      style={{ color: C.gold }}
                      aria-hidden="true"
                    />
                    {o.tarief}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock
                      size={13}
                      strokeWidth={1.8}
                      style={{ color: C.gold }}
                      aria-hidden="true"
                    />
                    {o.uren}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar
                      size={13}
                      strokeWidth={1.8}
                      style={{ color: C.gold }}
                      aria-hidden="true"
                    />
                    {o.start}
                  </div>
                </dl>
                <button
                  onClick={() => onOpen(o)}
                  className={`group mt-4 inline-flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold transition-colors ${RING}`}
                  style={{ ...sans, color: C.bg, background: C.gold, borderRadius: 999 }}
                >
                  Draai deze kaart
                  <ArrowRight
                    size={14}
                    strokeWidth={1.8}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </button>
              </ArcanaCard>
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
          ...sans,
          color: C.fgSoft,
          background: C.cardSoft,
          border: `1px solid ${C.goldLine}`,
          borderRadius: 999,
        }}
      >
        <ArrowLeft size={14} strokeWidth={1.8} aria-hidden="true" />
        Terug naar de legging
      </button>

      <ArcanaCard numeral={opdracht.id.slice(-2)} className="p-6 pt-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <MatchSigil value={opdracht.match} size={70} />
            <div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.24em]"
                style={{ ...sans, color: C.gold }}
              >
                {opdracht.id}
              </div>
              <h2
                className="text-[26px] font-semibold leading-tight tracking-tight"
                style={{ ...serif, color: C.fg }}
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
              ...sans,
              color: isSaved ? C.goldBright : C.fgSoft,
              background: isSaved ? C.goldFaint : C.cardSoft,
              border: `1px solid ${isSaved ? C.gold : C.goldLine}`,
              borderRadius: 999,
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

        <OrnamentRule />

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m) => (
            <div
              key={m.label}
              className="p-3"
              style={{ background: C.cardSoft, border: `1px solid ${C.goldLine}`, borderRadius: 6 }}
            >
              <m.Icon size={14} strokeWidth={1.8} style={{ color: C.gold }} aria-hidden="true" />
              <div
                className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...sans, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="text-[13.5px] font-semibold" style={{ ...sans, color: C.fg }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </ArcanaCard>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <ArcanaCard className="p-5 pt-6">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{
                background: C.greenSoft,
                color: C.green,
                border: `1px solid ${C.green}`,
                borderRadius: 999,
              }}
              aria-hidden="true"
            >
              <Plus size={13} strokeWidth={2.2} />
            </span>
            <span
              className="text-[13px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...sans, color: C.fgSoft }}
            >
              Het licht
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
                  strokeWidth={2.2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </ArcanaCard>
        <ArcanaCard className="p-5 pt-6">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{
                background: C.amberSoft,
                color: C.amber,
                border: `1px solid ${C.amber}`,
                borderRadius: 999,
              }}
              aria-hidden="true"
            >
              <Minus size={13} strokeWidth={2.2} />
            </span>
            <span
              className="text-[13px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...sans, color: C.fgSoft }}
            >
              De schaduw
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
        </ArcanaCard>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className={`inline-flex items-center gap-2 px-6 py-3 text-[14px] font-semibold transition-colors ${RING}`}
          style={{
            ...sans,
            color: C.bg,
            background: applied ? C.green : C.gold,
            borderRadius: 999,
          }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.2} aria-hidden="true" />
          ) : (
            <Sparkles size={17} strokeWidth={1.8} aria-hidden="true" />
          )}
          {applied ? "Reactie verzonden" : "Reageer op deze kaart"}
        </button>
        {applied && (
          <span className="text-[12.5px]" style={{ ...sans, color: C.muted }}>
            De opdrachtgever antwoordt doorgaans binnen 6 uur.
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
        code="Verificatie · verzegeld & privé"
        title="De zegelkamer"
        sub="Je gevoelige papieren bewaren we versleuteld — en dragen pas een zegel na zorgvuldige toetsing."
      />

      <ArcanaCard soft numeral={ROMAN[0]} className="mb-6 flex items-center gap-4 p-5 pt-6">
        <SealMark size={56} />
        <div>
          <div className="text-[16px] font-semibold" style={{ ...serif, color: C.fg }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen met jouw toestemming gedeeld.
          </p>
        </div>
      </ArcanaCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c, i) => {
            const done = checked.has(c.naam);
            return (
              <ArcanaCard
                key={c.naam}
                numeral={ROMAN[i]}
                className="flex items-center gap-3 p-4 pt-5"
              >
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center transition-colors ${RING}`}
                  style={{
                    border: `1.5px solid ${done ? C.gold : C.goldLine}`,
                    background: done ? C.gold : "transparent",
                    color: C.bg,
                    borderRadius: 999,
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
              </ArcanaCard>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...sans, color: C.fgSoft }}
            >
              <FileText size={16} strokeWidth={1.8} style={{ color: C.gold }} aria-hidden="true" />
              De kluis
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center ${RING}`}
              style={{
                background: C.cardSoft,
                color: C.gold,
                border: `1px solid ${C.goldLine}`,
                borderRadius: 999,
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
                  ...sans,
                  color: feedState === s ? C.bg : C.muted,
                  background: feedState === s ? C.gold : C.cardSoft,
                  border: `1px solid ${feedState === s ? C.gold : C.goldLine}`,
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
                <ArcanaCard key={i} className="p-3.5">
                  <div
                    className="h-3 w-2/3 animate-pulse"
                    style={{ background: C.goldFaint, borderRadius: 3 }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse"
                    style={{ background: C.goldFaint, borderRadius: 3 }}
                  />
                </ArcanaCard>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <ArcanaCard className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center"
                style={{
                  background: C.redSoft,
                  color: C.red,
                  border: `1px solid ${C.red}`,
                  borderRadius: 999,
                }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={1.8} />
              </span>
              <div className="text-[16px] font-semibold" style={{ ...serif, color: C.fg }}>
                De kluis bleef gesloten
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.muted }}>
                We konden je documenten niet lezen. Beproef het zo opnieuw.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className={`mt-1 px-4 py-2 text-[12px] font-semibold ${RING}`}
                style={{ ...sans, color: C.bg, background: C.gold, borderRadius: 999 }}
              >
                Opnieuw proberen
              </button>
            </ArcanaCard>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <ArcanaCard key={d.naam} className="flex items-center gap-3 p-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{
                      ...sans,
                      background: C.cardSoft,
                      color: C.gold,
                      border: `1px solid ${C.goldLine}`,
                      borderRadius: 6,
                    }}
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
                </ArcanaCard>
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
      <ScreenHead code="Acties · de wenken" title="Wat de sterren je vragen" />

      {openCount === 0 ? (
        <ArcanaCard className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <CelestialGlyph className="h-20 w-28" />
          <h3 className="text-[24px] font-semibold" style={{ ...serif, color: C.fg }}>
            De hemel is helder
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Niets vraagt nu om je aandacht. Rust een tel — de kaarten wachten.
          </p>
        </ArcanaCard>
      ) : (
        <>
          <div
            className="mb-5 inline-flex items-center gap-2 px-3.5 py-2"
            style={{
              background: C.goldFaint,
              border: `1px solid ${C.goldLine}`,
              borderRadius: 999,
            }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center text-[12px] font-semibold tabular-nums"
              style={{ ...serif, background: C.gold, color: C.bg, borderRadius: 999 }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ ...sans, color: C.gold }}>
              {openCount} {openCount === 1 ? "wenk" : "wenken"} in de legging
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              return (
                <ArcanaCard
                  key={a.titel}
                  numeral={ROMAN[i]}
                  className="flex items-start gap-4 p-5 pt-6"
                >
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${isDone ? C.green : C.goldLine}`,
                      background: isDone ? C.green : "transparent",
                      color: C.bg,
                      borderRadius: 999,
                    }}
                  >
                    {isDone && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[16px] font-semibold leading-snug"
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
                        className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold"
                        style={{
                          ...sans,
                          color: a.urgentie === "warning" ? C.amber : C.gold,
                          background: a.urgentie === "warning" ? C.amberSoft : C.goldFaint,
                          border: `1px solid ${a.urgentie === "warning" ? C.amber : C.goldLine}`,
                          borderRadius: 999,
                        }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={1.8} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </ArcanaCard>
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
        : { fg: C.muted, bg: C.cardSoft };
  return (
    <div>
      <ScreenHead
        code="Facturen · het grootboek"
        title="Je grootboek"
        sub="Helder en zonder ruis — zo weet je precies waar je staat."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-2">
          {[
            { label: "Betaald (mnd)", value: "€ 5.552", tone: C.green },
            { label: "Openstaand", value: "€ 1.350", tone: C.amber },
            { label: "Concept", value: "€ 880", tone: C.muted },
          ].map((s, i) => (
            <ArcanaCard key={s.label} numeral={ROMAN[i]} className="p-4 pt-5">
              <div
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ ...sans, color: C.muted }}
              >
                {s.label}
              </div>
              <div
                className="mt-1 text-[24px] font-semibold tabular-nums"
                style={{ ...serif, color: s.tone }}
              >
                {s.value}
              </div>
            </ArcanaCard>
          ))}
        </div>
        <ArcanaCard className="flex flex-col justify-between p-4 pt-5">
          <div
            className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
            style={{ ...sans, color: C.muted }}
          >
            Bedrag per factuur
          </div>
          <SparkLine data={trend} height={46} />
        </ArcanaCard>
      </div>

      <ArcanaCard className="overflow-hidden p-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.goldLine}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
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
                    className="transition-colors hover:bg-[#1c1626]"
                    style={{ borderBottom: `1px solid ${C.goldFaint}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12.5px] font-semibold tabular-nums"
                      style={{ ...sans, color: C.gold }}
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
                      className="px-3 py-3 text-[14px] font-semibold tabular-nums"
                      style={{ ...serif, color: C.fg }}
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
      </ArcanaCard>
    </div>
  );
}

// ---- Shell -----------------------------------------------------------------

export function Concept261() {
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
      <ArcanaDefs />
      <div
        className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20% 18%, rgba(201,162,75,0.5) 0, transparent 100%), radial-gradient(1px 1px at 72% 8%, rgba(201,162,75,0.35) 0, transparent 100%), radial-gradient(1px 1px at 88% 60%, rgba(201,162,75,0.3) 0, transparent 100%), radial-gradient(1px 1px at 42% 84%, rgba(201,162,75,0.28) 0, transparent 100%)",
        }}
      >
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="relative flex h-11 w-11 items-center justify-center"
              style={{ background: C.card, border: `1px solid ${C.gold}`, borderRadius: 8 }}
              aria-hidden="true"
            >
              <Moon size={19} strokeWidth={1.6} style={{ color: C.goldBright }} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[22px] font-semibold tracking-tight"
                style={{ ...serif, color: C.fg }}
              >
                Arcana
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.24em]"
                style={{ ...sans, color: C.gold }}
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
                <BadgeCheck size={12} strokeWidth={1.8} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center text-[13px] font-semibold"
              style={{
                ...serif,
                background: C.goldFaint,
                color: C.goldBright,
                border: `1px solid ${C.gold}`,
                borderRadius: 8,
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
                  ...sans,
                  color: on ? C.bg : C.fgSoft,
                  background: on ? C.gold : C.card,
                  border: `1px solid ${on ? C.gold : C.goldLine}`,
                  borderRadius: 999,
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
          style={{ ...sans, borderColor: C.goldLine, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Star size={12} strokeWidth={1.8} style={{ color: C.gold }} aria-hidden="true" />
            Gelezen bij kaarslicht · {ACTIES.length} wenken in de legging
          </span>
          <span>Verzegeld met zorg</span>
        </footer>
      </div>
    </div>
  );
}
