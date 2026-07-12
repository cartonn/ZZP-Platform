"use client";

// Concept 274 — "Getallenas" · Meetlat / getallenlijn als data-ruggegraat (light).
// Signature: een doorlopende liniaal-as met maatstreepjes plaatst elke datawaarde (match%, tarief,
// uren, omzet) exact op een schaal. Ultra-minimalistisch redactioneel zwart-op-wit met één rode
// maatlijn als accent; tabulaire precisie-typografie; alles uitgelijnd op een zichtbaar meetraster.
// Kalm, technisch, precies. Fonts: Geist (tekst) + Geist Mono (cijfers/maten).

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
  Ruler,
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

// Editorial black-on-white with a single red measurement line.
const C = {
  paper: "#ffffff",
  bg: "#f6f6f4",
  ink: "#0a0a0a",
  ink2: "#33342f",
  muted: "#6d6e68",
  faint: "#9c9d96",
  line: "#e4e4df",
  lineSoft: "#efefea",
  grid: "#e9e9e3",
  red: "#e4002b",
  redSoft: "#fbe4e9",
};

const sans = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0a0a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f6f4]";

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

const SCREEN_INDEX: Record<ScreenKey, string> = {
  dashboard: "01",
  marktplaats: "02",
  opdracht: "03",
  verificatie: "04",
  acties: "05",
  facturen: "06",
  documenten: "07",
  berichten: "08",
};

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const pos = (v: number, min: number, max: number) => clamp(((v - min) / (max - min)) * 100);

// ---- Signature: the measurement ruler ---------------------------------------

// A horizontal ruler axis with major/minor ticks and a red marker at `value`.
function Meetlat({
  value,
  min,
  max,
  unit,
  ticks = 5,
  showScale = true,
  label,
}: {
  value: number;
  min: number;
  max: number;
  unit?: string;
  ticks?: number;
  showScale?: boolean;
  label?: string;
}) {
  const p = pos(value, min, max);
  const marks = Array.from({ length: ticks + 1 }, (_, i) => i);
  return (
    <div>
      <div className="relative h-9" aria-hidden="true">
        {/* baseline */}
        <span className="absolute left-0 right-0 top-3 block h-px" style={{ background: C.ink }} />
        {/* ticks */}
        {marks.map((i) => {
          const t = (i / ticks) * 100;
          const major = i === 0 || i === ticks || i * 2 === ticks;
          return (
            <span
              key={i}
              className="absolute top-3 block w-px"
              style={{
                left: `${t}%`,
                height: major ? 10 : 6,
                background: C.ink,
                transform: "translateX(-0.5px)",
              }}
            />
          );
        })}
        {/* red value marker */}
        <span
          className="absolute top-0 flex flex-col items-center transition-[left] duration-500 ease-out"
          style={{ left: `${p}%`, transform: "translateX(-50%)" }}
        >
          <span
            className="text-[11px] font-semibold tabular-nums leading-none"
            style={{ ...mono, color: C.red }}
          >
            {value}
            {unit ?? ""}
          </span>
          <span className="mt-0.5 block h-4 w-[2px]" style={{ background: C.red }} />
          <span
            className="block h-1.5 w-1.5 rotate-45"
            style={{ background: C.red, marginTop: -3 }}
          />
        </span>
      </div>
      {showScale && (
        <div className="mt-1 flex justify-between">
          <span className="text-[9px] tabular-nums" style={{ ...mono, color: C.faint }}>
            {min}
            {unit ?? ""}
          </span>
          {label && (
            <span
              className="text-[9px] font-medium uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.faint }}
            >
              {label}
            </span>
          )}
          <span className="text-[9px] tabular-nums" style={{ ...mono, color: C.faint }}>
            {max}
            {unit ?? ""}
          </span>
        </div>
      )}
    </div>
  );
}

