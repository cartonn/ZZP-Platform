"use client";

// Concept 239 — "Stickervel" · the UI as a sheet of glossy die-cut stickers.
// Every badge, card and status is a die-cut sticker: a thick white outline (die-cut
// look via border-white + box-shadow), a soft drop shadow, a faint glossy top-edge
// highlight, and a subtle deterministic tilt per index (-2.5deg..2.4deg). Statuses,
// skills and KPIs read as a collectible sticker set; hover gives a small "peel" lift.
// Palette: warm cream sheet, deep plum ink, and a cheerful-but-tasteful sticker set
// (roze, mint, geel, lavendel, koraal) — all with dark plum text for readable AA
// contrast on saturated fills. Round, chubby headings in Baloo; body in Inter.
// Colourful and playful, yet locked to a strict grid so the overview stays sharp.

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
  MessageCircle,
  FileText,
  Star,
  RefreshCw,
  CircleAlert,
  Inbox,
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

// Sticker-sheet palette. Dark plum text sits on every saturated fill (AA-safe).
const C = {
  sheet: "#fff8f0", // warm cream backing sheet
  sheetDeep: "#faeede", // slightly deeper cream
  card: "#ffffff", // sticker paper
  ink: "#221b2e", // deep plum ink (primary text)
  inkSoft: "#5b5266", // muted plum for secondary text
  roze: "#ff5da2",
  mint: "#2dd4bf",
  geel: "#fbbf24",
  lavendel: "#a78bfa",
  koraal: "#fb7185",
  line: "rgba(34,27,46,0.12)",
};

// Soft tinted washes of each hue for large card fills where big saturated blocks
// would be too loud — keeps information density high without visual noise.
const TINT = {
  roze: "#ffe4f0",
  mint: "#d6f6f1",
  geel: "#fdeecb",
  lavendel: "#ece5ff",
  koraal: "#ffe1e6",
};

const heading = { fontFamily: "var(--font-lab-baloo)" };
const body = { fontFamily: "var(--font-lab-inter)" };

// Deterministic tilt per index — the collectible, hand-placed sticker feel.
const TILTS = [-2.4, 1.8, -1.2, 2.4, -1.8, 1.2, -2.1, 1.5];
const tilt = (i: number): number => TILTS[i % TILTS.length] ?? 0;

// Die-cut sticker surface: thick white outline + soft shadow + inset gloss line.
function dieCut(fill: string, radius = 18): CSSProperties {
  return {
    background: fill,
    border: "3px solid #ffffff",
    borderRadius: radius,
    boxShadow:
      "0 8px 16px rgba(34,27,46,0.14), 0 2px 4px rgba(34,27,46,0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
  };
}

// Glossy top-edge highlight overlay for the sticker sheen.
function Gloss({ radius = 15 }: { radius?: number }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-1 top-1 h-1/3"
      style={{
        borderRadius: radius,
        background: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))",
      }}
    />
  );
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; fill: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fill: C.mint };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fill: C.lavendel };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fill: C.geel };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fill: C.koraal };
  }
}

// Status sticker: die-cut chip, dark plum text + icon (never colour-only).
function StatusSticker({ status, i = 0 }: { status: CredStatus; i?: number }) {
  const { label, Icon, fill } = statusMeta(status);
  return (
    <span
      className="relative inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-semibold"
      style={{ ...dieCut(fill, 999), ...body, color: C.ink, transform: `rotate(${tilt(i)}deg)` }}
    >
      <Icon size={13} strokeWidth={2.6} aria-hidden="true" />
      {label}
    </span>
  );
}

// Small collectible skill/label sticker.
function Chip({ label, fill, i }: { label: string; fill: string; i: number }) {
  return (
    <span
      className="relative inline-flex items-center px-2.5 py-1 text-[11.5px] font-semibold"
      style={{ ...dieCut(fill, 999), ...body, color: C.ink, transform: `rotate(${tilt(i)}deg)` }}
    >
      {label}
    </span>
  );
}

