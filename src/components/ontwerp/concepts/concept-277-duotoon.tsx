"use client";

// Concept 277 — "Duotoon" · Bold Pantone-duotone editorial poster (light).
// Signature: a two-colour duotone poster language — deep indigo + hot coral over large flat,
// posterised colour fields with sharp edges (no grain — that is a different, riso direction).
// Oversized display type (Anton), high-tension poster composition, hard offset shadows and thick
// ink rules. Match scores and KPIs read as giant poster numerals. Editorial but daring.
// Fonts: Anton (display) + Space Grotesk (body/UI).

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

// Duotone poster palette — two dominant inks (indigo + coral) over warm paper.
const C = {
  paper: "#f3ead7",
  paper2: "#eaddc3",
  cream: "#fffaf0",
  ink: "#1d1552", // deep indigo — dominant ink #1
  inkSoft: "#392f7d",
  inkFaint: "#6a638f",
  coral: "#ff5638", // hot coral — dominant ink #2
  coralDeep: "#df3e22",
  peach: "#ffb598",
  peachSoft: "#ffd8c6",
  line: "#1d1552",
  muted: "#6a638f",
  white: "#fffaf0",
};

const display = { fontFamily: "var(--font-lab-anton)" };
const body = { fontFamily: "var(--font-lab-space)" };

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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5638] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3ead7]";

// ---- Poster primitives ------------------------------------------------------

// A poster card: cream field, thick ink border, hard offset shadow (no blur).
function posterStyle(offset = 5): CSSProperties {
  return {
    background: C.cream,
    border: `2px solid ${C.ink}`,
    boxShadow: `${offset}px ${offset}px 0 ${C.ink}`,
  };
}

function Poster({
  children,
  className,
  style,
  offset = 5,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  offset?: number;
}) {
  return (
    <div className={className} style={{ ...posterStyle(offset), ...style }}>
      {children}
    </div>
  );
}

// Eyebrow label — small uppercase kicker in the poster voice.
function Kicker({ children, tone = C.coral }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em]"
      style={{ ...body, color: tone }}
    >
      {children}
    </span>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  fg: string;
  bg: string;
  border: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.cream, bg: C.coral, border: C.coral };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.cream, bg: C.ink, border: C.ink };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        Icon: TriangleAlert,
        fg: C.ink,
        bg: C.peach,
        border: C.ink,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: XCircle,
        fg: C.coralDeep,
        bg: C.cream,
        border: C.coralDeep,
      };
  }
}

function StatusBadge({ status }: { status: CredStatus }) {
  const { label, Icon, fg, bg, border } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em]"
      style={{ ...body, color: fg, background: bg, border: `1.5px solid ${border}` }}
    >
      <Icon size={12} strokeWidth={2.6} aria-hidden="true" />
      {label}
    </span>
  );
}

// Match rendered as a giant poster numeral in a duotone block.
function MatchBlock({ value, big = false }: { value: number; big?: boolean }) {
  const strong = value >= 90;
  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center leading-none"
      style={{
        background: strong ? C.coral : C.ink,
        color: strong ? C.ink : C.cream,
        border: `2px solid ${C.ink}`,
        width: big ? 92 : 60,
        height: big ? 92 : 60,
      }}
      aria-label={`Match ${value} procent`}
    >
      <span
        className={big ? "text-[40px]" : "text-[26px]"}
        style={{ ...display, letterSpacing: "-0.02em" }}
      >
        {value}
      </span>
      <span
        className={`${big ? "text-[9px]" : "text-[8px]"} font-bold uppercase tracking-[0.2em]`}
        style={{ ...body }}
      >
        match
      </span>
    </div>
  );
}

