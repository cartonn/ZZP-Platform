"use client";

// Concept 266 — "Kruiswoord" · numbered puzzle-grid & clue-list UI (light).
// Signature: a crossword layout as interface. A black-and-white numbered cell grid carries KPI
// figures and statuses; some cells are filled black as structure. A "horizontaal / verticaal"
// clue list doubles as navigation and actions. Numbered cells wear a small superscript index in
// the top-left, thick grid rules, monospace numerals. Playful-intelligent, strict black & white
// with a single blue accent for the active/hovered cell. The grid is metaphor and structure — it
// stays functional and legible. Fonts: Space Mono (grid/numerals) + Inter (body). Accent #2563eb.

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
  Grid3x3,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
  Hash,
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

// Strict black & white crossword palette with one blue accent for the active cell.
const C = {
  paper: "#ffffff",
  paper2: "#f4f4f5",
  cell: "#ffffff",
  cellSoft: "#f7f7f8",
  black: "#0a0a0a",
  line: "#0a0a0a",
  lineSoft: "rgba(10,10,10,0.16)",
  ink: "#0a0a0a",
  inkSoft: "#3f3f46",
  muted: "#6b6b72",
  faint: "#9a9aa2",
  blue: "#2563eb",
  blueDeep: "#1d4ed8",
  blueSoft: "#e6edfe",
  green: "#15803d",
  greenSoft: "#dcf3e4",
  amber: "#b45309",
  amberSoft: "#fbeed0",
  red: "#b91c1c",
  redSoft: "#fbe0e0",
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff]";

// A crossword "cell": thick black rule, a small superscript number top-left like a clue index.
function GridCell({
  n,
  children,
  filled = false,
  active = false,
  className,
  style,
}: {
  n?: number;
  children?: ReactNode;
  filled?: boolean;
  active?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`relative ${className ?? ""}`}
      style={{
        background: filled ? C.black : active ? C.blueSoft : C.cell,
        border: `2px solid ${C.line}`,
        ...style,
      }}
    >
      {n !== undefined && !filled && (
        <span
          className="absolute left-1 top-0.5 text-[9px] font-bold tabular-nums leading-none"
          style={{ ...mono, color: active ? C.blueDeep : C.muted }}
          aria-hidden="true"
        >
          {n}
        </span>
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
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em]"
      style={{ ...mono, color: fg, background: bg, border: `1.5px solid ${fg}` }}
    >
      <Icon size={11} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </span>
  );
}

function Spark({
  data,
  tone = C.blue,
  height = 30,
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
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {pts.map(([x, y], i) => (
        <rect key={i} x={x - 1} y={y - 1} width={2} height={2} fill={tone} />
      ))}
    </svg>
  );
}