// Section heading — chubby Baloo with a die-cut icon sticker.
function Kop({
  children,
  sub,
  Icon,
  fill,
}: {
  children: React.ReactNode;
  sub?: string;
  Icon: LucideIcon;
  fill: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span
        className="relative flex h-10 w-10 shrink-0 items-center justify-center"
        style={{ ...dieCut(fill, 14), color: C.ink, transform: "rotate(-3deg)" }}
        aria-hidden="true"
      >
        <Gloss radius={11} />
        <Icon size={18} strokeWidth={2.6} />
      </span>
      <div className="leading-tight">
        {sub && (
          <div
            className="text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{ ...body, color: C.inkSoft }}
          >
            {sub}
          </div>
        )}
        <h2
          className="text-[24px] font-extrabold sm:text-[28px]"
          style={{ ...heading, color: C.ink }}
        >
          {children}
        </h2>
      </div>
    </div>
  );
}

// Sparkline drawn as a rounded plum line inside a sticker.
function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, idx) => {
      const x = (idx / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / span) * 90 - 5;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-9 w-full" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={tone}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Match badge — round sticker showing the match percentage.
function MatchBadge({ value, i }: { value: number; i: number }) {
  const fill = value >= 90 ? C.mint : value >= 84 ? C.geel : C.lavendel;
  return (
    <span
      className="relative flex h-12 w-12 shrink-0 flex-col items-center justify-center leading-none"
      style={{ ...dieCut(fill, 999), color: C.ink, transform: `rotate(${tilt(i)}deg)` }}
    >
      <Gloss radius={999} />
      <span className="text-[15px] font-extrabold" style={heading}>
        {value}
      </span>
      <span className="text-[8px] font-bold uppercase tracking-wide" style={body}>
        match
      </span>
    </span>
  );
}

// ---- Screens ---------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  return (
    <div className="space-y-8">
      <Kop sub="Overzicht" Icon={Star} fill={C.geel}>
        Hoi Sanne, dit telt vandaag
      </Kop>

      {/* KPI sticker set */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const fills = [TINT.mint, TINT.roze, TINT.geel, TINT.lavendel];
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <div key={k.label} className="relative" style={{ transform: `rotate(${tilt(i)}deg)` }}>
              <div
                className="relative p-4 transition-transform duration-200 hover:-translate-y-1"
                style={dieCut(fills[i % fills.length] ?? TINT.mint)}
              >
                <Gloss />
                <div className="flex items-start justify-between">
                  <div
                    className="text-[12px] font-bold uppercase tracking-wide"
                    style={{ ...body, color: C.inkSoft }}
                  >
                    {k.label}
                  </div>
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold"
                    style={{ background: "#fff", color: k.up ? "#0f766e" : "#b4530f" }}
                  >
                    <Trend size={11} strokeWidth={3} aria-hidden="true" />
                    {k.trend}
                  </span>
                </div>
                <div
                  className="mt-1 text-[30px] font-extrabold leading-none"
                  style={{ ...heading, color: C.ink }}
                >
                  {k.value}
                </div>
                <div className="mt-2">
                  <Spark data={k.spark} tone={C.ink} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Best match highlight */}
        <div className="lg:col-span-2">
          <Kop sub="Beste match" Icon={Star} fill={C.mint}>
            Vandaag voor jou
          </Kop>
          <button
            onClick={onOpen}
            className="group relative block w-full rounded-[20px] p-5 text-left transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#a78bfa]"
            style={dieCut(TINT.lavendel)}
          >
            <Gloss />
            <div className="flex items-start gap-4">
              <MatchBadge value={top.match} i={0} />
              <div className="min-w-0 flex-1">
                <div
                  className="text-[19px] font-extrabold leading-tight"
                  style={{ ...heading, color: C.ink }}
                >
                  {top.titel}
                </div>
                <div
                  className="mt-0.5 text-[13px] font-medium"
                  style={{ ...body, color: C.inkSoft }}
                >
                  {top.opdrachtgever}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {top.tags.map((t, i) => (
                    <Chip
                      key={t}
                      label={t}
                      fill={[C.roze, C.mint, C.geel][i % 3] ?? C.roze}
                      i={i}
                    />
                  ))}
                </div>
              </div>
              <ChevronRight
                size={22}
                className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
                style={{ color: C.ink }}
                aria-hidden="true"
              />
            </div>
          </button>

          {/* Berichten preview */}
          <div className="mt-8">
            <Kop sub="Postvak" Icon={MessageCircle} fill={C.roze}>
              Berichten
            </Kop>
            <ul className="space-y-3">
              {BERICHTEN.map((b, i) => (
                <li
                  key={b.van}
                  className="relative flex items-center gap-3 p-3"
                  style={dieCut(C.card, 16)}
                >
                  <span
                    className="relative flex h-10 w-10 shrink-0 items-center justify-center text-[13px] font-extrabold"
                    style={{
                      ...dieCut([C.mint, C.geel, C.lavendel][i % 3] ?? C.mint, 999),
                      ...heading,
                      color: C.ink,
                    }}
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="truncate text-[13.5px] font-bold"
                        style={{ ...body, color: C.ink }}
                      >
                        {b.van}
                      </span>
                      {b.ongelezen && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase"
                          style={{ background: C.roze, color: C.ink }}
                        >
                          Nieuw
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
                      {b.preview}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-[11px] font-semibold"
                    style={{ ...body, color: C.inkSoft }}
                  >
                    {b.tijd}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions + credentials rail */}
        <div className="space-y-8">
          <div>
            <Kop sub="Nu doen" Icon={Bell} fill={C.koraal}>
              Acties
            </Kop>
            <ul className="space-y-3">
              {ACTIES.map((a, i) => (
                <li
                  key={a.titel}
                  className="relative p-4"
                  style={dieCut(a.urgentie === "warning" ? TINT.koraal : TINT.mint, 16)}
                >
                  <Gloss />
                  <div
                    className="text-[14px] font-extrabold leading-snug"
                    style={{ ...heading, color: C.ink }}
                  >
                    {a.titel}
                  </div>
                  <p className="mt-1 text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
                    {a.detail}
                  </p>
                  <span
                    className="mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold"
                    style={{ background: "#fff", color: C.ink }}
                  >
                    {a.cta}
                    <ArrowRight size={13} strokeWidth={2.8} aria-hidden="true" />
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center"
                    style={{
                      ...dieCut(a.urgentie === "warning" ? C.koraal : C.mint, 999),
                      color: C.ink,
                    }}
                  >
                    {i + 1}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Kop sub="Vertrouwen" Icon={BadgeCheck} fill={C.mint}>
              Certificaten
            </Kop>
            <ul className="space-y-2.5">
              {CREDENTIALS.map((c, i) => (
                <li
                  key={c.naam}
                  className="relative flex items-center justify-between gap-2 p-3"
                  style={dieCut(C.card, 14)}
                >
                  <span
                    className="truncate text-[13px] font-bold"
                    style={{ ...body, color: C.ink }}
                  >
                    {c.naam}
                  </span>
                  <StatusSticker status={c.status} i={i} />
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
      <Kop sub="Opdrachten" Icon={Search} fill={C.lavendel}>
        Marktplaats
      </Kop>

      {/* Search sticker */}
      <div className="relative flex items-center gap-2 p-1.5" style={dieCut(C.card, 999)}>
        <Search
          size={18}
          className="ml-3 shrink-0"
          style={{ color: C.inkSoft }}
          aria-hidden="true"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of skill…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-2 pr-4 text-[14px] font-medium outline-none placeholder:opacity-60"
          style={{ ...body, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="mr-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#221b2e]"
            style={{ background: C.geel, color: C.ink }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        // Empty state
        <div
          className="relative flex flex-col items-center gap-3 px-6 py-14 text-center"
          style={dieCut(TINT.geel, 22)}
        >
          <Gloss radius={19} />
          <span
            className="relative flex h-14 w-14 items-center justify-center"
            style={{ ...dieCut(C.geel, 999), color: C.ink, transform: "rotate(-4deg)" }}
            aria-hidden="true"
          >
            <Inbox size={26} strokeWidth={2.4} />
          </span>
          <div className="text-[18px] font-extrabold" style={{ ...heading, color: C.ink }}>
            Geen opdrachten gevonden
          </div>
          <p className="max-w-xs text-[13px]" style={{ ...body, color: C.inkSoft }}>
            Er zijn geen resultaten voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm of wis
            het filter.
          </p>
          <button
            onClick={() => setQuery("")}
            className="mt-1 rounded-full px-4 py-2 text-[13px] font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#fbbf24]"
            style={{ ...dieCut(C.mint, 999), color: C.ink }}
          >
            Wis het filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, i) => {
            const isSaved = saved.has(o.id);
            return (
              <div key={o.id} className="relative" style={{ transform: `rotate(${tilt(i)}deg)` }}>
                <article
                  className="relative flex h-full flex-col p-5 transition-transform duration-200 hover:-translate-y-1"
                  style={dieCut(C.card)}
                >
                  <Gloss />
                  <div className="flex items-start justify-between gap-3">
                    <MatchBadge value={o.match} i={i} />
                    <button
                      onClick={() => toggleSave(o.id)}
                      aria-pressed={isSaved}
                      aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                      className="relative flex h-9 w-9 items-center justify-center transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#221b2e]"
                      style={{ ...dieCut(isSaved ? C.roze : C.sheetDeep, 999), color: C.ink }}
                    >
                      {isSaved ? (
                        <BookmarkCheck size={16} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <Bookmark size={16} strokeWidth={2.4} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <h3
                    className="mt-3 text-[17px] font-extrabold leading-tight"
                    style={{ ...heading, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <div
                    className="mt-0.5 text-[13px] font-medium"
                    style={{ ...body, color: C.inkSoft }}
                  >
                    {o.opdrachtgever}
                  </div>
                  <dl
                    className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]"
                    style={{ ...body, color: C.ink }}
                  >
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} style={{ color: C.inkSoft }} aria-hidden="true" />
                      {o.plaats}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wallet size={14} style={{ color: C.inkSoft }} aria-hidden="true" />
                      {o.tarief}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} style={{ color: C.inkSoft }} aria-hidden="true" />
                      {o.uren}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} style={{ color: C.inkSoft }} aria-hidden="true" />
                      {o.start}
                    </div>
                  </dl>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {o.tags.map((t, ti) => (
                      <Chip
                        key={t}
                        label={t}
                        fill={[C.mint, C.geel, C.lavendel][ti % 3] ?? C.mint}
                        i={ti}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => onOpen(o)}
                    className="group mt-4 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[13.5px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2dd4bf]"
                    style={{ ...dieCut(C.mint, 999), color: C.ink }}
                  >
                    Bekijk opdracht
                    <ArrowRight
                      size={15}
                      strokeWidth={2.8}
                      className="transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </button>
                </article>
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
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#221b2e]"
        style={{ ...dieCut(C.card, 999), color: C.ink }}
      >
        <ArrowLeft size={15} strokeWidth={2.6} aria-hidden="true" />
        Terug naar marktplaats
      </button>

      <div className="relative p-6" style={dieCut(TINT.lavendel, 22)}>
        <Gloss radius={19} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <MatchBadge value={opdracht.match} i={0} />
            <div>
              <h2
                className="text-[24px] font-extrabold leading-tight sm:text-[28px]"
                style={{ ...heading, color: C.ink }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[14px] font-semibold" style={{ ...body, color: C.inkSoft }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <button
            onClick={() => toggleSave(opdracht.id)}
            aria-pressed={isSaved}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#221b2e]"
            style={{ ...dieCut(isSaved ? C.roze : C.card, 999), color: C.ink }}
          >
            {isSaved ? (
              <BookmarkCheck size={15} strokeWidth={2.6} aria-hidden="true" />
            ) : (
              <Bookmark size={15} strokeWidth={2.4} aria-hidden="true" />
            )}
            {isSaved ? "Bewaard" : "Bewaar"}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m) => (
            <div key={m.label} className="relative p-3" style={dieCut(C.card, 14)}>
              <m.Icon size={16} style={{ color: C.inkSoft }} aria-hidden="true" />
              <div
                className="mt-1 text-[10.5px] font-bold uppercase tracking-wide"
                style={{ ...body, color: C.inkSoft }}
              >
                {m.label}
              </div>
              <div className="text-[15px] font-extrabold" style={{ ...heading, color: C.ink }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Explainable match — plus / min stickers */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="relative p-5" style={dieCut(TINT.mint, 20)}>
          <Gloss radius={17} />
          <div
            className="mb-3 flex items-center gap-2 text-[15px] font-extrabold"
            style={{ ...heading, color: C.ink }}
          >
            <span
              className="flex h-7 w-7 items-center justify-center"
              style={{ ...dieCut(C.mint, 999), color: C.ink }}
              aria-hidden="true"
            >
              <Plus size={15} strokeWidth={3} />
            </span>
            Waarom dit past
          </div>
          <ul className="space-y-2">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13.5px] font-medium"
                style={{ ...body, color: C.ink }}
              >
                <Check
                  size={16}
                  strokeWidth={3}
                  className="mt-0.5 shrink-0"
                  style={{ color: "#0f766e" }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative p-5" style={dieCut(TINT.koraal, 20)}>
          <Gloss radius={17} />
          <div
            className="mb-3 flex items-center gap-2 text-[15px] font-extrabold"
            style={{ ...heading, color: C.ink }}
          >
            <span
              className="flex h-7 w-7 items-center justify-center"
              style={{ ...dieCut(C.koraal, 999), color: C.ink }}
              aria-hidden="true"
            >
              <Minus size={15} strokeWidth={3} />
            </span>
            Let op
          </div>
          <ul className="space-y-2">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13.5px] font-medium"
                style={{ ...body, color: C.ink }}
              >
                <TriangleAlert
                  size={16}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: "#b4530f" }}
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
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-extrabold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2dd4bf]"
          style={{ ...dieCut(applied ? C.mint : C.roze, 999), ...heading, color: C.ink }}
        >
          {applied ? (
            <Check size={18} strokeWidth={3} aria-hidden="true" />
          ) : (
            <ArrowRight size={18} strokeWidth={2.8} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op deze opdracht"}
        </button>
        {applied && (
          <span className="text-[13px] font-semibold" style={{ ...body, color: C.inkSoft }}>
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
    <div className="space-y-8">
      <Kop sub="Vertrouwensniveau" Icon={BadgeCheck} fill={C.mint}>
        Verificatie
      </Kop>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {CREDENTIALS.map((c, i) => {
            const done = checked.has(c.naam);
            return (
              <div
                key={c.naam}
                className="relative flex items-center gap-3 p-4"
                style={dieCut(C.card, 16)}
              >
                <Gloss radius={13} />
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className="relative flex h-8 w-8 shrink-0 items-center justify-center transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#221b2e]"
                  style={{ ...dieCut(done ? C.mint : C.sheetDeep, 999), color: C.ink }}
                >
                  {done && <Check size={16} strokeWidth={3.2} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-bold" style={{ ...body, color: C.ink }}>
                    {c.naam}
                  </div>
                  <div className="text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
                    {c.detail}
                  </div>
                </div>
                <StatusSticker status={c.status} i={i} />
              </div>
            );
          })}
        </div>

        {/* Documenten feed with loading / error / ok states */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div
              className="flex items-center gap-2 text-[16px] font-extrabold"
              style={{ ...heading, color: C.ink }}
            >
              <FileText size={18} strokeWidth={2.6} aria-hidden="true" />
              Documenten
            </div>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className="flex h-8 w-8 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#221b2e]"
              style={{ ...dieCut(C.geel, 999), color: C.ink }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={15} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>

          {/* State switch stickers */}
          <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className="rounded-full px-3 py-1 text-[11.5px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#221b2e]"
                style={{
                  ...dieCut(feedState === s ? C.lavendel : C.card, 999),
                  color: C.ink,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2.5" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="relative p-3" style={dieCut(C.card, 14)}>
                  <div
                    className="h-3.5 w-2/3 animate-pulse rounded-full"
                    style={{ background: C.sheetDeep }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse rounded-full"
                    style={{ background: C.sheetDeep }}
                  />
                </li>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <div
              className="relative flex flex-col items-center gap-2 px-4 py-8 text-center"
              style={dieCut(TINT.koraal, 18)}
            >
              <span
                className="flex h-12 w-12 items-center justify-center"
                style={{ ...dieCut(C.koraal, 999), color: C.ink }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2.4} />
              </span>
              <div className="text-[15px] font-extrabold" style={{ ...heading, color: C.ink }}>
                Laden mislukt
              </div>
              <p className="text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
                We konden je documenten niet ophalen. Probeer het opnieuw.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className="mt-1 rounded-full px-4 py-2 text-[12.5px] font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#fb7185]"
                style={{ ...dieCut(C.mint, 999), color: C.ink }}
              >
                Opnieuw proberen
              </button>
            </div>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2.5">
              {DOCUMENTEN.map((d, i) => (
                <li
                  key={d.naam}
                  className="relative flex items-center gap-3 p-3"
                  style={dieCut(C.card, 14)}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-[9px] font-extrabold"
                    style={{
                      ...dieCut([C.roze, C.mint, C.geel, C.lavendel][i % 4] ?? C.roze, 12),
                      ...heading,
                      color: C.ink,
                    }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[13px] font-bold"
                      style={{ ...body, color: C.ink }}
                    >
                      {d.naam}
                    </div>
                    <div className="text-[11.5px]" style={{ ...body, color: C.inkSoft }}>
                      {d.grootte} · {d.bijgewerkt}
                    </div>
                  </div>
                  <StatusSticker status={d.status} i={i} />
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
      <Kop sub="Volgende beste acties" Icon={Bell} fill={C.koraal}>
        Acties
      </Kop>

      <div
        className="relative inline-flex items-center gap-2 px-4 py-2"
        style={dieCut(TINT.mint, 999)}
      >
        <span
          className="flex h-6 w-6 items-center justify-center text-[12px] font-extrabold"
          style={{ ...dieCut(C.mint, 999), ...heading, color: C.ink }}
          aria-hidden="true"
        >
          {openCount}
        </span>
        <span className="text-[13.5px] font-bold" style={{ ...body, color: C.ink }}>
          {openCount === 0 ? "Alles afgerond, top!" : `${openCount} openstaande acties`}
        </span>
      </div>

      <ul className="space-y-4">
        {ACTIES.map((a, i) => {
          const isDone = done.has(a.titel);
          return (
            <li key={a.titel} className="relative" style={{ transform: `rotate(${tilt(i)}deg)` }}>
              <div
                className="relative flex items-start gap-4 p-5 transition-transform duration-200 hover:-translate-y-0.5"
                style={dieCut(
                  isDone ? C.sheetDeep : a.urgentie === "warning" ? TINT.koraal : TINT.lavendel,
                )}
              >
                <Gloss />
                <button
                  onClick={() => toggleDone(a.titel)}
                  aria-pressed={isDone}
                  aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                  className="relative flex h-9 w-9 shrink-0 items-center justify-center transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#221b2e]"
                  style={{ ...dieCut(isDone ? C.mint : C.card, 999), color: C.ink }}
                >
                  {isDone && <Check size={17} strokeWidth={3.2} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[16px] font-extrabold leading-snug"
                    style={{
                      ...heading,
                      color: C.ink,
                      textDecoration: isDone ? "line-through" : "none",
                      opacity: isDone ? 0.6 : 1,
                    }}
                  >
                    {a.titel}
                  </div>
                  <p
                    className="mt-1 text-[13px]"
                    style={{ ...body, color: C.inkSoft, opacity: isDone ? 0.6 : 1 }}
                  >
                    {a.detail}
                  </p>
                  {!isDone && (
                    <span
                      className="mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12.5px] font-bold"
                      style={{ ...dieCut(C.geel, 999), color: C.ink }}
                    >
                      {a.cta}
                      <ArrowRight size={13} strokeWidth={2.8} aria-hidden="true" />
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Facturen() {
  const totalPaid = "€ 5.552";
  const totalOpen = "€ 1.350";
  const badge = (status: string): string =>
    status === "Betaald" ? C.mint : status === "Openstaand" ? C.geel : C.lavendel;
  return (
    <div className="space-y-6">
      <Kop sub="Financiën" Icon={Wallet} fill={C.geel}>
        Facturen
      </Kop>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Betaald deze maand", value: totalPaid, fill: TINT.mint },
          { label: "Openstaand", value: totalOpen, fill: TINT.geel },
          { label: "Concept", value: "€ 880", fill: TINT.lavendel },
        ].map((s, i) => (
          <div
            key={s.label}
            className="relative p-4"
            style={{ ...dieCut(s.fill), transform: `rotate(${tilt(i)}deg)` }}
          >
            <Gloss />
            <div
              className="text-[12px] font-bold uppercase tracking-wide"
              style={{ ...body, color: C.inkSoft }}
            >
              {s.label}
            </div>
            <div className="mt-1 text-[26px] font-extrabold" style={{ ...heading, color: C.ink }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="relative p-2" style={dieCut(C.card, 20)}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-y-2 text-left">
            <thead>
              <tr>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wide"
                    style={{ ...body, color: C.inkSoft }}
                    scope="col"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => (
                <tr key={f.nr}>
                  <td
                    className="rounded-l-[12px] px-3 py-3 text-[13px] font-extrabold"
                    style={{ ...heading, background: C.sheetDeep, color: C.ink }}
                  >
                    {f.nr}
                  </td>
                  <td
                    className="px-3 py-3 text-[13px] font-medium"
                    style={{ ...body, background: C.sheetDeep, color: C.ink }}
                  >
                    {f.klant}
                  </td>
                  <td
                    className="px-3 py-3 text-[13px]"
                    style={{ ...body, background: C.sheetDeep, color: C.inkSoft }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-3 py-3 text-[13px] font-extrabold"
                    style={{ ...body, background: C.sheetDeep, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="rounded-r-[12px] px-3 py-3" style={{ background: C.sheetDeep }}>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold"
                      style={{
                        ...dieCut(badge(f.status), 999),
                        color: C.ink,
                        transform: `rotate(${tilt(i)}deg)`,
                      }}
                    >
                      {f.status === "Betaald" ? (
                        <Check size={12} strokeWidth={3} aria-hidden="true" />
                      ) : f.status === "Openstaand" ? (
                        <Clock size={12} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <FileText size={12} strokeWidth={2.6} aria-hidden="true" />
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

export function Concept239() {
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
      style={{
        ...body,
        color: C.ink,
        background: C.sheet,
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(34,27,46,0.05) 1px, transparent 0)",
        backgroundSize: "22px 22px",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="relative flex h-12 w-12 items-center justify-center"
              style={{ ...dieCut(C.roze, 16), color: C.ink, transform: "rotate(-4deg)" }}
              aria-hidden="true"
            >
              <Gloss radius={13} />
              <Star size={22} strokeWidth={2.6} fill="rgba(255,255,255,0.4)" />
            </span>
            <div className="leading-tight">
              <div className="text-[22px] font-extrabold" style={{ ...heading, color: C.ink }}>
                Stickervel
              </div>
              <div
                className="text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ color: C.inkSoft }}
              >
                ZZP · verzamel je vertrouwen
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[13px] font-bold" style={{ color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div className="text-[11px] font-semibold" style={{ color: C.inkSoft }}>
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="relative flex h-12 w-12 items-center justify-center text-[15px] font-extrabold"
              style={{
                ...dieCut(C.mint, 999),
                ...heading,
                color: C.ink,
                transform: "rotate(3deg)",
              }}
              aria-hidden="true"
            >
              <Gloss radius={999} />
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        {/* Nav — tab stickers */}
        <nav className="mb-8 flex flex-wrap gap-2" aria-label="Hoofdnavigatie">
          {SCREENS.map((s, i) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="relative px-4 py-2 text-[13px] font-bold transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#a78bfa]"
                style={{
                  ...dieCut(on ? C.lavendel : C.card, 999),
                  color: C.ink,
                  transform: `rotate(${on ? 0 : tilt(i) * 0.5}deg)`,
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
      </div>
    </div>
  );
}
