"use client";

// Concept 245 — "Variabel" · variable typography AS the design system.
// ONE expressive display face (Bricolage Grotesque) carries the entire hierarchy
// through its weight / tracking / optical-size axes. Museum-calm, near-monochrome
// paper with a single vermilion accent; type is the star. Headings shift weight
// and letter-spacing on hover (CSS transition, reduced-motion aware). Data —
// amounts, statuses, match% — stays sharp and legible; numbers use tabular-nums.
// Body text in Inter. No decoration beyond the letterforms themselves.

import { useState, type CSSProperties } from "react";
import {
  BadgeCheck,
  Clock,
  TriangleAlert,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
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

// Near-mono paper palette + ONE accent. Type carries hierarchy, not colour.
const C = {
  paper: "#f4f2ec", // warm paper base
  surface: "#faf9f5", // raised panel
  ink: "#171511", // primary ink
  inkSoft: "#57534a", // secondary ink (AA on paper)
  inkFaint: "#8a857a", // tertiary / meta
  line: "rgba(23,21,17,0.12)", // hairline
  lineStrong: "rgba(23,21,17,0.24)",
  accent: "#d23a1c", // vermilion — the single accent
  accentSoft: "rgba(210,58,28,0.10)",
};

const display = { fontFamily: "var(--font-lab-bricolage)" } as const;
const body = { fontFamily: "var(--font-lab-inter)" } as const;
const nums = { fontFamily: "var(--font-lab-inter)", fontVariantNumeric: "tabular-nums" } as const;

// Variable heading. Weight + tracking are driven by CSS custom properties so the
// hover state (defined once in the scoped <style>) can shift them per element.
function VHead({
  children,
  size,
  weight = 640,
  hoverWeight = 820,
  track = "-0.01em",
  hoverTrack = "-0.03em",
  color = C.ink,
  className = "",
  as: Tag = "span",
  style,
}: {
  children: React.ReactNode;
  size: number;
  weight?: number;
  hoverWeight?: number;
  track?: string;
  hoverTrack?: string;
  color?: string;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3";
  style?: CSSProperties;
}) {
  return (
    <Tag
      className={`c245-vhead ${className}`}
      style={
        {
          ...display,
          color,
          fontSize: size,
          lineHeight: 1.02,
          ["--c245-w"]: weight,
          ["--c245-wh"]: hoverWeight,
          ["--c245-t"]: track,
          ["--c245-th"]: hoverTrack,
          ...style,
        } as CSSProperties
      }
    >
      {children}
    </Tag>
  );
}

// Wide-tracked micro label (the "small end" of the type scale).
function Kicker({ children, color = C.inkFaint }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      className="text-[10.5px] font-semibold uppercase"
      style={{ ...body, color, letterSpacing: "0.28em" }}
    >
      {children}
    </div>
  );
}

function SectionHead({ kicker, title, index }: { kicker: string; title: string; index?: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between gap-4">
        <Kicker>{kicker}</Kicker>
        {index && (
          <span className="text-[11px] font-semibold" style={{ ...nums, color: C.inkFaint }}>
            {index}
          </span>
        )}
      </div>
      <VHead as="h2" size={38} weight={680} className="mt-1.5 block">
        {title}
      </VHead>
      <div className="mt-4 h-px w-full" style={{ background: C.line }} aria-hidden="true" />
    </div>
  );
}

function panelStyle(raised = false): CSSProperties {
  return {
    background: raised ? C.surface : "transparent",
    border: `1px solid ${C.line}`,
    borderRadius: 4,
  };
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; accent: boolean } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, accent: false };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, accent: false };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, accent: true };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, accent: true };
  }
}

