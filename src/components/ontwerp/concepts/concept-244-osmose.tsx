"use client";

// Concept 244 — "Osmose" · fluid metaball / gooey shape language, with restraint.
// An SVG gooey filter (feGaussianBlur + feColorMatrix on the alpha channel) makes
// small status dots, avatars and badge droplets behave like organic liquid: they
// merge and split. Soft blob clusters drift in the background as atmosphere ONLY.
// The DATA — amounts, statuses, job details, numbers — stays crisp on clean, tidy
// surfaces; the gooey effect never touches running data. Light, warm palette with a
// single vivid accent (coral), AA-checked text. Headings/body in Jakarta, display
// accents in Sora, numbers in a mono var. Motion is slow and organic and fully
// respects prefers-reduced-motion (static shapes when reduced).

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
  CalendarDays,
  Bookmark,
  BookmarkCheck,
  Check,
  Bell,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  FileText,
  RefreshCw,
  CircleAlert,
  Inbox,
  ThumbsUp,
  Info,
  Droplets,
  Users,
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

// Light, warm "osmose" palette. Coral is the single vivid accent. Text tones are
// AA-checked against the panel/base backgrounds.
const C = {
  base: "#f6f4f1", // warm off-white base
  panel: "#ffffff", // primary surface
  panelSoft: "#f1eeea", // sunken surface / skeletons
  line: "#e6e1db", // hairline
  lineSoft: "#efeae4",
  text: "#241f26", // primary text (AA on panel + base)
  textSoft: "#6c6570", // muted text (AA on panel)
  coral: "#ff6a5a", // vivid accent — fills, blobs, droplets
  coralInk: "#c93a2c", // AA-safe coral text on light
  coralWash: "#fdeceb", // coral tint background
  green: "#12866b", // verified ink (AA)
  greenDot: "#1fb487",
  greenWash: "#e6f4ef",
  indigo: "#4a53c9", // submitted ink (AA)
  indigoDot: "#6b74e8",
  indigoWash: "#ecedfb",
  amber: "#9a6a00", // expiring ink (AA)
  amberDot: "#f0a92b",
  amberWash: "#fbf1dd",
};

const jakarta = { fontFamily: "var(--font-lab-jakarta)" };
const sora = { fontFamily: "var(--font-lab-sora)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a5a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f4f1]";

type StatusMeta = { label: string; Icon: LucideIcon; ink: string; wash: string; dot: string };

function statusMeta(s: CredStatus): StatusMeta {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: BadgeCheck,
        ink: C.green,
        wash: C.greenWash,
        dot: C.greenDot,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        ink: C.indigo,
        wash: C.indigoWash,
        dot: C.indigoDot,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        ink: C.amber,
        wash: C.amberWash,
        dot: C.amberDot,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: XCircle,
        ink: C.coralInk,
        wash: C.coralWash,
        dot: C.coral,
      };
  }
}

// Status chip — crisp, label + icon (never colour-only), tinted wash + AA ink.
function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, ink, wash } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
      style={{ ...jakarta, color: ink, background: wash }}
    >
      <Icon size={12.5} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

// Panel surface with hairline.
function panelStyle(soft = false): CSSProperties {
  return {
    background: soft ? C.panelSoft : C.panel,
    border: `1px solid ${C.line}`,
    borderRadius: 18,
  };
}

// Section header — Sora kicker + Jakarta title.
function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-5">
      <div
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]"
        style={{ ...sora, color: C.coralInk }}
      >
        <Droplets size={13} strokeWidth={2.2} aria-hidden="true" />
        {kicker}
      </div>
      <h2
        className="mt-1.5 text-[24px] font-bold leading-none sm:text-[28px]"
        style={{ ...jakarta, color: C.text }}
      >
        {title}
      </h2>
    </div>
  );
}

// Crisp sparkline (data — no gooey).
function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 84 - 8;
    return `${x},${y}`;
  });
  const line = pts.join(" ");
  const area = `0,100 ${line} 100,100`;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-9 w-full" aria-hidden="true">
      <polygon points={area} fill={tone} opacity={0.1} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Match readout — crisp droplet-shaped badge with the % (data stays sharp).