// A square match cell — number in a bordered box with a "% match" hint, crossword-style.
function MatchCell({ value, size = 56 }: { value: number; size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 flex-col items-center justify-center"
      style={{ width: size, height: size, border: `2px solid ${C.line}`, background: C.blueSoft }}
      aria-hidden="true"
    >
      <span
        className="absolute left-1 top-0.5 text-[8px] font-bold leading-none"
        style={{ ...mono, color: C.blueDeep }}
      >
        %
      </span>
      <span
        className="text-[18px] font-bold tabular-nums leading-none"
        style={{ ...mono, color: C.blueDeep }}
      >
        {value}
      </span>
      <span
        className="text-[7px] font-bold uppercase tracking-[0.1em]"
        style={{ ...mono, color: C.muted }}
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
          style={{ ...mono, color: C.blue }}
        >
          <Hash size={11} strokeWidth={2.4} aria-hidden="true" />
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
            className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em]"
            style={{ ...mono, color: C.blue }}
          >
            Puzzel · {PROFIEL.plaats}
          </div>
          <h1
            className="text-[26px] font-bold leading-none tracking-tight sm:text-[30px]"
            style={{ ...mono, color: C.ink }}
          >
            Dag, {voornaam}
          </h1>
          <p className="mt-2 text-[13px]" style={{ ...sans, color: C.muted }}>
            Het raster is bijna vol. Eén vak vraagt vandaag om je aandacht.
          </p>
        </div>
        <span
          className="hidden h-14 w-14 shrink-0 items-center justify-center sm:flex"
          style={{ border: `2px solid ${C.line}`, background: C.blueSoft }}
          aria-hidden="true"
        >
          <Grid3x3 size={24} strokeWidth={2} style={{ color: C.blueDeep }} />
        </span>
      </div>

      {/* KPI grid: numbered crossword cells carrying the figures. */}
      <div
        className="mb-8 grid grid-cols-2 gap-0 sm:grid-cols-4"
        style={{ border: `1px solid ${C.line}` }}
      >
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <GridCell
              key={k.label}
              n={i + 1}
              className="group p-4 transition-colors hover:bg-[#e6edfe]"
              style={{ margin: -1 }}
            >
              <div className="flex items-start justify-between gap-2 pl-3">
                <span
                  className="text-[9.5px] font-bold uppercase tracking-[0.08em]"
                  style={{ ...sans, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[10.5px] font-bold tabular-nums"
                  style={{ ...mono, color: k.up ? C.green : C.amber }}
                >
                  <Trend size={10} strokeWidth={2.2} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-1 pl-3 text-[24px] font-bold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-2 pl-3">
                <Spark data={k.spark} />
              </div>
            </GridCell>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-5 w-5 items-center justify-center text-[10px] font-bold"
              style={{ ...mono, color: "#fff", background: C.blue }}
              aria-hidden="true"
            >
              1
            </span>
            <h2
              className="text-[13px] font-bold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.ink }}
            >
              Horizontaal — beste match
            </h2>
          </div>
          <button
            onClick={onOpen}
            className={`group flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-[#f7f7f8] ${RING}`}
            style={{ border: `2px solid ${C.line}`, background: C.cell }}
          >
            <MatchCell value={top.match} />
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
                    className="px-2 py-0.5 text-[11px] font-semibold"
                    style={{ ...sans, color: C.inkSoft, border: `1.5px solid ${C.line}` }}
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

          <div
            className="mt-6 flex items-start gap-4 p-5"
            style={{ border: `2px solid ${C.line}`, background: C.cellSoft }}
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center"
              style={{ background: C.greenSoft, color: C.green, border: `2px solid ${C.green}` }}
              aria-hidden="true"
            >
              <ShieldCheck size={22} strokeWidth={2} />
            </span>
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[14px] font-bold" style={{ ...mono, color: C.ink }}>
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
                Je documenten passen precies in het raster en zijn geverifieerd — opdrachtgevers
                zien meteen dat het klopt.
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-5 w-5 items-center justify-center text-[10px] font-bold"
              style={{ ...mono, color: "#fff", background: C.blue }}
              aria-hidden="true"
            >
              2
            </span>
            <h2
              className="text-[13px] font-bold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.ink }}
            >
              Verticaal — aanwijzingen
            </h2>
          </div>
          <ul className="space-y-2.5">
            {ACTIES.map((a, i) => (
              <li
                key={a.titel}
                className="flex items-start gap-2.5 p-3.5 transition-colors hover:bg-[#f7f7f8]"
                style={{ border: `2px solid ${C.line}`, background: C.cell }}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center text-[10px] font-bold tabular-nums"
                  style={{
                    ...mono,
                    color: "#fff",
                    background: a.urgentie === "warning" ? C.amber : C.blue,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div
                    className="text-[12.5px] font-semibold leading-snug"
                    style={{ ...sans, color: C.ink }}
                  >
                    {a.titel}
                  </div>
                  <div
                    className="mt-0.5 text-[11.5px] font-bold"
                    style={{ ...mono, color: C.blueDeep }}
                  >
                    {a.cta}
                  </div>
                </div>
              </li>
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
        title="Opdrachten, ingevuld"
        sub="We tonen eerlijk waarom een opdracht past — en waar een vak nog open staat."
      />

      <div
        className="mb-5 flex items-center gap-2 px-4 py-2.5"
        style={{ border: `2px solid ${C.line}`, background: C.cell }}
      >
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
            className={`px-2.5 py-1 text-[11px] font-bold ${RING}`}
            style={{
              ...mono,
              color: C.blueDeep,
              background: C.blueSoft,
              border: `1.5px solid ${C.blue}`,
            }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 px-6 py-14 text-center"
          style={{ border: `2px solid ${C.line}`, background: C.cell }}
        >
          <span
            className="flex h-14 w-14 items-center justify-center"
            style={{ border: `2px solid ${C.line}`, background: C.blueSoft }}
            aria-hidden="true"
          >
            <Search size={24} strokeWidth={2} style={{ color: C.blueDeep }} />
          </span>
          <h3 className="text-[18px] font-bold" style={{ ...mono, color: C.ink }}>
            Geen vak gevonden
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm — er past een vak
            zodra er een aanwijzing is.
          </p>
          <button
            onClick={() => setQuery("")}
            className={`mt-1 px-5 py-2 text-[13px] font-bold text-white ${RING}`}
            style={{ ...mono, background: C.blue }}
          >
            Filter wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, i) => {
            const isSaved = saved.has(o.id);
            return (
              <div
                key={o.id}
                className="relative flex h-full flex-col p-5 transition-colors hover:bg-[#f7f7f8]"
                style={{ border: `2px solid ${C.line}`, background: C.cell }}
              >
                <span
                  className="absolute left-1.5 top-1 text-[10px] font-bold tabular-nums"
                  style={{ ...mono, color: C.muted }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="flex items-start justify-between gap-3 pl-3">
                  <MatchCell value={o.match} size={50} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-9 w-9 items-center justify-center transition-colors ${RING}`}
                    style={{
                      background: isSaved ? C.blueSoft : "transparent",
                      color: isSaved ? C.blueDeep : C.muted,
                      border: `2px solid ${isSaved ? C.blue : C.line}`,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
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
                  style={{ ...mono, background: C.blue }}
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
        style={{ ...mono, color: C.inkSoft, background: C.cellSoft, border: `2px solid ${C.line}` }}
      >
        <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
        Terug
      </button>

      <div className="p-6" style={{ border: `2px solid ${C.line}`, background: C.cell }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <MatchCell value={opdracht.match} size={64} />
            <div>
              <div
                className="text-[10px] font-bold uppercase tracking-[0.2em]"
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
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold ${RING}`}
            style={{
              ...mono,
              color: isSaved ? C.blueDeep : C.inkSoft,
              background: isSaved ? C.blueSoft : C.cellSoft,
              border: `2px solid ${isSaved ? C.blue : C.line}`,
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
              style={{ background: C.cellSoft, border: `2px solid ${C.line}` }}
            >
              <m.Icon size={14} strokeWidth={2} style={{ color: C.blue }} aria-hidden="true" />
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
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="p-5" style={{ border: `2px solid ${C.line}`, background: C.cell }}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.greenSoft, color: C.green, border: `2px solid ${C.green}` }}
              aria-hidden="true"
            >
              <Plus size={13} strokeWidth={2.6} />
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
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5" style={{ border: `2px solid ${C.line}`, background: C.cell }}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.amberSoft, color: C.amber, border: `2px solid ${C.amber}` }}
              aria-hidden="true"
            >
              <Minus size={13} strokeWidth={2.6} />
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
                  strokeWidth={2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className={`inline-flex items-center gap-2 px-6 py-3 text-[14px] font-bold text-white transition-colors ${RING}`}
          style={{ ...mono, background: applied ? C.green : C.blue }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
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
        title="Documenten, vak voor vak gecontroleerd"
        sub="Je gevoelige papieren houden we privé en zorgvuldig bij — jij bepaalt wie meekijkt."
      />

      <div
        className="mb-6 flex items-center gap-4 p-5"
        style={{ border: `2px solid ${C.line}`, background: C.cellSoft }}
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center"
          style={{ background: C.greenSoft, color: C.green, border: `2px solid ${C.green}` }}
          aria-hidden="true"
        >
          <ShieldCheck size={24} strokeWidth={2} />
        </span>
        <div>
          <div className="text-[14px] font-bold" style={{ ...mono, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[13px]" style={{ ...sans, color: C.inkSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c, i) => {
            const done = checked.has(c.naam);
            return (
              <div
                key={c.naam}
                className="relative flex items-center gap-3 p-4 pl-5"
                style={{ border: `2px solid ${C.line}`, background: done ? C.blueSoft : C.cell }}
              >
                <span
                  className="absolute left-1 top-0.5 text-[9px] font-bold tabular-nums"
                  style={{ ...mono, color: C.muted }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center transition-colors ${RING}`}
                  style={{
                    border: `2px solid ${done ? C.blue : C.line}`,
                    background: done ? C.blue : "transparent",
                    color: "#fff",
                  }}
                >
                  {done && <Check size={15} strokeWidth={2.8} aria-hidden="true" />}
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
              </div>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.ink }}
            >
              <FileText size={16} strokeWidth={2} style={{ color: C.blue }} aria-hidden="true" />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center ${RING}`}
              style={{ background: C.cellSoft, color: C.blue, border: `2px solid ${C.line}` }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={2.2} aria-hidden="true" />
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
                  ...mono,
                  color: feedState === s ? "#fff" : C.muted,
                  background: feedState === s ? C.blue : C.cellSoft,
                  border: `2px solid ${feedState === s ? C.blue : C.line}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <li
                  key={i}
                  className="p-3.5"
                  style={{ border: `2px solid ${C.line}`, background: C.cell }}
                >
                  <div className="h-3 w-2/3 animate-pulse" style={{ background: C.cellSoft }} />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse"
                    style={{ background: C.cellSoft }}
                  />
                </li>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <div
              className="flex flex-col items-center gap-2 px-4 py-8 text-center"
              style={{ border: `2px solid ${C.line}`, background: C.cell }}
            >
              <span
                className="flex h-12 w-12 items-center justify-center"
                style={{ background: C.redSoft, color: C.red, border: `2px solid ${C.red}` }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[14px] font-bold" style={{ ...mono, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className={`mt-1 px-4 py-2 text-[12px] font-bold text-white ${RING}`}
                style={{ ...mono, background: C.blue }}
              >
                Opnieuw proberen
              </button>
            </div>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <li
                  key={d.naam}
                  className="flex items-center gap-3 p-3"
                  style={{ border: `2px solid ${C.line}`, background: C.cell }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{
                      ...mono,
                      background: C.cellSoft,
                      color: C.blueDeep,
                      border: `2px solid ${C.line}`,
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
                </li>
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
      <ScreenHead code="Acties · aanwijzingen" title="Wat vandaag om aandacht vraagt" />

      {openCount === 0 ? (
        <div
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          style={{ border: `2px solid ${C.line}`, background: C.cell }}
        >
          <span
            className="flex h-14 w-14 items-center justify-center"
            style={{ background: C.greenSoft, color: C.green, border: `2px solid ${C.green}` }}
            aria-hidden="true"
          >
            <Check size={24} strokeWidth={2.4} />
          </span>
          <h3 className="text-[19px] font-bold" style={{ ...mono, color: C.ink }}>
            Raster opgelost
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Niets meer te doen vandaag. Alle vakken zijn ingevuld.
          </p>
        </div>
      ) : (
        <>
          <div
            className="mb-4 inline-flex items-center gap-2 px-3.5 py-2"
            style={{ background: C.blueSoft, border: `2px solid ${C.blue}` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center text-[12px] font-bold tabular-nums text-white"
              style={{ ...mono, background: C.blue }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-bold" style={{ ...mono, color: C.blueDeep }}>
              {openCount} {openCount === 1 ? "vak" : "vakken"} in de wachtrij
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              return (
                <li
                  key={a.titel}
                  className="relative flex items-start gap-4 p-5 pl-6"
                  style={{
                    border: `2px solid ${C.line}`,
                    background: isDone ? C.cellSoft : C.cell,
                  }}
                >
                  <span
                    className="absolute left-1 top-0.5 text-[9px] font-bold tabular-nums"
                    style={{ ...mono, color: C.muted }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `2px solid ${isDone ? C.green : C.line}`,
                      background: isDone ? C.green : "transparent",
                      color: "#fff",
                    }}
                  >
                    {isDone && <Check size={16} strokeWidth={2.8} aria-hidden="true" />}
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
                          ...mono,
                          color: a.urgentie === "warning" ? C.amber : C.blueDeep,
                          background: a.urgentie === "warning" ? C.amberSoft : C.blueSoft,
                          border: `2px solid ${a.urgentie === "warning" ? C.amber : C.blue}`,
                        }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                      </span>
                    )}
                  </div>
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
          ].map((s, i) => (
            <div
              key={s.label}
              className="relative p-4 pl-5"
              style={{ border: `2px solid ${C.line}`, background: C.cell }}
            >
              <span
                className="absolute left-1 top-0.5 text-[9px] font-bold tabular-nums"
                style={{ ...mono, color: C.muted }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div
                className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
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
            </div>
          ))}
        </div>
        <div
          className="flex flex-col justify-between p-4"
          style={{ border: `2px solid ${C.line}`, background: C.cell }}
        >
          <div
            className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.muted }}
          >
            Bedrag per factuur
          </div>
          <Spark data={trend} tone={C.blue} height={44} />
        </div>
      </div>

      <div
        className="overflow-hidden p-2"
        style={{ border: `2px solid ${C.line}`, background: C.cell }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.line}` }}>
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
                    className="transition-colors hover:bg-[#f7f7f8]"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
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
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em]"
                        style={{
                          ...mono,
                          color: t.fg,
                          background: t.bg,
                          border: `1.5px solid ${t.fg}`,
                        }}
                      >
                        {f.status === "Betaald" ? (
                          <Check size={11} strokeWidth={2.6} aria-hidden="true" />
                        ) : f.status === "Openstaand" ? (
                          <Clock size={11} strokeWidth={2.2} aria-hidden="true" />
                        ) : (
                          <FileText size={11} strokeWidth={2.2} aria-hidden="true" />
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
      </div>
    </div>
  );
}

// ---- Shell -----------------------------------------------------------------

export function Concept266() {
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
              style={{ background: C.black, border: `2px solid ${C.line}` }}
              aria-hidden="true"
            >
              <Grid3x3 size={19} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[19px] font-bold tracking-tight"
                style={{ ...mono, color: C.ink }}
              >
                Kruiswoord
              </div>
              <div
                className="text-[10px] font-bold uppercase tracking-[0.2em]"
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
                <BadgeCheck size={12} strokeWidth={2.2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center text-[13px] font-bold"
              style={{
                ...mono,
                background: C.blueSoft,
                color: C.blueDeep,
                border: `2px solid ${C.line}`,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav className="mb-8 flex flex-wrap gap-1.5 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s, i) => {
            const on = s.key === screen;
            const Icon = NAV_ICONS[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`relative inline-flex shrink-0 items-center gap-1.5 py-2 pl-5 pr-3.5 text-[12.5px] font-bold transition-colors ${RING}`}
                style={{
                  ...mono,
                  color: on ? "#fff" : C.inkSoft,
                  background: on ? C.blue : C.cell,
                  border: `2px solid ${on ? C.blue : C.line}`,
                }}
              >
                <span
                  className="absolute left-1 top-0.5 text-[8px] font-bold tabular-nums"
                  style={{ color: on ? "rgba(255,255,255,0.7)" : C.faint }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
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
          style={{ ...mono, borderColor: C.lineSoft, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Hash size={12} strokeWidth={2.2} style={{ color: C.blue }} aria-hidden="true" />
            Kruiswoord · {ACTIES.length} vakken in wachtrij
          </span>
          <span>Vak voor vak ingevuld</span>
        </footer>
      </div>
    </div>
  );
}