// Sparkline plotted over a measured x-axis with tick marks — the getallenas idea in miniature.
function AxisSpark({ data, height = 44 }: { data: number[]; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 74 - 14;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1]!;
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      {/* x-axis ticks */}
      {data.map((_, i) => {
        const x = (i / (data.length - 1)) * 100;
        return (
          <line
            key={i}
            x1={x}
            y1={94}
            x2={x}
            y2={100}
            stroke={C.faint}
            strokeWidth={0.6}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      <line
        x1={0}
        y1={100}
        x2={100}
        y2={100}
        stroke={C.ink}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={line}
        fill="none"
        stroke={C.ink}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r={2.4} fill={C.red} />
    </svg>
  );
}

// Match rendered as a mono figure with a compact red-marked mini-ruler.
function MatchMeter({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  return (
    <div className="inline-flex flex-col" aria-label={`Match ${value} procent`}>
      <div className="flex items-baseline gap-1">
        <span
          className={`font-semibold tabular-nums ${size === "sm" ? "text-[18px]" : "text-[26px]"}`}
          style={{ ...mono, color: C.ink }}
        >
          {value}
        </span>
        <span
          className="text-[10px] font-medium uppercase tracking-[0.14em]"
          style={{ ...mono, color: C.muted }}
        >
          %match
        </span>
      </div>
      <div className="relative mt-1 h-1 w-24" aria-hidden="true">
        <span className="absolute inset-0 block" style={{ background: C.line }} />
        <span
          className="absolute inset-y-0 left-0 block transition-[width] duration-500"
          style={{ width: `${value}%`, background: C.ink }}
        />
        <span
          className="absolute top-1/2 h-3 w-[2px] -translate-y-1/2"
          style={{ left: `${value}%`, background: C.red }}
        />
      </div>
    </div>
  );
}

// ---- Status vocabulary (label + icon, never colour alone) -------------------

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  fill: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, tone: C.ink, fill: C.ink };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.ink2, fill: "transparent" };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, tone: C.red, fill: C.redSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red, fill: C.red };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const { label, Icon, tone, fill } = statusMeta(status);
  const solid = fill === C.ink || fill === C.red;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-1 text-[11px] font-semibold"
      style={{
        ...sans,
        color: solid ? "#fff" : tone,
        background: solid ? fill : fill === "transparent" ? C.paper : fill,
        border: `1px solid ${solid ? fill : C.line}`,
      }}
    >
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </span>
  );
}

// ---- Layout primitives ------------------------------------------------------

