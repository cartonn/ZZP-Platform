"use client";

// Concept 276 — "Sgraffito" · Ingekraste pleisterlagen (Italiaanse gevelkunst, light-warm).
// Signature: aardse, tactiele pleisterlagen (terracotta/oker/gebroken-wit) met ingekraste
// hairline-contouren en gegraveerde lijnen als scheidingen. Warm en handgemaakt gevoel,
// humanistische serif-typografie. Warm-menselijk, materiaal-tactiel, rustig.
// Fonts: Cormorant Garamond (koppen) + Newsreader (lopende tekst).

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
  Landmark,
  TrendingUp,
  TrendingDown,
  Bookmark,
  BookmarkCheck,
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

// Earthy plaster palette with incised brown lines.
const C = {
  plaster: "#ece0cd",
  plaster2: "#e4d5bd",
  card: "#f6efe0",
  cardHi: "#fbf6ec",
  terracotta: "#b0502f",
  terracottaDeep: "#8c3d21",
  ocher: "#b5801f",
  olive: "#6f7a3f",
  brick: "#8c2f22",
  ink: "#3c2c1e",
  ink2: "#5d4a38",
  muted: "#8a7259",
  faint: "#a89478",
  line: "#d5bf9d",
  highlight: "#fdf9f1",
};
// Darker incised line used for engraved contours.
const LINE_DARK = "#bfa87f";

const display = { fontFamily: "var(--font-lab-cormorant)" };
const serif = { fontFamily: "var(--font-lab-newsreader)" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c3d21] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ece0cd]";

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

// ---- Signature: incised / engraved surfaces ---------------------------------

// A carved plaster card: hairline border + inset highlight (top) and shadow (bottom).
function carvedStyle(raised = true): CSSProperties {
  return {
    background: `linear-gradient(170deg, ${C.cardHi}, ${C.card})`,
    border: `1px solid ${C.line}`,
    borderRadius: 3,
    boxShadow: raised
      ? `inset 0 1px 0 ${C.highlight}, inset 0 -1px 0 ${LINE_DARK}, 0 1px 2px rgba(60,44,30,0.08)`
      : `inset 0 1px 2px rgba(60,44,30,0.12)`,
  };
}

function Panel({
  children,
  className,
  style,
  raised = true,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  raised?: boolean;
}) {
  return (
    <section className={className} style={{ ...carvedStyle(raised), ...style }}>
      {children}
    </section>
  );
}

// An engraved divider — a scratched double hairline (shadow above a highlight).
function Engraved({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="h-px w-full" style={{ background: LINE_DARK }} />
      <div className="h-px w-full" style={{ background: C.highlight }} />
    </div>
  );
}

// Incised label — small caps, letter-spaced, in engraved brown.
function Incised({ children, tone = C.terracottaDeep }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="text-[10.5px] font-semibold uppercase tracking-[0.24em]"
      style={{ ...serif, color: tone }}
    >
      {children}
    </span>
  );
}

// Sparkline drawn as a scratched line into the plaster (double stroke: shadow + highlight).
function ScratchSpark({
  data,
  tone = C.terracotta,
  height = 40,
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
    const y = 100 - ((v - min) / span) * 70 - 16;
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
      {/* carved shadow underlay, offset down */}
      <polyline
        points={pts.map(([x, y]) => `${x.toFixed(1)},${(y + 1.6).toFixed(1)}`).join(" ")}
        fill="none"
        stroke={C.highlight}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r={2.4} fill={tone} />
    </svg>
  );
}

function MatchSeal({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const tone = value >= 90 ? C.olive : value >= 82 ? C.ocher : C.terracotta;
  return (
    <div className="inline-flex items-center gap-2" aria-label={`Match ${value} procent`}>
      <span
        className={`flex items-center justify-center rounded-full ${size === "sm" ? "h-11 w-11" : "h-14 w-14"}`}
        style={{
          border: `1.5px solid ${tone}`,
          color: tone,
          background: C.cardHi,
          boxShadow: `inset 0 1px 0 ${C.highlight}, inset 0 -1px 0 ${LINE_DARK}`,
        }}
      >
        <span
          className={`font-semibold tabular-nums ${size === "sm" ? "text-[15px]" : "text-[19px]"}`}
          style={{ ...display }}
        >
          {value}
        </span>
      </span>
      {size === "md" && <Incised tone={C.muted}>procent match</Incised>}
    </div>
  );
}

// ---- Status vocabulary (label + icon) ---------------------------------------

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, tone: C.olive };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.ocher };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, tone: C.terracotta };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.brick };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const { label, Icon, tone } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5 text-[11px] font-semibold"
      style={{ ...serif, color: tone, background: C.cardHi, border: `1px solid ${tone}` }}
    >
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </span>
  );
}

function ScreenHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-7">
      <Incised>{eyebrow}</Incised>
      <h1
        className="mt-1.5 text-[34px] font-semibold leading-[1.05] tracking-tight sm:text-[42px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2 max-w-xl text-[15px] leading-relaxed"
          style={{ ...serif, color: C.ink2 }}
        >
          {sub}
        </p>
      )}
      <Engraved className="mt-4" />
    </div>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const voornaam = PROFIEL.naam.split(" ")[0];
  const top = OPDRACHTEN[0] as Opdracht;
  const tones = [C.terracotta, C.ocher, C.olive, C.terracottaDeep];
  return (
    <div>
      <div className="mb-7">
        <Incised>{PROFIEL.plaats} · in pleister gekrast</Incised>
        <h1
          className="mt-1.5 text-[38px] font-semibold leading-none tracking-tight sm:text-[48px]"
          style={{ ...display, color: C.ink }}
        >
          Dag, {voornaam}
        </h1>
        <p className="mt-2 text-[15px]" style={{ ...serif, color: C.muted }}>
          Je overzicht als gevelfresco — laag voor laag ingekrast, rustig te lezen.
        </p>
        <Engraved className="mt-4" />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const tone = tones[i % tones.length] ?? C.terracotta;
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <Panel key={k.label} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <Incised tone={C.muted}>{k.label}</Incised>
                <span
                  className="inline-flex items-center gap-0.5 text-[12px] font-semibold tabular-nums"
                  style={{ ...serif, color: k.up ? C.olive : C.terracotta }}
                >
                  <Trend size={12} strokeWidth={2.2} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-2 text-[30px] font-semibold tabular-nums leading-none"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-2">
                <ScratchSpark data={k.spark} tone={tone} />
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Incised>Beste match</Incised>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group block w-full p-5 text-left transition-transform hover:-translate-y-0.5 ${RING}`}
            style={carvedStyle()}
          >
            <div className="flex items-start gap-4">
              <MatchSeal value={top.match} />
              <div className="min-w-0 flex-1">
                <Incised tone={C.faint}>{top.id}</Incised>
                <h3
                  className="mt-0.5 text-[22px] font-semibold leading-tight"
                  style={{ ...display, color: C.ink }}
                >
                  {top.titel}
                </h3>
                <p className="mt-0.5 text-[14px]" style={{ ...serif, color: C.muted }}>
                  {top.opdrachtgever} · {top.plaats} · {top.tarief}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {top.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11.5px]"
                      style={{
                        ...serif,
                        color: C.ink2,
                        background: C.plaster,
                        border: `1px solid ${C.line}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <ArrowRight
                size={20}
                className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
                style={{ color: C.terracottaDeep }}
                aria-hidden="true"
              />
            </div>
          </button>

          <Panel className="mt-5 flex items-start gap-4 p-5">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
              style={{ background: C.plaster, color: C.olive, border: `1px solid ${C.olive}` }}
              aria-hidden="true"
            >
              <ShieldCheck size={22} strokeWidth={2} />
            </span>
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
                  {PROFIEL.trust}
                </span>
                <BadgeCheck
                  size={15}
                  strokeWidth={2}
                  style={{ color: C.olive }}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-1 text-[14px] leading-relaxed" style={{ ...serif, color: C.ink2 }}>
                Je documenten zijn geverifieerd — opdrachtgevers zien meteen dat het klopt, in steen
                gekrast.
              </p>
            </div>
          </Panel>
        </div>

        <div>
          <div className="mb-3">
            <Incised>Volgende stappen</Incised>
          </div>
          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const warn = a.urgentie === "warning";
              const tone = warn ? C.terracotta : C.ocher;
              return (
                <Panel key={a.titel} className="p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1 block h-2.5 w-2.5 shrink-0 rotate-45"
                      style={{ background: tone, border: `1px solid ${C.ink}` }}
                      aria-hidden="true"
                    />
                    <div>
                      <div
                        className="text-[14px] font-semibold leading-snug"
                        style={{ ...display, color: C.ink }}
                      >
                        {a.titel}
                      </div>
                      <div
                        className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-semibold"
                        style={{ ...serif, color: tone }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </Panel>
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
        eyebrow="Marktplaats · gevelwerk"
        title="Opdrachten, laag voor laag"
        sub="We krassen eerlijk in waarom een opdracht past — en waar de lijn afwijkt."
      />

      <div
        className="mb-6 flex items-center gap-2 rounded px-4 py-2.5"
        style={{ ...carvedStyle(false), background: C.cardHi }}
      >
        <Search
          size={16}
          className="shrink-0"
          style={{ color: C.terracottaDeep }}
          aria-hidden="true"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[15px] outline-none placeholder:opacity-60"
          style={{ ...serif, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${RING}`}
            style={{ ...serif, color: C.cardHi, background: C.terracottaDeep }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              background: C.plaster,
              color: C.terracotta,
              border: `1px solid ${C.terracotta}`,
            }}
            aria-hidden="true"
          >
            <Landmark size={28} strokeWidth={1.8} />
          </span>
          <h3 className="text-[24px] font-semibold" style={{ ...display, color: C.ink }}>
            Geen laag gevonden
          </h3>
          <p className="max-w-xs text-[14px]" style={{ ...serif, color: C.muted }}>
            Geen opdracht past bij &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <button
            onClick={() => setQuery("")}
            className={`mt-1 rounded-full px-5 py-2 text-[13px] font-semibold ${RING}`}
            style={{ ...serif, color: C.cardHi, background: C.terracottaDeep }}
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
                  <MatchSeal value={o.match} size="sm" />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-8 w-8 items-center justify-center rounded ${RING}`}
                    style={{
                      background: isSaved ? C.plaster : C.cardHi,
                      color: isSaved ? C.terracottaDeep : C.muted,
                      border: `1px solid ${isSaved ? C.terracottaDeep : C.line}`,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <div className="mt-3 flex flex-1 flex-col">
                  <Incised tone={C.faint}>{o.id}</Incised>
                  <h3
                    className="mt-0.5 text-[19px] font-semibold leading-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <div className="mt-0.5 text-[14px]" style={{ ...serif, color: C.muted }}>
                    {o.opdrachtgever}
                  </div>
                  <Engraved className="my-3" />
                  <dl
                    className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]"
                    style={{ ...serif, color: C.ink2 }}
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
                    className={`group mt-4 inline-flex items-center justify-center gap-1.5 rounded py-2.5 text-[13px] font-semibold ${RING}`}
                    style={{ ...serif, color: C.cardHi, background: C.ink }}
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
        className={`mb-5 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold ${RING}`}
        style={{ ...serif, color: C.ink2, background: C.cardHi, border: `1px solid ${C.line}` }}
      >
        <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
        Terug naar marktplaats
      </button>

      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <MatchSeal value={opdracht.match} />
            <div>
              <Incised tone={C.faint}>{opdracht.id}</Incised>
              <h2
                className="mt-0.5 text-[28px] font-semibold leading-tight tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                {opdracht.titel}
              </h2>
              <p className="mt-1 text-[15px]" style={{ ...serif, color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleSave(opdracht.id)}
            aria-pressed={isSaved}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold ${RING}`}
            style={{
              ...serif,
              color: isSaved ? C.terracottaDeep : C.ink2,
              background: isSaved ? C.plaster : C.cardHi,
              border: `1px solid ${isSaved ? C.terracottaDeep : C.line}`,
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

        <Engraved className="my-5" />

        <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded p-3"
              style={{ background: C.plaster, border: `1px solid ${C.line}` }}
            >
              <m.Icon
                size={14}
                strokeWidth={2}
                style={{ color: C.terracottaDeep }}
                aria-hidden="true"
              />
              <dt
                className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...serif, color: C.muted }}
              >
                {m.label}
              </dt>
              <dd className="text-[15px] font-semibold" style={{ ...display, color: C.ink }}>
                {m.value}
              </dd>
            </div>
          ))}
        </dl>
      </Panel>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="p-5">
          <div className="mb-3 inline-flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: C.plaster, color: C.olive, border: `1px solid ${C.olive}` }}
              aria-hidden="true"
            >
              <Plus size={13} strokeWidth={2.6} />
            </span>
            <span className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[14px]"
                style={{ ...serif, color: C.ink2 }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.olive }}
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
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{
                background: C.plaster,
                color: C.terracotta,
                border: `1px solid ${C.terracotta}`,
              }}
              aria-hidden="true"
            >
              <Minus size={13} strokeWidth={2.6} />
            </span>
            <span className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
              Even op letten
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[14px]"
                style={{ ...serif, color: C.ink2 }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.terracotta }}
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
          className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-semibold ${RING}`}
          style={{ ...serif, color: C.cardHi, background: applied ? C.olive : C.terracottaDeep }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </button>
        {applied && (
          <span className="text-[13px]" style={{ ...serif, color: C.muted }}>
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
        eyebrow="Verificatie · in steen"
        title="Documenten, vastgelegd"
        sub="Elke status draagt een eigen label én icoon — te herkennen zonder op kleur te leunen."
      />

      <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const m = statusMeta(s);
          return (
            <div key={s} className="p-3.5" style={carvedStyle()}>
              <m.Icon size={16} strokeWidth={2.2} style={{ color: m.tone }} aria-hidden="true" />
              <div className="mt-2 text-[13px] font-semibold" style={{ ...display, color: C.ink }}>
                {m.label}
              </div>
            </div>
          );
        })}
      </div>

      <Panel className="mb-6 flex items-center gap-4 p-5">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          style={{ background: C.plaster, color: C.olive, border: `1px solid ${C.olive}` }}
          aria-hidden="true"
        >
          <ShieldCheck size={24} strokeWidth={2} />
        </span>
        <div>
          <div className="text-[17px] font-semibold" style={{ ...display, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[14px]" style={{ ...serif, color: C.ink2 }}>
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
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded ${RING}`}
                  style={{
                    border: `1.5px solid ${done ? C.olive : C.line}`,
                    background: done ? C.olive : "transparent",
                    color: C.cardHi,
                  }}
                >
                  {done && <Check size={15} strokeWidth={2.6} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold" style={{ ...display, color: C.ink }}>
                    {c.naam}
                  </div>
                  <div className="text-[12.5px]" style={{ ...serif, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <StatusTag status={c.status} />
              </Panel>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Incised>Documenten</Incised>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center rounded ${RING}`}
              style={{
                background: C.cardHi,
                color: C.terracottaDeep,
                border: `1px solid ${C.line}`,
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
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${RING}`}
                style={{
                  ...serif,
                  color: feedState === s ? C.cardHi : C.muted,
                  background: feedState === s ? C.terracottaDeep : C.cardHi,
                  border: `1px solid ${feedState === s ? C.terracottaDeep : C.line}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="p-3.5" style={carvedStyle()}>
                  <div
                    className="h-3 w-2/3 animate-pulse rounded"
                    style={{ background: C.plaster }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: C.plaster }}
                  />
                </li>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Panel className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: C.plaster, color: C.brick, border: `1px solid ${C.brick}` }}
                aria-hidden="true"
              >
                <CircleAlert size={22} strokeWidth={2} />
              </span>
              <div className="text-[17px] font-semibold" style={{ ...display, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12.5px]" style={{ ...serif, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className={`mt-1 rounded-full px-4 py-2 text-[12.5px] font-semibold ${RING}`}
                style={{ ...serif, color: C.cardHi, background: C.terracottaDeep }}
              >
                Opnieuw proberen
              </button>
            </Panel>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => {
                const m = statusMeta(d.status);
                return (
                  <Panel key={d.naam} className="flex items-center gap-3 p-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-[9px] font-bold"
                      style={{
                        ...serif,
                        background: C.plaster,
                        color: m.tone,
                        border: `1px solid ${m.tone}`,
                      }}
                      aria-hidden="true"
                    >
                      {d.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[13px] font-semibold"
                        style={{ ...display, color: C.ink }}
                      >
                        {d.naam}
                      </div>
                      <div
                        className="text-[11.5px] tabular-nums"
                        style={{ ...serif, color: C.muted }}
                      >
                        {d.grootte} · {d.bijgewerkt}
                      </div>
                    </div>
                    <StatusTag status={d.status} />
                  </Panel>
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
      <ScreenHead eyebrow="Acties · dagwerk" title="Wat vandaag om aandacht vraagt" />

      {openCount === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.plaster, color: C.olive, border: `1px solid ${C.olive}` }}
            aria-hidden="true"
          >
            <Check size={30} strokeWidth={2.4} />
          </span>
          <h3 className="text-[24px] font-semibold" style={{ ...display, color: C.ink }}>
            Fresco af
          </h3>
          <p className="max-w-xs text-[14px]" style={{ ...serif, color: C.muted }}>
            Geen openstaande punten meer vandaag. Alle lagen zijn gekrast.
          </p>
        </Panel>
      ) : (
        <>
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5"
            style={{ background: C.plaster, border: `1px solid ${C.terracotta}` }}
          >
            <span
              className="text-[14px] font-bold tabular-nums"
              style={{ ...display, color: C.terracotta }}
            >
              {openCount}
            </span>
            <span
              className="text-[13px] font-semibold"
              style={{ ...serif, color: C.terracottaDeep }}
            >
              {openCount === 1 ? "punt" : "punten"} open
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              const tone = warn ? C.terracotta : C.ocher;
              return (
                <Panel key={a.titel} className="flex items-start gap-4 p-5">
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded ${RING}`}
                    style={{
                      border: `1.5px solid ${isDone ? C.olive : C.line}`,
                      background: isDone ? C.olive : "transparent",
                      color: C.cardHi,
                    }}
                  >
                    {isDone && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                      style={{
                        ...serif,
                        color: tone,
                        background: C.plaster,
                        border: `1px solid ${tone}`,
                      }}
                    >
                      {warn ? "Urgent" : "Info"}
                    </span>
                    <div
                      className="mt-1.5 text-[17px] font-semibold leading-snug"
                      style={{
                        ...display,
                        color: C.ink,
                        textDecoration: isDone ? "line-through" : "none",
                        opacity: isDone ? 0.55 : 1,
                      }}
                    >
                      {a.titel}
                    </div>
                    <p
                      className="mt-1 text-[13px]"
                      style={{ ...serif, color: C.muted, opacity: isDone ? 0.55 : 1 }}
                    >
                      {a.detail}
                    </p>
                    {!isDone && (
                      <span
                        className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-semibold"
                        style={{ ...serif, color: tone }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
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
  const statusMark = (status: string): { Icon: LucideIcon; tone: string } =>
    status === "Betaald"
      ? { Icon: Check, tone: C.olive }
      : status === "Openstaand"
        ? { Icon: Clock, tone: C.terracotta }
        : { Icon: FileText, tone: C.muted };
  return (
    <div>
      <ScreenHead
        eyebrow="Facturen · grootboek"
        title="Je facturen"
        sub="Overzichtelijk en zonder gedoe — je weet meteen wat openstaat."
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", tone: C.olive },
          { label: "Openstaand", value: "€ 1.350", tone: C.terracotta },
          { label: "Concept", value: "€ 880", tone: C.muted },
        ].map((s) => (
          <Panel key={s.label} className="p-4">
            <Incised tone={C.muted}>{s.label}</Incised>
            <div
              className="mt-1 text-[28px] font-semibold tabular-nums"
              style={{ ...display, color: s.tone }}
            >
              {s.value}
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="p-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${LINE_DARK}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                    style={{ ...serif, color: C.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const m = statusMark(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#efe4d2]/50"
                    style={{ borderBottom: `1px solid ${C.line}` }}
                  >
                    <td
                      className="px-3 py-3 text-[13px] font-semibold tabular-nums"
                      style={{ ...serif, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3 text-[13.5px]" style={{ ...serif, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-3 text-[12.5px] tabular-nums"
                      style={{ ...serif, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3 text-[14px] font-semibold tabular-nums"
                      style={{ ...display, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5 text-[11px] font-semibold"
                        style={{
                          ...serif,
                          color: m.tone,
                          background: C.cardHi,
                          border: `1px solid ${m.tone}`,
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

export function Concept276() {
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

  // Subtle scratched-plaster hatch behind everything.
  const hatch = `repeating-linear-gradient(135deg, rgba(60,44,30,0.03) 0px, rgba(60,44,30,0.03) 1px, transparent 1px, transparent 7px)`;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...serif, color: C.ink, background: C.plaster }}
    >
      <div
        className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8"
        style={{ backgroundImage: hatch }}
      >
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                background: C.terracottaDeep,
                color: C.cardHi,
                border: `1px solid ${C.ink}`,
              }}
              aria-hidden="true"
            >
              <Landmark size={20} strokeWidth={2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[20px] font-semibold tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Sgraffito
              </div>
              <Incised tone={C.muted}>ZZP platform · gevelwerk</Incised>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[14px] font-semibold" style={{ ...display, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11.5px]"
                style={{ ...serif, color: C.olive }}
              >
                <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full text-[14px] font-bold"
              style={{
                ...display,
                background: C.plaster,
                color: C.terracottaDeep,
                border: `1px solid ${C.terracottaDeep}`,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <Engraved className="mb-5" />

        <nav className="mb-8 flex flex-wrap gap-1.5 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICONS[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${RING}`}
                style={{
                  ...serif,
                  color: on ? C.cardHi : C.ink2,
                  background: on ? C.terracottaDeep : C.cardHi,
                  border: `1px solid ${on ? C.terracottaDeep : C.line}`,
                }}
              >
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

        <Engraved className="mt-10" />
        <footer
          className="flex flex-wrap items-center justify-between gap-2 pt-4 text-[11.5px]"
          style={{ ...serif, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Landmark
              size={12}
              strokeWidth={2}
              style={{ color: C.terracottaDeep }}
              aria-hidden="true"
            />
            {SCREENS.length} schermen · sgraffito v276
          </span>
          <span>Laag voor laag ingekrast</span>
        </footer>
      </div>
    </div>
  );
}
