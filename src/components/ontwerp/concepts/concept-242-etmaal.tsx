"use client";

// Concept 242 — "Etmaal" · Circadian / time-adaptive theme, built for shift work in care.
// A day-timeline switch (ochtend → middag → avond → nacht) tilts the WHOLE palette and mood:
// warm daylight (cream/amber) by day → cool, dimmed, high-contrast at night (deep navy/
// anthracite with a soft glow). Shows the current "shift rhythm" and eases KPI accents and
// background smoothly to the chosen time. Fonts: Sora (display) + Manrope (body).
// Motion respects prefers-reduced-motion.

import { useState, type CSSProperties } from "react";
import {
  Sunrise,
  Sun,
  Sunset,
  Moon,
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListChecks,
  Receipt,
  Search,
  Bookmark,
  BookmarkCheck,
  Check,
  BadgeCheck,
  Clock,
  TriangleAlert,
  XCircle,
  TrendingUp,
  TrendingDown,
  MapPin,
  Wallet,
  Calendar,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  CircleAlert,
  Inbox,
  FileText,
  MessageSquare,
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

type Tijd = "ochtend" | "middag" | "avond" | "nacht";

// Each time-of-day is a full theme. Text colors are chosen for WCAG AA on their surface.
type Theme = {
  key: Tijd;
  label: string;
  ritme: string;
  klok: string;
  Icon: LucideIcon;
  bg: string;
  glow: string;
  surface: string;
  surfaceAlt: string;
  line: string;
  lineSoft: string;
  ink: string;
  inkSoft: string;
  muted: string;
  faint: string;
  accent: string;
  accentText: string; // readable accent for text on surface
  accentSoft: string;
  good: string;
  goodSoft: string;
  warn: string;
  warnSoft: string;
  bad: string;
  badSoft: string;
  onAccent: string;
};

const THEMES: Record<Tijd, Theme> = {
  ochtend: {
    key: "ochtend",
    label: "Ochtend",
    ritme: "Dagdienst begint",
    klok: "07:00",
    Icon: Sunrise,
    bg: "linear-gradient(165deg, #fff6ec 0%, #ffeede 55%, #ffe3cf 100%)",
    glow: "radial-gradient(60% 55% at 78% 8%, rgba(255,183,94,0.30), transparent 70%)",
    surface: "#fffdfa",
    surfaceAlt: "#fdf3e8",
    line: "#f0dcc6",
    lineSoft: "#f6e8d8",
    ink: "#3a2c1c",
    inkSoft: "#6a5237",
    muted: "#8a6f52",
    faint: "#b39877",
    accent: "#e07b1f",
    accentText: "#b45c0c",
    accentSoft: "#fbe6cf",
    good: "#3f8f5c",
    goodSoft: "#e2f2e6",
    warn: "#c07d10",
    warnSoft: "#fbeecd",
    bad: "#c04a3e",
    badSoft: "#f8e2df",
    onAccent: "#fffaf3",
  },
  middag: {
    key: "middag",
    label: "Middag",
    ritme: "Volle bezetting",
    klok: "13:00",
    Icon: Sun,
    bg: "linear-gradient(165deg, #fbfaf5 0%, #f6f7ef 55%, #eef2e6 100%)",
    glow: "radial-gradient(60% 55% at 82% 6%, rgba(245,204,90,0.26), transparent 70%)",
    surface: "#ffffff",
    surfaceAlt: "#f7f8f1",
    line: "#e5e6d9",
    lineSoft: "#eef0e6",
    ink: "#28301f",
    inkSoft: "#4c5540",
    muted: "#6e7660",
    faint: "#9aa189",
    accent: "#3f9d52",
    accentText: "#2f7f40",
    accentSoft: "#e2f1e2",
    good: "#2f7f40",
    goodSoft: "#e2f1e2",
    warn: "#a9820f",
    warnSoft: "#f7eecc",
    bad: "#bb4438",
    badSoft: "#f6e0dc",
    onAccent: "#ffffff",
  },
  avond: {
    key: "avond",
    label: "Avond",
    ritme: "Avonddienst",
    klok: "20:00",
    Icon: Sunset,
    bg: "linear-gradient(165deg, #2c2340 0%, #322648 48%, #3a2a4e 100%)",
    glow: "radial-gradient(62% 55% at 80% 8%, rgba(255,138,101,0.24), transparent 72%)",
    surface: "#372a4d",
    surfaceAlt: "#3f3057",
    line: "rgba(255,236,222,0.16)",
    lineSoft: "rgba(255,236,222,0.10)",
    ink: "#f6ecff",
    inkSoft: "#d5c6e8",
    muted: "#b3a3c9",
    faint: "#8e7fa6",
    accent: "#ff9a6b",
    accentText: "#ffb48c",
    accentSoft: "rgba(255,154,107,0.18)",
    good: "#6fd39a",
    goodSoft: "rgba(111,211,154,0.16)",
    warn: "#f6c76b",
    warnSoft: "rgba(246,199,107,0.16)",
    bad: "#ff8a80",
    badSoft: "rgba(255,138,128,0.16)",
    onAccent: "#2b1d10",
  },
  nacht: {
    key: "nacht",
    label: "Nacht",
    ritme: "Nachtdienst · gedimd",
    klok: "02:30",
    Icon: Moon,
    bg: "linear-gradient(165deg, #0a1020 0%, #0c1424 50%, #0a1526 100%)",
    glow: "radial-gradient(60% 52% at 78% 10%, rgba(96,140,255,0.20), transparent 72%)",
    surface: "#111a2e",
    surfaceAlt: "#152036",
    line: "rgba(200,220,255,0.14)",
    lineSoft: "rgba(200,220,255,0.08)",
    ink: "#e8f0ff",
    inkSoft: "#b7c6e4",
    muted: "#8ea0c4",
    faint: "#657698",
    accent: "#6c9dff",
    accentText: "#9bbcff",
    accentSoft: "rgba(108,157,255,0.18)",
    good: "#5fd6ac",
    goodSoft: "rgba(95,214,172,0.15)",
    warn: "#e7c56a",
    warnSoft: "rgba(231,197,106,0.15)",
    bad: "#ff8fa0",
    badSoft: "rgba(255,143,160,0.15)",
    onAccent: "#0a1020",
  },
};

const TIJDEN: Tijd[] = ["ochtend", "middag", "avond", "nacht"];

const display = { fontFamily: "var(--font-lab-sora)" };
const body = { fontFamily: "var(--font-lab-manrope)" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: MessageSquare,
};

function statusMeta(
  s: CredStatus,
  T: Theme,
): { label: string; Icon: LucideIcon; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: T.good, bg: T.goodSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: T.accentText, bg: T.accentSoft };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: T.warn, bg: T.warnSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: T.bad, bg: T.badSoft };
  }
}

