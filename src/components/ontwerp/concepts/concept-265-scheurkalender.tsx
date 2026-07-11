"use client";

// Concept 265 — "Scheurkalender" · Dutch tear-off day-calendar on warm paper.
// Signature: the classic Nederlandse scheurkalender. A big day-block carries the date, weekday,
// day number and a "dagspreuk"; a perforation strip runs along the top and a corner curls as if
// half torn. The next-best-actions become the "vandaag"-block; opdrachten stack as tearable day-
// sheets with soft depth shadows. Micro-interaction: a page-flip/tear on hover. Calendar-red
// accent over quiet paper-white. Fonts: Newsreader (serif numerals) + Manrope (body).
// Kalender-red #c02a24 on paper #f7f3ea, ink #241f1b.

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
  CalendarDays,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
  Scissors,
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

// Calendar palette: warm paper, kalender-red, deep ink for AA contrast.
const C = {
  paper: "#f7f3ea",
  paper2: "#f0eadc",
  sheet: "#fffdf7",
  sheetSoft: "#f6f1e5",
  line: "rgba(36,31,27,0.16)",
  lineFaint: "rgba(36,31,27,0.09)",
  perf: "rgba(36,31,27,0.30)",
  ink: "#241f1b",
  inkSoft: "#463f38",
  muted: "#797066",
  faint: "#a89e90",
  red: "#c02a24",
  redDeep: "#98201b",
  redSoft: "#f6ddd9",
  green: "#2f6b3a",
  greenSoft: "#e2ecdd",
  amber: "#9a5a12",
  amberSoft: "#f4e6cd",
};

const serif = { fontFamily: "var(--font-lab-newsreader)" };
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c02a24] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f3ea]";

// The perforation strip that runs along the top of a tear-off sheet: a dotted line + two holes.
function Perforation({ tone = C.perf }: { tone?: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-3"
      style={{ height: 12 }}
      aria-hidden="true"
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: C.paper, border: `1px solid ${tone}` }}
      />
      <span
        className="mx-2 h-px flex-1"
        style={{
          backgroundImage: `repeating-linear-gradient(to right, ${tone} 0 4px, transparent 4px 9px)`,
        }}
      />
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: C.paper, border: `1px solid ${tone}` }}
      />
    </div>
  );
}

function sheetStyle(soft = false): CSSProperties {
  return {
    background: soft ? C.sheetSoft : C.sheet,
    border: `1px solid ${C.line}`,
    borderRadius: 4,
    boxShadow: "0 1px 0 rgba(36,31,27,0.04), 0 6px 14px -10px rgba(36,31,27,0.30)",
  };
}

// A tear-off sheet: paper with a perforated top and a subtle folded-corner accent.
function Sheet({
  children,
  soft,
  perf = true,
  corner = false,
  className,
  style,
}: {
  children: ReactNode;
  soft?: boolean;
  perf?: boolean;
  corner?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`relative ${className ?? ""}`} style={{ ...sheetStyle(soft), ...style }}>
      {perf && <Perforation />}
      {corner && (
        <span
          className="pointer-events-none absolute bottom-0 right-0"
          aria-hidden="true"
          style={{
            width: 22,
            height: 22,
            background: `linear-gradient(135deg, transparent 50%, ${C.sheetSoft} 50%)`,
            borderRight: `1px solid ${C.line}`,
            borderBottom: `1px solid ${C.line}`,
            borderBottomRightRadius: 4,
            boxShadow: "-1px -1px 3px -1px rgba(36,31,27,0.25) inset",
          }}
        />
      )}
      {children}
    </div>
  );
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.green, bg: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.redDeep, bg: C.redSoft };
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
      style={{ ...sans, color: fg, background: bg, border: `1px solid ${fg}`, borderRadius: 3 }}
    >
      <Icon size={11} strokeWidth={2} aria-hidden="true" />
      {label}
    </span>
  );
}

function Spark({
  data,
  tone = C.red,
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
      <polygon points={area} fill={tone} opacity={0.12} stroke="none" />
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
        <circle key={i} cx={x} cy={y} r={1.2} fill={C.sheet} stroke={tone} strokeWidth={0.9} />
      ))}
    </svg>
  );
}

