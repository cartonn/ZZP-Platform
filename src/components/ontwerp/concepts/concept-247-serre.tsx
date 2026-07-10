"use client";

// Concept 247 — "Serre" · solarpunk daylight optimism.
// A sustainable-tech mood: living botanical green + warm brass/ochre on airy,
// sun-washed cream surfaces. Thin leafy line-accents live at the EDGES to frame
// the data — they never overgrow or clutter the numbers. The data itself stays
// museum-clean, crisp and readable. Soft organic corners throughout. Headings in
// Fraunces, body in Inter. A gentle leaf-sway animates only the decorative edge
// accents, and is fully disabled under prefers-reduced-motion.

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
  Leaf,
  Sprout,
  Sun,
  Plus,
  Minus,
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
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// Serre palette — daylight cream base, living green + warm brass. All text tones
// are checked for WCAG AA contrast on the cream/white surfaces they sit on.
const C = {
  base: "#f6f4ea", // sun-washed cream daylight base
  panel: "#fffdf7", // bright airy panel
  panelSoft: "#f1efe2", // recessed / tinted surface
  greenTint: "#e6f0e5", // pale green wash
  line: "rgba(31,42,36,0.12)", // soft hairline
  lineGreen: "rgba(22,107,63,0.28)",
  ink: "#1f2a24", // deep green-charcoal (primary text)
  inkSoft: "#4f5f55", // muted text (AA on cream/white)
  green: "#2f8f5b", // fresh living green (accents, borders, icons)
  greenDeep: "#166b3f", // deep green (text + solid buttons w/ white)
  brass: "#9a6510", // warm ochre/brass text
  brassBright: "#c58a2a", // brighter brass accent
  slate: "#2f5f8f", // calm blue-slate (in beoordeling)
  terracotta: "#b03a26", // warm terracotta (afgewezen / fout)
  white: "#ffffff",
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const body = { fontFamily: "var(--font-lab-inter)" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: BadgeCheck,
        tone: C.greenDeep,
        bg: "rgba(22,107,63,0.10)",
      };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.slate, bg: "rgba(47,95,143,0.10)" };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        tone: C.brass,
        bg: "rgba(154,101,16,0.12)",
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.terracotta, bg: "rgba(176,58,38,0.10)" };
  }
}

// Status chip — always label + icon, never colour-only. Tinted pill on light.
function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, tone, bg } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
      style={{ ...body, color: tone, background: bg, border: `1px solid ${tone}33` }}
    >
      <Icon size={13} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

// Section header — Fraunces display title with a small leafy kicker.
function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-5">
      <div
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em]"
        style={{ ...body, color: C.green }}
      >
        <Sprout size={13} strokeWidth={2.4} aria-hidden="true" />
        {kicker}
      </div>
      <h2
        className="mt-1.5 text-[26px] font-semibold leading-none sm:text-[30px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h2>
      <div
        className="mt-3 h-px w-full"
        style={{ background: `linear-gradient(90deg, ${C.lineGreen}, transparent)` }}
        aria-hidden="true"
      />
    </div>
  );
}

// Soft organic panel surface.
function panelStyle(soft = false): CSSProperties {
  return {
    background: soft ? C.panelSoft : C.panel,
    border: `1px solid ${C.line}`,
    borderRadius: 18,
  };
}

// Sparkline — soft green line with a light area fill, on the daylight surface.
function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, idx) => {
    const x = (idx / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 84 - 8;
    return { x, y };
  });
  const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `0,100 ${line} 100,100`;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-9 w-full" aria-hidden="true">
      <polygon points={area} fill={tone} opacity={0.12} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Match dial — a small leaf-rounded badge with the match percentage.
function MatchBadge({ value }: { value: number }) {
  const tone = value >= 90 ? C.greenDeep : value >= 84 ? C.green : C.brass;
  return (
    <div
      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center leading-none"
      style={{
        borderRadius: "50% 50% 50% 12px",
        border: `1.5px solid ${tone}`,
        background: C.greenTint,
      }}
    >
      <span className="text-[16px] font-semibold" style={{ ...display, color: tone }}>
        {value}
      </span>
      <span
        className="text-[7.5px] font-semibold uppercase tracking-[0.14em]"
        style={{ ...body, color: C.inkSoft }}
      >
        match
      </span>
    </div>
  );
}

