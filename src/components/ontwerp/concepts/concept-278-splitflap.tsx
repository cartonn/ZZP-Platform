"use client";

// Concept 278 — "Splitflap" · Solari split-flap departure board (dark).
// Signature: a mechanical station-board language. Numbers, rates and statuses render as
// black split-flap tiles with a horizontal hinge line across the middle; glyphs "flip" into
// place (a subtle rotateX flip whenever a value changes or a screen switches). Amber + white
// on deep black, monospaced type, transit-hall composition. Nostalgic-mechanical and delightful.
// Fonts: Space Mono (everything — it is a board).

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
  Train,
  ChevronRight,
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

// Departure-board palette — amber + white glyphs on deep black tiles.
const C = {
  bg: "#0a0a0b",
  panel: "#111115",
  panel2: "#16161b",
  tileTop: "#212127",
  tileBot: "#0d0d10",
  hinge: "#050506",
  amber: "#ffb02e",
  amberDim: "#b07714",
  amberSoft: "#3a2b12",
  white: "#f2efe6",
  green: "#5bd98f",
  greenSoft: "#123322",
  red: "#ff5d54",
  redSoft: "#3a1512",
  line: "#26262d",
  lineSoft: "#1b1b21",
  muted: "#84848f",
  faint: "#54545e",
};

const mono = { fontFamily: "var(--font-lab-space-mono)" };

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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb02e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0b]";

// The scoped keyframes that drive the mechanical flip. Injected once by the shell.
const FLIP_CSS = `
@keyframes cf278flip {
  0%   { transform: rotateX(-90deg); opacity: 0.15; }
  55%  { transform: rotateX(7deg);   opacity: 1; }
  78%  { transform: rotateX(-4deg); }
  100% { transform: rotateX(0deg);   opacity: 1; }
}
.cf278-face { animation: cf278flip 460ms cubic-bezier(0.36, 0.12, 0.2, 1) both; }
.cf278-flap:hover .cf278-face { animation: cf278flip 500ms cubic-bezier(0.36, 0.12, 0.2, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .cf278-face { animation-duration: 1ms; }
  .cf278-flap:hover .cf278-face { animation: none; }
}
`;

// ---- Split-flap primitives --------------------------------------------------

type FlapSize = "sm" | "md" | "lg";

const FLAP_DIMS: Record<FlapSize, { w: number; h: number; fs: number }> = {
  sm: { w: 18, h: 26, fs: 14 },
  md: { w: 24, h: 34, fs: 19 },
  lg: { w: 40, h: 56, fs: 34 },
};

// A single split-flap tile: black flap, hinge line across the middle, one glyph that flips in.
function Flap({
  char,
  size = "md",
  tone = C.amber,
  delay = 0,
}: {
  char: string;
  size?: FlapSize;
  tone?: string;
  delay?: number;
}) {
  const d = FLAP_DIMS[size];
  return (
    <span
      className="cf278-flap relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[3px]"
      style={{
        width: d.w,
        height: d.h,
        background: C.hinge,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.5)",
        perspective: 220,
      }}
      aria-hidden="true"
    >
      <span
        key={char}
        className="cf278-face flex h-full w-full items-center justify-center rounded-[3px]"
        style={{
          background: `linear-gradient(180deg, ${C.tileTop} 0%, ${C.tileTop} 49%, ${C.tileBot} 51%, ${C.tileBot} 100%)`,
          color: tone,
          fontSize: d.fs,
          lineHeight: 1,
          transformOrigin: "center",
          animationDelay: `${delay}ms`,
          ...mono,
        }}
      >
        {char === " " ? " " : char}
      </span>
      {/* Center hinge line */}
      <span
        className="pointer-events-none absolute inset-x-0 top-1/2 z-10"
        style={{
          height: 2,
          transform: "translateY(-1px)",
          background: C.hinge,
          boxShadow: "0 1px 0 rgba(255,255,255,0.05)",
        }}
      />
    </span>
  );
}