// The tear-off day block: weekday header in red, giant serif day number, dagspreuk beneath.
function DayBlock({
  weekday,
  day,
  month,
  spreuk,
}: {
  weekday: string;
  day: string;
  month: string;
  spreuk: string;
}) {
  return (
    <Sheet corner className="overflow-hidden">
      <div className="px-5 pb-5 pt-6">
        <div
          className="flex items-center justify-between border-b pb-2"
          style={{ borderColor: C.line }}
        >
          <span
            className="text-[13px] font-bold uppercase tracking-[0.28em]"
            style={{ ...sans, color: C.red }}
          >
            {weekday}
          </span>
          <span
            className="text-[12px] font-semibold uppercase tracking-[0.18em]"
            style={{ ...sans, color: C.muted }}
          >
            {month}
          </span>
        </div>
        <div className="flex items-end justify-between gap-3 pt-2">
          <span
            className="text-[84px] font-bold tabular-nums leading-none"
            style={{ ...serif, color: C.ink }}
          >
            {day}
          </span>
          <span
            className="mb-2 max-w-[52%] text-right text-[13.5px] italic leading-snug"
            style={{ ...serif, color: C.inkSoft }}
          >
            &ldquo;{spreuk}&rdquo;
          </span>
        </div>
      </div>
    </Sheet>
  );
}

