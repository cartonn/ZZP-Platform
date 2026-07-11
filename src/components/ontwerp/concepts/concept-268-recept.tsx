"use client";

// Concept 268 — "Receptenkaart" · A warm cookbook recipe-card interface.
// Signature: every screen is a dish on a warm kitchen-cream card with a serif title, a
// left "ingrediënten" column and a numbered "bereidingswijze" step column, and small
// cook-time / portion metadata chips reused for tarief / uren / start. Dashboard is the
// "menu van vandaag", an opdracht is a full recipe with ingredients (requirements) + steps,
// verification shows "keurmerk / vers" seals. Warm, welcoming, hand-crafted yet tidy.
// Fonts: Fraunces (serif display) + Manrope (body). Terracotta accent #b3541e on cream.

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
  ChefHat,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
  Utensils,
  Flame,
  Users,
  Leaf,
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

// Warm kitchen-cream palette. Deep terracotta ink keeps AA on cream.
const C = {
  cream: "#f8f2e6",
  cream2: "#f2e9d6",
  card: "#fffaf0",
  cardSoft: "#f6eddb",
  paperLine: "#e6d8bd",
  line: "rgba(120,90,50,0.2)",
  lineFaint: "rgba(120,90,50,0.11)",
  ink: "#2a2018",
  inkSoft: "#5a4a38",
  muted: "#8a7458",
  faint: "#b0a084",
  terra: "#b3541e",
  terraDeep: "#8f3f12",
  terraSoft: "#f3e2d0",
  green: "#4a7c3a",
  greenSoft: "#e6efd9",
  amber: "#a66b18",
  amberSoft: "#f4e8ce",
  red: "#a5342c",
  redSoft: "#f2ddd6",
};

const serif = { fontFamily: "var(--font-lab-fraunces)" };
const sans = { fontFamily: "var(--font-lab-manrope)" };

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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b3541e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f2e6]";

function cardStyle(soft = false): CSSProperties {
  return {
    background: soft ? C.cardSoft : C.card,
    border: `1px solid ${C.line}`,
    borderRadius: 14,
    boxShadow: "0 1px 0 rgba(120,90,50,0.06), 0 12px 30px -24px rgba(90,60,30,0.5)",
  };
}

// A recipe card — cream stock with a subtle top "stitched" hairline like a filing card.
function RecipeCard({
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
      {children}
    </div>
  );
}

// A small kitchen metadata chip — reused for cook time / portions / tarief / uren / start.
function MetaChip({ Icon, label, value }: { Icon: LucideIcon; label: string; value: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px]"
      style={{
        ...sans,
        color: C.inkSoft,
        background: C.cardSoft,
        border: `1px solid ${C.line}`,
        borderRadius: 999,
      }}
    >
      <Icon size={14} strokeWidth={2} style={{ color: C.terra }} aria-hidden="true" />
      <span className="font-semibold" style={{ color: C.ink }}>
        {value}
      </span>
      <span style={{ color: C.muted }}>{label}</span>
    </span>
  );
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Vers keurmerk", Icon: BadgeCheck, fg: C.green, bg: C.greenSoft };
    case "SUBMITTED":
      return { label: "In de oven", Icon: Clock, fg: C.terraDeep, bg: C.terraSoft };
    case "EXPIRING":
      return { label: "Bijna over datum", Icon: TriangleAlert, fg: C.amber, bg: C.amberSoft };
    case "REJECTED":
      return { label: "Teruggestuurd", Icon: XCircle, fg: C.red, bg: C.redSoft };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, fg, bg } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...sans, color: fg, background: bg, border: `1px solid ${fg}55`, borderRadius: 999 }}
    >
      <Icon size={12} strokeWidth={2} aria-hidden="true" />
      {label}
    </span>
  );
}

