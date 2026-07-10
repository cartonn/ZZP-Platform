"use client";

// Concept 240 — "Glitch" · RGB-split & databending, with restraint.
// Digital decay as ATMOSPHERE only: chromatic aberration (cyan/magenta text-shadow
// offset) on headings and mono accent-labels, a low-opacity scanline overlay, and a
// short deterministic glitch-skew on hover. Crucially, the DATA itself — amounts,
// statuses, job details — stays rock-solid sharp and readable; glitch never touches
// running data text. Dark anthracite base, neon cyan + magenta used sparingly and
// AA-checked. Headings/mono-labels in Space Mono; body in Inter. Motion respects
// prefers-reduced-motion.

import { useState, type CSSProperties } from "react";
import {
  BadgeCheck,
  Clock,
  TriangleAlert,
  XCircle,
  TrendingUp,
  TrendingDown,
  Search,
  MapPin,
  Wallet,
  Calendar,
  Bookmark,
  BookmarkCheck,
  Check,
  Bell,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  FileText,
  RefreshCw,
  CircleAlert,
  Inbox,
  Plus,
  Minus,
  ChevronRight,
  Terminal,
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
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// Dark glitch palette. Neon accents are AA-safe on the panel/base backgrounds.
const C = {
  base: "#0c0d12", // anthracite base
  panel: "#14161d", // panel surface
  panelUp: "#1b1e28", // raised surface
  line: "rgba(231,235,242,0.10)", // hairline
  lineNeon: "rgba(0,229,255,0.35)",
  text: "#e7ebf2", // primary text
  textSoft: "#9aa3b5", // muted text
  cyan: "#00e5ff",
  magenta: "#ff2bd0",
  amber: "#ffb020",
  indigo: "#7c8cff",
  mint: "#28e0a8",
};

const mono = { fontFamily: "var(--font-lab-space-mono)" };
const body = { fontFamily: "var(--font-lab-inter)" };

// RGB-split shadow for headings/labels (atmosphere; never on running data).
const splitShadow = "1.4px 0 0 rgba(0,229,255,0.55), -1.4px 0 0 rgba(255,43,208,0.55)";

// Deterministic tilt/offset seeds for the databending accents.
const SEEDS = [1, 3, 2, 4, 1, 3];
const seed = (i: number): number => SEEDS[i % SEEDS.length] ?? 1;

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, tone: C.cyan };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.indigo };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, tone: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.magenta };
  }
}

// Status chip — sharp, label + icon, tinted border/text on dark (no glitch).
function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, tone } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[11.5px] font-semibold uppercase tracking-wide"
      style={{
        ...mono,
        color: tone,
        border: `1px solid ${tone}`,
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

// Glitch heading — RGB split + hover glitch-skew. Only for titles/labels.
function GlitchHead({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`c240-hoverglitch inline-block ${className}`}
      style={{ ...mono, color: C.text, textShadow: splitShadow, ...style }}
    >
      {children}
    </span>
  );
}

// Mono kicker label with cyan tint.
function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10.5px] font-bold uppercase tracking-[0.28em]"
      style={{ ...mono, color: C.cyan, textShadow: "0.8px 0 0 rgba(255,43,208,0.4)" }}
    >
      {children}
    </div>
  );
}

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-5">
      <Kicker>{kicker}</Kicker>
      <h2 className="mt-1 text-[24px] font-bold leading-none sm:text-[28px]">
        <GlitchHead>{title}</GlitchHead>
      </h2>
      <div
        className="mt-3 h-px w-full"
        style={{ background: `linear-gradient(90deg, ${C.cyan}, transparent)` }}
        aria-hidden="true"
      />
    </div>
  );
}

// Panel surface with hairline + faint scanlines.
function panelStyle(raised = false): CSSProperties {
  return {
    background: raised ? C.panelUp : C.panel,
    border: `1px solid ${C.line}`,
    borderRadius: 6,
  };
}