function MatchStamp({ value, size = 58 }: { value: number; size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 flex-col items-center justify-center rounded-full"
      style={{ width: size, height: size, border: `2px solid ${C.red}`, background: C.redSoft }}
      aria-hidden="true"
    >
      <span
        className="text-[17px] font-bold tabular-nums leading-none"
        style={{ ...serif, color: C.redDeep }}
      >
        {value}
      </span>
      <span
        className="text-[7px] font-bold uppercase tracking-[0.14em]"
        style={{ ...sans, color: C.red }}
      >
        match
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
          style={{ ...sans, color: C.red }}
        >
          <CalendarDays size={11} strokeWidth={2.2} aria-hidden="true" />
          {code}
        </div>
      )}
      <h1
        className="text-[27px] font-bold leading-tight tracking-tight sm:text-[32px]"
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
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <DayBlock
            weekday="Donderdag"
            day="11"
            month="Juli"
            spreuk="Wie goed doet, goed ontmoet."
          />
        </div>
        <div className="lg:col-span-2">
          <div
            className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em]"
            style={{ ...sans, color: C.red }}
          >
            Vandaag · {PROFIEL.plaats}
          </div>
          <h1
            className="text-[26px] font-bold leading-none tracking-tight sm:text-[30px]"
            style={{ ...serif, color: C.ink }}
          >
            Dag, {voornaam}
          </h1>
          <p className="mt-2 text-[13px]" style={{ ...sans, color: C.muted }}>
            Sla het blad om — één ding op de kalender vraagt vandaag om aandacht.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {KPIS.map((k) => {
              const Trend = k.up ? TrendingUp : TrendingDown;
              return (
                <Sheet key={k.label} perf={false} className="p-3.5">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[9.5px] font-bold uppercase tracking-[0.1em]"
                      style={{ ...sans, color: C.muted }}
                    >
                      {k.label}
                    </span>
                    <span
                      className="inline-flex items-center gap-0.5 text-[10.5px] font-bold tabular-nums"
                      style={{ ...sans, color: k.up ? C.green : C.amber }}
                    >
                      <Trend size={10} strokeWidth={2.2} aria-hidden="true" />
                      {k.trend}
                    </span>
                  </div>
                  <div
                    className="mt-1 text-[22px] font-bold tabular-nums leading-none"
                    style={{ ...serif, color: C.ink }}
                  >
                    {k.value}
                  </div>
                  <div className="mt-1.5">
                    <Spark data={k.spark} height={26} />
                  </div>
                </Sheet>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays size={15} strokeWidth={2.2} style={{ color: C.red }} aria-hidden="true" />
            <h2
              className="text-[13px] font-bold uppercase tracking-[0.12em]"
              style={{ ...sans, color: C.ink }}
            >
              Beste match
            </h2>
          </div>
          <button
            onClick={onOpen}
            className={`group flex w-full items-start gap-4 p-5 pt-6 text-left transition-transform hover:-translate-y-0.5 ${RING}`}
            style={sheetStyle()}
          >
            <MatchStamp value={top.match} />
            <div className="min-w-0 flex-1">
              <div
                className="text-[17px] font-bold leading-tight"
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
                    className="px-2.5 py-0.5 text-[11px] font-medium"
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
              style={{ color: C.red }}
              aria-hidden="true"
            />
          </button>

          <Sheet soft perf={false} className="mt-6 flex items-start gap-4 p-5">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{ background: C.greenSoft, color: C.green, border: `1px solid ${C.green}` }}
              aria-hidden="true"
            >
              <ShieldCheck size={22} strokeWidth={1.8} />
            </span>
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[14px] font-bold" style={{ ...serif, color: C.ink }}>
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
                Je documenten staan netjes op orde en zijn geverifieerd — opdrachtgevers zien meteen
                dat het klopt.
              </p>
            </div>
          </Sheet>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <ListTodo size={15} strokeWidth={2.2} style={{ color: C.red }} aria-hidden="true" />
            <h2
              className="text-[13px] font-bold uppercase tracking-[0.12em]"
              style={{ ...sans, color: C.ink }}
            >
              Op het blad
            </h2>
          </div>
          <ul className="space-y-2.5">
            {ACTIES.map((a) => (
              <Sheet
                key={a.titel}
                perf={false}
                className="p-3.5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: a.urgentie === "warning" ? C.amber : C.red }}
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
                      className="mt-0.5 text-[11.5px] font-semibold"
                      style={{ ...sans, color: C.red }}
                    >
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
        title="Opdrachten, blad voor blad"
        sub="We tonen eerlijk waarom een opdracht past — en waar het blad kreukt."
      />

      <div className="mb-5 flex items-center gap-2 px-4 py-2.5" style={sheetStyle()}>
        <Search size={16} className="shrink-0" style={{ color: C.red }} aria-hidden="true" />
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
            style={{ ...sans, color: C.redDeep, background: C.redSoft, borderRadius: 3 }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Sheet className="flex flex-col items-center gap-3 px-6 py-14 pt-16 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.redSoft, color: C.red, border: `1px solid ${C.red}` }}
            aria-hidden="true"
          >
            <Search size={24} strokeWidth={1.8} />
          </span>
          <h3 className="text-[18px] font-bold" style={{ ...serif, color: C.ink }}>
            Geen blad gevonden
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm — er komt een nieuw
            blad zodra er een pad is.
          </p>
          <button
            onClick={() => setQuery("")}
            className={`mt-1 px-5 py-2 text-[13px] font-bold text-white ${RING}`}
            style={{ ...sans, background: C.red, borderRadius: 3 }}
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
                corner
                className="flex h-full flex-col p-5 pt-6 transition-transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-3">
                  <MatchStamp value={o.match} size={52} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-9 w-9 items-center justify-center transition-colors ${RING}`}
                    style={{
                      background: isSaved ? C.redSoft : "transparent",
                      color: isSaved ? C.redDeep : C.muted,
                      border: `1px solid ${isSaved ? C.red : C.line}`,
                      borderRadius: 3,
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
                  className={`group mt-4 inline-flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-bold text-white transition-colors ${RING}`}
                  style={{ ...sans, background: C.red, borderRadius: 3 }}
                >
                  Bekijk opdracht
                  <ArrowRight
                    size={14}
                    strokeWidth={2}
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
        className={`mb-5 inline-flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-bold ${RING}`}
        style={{
          ...sans,
          color: C.inkSoft,
          background: C.sheetSoft,
          border: `1px solid ${C.line}`,
          borderRadius: 3,
        }}
      >
        <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
        Terug
      </button>

      <Sheet corner className="p-6 pt-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <MatchStamp value={opdracht.match} size={64} />
            <div>
              <div
                className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ ...sans, color: C.red }}
              >
                {opdracht.id}
              </div>
              <h2
                className="text-[22px] font-bold leading-tight tracking-tight"
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
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold ${RING}`}
            style={{
              ...sans,
              color: isSaved ? C.redDeep : C.inkSoft,
              background: isSaved ? C.redSoft : C.sheetSoft,
              border: `1px solid ${isSaved ? C.red : C.line}`,
              borderRadius: 3,
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
              style={{ background: C.sheetSoft, border: `1px solid ${C.line}`, borderRadius: 3 }}
            >
              <m.Icon size={14} strokeWidth={2} style={{ color: C.red }} aria-hidden="true" />
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
      </Sheet>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Sheet perf={false} className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: C.greenSoft, color: C.green, border: `1px solid ${C.green}` }}
              aria-hidden="true"
            >
              <Plus size={13} strokeWidth={2.4} />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.1em]"
              style={{ ...sans, color: C.ink }}
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
        </Sheet>
        <Sheet perf={false} className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: C.amberSoft, color: C.amber, border: `1px solid ${C.amber}` }}
              aria-hidden="true"
            >
              <Minus size={13} strokeWidth={2.4} />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.1em]"
              style={{ ...sans, color: C.ink }}
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
        </Sheet>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className={`inline-flex items-center gap-2 px-6 py-3 text-[14px] font-bold text-white transition-colors ${RING}`}
          style={{ ...sans, background: applied ? C.green : C.red, borderRadius: 3 }}
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
        title="Documenten, zorgvuldig gecontroleerd"
        sub="Je gevoelige papieren houden we privé en netjes bij — jij bepaalt wie meekijkt."
      />

      <Sheet soft perf={false} className="mb-6 flex items-center gap-4 p-5">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          style={{ background: C.greenSoft, color: C.green, border: `1px solid ${C.green}` }}
          aria-hidden="true"
        >
          <ShieldCheck size={24} strokeWidth={1.8} />
        </span>
        <div>
          <div className="text-[14px] font-bold" style={{ ...serif, color: C.ink }}>
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
              <Sheet key={c.naam} perf={false} className="flex items-center gap-3 p-4">
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center transition-colors ${RING}`}
                  style={{
                    border: `1.5px solid ${done ? C.red : C.line}`,
                    background: done ? C.red : "transparent",
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
                  <div className="text-[12px]" style={{ ...sans, color: C.muted }}>
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
              style={{ ...sans, color: C.ink }}
            >
              <FileText size={16} strokeWidth={2} style={{ color: C.red }} aria-hidden="true" />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center ${RING}`}
              style={{
                background: C.sheetSoft,
                color: C.red,
                border: `1px solid ${C.line}`,
                borderRadius: 3,
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
                  ...sans,
                  color: feedState === s ? "#fff" : C.muted,
                  background: feedState === s ? C.red : C.sheetSoft,
                  border: `1px solid ${feedState === s ? C.red : C.line}`,
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
                <Sheet key={i} perf={false} className="p-3.5">
                  <div
                    className="h-3 w-2/3 animate-pulse"
                    style={{ background: C.sheetSoft, borderRadius: 3 }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse"
                    style={{ background: C.sheetSoft, borderRadius: 3 }}
                  />
                </Sheet>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Sheet perf={false} className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: C.redSoft, color: C.red, border: `1px solid ${C.red}` }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={1.8} />
              </span>
              <div className="text-[14px] font-bold" style={{ ...serif, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className={`mt-1 px-4 py-2 text-[12px] font-bold text-white ${RING}`}
                style={{ ...sans, background: C.red, borderRadius: 3 }}
              >
                Opnieuw proberen
              </button>
            </Sheet>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <Sheet key={d.naam} perf={false} className="flex items-center gap-3 p-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-[9px] font-bold"
                    style={{
                      ...sans,
                      background: C.sheetSoft,
                      color: C.redDeep,
                      border: `1px solid ${C.line}`,
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
      <ScreenHead code="Acties · vandaag" title="Wat vandaag om aandacht vraagt" />

      {openCount === 0 ? (
        <Sheet className="flex flex-col items-center gap-3 px-6 py-16 pt-16 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.greenSoft, color: C.green, border: `1px solid ${C.green}` }}
            aria-hidden="true"
          >
            <Check size={24} strokeWidth={2} />
          </span>
          <h3 className="text-[19px] font-bold" style={{ ...serif, color: C.ink }}>
            Blad is leeg
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Niets meer te doen vandaag. Alle bladen zijn afgescheurd.
          </p>
        </Sheet>
      ) : (
        <>
          <div
            className="mb-4 inline-flex items-center gap-2 px-3.5 py-2"
            style={{ background: C.redSoft, border: `1px solid ${C.red}`, borderRadius: 3 }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded text-[12px] font-bold tabular-nums text-white"
              style={{ ...serif, background: C.red }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-bold" style={{ ...sans, color: C.redDeep }}>
              {openCount} {openCount === 1 ? "blad" : "bladen"} in de wachtrij
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              return (
                <Sheet key={a.titel} perf={false} className="flex items-start gap-4 p-5">
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
                        className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-bold"
                        style={{
                          ...sans,
                          color: a.urgentie === "warning" ? C.amber : C.redDeep,
                          background: a.urgentie === "warning" ? C.amberSoft : C.redSoft,
                          border: `1px solid ${a.urgentie === "warning" ? C.amber : C.red}`,
                          borderRadius: 3,
                        }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
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
  const trend = [24.8, 13.5, 30.72, 8.8];
  const badgeTone = (status: string): { fg: string; bg: string } =>
    status === "Betaald"
      ? { fg: C.green, bg: C.greenSoft }
      : status === "Openstaand"
        ? { fg: C.amber, bg: C.amberSoft }
        : { fg: C.muted, bg: C.sheetSoft };
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
            <Sheet key={s.label} perf={false} className="p-4">
              <div
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...sans, color: C.muted }}
              >
                {s.label}
              </div>
              <div
                className="mt-1 text-[21px] font-bold tabular-nums"
                style={{ ...serif, color: s.tone }}
              >
                {s.value}
              </div>
            </Sheet>
          ))}
        </div>
        <Sheet perf={false} className="flex flex-col justify-between p-4">
          <div
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...sans, color: C.muted }}
          >
            Bedrag per factuur
          </div>
          <Spark data={trend} tone={C.red} height={44} />
        </Sheet>
      </div>

      <Sheet perf={false} className="overflow-hidden p-2">
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
                    className="transition-colors hover:bg-[#f6f1e5]"
                    style={{ borderBottom: `1px solid ${C.lineFaint}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12.5px] font-bold tabular-nums"
                      style={{ ...serif, color: C.redDeep }}
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
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{
                          ...sans,
                          color: t.fg,
                          background: t.bg,
                          border: `1px solid ${t.fg}`,
                          borderRadius: 3,
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
      </Sheet>
    </div>
  );
}

// ---- Shell -----------------------------------------------------------------

export function Concept265() {
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
              style={{ background: C.red, borderRadius: 4 }}
              aria-hidden="true"
            >
              <CalendarDays size={19} strokeWidth={2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[19px] font-bold tracking-tight"
                style={{ ...serif, color: C.ink }}
              >
                Scheurkalender
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
                background: C.redSoft,
                color: C.redDeep,
                border: `1px solid ${C.red}`,
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
                className={`inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-bold transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: on ? "#fff" : C.inkSoft,
                  background: on ? C.red : C.sheet,
                  border: `1px solid ${on ? C.red : C.line}`,
                  borderRadius: 3,
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
            <Scissors size={12} strokeWidth={2} style={{ color: C.red }} aria-hidden="true" />
            Scheurkalender · {ACTIES.length} bladen in wachtrij
          </span>
          <span>Blad voor blad afgescheurd</span>
        </footer>
      </div>
    </div>
  );
}