// A round "keurmerk"-style seal — the verification hero motif, drawn as an SVG stamp.
function Seal({
  label,
  tone = C.terra,
  size = 62,
}: {
  label: string;
  tone?: string;
  size?: number;
}) {
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <circle cx={32} cy={32} r={30} fill="none" stroke={tone} strokeWidth={1.4} opacity={0.55} />
        <circle
          cx={32}
          cy={32}
          r={26}
          fill="none"
          stroke={tone}
          strokeWidth={1}
          strokeDasharray="2 3"
          opacity={0.7}
        />
        <path
          d="M22 32 l7 7 l13 -14"
          fill="none"
          stroke={tone}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="absolute inset-x-0 bottom-1 text-center text-[7px] font-bold uppercase tracking-[0.1em]"
        style={{ ...sans, color: tone }}
      >
        {label}
      </span>
    </span>
  );
}

// Warm sparkline drawn like a ladle-stroke over the cream card.
function Spark({
  data,
  tone = C.terra,
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
  const gid = `c268-spark-${tone.replace(/[^a-z0-9]/gi, "")}`;
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
          <stop offset="0" stopColor={tone} stopOpacity="0.28" />
          <stop offset="1" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} stroke="none" />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// A "doneness" match dial — a warm gauge like an oven temperature ring.
function MatchDial({ value, size = 62 }: { value: number; size?: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <circle cx={32} cy={32} r={r} fill="none" stroke={C.lineFaint} strokeWidth={3} />
        <circle
          cx={32}
          cy={32}
          r={r}
          fill="none"
          stroke={C.terra}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span
          className="text-[16px] font-bold tabular-nums"
          style={{ ...serif, color: C.terraDeep }}
        >
          {value}
        </span>
        <span
          className="text-[7px] font-bold uppercase tracking-[0.12em]"
          style={{ ...sans, color: C.muted }}
        >
          match
        </span>
      </span>
    </span>
  );
}

function ScreenHead({ title, sub, kicker }: { title: string; sub?: string; kicker?: string }) {
  return (
    <div className="mb-6">
      {kicker && (
        <div
          className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ ...sans, color: C.terra }}
        >
          <Utensils size={13} strokeWidth={2} aria-hidden="true" />
          {kicker}
        </div>
      )}
      <h1
        className="text-[28px] font-semibold leading-tight tracking-tight sm:text-[34px]"
        style={{ ...serif, color: C.ink }}
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
            className="mb-1 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ ...sans, color: C.terra }}
          >
            <ChefHat size={14} strokeWidth={2} aria-hidden="true" /> Menu van vandaag ·{" "}
            {PROFIEL.plaats}
          </div>
          <h1
            className="text-[30px] font-semibold leading-none tracking-tight sm:text-[36px]"
            style={{ ...serif, color: C.ink }}
          >
            Dag, {voornaam}
          </h1>
          <p className="mt-2 text-[13.5px]" style={{ ...sans, color: C.muted }}>
            Alles staat klaar in de keuken. Eén gerecht vraagt vandaag om je aandacht.
          </p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <RecipeCard key={k.label} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...sans, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                  style={{ ...sans, color: k.up ? C.green : C.amber }}
                >
                  <Trend size={11} strokeWidth={2.2} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-1.5 text-[25px] font-semibold tabular-nums leading-none"
                style={{ ...serif, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-2">
                <Spark data={k.spark} />
              </div>
            </RecipeCard>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Flame size={15} strokeWidth={2} style={{ color: C.terra }} aria-hidden="true" />
            <h2
              className="text-[13px] font-bold uppercase tracking-[0.12em]"
              style={{ ...sans, color: C.inkSoft }}
            >
              Gerecht van de dag
            </h2>
          </div>
          <button
            onClick={onOpen}
            className={`group flex w-full items-start gap-4 p-5 text-left transition-transform hover:-translate-y-0.5 ${RING}`}
            style={cardStyle()}
          >
            <MatchDial value={top.match} />
            <div className="min-w-0 flex-1">
              <div
                className="text-[18px] font-semibold leading-tight"
                style={{ ...serif, color: C.ink }}
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
              style={{ color: C.terra }}
              aria-hidden="true"
            />
          </button>

          <RecipeCard soft className="mt-6 flex items-start gap-4 p-5">
            <Seal label="vers" tone={C.green} size={54} />
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[15px] font-semibold" style={{ ...serif, color: C.ink }}>
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
                Je papieren dragen een vers keurmerk — opdrachtgevers proeven meteen dat het klopt.
              </p>
            </div>
          </RecipeCard>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <ListTodo size={15} strokeWidth={2} style={{ color: C.terra }} aria-hidden="true" />
            <h2
              className="text-[13px] font-bold uppercase tracking-[0.12em]"
              style={{ ...sans, color: C.inkSoft }}
            >
              Op het aanrecht
            </h2>
          </div>
          <ul className="space-y-2.5">
            {ACTIES.map((a) => (
              <RecipeCard key={a.titel} className="p-3.5">
                <div className="flex items-start gap-2">
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: a.urgentie === "warning" ? C.amber : C.terra }}
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
                      style={{ ...sans, color: C.terra }}
                    >
                      {a.cta}
                    </div>
                  </div>
                </div>
              </RecipeCard>
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
        kicker="De menukaart · afgestemd op jou"
        title="Vandaag op de kaart"
        sub="We tonen eerlijk waarom een gerecht bij je past — en waar het schuurt."
      />

      <div className="mb-5 flex items-center gap-2 px-4 py-2.5" style={cardStyle()}>
        <Search size={16} className="shrink-0" style={{ color: C.terra }} aria-hidden="true" />
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
            className={`px-2.5 py-1 text-[11px] font-semibold text-white ${RING}`}
            style={{ ...sans, background: C.terra, borderRadius: 999 }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <RecipeCard className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <Utensils size={40} strokeWidth={1.4} style={{ color: C.faint }} aria-hidden="true" />
          <h3 className="text-[19px] font-semibold" style={{ ...serif, color: C.ink }}>
            Niets op de kaart
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Geen gerecht voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <button
            onClick={() => setQuery("")}
            className={`mt-1 px-5 py-2 text-[13px] font-semibold text-white ${RING}`}
            style={{ ...sans, background: C.terra, borderRadius: 999 }}
          >
            Filter wissen
          </button>
        </RecipeCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <RecipeCard
                key={o.id}
                className="flex h-full flex-col p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <MatchDial value={o.match} size={54} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar gerecht"}
                    className={`flex h-9 w-9 items-center justify-center transition-colors ${RING}`}
                    style={{
                      background: isSaved ? C.terraSoft : "transparent",
                      color: isSaved ? C.terra : C.muted,
                      border: `1px solid ${isSaved ? C.terra : C.line}`,
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
                  className="mt-3 text-[16px] font-semibold leading-tight"
                  style={{ ...serif, color: C.ink }}
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
                  className={`group mt-4 inline-flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-white transition-colors ${RING}`}
                  style={{ ...sans, background: C.terra, borderRadius: 999 }}
                >
                  Bekijk recept
                  <ArrowRight
                    size={14}
                    strokeWidth={2}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </button>
              </RecipeCard>
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
  // "Ingrediënten" = the plus reasons (what this dish is made of); "Bereidingswijze" = steps.
  const stappen = [
    "Bekijk het gerecht en check of het bij je smaak past.",
    "Reageer met één tik — je profiel gaat automatisch mee.",
    "De opdrachtgever proeft je reactie en neemt contact op.",
  ];
  return (
    <div>
      <button
        onClick={onBack}
        className={`mb-5 inline-flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold ${RING}`}
        style={{
          ...sans,
          color: C.inkSoft,
          background: C.cardSoft,
          border: `1px solid ${C.line}`,
          borderRadius: 999,
        }}
      >
        <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
        Terug naar de kaart
      </button>

      <RecipeCard className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <MatchDial value={opdracht.match} size={66} />
            <div>
              <div
                className="text-[10.5px] font-semibold uppercase tracking-[0.2em]"
                style={{ ...sans, color: C.terra }}
              >
                Recept {opdracht.id}
              </div>
              <h2
                className="text-[24px] font-semibold leading-tight tracking-tight"
                style={{ ...serif, color: C.ink }}
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
              color: isSaved ? C.terra : C.inkSoft,
              background: isSaved ? C.terraSoft : C.cardSoft,
              border: `1px solid ${isSaved ? C.terra : C.line}`,
              borderRadius: 999,
            }}
          >
            {isSaved ? (
              <BookmarkCheck size={14} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Bookmark size={14} strokeWidth={2} aria-hidden="true" />
            )}
            {isSaved ? "In je kookboek" : "Bewaar recept"}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <MetaChip Icon={Wallet} label="tarief" value={opdracht.tarief} />
          <MetaChip Icon={Clock} label="inzet" value={opdracht.uren} />
          <MetaChip Icon={Calendar} label="start" value={opdracht.start} />
          <MetaChip Icon={Users} label="plaats" value={opdracht.plaats} />
        </div>
      </RecipeCard>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-5">
        {/* Ingrediënten column = the plus reasons */}
        <RecipeCard soft className="p-5 md:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Leaf size={16} strokeWidth={2} style={{ color: C.green }} aria-hidden="true" />
            <span
              className="text-[13px] font-bold uppercase tracking-[0.1em]"
              style={{ ...sans, color: C.inkSoft }}
            >
              Ingrediënten
            </span>
          </div>
          <ul className="space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...sans, color: C.inkSoft }}
              >
                <Plus
                  size={14}
                  strokeWidth={2.4}
                  className="mt-1 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
          <div className="my-4 h-px" style={{ background: C.line }} />
          <div className="mb-2 flex items-center gap-2">
            <TriangleAlert
              size={14}
              strokeWidth={2}
              style={{ color: C.amber }}
              aria-hidden="true"
            />
            <span
              className="text-[11.5px] font-bold uppercase tracking-[0.1em]"
              style={{ ...sans, color: C.muted }}
            >
              Naar smaak toevoegen
            </span>
          </div>
          <ul className="space-y-2">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[12.5px]"
                style={{ ...sans, color: C.muted }}
              >
                <Minus
                  size={13}
                  strokeWidth={2.4}
                  className="mt-1 shrink-0"
                  style={{ color: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </RecipeCard>

        {/* Bereidingswijze column = numbered steps */}
        <RecipeCard className="p-5 md:col-span-3">
          <div className="mb-4 flex items-center gap-2">
            <ChefHat size={16} strokeWidth={2} style={{ color: C.terra }} aria-hidden="true" />
            <span
              className="text-[13px] font-bold uppercase tracking-[0.1em]"
              style={{ ...sans, color: C.inkSoft }}
            >
              Bereidingswijze
            </span>
          </div>
          <ol className="space-y-4">
            {stappen.map((s, i) => (
              <li key={s} className="flex items-start gap-3.5">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center text-[14px] font-semibold tabular-nums"
                  style={{
                    ...serif,
                    color: C.terra,
                    background: C.terraSoft,
                    border: `1px solid ${C.terra}55`,
                    borderRadius: 999,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <p
                  className="pt-1 text-[13.5px] leading-relaxed"
                  style={{ ...sans, color: C.inkSoft }}
                >
                  {s}
                </p>
              </li>
            ))}
          </ol>

          <div
            className="mt-5 flex flex-wrap items-center gap-3 border-t pt-4"
            style={{ borderColor: C.line }}
          >
            <button
              onClick={() => setApplied((v) => !v)}
              aria-pressed={applied}
              className={`inline-flex items-center gap-2 px-6 py-3 text-[14px] font-semibold text-white transition-colors ${RING}`}
              style={{ ...sans, background: applied ? C.green : C.terra, borderRadius: 999 }}
            >
              {applied ? (
                <Check size={17} strokeWidth={2.4} aria-hidden="true" />
              ) : (
                <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />
              )}
              {applied ? "Reactie opgediend" : "Reageer op opdracht"}
            </button>
            {applied && (
              <span className="text-[12.5px]" style={{ ...sans, color: C.muted }}>
                De opdrachtgever reageert gemiddeld binnen 6 uur.
              </span>
            )}
          </div>
        </RecipeCard>
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
        kicker="Keurmerk · privé & versleuteld"
        title="Vers gekeurd, netjes bewaard"
        sub="Al je gevoelige papieren houden we privé en met een vers keurmerk bij."
      />

      <RecipeCard soft className="mb-6 flex items-center gap-4 p-5">
        <Seal label="keurmerk" tone={C.green} size={58} />
        <div>
          <div className="text-[15px] font-semibold" style={{ ...serif, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[13px]" style={{ ...sans, color: C.inkSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </RecipeCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            return (
              <RecipeCard key={c.naam} className="flex items-center gap-3 p-4">
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center transition-colors ${RING}`}
                  style={{
                    border: `1.5px solid ${done ? C.terra : C.line}`,
                    background: done ? C.terra : "transparent",
                    color: "#fff",
                    borderRadius: 8,
                  }}
                >
                  {done && <Check size={15} strokeWidth={2.6} aria-hidden="true" />}
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
              </RecipeCard>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.1em]"
              style={{ ...sans, color: C.inkSoft }}
            >
              <FileText size={16} strokeWidth={2} style={{ color: C.terra }} aria-hidden="true" />
              Voorraadkast
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center ${RING}`}
              style={{
                background: C.cardSoft,
                color: C.terra,
                border: `1px solid ${C.line}`,
                borderRadius: 8,
              }}
              aria-label="Vernieuw voorraadkast"
            >
              <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Voorraadweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className={`px-3 py-1 text-[11px] font-semibold ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? "#fff" : C.muted,
                  background: feedState === s ? C.terra : C.cardSoft,
                  border: `1px solid ${feedState === s ? C.terra : C.line}`,
                  borderRadius: 999,
                }}
              >
                {s === "ok" ? "Klaar" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Voorraad laden">
              {[0, 1, 2, 3].map((i) => (
                <RecipeCard key={i} className="p-3.5">
                  <div
                    className="h-3 w-2/3 animate-pulse"
                    style={{ background: C.cardSoft, borderRadius: 4 }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse"
                    style={{ background: C.cardSoft, borderRadius: 4 }}
                  />
                </RecipeCard>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <RecipeCard className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center"
                style={{ background: C.redSoft, color: C.red, borderRadius: 14 }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-semibold" style={{ ...serif, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.muted }}>
                We konden je voorraadkast niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className={`mt-1 px-4 py-2 text-[12px] font-semibold text-white ${RING}`}
                style={{ ...sans, background: C.terra, borderRadius: 999 }}
              >
                Opnieuw proberen
              </button>
            </RecipeCard>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <RecipeCard key={d.naam} className="flex items-center gap-3 p-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{
                      ...sans,
                      background: C.cardSoft,
                      color: C.terraDeep,
                      border: `1px solid ${C.line}`,
                      borderRadius: 8,
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
                    <div className="text-[11px] tabular-nums" style={{ ...sans, color: C.muted }}>
                      {d.grootte} · {d.bijgewerkt}
                    </div>
                  </div>
                  <StatusChip status={d.status} />
                </RecipeCard>
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
      <ScreenHead kicker="Op het aanrecht · takenlijst" title="Wat vandaag klaargezet moet" />

      {openCount === 0 ? (
        <RecipeCard className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <ChefHat size={40} strokeWidth={1.4} style={{ color: C.faint }} aria-hidden="true" />
          <h3 className="text-[20px] font-semibold" style={{ ...serif, color: C.ink }}>
            Keuken opgeruimd
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Niets meer te doen vandaag. Het aanrecht is leeg en schoon.
          </p>
        </RecipeCard>
      ) : (
        <>
          <div
            className="mb-4 inline-flex items-center gap-2 px-3.5 py-2"
            style={{ background: C.terraSoft, border: `1px solid ${C.terra}55`, borderRadius: 999 }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center text-[12px] font-bold tabular-nums text-white"
              style={{ ...sans, background: C.terra, borderRadius: 999 }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ ...sans, color: C.terraDeep }}>
              {openCount} {openCount === 1 ? "gerecht" : "gerechten"} klaar te zetten
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              return (
                <RecipeCard key={a.titel} className="flex items-start gap-4 p-5">
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${isDone ? C.green : C.line}`,
                      background: isDone ? C.green : "transparent",
                      color: "#fff",
                      borderRadius: 999,
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
                          ...sans,
                          color: a.urgentie === "warning" ? C.amber : C.terraDeep,
                          background: a.urgentie === "warning" ? C.amberSoft : C.terraSoft,
                          border: `1px solid ${a.urgentie === "warning" ? C.amber : C.terra}55`,
                          borderRadius: 999,
                        }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </RecipeCard>
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
        kicker="De rekening · overzicht"
        title="Je rekeningen"
        sub="Overzichtelijk en zonder gedoe — zodat je weet waar je aan toe bent."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-2">
          {[
            { label: "Betaald (mnd)", value: "€ 5.552", tone: C.green },
            { label: "Openstaand", value: "€ 1.350", tone: C.amber },
            { label: "Concept", value: "€ 880", tone: C.muted },
          ].map((s) => (
            <RecipeCard key={s.label} className="p-4">
              <div
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...sans, color: C.muted }}
              >
                {s.label}
              </div>
              <div
                className="mt-1 text-[22px] font-semibold tabular-nums"
                style={{ ...serif, color: s.tone }}
              >
                {s.value}
              </div>
            </RecipeCard>
          ))}
        </div>
        <RecipeCard className="flex flex-col justify-between p-4">
          <div
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...sans, color: C.muted }}
          >
            Bedrag per rekening
          </div>
          <Spark data={trend} tone={C.terra} height={44} />
        </RecipeCard>
      </div>

      <RecipeCard className="overflow-hidden p-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Rekening", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
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
                    className="transition-colors hover:bg-[#f6eddb]"
                    style={{ borderBottom: `1px solid ${C.lineFaint}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12.5px] font-bold tabular-nums"
                      style={{ ...sans, color: C.terraDeep }}
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
                      style={{ ...serif, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          ...sans,
                          color: t.fg,
                          background: t.bg,
                          border: `1px solid ${t.fg}55`,
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
      </RecipeCard>
    </div>
  );
}

// ---- Shell -----------------------------------------------------------------

export function Concept268() {
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
        color: C.ink,
        background: `radial-gradient(120% 100% at 50% 0%, ${C.card} 0%, ${C.cream} 55%, ${C.cream2} 100%)`,
      }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center text-white"
              style={{ background: C.terra, borderRadius: 14 }}
              aria-hidden="true"
            >
              <ChefHat size={20} strokeWidth={2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[20px] font-semibold tracking-tight"
                style={{ ...serif, color: C.ink }}
              >
                Receptenkaart
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
            <span
              className="flex h-11 w-11 items-center justify-center text-[13px] font-bold"
              style={{
                ...serif,
                background: C.terraSoft,
                color: C.terraDeep,
                border: `1px solid ${C.terra}55`,
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
                  ...sans,
                  color: on ? "#fff" : C.inkSoft,
                  background: on ? C.terra : C.card,
                  border: `1px solid ${on ? C.terra : C.line}`,
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
          style={{ ...sans, borderColor: C.line, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <ChefHat size={12} strokeWidth={2} style={{ color: C.terra }} aria-hidden="true" />
            Met liefde bereid · {ACTIES.length} gerechten op het aanrecht
          </span>
          <span>Vers geserveerd</span>
        </footer>
      </div>
    </div>
  );
}