// Status chip — label + icon, never colour-only. Accent statuses get the vermilion
// outline; neutral statuses stay ink. Meaning survives greyscale.
function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, accent } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-[3px] text-[11px] font-semibold"
      style={{
        ...body,
        color: accent ? C.accent : C.ink,
        border: `1px solid ${accent ? C.accent : C.lineStrong}`,
        background: accent ? C.accentSoft : "transparent",
        letterSpacing: "0.01em",
      }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

// Thin editorial sparkline.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, idx) => {
      const x = (idx / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / span) * 82 - 9;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-7 w-full" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={C.ink}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Match readout — a big variable numeral, the "hero" of each opportunity.
function MatchReadout({ value, big = false }: { value: number; big?: boolean }) {
  return (
    <div className="flex shrink-0 items-baseline gap-1 leading-none">
      <VHead size={big ? 46 : 30} weight={720} hoverWeight={860} color={C.ink} style={nums}>
        {value}
      </VHead>
      <span className="text-[12px] font-semibold" style={{ ...body, color: C.inkFaint }}>
        % match
      </span>
    </div>
  );
}

// ---- Screens ---------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  return (
    <div className="space-y-10">
      <SectionHead kicker="Overzicht" title="Dashboard" index="01 / 06" />

      <div
        className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4"
        style={{ background: C.line }}
      >
        {KPIS.map((k) => {
          const Trend = k.up ? ArrowUpRight : ArrowDownRight;
          return (
            <div key={k.label} className="p-5" style={{ background: C.paper }}>
              <div
                className="text-[11px] font-semibold uppercase"
                style={{ ...body, color: C.inkFaint, letterSpacing: "0.14em" }}
              >
                {k.label}
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <VHead size={34} weight={700} hoverWeight={860} style={nums}>
                  {k.value}
                </VHead>
                <span
                  className="mb-1 inline-flex items-center gap-0.5 text-[12px] font-semibold"
                  style={{ ...nums, color: k.up ? C.ink : C.accent }}
                >
                  <Trend size={13} strokeWidth={2.4} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div className="mt-3">
                <Spark data={k.spark} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <div>
            <div className="mb-4 flex items-baseline justify-between">
              <Kicker>Beste match</Kicker>
              <span className="text-[11px]" style={{ ...body, color: C.inkFaint }}>
                bijgewerkt 08:12
              </span>
            </div>
            <button
              onClick={onOpen}
              className="group flex w-full items-start gap-5 p-6 text-left transition-colors hover:border-[color:var(--c245-a)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c245-a)]"
              style={{ ...panelStyle(true), ["--c245-a" as string]: C.accent }}
            >
              <MatchReadout value={top.match} big />
              <div className="min-w-0 flex-1">
                <VHead as="h3" size={22} weight={640} className="block">
                  {top.titel}
                </VHead>
                <div className="mt-1 text-[13.5px]" style={{ ...body, color: C.inkSoft }}>
                  {top.opdrachtgever} · {top.plaats} · {top.tarief}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {top.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-[3px] border px-2 py-0.5 text-[11px] font-medium"
                      style={{ ...body, borderColor: C.line, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <ArrowRight
                size={20}
                className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
                style={{ color: C.accent }}
                aria-hidden="true"
              />
            </button>
          </div>

          <div>
            <Kicker>Berichten</Kicker>
            <ul className="mt-4 divide-y" style={{ borderColor: C.line }}>
              {BERICHTEN.map((b) => (
                <li
                  key={b.van}
                  className="flex items-center gap-4 py-3"
                  style={{ borderColor: C.line }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                    style={{ ...body, border: `1px solid ${C.lineStrong}`, color: C.ink }}
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
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.accent }}
                          aria-label="ongelezen"
                        />
                      )}
                    </div>
                    <p className="truncate text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
                      {b.preview}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11.5px]" style={{ ...nums, color: C.inkFaint }}>
                    {b.tijd}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-10">
          <div>
            <Kicker>Volgende acties</Kicker>
            <ul className="mt-4 space-y-3">
              {ACTIES.map((a, i) => (
                <li key={a.titel} className="p-4" style={panelStyle()}>
                  <div className="flex items-baseline gap-2.5">
                    <span
                      className="text-[13px] font-semibold"
                      style={{ ...nums, color: C.inkFaint }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="text-[14px] font-semibold leading-snug"
                      style={{ ...body, color: C.ink }}
                    >
                      {a.titel}
                    </span>
                  </div>
                  <p
                    className="mt-1.5 text-[12.5px] leading-relaxed"
                    style={{ ...body, color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <span
                    className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-semibold"
                    style={{ ...body, color: C.accent }}
                  >
                    {a.cta}
                    <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Kicker>Certificaten</Kicker>
            <ul className="mt-4 space-y-2.5">
              {CREDENTIALS.map((c) => (
                <li key={c.naam} className="flex items-center justify-between gap-2">
                  <span
                    className="truncate text-[13px] font-medium"
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
    <div className="space-y-8">
      <SectionHead kicker="Opdrachten" title="Marktplaats" index="02 / 06" />

      <div className="flex items-center gap-3 border-b pb-2" style={{ borderColor: C.lineStrong }}>
        <Search size={18} className="shrink-0" style={{ color: C.inkFaint }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[15px] outline-none placeholder:opacity-60"
          style={{ ...body, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="rounded-[3px] px-2 py-1 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c245-a)]"
            style={{ ...body, color: C.accent, ["--c245-a" as string]: C.accent }}
          >
            Wissen
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          style={panelStyle()}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ border: `1px solid ${C.lineStrong}`, color: C.inkFaint }}
            aria-hidden="true"
          >
            <Inbox size={26} strokeWidth={1.8} />
          </span>
          <VHead as="h3" size={26} weight={700}>
            Geen resultaten
          </VHead>
          <p className="max-w-xs text-[13.5px]" style={{ ...body, color: C.inkSoft }}>
            Niets gevonden voor &ldquo;{query}&rdquo;. Pas de zoekterm aan of wis het filter.
          </p>
          <button
            onClick={() => setQuery("")}
            className="mt-1 rounded-[3px] px-5 py-2.5 text-[13.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c245-a)]"
            style={{ ...body, color: C.paper, background: C.ink, ["--c245-a" as string]: C.accent }}
          >
            Filter wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <article
                key={o.id}
                className="flex h-full flex-col p-6 transition-colors hover:border-[color:var(--c245-a)]"
                style={{ ...panelStyle(true), ["--c245-a" as string]: C.accent }}
              >
                <div className="flex items-start justify-between gap-3">
                  <MatchReadout value={o.match} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c245-a)]"
                    style={{
                      border: `1px solid ${isSaved ? C.accent : C.line}`,
                      color: isSaved ? C.accent : C.inkFaint,
                      ["--c245-a" as string]: C.accent,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={16} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <Bookmark size={16} strokeWidth={1.9} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <VHead as="h3" size={19} weight={640} className="mt-4 block">
                  {o.titel}
                </VHead>
                <div className="mt-1 text-[13px]" style={{ ...body, color: C.inkSoft }}>
                  {o.opdrachtgever}
                </div>
                <dl
                  className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 text-[12.5px]"
                  style={{ ...body, color: C.ink }}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} style={{ color: C.inkFaint }} aria-hidden="true" />
                    {o.plaats}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wallet size={13} style={{ color: C.inkFaint }} aria-hidden="true" />
                    {o.tarief}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} style={{ color: C.inkFaint }} aria-hidden="true" />
                    {o.uren}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} style={{ color: C.inkFaint }} aria-hidden="true" />
                    {o.start}
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-[3px] border px-2 py-0.5 text-[11px] font-medium"
                      style={{ ...body, borderColor: C.line, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => onOpen(o)}
                  className="group mt-5 inline-flex items-center justify-between gap-1.5 border-t pt-4 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c245-a)]"
                  style={{
                    ...body,
                    color: C.ink,
                    borderColor: C.line,
                    ["--c245-a" as string]: C.accent,
                  }}
                >
                  Bekijk opdracht
                  <ArrowRight
                    size={15}
                    strokeWidth={2.2}
                    className="transition-transform group-hover:translate-x-1"
                    style={{ color: C.accent }}
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
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c245-a)]"
        style={{
          ...body,
          color: C.inkSoft,
          letterSpacing: "0.1em",
          ["--c245-a" as string]: C.accent,
        }}
      >
        <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
        Terug
      </button>

      <div>
        <div className="flex items-baseline justify-between gap-4">
          <Kicker>{opdracht.id}</Kicker>
          <MatchReadout value={opdracht.match} />
        </div>
        <VHead as="h2" size={44} weight={700} hoverWeight={860} className="mt-2 block">
          {opdracht.titel}
        </VHead>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[14.5px]" style={{ ...body, color: C.inkSoft }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </div>
          <button
            onClick={() => toggleSave(opdracht.id)}
            aria-pressed={isSaved}
            className="inline-flex items-center gap-1.5 rounded-[3px] border px-3 py-1.5 text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c245-a)]"
            style={{
              ...body,
              color: isSaved ? C.accent : C.inkSoft,
              borderColor: isSaved ? C.accent : C.lineStrong,
              ["--c245-a" as string]: C.accent,
            }}
          >
            {isSaved ? (
              <BookmarkCheck size={14} strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <Bookmark size={14} strokeWidth={1.9} aria-hidden="true" />
            )}
            {isSaved ? "Bewaard" : "Bewaar"}
          </button>
        </div>
      </div>

      <div
        className="grid grid-cols-2 gap-px border sm:grid-cols-4"
        style={{ background: C.line, borderColor: C.line }}
      >
        {[
          { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
          { Icon: Clock, label: "Inzet", value: opdracht.uren },
          { Icon: Calendar, label: "Start", value: opdracht.start },
          { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
        ].map((m) => (
          <div key={m.label} className="p-4" style={{ background: C.paper }}>
            <m.Icon size={15} style={{ color: C.inkFaint }} aria-hidden="true" />
            <div
              className="mt-2 text-[10px] font-semibold uppercase"
              style={{ ...body, color: C.inkFaint, letterSpacing: "0.16em" }}
            >
              {m.label}
            </div>
            <div className="mt-0.5 text-[15px] font-semibold" style={{ ...body, color: C.ink }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="p-5" style={panelStyle()}>
          <div className="mb-3 flex items-center gap-2">
            <Plus size={15} strokeWidth={2.6} style={{ color: C.ink }} aria-hidden="true" />
            <VHead as="h3" size={15} weight={700} track="0.02em" hoverTrack="0.06em">
              WAAROM DIT PAST
            </VHead>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...body, color: C.ink }}
              >
                <Check
                  size={15}
                  strokeWidth={2.4}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.ink }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5" style={panelStyle()}>
          <div className="mb-3 flex items-center gap-2">
            <Minus size={15} strokeWidth={2.6} style={{ color: C.accent }} aria-hidden="true" />
            <VHead
              as="h3"
              size={15}
              weight={700}
              track="0.02em"
              hoverTrack="0.06em"
              color={C.accent}
            >
              LET OP
            </VHead>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...body, color: C.ink }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.accent }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        className="flex flex-wrap items-center gap-4 border-t pt-6"
        style={{ borderColor: C.line }}
      >
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className="inline-flex items-center gap-2 rounded-[3px] px-7 py-3.5 text-[14.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c245-a)]"
          style={{
            ...body,
            color: applied ? C.ink : C.paper,
            background: applied ? "transparent" : C.ink,
            border: `1px solid ${C.ink}`,
            ["--c245-a" as string]: C.accent,
          }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </button>
        {applied && (
          <span className="text-[13px]" style={{ ...body, color: C.inkSoft }}>
            Gemiddelde reactietijd opdrachtgever: 6 uur.
          </span>
        )}
      </div>
    </div>
  );
}

type FeedState = "ok" | "loading" | "error";

function Verificatie({
  checked,
  toggleCheck,
  feedState,
  setFeedState,
}: {
  checked: Set<string>;
  toggleCheck: (naam: string) => void;
  feedState: FeedState;
  setFeedState: (s: FeedState) => void;
}) {
  return (
    <div className="space-y-10">
      <SectionHead kicker="Vertrouwen" title="Verificatie" index="04 / 06" />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <Kicker>Credentials</Kicker>
          <ul className="divide-y" style={{ borderColor: C.line }}>
            {CREDENTIALS.map((c) => {
              const done = checked.has(c.naam);
              return (
                <li
                  key={c.naam}
                  className="flex items-center gap-4 py-4"
                  style={{ borderColor: C.line }}
                >
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c245-a)]"
                    style={{
                      border: `1px solid ${done ? C.ink : C.lineStrong}`,
                      background: done ? C.ink : "transparent",
                      color: C.paper,
                      ["--c245-a" as string]: C.accent,
                    }}
                  >
                    {done && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[14.5px] font-semibold"
                      style={{
                        ...body,
                        color: C.ink,
                        textDecoration: done ? "line-through" : "none",
                        opacity: done ? 0.6 : 1,
                      }}
                    >
                      {c.naam}
                    </div>
                    <div className="text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusChip status={c.status} />
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              <FileText
                size={16}
                strokeWidth={2.2}
                style={{ color: C.inkFaint }}
                aria-hidden="true"
              />
              <VHead as="h3" size={16} weight={700}>
                Documenten
              </VHead>
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className="flex h-8 w-8 items-center justify-center rounded-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c245-a)]"
              style={{
                border: `1px solid ${C.lineStrong}`,
                color: C.ink,
                ["--c245-a" as string]: C.accent,
              }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-4 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className="rounded-[3px] px-2.5 py-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c245-a)]"
                style={{
                  ...body,
                  color: feedState === s ? C.paper : C.inkSoft,
                  background: feedState === s ? C.ink : "transparent",
                  border: `1px solid ${feedState === s ? C.ink : C.line}`,
                  letterSpacing: "0.04em",
                  ["--c245-a" as string]: C.accent,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2.5" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="p-3.5" style={panelStyle()}>
                  <div className="c245-pulse h-3 w-2/3 rounded" style={{ background: C.line }} />
                  <div
                    className="c245-pulse mt-2 h-2.5 w-1/3 rounded"
                    style={{ background: C.line }}
                  />
                </li>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <div
              className="flex flex-col items-center gap-2.5 px-4 py-9 text-center"
              style={panelStyle()}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ color: C.accent, border: `1px solid ${C.accent}` }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={1.9} />
              </span>
              <VHead as="h3" size={17} weight={700}>
                Laden mislukt
              </VHead>
              <p className="text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
                De verbinding met de documentenkluis is verbroken.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className="mt-1 rounded-[3px] px-4 py-2 text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c245-a)]"
                style={{
                  ...body,
                  color: C.paper,
                  background: C.ink,
                  ["--c245-a" as string]: C.accent,
                }}
              >
                Opnieuw proberen
              </button>
            </div>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2.5">
              {DOCUMENTEN.map((d) => (
                <li key={d.naam} className="flex items-center gap-3 p-3.5" style={panelStyle()}>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] text-[9px] font-bold"
                    style={{ ...body, border: `1px solid ${C.lineStrong}`, color: C.ink }}
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
                    <div className="text-[11px]" style={{ ...nums, color: C.inkFaint }}>
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
    <div className="space-y-8">
      <SectionHead kicker="Wachtrij" title="Acties" index="05 / 06" />

      {openCount === 0 ? (
        <div
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          style={panelStyle()}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ border: `1px solid ${C.ink}`, color: C.ink }}
            aria-hidden="true"
          >
            <Check size={28} strokeWidth={2.2} />
          </span>
          <VHead as="h3" size={28} weight={720}>
            Alles afgerond
          </VHead>
          <p className="max-w-xs text-[13.5px]" style={{ ...body, color: C.inkSoft }}>
            De wachtrij is leeg. Nieuwe acties verschijnen hier zodra er iets vraagt om aandacht.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-3">
            <VHead size={30} weight={760} style={nums}>
              {openCount}
            </VHead>
            <span className="text-[14px]" style={{ ...body, color: C.inkSoft }}>
              {openCount === 1 ? "openstaande actie" : "openstaande acties"}
            </span>
          </div>

          <ul className="space-y-4">
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              return (
                <li
                  key={a.titel}
                  className="flex items-start gap-4 p-5"
                  style={panelStyle(!isDone)}
                >
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c245-a)]"
                    style={{
                      border: `1px solid ${isDone ? C.ink : C.lineStrong}`,
                      background: isDone ? C.ink : "transparent",
                      color: C.paper,
                      ["--c245-a" as string]: C.accent,
                    }}
                  >
                    {isDone && <Check size={16} strokeWidth={3} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                        style={{
                          ...body,
                          color: a.urgentie === "warning" ? C.accent : C.inkSoft,
                          border: `1px solid ${a.urgentie === "warning" ? C.accent : C.lineStrong}`,
                          letterSpacing: "0.08em",
                        }}
                      >
                        {a.urgentie === "warning" ? (
                          <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Bell size={10} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {a.urgentie === "warning" ? "Urgent" : "Info"}
                      </span>
                      <span
                        className="text-[11px] font-semibold"
                        style={{ ...nums, color: C.inkFaint }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div
                      className="mt-1.5 text-[15.5px] font-semibold leading-snug"
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
                      className="mt-1 text-[12.5px] leading-relaxed"
                      style={{ ...body, color: C.inkSoft, opacity: isDone ? 0.55 : 1 }}
                    >
                      {a.detail}
                    </p>
                    {!isDone && (
                      <span
                        className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-semibold"
                        style={{ ...body, color: C.accent }}
                      >
                        {a.cta}
                        <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
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
  const isAccent = (status: string): boolean => status === "Openstaand";
  const statusIcon = (status: string): LucideIcon =>
    status === "Betaald" ? Check : status === "Openstaand" ? Clock : FileText;
  return (
    <div className="space-y-8">
      <SectionHead kicker="Financieel" title="Facturen" index="06 / 06" />

      <div className="grid grid-cols-1 gap-px sm:grid-cols-3" style={{ background: C.line }}>
        {[
          { label: "Betaald deze maand", value: "€ 5.552", accent: false },
          { label: "Openstaand", value: "€ 1.350", accent: true },
          { label: "Concept", value: "€ 880", accent: false },
        ].map((s) => (
          <div key={s.label} className="p-5" style={{ background: C.paper }}>
            <div
              className="text-[10.5px] font-semibold uppercase"
              style={{ ...body, color: C.inkFaint, letterSpacing: "0.16em" }}
            >
              {s.label}
            </div>
            <VHead
              size={28}
              weight={720}
              color={s.accent ? C.accent : C.ink}
              className="mt-1.5 block"
              style={nums}
            >
              {s.value}
            </VHead>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.lineStrong}` }}>
              {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                <th
                  key={h}
                  scope="col"
                  className={`py-2.5 text-[10.5px] font-semibold uppercase ${i > 2 ? "text-right" : ""}`}
                  style={{
                    ...body,
                    color: C.inkFaint,
                    letterSpacing: "0.14em",
                    paddingLeft: i === 0 ? 0 : 12,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const Icon = statusIcon(f.status);
              const accent = isAccent(f.status);
              return (
                <tr key={f.nr} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td
                    className="py-3.5 text-[13px] font-semibold"
                    style={{ ...nums, color: C.ink }}
                  >
                    {f.nr}
                  </td>
                  <td className="py-3.5 pl-3 text-[13.5px]" style={{ ...body, color: C.ink }}>
                    {f.klant}
                  </td>
                  <td className="py-3.5 pl-3 text-[12.5px]" style={{ ...nums, color: C.inkFaint }}>
                    {f.datum}
                  </td>
                  <td
                    className="py-3.5 pl-3 text-right text-[13.5px] font-semibold"
                    style={{ ...nums, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="py-3.5 pl-3 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-[3px] text-[11px] font-semibold"
                      style={{
                        ...body,
                        color: accent ? C.accent : C.ink,
                        border: `1px solid ${accent ? C.accent : C.lineStrong}`,
                        background: accent ? C.accentSoft : "transparent",
                      }}
                    >
                      <Icon size={11} strokeWidth={2.4} aria-hidden="true" />
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
  );
}

// ---- Shell -----------------------------------------------------------------

export function Concept245() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set(["OPD-2041"]));
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Set<string>>(new Set());
  const [feedState, setFeedState] = useState<FeedState>("ok");
  const [active, setActive] = useState<Opdracht>(OPDRACHTEN[0] as Opdracht);

  const toggleSet = (s: Set<string>, key: string): Set<string> => {
    const n = new Set(s);
    if (n.has(key)) n.delete(key);
    else n.add(key);
    return n;
  };

  return (
    <div
      className="min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, color: C.ink, background: C.paper }}
    >
      {/* Scoped styles: the variable-typography hover (weight + tracking) and a calm
          pulse for skeletons. Both respect prefers-reduced-motion. */}
      <style>{`
        .c245-vhead {
          font-weight: var(--c245-w, 640);
          letter-spacing: var(--c245-t, -0.01em);
          transition: font-weight 0.3s ease, letter-spacing 0.3s ease;
        }
        .c245-vhead:hover {
          font-weight: var(--c245-wh, 820);
          letter-spacing: var(--c245-th, -0.03em);
        }
        @keyframes c245-pulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        .c245-pulse { animation: c245-pulse 1.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .c245-vhead { transition: none; }
          .c245-pulse { animation: none; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-8 sm:py-9">
        <header
          className="flex flex-wrap items-center justify-between gap-4 border-b pb-6"
          style={{ borderColor: C.lineStrong }}
        >
          <div className="flex items-baseline gap-3">
            {/* Brand mark rendered purely in the display face — type as identity. */}
            <VHead size={26} weight={820} hoverWeight={860} track="-0.04em" hoverTrack="-0.05em">
              Variabel
            </VHead>
            <span
              className="text-[10.5px] font-semibold uppercase"
              style={{ ...body, color: C.inkFaint, letterSpacing: "0.24em" }}
            >
              ZZP
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[13px] font-semibold" style={{ ...body, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...body, color: C.inkSoft }}
              >
                <BadgeCheck
                  size={12}
                  strokeWidth={2.2}
                  style={{ color: C.accent }}
                  aria-hidden="true"
                />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-semibold"
              style={{ ...body, border: `1px solid ${C.lineStrong}`, color: C.ink }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav
          className="mt-6 flex flex-wrap gap-x-6 gap-y-2 overflow-x-auto border-b pb-3"
          aria-label="Hoofdnavigatie"
          style={{ borderColor: C.line }}
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="c245-vhead shrink-0 pb-1 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c245-a)]"
                style={
                  {
                    ...display,
                    color: on ? C.ink : C.inkFaint,
                    borderBottom: `2px solid ${on ? C.accent : "transparent"}`,
                    ["--c245-w"]: on ? 760 : 520,
                    ["--c245-wh"]: 820,
                    ["--c245-t"]: "-0.01em",
                    ["--c245-th"]: "-0.02em",
                    ["--c245-a"]: C.accent,
                  } as CSSProperties
                }
              >
                {s.label}
              </button>
            );
          })}
        </nav>

        <main className="mt-9">
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
          className="mt-12 flex flex-wrap items-center justify-between gap-2 border-t pt-5 text-[11.5px]"
          style={{ ...body, borderColor: C.line, color: C.inkFaint }}
        >
          <span className="inline-flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare size={13} strokeWidth={2} aria-hidden="true" />
              {BERICHTEN.filter((b) => b.ongelezen).length} ongelezen
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bell size={13} strokeWidth={2} aria-hidden="true" />
              {ACTIES.length} acties
            </span>
          </span>
          <span style={{ letterSpacing: "0.2em" }} className="uppercase">
            Type als systeem
          </span>
        </footer>
      </div>
    </div>
  );
}