function MatchBadge({ value }: { value: number }) {
  const tone = value >= 90 ? C.coral : value >= 84 ? C.greenDot : C.indigoDot;
  const ink = value >= 90 ? C.coralInk : value >= 84 ? C.green : C.indigo;
  const wash = value >= 90 ? C.coralWash : value >= 84 ? C.greenWash : C.indigoWash;
  return (
    <div
      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center leading-none"
      style={{
        background: wash,
        borderRadius: "42% 58% 54% 46% / 52% 44% 56% 48%",
        border: `1.5px solid ${tone}`,
      }}
    >
      <span className="text-[16px] font-bold" style={{ ...mono, color: ink }}>
        {value}
      </span>
      <span
        className="text-[7.5px] font-bold uppercase tracking-[0.12em]"
        style={{ ...sora, color: C.textSoft }}
      >
        match
      </span>
    </div>
  );
}

// Gooey droplet cluster — small circles that fuse under the goo filter when merged.
function DropletCluster({
  items,
  merged,
}: {
  items: { key: string; label: string; color: string }[];
  merged: boolean;
}) {
  return (
    <div
      className="c244-goo flex items-center"
      style={{ marginLeft: merged ? 0 : 2 }}
      aria-hidden="true"
    >
      {items.map((it, i) => (
        <span
          key={it.key}
          className="c244-droplet flex items-center justify-center text-[11px] font-bold text-white"
          style={{
            width: 34,
            height: 34,
            background: it.color,
            borderRadius: "50%",
            marginLeft: i === 0 ? 0 : merged ? -14 : 6,
            fontFamily: "var(--font-lab-jakarta)",
          }}
        >
          {it.label}
        </span>
      ))}
    </div>
  );
}