function StatusChip({ status, T }: { status: CredStatus; T: Theme }) {
  const { label, Icon, fg, bg } = statusMeta(status, T);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
      style={{ ...body, color: fg, background: bg }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
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
        stroke={tone}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function panel(T: Theme): CSSProperties {
  return { background: T.surface, border: `1px solid ${T.line}`, borderRadius: 16 };
}

function MatchBadge({ value, T }: { value: number; T: Theme }) {
  return (
    <span
      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[13px] leading-none"
      style={{ background: T.accentSoft, color: T.accentText }}
    >
      <span className="text-[16px] font-bold tabular-nums" style={display}>
        {value}
      </span>
      <span className="text-[8px] font-semibold uppercase tracking-wide">match</span>
    </span>
  );
}

// ---- Screens ---------------------------------------------------------------

function Dashboard({ T, onOpen }: { T: Theme; onOpen: (o: Opdracht) => void }) {
  return (
    <div className="space-y-6">
      {/* Shift rhythm banner */}
      <div className="flex flex-wrap items-center gap-3 rounded-[16px] p-4" style={panel(T)}>
        <span
          className="flex h-12 w-12 items-center justify-center rounded-[13px]"
          style={{ background: T.accentSoft, color: T.accentText }}
          aria-hidden="true"
        >
          <T.Icon size={22} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="text-[12px] font-semibold uppercase tracking-wide"
            style={{ color: T.muted }}
          >
            Dienst-ritme
          </div>
          <div className="text-[17px] font-semibold" style={{ ...display, color: T.ink }}>
            {T.ritme}
          </div>
        </div>
        <div className="text-right">
          <div
            className="text-[22px] font-bold tabular-nums"
            style={{ ...display, color: T.accentText }}
          >
            {T.klok}
          </div>
          <div className="text-[11px] font-medium" style={{ color: T.muted }}>
            {T.label}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const tones = [T.accent, T.good, T.good, T.warn];
          const tone = tones[i % tones.length] ?? T.accent;
          return (
            <div key={k.label} className="p-3.5" style={panel(T)}>
              <div className="flex items-center justify-between gap-2">
                <span
                  className="truncate text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: T.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
                  style={{ color: k.up ? T.good : T.warn }}
                >
                  <Trend size={11} strokeWidth={2.6} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-1 text-[22px] font-bold tabular-nums leading-none"
                style={{ ...display, color: T.ink }}
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-[16px] font-semibold" style={{ ...display, color: T.ink }}>
            Beste matches
          </h2>
          <ul className="space-y-2.5">
            {OPDRACHTEN.map((o) => (
              <li key={o.id}>
                <button
                  onClick={() => onOpen(o)}
                  className="flex w-full items-center gap-3 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ ...panel(T), ["--c242-ring" as string]: T.accent } as CSSProperties}
                >
                  <MatchBadge value={o.match} T={T} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-semibold" style={{ color: T.ink }}>
                      {o.titel}
                    </div>
                    <div className="truncate text-[12.5px]" style={{ color: T.muted }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                  </div>
                  <ArrowRight size={17} style={{ color: T.faint }} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-[16px] font-semibold" style={{ ...display, color: T.ink }}>
            Acties
          </h2>
          <ul className="space-y-2.5">
            {ACTIES.map((a) => (
              <li key={a.titel} className="p-4" style={panel(T)}>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: a.urgentie === "warning" ? T.warn : T.accent }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-[13.5px] font-semibold leading-snug"
                    style={{ color: T.ink }}
                  >
                    {a.titel}
                  </span>
                </div>
                <p className="mt-1.5 text-[12px]" style={{ color: T.muted }}>
                  {a.detail}
                </p>
                <span
                  className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold"
                  style={{ color: T.accentText }}
                >
                  {a.cta}
                  <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Marktplaats({
  T,
  query,
  setQuery,
  saved,
  toggleSave,
  onOpen,
}: {
  T: Theme;
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
    <div className="space-y-5">
      <h2 className="text-[18px] font-semibold" style={{ ...display, color: T.ink }}>
        Marktplaats
      </h2>

      <div className="flex items-center gap-2 rounded-[14px] px-3.5 py-2.5" style={panel(T)}>
        <Search size={17} className="shrink-0" style={{ color: T.faint }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of skill…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[color:var(--c242-faint)]"
          style={{ ...body, color: T.ink, ["--c242-faint" as string]: T.faint }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: T.accentText, background: T.accentSoft }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center" style={panel(T)}>
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: T.accentSoft, color: T.accentText }}
            aria-hidden="true"
          >
            <Inbox size={26} strokeWidth={2} />
          </span>
          <h3 className="text-[16px] font-semibold" style={{ ...display, color: T.ink }}>
            Geen resultaten
          </h3>
          <p className="max-w-xs text-[13px]" style={{ color: T.muted }}>
            Geen opdracht voor &ldquo;{query}&rdquo;. Pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQuery("")}
            className="mt-1 rounded-full px-4 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: T.accent, color: T.onAccent }}
          >
            Filter wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <article key={o.id} className="flex h-full flex-col p-5" style={panel(T)}>
                <div className="flex items-start justify-between gap-3">
                  <MatchBadge value={o.match} T={T} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      color: isSaved ? T.accentText : T.faint,
                      background: isSaved ? T.accentSoft : "transparent",
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={17} aria-hidden="true" />
                    ) : (
                      <Bookmark size={17} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <h3
                  className="mt-3 text-[15.5px] font-semibold leading-tight"
                  style={{ color: T.ink }}
                >
                  {o.titel}
                </h3>
                <div className="mt-0.5 text-[12.5px]" style={{ color: T.muted }}>
                  {o.opdrachtgever}
                </div>
                <dl
                  className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]"
                  style={{ color: T.inkSoft }}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} style={{ color: T.faint }} aria-hidden="true" />
                    {o.plaats}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wallet size={13} style={{ color: T.faint }} aria-hidden="true" />
                    {o.tarief}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} style={{ color: T.faint }} aria-hidden="true" />
                    {o.uren}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} style={{ color: T.faint }} aria-hidden="true" />
                    {o.start}
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{ background: T.surfaceAlt, color: T.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => onOpen(o)}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ background: T.accent, color: T.onAccent }}
                >
                  Open opdracht
                  <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
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
  T,
  opdracht,
  saved,
  toggleSave,
  onBack,
}: {
  T: Theme;
  opdracht: Opdracht;
  saved: boolean;
  toggleSave: () => void;
  onBack: () => void;
}) {
  const [applied, setApplied] = useState(false);
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: T.inkSoft, background: T.surface, border: `1px solid ${T.line}` }}
      >
        <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
        Terug
      </button>

      <div className="p-5 sm:p-6" style={panel(T)}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[15px] leading-none"
              style={{ background: T.accentSoft, color: T.accentText }}
            >
              <span className="text-[19px] font-bold tabular-nums" style={display}>
                {opdracht.match}
              </span>
              <span className="text-[8.5px] font-semibold uppercase tracking-wide">match</span>
            </span>
            <div>
              <h2
                className="text-[22px] font-semibold leading-tight"
                style={{ ...display, color: T.ink }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[13.5px]" style={{ color: T.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <button
            onClick={toggleSave}
            aria-pressed={saved}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              color: saved ? T.accentText : T.inkSoft,
              background: saved ? T.accentSoft : T.surfaceAlt,
            }}
          >
            {saved ? (
              <BookmarkCheck size={15} aria-hidden="true" />
            ) : (
              <Bookmark size={15} aria-hidden="true" />
            )}
            {saved ? "Bewaard" : "Bewaar"}
          </button>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m) => (
            <div key={m.label} className="rounded-[12px] p-3" style={{ background: T.surfaceAlt }}>
              <m.Icon size={15} style={{ color: T.accentText }} aria-hidden="true" />
              <dt
                className="mt-1 text-[10.5px] font-semibold uppercase tracking-wide"
                style={{ color: T.muted }}
              >
                {m.label}
              </dt>
              <dd className="text-[14px] font-semibold" style={{ color: T.ink }}>
                {m.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
              style={{ background: T.surfaceAlt, color: T.inkSoft }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="p-5" style={panel(T)}>
          <div className="mb-2 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: T.goodSoft, color: T.good }}
              aria-hidden="true"
            >
              <Plus size={13} strokeWidth={2.8} />
            </span>
            <span className="text-[13.5px] font-semibold" style={{ color: T.ink }}>
              Waarom dit past
            </span>
          </div>
          <ul className="space-y-2">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ color: T.inkSoft }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: T.good }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5" style={panel(T)}>
          <div className="mb-2 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: T.warnSoft, color: T.warn }}
              aria-hidden="true"
            >
              <Minus size={13} strokeWidth={2.8} />
            </span>
            <span className="text-[13.5px] font-semibold" style={{ color: T.ink }}>
              Let op
            </span>
          </div>
          <ul className="space-y-2">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ color: T.inkSoft }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.4}
                  className="mt-0.5 shrink-0"
                  style={{ color: T.warn }}
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
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: applied ? T.good : T.accent,
            color: applied ? T.onAccent : T.onAccent,
          }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.8} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </button>
        {applied && (
          <span className="text-[12.5px]" style={{ color: T.muted }}>
            Gemiddelde reactietijd opdrachtgever: 6 uur.
          </span>
        )}
      </div>
    </div>
  );
}

