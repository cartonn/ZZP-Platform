"use client";

// Concept 262 — "Reisaffiche" · Vintage reisposter, 1930s (light).
// Signature: art-deco travel-poster energy on warm cream. Flat, bold geometric SVG bands render
// a stylised Dutch landscape (a rising sun in concentric arcs, layered cloud ridges, a low
// horizon) as the hero — KLM/spoorweg-affiche in feel, but a strict grid beneath keeps the data
// razor-clear. Opdrachten read as "bestemmingen"; the match score is a distance dial. Condensed
// display type shouts the headlines; a calm sans carries the body.
// Fonts: Anton (condensed poster display) + Inter (body). Teal #0e7c86 + ochre #c8892b on #f3ead4.

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
  Plane,
  Compass,
  Ticket,
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

// Warm 1930s poster palette. Ink stays near-black on cream for AA body text.
const C = {
  cream: "#f3ead4",
  cream2: "#ecdfc2",
  paper: "#faf3e2",
  paperSoft: "#f1e6cc",
  line: "#d8c79f",
  lineSoft: "#e2d3ac",
  ink: "#24201a",
  inkSoft: "#4a4234",
  muted: "#7a6f57",
  faint: "#a3906c",
  teal: "#0e7c86",
  tealDeep: "#0a5b63",
  tealSoft: "#d3e6e6",
  ochre: "#c8892b",
  ochreDeep: "#9a6716",
  ochreSoft: "#f0e2c1",
  red: "#b23a2e",
  redSoft: "#f0d9d2",
  green: "#3d7a45",
  greenSoft: "#dbe8d6",
  sky: "#e9d9b3",
};

const display = { fontFamily: "var(--font-lab-anton)" };
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7c86] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3ead4]";

// The recurring hero band: a flat art-deco Dutch landscape — sun arcs, cloud ridges, horizon.
function PosterBand({ height = 150 }: { height?: number }) {
  return (
    <svg
      viewBox="0 0 400 150"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height, display: "block" }}
      aria-hidden="true"
    >
      <rect x={0} y={0} width={400} height={150} fill={C.sky} />
      {/* concentric sun arcs */}
      {[52, 40, 28, 16].map((r, i) => (
        <circle
          key={r}
          cx={300}
          cy={96}
          r={r}
          fill="none"
          stroke={i % 2 === 0 ? C.ochre : C.ochreDeep}
          strokeWidth={6}
          opacity={0.9 - i * 0.05}
        />
      ))}
      <circle cx={300} cy={96} r={9} fill={C.ochre} />
      {/* cloud ridges */}
      <path d="M0 44 Q 60 24 120 40 T 260 34 T 400 42 V0 H0 Z" fill={C.tealSoft} opacity={0.7} />
      <path
        d="M0 60 Q 80 44 150 58 T 300 52 T 400 60 V44 Q 300 34 200 44 T 0 44 Z"
        fill={C.teal}
        opacity={0.28}
      />
      {/* horizon fields */}
      <path d="M0 150 V104 L400 88 V150 Z" fill={C.teal} />
      <path d="M0 150 V120 L400 108 V150 Z" fill={C.tealDeep} />
      {/* a small stylised aircraft silhouette */}
      <g transform="translate(96 40) rotate(-8)" fill={C.ink} opacity={0.82}>
        <path d="M0 6 L34 4 L46 8 L34 12 L0 10 Z" />
        <path d="M18 6 L10 -8 L16 -8 L26 6 Z" />
        <path d="M18 10 L10 22 L16 22 L26 10 Z" />
      </g>
    </svg>
  );
}

function cardStyle(soft = false): CSSProperties {
  return {
    background: soft ? C.paperSoft : C.paper,
    border: `1.5px solid ${C.line}`,
    borderRadius: 3,
    boxShadow: "3px 3px 0 rgba(36,32,26,0.06)",
  };
}

function Card({
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
      return { label: "Afgestempeld", Icon: BadgeCheck, fg: C.green, bg: C.greenSoft };
    case "SUBMITTED":
      return { label: "Aan de balie", Icon: Clock, fg: C.tealDeep, bg: C.tealSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, fg: C.ochreDeep, bg: C.ochreSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.red, bg: C.redSoft };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, fg, bg } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em]"
      style={{ ...sans, color: fg, background: bg, border: `1.5px solid ${fg}`, borderRadius: 2 }}
    >
      <Icon size={12} strokeWidth={2} aria-hidden="true" />
      {label}
    </span>
  );
}