function cardStyle(): CSSProperties {
  return { background: C.paper, border: `1px solid ${C.line}`, borderRadius: 4 };
}

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
    <section className={className} style={{ ...cardStyle(), ...style }}>
      {children}
    </section>
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
    <div className="mb-7 border-b pb-5" style={{ borderColor: C.line }}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[11px] font-semibold tabular-nums" style={{ ...mono, color: C.red }}>
          {SCREEN_INDEX[screenKey]}
        </span>
        <span className="block h-px w-6" style={{ background: C.ink }} aria-hidden="true" />
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.22em]"
          style={{ ...mono, color: C.muted }}
        >
          {screenKey}
        </span>
      </div>
      <h1
        className="text-[27px] font-semibold leading-tight tracking-tight sm:text-[32px]"
        style={{ ...sans, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed" style={{ ...sans, color: C.ink2 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const voornaam = PROFIEL.naam.split(" ")[0];
  const top = OPDRACHTEN[0] as Opdracht;
  return (
    <div>
      <div className="mb-7 border-b pb-5" style={{ borderColor: C.line }}>
        <div className="mb-2 flex items-center gap-2">
          <Ruler size={14} strokeWidth={2} style={{ color: C.red }} aria-hidden="true" />
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ ...mono, color: C.muted }}
          >
            {PROFIEL.plaats} · schaal 0–100
          </span>
        </div>
        <h1
          className="text-[30px] font-semibold leading-none tracking-tight sm:text-[38px]"
          style={{ ...sans, color: C.ink }}
        >
          Dag, {voornaam}
        </h1>
        <p className="mt-2 text-[14px]" style={{ ...sans, color: C.muted }}>
          Elke waarde op de meetlat — precies waar hij staat, niets verborgen.
        </p>
      </div>

      <div
        className="mb-8 grid grid-cols-1 gap-px overflow-hidden rounded sm:grid-cols-2 lg:grid-cols-4"
        style={{ background: C.line }}
      >
        {KPIS.map((k) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const sparkMin = Math.floor(Math.min(...k.spark));
          const sparkMax = Math.ceil(Math.max(...k.spark));
          return (
            <div key={k.label} className="p-4" style={{ background: C.paper }}>
              <div className="flex items-start justify-between gap-2">
                <span
                  className="text-[10.5px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...sans, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ ...mono, color: k.up ? C.ink : C.red }}
                >
                  <Trend size={11} strokeWidth={2.2} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-1.5 text-[26px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-3">
                <AxisSpark data={k.spark} />
              </div>
              <div
                className="mt-1 flex justify-between text-[9px] tabular-nums"
                style={{ ...mono, color: C.faint }}
              >
                <span>{sparkMin}</span>
                <span>7 wk</span>
                <span>{sparkMax}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="text-[11px] font-semibold tabular-nums"
              style={{ ...mono, color: C.red }}
            >
              →
            </span>
            <h2
              className="text-[13px] font-semibold uppercase tracking-[0.16em]"
              style={{ ...sans, color: C.ink }}
            >
              Beste match
            </h2>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group block w-full p-5 text-left transition-colors hover:bg-[#fafafa] ${RING}`}
            style={cardStyle()}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <MatchMeter value={top.match} />
              <span className="text-[10px] tabular-nums" style={{ ...mono, color: C.faint }}>
                {top.id}
              </span>
            </div>
            <h3
              className="mt-3 text-[18px] font-semibold leading-tight"
              style={{ ...sans, color: C.ink }}
            >
              {top.titel}
            </h3>
            <p className="mt-0.5 text-[13px]" style={{ ...sans, color: C.muted }}>
              {top.opdrachtgever} · {top.plaats} · {top.tarief}
            </p>
            <div className="mt-4">
              <Meetlat value={top.match} min={0} max={100} unit="%" label="matchschaal" />
            </div>
            <span
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold"
              style={{ ...sans, color: C.ink }}
            >
              Open opdracht
              <ArrowRight
                size={14}
                strokeWidth={2.2}
                className="transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </button>

          <Panel className="mt-5 flex items-start gap-4 p-5">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded"
              style={{ background: C.ink, color: "#fff" }}
              aria-hidden="true"
            >
              <ShieldCheck size={22} strokeWidth={2} />
            </span>
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
                  {PROFIEL.trust}
                </span>
                <BadgeCheck size={15} strokeWidth={2} style={{ color: C.ink }} aria-hidden="true" />
              </div>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ ...sans, color: C.ink2 }}>
                Je documenten zijn geverifieerd — opdrachtgevers zien meteen waar je staat op de
                schaal.
              </p>
            </div>
          </Panel>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="text-[11px] font-semibold tabular-nums"
              style={{ ...mono, color: C.red }}
            >
              !
            </span>
            <h2
              className="text-[13px] font-semibold uppercase tracking-[0.16em]"
              style={{ ...sans, color: C.ink }}
            >
              Volgende stappen
            </h2>
          </div>
          <ul className="space-y-px overflow-hidden rounded" style={{ background: C.line }}>
            {ACTIES.map((a, i) => (
              <li key={a.titel} className="p-4" style={{ background: C.paper }}>
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] tabular-nums" style={{ ...mono, color: C.faint }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="text-[12.5px] font-semibold leading-snug"
                    style={{ ...sans, color: C.ink }}
                  >
                    {a.titel}
                  </span>
                </div>
                <div
                  className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold"
                  style={{ ...sans, color: a.urgentie === "warning" ? C.red : C.ink }}
                >
                  {a.cta}
                  <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
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
  onOpen,
}: {
  query: string;
  setQuery: (v: string) => void;
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
        title="Opdrachten op de meetlat"
        sub="We tonen eerlijk hoe hoog een opdracht scoort — en waar de lijn afwijkt."
      />

      <div
        className="mb-6 flex items-center gap-2 rounded px-4 py-2.5"
        style={{ background: C.paper, border: `1px solid ${C.line}` }}
      >
        <Search size={16} className="shrink-0" style={{ color: C.muted }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[14px] outline-none placeholder:opacity-60"
          style={{ ...sans, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`rounded px-3 py-1 text-[11px] font-semibold ${RING}`}
            style={{ ...sans, color: "#fff", background: C.ink }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <div className="relative h-8 w-40" aria-hidden="true">
            <span
              className="absolute left-0 right-0 top-4 block h-px"
              style={{ background: C.line }}
            />
            {[0, 25, 50, 75, 100].map((t) => (
              <span
                key={t}
                className="absolute top-4 block h-2 w-px"
                style={{ left: `${t}%`, background: C.faint }}
              />
            ))}
          </div>
          <h3 className="text-[19px] font-semibold" style={{ ...sans, color: C.ink }}>
            Geen meting gevonden
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Geen opdracht past bij &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <button
            onClick={() => setQuery("")}
            className={`mt-1 rounded px-5 py-2 text-[13px] font-semibold text-white ${RING}`}
            style={{ ...sans, background: C.ink }}
          >
            Filter wissen
          </button>
        </Panel>
      ) : (
        <ul className="space-y-px overflow-hidden rounded" style={{ background: C.line }}>
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                onClick={() => onOpen(o)}
                className={`group grid w-full grid-cols-1 gap-4 p-5 text-left transition-colors hover:bg-[#fafafa] sm:grid-cols-[auto_1fr_auto] sm:items-center ${RING}`}
                style={{ background: C.paper }}
              >
                <div className="shrink-0">
                  <MatchMeter value={o.match} size="sm" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] tabular-nums" style={{ ...mono, color: C.faint }}>
                      {o.id}
                    </span>
                    <h3
                      className="truncate text-[16px] font-semibold"
                      style={{ ...sans, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                  </div>
                  <div
                    className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]"
                    style={{ ...sans, color: C.muted }}
                  >
                    <span>{o.opdrachtgever}</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} strokeWidth={2} aria-hidden="true" />
                      {o.plaats}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Wallet size={12} strokeWidth={2} aria-hidden="true" />
                      {o.tarief}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} strokeWidth={2} aria-hidden="true" />
                      {o.uren}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-[3px] px-2 py-0.5 text-[11px]"
                        style={{ ...sans, color: C.ink2, border: `1px solid ${C.line}` }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  strokeWidth={2}
                  className="hidden shrink-0 transition-transform group-hover:translate-x-1 sm:block"
                  style={{ color: C.ink }}
                  aria-hidden="true"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [applied, setApplied] = useState(false);
  const tarief = parseInt(opdracht.tarief.replace(/[^0-9]/g, ""), 10) || 0;
  const uren = parseInt(opdracht.uren.replace(/[^0-9]/g, ""), 10) || 0;
  return (
    <div>
      <button
        onClick={onBack}
        className={`mb-5 inline-flex items-center gap-1.5 rounded px-3.5 py-1.5 text-[12px] font-semibold ${RING}`}
        style={{ ...sans, color: C.ink2, background: C.paper, border: `1px solid ${C.line}` }}
      >
        <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
        Terug naar marktplaats
      </button>

      <Panel className="p-6">
        <div
          className="flex flex-wrap items-start justify-between gap-4 border-b pb-5"
          style={{ borderColor: C.line }}
        >
          <div>
            <span className="text-[10px] tabular-nums" style={{ ...mono, color: C.faint }}>
              {opdracht.id}
            </span>
            <h2
              className="mt-1 text-[24px] font-semibold leading-tight tracking-tight"
              style={{ ...sans, color: C.ink }}
            >
              {opdracht.titel}
            </h2>
            <p className="mt-1 text-[14px]" style={{ ...sans, color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchMeter value={opdracht.match} />
        </div>

        <div className="mt-5">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ ...mono, color: C.muted }}
          >
            Matchschaal
          </span>
          <div className="mt-3">
            <Meetlat
              value={opdracht.match}
              min={0}
              max={100}
              unit="%"
              label="0 = geen · 100 = perfect"
            />
          </div>
        </div>

        <dl
          className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded sm:grid-cols-4"
          style={{ background: C.line }}
        >
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m) => (
            <div key={m.label} className="p-3.5" style={{ background: C.paper }}>
              <m.Icon size={14} strokeWidth={2} style={{ color: C.red }} aria-hidden="true" />
              <dt
                className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...sans, color: C.muted }}
              >
                {m.label}
              </dt>
              <dd
                className="text-[14px] font-semibold tabular-nums"
                style={{ ...mono, color: C.ink }}
              >
                {m.value}
              </dd>
            </div>
          ))}
        </dl>

        {(tarief > 0 || uren > 0) && (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.muted }}
              >
                Tarief op schaal (€/u)
              </span>
              <div className="mt-3">
                <Meetlat value={tarief} min={30} max={80} unit="" ticks={5} />
              </div>
            </div>
            <div>
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.muted }}
              >
                Inzet op schaal (u/week)
              </span>
              <div className="mt-3">
                <Meetlat value={uren} min={0} max={40} unit="" ticks={4} />
              </div>
            </div>
          </div>
        )}
      </Panel>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="p-5">
          <div className="mb-3 inline-flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded"
              style={{ background: C.ink, color: "#fff" }}
              aria-hidden="true"
            >
              <Plus size={13} strokeWidth={2.6} />
            </span>
            <span className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...sans, color: C.ink2 }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.ink }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-5">
          <div className="mb-3 inline-flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded"
              style={{ background: C.red, color: "#fff" }}
              aria-hidden="true"
            >
              <Minus size={13} strokeWidth={2.6} />
            </span>
            <span className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
              Even op letten
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...sans, color: C.ink2 }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.red }}
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
          className={`inline-flex items-center gap-2 rounded px-6 py-3 text-[14px] font-semibold text-white ${RING}`}
          style={{ ...sans, background: applied ? C.red : C.ink }}
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
        screenKey="verificatie"
        title="Documenten, exact gemeten"
        sub="Elke status heeft een eigen label én icoon — herkenbaar zonder op kleur te hoeven leunen."
      />

      <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const m = statusMeta(s);
          return (
            <div key={s} className="p-3" style={cardStyle()}>
              <m.Icon size={16} strokeWidth={2.2} style={{ color: m.tone }} aria-hidden="true" />
              <div className="mt-2 text-[12px] font-semibold" style={{ ...sans, color: C.ink }}>
                {m.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="space-y-px overflow-hidden rounded" style={{ background: C.line }}>
            {CREDENTIALS.map((c) => {
              const done = checked.has(c.naam);
              return (
                <li
                  key={c.naam}
                  className="flex items-center gap-3 p-4"
                  style={{ background: C.paper }}
                >
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded ${RING}`}
                    style={{
                      border: `1.5px solid ${done ? C.ink : C.line}`,
                      background: done ? C.ink : "transparent",
                      color: "#fff",
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
                  <StatusTag status={c.status} />
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...sans, color: C.ink }}
            >
              <FileText size={15} strokeWidth={2} style={{ color: C.red }} aria-hidden="true" />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center rounded ${RING}`}
              style={{ background: C.paper, color: C.ink, border: `1px solid ${C.line}` }}
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
                className={`rounded px-3 py-1 text-[11px] font-semibold ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? "#fff" : C.muted,
                  background: feedState === s ? C.ink : C.paper,
                  border: `1px solid ${feedState === s ? C.ink : C.line}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="p-3.5" style={cardStyle()}>
                  <div
                    className="h-3 w-2/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </li>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Panel className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span
                className="flex h-11 w-11 items-center justify-center rounded"
                style={{ background: C.redSoft, color: C.red }}
                aria-hidden="true"
              >
                <CircleAlert size={22} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-semibold" style={{ ...sans, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.muted }}>
                We konden je documentenkluis niet meten. Probeer het zo nog eens.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className={`mt-1 rounded px-4 py-2 text-[12px] font-semibold text-white ${RING}`}
                style={{ ...sans, background: C.ink }}
              >
                Opnieuw proberen
              </button>
            </Panel>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <li key={d.naam} className="flex items-center gap-3 p-3" style={cardStyle()}>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-[9px] font-bold"
                    style={{
                      ...mono,
                      background: C.bg,
                      color: C.ink2,
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
                    <div className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
                      {d.grootte} · {d.bijgewerkt}
                    </div>
                  </div>
                  <StatusTag status={d.status} />
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
      <ScreenHead screenKey="acties" title="Wat vandaag om aandacht vraagt" />

      {openCount === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <div className="relative h-8 w-44" aria-hidden="true">
            <span
              className="absolute left-0 right-0 top-4 block h-px"
              style={{ background: C.ink }}
            />
            <span
              className="absolute top-1 h-6 w-[2px]"
              style={{ left: "100%", transform: "translateX(-50%)", background: C.red }}
            />
          </div>
          <h3 className="text-[19px] font-semibold" style={{ ...sans, color: C.ink }}>
            Alles op nul
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Geen openstaande punten meer vandaag. De meter staat schoon.
          </p>
        </Panel>
      ) : (
        <>
          <div className="mb-5 inline-flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded text-[13px] font-bold tabular-nums text-white"
              style={{ ...mono, background: C.red }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ ...sans, color: C.ink }}>
              {openCount} {openCount === 1 ? "punt" : "punten"} open
            </span>
          </div>

          <ul className="space-y-px overflow-hidden rounded" style={{ background: C.line }}>
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <li
                  key={a.titel}
                  className="flex items-start gap-4 p-5"
                  style={{ background: C.paper }}
                >
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded ${RING}`}
                    style={{
                      border: `1.5px solid ${isDone ? C.ink : C.line}`,
                      background: isDone ? C.ink : "transparent",
                      color: "#fff",
                    }}
                  >
                    {isDone && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] tabular-nums"
                        style={{ ...mono, color: C.faint }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em]"
                        style={{
                          ...sans,
                          color: warn ? C.red : C.ink2,
                          border: `1px solid ${warn ? C.red : C.line}`,
                        }}
                      >
                        {warn ? "Urgent" : "Info"}
                      </span>
                    </div>
                    <div
                      className="mt-1.5 text-[15px] font-semibold leading-snug"
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
                      style={{ ...sans, color: C.muted, opacity: isDone ? 0.5 : 1 }}
                    >
                      {a.detail}
                    </p>
                    {!isDone && (
                      <span
                        className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold"
                        style={{ ...sans, color: warn ? C.red : C.ink }}
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
  const bedragen = FACTUREN.map((f) => parseInt(f.bedrag.replace(/[^0-9]/g, ""), 10) || 0);
  const maxBedrag = Math.max(...bedragen, 1);
  const statusMark = (status: string): { Icon: LucideIcon; tone: string; fill: string } =>
    status === "Betaald"
      ? { Icon: Check, tone: "#fff", fill: C.ink }
      : status === "Openstaand"
        ? { Icon: Clock, tone: C.red, fill: C.redSoft }
        : { Icon: FileText, tone: C.muted, fill: C.bg };
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Je facturen"
        sub="Bedragen op één schaal — zo zie je in één oogopslag wat openstaat."
      />

      <div
        className="mb-6 grid grid-cols-1 gap-px overflow-hidden rounded sm:grid-cols-3"
        style={{ background: C.line }}
      >
        {[
          { label: "Betaald (mnd)", value: "€ 5.552" },
          { label: "Openstaand", value: "€ 1.350", warn: true },
          { label: "Concept", value: "€ 880" },
        ].map((s) => (
          <div key={s.label} className="p-4" style={{ background: C.paper }}>
            <div
              className="text-[10.5px] font-medium uppercase tracking-[0.1em]"
              style={{ ...sans, color: C.muted }}
            >
              {s.label}
            </div>
            <div
              className="mt-1 text-[24px] font-semibold tabular-nums"
              style={{ ...mono, color: s.warn ? C.red : C.ink }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.ink}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Op schaal", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ ...mono, color: C.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const m = statusMark(f.status);
                const solid = f.status === "Betaald";
                const w = ((bedragen[i] ?? 0) / maxBedrag) * 100;
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#fafafa]"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-4 py-3 text-[12.5px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ ...sans, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12.5px] tabular-nums"
                      style={{ ...mono, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-4 py-3 text-[13px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative h-1.5 w-24" aria-hidden="true">
                        <span
                          className="absolute inset-0 block rounded-sm"
                          style={{ background: C.lineSoft }}
                        />
                        <span
                          className="absolute inset-y-0 left-0 block rounded-sm"
                          style={{ width: `${w}%`, background: C.ink }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-1 text-[11px] font-semibold"
                        style={{
                          ...sans,
                          color: solid ? "#fff" : m.tone,
                          background: m.fill,
                          border: `1px solid ${solid ? C.ink : C.line}`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" />
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

export function Concept274() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [query, setQuery] = useState("");
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

  const gridBg = `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...sans, color: C.ink, background: C.bg }}
    >
      <div
        className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8"
        style={{ backgroundImage: gridBg, backgroundSize: "28px 28px" }}
      >
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded text-white"
              style={{ background: C.ink }}
              aria-hidden="true"
            >
              <Ruler size={19} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[18px] font-semibold tracking-tight"
                style={{ ...sans, color: C.ink }}
              >
                Getallenas
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.muted }}
              >
                ZZP platform · schaal 0–100
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
                style={{ ...sans, color: C.ink2 }}
              >
                <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded text-[13px] font-bold text-white"
              style={{ ...mono, background: C.red }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav className="mb-8 flex flex-wrap gap-1 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICONS[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: on ? "#fff" : C.ink2,
                  background: on ? C.ink : C.paper,
                  border: `1px solid ${on ? C.ink : C.line}`,
                }}
              >
                <span className="text-[9px] tabular-nums opacity-70" style={{ ...mono }}>
                  {SCREEN_INDEX[s.key]}
                </span>
                <Icon size={14} strokeWidth={2} aria-hidden="true" />
                {s.label}
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
              onOpen={(o) => {
                setActive(o);
                setScreen("opdracht");
              }}
            />
          )}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
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
            <Ruler size={12} strokeWidth={2} style={{ color: C.red }} aria-hidden="true" />
            {SCREENS.length} schermen · meetlat v274
          </span>
          <span>Alles op schaal</span>
        </footer>
      </div>
    </div>
  );
}