// ---- Screens ---------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const [merged, setMerged] = useState(true);
  const top = OPDRACHTEN[0] as Opdracht;
  const relations = [
    { key: "TL", label: "TL", color: C.coral },
    { key: "ZA", label: "ZA", color: C.indigoDot },
    { key: "KW", label: "KW", color: C.greenDot },
  ];
  return (
    <div className="space-y-8">
      <SectionHead kicker="Overzicht" title="Dashboard" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const tones = [C.coral, C.indigoDot, C.greenDot, C.amberDot];
          const tone = tones[i % tones.length] ?? C.coral;
          return (
            <div key={k.label} className="p-4" style={panelStyle()}>
              <div className="flex items-center justify-between">
                <span
                  className="text-[11.5px] font-semibold"
                  style={{ ...jakarta, color: C.textSoft }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold"
                  style={{
                    ...mono,
                    color: k.up ? C.green : C.amber,
                    background: k.up ? C.greenWash : C.amberWash,
                  }}
                >
                  <Trend size={11} strokeWidth={2.6} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-1.5 text-[28px] font-bold tabular-nums leading-none"
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <SectionHead kicker="Beste match" title="Bovenaan voor jou" />
            <button
              onClick={onOpen}
              className={`group flex w-full items-start gap-4 p-5 text-left transition-shadow hover:shadow-[0_8px_28px_rgba(255,106,90,0.14)] ${RING}`}
              style={panelStyle()}
            >
              <MatchBadge value={top.match} />
              <div className="min-w-0 flex-1">
                <div
                  className="text-[18px] font-semibold leading-tight"
                  style={{ ...jakarta, color: C.text }}
                >
                  {top.titel}
                </div>
                <div className="mt-0.5 text-[13px]" style={{ ...jakarta, color: C.textSoft }}>
                  {top.opdrachtgever} · {top.plaats}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {top.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{ ...jakarta, background: C.panelSoft, color: C.textSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <ChevronRight
                size={20}
                className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
                style={{ color: C.coralInk }}
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
                    className="flex h-10 w-10 shrink-0 items-center justify-center text-[12px] font-bold text-white"
                    style={{
                      ...jakarta,
                      background: C.coral,
                      borderRadius: "48% 52% 45% 55% / 55% 48% 52% 45%",
                    }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="truncate text-[13.5px] font-semibold"
                        style={{ ...jakarta, color: C.text }}
                      >
                        {b.van}
                      </span>
                      {b.ongelezen && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"
                          style={{ ...sora, background: C.coral }}
                        >
                          nieuw
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[12.5px]" style={{ ...jakarta, color: C.textSoft }}>
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

        <div className="space-y-6">
          {/* Mergeable droplet cluster — the signature interaction */}
          <div className="p-5" style={panelStyle()}>
            <div className="flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold"
                style={{ ...jakarta, color: C.text }}
              >
                <Users
                  size={15}
                  strokeWidth={2.2}
                  style={{ color: C.coralInk }}
                  aria-hidden="true"
                />
                Jouw opdrachtgevers
              </span>
            </div>
            <div className="mt-4 flex h-14 items-center">
              <DropletCluster items={relations} merged={merged} />
            </div>
            <p className="mt-2 text-[12px]" style={{ ...jakarta, color: C.textSoft }}>
              {merged ? "Samengevoegd tot één stroom." : "Gespreid — elk contact apart."}
            </p>
            <button
              onClick={() => setMerged((v) => !v)}
              aria-pressed={merged}
              className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${RING}`}
              style={{ ...jakarta, color: C.coralInk, background: C.coralWash }}
            >
              <Droplets size={13} strokeWidth={2.2} aria-hidden="true" />
              {merged ? "Spreiden" : "Samenvoegen"}
            </button>
          </div>

          <div>
            <SectionHead kicker="Certificaten" title="Vertrouwen" />
            <ul className="space-y-2">
              {CREDENTIALS.map((c) => (
                <li
                  key={c.naam}
                  className="flex items-center justify-between gap-2 p-3.5"
                  style={panelStyle()}
                >
                  <span
                    className="truncate text-[12.5px] font-medium"
                    style={{ ...jakarta, color: C.text }}
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
      <SectionHead kicker="Opdrachten" title="Marktplaats" />

      <div className="flex items-center gap-2.5 px-4 py-2.5" style={panelStyle()}>
        <Search size={17} className="shrink-0" style={{ color: C.coralInk }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[13.5px] outline-none placeholder:opacity-60"
          style={{ ...jakarta, color: C.text }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`rounded-full px-3 py-1 text-[11.5px] font-semibold transition-colors ${RING}`}
            style={{ ...jakarta, color: C.coralInk, background: C.coralWash }}
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
            className="flex h-16 w-16 items-center justify-center text-white"
            style={{ background: C.coral, borderRadius: "46% 54% 52% 48% / 55% 46% 54% 45%" }}
            aria-hidden="true"
          >
            <Inbox size={28} strokeWidth={2} />
          </span>
          <h3 className="text-[18px] font-bold" style={{ ...jakarta, color: C.text }}>
            Geen resultaten
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...jakarta, color: C.textSoft }}>
            Geen opdracht gevonden voor &ldquo;{query}&rdquo;. Pas de zoekterm aan of wis het
            filter.
          </p>
          <button
            onClick={() => setQuery("")}
            className={`mt-1 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-colors ${RING}`}
            style={{ ...jakarta, background: C.coral }}
          >
            Filter wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <article
                key={o.id}
                className="flex h-full flex-col p-5 transition-shadow hover:shadow-[0_8px_28px_rgba(255,106,90,0.12)]"
                style={panelStyle()}
              >
                <div className="flex items-start justify-between gap-3">
                  <MatchBadge value={o.match} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${RING}`}
                    style={{
                      background: isSaved ? C.coralWash : C.panelSoft,
                      color: isSaved ? C.coralInk : C.textSoft,
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
                  style={{ ...jakarta, color: C.text }}
                >
                  {o.titel}
                </h3>
                <div className="mt-0.5 text-[12.5px]" style={{ ...jakarta, color: C.textSoft }}>
                  {o.opdrachtgever}
                </div>
                <dl
                  className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]"
                  style={{ ...jakarta, color: C.text }}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} style={{ color: C.textSoft }} aria-hidden="true" />
                    {o.plaats}
                  </div>
                  <div className="flex items-center gap-1.5 tabular-nums">
                    <Wallet size={13} style={{ color: C.textSoft }} aria-hidden="true" />
                    {o.tarief}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} style={{ color: C.textSoft }} aria-hidden="true" />
                    {o.uren}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays size={13} style={{ color: C.textSoft }} aria-hidden="true" />
                    {o.start}
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{ ...jakarta, background: C.panelSoft, color: C.textSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => onOpen(o)}
                  className={`group mt-auto inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-semibold text-white transition-colors ${RING}`}
                  style={{ ...jakarta, background: C.coral, marginTop: 16 }}
                >
                  Open opdracht
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
        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
        style={{ ...jakarta, color: C.textSoft, background: C.panelSoft }}
      >
        <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
        Terug naar marktplaats
      </button>

      <div className="p-6" style={panelStyle()}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <MatchBadge value={opdracht.match} />
            <div>
              <h2
                className="text-[24px] font-bold leading-tight sm:text-[27px]"
                style={{ ...jakarta, color: C.text }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[13.5px]" style={{ ...jakarta, color: C.textSoft }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <button
            onClick={() => toggleSave(opdracht.id)}
            aria-pressed={isSaved}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${RING}`}
            style={{
              ...jakarta,
              color: isSaved ? C.coralInk : C.textSoft,
              background: isSaved ? C.coralWash : C.panelSoft,
            }}
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
            { Icon: CalendarDays, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m) => (
            <div key={m.label} className="p-3.5" style={panelStyle(true)}>
              <m.Icon size={15} style={{ color: C.coralInk }} aria-hidden="true" />
              <div
                className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ ...sora, color: C.textSoft }}
              >
                {m.label}
              </div>
              <div
                className="text-[14.5px] font-semibold tabular-nums"
                style={{ ...jakarta, color: C.text }}
              >
                {m.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
              style={{ ...jakarta, background: C.panelSoft, color: C.textSoft }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="p-5" style={panelStyle()}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center text-white"
              style={{ background: C.greenDot, borderRadius: "48% 52% 45% 55% / 55% 45% 55% 45%" }}
              aria-hidden="true"
            >
              <ThumbsUp size={14} strokeWidth={2.6} />
            </span>
            <span className="text-[13.5px] font-bold" style={{ ...jakarta, color: C.text }}>
              Waarom dit past
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...jakarta, color: C.text }}
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
        <div className="p-5" style={panelStyle()}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center text-white"
              style={{ background: C.amberDot, borderRadius: "52% 48% 55% 45% / 45% 55% 45% 55%" }}
              aria-hidden="true"
            >
              <TriangleAlert size={14} strokeWidth={2.6} />
            </span>
            <span className="text-[13.5px] font-bold" style={{ ...jakarta, color: C.text }}>
              Let op
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...jakarta, color: C.text }}
              >
                <Info
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
          className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-bold text-white transition-colors ${RING}`}
          style={{ ...jakarta, background: applied ? C.green : C.coral }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.8} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </button>
        {applied && (
          <span className="text-[12.5px]" style={{ ...jakarta, color: C.textSoft }}>
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
    <div className="space-y-8">
      <SectionHead kicker="Vertrouwen" title="Verificatie" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            return (
              <div key={c.naam} className="flex items-center gap-3 p-4" style={panelStyle()}>
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${RING}`}
                  style={{
                    background: done ? C.coral : C.panelSoft,
                    color: done ? "#ffffff" : "transparent",
                    border: `1.5px solid ${done ? C.coral : C.line}`,
                  }}
                >
                  <Check size={15} strokeWidth={3} aria-hidden="true" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ ...jakarta, color: C.text }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...jakarta, color: C.textSoft }}>
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
              className="inline-flex items-center gap-2 text-[15px] font-bold"
              style={{ ...jakarta, color: C.text }}
            >
              <FileText
                size={17}
                strokeWidth={2.2}
                style={{ color: C.coralInk }}
                aria-hidden="true"
              />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${RING}`}
              style={{ background: C.panelSoft, color: C.coralInk }}
              aria-label="Documenten vernieuwen"
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
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${RING}`}
                style={{
                  ...jakarta,
                  color: feedState === s ? "#ffffff" : C.textSoft,
                  background: feedState === s ? C.coral : C.panelSoft,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="flex items-center gap-3 p-3.5" style={panelStyle()}>
                  <div
                    className="c244-pulse h-10 w-10 shrink-0 rounded-full"
                    style={{ background: C.panelSoft }}
                  />
                  <div className="flex-1 space-y-2">
                    <div
                      className="c244-pulse h-3 w-2/3 rounded-full"
                      style={{ background: C.panelSoft }}
                    />
                    <div
                      className="c244-pulse h-2.5 w-1/3 rounded-full"
                      style={{ background: C.lineSoft }}
                    />
                  </div>
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
                className="flex h-14 w-14 items-center justify-center text-white"
                style={{ background: C.coral, borderRadius: "46% 54% 52% 48% / 55% 46% 54% 45%" }}
                aria-hidden="true"
              >
                <CircleAlert size={26} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-bold" style={{ ...jakarta, color: C.text }}>
                Laden mislukt
              </div>
              <p className="text-[12.5px]" style={{ ...jakarta, color: C.textSoft }}>
                De verbinding met de documentenkluis is verbroken.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold text-white transition-colors ${RING}`}
                style={{ ...jakarta, background: C.coral }}
              >
                <RefreshCw size={13} strokeWidth={2.4} aria-hidden="true" />
                Opnieuw proberen
              </button>
            </div>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <li key={d.naam} className="flex items-center gap-3 p-3.5" style={panelStyle()}>
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center text-[9px] font-bold text-white"
                    style={{
                      ...sora,
                      background: C.coralInk,
                      borderRadius: "50% 50% 46% 54% / 54% 46% 54% 46%",
                    }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12.5px] font-semibold"
                      style={{ ...jakarta, color: C.text }}
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
  const allDone = openCount === 0;
  return (
    <div className="space-y-6">
      <SectionHead kicker="Wachtrij" title="Acties" />

      <div className="inline-flex items-center gap-2.5 px-4 py-2.5" style={panelStyle()}>
        <span
          className="flex h-7 w-7 items-center justify-center text-[12px] font-bold tabular-nums text-white"
          style={{
            ...mono,
            background: allDone ? C.greenDot : C.coral,
            borderRadius: "48% 52% 45% 55% / 55% 45% 55% 45%",
          }}
          aria-hidden="true"
        >
          {openCount}
        </span>
        <span className="text-[13px] font-semibold" style={{ ...jakarta, color: C.text }}>
          {allDone ? "Wachtrij leeg — alles afgerond" : `${openCount} openstaande acties`}
        </span>
      </div>

      {allDone ? (
        <div
          className="flex flex-col items-center gap-3 px-6 py-14 text-center"
          style={panelStyle()}
        >
          <span
            className="flex h-16 w-16 items-center justify-center text-white"
            style={{ background: C.greenDot, borderRadius: "46% 54% 52% 48% / 55% 46% 54% 45%" }}
            aria-hidden="true"
          >
            <Check size={30} strokeWidth={2.6} />
          </span>
          <h3 className="text-[18px] font-bold" style={{ ...jakarta, color: C.text }}>
            Alles opgeruimd
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...jakarta, color: C.textSoft }}>
            Je hebt geen openstaande acties. Nieuwe acties verschijnen hier vanzelf.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {ACTIES.map((a) => {
            const isDone = done.has(a.titel);
            const warn = a.urgentie === "warning";
            return (
              <li key={a.titel} className="flex items-start gap-4 p-5" style={panelStyle(isDone)}>
                <button
                  onClick={() => toggleDone(a.titel)}
                  aria-pressed={isDone}
                  aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${RING}`}
                  style={{
                    background: isDone ? C.greenDot : C.panelSoft,
                    color: isDone ? "#ffffff" : "transparent",
                    border: `1.5px solid ${isDone ? C.greenDot : C.line}`,
                  }}
                >
                  <Check size={16} strokeWidth={3} aria-hidden="true" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{
                        ...sora,
                        color: warn ? C.amber : C.indigo,
                        background: warn ? C.amberWash : C.indigoWash,
                      }}
                    >
                      {warn ? (
                        <TriangleAlert size={11} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <Info size={11} strokeWidth={2.6} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Info"}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 text-[15px] font-semibold leading-snug"
                    style={{
                      ...jakarta,
                      color: C.text,
                      textDecoration: isDone ? "line-through" : "none",
                      opacity: isDone ? 0.55 : 1,
                    }}
                  >
                    {a.titel}
                  </div>
                  <p
                    className="mt-1 text-[12.5px]"
                    style={{ ...jakarta, color: C.textSoft, opacity: isDone ? 0.55 : 1 }}
                  >
                    {a.detail}
                  </p>
                  {!isDone && (
                    <span
                      className="mt-2.5 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                      style={{ ...jakarta, color: C.coralInk, background: C.coralWash }}
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
  const badge = (status: string): { ink: string; wash: string; Icon: LucideIcon } => {
    if (status === "Betaald") return { ink: C.green, wash: C.greenWash, Icon: Check };
    if (status === "Openstaand") return { ink: C.amber, wash: C.amberWash, Icon: Clock };
    return { ink: C.indigo, wash: C.indigoWash, Icon: FileText };
  };
  return (
    <div className="space-y-6">
      <SectionHead kicker="Financiën" title="Facturen" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald deze maand", value: "€ 5.552", ink: C.green, wash: C.greenWash },
          { label: "Openstaand", value: "€ 1.350", ink: C.amber, wash: C.amberWash },
          { label: "Concept", value: "€ 880", ink: C.indigo, wash: C.indigoWash },
        ].map((s) => (
          <div key={s.label} className="p-4" style={panelStyle()}>
            <div
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...sora, color: C.textSoft }}
            >
              {s.label}
            </div>
            <div
              className="mt-1 text-[24px] font-bold tabular-nums"
              style={{ ...mono, color: s.ink }}
            >
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
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3.5 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.12em]"
                    style={{ ...sora, color: C.textSoft }}
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
                  <tr key={f.nr} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                    <td
                      className="px-3.5 py-3.5 text-[12.5px] font-bold"
                      style={{ ...mono, color: C.coralInk }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3.5 py-3.5 text-[13px]" style={{ ...jakarta, color: C.text }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3.5 py-3.5 text-[12.5px]"
                      style={{ ...mono, color: C.textSoft }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3.5 py-3.5 text-[13px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.text }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3.5 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ ...jakarta, color: b.ink, background: b.wash }}
                      >
                        <b.Icon size={11} strokeWidth={2.6} aria-hidden="true" />
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

// ---- Atmosphere: gooey drifting blobs (decorative only) --------------------

function BlobField() {
  const blobs: { cx: number; cy: number; r: number; cls: string; fill: string; op: number }[] = [
    { cx: 14, cy: 20, r: 130, cls: "c244-blob-a", fill: C.coral, op: 0.18 },
    { cx: 88, cy: 12, r: 96, cls: "c244-blob-b", fill: C.amberDot, op: 0.14 },
    { cx: 78, cy: 92, r: 150, cls: "c244-blob-c", fill: C.coral, op: 0.12 },
    { cx: 30, cy: 96, r: 84, cls: "c244-blob-a", fill: C.indigoDot, op: 0.1 },
  ];
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 100 100"
    >
      <g filter="url(#c244-goo-bg)">
        {blobs.map((b, i) => (
          <circle
            key={i}
            className={b.cls}
            cx={b.cx}
            cy={b.cy}
            r={b.r / 10}
            fill={b.fill}
            opacity={b.op}
          />
        ))}
      </g>
    </svg>
  );
}

// ---- Shell -----------------------------------------------------------------

export function Concept244() {
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
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...jakarta, color: C.text, background: C.base }}
    >
      {/* Gooey filters + slow organic keyframes. Motion disabled when reduced. */}
      <style>{`
        .c244-goo { filter: url(#c244-goo); }
        .c244-droplet { transition: margin-left 0.55s cubic-bezier(0.65,0,0.35,1); }
        .c244-pulse { animation: c244-pulse 1.5s ease-in-out infinite; }
        @keyframes c244-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        @keyframes c244-drift-a {
          0%,100% { transform: translate(0px,0px) scale(1); }
          50% { transform: translate(2px,-1.5px) scale(1.08); }
        }
        @keyframes c244-drift-b {
          0%,100% { transform: translate(0px,0px) scale(1); }
          50% { transform: translate(-2px,1.5px) scale(1.12); }
        }
        @keyframes c244-drift-c {
          0%,100% { transform: translate(0px,0px) scale(1); }
          50% { transform: translate(1.5px,2px) scale(0.94); }
        }
        .c244-blob-a { transform-box: fill-box; transform-origin: center; animation: c244-drift-a 14s ease-in-out infinite; }
        .c244-blob-b { transform-box: fill-box; transform-origin: center; animation: c244-drift-b 17s ease-in-out infinite; }
        .c244-blob-c { transform-box: fill-box; transform-origin: center; animation: c244-drift-c 20s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .c244-droplet, .c244-pulse, .c244-blob-a, .c244-blob-b, .c244-blob-c { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* SVG filter defs — gooey metaball on the alpha channel (unique ids). */}
      <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
        <defs>
          <filter id="c244-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
          <filter id="c244-goo-bg">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 16 -7"
            />
          </filter>
        </defs>
      </svg>

      {/* Atmosphere layer */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <BlobField />
      </div>

      <div className="relative z-[1] mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Brand mark — a gooey droplet cluster fused under the filter */}
            <span className="c244-goo relative flex h-11 w-14 items-center" aria-hidden="true">
              <span
                className="absolute left-0 h-8 w-8 rounded-full"
                style={{ background: C.coral }}
              />
              <span
                className="absolute left-4 h-9 w-9 rounded-full"
                style={{ background: C.coralInk }}
              />
              <span
                className="absolute left-9 h-6 w-6 rounded-full"
                style={{ background: C.amberDot }}
              />
            </span>
            <div className="leading-tight">
              <div
                className="text-[20px] font-bold tracking-tight"
                style={{ ...sora, color: C.text }}
              >
                Osmose
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ ...sora, color: C.textSoft }}
              >
                ZZP · zorgplatform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...jakarta, color: C.text }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                style={{ ...jakarta, color: C.green, background: C.greenWash }}
              >
                <BadgeCheck size={11} strokeWidth={2.4} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center text-[14px] font-bold text-white"
              style={{
                ...jakarta,
                background: C.coral,
                borderRadius: "48% 52% 45% 55% / 55% 45% 55% 45%",
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
                className={`shrink-0 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors ${RING}`}
                style={{
                  ...jakarta,
                  color: on ? "#ffffff" : C.textSoft,
                  background: on ? C.coral : C.panel,
                  border: `1px solid ${on ? C.coral : C.line}`,
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

        <footer
          className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[11px]"
          style={{ ...jakarta, borderColor: C.line, color: C.textSoft }}
        >
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle
                size={13}
                strokeWidth={2.2}
                style={{ color: C.coralInk }}
                aria-hidden="true"
              />
              {BERICHTEN.filter((b) => b.ongelezen).length} ongelezen berichten
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bell size={12} strokeWidth={2.2} style={{ color: C.coralInk }} aria-hidden="true" />
              {ACTIES.length} acties
            </span>
          </span>
          <span style={{ ...sora, color: C.textSoft }}>
            Osmose · vloeiend, maar de data blijft scherp
          </span>
        </footer>
      </div>
    </div>
  );
}