// The match score as a poster "distance dial" — a bold arc gauge with a stamped number.
function DistanceDial({ value, size = 60 }: { value: number; size?: number }) {
  const r = 25;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <circle cx={32} cy={32} r={r} fill={C.cream} stroke={C.line} strokeWidth={4} />
        <circle
          cx={32}
          cy={32}
          r={r}
          fill="none"
          stroke={C.teal}
          strokeWidth={4}
          strokeLinecap="butt"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[18px] tabular-nums" style={{ ...display, color: C.tealDeep }}>
          {value}
        </span>
        <span
          className="text-[7px] font-bold uppercase tracking-[0.14em]"
          style={{ ...sans, color: C.muted }}
        >
          match
        </span>
      </span>
    </span>
  );
}

// A blocky poster sparkline — filled bars in ochre with a teal cap line.
function PosterSpark({ data, height = 32 }: { data: number[]; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const n = data.length;
  const bw = 100 / n;
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      {data.map((v, i) => {
        const h = ((v - min) / span) * 72 + 8;
        return (
          <rect
            key={i}
            x={i * bw + bw * 0.18}
            y={100 - h}
            width={bw * 0.64}
            height={h}
            fill={C.ochre}
            opacity={0.35 + (i / n) * 0.55}
          />
        );
      })}
      <polyline
        points={data
          .map((v, i) => `${i * bw + bw / 2},${100 - (((v - min) / span) * 72 + 8)}`)
          .join(" ")}
        fill="none"
        stroke={C.teal}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function ScreenHead({ title, sub, kicker }: { title: string; sub?: string; kicker?: string }) {
  return (
    <div className="mb-6">
      {kicker && (
        <div
          className="mb-2 inline-flex items-center gap-2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ ...sans, color: C.paper, background: C.teal, borderRadius: 2 }}
        >
          {kicker}
        </div>
      )}
      <h1
        className="text-[34px] uppercase leading-[0.92] tracking-[0.01em] sm:text-[42px]"
        style={{ ...display, color: C.ink }}
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
      <Card className="relative mb-8 overflow-hidden" style={{ borderRadius: 3 }}>
        <PosterBand height={160} />
        <div className="flex flex-wrap items-end justify-between gap-4 px-5 py-5 sm:px-7">
          <div>
            <div
              className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{ ...sans, color: C.tealDeep }}
            >
              <Compass size={12} strokeWidth={2.2} aria-hidden="true" />
              Vertrekhal · {PROFIEL.plaats}
            </div>
            <h1
              className="text-[36px] uppercase leading-[0.9] sm:text-[46px]"
              style={{ ...display, color: C.ink }}
            >
              Goeiereis, {voornaam}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...sans, color: C.inkSoft }}>
              Je route ligt klaar. Eén bestemming vraagt vandaag om je kaartje.
            </p>
          </div>
        </div>
      </Card>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <Card key={k.label} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...sans, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                  style={{ ...sans, color: k.up ? C.green : C.ochreDeep }}
                >
                  <Trend size={11} strokeWidth={2.2} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-1 text-[28px] tabular-nums leading-none"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-2">
                <PosterSpark data={k.spark} />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Ticket size={16} strokeWidth={2.2} style={{ color: C.teal }} aria-hidden="true" />
            <h2
              className="text-[15px] uppercase tracking-[0.06em]"
              style={{ ...display, color: C.ink }}
            >
              Beste bestemming
            </h2>
          </div>
          <button
            onClick={onOpen}
            className={`group flex w-full items-start gap-4 p-5 text-left transition-transform hover:-translate-y-0.5 ${RING}`}
            style={cardStyle()}
          >
            <DistanceDial value={top.match} />
            <div className="min-w-0 flex-1">
              <div
                className="text-[19px] uppercase leading-tight"
                style={{ ...display, color: C.ink }}
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
                    className="px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{
                      ...sans,
                      color: C.inkSoft,
                      border: `1.5px solid ${C.line}`,
                      borderRadius: 2,
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
              style={{ color: C.teal }}
              aria-hidden="true"
            />
          </button>

          <Card soft className="mt-6 flex items-start gap-4 p-5">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center"
              style={{ background: C.green, color: C.paper, borderRadius: 2 }}
              aria-hidden="true"
            >
              <ShieldCheck size={24} strokeWidth={2} />
            </span>
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[16px] uppercase" style={{ ...display, color: C.ink }}>
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
                Je papieren zijn afgestempeld en in orde — opdrachtgevers zien meteen dat je
                reisklaar bent.
              </p>
            </div>
          </Card>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <ListTodo size={16} strokeWidth={2.2} style={{ color: C.teal }} aria-hidden="true" />
            <h2
              className="text-[15px] uppercase tracking-[0.06em]"
              style={{ ...display, color: C.ink }}
            >
              Reisschema
            </h2>
          </div>
          <ul className="space-y-2.5">
            {ACTIES.map((a) => (
              <Card key={a.titel} className="p-3.5">
                <div className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 h-3 w-3 shrink-0"
                    style={{
                      background: a.urgentie === "warning" ? C.ochre : C.teal,
                      borderRadius: 1,
                    }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <div
                      className="text-[13px] font-semibold leading-snug"
                      style={{ ...sans, color: C.ink }}
                    >
                      {a.titel}
                    </div>
                    <div
                      className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.04em]"
                      style={{ ...sans, color: C.tealDeep }}
                    >
                      {a.cta}
                    </div>
                  </div>
                </div>
              </Card>
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
        kicker="Marktplaats · bestemmingen"
        title="Waar reis je heen?"
        sub="Elke opdracht is een bestemming — we tonen eerlijk waarom zij past en waar het schuurt."
      />

      <div className="mb-6 flex items-center gap-2 px-4 py-2.5" style={cardStyle()}>
        <Search size={16} className="shrink-0" style={{ color: C.teal }} aria-hidden="true" />
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
            className={`px-2.5 py-1 text-[11px] font-bold uppercase ${RING}`}
            style={{ ...sans, color: C.tealDeep, background: C.tealSoft, borderRadius: 2 }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <Plane size={40} strokeWidth={1.6} style={{ color: C.teal }} aria-hidden="true" />
          <h3 className="text-[24px] uppercase" style={{ ...display, color: C.ink }}>
            Geen route gevonden
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Geen bestemming voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm — het net is
            uitgestrekt.
          </p>
          <button
            onClick={() => setQuery("")}
            className={`mt-1 px-5 py-2 text-[13px] font-bold uppercase ${RING}`}
            style={{ ...sans, color: C.paper, background: C.teal, borderRadius: 2 }}
          >
            Filter wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <Card
                key={o.id}
                className="flex h-full flex-col overflow-hidden transition-transform hover:-translate-y-0.5"
              >
                <div className="relative">
                  <PosterBand height={72} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center transition-colors ${RING}`}
                    style={{
                      background: isSaved ? C.teal : C.paper,
                      color: isSaved ? C.paper : C.muted,
                      border: `1.5px solid ${isSaved ? C.teal : C.line}`,
                      borderRadius: 2,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={15} strokeWidth={2} aria-hidden="true" />
                    ) : (
                      <Bookmark size={15} strokeWidth={2} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="-mt-11 mb-2 flex items-end justify-between">
                    <DistanceDial value={o.match} size={54} />
                  </div>
                  <h3
                    className="text-[18px] uppercase leading-tight"
                    style={{ ...display, color: C.ink }}
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
                    className={`group mt-4 inline-flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-bold uppercase transition-colors ${RING}`}
                    style={{ ...sans, color: C.paper, background: C.teal, borderRadius: 2 }}
                  >
                    Boek bestemming
                    <ArrowRight
                      size={14}
                      strokeWidth={2}
                      className="transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </Card>
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
        className={`mb-5 inline-flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-bold uppercase ${RING}`}
        style={{
          ...sans,
          color: C.inkSoft,
          background: C.paperSoft,
          border: `1.5px solid ${C.line}`,
          borderRadius: 2,
        }}
      >
        <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
        Terug naar de kaart
      </button>

      <Card className="overflow-hidden">
        <PosterBand height={110} />
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <DistanceDial value={opdracht.match} size={70} />
              <div>
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{ ...sans, color: C.tealDeep }}
                >
                  {opdracht.id}
                </div>
                <h2
                  className="text-[28px] uppercase leading-tight"
                  style={{ ...display, color: C.ink }}
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
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold uppercase ${RING}`}
              style={{
                ...sans,
                color: isSaved ? C.paper : C.inkSoft,
                background: isSaved ? C.teal : C.paperSoft,
                border: `1.5px solid ${isSaved ? C.teal : C.line}`,
                borderRadius: 2,
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
                style={{
                  background: C.paperSoft,
                  border: `1.5px solid ${C.line}`,
                  borderRadius: 2,
                }}
              >
                <m.Icon size={14} strokeWidth={2} style={{ color: C.teal }} aria-hidden="true" />
                <div
                  className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.1em]"
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
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.green, color: C.paper, borderRadius: 2 }}
              aria-hidden="true"
            >
              <Plus size={13} strokeWidth={2.6} />
            </span>
            <span
              className="text-[14px] uppercase tracking-[0.04em]"
              style={{ ...display, color: C.ink }}
            >
              Waarom deze route past
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
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.ochre, color: C.paper, borderRadius: 2 }}
              aria-hidden="true"
            >
              <Minus size={13} strokeWidth={2.6} />
            </span>
            <span
              className="text-[14px] uppercase tracking-[0.04em]"
              style={{ ...display, color: C.ink }}
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
                  style={{ color: C.ochreDeep }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className={`inline-flex items-center gap-2 px-6 py-3 text-[14px] font-bold uppercase transition-colors ${RING}`}
          style={{
            ...sans,
            color: C.paper,
            background: applied ? C.green : C.teal,
            borderRadius: 2,
          }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.4} aria-hidden="true" />
          ) : (
            <Ticket size={17} strokeWidth={2} aria-hidden="true" />
          )}
          {applied ? "Kaartje geboekt" : "Boek deze reis"}
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
        kicker="Verificatie · de paspoortbalie"
        title="Reispapieren op orde"
        sub="Je gevoelige papieren bewaren we versleuteld — en stempelen we pas af na zorgvuldige controle."
      />

      <Card soft className="mb-6 flex items-center gap-4 p-5">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center"
          style={{ background: C.green, color: C.paper, borderRadius: 2 }}
          aria-hidden="true"
        >
          <ShieldCheck size={24} strokeWidth={2} />
        </span>
        <div>
          <div className="text-[16px] uppercase" style={{ ...display, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[13px]" style={{ ...sans, color: C.inkSoft }}>
            Je documenten worden versleuteld bewaard en alleen met jouw toestemming gedeeld.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            return (
              <Card key={c.naam} className="flex items-center gap-3 p-4">
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center transition-colors ${RING}`}
                  style={{
                    border: `2px solid ${done ? C.teal : C.line}`,
                    background: done ? C.teal : "transparent",
                    color: C.paper,
                    borderRadius: 2,
                  }}
                >
                  {done && <Check size={15} strokeWidth={3} aria-hidden="true" />}
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
              </Card>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[15px] uppercase tracking-[0.04em]"
              style={{ ...display, color: C.ink }}
            >
              <FileText size={16} strokeWidth={2.2} style={{ color: C.teal }} aria-hidden="true" />
              Bagagekluis
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center ${RING}`}
              style={{
                background: C.paperSoft,
                color: C.teal,
                border: `1.5px solid ${C.line}`,
                borderRadius: 2,
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
                className={`px-3 py-1 text-[11px] font-bold uppercase ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? C.paper : C.muted,
                  background: feedState === s ? C.teal : C.paperSoft,
                  border: `1.5px solid ${feedState === s ? C.teal : C.line}`,
                  borderRadius: 2,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Card key={i} className="p-3.5">
                  <div
                    className="h-3 w-2/3 animate-pulse"
                    style={{ background: C.paperSoft, borderRadius: 2 }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse"
                    style={{ background: C.paperSoft, borderRadius: 2 }}
                  />
                </Card>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Card className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center"
                style={{ background: C.red, color: C.paper, borderRadius: 2 }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[16px] uppercase" style={{ ...display, color: C.ink }}>
                Balie gesloten
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.muted }}>
                We konden je bagagekluis niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className={`mt-1 px-4 py-2 text-[12px] font-bold uppercase ${RING}`}
                style={{ ...sans, color: C.paper, background: C.teal, borderRadius: 2 }}
              >
                Opnieuw proberen
              </button>
            </Card>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <Card key={d.naam} className="flex items-center gap-3 p-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{
                      ...sans,
                      background: C.paperSoft,
                      color: C.tealDeep,
                      border: `1.5px solid ${C.line}`,
                      borderRadius: 2,
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
                </Card>
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
      <ScreenHead kicker="Acties · reisschema" title="Wat vandaag op je route staat" />

      {openCount === 0 ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Compass size={40} strokeWidth={1.6} style={{ color: C.teal }} aria-hidden="true" />
          <h3 className="text-[26px] uppercase" style={{ ...display, color: C.ink }}>
            Vrije horizon
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Niets meer op de route vandaag. Geniet van de rit.
          </p>
        </Card>
      ) : (
        <>
          <div
            className="mb-5 inline-flex items-center gap-2 px-3.5 py-2"
            style={{ background: C.tealSoft, border: `1.5px solid ${C.teal}`, borderRadius: 2 }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center text-[12px] tabular-nums"
              style={{ ...display, background: C.teal, color: C.paper, borderRadius: 1 }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span
              className="text-[12.5px] font-bold uppercase"
              style={{ ...sans, color: C.tealDeep }}
            >
              {openCount} {openCount === 1 ? "halte" : "haltes"} op de route
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              return (
                <Card key={a.titel} className="flex items-start gap-4 p-5">
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `2px solid ${isDone ? C.green : C.line}`,
                      background: isDone ? C.green : "transparent",
                      color: C.paper,
                      borderRadius: 2,
                    }}
                  >
                    {isDone && <Check size={16} strokeWidth={3} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[16px] uppercase leading-snug"
                      style={{
                        ...display,
                        color: C.ink,
                        textDecoration: isDone ? "line-through" : "none",
                        opacity: isDone ? 0.5 : 1,
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
                        className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-bold uppercase"
                        style={{
                          ...sans,
                          color: a.urgentie === "warning" ? C.ochreDeep : C.tealDeep,
                          background: a.urgentie === "warning" ? C.ochreSoft : C.tealSoft,
                          border: `1.5px solid ${a.urgentie === "warning" ? C.ochre : C.teal}`,
                          borderRadius: 2,
                        }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </Card>
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
        ? { fg: C.ochreDeep, bg: C.ochreSoft }
        : { fg: C.muted, bg: C.paperSoft };
  return (
    <div>
      <ScreenHead
        kicker="Facturen · het reisboek"
        title="Je reisboek"
        sub="Overzichtelijk en zonder ruis — zo weet je altijd waar je aan toe bent."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-2">
          {[
            { label: "Betaald (mnd)", value: "€ 5.552", tone: C.green },
            { label: "Openstaand", value: "€ 1.350", tone: C.ochreDeep },
            { label: "Concept", value: "€ 880", tone: C.muted },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <div
                className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
                style={{ ...sans, color: C.muted }}
              >
                {s.label}
              </div>
              <div className="mt-1 text-[26px] tabular-nums" style={{ ...display, color: s.tone }}>
                {s.value}
              </div>
            </Card>
          ))}
        </div>
        <Card className="flex flex-col justify-between p-4">
          <div
            className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
            style={{ ...sans, color: C.muted }}
          >
            Bedrag per factuur
          </div>
          <PosterSpark data={trend} height={46} />
        </Card>
      </div>

      <Card className="overflow-hidden p-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.line}` }}>
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
                    className="transition-colors hover:bg-[#f1e6cc]"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12.5px] font-bold tabular-nums"
                      style={{ ...sans, color: C.tealDeep }}
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
                      className="px-3 py-3 text-[15px] tabular-nums"
                      style={{ ...display, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold uppercase"
                        style={{
                          ...sans,
                          color: t.fg,
                          background: t.bg,
                          border: `1.5px solid ${t.fg}`,
                          borderRadius: 2,
                        }}
                      >
                        {f.status === "Betaald" ? (
                          <Check size={11} strokeWidth={2.6} aria-hidden="true" />
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
      </Card>
    </div>
  );
}

// ---- Shell -----------------------------------------------------------------

export function Concept262() {
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
      style={{ ...sans, color: C.ink, background: C.cream }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center"
              style={{ background: C.teal, color: C.paper, borderRadius: 3 }}
              aria-hidden="true"
            >
              <Plane size={19} strokeWidth={2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[22px] uppercase tracking-[0.02em]"
                style={{ ...display, color: C.ink }}
              >
                Reisaffiche
              </div>
              <div
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{ ...sans, color: C.tealDeep }}
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
                className="inline-flex items-center gap-1 text-[11px] font-bold"
                style={{ ...sans, color: C.green }}
              >
                <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center text-[13px]"
              style={{ ...display, background: C.ochre, color: C.paper, borderRadius: 3 }}
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
                className={`inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-bold uppercase tracking-[0.03em] transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: on ? C.paper : C.inkSoft,
                  background: on ? C.teal : C.paper,
                  border: `1.5px solid ${on ? C.teal : C.line}`,
                  borderRadius: 2,
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
          <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.04em]">
            <Compass size={12} strokeWidth={2} style={{ color: C.teal }} aria-hidden="true" />
            Ontdek Nederland · {ACTIES.length} haltes op de route
          </span>
          <span className="uppercase tracking-[0.04em]">Gedrukt met zorg</span>
        </footer>
      </div>
    </div>
  );
}