// A row of tiles spelling a string. Accessible: the whole word is labelled once.
function Flaps({
  text,
  size = "md",
  tone = C.amber,
  label,
}: {
  text: string;
  size?: FlapSize;
  tone?: string;
  label?: string;
}) {
  const chars = text.toUpperCase().split("");
  return (
    <span className="inline-flex items-center gap-[3px]" role="text" aria-label={label ?? text}>
      {chars.map((ch, i) => (
        <Flap key={`${i}-${ch}`} char={ch} size={size} tone={tone} delay={i * 45} />
      ))}
    </span>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  board: string;
  Icon: LucideIcon;
  tone: string;
  soft: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        board: "AAN BOORD",
        Icon: BadgeCheck,
        tone: C.green,
        soft: C.greenSoft,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        board: "OP TIJD",
        Icon: Clock,
        tone: C.amber,
        soft: C.amberSoft,
      };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        board: "VERTRAAGD",
        Icon: TriangleAlert,
        tone: C.amber,
        soft: C.amberSoft,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        board: "GEANNULEERD",
        Icon: XCircle,
        tone: C.red,
        soft: C.redSoft,
      };
  }
}

// Board-style status pill: split-flap word + icon + human label (never colour alone).
function StatusPill({ status }: { status: CredStatus }) {
  const m = statusMeta(status);
  return (
    <span className="inline-flex items-center gap-2">
      <Flaps text={m.board} size="sm" tone={m.tone} label={m.label} />
      <span
        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em]"
        style={{ ...mono, color: m.tone }}
      >
        <m.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
        {m.label}
      </span>
    </span>
  );
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
    <div
      className={className}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Sparkline({ data, tone, height = 32 }: { data: number[]; tone: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 64 - 18;
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
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.6} fill={tone} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

function BoardHead({ track, title, sub }: { track: string; title: string; sub?: string }) {
  return (
    <div className="mb-7">
      <div
        className="mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
        style={{ ...mono, background: C.amberSoft, color: C.amber }}
      >
        <Train size={12} strokeWidth={2.4} aria-hidden="true" />
        {track}
      </div>
      <h1
        className="text-[26px] font-bold uppercase leading-tight tracking-[0.02em] sm:text-[32px]"
        style={{ ...mono, color: C.white }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2 max-w-xl text-[13px] leading-relaxed"
          style={{ ...mono, color: C.muted }}
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
  const voornaam = PROFIEL.naam.split(" ")[0] ?? PROFIEL.naam;
  return (
    <div>
      {/* Big board hero — the "next departure" */}
      <Panel className="mb-8 overflow-hidden" style={{ background: C.panel2 }}>
        <div
          className="flex items-center justify-between px-5 py-2.5"
          style={{ borderBottom: `1px solid ${C.line}`, background: C.hinge }}
        >
          <span
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ ...mono, color: C.amber }}
          >
            <span
              className="inline-block h-2 w-2 animate-pulse rounded-full"
              style={{ background: C.amber }}
              aria-hidden="true"
            />
            Vertrekhal · {PROFIEL.plaats}
          </span>
          <span
            className="text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{ ...mono, color: C.muted }}
          >
            {PROFIEL.rol}
          </span>
        </div>
        <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <div
              className="text-[12px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.muted }}
            >
              Welkom terug
            </div>
            <div className="mt-2">
              <Flaps text={voornaam} size="lg" tone={C.white} label={`Dag, ${voornaam}`} />
            </div>
            <p
              className="mt-4 max-w-sm text-[12.5px] leading-relaxed"
              style={{ ...mono, color: C.muted }}
            >
              Je eerstvolgende match staat op het bord. De tegels draaien zodra er iets verandert.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ ...mono, color: C.muted }}
            >
              Match-score
            </span>
            <div className="flex items-center gap-[3px]">
              <Flaps
                text={String(top.match)}
                size="lg"
                tone={C.amber}
                label={`Match ${top.match} procent`}
              />
              <Flap char="%" size="lg" tone={C.amber} />
            </div>
          </div>
        </div>
      </Panel>

      {/* KPI board rows */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const tone = k.up ? C.green : C.red;
          return (
            <Panel key={k.label} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <span
                  className="text-[10px] font-bold uppercase leading-tight tracking-[0.1em]"
                  style={{ ...mono, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                  style={{ ...mono, color: tone }}
                >
                  <Trend size={12} strokeWidth={2.4} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-[3px]">
                <Flaps text={k.value} size="sm" tone={C.white} label={`${k.label}: ${k.value}`} />
              </div>
              <div className="mt-2">
                <Sparkline data={k.spark} tone={C.amber} />
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <ChevronRight
              size={16}
              strokeWidth={2.6}
              style={{ color: C.amber }}
              aria-hidden="true"
            />
            <h2
              className="text-[13px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.white }}
            >
              Beste match
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onOpen(top)}
            className={`group flex w-full items-stretch gap-4 rounded-[10px] p-5 text-left transition-colors hover:bg-[#16161b] ${RING}`}
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
          >
            <span className="flex shrink-0 items-center">
              <Flaps
                text={String(top.match)}
                size="md"
                tone={C.amber}
                label={`Match ${top.match} procent`}
              />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className="block text-[16px] font-bold leading-tight"
                style={{ ...mono, color: C.white }}
              >
                {top.titel}
              </span>
              <span className="mt-1 block text-[12.5px]" style={{ ...mono, color: C.muted }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </span>
              <span className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
                    style={{ ...mono, color: C.amber, background: C.amberSoft }}
                  >
                    {t}
                  </span>
                ))}
              </span>
            </span>
            <ArrowRight
              size={20}
              className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
              style={{ color: C.amber }}
              aria-hidden="true"
            />
          </button>

          <Panel className="mt-6 flex items-center gap-4 p-5">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
              style={{ background: C.greenSoft, color: C.green }}
              aria-hidden="true"
            >
              <ShieldCheck size={24} strokeWidth={2} />
            </span>
            <div>
              <div
                className="inline-flex items-center gap-2 text-[14px] font-bold uppercase tracking-[0.06em]"
                style={{ ...mono, color: C.white }}
              >
                {PROFIEL.trust}
                <BadgeCheck
                  size={15}
                  strokeWidth={2}
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed" style={{ ...mono, color: C.muted }}>
                Je papieren staan op groen — opdrachtgevers zien meteen dat je kunt instappen.
              </p>
            </div>
          </Panel>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <ListTodo size={16} strokeWidth={2} style={{ color: C.amber }} aria-hidden="true" />
            <h2
              className="text-[13px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.white }}
            >
              Meldingen
            </h2>
          </div>
          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const warn = a.urgentie === "warning";
              return (
                <Panel key={a.titel} className="overflow-hidden">
                  <div className="flex">
                    <span
                      className="w-1 shrink-0"
                      style={{ background: warn ? C.amber : C.faint }}
                      aria-hidden="true"
                    />
                    <div className="p-3.5">
                      <div
                        className="text-[12.5px] font-bold leading-snug"
                        style={{ ...mono, color: C.white }}
                      >
                        {a.titel}
                      </div>
                      <div
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em]"
                        style={{ ...mono, color: warn ? C.amber : C.muted }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
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
      <BoardHead
        track="Vertrektijden · Opdrachten"
        title="Volgende vertrek"
        sub="Elke opdracht als bordregel — met de reden waarom hij past en waar de aandacht ligt."
      />

      <div
        className="mb-5 flex items-center gap-2 rounded-[10px] px-4 py-2.5"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <Search size={16} className="shrink-0" style={{ color: C.amber }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[13.5px] outline-none placeholder:text-[#54545e]"
          style={{ ...mono, color: C.white }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className={`rounded px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${RING}`}
            style={{ ...mono, color: C.amber, background: C.amberSoft }}
          >
            Wis
          </button>
        )}
      </div>

      {/* Board header row */}
      <div
        className="hidden grid-cols-[auto_1fr_auto] gap-4 rounded-t-[10px] px-5 py-2.5 sm:grid"
        style={{ background: C.hinge, border: `1px solid ${C.line}`, borderBottom: "none" }}
      >
        {["Match", "Bestemming", "Tarief"].map((h) => (
          <span
            key={h}
            className="text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ ...mono, color: C.muted }}
          >
            {h}
          </span>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <div className="flex gap-[3px]" aria-hidden="true">
            {"— — —".split(" ").map((ch, i) => (
              <Flap key={i} char={ch} size="md" tone={C.faint} />
            ))}
          </div>
          <h3
            className="text-[18px] font-bold uppercase tracking-[0.04em]"
            style={{ ...mono, color: C.white }}
          >
            Geen vertrek gevonden
          </h3>
          <p className="max-w-xs text-[12.5px]" style={{ ...mono, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className={`mt-1 rounded px-5 py-2 text-[12px] font-bold uppercase tracking-[0.08em] ${RING}`}
            style={{ ...mono, background: C.amber, color: C.bg }}
          >
            Filter wissen
          </button>
        </Panel>
      ) : (
        <div
          className="overflow-hidden rounded-b-[10px] sm:rounded-t-none"
          style={{ border: `1px solid ${C.line}` }}
        >
          {filtered.map((o, idx) => {
            const isSaved = saved.has(o.id);
            const tone = o.match >= 90 ? C.green : o.match >= 82 ? C.amber : C.red;
            return (
              <div
                key={o.id}
                className="group grid grid-cols-1 gap-4 px-5 py-4 transition-colors hover:bg-[#16161b] sm:grid-cols-[auto_1fr_auto] sm:items-center"
                style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <div className="flex items-center">
                  <Flaps
                    text={String(o.match)}
                    size="md"
                    tone={tone}
                    label={`Match ${o.match} procent`}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.18em]"
                      style={{ ...mono, color: C.faint }}
                    >
                      {o.id}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpen(o)}
                    className={`mt-0.5 block truncate text-left text-[15px] font-bold leading-tight hover:underline ${RING}`}
                    style={{ ...mono, color: C.white }}
                  >
                    {o.titel}
                  </button>
                  <div className="mt-0.5 text-[12px]" style={{ ...mono, color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.uren} · {o.start}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
                        style={{ ...mono, color: C.amber, background: C.amberSoft }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <span
                    className="text-[13px] font-bold tabular-nums"
                    style={{ ...mono, color: C.white }}
                  >
                    {o.tarief}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSave(o.id)}
                      aria-pressed={isSaved}
                      aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                      className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${RING}`}
                      style={{
                        background: isSaved ? C.amberSoft : "transparent",
                        color: isSaved ? C.amber : C.muted,
                        border: `1px solid ${isSaved ? C.amber : C.line}`,
                      }}
                    >
                      {isSaved ? (
                        <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                      ) : (
                        <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpen(o)}
                      className={`inline-flex items-center gap-1 rounded px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors ${RING}`}
                      style={{ ...mono, background: C.amber, color: C.bg }}
                    >
                      Open
                      <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
                    </button>
                  </div>
                </div>
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
        type="button"
        onClick={onBack}
        className={`mb-5 inline-flex items-center gap-1.5 rounded px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] ${RING}`}
        style={{ ...mono, color: C.muted, background: C.panel, border: `1px solid ${C.line}` }}
      >
        <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
        Terug
      </button>

      <Panel className="overflow-hidden" style={{ background: C.panel2 }}>
        <div
          className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderBottom: `1px solid ${C.line}`, background: C.hinge }}
        >
          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ ...mono, color: C.amber }}
            >
              {opdracht.id} · Spoor 1
            </span>
            <h2
              className="mt-2 text-[22px] font-bold uppercase leading-tight tracking-[0.02em] sm:text-[26px]"
              style={{ ...mono, color: C.white }}
            >
              {opdracht.titel}
            </h2>
            <div className="mt-1 text-[13px]" style={{ ...mono, color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </div>
          </div>
          <div className="flex flex-col items-start gap-1.5 sm:items-end">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.muted }}
            >
              Match
            </span>
            <div className="flex items-center gap-[3px]">
              <Flaps
                text={String(opdracht.match)}
                size="lg"
                tone={C.amber}
                label={`Match ${opdracht.match} procent`}
              />
              <Flap char="%" size="lg" tone={C.amber} />
            </div>
          </div>
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
                borderRight: i < 3 ? `1px solid ${C.lineSoft}` : "none",
                borderTop: `1px solid ${C.lineSoft}`,
              }}
            >
              <m.Icon size={15} strokeWidth={2} style={{ color: C.amber }} aria-hidden="true" />
              <div
                className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="text-[13px] font-bold" style={{ ...mono, color: C.white }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 py-3"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded"
              style={{ background: C.greenSoft, color: C.green }}
              aria-hidden="true"
            >
              <Plus size={13} strokeWidth={2.6} />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.06em]"
              style={{ ...mono, color: C.white }}
            >
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-2.5 p-5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[12.5px]"
                style={{ ...mono, color: C.white }}
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
        </Panel>
        <Panel className="overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 py-3"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded"
              style={{ background: C.amberSoft, color: C.amber }}
              aria-hidden="true"
            >
              <Minus size={13} strokeWidth={2.6} />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.06em]"
              style={{ ...mono, color: C.white }}
            >
              Even op letten
            </span>
          </div>
          <ul className="space-y-2.5 p-5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[12.5px]"
                style={{ ...mono, color: C.white }}
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
        </Panel>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className={`inline-flex items-center gap-2 rounded px-6 py-3 text-[13px] font-bold uppercase tracking-[0.08em] ${RING}`}
          style={{ ...mono, background: applied ? C.green : C.amber, color: C.bg }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </button>
        <button
          type="button"
          onClick={() => toggleSave(opdracht.id)}
          aria-pressed={isSaved}
          className={`inline-flex items-center gap-2 rounded px-5 py-3 text-[12px] font-bold uppercase tracking-[0.08em] ${RING}`}
          style={{
            ...mono,
            color: isSaved ? C.amber : C.muted,
            background: isSaved ? C.amberSoft : C.panel,
            border: `1px solid ${isSaved ? C.amber : C.line}`,
          }}
        >
          {isSaved ? (
            <BookmarkCheck size={15} strokeWidth={2.4} aria-hidden="true" />
          ) : (
            <Bookmark size={15} strokeWidth={2.4} aria-hidden="true" />
          )}
          {isSaved ? "Bewaard" : "Bewaar"}
        </button>
        {applied && (
          <span className="text-[12px]" style={{ ...mono, color: C.muted }}>
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
      <BoardHead
        track="Statusbord · Verificatie"
        title="Papieren op het bord"
        sub="Elke status draait als bordregel — altijd met woord én icoon, nooit met kleur alleen."
      />

      {/* Legend */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const m = statusMeta(s);
          return (
            <Panel key={s} className="flex items-center gap-3 p-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
                style={{ background: m.soft, color: m.tone }}
                aria-hidden="true"
              >
                <m.Icon size={16} strokeWidth={2.4} />
              </span>
              <div className="min-w-0">
                <div
                  className="text-[12px] font-bold uppercase tracking-[0.06em]"
                  style={{ ...mono, color: C.white }}
                >
                  {m.label}
                </div>
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: m.tone }}
                >
                  {m.board}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      <Panel className="mb-6 flex items-center gap-4 p-5">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
          style={{ background: C.greenSoft, color: C.green }}
          aria-hidden="true"
        >
          <ShieldCheck size={24} strokeWidth={2} />
        </span>
        <div>
          <div
            className="text-[14px] font-bold uppercase tracking-[0.06em]"
            style={{ ...mono, color: C.white }}
          >
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[12.5px] leading-relaxed" style={{ ...mono, color: C.muted }}>
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
                  type="button"
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded transition-colors ${RING}`}
                  style={{
                    border: `1.5px solid ${done ? C.amber : C.line}`,
                    background: done ? C.amber : "transparent",
                    color: C.bg,
                  }}
                >
                  {done && <Check size={15} strokeWidth={2.6} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-bold" style={{ ...mono, color: C.white }}>
                    {c.naam}
                  </div>
                  <div className="text-[11.5px]" style={{ ...mono, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <div className="shrink-0">
                  <StatusPill status={c.status} />
                </div>
              </Panel>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.white }}
            >
              <FileText size={16} strokeWidth={2} style={{ color: C.amber }} aria-hidden="true" />
              Documenten
            </span>
            <button
              type="button"
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center rounded ${RING}`}
              style={{ background: C.panel, color: C.amber, border: `1px solid ${C.line}` }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
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
                className={`rounded px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${RING}`}
                style={{
                  ...mono,
                  color: feedState === s ? C.bg : C.muted,
                  background: feedState === s ? C.amber : C.panel,
                  border: `1px solid ${feedState === s ? C.amber : C.line}`,
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
                  <div
                    className="h-3 w-2/3 animate-pulse rounded"
                    style={{ background: C.panel2 }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: C.panel2 }}
                  />
                </Panel>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Panel className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-lg"
                style={{ background: C.redSoft, color: C.red }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div
                className="text-[14px] font-bold uppercase tracking-[0.06em]"
                style={{ ...mono, color: C.white }}
              >
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...mono, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                type="button"
                onClick={() => setFeedState("ok")}
                className={`mt-1 rounded px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] ${RING}`}
                style={{ ...mono, background: C.amber, color: C.bg }}
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
                        ...mono,
                        background: C.hinge,
                        color: C.amber,
                        border: `1px solid ${C.line}`,
                      }}
                      aria-hidden="true"
                    >
                      {d.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[12.5px] font-bold"
                        style={{ ...mono, color: C.white }}
                      >
                        {d.naam}
                      </div>
                      <div className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
                        {d.grootte} · {d.bijgewerkt}
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em]"
                      style={{ ...mono, background: m.soft, color: m.tone }}
                      title={m.label}
                    >
                      <m.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
                      {m.label}
                    </span>
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
      <BoardHead track="Omroepberichten · Acties" title="Wat om aandacht vraagt" />

      {openCount === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <div className="flex gap-[3px]" aria-hidden="true">
            {"OK".split("").map((ch, i) => (
              <Flap key={i} char={ch} size="lg" tone={C.green} />
            ))}
          </div>
          <h3
            className="text-[18px] font-bold uppercase tracking-[0.04em]"
            style={{ ...mono, color: C.white }}
          >
            Alles op tijd
          </h3>
          <p className="max-w-xs text-[12.5px]" style={{ ...mono, color: C.muted }}>
            Niets meer te doen vandaag. Het bord is leeg.
          </p>
        </Panel>
      ) : (
        <>
          <div
            className="mb-4 inline-flex items-center gap-2 rounded px-3.5 py-2"
            style={{ background: C.amberSoft }}
          >
            <Flap char={String(openCount)} size="sm" tone={C.amber} />
            <span
              className="text-[12px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.amber }}
            >
              {openCount === 1 ? "melding open" : "meldingen open"}
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <Panel key={a.titel} className="flex items-stretch overflow-hidden">
                  <span
                    className="w-1.5 shrink-0"
                    style={{ background: isDone ? C.faint : warn ? C.amber : C.muted }}
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
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded transition-colors ${RING}`}
                      style={{
                        border: `1.5px solid ${isDone ? C.green : C.line}`,
                        background: isDone ? C.green : "transparent",
                        color: C.bg,
                      }}
                    >
                      {isDone && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[14px] font-bold leading-snug"
                        style={{
                          ...mono,
                          color: C.white,
                          textDecoration: isDone ? "line-through" : "none",
                          opacity: isDone ? 0.5 : 1,
                        }}
                      >
                        {warn && !isDone && (
                          <span
                            className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
                            style={{ background: C.amber, color: C.bg }}
                          >
                            Urgent
                          </span>
                        )}
                        {a.titel}
                      </div>
                      <p
                        className="mt-1 text-[12px]"
                        style={{ ...mono, color: C.muted, opacity: isDone ? 0.5 : 1 }}
                      >
                        {a.detail}
                      </p>
                      {!isDone && (
                        <span
                          className="mt-2.5 inline-flex items-center gap-1 rounded px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em]"
                          style={{
                            ...mono,
                            color: warn ? C.amber : C.muted,
                            background: warn ? C.amberSoft : C.lineSoft,
                          }}
                        >
                          {a.cta}
                          <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                        </span>
                      )}
                    </div>
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
  const statusStyle = (status: string): { tone: string; soft: string; Icon: LucideIcon } =>
    status === "Betaald"
      ? { tone: C.green, soft: C.greenSoft, Icon: Check }
      : status === "Openstaand"
        ? { tone: C.amber, soft: C.amberSoft, Icon: Clock }
        : { tone: C.muted, soft: C.lineSoft, Icon: FileText };
  return (
    <div>
      <BoardHead
        track="Kassabord · Facturen"
        title="Je facturen"
        sub="Overzichtelijk en zonder gedoe — zodat je weet waar je aan toe bent."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {[
          { label: "Betaald (mnd)", value: "5.552", tone: C.green },
          { label: "Openstaand", value: "1.350", tone: C.amber },
          { label: "Concept", value: "880", tone: C.muted },
        ].map((s) => (
          <Panel key={s.label} className="p-4">
            <div
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.muted }}
            >
              {s.label}
            </div>
            <div className="mt-2 flex items-center gap-[3px]">
              <Flap char="€" size="sm" tone={s.tone} />
              <Flaps text={s.value} size="sm" tone={s.tone} label={`${s.label}: ${s.value} euro`} />
            </div>
          </Panel>
        ))}
        <Panel className="flex flex-col justify-between p-4">
          <div
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ ...mono, color: C.muted }}
          >
            Bedrag per factuur
          </div>
          <Sparkline data={trend} tone={C.amber} height={44} />
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ background: C.hinge, borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ ...mono, color: C.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const st = statusStyle(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#16161b]"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-4 py-3 text-[12.5px] font-bold tabular-nums"
                      style={{ ...mono, color: C.white }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[12.5px]" style={{ ...mono, color: C.white }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-4 py-3 text-[12.5px] font-bold tabular-nums"
                      style={{ ...mono, color: C.white }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em]"
                        style={{ ...mono, color: st.tone, background: st.soft }}
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
      </Panel>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept278() {
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
      style={{ ...mono, color: C.white, background: C.bg }}
    >
      <style>{FLIP_CSS}</style>
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-lg"
              style={{ background: C.hinge, border: `1px solid ${C.line}`, color: C.amber }}
              aria-hidden="true"
            >
              <Train size={20} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[17px] font-bold uppercase tracking-[0.08em]"
                style={{ ...mono, color: C.white }}
              >
                Splitflap
              </div>
              <div
                className="text-[9px] font-bold uppercase tracking-[0.22em]"
                style={{ ...mono, color: C.muted }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-bold" style={{ ...mono, color: C.white }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.08em]"
                style={{ ...mono, color: C.green }}
              >
                <BadgeCheck size={12} strokeWidth={2.4} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[13px] font-bold"
              style={{
                ...mono,
                background: C.hinge,
                color: C.amber,
                border: `1px solid ${C.line}`,
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
                type="button"
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors ${RING}`}
                style={{
                  ...mono,
                  color: on ? C.bg : C.muted,
                  background: on ? C.amber : C.panel,
                  border: `1px solid ${on ? C.amber : C.line}`,
                }}
              >
                <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
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
          className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{ ...mono, borderColor: C.line, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Train size={12} strokeWidth={2.2} style={{ color: C.amber }} aria-hidden="true" />
            Splitflap-bord · v278
          </span>
          <span>De tegels draaien mee</span>
        </footer>
      </div>
    </div>
  );
}