// Decorative leafy edge accent (gentle sway; guarded by prefers-reduced-motion).
function LeafEdge({
  className,
  rotate = 0,
  delay = 0,
}: {
  className: string;
  rotate?: number;
  delay?: number;
}) {
  return (
    <span
      className={`c247-sway pointer-events-none absolute ${className}`}
      style={
        {
          ["--c247-rot" as string]: `${rotate}deg`,
          animationDelay: `${delay}s`,
          color: C.green,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <Leaf size={26} strokeWidth={1.5} />
    </span>
  );
}

// ---- Screens ---------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const kpiTones = [C.green, C.slate, C.greenDeep, C.brass];
  return (
    <div className="space-y-8">
      <SectionHead kicker="Overzicht" title="Goedemorgen, Sanne" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const tone = kpiTones[i % kpiTones.length] ?? C.green;
          return (
            <div key={k.label} className="p-5" style={panelStyle()}>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[12px] font-medium" style={{ ...body, color: C.inkSoft }}>
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
                  style={{ ...body, color: k.up ? C.greenDeep : C.brass }}
                >
                  <Trend size={12} strokeWidth={2.6} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-1.5 text-[28px] font-semibold tabular-nums leading-none"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-3">
                <Spark data={k.spark} tone={tone} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div>
            <SectionHead kicker="Beste match" title="Aanbevolen opdracht" />
            <button
              onClick={onOpen}
              className="group flex w-full items-start gap-4 p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={
                {
                  ...panelStyle(),
                  ["--tw-ring-color" as string]: C.green,
                  ["--tw-ring-offset-color" as string]: C.base,
                } as CSSProperties
              }
            >
              <MatchBadge value={top.match} />
              <div className="min-w-0 flex-1">
                <div
                  className="text-[18px] font-semibold leading-tight"
                  style={{ ...display, color: C.ink }}
                >
                  {top.titel}
                </div>
                <div className="mt-0.5 text-[13px]" style={{ ...body, color: C.inkSoft }}>
                  {top.opdrachtgever} · {top.plaats}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {top.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{ ...body, background: C.greenTint, color: C.greenDeep }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <ChevronRight
                size={20}
                className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
                style={{ color: C.green }}
                aria-hidden="true"
              />
            </button>
          </div>

          <div>
            <SectionHead kicker="Berichten" title="Recente gesprekken" />
            <ul className="space-y-2.5">
              {BERICHTEN.map((b) => (
                <li key={b.van} className="flex items-center gap-3 p-3.5" style={panelStyle()}>
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center text-[12px] font-semibold"
                    style={{
                      ...body,
                      borderRadius: "50% 50% 50% 10px",
                      background: C.greenTint,
                      color: C.greenDeep,
                    }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="truncate text-[13.5px] font-semibold"
                        style={{ ...body, color: C.ink }}
                      >
                        {b.van}
                      </span>
                      {b.ongelezen && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                          style={{ ...body, color: C.white, background: C.green }}
                        >
                          nieuw
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
                      {b.preview}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px]" style={{ ...body, color: C.inkSoft }}>
                    {b.tijd}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <SectionHead kicker="Acties" title="Volgende stap" />
            <ul className="space-y-2.5">
              {ACTIES.map((a) => (
                <li key={a.titel} className="p-4" style={panelStyle()}>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{
                        color: C.white,
                        background: a.urgentie === "warning" ? C.brassBright : C.green,
                      }}
                      aria-hidden="true"
                    >
                      {a.urgentie === "warning" ? (
                        <TriangleAlert size={13} strokeWidth={2.4} />
                      ) : (
                        <Leaf size={13} strokeWidth={2.4} />
                      )}
                    </span>
                    <span
                      className="text-[14px] font-semibold leading-snug"
                      style={{ ...body, color: C.ink }}
                    >
                      {a.titel}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
                    {a.detail}
                  </p>
                  <span
                    className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold"
                    style={{ ...body, color: C.greenDeep }}
                  >
                    {a.cta}
                    <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHead kicker="Vertrouwen" title="Certificaten" />
            <ul className="space-y-2">
              {CREDENTIALS.map((c) => (
                <li
                  key={c.naam}
                  className="flex items-center justify-between gap-2 p-3.5"
                  style={panelStyle()}
                >
                  <span
                    className="truncate text-[12.5px] font-medium"
                    style={{ ...body, color: C.ink }}
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
      <SectionHead kicker="Marktplaats" title="Opdrachten die bij je passen" />

      <div
        className="flex items-center gap-2.5 px-4 py-2.5"
        style={{ ...panelStyle(), borderRadius: 999 }}
      >
        <Search size={18} className="shrink-0" style={{ color: C.green }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[14px] outline-none placeholder:opacity-60"
          style={{ ...body, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="rounded-full px-3 py-1 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2"
            style={
              {
                ...body,
                color: C.brass,
                background: "rgba(154,101,16,0.10)",
                ["--tw-ring-color" as string]: C.brass,
              } as CSSProperties
            }
          >
            Wissen
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 px-6 py-14 text-center"
          style={panelStyle()}
        >
          <span
            className="flex h-16 w-16 items-center justify-center"
            style={{ borderRadius: "50% 50% 50% 16px", background: C.greenTint, color: C.green }}
            aria-hidden="true"
          >
            <Sprout size={28} strokeWidth={1.8} />
          </span>
          <h3 className="text-[19px] font-semibold" style={{ ...display, color: C.ink }}>
            Nog geen resultaten
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...body, color: C.inkSoft }}>
            Geen opdracht gevonden voor &ldquo;{query}&rdquo;. Pas je zoekterm aan of wis het
            filter.
          </p>
          <button
            onClick={() => setQuery("")}
            className="mt-1 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={
              {
                ...body,
                background: C.greenDeep,
                ["--tw-ring-color" as string]: C.green,
                ["--tw-ring-offset-color" as string]: C.base,
              } as CSSProperties
            }
          >
            Filter wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <article key={o.id} className="flex h-full flex-col p-5" style={panelStyle()}>
                <div className="flex items-start justify-between gap-3">
                  <MatchBadge value={o.match} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2"
                    style={
                      {
                        border: `1px solid ${isSaved ? C.green : C.line}`,
                        background: isSaved ? C.greenTint : "transparent",
                        color: isSaved ? C.greenDeep : C.inkSoft,
                        ["--tw-ring-color" as string]: C.green,
                      } as CSSProperties
                    }
                  >
                    {isSaved ? (
                      <BookmarkCheck size={16} strokeWidth={2.4} aria-hidden="true" />
                    ) : (
                      <Bookmark size={16} strokeWidth={2} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <h3
                  className="mt-3 text-[16.5px] font-semibold leading-tight"
                  style={{ ...display, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <div className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
                  {o.opdrachtgever}
                </div>
                <dl
                  className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]"
                  style={{ ...body, color: C.ink }}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} style={{ color: C.green }} aria-hidden="true" />
                    {o.plaats}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wallet size={13} style={{ color: C.green }} aria-hidden="true" />
                    {o.tarief}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} style={{ color: C.green }} aria-hidden="true" />
                    {o.uren}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} style={{ color: C.green }} aria-hidden="true" />
                    {o.start}
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{ ...body, background: C.panelSoft, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => onOpen(o)}
                  className="group mt-4 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={
                    {
                      ...body,
                      color: C.greenDeep,
                      border: `1px solid ${C.lineGreen}`,
                      background: "transparent",
                      ["--tw-ring-color" as string]: C.green,
                    } as CSSProperties
                  }
                >
                  Bekijk opdracht
                  <ArrowRight
                    size={14}
                    strokeWidth={2.4}
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
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2"
        style={
          {
            ...body,
            color: C.inkSoft,
            border: `1px solid ${C.line}`,
            background: C.panel,
            ["--tw-ring-color" as string]: C.green,
          } as CSSProperties
        }
      >
        <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
        Terug naar marktplaats
      </button>

      <div className="relative overflow-hidden p-6" style={panelStyle()}>
        <LeafEdge className="right-4 top-3" rotate={24} delay={0.4} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <MatchBadge value={opdracht.match} />
            <div>
              <h2
                className="text-[25px] font-semibold leading-tight sm:text-[28px]"
                style={{ ...display, color: C.ink }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[13.5px]" style={{ ...body, color: C.inkSoft }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <button
            onClick={() => toggleSave(opdracht.id)}
            aria-pressed={isSaved}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2"
            style={
              {
                ...body,
                color: isSaved ? C.greenDeep : C.inkSoft,
                border: `1px solid ${isSaved ? C.green : C.line}`,
                background: isSaved ? C.greenTint : C.panel,
                ["--tw-ring-color" as string]: C.green,
              } as CSSProperties
            }
          >
            {isSaved ? (
              <BookmarkCheck size={14} strokeWidth={2.4} aria-hidden="true" />
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
            <div key={m.label} className="p-3.5" style={{ ...panelStyle(true), borderRadius: 14 }}>
              <m.Icon size={15} style={{ color: C.green }} aria-hidden="true" />
              <div
                className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...body, color: C.inkSoft }}
              >
                {m.label}
              </div>
              <div className="text-[14.5px] font-semibold" style={{ ...body, color: C.ink }}>
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
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ color: C.white, background: C.green }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={2.8} />
            </span>
            <span className="text-[13.5px] font-semibold" style={{ ...body, color: C.greenDeep }}>
              Waarom dit past
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...body, color: C.ink }}
              >
                <Check
                  size={16}
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
        <div className="p-5" style={panelStyle()}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ color: C.white, background: C.brassBright }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={2.8} />
            </span>
            <span className="text-[13.5px] font-semibold" style={{ ...body, color: C.brass }}>
              Let op
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...body, color: C.ink }}
              >
                <TriangleAlert
                  size={16}
                  strokeWidth={2.4}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.brass }}
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
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={
            {
              ...body,
              background: applied ? C.green : C.greenDeep,
              ["--tw-ring-color" as string]: C.green,
              ["--tw-ring-offset-color" as string]: C.base,
            } as CSSProperties
          }
        >
          {applied ? (
            <Check size={17} strokeWidth={2.8} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </button>
        {applied && (
          <span className="text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
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
  docState,
  setDocState,
}: {
  checked: Set<string>;
  toggleCheck: (naam: string) => void;
  docState: "ok" | "loading" | "error";
  setDocState: (s: "ok" | "loading" | "error") => void;
}) {
  return (
    <div className="space-y-8">
      <SectionHead kicker="Verificatie" title="Jouw geverifieerde profiel" />

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
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={
                    {
                      border: `1.5px solid ${done ? C.green : C.line}`,
                      background: done ? C.green : "transparent",
                      color: C.white,
                      ["--tw-ring-color" as string]: C.green,
                    } as CSSProperties
                  }
                >
                  {done && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ ...body, color: C.ink }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...body, color: C.inkSoft }}>
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
              className="inline-flex items-center gap-2 text-[15px] font-semibold"
              style={{ ...display, color: C.ink }}
            >
              <FileText size={17} strokeWidth={2.2} style={{ color: C.green }} aria-hidden="true" />
              Documenten
            </span>
            <button
              onClick={() => setDocState(docState === "loading" ? "ok" : "loading")}
              className="flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2"
              style={
                {
                  border: `1px solid ${C.line}`,
                  color: C.green,
                  ["--tw-ring-color" as string]: C.green,
                } as CSSProperties
              }
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
                aria-selected={docState === s}
                onClick={() => setDocState(s)}
                className="rounded-full px-3 py-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2"
                style={
                  {
                    ...body,
                    color: docState === s ? C.white : C.inkSoft,
                    background: docState === s ? C.greenDeep : "transparent",
                    border: `1px solid ${docState === s ? C.greenDeep : C.line}`,
                    ["--tw-ring-color" as string]: C.green,
                  } as CSSProperties
                }
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {docState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="p-3.5" style={panelStyle()}>
                  <div
                    className="h-3 w-2/3 animate-pulse rounded-full"
                    style={{ background: "rgba(31,42,36,0.10)" }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse rounded-full"
                    style={{ background: "rgba(31,42,36,0.06)" }}
                  />
                </li>
              ))}
            </ul>
          )}

          {docState === "error" && (
            <div
              className="flex flex-col items-center gap-2 px-4 py-8 text-center"
              style={panelStyle()}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ color: C.terracotta, background: "rgba(176,58,38,0.10)" }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-semibold" style={{ ...display, color: C.ink }}>
                Laden mislukt
              </div>
              <p className="text-[12px]" style={{ ...body, color: C.inkSoft }}>
                We konden de documentenkluis niet bereiken.
              </p>
              <button
                onClick={() => setDocState("ok")}
                className="mt-1 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2"
                style={
                  {
                    ...body,
                    background: C.greenDeep,
                    ["--tw-ring-color" as string]: C.green,
                  } as CSSProperties
                }
              >
                <RefreshCw size={13} strokeWidth={2.4} aria-hidden="true" />
                Opnieuw proberen
              </button>
            </div>
          )}

          {docState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <li key={d.naam} className="flex items-center gap-3 p-3.5" style={panelStyle()}>
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{
                      ...body,
                      borderRadius: "50% 50% 50% 10px",
                      background: C.greenTint,
                      color: C.greenDeep,
                    }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12.5px] font-semibold"
                      style={{ ...body, color: C.ink }}
                    >
                      {d.naam}
                    </div>
                    <div className="text-[11px]" style={{ ...body, color: C.inkSoft }}>
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
  const allDone = openCount === 0;
  return (
    <div className="space-y-6">
      <SectionHead kicker="Acties" title="Wat vraagt je aandacht" />

      <div
        className="inline-flex items-center gap-2.5 px-4 py-2.5"
        style={{ ...panelStyle(), borderRadius: 999 }}
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold text-white"
          style={{ ...body, background: allDone ? C.green : C.brassBright }}
          aria-hidden="true"
        >
          {allDone ? <Check size={15} strokeWidth={3} /> : openCount}
        </span>
        <span className="text-[13.5px] font-semibold" style={{ ...body, color: C.ink }}>
          {allDone ? "Alles afgerond — mooi opgeruimd" : `${openCount} openstaande acties`}
        </span>
      </div>

      {allDone ? (
        <div
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          style={panelStyle()}
        >
          <span
            className="flex h-16 w-16 items-center justify-center"
            style={{ borderRadius: "50% 50% 50% 16px", background: C.greenTint, color: C.green }}
            aria-hidden="true"
          >
            <Sun size={28} strokeWidth={1.8} />
          </span>
          <h3 className="text-[19px] font-semibold" style={{ ...display, color: C.ink }}>
            Niets meer te doen
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...body, color: C.inkSoft }}>
            Je hebt alle acties afgerond. Nieuwe taken verschijnen hier zodra ze binnenkomen.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {ACTIES.map((a) => {
            const isDone = done.has(a.titel);
            return (
              <li key={a.titel} className="flex items-start gap-4 p-5" style={panelStyle(isDone)}>
                <button
                  onClick={() => toggleDone(a.titel)}
                  aria-pressed={isDone}
                  aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={
                    {
                      border: `1.5px solid ${isDone ? C.green : C.line}`,
                      background: isDone ? C.green : "transparent",
                      color: C.white,
                      ["--tw-ring-color" as string]: C.green,
                    } as CSSProperties
                  }
                >
                  {isDone && <Check size={16} strokeWidth={3} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      style={{
                        ...body,
                        color: a.urgentie === "warning" ? C.brass : C.slate,
                        background:
                          a.urgentie === "warning"
                            ? "rgba(154,101,16,0.12)"
                            : "rgba(47,95,143,0.10)",
                      }}
                    >
                      {a.urgentie === "warning" ? (
                        <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" />
                      ) : (
                        <Leaf size={11} strokeWidth={2.4} aria-hidden="true" />
                      )}
                      {a.urgentie === "warning" ? "Urgent" : "Info"}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 text-[15px] font-semibold leading-snug"
                    style={{
                      ...body,
                      color: C.ink,
                      textDecoration: isDone ? "line-through" : "none",
                      opacity: isDone ? 0.55 : 1,
                    }}
                  >
                    {a.titel}
                  </div>
                  <p
                    className="mt-1 text-[12.5px]"
                    style={{ ...body, color: C.inkSoft, opacity: isDone ? 0.55 : 1 }}
                  >
                    {a.detail}
                  </p>
                  {!isDone && (
                    <span
                      className="mt-2.5 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                      style={{ ...body, color: C.greenDeep, border: `1px solid ${C.lineGreen}` }}
                    >
                      {a.cta}
                      <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Facturen() {
  const badge = (status: string): { tone: string; bg: string; Icon: LucideIcon } => {
    if (status === "Betaald") return { tone: C.greenDeep, bg: "rgba(22,107,63,0.10)", Icon: Check };
    if (status === "Openstaand") return { tone: C.brass, bg: "rgba(154,101,16,0.12)", Icon: Clock };
    return { tone: C.slate, bg: "rgba(47,95,143,0.10)", Icon: FileText };
  };
  return (
    <div className="space-y-6">
      <SectionHead kicker="Facturen" title="Jouw facturatie" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald deze maand", value: "€ 5.552", tone: C.greenDeep },
          { label: "Openstaand", value: "€ 1.350", tone: C.brass },
          { label: "Concept", value: "€ 880", tone: C.slate },
        ].map((s) => (
          <div key={s.label} className="p-4" style={panelStyle()}>
            <div
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...body, color: C.inkSoft }}
            >
              {s.label}
            </div>
            <div
              className="mt-1 text-[24px] font-semibold tabular-nums"
              style={{ ...display, color: s.tone }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="p-2" style={panelStyle()}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                    style={{ ...body, color: C.inkSoft }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const b = badge(f.status);
                return (
                  <tr key={f.nr} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td
                      className="px-3 py-3.5 text-[12.5px] font-semibold"
                      style={{ ...body, color: C.greenDeep }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3.5 text-[13px]" style={{ ...body, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td className="px-3 py-3.5 text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3.5 text-[13px] font-semibold tabular-nums"
                      style={{ ...body, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{
                          ...body,
                          color: b.tone,
                          background: b.bg,
                          border: `1px solid ${b.tone}33`,
                        }}
                      >
                        <b.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
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

export function Concept247() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set(["OPD-2041"]));
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [doneActions, setDoneActions] = useState<Set<string>>(new Set());
  const [docState, setDocState] = useState<"ok" | "loading" | "error">("ok");
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
      style={{ ...body, color: C.ink, background: C.base }}
    >
      {/* Local styles: gentle leaf sway on decorative edge accents only.
          A soft radial daylight glow warms the top. Motion respects reduced-motion. */}
      <style>{`
        @keyframes c247-sway {
          0% { transform: rotate(var(--c247-rot, 0deg)); }
          50% { transform: rotate(calc(var(--c247-rot, 0deg) + 6deg)); }
          100% { transform: rotate(var(--c247-rot, 0deg)); }
        }
        .c247-sway { transform-origin: 50% 90%; animation: c247-sway 6s ease-in-out infinite; opacity: 0.35; }
        @media (prefers-reduced-motion: reduce) {
          .c247-sway { animation: none; }
        }
      `}</style>

      {/* Daylight glow + soft botanical wash at the edges (framing, never clutter). */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 85% -10%, rgba(197,138,42,0.10), transparent 60%), radial-gradient(90% 60% at 5% 110%, rgba(47,143,91,0.10), transparent 60%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-[1] mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="relative flex h-11 w-11 items-center justify-center text-white"
              style={{ borderRadius: "50% 50% 50% 14px", background: C.greenDeep }}
              aria-hidden="true"
            >
              <Leaf size={20} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div className="text-[20px] font-semibold" style={{ ...display, color: C.ink }}>
                Serre
              </div>
              <div
                className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                style={{ ...body, color: C.green }}
              >
                <Sun size={11} strokeWidth={2.4} aria-hidden="true" />
                Zorg · ZZP
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...body, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[10.5px] font-semibold"
                style={{ ...body, color: C.greenDeep }}
              >
                <BadgeCheck size={12} strokeWidth={2.4} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center text-[14px] font-semibold"
              style={{
                ...body,
                borderRadius: "50% 50% 50% 14px",
                background: C.greenTint,
                color: C.greenDeep,
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
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="shrink-0 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={
                  {
                    ...body,
                    color: on ? C.white : C.inkSoft,
                    background: on ? C.greenDeep : "transparent",
                    border: `1px solid ${on ? C.greenDeep : C.line}`,
                    ["--tw-ring-color" as string]: C.green,
                  } as CSSProperties
                }
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
              docState={docState}
              setDocState={setDocState}
            />
          )}
          {screen === "acties" && (
            <Acties done={doneActions} toggleDone={(t) => setDoneActions((s) => toggleSet(s, t))} />
          )}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer
          className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[11.5px]"
          style={{ ...body, borderColor: C.line, color: C.inkSoft }}
        >
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare
                size={13}
                strokeWidth={2.2}
                style={{ color: C.green }}
                aria-hidden="true"
              />
              {BERICHTEN.filter((b) => b.ongelezen).length} ongelezen berichten
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bell size={12} strokeWidth={2.2} style={{ color: C.green }} aria-hidden="true" />
              {ACTIES.length} acties
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5" style={{ color: C.greenDeep }}>
            <Sprout size={12} strokeWidth={2.2} aria-hidden="true" />
            Serre · daglicht voor je praktijk
          </span>
        </footer>
      </div>
    </div>
  );
}