function Verificatie({
  T,
  checked,
  toggleCheck,
  feedState,
  setFeedState,
}: {
  T: Theme;
  checked: Set<string>;
  toggleCheck: (naam: string) => void;
  feedState: "ok" | "loading" | "error";
  setFeedState: (s: "ok" | "loading" | "error") => void;
}) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-semibold" style={{ ...display, color: T.ink }}>
          Verificatie
        </h2>
        <p className="mt-0.5 text-[12.5px]" style={{ color: T.muted }}>
          {verified} van {CREDENTIALS.length} geverifieerd · {PROFIEL.trust}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            return (
              <div key={c.naam} className="flex items-center gap-3 p-4" style={panel(T)}>
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    border: `1.5px solid ${done ? T.accent : T.line}`,
                    background: done ? T.accent : "transparent",
                    color: T.onAccent,
                  }}
                >
                  {done && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ color: T.ink }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ color: T.muted }}>
                    {c.detail}
                  </div>
                </div>
                <StatusChip status={c.status} T={T} />
              </div>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[14.5px] font-semibold"
              style={{ color: T.ink }}
            >
              <FileText
                size={16}
                strokeWidth={2.2}
                style={{ color: T.accentText }}
                aria-hidden="true"
              />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className="flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: T.accentText, border: `1px solid ${T.line}` }}
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
                className="rounded-full px-3 py-1 text-[11.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  color: feedState === s ? T.onAccent : T.muted,
                  background: feedState === s ? T.accent : T.surfaceAlt,
                  border: `1px solid ${feedState === s ? T.accent : T.line}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="p-3" style={panel(T)}>
                  <div
                    className="c242-pulse h-3 w-2/3 rounded"
                    style={{ background: T.lineSoft }}
                  />
                  <div
                    className="c242-pulse mt-2 h-2.5 w-1/3 rounded"
                    style={{ background: T.lineSoft }}
                  />
                </li>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <div
              className="flex flex-col items-center gap-2 px-4 py-8 text-center"
              style={panel(T)}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: T.badSoft, color: T.bad }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[14.5px] font-semibold" style={{ color: T.ink }}>
                Laden mislukt
              </div>
              <p className="text-[12px]" style={{ color: T.muted }}>
                Kon de documentenkluis niet bereiken.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className="mt-1 rounded-full px-4 py-2 text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: T.accent, color: T.onAccent }}
              >
                Opnieuw proberen
              </button>
            </div>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <li key={d.naam} className="flex items-center gap-3 p-3" style={panel(T)}>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[9px] font-bold"
                    style={{ background: T.accentSoft, color: T.accentText }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-semibold" style={{ color: T.ink }}>
                      {d.naam}
                    </div>
                    <div className="text-[11px]" style={{ color: T.muted }}>
                      {d.grootte} · {d.bijgewerkt}
                    </div>
                  </div>
                  <StatusChip status={d.status} T={T} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Acties({
  T,
  done,
  toggleDone,
}: {
  T: Theme;
  done: Set<string>;
  toggleDone: (t: string) => void;
}) {
  const openCount = ACTIES.filter((a) => !done.has(a.titel)).length;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[18px] font-semibold" style={{ ...display, color: T.ink }}>
          Acties
        </h2>
        <p className="mt-0.5 text-[12.5px]" style={{ color: T.muted }}>
          {openCount === 0 ? "Alles afgerond." : `${openCount} openstaande acties.`}
        </p>
      </div>

      {openCount === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center" style={panel(T)}>
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: T.goodSoft, color: T.good }}
            aria-hidden="true"
          >
            <Check size={28} strokeWidth={2.4} />
          </span>
          <h3 className="text-[16px] font-semibold" style={{ ...display, color: T.ink }}>
            Wachtrij leeg
          </h3>
          <p className="max-w-xs text-[13px]" style={{ color: T.muted }}>
            Je hebt alle acties afgerond. Nieuwe taken verschijnen hier vanzelf.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {ACTIES.map((a) => {
            const isDone = done.has(a.titel);
            return (
              <li key={a.titel} className="flex items-start gap-4 p-5" style={panel(T)}>
                <button
                  onClick={() => toggleDone(a.titel)}
                  aria-pressed={isDone}
                  aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    border: `1.5px solid ${isDone ? T.good : T.line}`,
                    background: isDone ? T.good : "transparent",
                    color: T.onAccent,
                  }}
                >
                  {isDone && <Check size={16} strokeWidth={3} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15px] font-semibold leading-snug"
                    style={{
                      color: T.ink,
                      textDecoration: isDone ? "line-through" : "none",
                      opacity: isDone ? 0.55 : 1,
                    }}
                  >
                    {a.titel}
                  </div>
                  <p
                    className="mt-1 text-[12.5px]"
                    style={{ color: T.muted, opacity: isDone ? 0.55 : 1 }}
                  >
                    {a.detail}
                  </p>
                  {!isDone && (
                    <span
                      className="mt-2.5 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                      style={{
                        color: a.urgentie === "warning" ? T.warn : T.accentText,
                        background: a.urgentie === "warning" ? T.warnSoft : T.accentSoft,
                      }}
                    >
                      {a.cta}
                      <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                    </span>
                  )}
                </div>
                {a.urgentie === "warning" && !isDone && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                    style={{ color: T.warn, background: T.warnSoft }}
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" />
                    Urgent
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Facturen({ T }: { T: Theme }) {
  const badgeFg = (s: string): string =>
    s === "Betaald" ? T.good : s === "Openstaand" ? T.warn : T.muted;
  const badgeBg = (s: string): string =>
    s === "Betaald" ? T.goodSoft : s === "Openstaand" ? T.warnSoft : T.surfaceAlt;
  return (
    <div className="space-y-5">
      <h2 className="text-[18px] font-semibold" style={{ ...display, color: T.ink }}>
        Facturen
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald deze maand", value: "€ 5.552", tone: T.good },
          { label: "Openstaand", value: "€ 1.350", tone: T.warn },
          { label: "Concept", value: "€ 880", tone: T.muted },
        ].map((s) => (
          <div key={s.label} className="p-4" style={panel(T)}>
            <div
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: T.muted }}
            >
              {s.label}
            </div>
            <div
              className="mt-1 text-[22px] font-bold tabular-nums"
              style={{ ...display, color: s.tone }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden" style={panel(T)}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide"
                    style={{ color: T.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => (
                <tr key={f.nr} style={{ borderBottom: `1px solid ${T.lineSoft}` }}>
                  <td
                    className="px-4 py-3 text-[12.5px] font-semibold"
                    style={{ color: T.accentText }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-medium" style={{ color: T.ink }}>
                    {f.klant}
                  </td>
                  <td className="px-4 py-3 text-[12.5px]" style={{ color: T.muted }}>
                    {f.datum}
                  </td>
                  <td
                    className="px-4 py-3 text-[13px] font-semibold tabular-nums"
                    style={{ color: T.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
                      style={{ color: badgeFg(f.status), background: badgeBg(f.status) }}
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

export function Concept242() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [tijd, setTijd] = useState<Tijd>("middag");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set(["OPD-2041"]));
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Set<string>>(new Set());
  const [feedState, setFeedState] = useState<"ok" | "loading" | "error">("ok");
  const [active, setActive] = useState<Opdracht>(OPDRACHTEN[0] as Opdracht);

  const T = THEMES[tijd];
  const dark = tijd === "avond" || tijd === "nacht";

  const toggleSet = (s: Set<string>, key: string): Set<string> => {
    const n = new Set(s);
    if (n.has(key)) n.delete(key);
    else n.add(key);
    return n;
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{
        ...body,
        color: T.ink,
        background: T.bg,
        transition: "background 700ms ease, color 700ms ease",
      }}
    >
      {/* Time-adaptive glow + smooth theme easing (reduced-motion aware) */}
      <style>{`
        .c242-glow { transition: background 700ms ease; }
        @keyframes c242-pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
        .c242-pulse { animation: c242-pulse 1.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .c242-root, .c242-root * { transition: none !important; }
          .c242-pulse { animation: none; }
        }
      `}</style>
      <div className="c242-root">
        <div
          className="c242-glow pointer-events-none absolute inset-0"
          style={{ background: T.glow }}
          aria-hidden="true"
        />

        <div className="relative z-[1] mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-[13px]"
                style={{
                  background: T.accentSoft,
                  color: T.accentText,
                  transition: "background 700ms ease, color 700ms ease",
                }}
                aria-hidden="true"
              >
                <T.Icon size={21} strokeWidth={2} />
              </span>
              <div className="leading-tight">
                <div className="text-[18px] font-semibold" style={{ ...display, color: T.ink }}>
                  Etmaal
                </div>
                <div className="text-[11px] font-medium" style={{ color: T.muted }}>
                  {T.ritme} · {T.klok}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right leading-tight sm:block">
                <div className="text-[13px] font-semibold" style={{ color: T.ink }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="inline-flex items-center gap-1 text-[11px] font-medium"
                  style={{ color: T.good }}
                >
                  <BadgeCheck size={12} strokeWidth={2.4} aria-hidden="true" />
                  {PROFIEL.trust}
                </div>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full text-[14px] font-bold"
                style={{ background: T.accentSoft, color: T.accentText }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </header>

          {/* Day-timeline switch — tilts the whole theme */}
          <div className="mb-5" role="group" aria-label="Kies tijd van de dag">
            <div
              className="mb-2 text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: T.muted }}
            >
              Tijdlijn van de dienst
            </div>
            <div className="flex flex-wrap gap-2">
              {TIJDEN.map((k) => {
                const th = THEMES[k];
                const on = k === tijd;
                return (
                  <button
                    key={k}
                    onClick={() => setTijd(k)}
                    aria-pressed={on}
                    className="flex items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      background: on ? T.accent : T.surface,
                      border: `1px solid ${on ? T.accent : T.line}`,
                      color: on ? T.onAccent : T.inkSoft,
                      transition:
                        "background 400ms ease, color 400ms ease, border-color 400ms ease",
                    }}
                  >
                    <th.Icon
                      size={15}
                      strokeWidth={2.2}
                      aria-hidden="true"
                      style={{ color: on ? T.onAccent : T.accentText }}
                    />
                    {th.label}
                  </button>
                );
              })}
            </div>
          </div>

          <nav className="mb-6 flex flex-wrap gap-1.5 overflow-x-auto" aria-label="Hoofdnavigatie">
            {SCREENS.map((s) => {
              const on = s.key === screen;
              const Icon = NAV_ICONS[s.key];
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    color: on ? T.onAccent : T.inkSoft,
                    background: on ? (dark ? T.accent : T.ink) : T.surface,
                    border: `1px solid ${on ? (dark ? T.accent : T.ink) : T.line}`,
                    transition: "background 400ms ease, color 400ms ease",
                  }}
                >
                  <Icon size={15} strokeWidth={2.2} aria-hidden="true" />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <main>
            {screen === "dashboard" && (
              <Dashboard
                T={T}
                onOpen={(o) => {
                  setActive(o);
                  setScreen("opdracht");
                }}
              />
            )}
            {screen === "marktplaats" && (
              <Marktplaats
                T={T}
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
                T={T}
                opdracht={active}
                saved={saved.has(active.id)}
                toggleSave={() => setSaved((s) => toggleSet(s, active.id))}
                onBack={() => setScreen("marktplaats")}
              />
            )}
            {screen === "verificatie" && (
              <Verificatie
                T={T}
                checked={checked}
                toggleCheck={(naam) => setChecked((s) => toggleSet(s, naam))}
                feedState={feedState}
                setFeedState={setFeedState}
              />
            )}
            {screen === "acties" && (
              <Acties T={T} done={done} toggleDone={(t) => setDone((s) => toggleSet(s, t))} />
            )}
            {screen === "facturen" && <Facturen T={T} />}
          </main>

          <footer
            className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[11.5px]"
            style={{ borderColor: T.line, color: T.muted }}
          >
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare
                size={13}
                strokeWidth={2.2}
                style={{ color: T.accentText }}
                aria-hidden="true"
              />
              {BERICHTEN.filter((b) => b.ongelezen).length} ongelezen · {ACTIES.length} acties
            </span>
            <span>Circadiaan ritme · {T.label.toLowerCase()}modus</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