function Sparkline({ data, tone, height = 34 }: { data: number[]; tone: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 66 - 17;
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
      <polygon points={`0,100 ${line} 100,100`} fill={tone} opacity={0.16} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2} fill={tone} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

function ScreenHead({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mb-7">
      <Kicker>
        <span className="inline-block h-2 w-2" style={{ background: C.coral }} aria-hidden="true" />
        {kicker}
      </Kicker>
      <h1
        className="mt-2 text-[40px] uppercase leading-[0.92] tracking-[-0.01em] sm:text-[54px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-3 max-w-xl text-[14px] leading-relaxed"
          style={{ ...body, color: C.inkSoft }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const [invert, setInvert] = useState(false);
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      {/* Duotone hero poster — hover/press flips the two inks. */}
      <button
        type="button"
        onMouseEnter={() => setInvert(true)}
        onMouseLeave={() => setInvert(false)}
        onFocus={() => setInvert(true)}
        onBlur={() => setInvert(false)}
        onClick={() => setInvert((v) => !v)}
        aria-label="Wissel het duotoon-palet van de poster"
        aria-pressed={invert}
        className={`group relative mb-8 block w-full overflow-hidden text-left ${RING}`}
        style={{
          border: `2px solid ${C.ink}`,
          boxShadow: `6px 6px 0 ${C.ink}`,
          background: invert ? C.ink : C.coral,
          transition: "background 240ms ease",
        }}
      >
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div>
            <Kicker tone={invert ? C.peach : C.ink}>
              <Sparkles size={12} strokeWidth={2.6} aria-hidden="true" />
              {PROFIEL.plaats} · {PROFIEL.rol}
            </Kicker>
            <h2
              className="mt-2 text-[46px] uppercase leading-[0.86] tracking-[-0.01em] sm:text-[68px]"
              style={{ ...display, color: invert ? C.cream : C.ink }}
            >
              Dag,
              <br />
              {voornaam}
            </h2>
            <p
              className="mt-4 max-w-sm text-[13px] font-medium leading-relaxed"
              style={{ ...body, color: invert ? C.peachSoft : C.ink }}
            >
              Twee kleuren, één verhaal — je hele werkweek als poster. Beweeg over het vlak om de
              inkt te wisselen.
            </p>
          </div>
          <div
            className="flex flex-col items-center justify-center px-6 py-4"
            style={{
              background: invert ? C.coral : C.ink,
              color: invert ? C.ink : C.cream,
              border: `2px solid ${invert ? C.coral : C.ink}`,
            }}
          >
            <span className="text-[64px] leading-none sm:text-[84px]" style={{ ...display }}>
              {KPIS[0]?.value.replace("%", "")}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ ...body }}>
              match-score
            </span>
          </div>
        </div>
      </button>

      {/* KPI poster tiles */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const tone = i % 2 === 0 ? C.coral : C.ink;
          return (
            <Poster key={k.label} className="overflow-hidden" offset={4}>
              <div
                className="flex items-center justify-between px-3 py-2"
                style={{ background: tone }}
              >
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.16em]"
                  style={{ ...body, color: C.cream }}
                >
                  {k.label}
                </span>
                <Trend size={13} strokeWidth={2.6} color={C.cream} aria-hidden="true" />
              </div>
              <div className="p-4">
                <div
                  className="text-[30px] tabular-nums leading-none"
                  style={{ ...display, color: C.ink }}
                >
                  {k.value}
                </div>
                <div
                  className="mt-1 text-[11px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...body, color: tone }}
                >
                  {k.trend}
                </div>
                <div className="mt-2">
                  <Sparkline data={k.spark} tone={tone} />
                </div>
              </div>
            </Poster>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <Kicker>Beste match</Kicker>
            <span
              className="text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ ...body, color: C.muted }}
            >
              {OPDRACHTEN.length} open
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpen(top)}
            className={`group flex w-full items-stretch overflow-hidden text-left transition-transform hover:-translate-y-0.5 ${RING}`}
            style={posterStyle(5)}
          >
            <span
              className="flex items-center justify-center p-5"
              style={{ background: C.paper2, borderRight: `2px solid ${C.ink}` }}
            >
              <MatchBlock value={top.match} big />
            </span>
            <span className="flex flex-1 flex-col p-5">
              <span
                className="text-[22px] uppercase leading-[0.95]"
                style={{ ...display, color: C.ink }}
              >
                {top.titel}
              </span>
              <span className="mt-1 text-[13px] font-medium" style={{ ...body, color: C.inkSoft }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </span>
              <span className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em]"
                    style={{ ...body, color: C.ink, border: `1.5px solid ${C.ink}` }}
                  >
                    {t}
                  </span>
                ))}
              </span>
              <span
                className="mt-4 inline-flex items-center gap-1.5 self-start text-[12px] font-bold uppercase tracking-[0.1em]"
                style={{ ...body, color: C.coral }}
              >
                Bekijk opdracht
                <ArrowRight
                  size={14}
                  strokeWidth={2.6}
                  className="transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </span>
          </button>

          <Poster className="mt-6 flex items-center gap-4 p-5" offset={4}>
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center"
              style={{ background: C.coral, border: `2px solid ${C.ink}` }}
              aria-hidden="true"
            >
              <ShieldCheck size={24} strokeWidth={2.4} color={C.ink} />
            </span>
            <div>
              <div className="text-[15px] uppercase" style={{ ...display, color: C.ink }}>
                {PROFIEL.trust}
              </div>
              <p
                className="mt-0.5 text-[12.5px] font-medium leading-relaxed"
                style={{ ...body, color: C.inkSoft }}
              >
                Je documenten zijn geverifieerd — opdrachtgevers zien meteen dat je klaarstaat.
              </p>
            </div>
          </Poster>
        </div>

        <div>
          <div className="mb-3">
            <Kicker tone={C.ink}>Volgende stappen</Kicker>
          </div>
          <ul className="space-y-4">
            {ACTIES.map((a) => {
              const warn = a.urgentie === "warning";
              return (
                <Poster key={a.titel} className="overflow-hidden" offset={4}>
                  <div
                    className="h-1.5"
                    style={{ background: warn ? C.coral : C.ink }}
                    aria-hidden="true"
                  />
                  <div className="p-4">
                    <div
                      className="text-[13px] font-bold leading-snug"
                      style={{ ...body, color: C.ink }}
                    >
                      {a.titel}
                    </div>
                    <div
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em]"
                      style={{ ...body, color: warn ? C.coralDeep : C.inkSoft }}
                    >
                      {a.cta}
                      <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
                    </div>
                  </div>
                </Poster>
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
        kicker="Marktplaats"
        title="Opdrachten in duotoon"
        sub="We tonen eerlijk waarom een opdracht past — en waar de aandacht ligt."
      />

      <div
        className="mb-6 flex items-center gap-2 px-4 py-2.5"
        style={{
          background: C.cream,
          border: `2px solid ${C.ink}`,
          boxShadow: `4px 4px 0 ${C.ink}`,
        }}
      >
        <Search size={17} className="shrink-0" style={{ color: C.coral }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[14px] font-medium outline-none placeholder:opacity-60"
          style={{ ...body, color: C.ink }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className={`px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${RING}`}
            style={{ ...body, color: C.cream, background: C.coral, border: `1.5px solid ${C.ink}` }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Poster className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <div className="flex" aria-hidden="true">
            <span className="h-14 w-10" style={{ background: C.coral }} />
            <span className="h-14 w-10" style={{ background: C.ink }} />
            <span className="h-14 w-10" style={{ background: C.peach }} />
          </div>
          <h3 className="text-[26px] uppercase leading-none" style={{ ...display, color: C.ink }}>
            Niets gevonden
          </h3>
          <p className="max-w-xs text-[13px] font-medium" style={{ ...body, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className={`px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] ${RING}`}
            style={{ ...body, background: C.coral, color: C.cream, border: `2px solid ${C.ink}` }}
          >
            Filter wissen
          </button>
        </Poster>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <Poster
                key={o.id}
                className="flex h-full flex-col overflow-hidden transition-transform hover:-translate-y-1"
                offset={5}
              >
                <div
                  className="flex items-center justify-between p-4"
                  style={{ background: C.paper2, borderBottom: `2px solid ${C.ink}` }}
                >
                  <MatchBlock value={o.match} />
                  <button
                    type="button"
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-9 w-9 items-center justify-center ${RING}`}
                    style={{
                      background: isSaved ? C.coral : C.cream,
                      color: C.ink,
                      border: `2px solid ${C.ink}`,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={16} strokeWidth={2.4} aria-hidden="true" />
                    ) : (
                      <Bookmark size={16} strokeWidth={2.4} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <span
                    className="text-[9px] font-bold uppercase tracking-[0.18em]"
                    style={{ ...body, color: C.muted }}
                  >
                    {o.id}
                  </span>
                  <h3
                    className="mt-1 text-[19px] uppercase leading-[0.95]"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <div
                    className="mt-1 text-[13px] font-medium"
                    style={{ ...body, color: C.inkSoft }}
                  >
                    {o.opdrachtgever}
                  </div>
                  <dl
                    className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px] font-medium"
                    style={{ ...body, color: C.inkSoft }}
                  >
                    <div className="flex items-center gap-1.5">
                      <MapPin
                        size={13}
                        strokeWidth={2.2}
                        style={{ color: C.coral }}
                        aria-hidden="true"
                      />
                      {o.plaats}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wallet
                        size={13}
                        strokeWidth={2.2}
                        style={{ color: C.coral }}
                        aria-hidden="true"
                      />
                      {o.tarief}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock
                        size={13}
                        strokeWidth={2.2}
                        style={{ color: C.coral }}
                        aria-hidden="true"
                      />
                      {o.uren}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar
                        size={13}
                        strokeWidth={2.2}
                        style={{ color: C.coral }}
                        aria-hidden="true"
                      />
                      {o.start}
                    </div>
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
                        style={{ ...body, color: C.ink, border: `1.5px solid ${C.ink}` }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpen(o)}
                    className={`group mt-4 inline-flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] ${RING}`}
                    style={{ ...body, background: C.ink, color: C.cream }}
                  >
                    Bekijk opdracht
                    <ArrowRight
                      size={14}
                      strokeWidth={2.6}
                      className="transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </Poster>
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
        type="button"
        onClick={onBack}
        className={`mb-5 inline-flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] ${RING}`}
        style={{ ...body, color: C.ink, background: C.cream, border: `2px solid ${C.ink}` }}
      >
        <ArrowLeft size={14} strokeWidth={2.6} aria-hidden="true" />
        Terug
      </button>

      <Poster className="overflow-hidden" offset={6}>
        <div
          className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ background: C.coral, borderBottom: `2px solid ${C.ink}` }}
        >
          <div>
            <Kicker tone={C.ink}>{opdracht.id}</Kicker>
            <h2
              className="mt-2 text-[32px] uppercase leading-[0.9] sm:text-[40px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h2>
            <div className="mt-1 text-[14px] font-bold" style={{ ...body, color: C.ink }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </div>
          </div>
          <MatchBlock value={opdracht.match} big />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m, i) => (
            <div
              key={m.label}
              className="p-4"
              style={{
                borderRight: i < 3 ? `2px solid ${C.ink}` : "none",
                borderTop: `2px solid ${C.ink}`,
              }}
            >
              <m.Icon size={16} strokeWidth={2.4} style={{ color: C.coral }} aria-hidden="true" />
              <div
                className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em]"
                style={{ ...body, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="text-[14px] font-bold" style={{ ...body, color: C.ink }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </Poster>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <Poster className="overflow-hidden" offset={4}>
          <div
            className="flex items-center gap-2 p-4"
            style={{ background: C.ink, borderBottom: `2px solid ${C.ink}` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.coral }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={3} color={C.ink} />
            </span>
            <span
              className="text-[13px] uppercase tracking-[0.06em]"
              style={{ ...display, color: C.cream }}
            >
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-3 p-5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px] font-medium"
                style={{ ...body, color: C.ink }}
              >
                <Check
                  size={16}
                  strokeWidth={3}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.coral }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Poster>
        <Poster className="overflow-hidden" offset={4}>
          <div
            className="flex items-center gap-2 p-4"
            style={{ background: C.peach, borderBottom: `2px solid ${C.ink}` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.ink }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={3} color={C.cream} />
            </span>
            <span
              className="text-[13px] uppercase tracking-[0.06em]"
              style={{ ...display, color: C.ink }}
            >
              Even op letten
            </span>
          </div>
          <ul className="space-y-3 p-5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px] font-medium"
                style={{ ...body, color: C.ink }}
              >
                <TriangleAlert
                  size={16}
                  strokeWidth={2.4}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.coralDeep }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Poster>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className={`inline-flex items-center gap-2 px-6 py-3 text-[13px] font-bold uppercase tracking-[0.1em] ${RING}`}
          style={{
            ...body,
            background: applied ? C.ink : C.coral,
            color: applied ? C.cream : C.ink,
            border: `2px solid ${C.ink}`,
            boxShadow: `4px 4px 0 ${C.ink}`,
          }}
        >
          {applied ? (
            <Check size={17} strokeWidth={3} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.6} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </button>
        <button
          type="button"
          onClick={() => toggleSave(opdracht.id)}
          aria-pressed={isSaved}
          className={`inline-flex items-center gap-2 px-5 py-3 text-[12px] font-bold uppercase tracking-[0.1em] ${RING}`}
          style={{
            ...body,
            color: C.ink,
            background: isSaved ? C.peach : C.cream,
            border: `2px solid ${C.ink}`,
          }}
        >
          {isSaved ? (
            <BookmarkCheck size={15} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <Bookmark size={15} strokeWidth={2.6} aria-hidden="true" />
          )}
          {isSaved ? "Bewaard" : "Bewaar"}
        </button>
        {applied && (
          <span className="text-[12px] font-medium" style={{ ...body, color: C.muted }}>
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
        kicker="Verificatie"
        title="Bewijs, zwart-op-kleur"
        sub="Elke status spreekt zich uit — met label én icoon, nooit met kleur alleen."
      />

      {/* Legend of the four statuses */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const m = statusMeta(s);
          return (
            <Poster key={s} className="flex items-center gap-2 p-3" offset={3}>
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center"
                style={{ background: m.bg, color: m.fg, border: `1.5px solid ${m.border}` }}
                aria-hidden="true"
              >
                <m.Icon size={16} strokeWidth={2.6} />
              </span>
              <span
                className="text-[11px] font-bold uppercase tracking-[0.06em]"
                style={{ ...body, color: C.ink }}
              >
                {m.label}
              </span>
            </Poster>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            return (
              <Poster key={c.naam} className="flex items-center gap-3 p-4" offset={4}>
                <button
                  type="button"
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center ${RING}`}
                  style={{
                    border: `2px solid ${C.ink}`,
                    background: done ? C.coral : C.cream,
                    color: C.ink,
                  }}
                >
                  {done && <Check size={16} strokeWidth={3} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold" style={{ ...body, color: C.ink }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px] font-medium" style={{ ...body, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </Poster>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Kicker tone={C.ink}>Documentenkluis</Kicker>
            <button
              type="button"
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center ${RING}`}
              style={{ background: C.cream, color: C.coral, border: `2px solid ${C.ink}` }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${RING}`}
                style={{
                  ...body,
                  color: feedState === s ? C.cream : C.ink,
                  background: feedState === s ? C.ink : C.cream,
                  border: `1.5px solid ${C.ink}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-3" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Poster key={i} className="p-4" offset={3}>
                  <div className="h-3 w-2/3 animate-pulse" style={{ background: C.paper2 }} />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse"
                    style={{ background: C.paper2 }}
                  />
                </Poster>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Poster className="flex flex-col items-center gap-2 px-4 py-8 text-center" offset={4}>
              <span
                className="flex h-12 w-12 items-center justify-center"
                style={{ background: C.coral, border: `2px solid ${C.ink}` }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2.4} color={C.ink} />
              </span>
              <div className="text-[16px] uppercase" style={{ ...display, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12px] font-medium" style={{ ...body, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                type="button"
                onClick={() => setFeedState("ok")}
                className={`mt-1 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] ${RING}`}
                style={{ ...body, background: C.coral, color: C.ink, border: `2px solid ${C.ink}` }}
              >
                Opnieuw proberen
              </button>
            </Poster>
          )}

          {feedState === "ok" && (
            <ul className="space-y-3">
              {DOCUMENTEN.map((d) => {
                const m = statusMeta(d.status);
                return (
                  <Poster key={d.naam} className="flex items-center gap-3 p-3" offset={3}>
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center text-[9px] font-bold"
                      style={{
                        ...body,
                        background: C.ink,
                        color: C.cream,
                        border: `1.5px solid ${C.ink}`,
                      }}
                      aria-hidden="true"
                    >
                      {d.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[12.5px] font-bold"
                        style={{ ...body, color: C.ink }}
                      >
                        {d.naam}
                      </div>
                      <div
                        className="text-[11px] font-medium tabular-nums"
                        style={{ ...body, color: C.muted }}
                      >
                        {d.grootte} · {d.bijgewerkt}
                      </div>
                    </div>
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center"
                      style={{ background: m.bg, color: m.fg, border: `1.5px solid ${m.border}` }}
                      aria-label={m.label}
                      title={m.label}
                    >
                      <m.Icon size={14} strokeWidth={2.6} aria-hidden="true" />
                    </span>
                  </Poster>
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
      <ScreenHead kicker="Acties" title="Wat om aandacht vraagt" />

      {openCount === 0 ? (
        <Poster className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <div className="flex" aria-hidden="true">
            <span className="h-14 w-10" style={{ background: C.coral }} />
            <span className="h-14 w-10" style={{ background: C.ink }} />
          </div>
          <h3 className="text-[26px] uppercase" style={{ ...display, color: C.ink }}>
            Alles klaar
          </h3>
          <p className="max-w-xs text-[13px] font-medium" style={{ ...body, color: C.muted }}>
            Niets meer te doen vandaag. Mooi werk.
          </p>
        </Poster>
      ) : (
        <>
          <div
            className="mb-5 inline-flex items-center gap-2 px-4 py-2"
            style={{ background: C.coral, border: `2px solid ${C.ink}` }}
          >
            <span className="text-[18px] leading-none" style={{ ...display, color: C.ink }}>
              {openCount}
            </span>
            <span
              className="text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ ...body, color: C.ink }}
            >
              {openCount === 1 ? "actie open" : "acties open"}
            </span>
          </div>

          <ul className="space-y-4">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <Poster key={a.titel} className="flex items-stretch overflow-hidden" offset={4}>
                  <span
                    className="w-2 shrink-0"
                    style={{ background: isDone ? C.muted : warn ? C.coral : C.ink }}
                    aria-hidden="true"
                  />
                  <div className="flex flex-1 items-start gap-4 p-5">
                    <button
                      type="button"
                      onClick={() => toggleDone(a.titel)}
                      aria-pressed={isDone}
                      aria-label={
                        isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`
                      }
                      className={`flex h-8 w-8 shrink-0 items-center justify-center ${RING}`}
                      style={{
                        border: `2px solid ${C.ink}`,
                        background: isDone ? C.coral : C.cream,
                        color: C.ink,
                      }}
                    >
                      {isDone && <Check size={16} strokeWidth={3} aria-hidden="true" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[15px] font-bold leading-snug"
                        style={{
                          ...body,
                          color: C.ink,
                          textDecoration: isDone ? "line-through" : "none",
                          opacity: isDone ? 0.5 : 1,
                        }}
                      >
                        {warn && !isDone && (
                          <span
                            className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
                            style={{ background: C.coral, color: C.ink }}
                          >
                            Urgent
                          </span>
                        )}
                        {a.titel}
                      </div>
                      <p
                        className="mt-1 text-[12.5px] font-medium"
                        style={{ ...body, color: C.muted, opacity: isDone ? 0.5 : 1 }}
                      >
                        {a.detail}
                      </p>
                      {!isDone && (
                        <span
                          className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em]"
                          style={{
                            ...body,
                            color: warn ? C.cream : C.ink,
                            background: warn ? C.coral : C.cream,
                            border: `1.5px solid ${C.ink}`,
                          }}
                        >
                          {a.cta}
                          <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  </div>
                </Poster>
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
  const statusStyle = (
    status: string,
  ): { fg: string; bg: string; border: string; Icon: LucideIcon } =>
    status === "Betaald"
      ? { fg: C.cream, bg: C.coral, border: C.coral, Icon: Check }
      : status === "Openstaand"
        ? { fg: C.ink, bg: C.peach, border: C.ink, Icon: Clock }
        : { fg: C.ink, bg: C.cream, border: C.ink, Icon: FileText };
  return (
    <div>
      <ScreenHead
        kicker="Facturen"
        title="Je facturen"
        sub="Overzichtelijk en zonder gedoe — zodat je weet waar je aan toe bent."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", tone: C.coral, fg: C.ink },
          { label: "Openstaand", value: "€ 1.350", tone: C.peach, fg: C.ink },
          { label: "Concept", value: "€ 880", tone: C.ink, fg: C.cream },
        ].map((s) => (
          <Poster key={s.label} className="overflow-hidden" offset={4}>
            <div className="px-4 py-3" style={{ background: s.tone }}>
              <span
                className="text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ ...body, color: s.fg }}
              >
                {s.label}
              </span>
              <div
                className="mt-1 text-[26px] tabular-nums leading-none"
                style={{ ...display, color: s.fg }}
              >
                {s.value}
              </div>
            </div>
          </Poster>
        ))}
        <Poster className="flex flex-col justify-between p-4" offset={4}>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ ...body, color: C.muted }}
          >
            Bedrag per factuur
          </span>
          <Sparkline data={trend} tone={C.coral} height={44} />
        </Poster>
      </div>

      <Poster className="overflow-hidden" offset={5}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ background: C.ink }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ ...body, color: C.cream }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const st = statusStyle(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#eaddc3]"
                    style={{ borderTop: i === 0 ? "none" : `1.5px solid ${C.ink}` }}
                  >
                    <td
                      className="px-4 py-3 text-[12.5px] font-bold tabular-nums"
                      style={{ ...body, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td
                      className="px-4 py-3 text-[13px] font-medium"
                      style={{ ...body, color: C.ink }}
                    >
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12.5px] font-medium tabular-nums"
                      style={{ ...body, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-4 py-3 text-[13px] font-bold tabular-nums"
                      style={{ ...body, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em]"
                        style={{
                          ...body,
                          color: st.fg,
                          background: st.bg,
                          border: `1.5px solid ${st.border}`,
                        }}
                      >
                        <st.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Poster>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept277() {
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

  const open = (o: Opdracht) => {
    setActive(o);
    setScreen("opdracht");
  };

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, color: C.ink, background: C.paper }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center"
              style={{
                background: C.coral,
                border: `2px solid ${C.ink}`,
                boxShadow: `3px 3px 0 ${C.ink}`,
              }}
              aria-hidden="true"
            >
              <span className="text-[20px] leading-none" style={{ ...display, color: C.ink }}>
                D
              </span>
            </span>
            <div className="leading-none">
              <div
                className="text-[20px] uppercase leading-none"
                style={{ ...display, color: C.ink }}
              >
                Duotoon
              </div>
              <div
                className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em]"
                style={{ ...body, color: C.muted }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-bold" style={{ ...body, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.06em]"
                style={{ ...body, color: C.coralDeep }}
              >
                <BadgeCheck size={12} strokeWidth={2.6} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center text-[13px] font-bold"
              style={{ ...body, background: C.ink, color: C.cream, border: `2px solid ${C.ink}` }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav className="mb-8 flex flex-wrap gap-2 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICONS[s.key];
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.08em] transition-transform hover:-translate-y-0.5 ${RING}`}
                style={{
                  ...body,
                  color: on ? C.cream : C.ink,
                  background: on ? C.ink : C.cream,
                  border: `2px solid ${C.ink}`,
                  boxShadow: on ? `3px 3px 0 ${C.coral}` : "none",
                }}
              >
                <Icon size={14} strokeWidth={2.4} aria-hidden="true" />
                {s.label}
              </button>
            );
          })}
        </nav>

        <main className="flex-1">
          {screen === "dashboard" && <Dashboard onOpen={open} />}
          {screen === "marktplaats" && (
            <Marktplaats
              query={query}
              setQuery={setQuery}
              saved={saved}
              toggleSave={(id) => setSaved((s) => toggleSet(s, id))}
              onOpen={open}
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
          className="mt-10 flex flex-wrap items-center justify-between gap-2 pt-4 text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{ ...body, borderTop: `2px solid ${C.ink}`, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5"
              style={{ background: C.coral }}
              aria-hidden="true"
            />
            <span
              className="inline-block h-2.5 w-2.5"
              style={{ background: C.ink }}
              aria-hidden="true"
            />
            Duotoon poster · v277
          </span>
          <span>Twee inkten, één verhaal</span>
        </footer>
      </div>
    </div>
  );
}