// Sharp sparkline in neon.
function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, idx) => {
      const x = (idx / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / span) * 88 - 6;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
      <polyline
        points={pts}
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

// Match readout — sharp mono number with neon ring.
function MatchReadout({ value }: { value: number }) {
  const tone = value >= 90 ? C.cyan : value >= 84 ? C.mint : C.indigo;
  return (
    <div
      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[4px] leading-none"
      style={{ border: `1px solid ${tone}`, background: "rgba(255,255,255,0.02)" }}
    >
      <span className="text-[16px] font-bold" style={{ ...mono, color: tone }}>
        {value}
      </span>
      <span
        className="text-[7.5px] font-bold uppercase tracking-widest"
        style={{ ...mono, color: C.textSoft }}
      >
        match
      </span>
    </div>
  );
}

// ---- Screens ---------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  return (
    <div className="space-y-8">
      <SectionHead kicker="sys://overzicht" title="Dashboard" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const tones = [C.cyan, C.magenta, C.mint, C.amber];
          const tone = tones[i % tones.length] ?? C.cyan;
          return (
            <div key={k.label} className="c240-hoverglitch p-4" style={panelStyle()}>
              <div className="flex items-center justify-between">
                <span
                  className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
                  style={{ ...mono, color: C.textSoft }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[10.5px] font-bold"
                  style={{ ...mono, color: k.up ? C.mint : C.amber }}
                >
                  <Trend size={11} strokeWidth={2.6} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              {/* Data value stays sharp — no glitch shadow */}
              <div
                className="mt-1 text-[28px] font-bold leading-none"
                style={{ ...mono, color: C.text }}
              >
                {k.value}
              </div>
              <div className="mt-2">
                <Spark data={k.spark} tone={tone} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div>
            <SectionHead kicker="match://top" title="Beste match" />
            <button
              onClick={onOpen}
              className="c240-hoverglitch group flex w-full items-start gap-4 p-5 text-left transition-colors hover:border-[color:var(--c240-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e5ff]"
              style={{ ...panelStyle(true), ["--c240-cyan" as string]: C.cyan }}
            >
              <MatchReadout value={top.match} />
              <div className="min-w-0 flex-1">
                <div
                  className="text-[18px] font-semibold leading-tight"
                  style={{ ...body, color: C.text }}
                >
                  {top.titel}
                </div>
                <div className="mt-0.5 text-[13px]" style={{ ...body, color: C.textSoft }}>
                  {top.opdrachtgever} · {top.plaats}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {top.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-[3px] border px-2 py-0.5 text-[11px] font-semibold"
                      style={{ ...mono, borderColor: C.line, color: C.textSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <ChevronRight
                size={20}
                className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
                style={{ color: C.cyan }}
                aria-hidden="true"
              />
            </button>
          </div>

          <div>
            <SectionHead kicker="inbox://stream" title="Berichten" />
            <ul className="space-y-2.5">
              {BERICHTEN.map((b) => (
                <li key={b.van} className="flex items-center gap-3 p-3" style={panelStyle()}>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] text-[12px] font-bold"
                    style={{ ...mono, border: `1px solid ${C.line}`, color: C.cyan }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="truncate text-[13px] font-semibold"
                        style={{ ...body, color: C.text }}
                      >
                        {b.van}
                      </span>
                      {b.ongelezen && (
                        <span
                          className="rounded-[3px] px-1.5 py-0.5 text-[9px] font-bold uppercase"
                          style={{ ...mono, color: C.base, background: C.cyan }}
                        >
                          nieuw
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[12.5px]" style={{ ...body, color: C.textSoft }}>
                      {b.preview}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px]" style={{ ...mono, color: C.textSoft }}>
                    {b.tijd}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <SectionHead kicker="task://queue" title="Acties" />
            <ul className="space-y-2.5">
              {ACTIES.map((a, i) => (
                <li key={a.titel} className="c240-hoverglitch p-4" style={panelStyle()}>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-[3px] text-[10px] font-bold"
                      style={{
                        ...mono,
                        color: C.base,
                        background: a.urgentie === "warning" ? C.amber : C.indigo,
                      }}
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <span
                      className="text-[14px] font-semibold leading-snug"
                      style={{ ...body, color: C.text }}
                    >
                      {a.titel}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12.5px]" style={{ ...body, color: C.textSoft }}>
                    {a.detail}
                  </p>
                  <span
                    className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-bold"
                    style={{ ...mono, color: C.cyan }}
                  >
                    {a.cta}
                    <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHead kicker="trust://certs" title="Certificaten" />
            <ul className="space-y-2">
              {CREDENTIALS.map((c) => (
                <li
                  key={c.naam}
                  className="flex items-center justify-between gap-2 p-3"
                  style={panelStyle()}
                >
                  <span
                    className="truncate text-[12.5px] font-medium"
                    style={{ ...body, color: C.text }}
                  >
                    {c.naam}
                  </span>
                  <StatusChip status={c.status} />
                </li>
              ))}
            </ul>
          </div>
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
    <div className="space-y-6">
      <SectionHead kicker="grep://opdrachten" title="Marktplaats" />

      <div className="flex items-center gap-2 px-3 py-2" style={panelStyle()}>
        <Search size={17} className="shrink-0" style={{ color: C.cyan }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="grep titel / plaats / skill…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[13.5px] outline-none placeholder:opacity-50"
          style={{ ...mono, color: C.text }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="rounded-[3px] px-2 py-1 text-[11px] font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e5ff]"
            style={{ ...mono, color: C.magenta, border: `1px solid ${C.magenta}` }}
          >
            clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 px-6 py-14 text-center"
          style={panelStyle()}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-[4px]"
            style={{ border: `1px solid ${C.magenta}`, color: C.magenta }}
            aria-hidden="true"
          >
            <Inbox size={26} strokeWidth={2} />
          </span>
          <h3 className="text-[18px] font-bold">
            <GlitchHead>0 resultaten</GlitchHead>
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...body, color: C.textSoft }}>
            Geen match voor &ldquo;{query}&rdquo;. Pas de zoekterm aan of wis het filter.
          </p>
          <button
            onClick={() => setQuery("")}
            className="mt-1 rounded-[4px] px-4 py-2 text-[13px] font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e5ff]"
            style={{ ...mono, color: C.base, background: C.cyan }}
          >
            reset filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <article
                key={o.id}
                className="c240-hoverglitch flex h-full flex-col p-5 transition-colors hover:border-[color:var(--c240-cyan)]"
                style={{ ...panelStyle(), ["--c240-cyan" as string]: C.cyan }}
              >
                <div className="flex items-start justify-between gap-3">
                  <MatchReadout value={o.match} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className="flex h-9 w-9 items-center justify-center rounded-[4px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e5ff]"
                    style={{
                      border: `1px solid ${isSaved ? C.cyan : C.line}`,
                      color: isSaved ? C.cyan : C.textSoft,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={16} strokeWidth={2.4} aria-hidden="true" />
                    ) : (
                      <Bookmark size={16} strokeWidth={2} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <h3
                  className="mt-3 text-[16px] font-semibold leading-tight"
                  style={{ ...body, color: C.text }}
                >
                  {o.titel}
                </h3>
                <div className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.textSoft }}>
                  {o.opdrachtgever}
                </div>
                <dl
                  className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]"
                  style={{ ...body, color: C.text }}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} style={{ color: C.textSoft }} aria-hidden="true" />
                    {o.plaats}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wallet size={13} style={{ color: C.textSoft }} aria-hidden="true" />
                    {o.tarief}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} style={{ color: C.textSoft }} aria-hidden="true" />
                    {o.uren}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} style={{ color: C.textSoft }} aria-hidden="true" />
                    {o.start}
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-[3px] border px-2 py-0.5 text-[10.5px] font-semibold uppercase"
                      style={{ ...mono, borderColor: C.line, color: C.textSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => onOpen(o)}
                  className="group mt-4 inline-flex items-center justify-center gap-1.5 rounded-[4px] py-2.5 text-[13px] font-bold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e5ff]"
                  style={{ ...mono, color: C.cyan, border: `1px solid ${C.lineNeon}` }}
                >
                  open opdracht
                  <ArrowRight
                    size={14}
                    strokeWidth={2.6}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </button>
              </article>
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
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-[12px] font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e5ff]"
        style={{ ...mono, color: C.textSoft, border: `1px solid ${C.line}` }}
      >
        <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
        terug
      </button>

      <div className="p-6" style={panelStyle(true)}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <MatchReadout value={opdracht.match} />
            <div>
              <h2 className="text-[24px] font-bold leading-tight sm:text-[27px]">
                <GlitchHead style={{ ...body }}>{opdracht.titel}</GlitchHead>
              </h2>
              <div className="mt-1 text-[13.5px]" style={{ ...body, color: C.textSoft }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <button
            onClick={() => toggleSave(opdracht.id)}
            aria-pressed={isSaved}
            className="inline-flex items-center gap-1.5 rounded-[4px] px-3 py-2 text-[12px] font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e5ff]"
            style={{
              ...mono,
              color: isSaved ? C.cyan : C.textSoft,
              border: `1px solid ${isSaved ? C.cyan : C.line}`,
            }}
          >
            {isSaved ? (
              <BookmarkCheck size={14} strokeWidth={2.4} aria-hidden="true" />
            ) : (
              <Bookmark size={14} strokeWidth={2} aria-hidden="true" />
            )}
            {isSaved ? "bewaard" : "bewaar"}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "tarief", value: opdracht.tarief },
            { Icon: Clock, label: "inzet", value: opdracht.uren },
            { Icon: Calendar, label: "start", value: opdracht.start },
            { Icon: MapPin, label: "plaats", value: opdracht.plaats },
          ].map((m) => (
            <div key={m.label} className="p-3" style={panelStyle()}>
              <m.Icon size={15} style={{ color: C.cyan }} aria-hidden="true" />
              <div
                className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.textSoft }}
              >
                {m.label}
              </div>
              <div className="text-[14.5px] font-semibold" style={{ ...body, color: C.text }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="p-5" style={panelStyle()}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-[3px]"
              style={{ color: C.mint, border: `1px solid ${C.mint}` }}
              aria-hidden="true"
            >
              <Plus size={13} strokeWidth={2.8} />
            </span>
            <span className="text-[13px] font-bold uppercase" style={{ ...mono, color: C.mint }}>
              waarom dit past
            </span>
          </div>
          <ul className="space-y-2">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...body, color: C.text }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.mint }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5" style={panelStyle()}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-[3px]"
              style={{ color: C.amber, border: `1px solid ${C.amber}` }}
              aria-hidden="true"
            >
              <Minus size={13} strokeWidth={2.8} />
            </span>
            <span className="text-[13px] font-bold uppercase" style={{ ...mono, color: C.amber }}>
              let op
            </span>
          </div>
          <ul className="space-y-2">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...body, color: C.text }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.4}
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

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className="inline-flex items-center gap-2 rounded-[4px] px-6 py-3 text-[14px] font-bold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e5ff]"
          style={{
            ...mono,
            color: applied ? C.base : C.base,
            background: applied ? C.mint : C.cyan,
          }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.8} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.6} aria-hidden="true" />
          )}
          {applied ? "reactie verstuurd" : "reageer op opdracht"}
        </button>
        {applied && (
          <span className="text-[12.5px]" style={{ ...body, color: C.textSoft }}>
            Gemiddelde reactietijd opdrachtgever: 6 uur.
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
    <div className="space-y-8">
      <SectionHead kicker="verify://trust" title="Verificatie" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            return (
              <div key={c.naam} className="flex items-center gap-3 p-4" style={panelStyle()}>
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e5ff]"
                  style={{
                    border: `1px solid ${done ? C.cyan : C.line}`,
                    background: done ? C.cyan : "transparent",
                    color: C.base,
                  }}
                >
                  {done && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ ...body, color: C.text }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...body, color: C.textSoft }}>
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
            <span className="inline-flex items-center gap-2 text-[15px] font-bold">
              <FileText size={17} strokeWidth={2.4} style={{ color: C.cyan }} aria-hidden="true" />
              <GlitchHead>Documenten</GlitchHead>
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className="flex h-8 w-8 items-center justify-center rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e5ff]"
              style={{ border: `1px solid ${C.line}`, color: C.cyan }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className="rounded-[3px] px-2.5 py-1 text-[10.5px] font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e5ff]"
                style={{
                  ...mono,
                  color: feedState === s ? C.base : C.textSoft,
                  background: feedState === s ? C.cyan : "transparent",
                  border: `1px solid ${feedState === s ? C.cyan : C.line}`,
                }}
              >
                {s === "ok" ? "geladen" : s === "loading" ? "laden" : "fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="p-3" style={panelStyle()}>
                  <div
                    className="h-3 w-2/3 animate-pulse rounded"
                    style={{ background: "rgba(231,235,242,0.12)" }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: "rgba(231,235,242,0.08)" }}
                  />
                </li>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <div
              className="flex flex-col items-center gap-2 px-4 py-8 text-center"
              style={panelStyle()}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-[4px]"
                style={{ color: C.magenta, border: `1px solid ${C.magenta}` }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-bold">
                <GlitchHead>Laden mislukt</GlitchHead>
              </div>
              <p className="text-[12px]" style={{ ...body, color: C.textSoft }}>
                Verbinding met de documentenkluis verbroken.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className="mt-1 rounded-[4px] px-4 py-2 text-[12px] font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e5ff]"
                style={{ ...mono, color: C.base, background: C.cyan }}
              >
                opnieuw
              </button>
            </div>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <li key={d.naam} className="flex items-center gap-3 p-3" style={panelStyle()}>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] text-[8.5px] font-bold"
                    style={{ ...mono, border: `1px solid ${C.line}`, color: C.cyan }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12.5px] font-semibold"
                      style={{ ...body, color: C.text }}
                    >
                      {d.naam}
                    </div>
                    <div className="text-[11px]" style={{ ...mono, color: C.textSoft }}>
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
    <div className="space-y-6">
      <SectionHead kicker="task://queue" title="Acties" />

      <div className="inline-flex items-center gap-2 px-4 py-2" style={panelStyle()}>
        <span
          className="flex h-6 w-6 items-center justify-center rounded-[3px] text-[12px] font-bold"
          style={{ ...mono, color: C.base, background: openCount === 0 ? C.mint : C.cyan }}
          aria-hidden="true"
        >
          {openCount}
        </span>
        <span className="text-[13px] font-semibold" style={{ ...body, color: C.text }}>
          {openCount === 0
            ? "Wachtrij leeg — alles afgerond"
            : `${openCount} openstaande acties in de wachtrij`}
        </span>
      </div>

      <ul className="space-y-3">
        {ACTIES.map((a, i) => {
          const isDone = done.has(a.titel);
          return (
            <li
              key={a.titel}
              className="c240-hoverglitch flex items-start gap-4 p-5"
              style={panelStyle(isDone)}
            >
              <button
                onClick={() => toggleDone(a.titel)}
                aria-pressed={isDone}
                aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e5ff]"
                style={{
                  border: `1px solid ${isDone ? C.mint : C.line}`,
                  background: isDone ? C.mint : "transparent",
                  color: C.base,
                }}
              >
                {isDone && <Check size={16} strokeWidth={3} aria-hidden="true" />}
              </button>
              <div className="min-w-0 flex-1">
                <div
                  className="text-[15px] font-semibold leading-snug"
                  style={{
                    ...body,
                    color: C.text,
                    textDecoration: isDone ? "line-through" : "none",
                    opacity: isDone ? 0.55 : 1,
                  }}
                >
                  {a.titel}
                </div>
                <p
                  className="mt-1 text-[12.5px]"
                  style={{ ...body, color: C.textSoft, opacity: isDone ? 0.55 : 1 }}
                >
                  {a.detail}
                </p>
                {!isDone && (
                  <span
                    className="mt-2.5 inline-flex items-center gap-1 rounded-[4px] px-3 py-1.5 text-[12px] font-bold uppercase"
                    style={{
                      ...mono,
                      color: a.urgentie === "warning" ? C.amber : C.cyan,
                      border: `1px solid ${a.urgentie === "warning" ? C.amber : C.lineNeon}`,
                    }}
                  >
                    {a.cta}
                    <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
                  </span>
                )}
              </div>
              <span
                className="text-[10px] font-bold uppercase"
                style={{ ...mono, color: C.textSoft }}
              >
                #{seed(i)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Facturen() {
  const badgeTone = (status: string): string =>
    status === "Betaald" ? C.mint : status === "Openstaand" ? C.amber : C.indigo;
  return (
    <div className="space-y-6">
      <SectionHead kicker="fin://facturen" title="Facturen" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "betaald mnd", value: "€ 5.552", tone: C.mint },
          { label: "openstaand", value: "€ 1.350", tone: C.amber },
          { label: "concept", value: "€ 880", tone: C.indigo },
        ].map((s) => (
          <div key={s.label} className="p-4" style={panelStyle()}>
            <div
              className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.textSoft }}
            >
              {s.label}
            </div>
            <div className="mt-1 text-[24px] font-bold" style={{ ...mono, color: s.tone }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="p-1.5" style={panelStyle()}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["factuur", "klant", "datum", "bedrag", "status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em]"
                    style={{ ...mono, color: C.textSoft }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => (
                <tr key={f.nr} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td
                    className="px-3 py-3 text-[12.5px] font-bold"
                    style={{ ...mono, color: C.cyan }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-3 py-3 text-[13px]" style={{ ...body, color: C.text }}>
                    {f.klant}
                  </td>
                  <td className="px-3 py-3 text-[12.5px]" style={{ ...mono, color: C.textSoft }}>
                    {f.datum}
                  </td>
                  <td
                    className="px-3 py-3 text-[13px] font-semibold"
                    style={{ ...mono, color: C.text }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[11px] font-bold uppercase"
                      style={{
                        ...mono,
                        color: badgeTone(f.status),
                        border: `1px solid ${badgeTone(f.status)}`,
                      }}
                    >
                      {f.status === "Betaald" ? (
                        <Check size={11} strokeWidth={3} aria-hidden="true" />
                      ) : f.status === "Openstaand" ? (
                        <Clock size={11} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <FileText size={11} strokeWidth={2.6} aria-hidden="true" />
                      )}
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- Shell -----------------------------------------------------------------

export function Concept240() {
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
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, color: C.text, background: C.base }}
    >
      {/* Local styles: scanlines + deterministic hover glitch, reduced-motion aware */}
      <style>{`
        .c240-scan::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: repeating-linear-gradient(
            0deg,
            rgba(0,0,0,0.22) 0px,
            rgba(0,0,0,0.22) 1px,
            transparent 1px,
            transparent 3px
          );
          opacity: 0.5;
          z-index: 0;
        }
        @keyframes c240-glitch {
          0% { transform: translate(0,0) skewX(0deg); }
          25% { transform: translate(-1.5px,0) skewX(-2.5deg); }
          50% { transform: translate(1.5px,0) skewX(1.5deg); }
          75% { transform: translate(-1px,0) skewX(-1deg); }
          100% { transform: translate(0,0) skewX(0deg); }
        }
        .c240-hoverglitch:hover { animation: c240-glitch 0.34s steps(2, end) 1; }
        @media (prefers-reduced-motion: reduce) {
          .c240-hoverglitch:hover { animation: none; }
        }
      `}</style>

      {/* Scanline overlay */}
      <div className="c240-scan pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative z-[1] mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-[5px]"
              style={{ border: `1px solid ${C.cyan}`, color: C.cyan }}
              aria-hidden="true"
            >
              <Terminal size={20} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div className="text-[20px] font-bold">
                <GlitchHead>GLITCH</GlitchHead>
              </div>
              <div
                className="text-[10px] font-bold uppercase tracking-[0.24em]"
                style={{ ...mono, color: C.textSoft }}
              >
                zzp · signal ok
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...body, color: C.text }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[10.5px]"
                style={{ ...mono, color: C.cyan }}
              >
                <BadgeCheck size={11} strokeWidth={2.4} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-[5px] text-[14px] font-bold"
              style={{ ...mono, border: `1px solid ${C.magenta}`, color: C.magenta }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav className="mb-8 flex flex-wrap gap-1.5 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="c240-hoverglitch shrink-0 rounded-[4px] px-3.5 py-2 text-[12px] font-bold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e5ff]"
                style={{
                  ...mono,
                  color: on ? C.base : C.textSoft,
                  background: on ? C.cyan : "transparent",
                  border: `1px solid ${on ? C.cyan : C.line}`,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </nav>

        <main>
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

        {/* Footer mono readout with subtle glitch accents */}
        <footer
          className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[10.5px]"
          style={{ ...mono, borderColor: C.line, color: C.textSoft }}
        >
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare
              size={12}
              strokeWidth={2.2}
              style={{ color: C.cyan }}
              aria-hidden="true"
            />
            {BERICHTEN.filter((b) => b.ongelezen).length} ongelezen ·{" "}
            <Bell size={11} strokeWidth={2.2} className="inline" aria-hidden="true" />{" "}
            {ACTIES.length} acties
          </span>
          <span style={{ color: C.magenta }}>render//stable · data//sharp</span>
        </footer>
      </div>
    </div>
  );
}
