"use client";

// Concept 248 — "Choreografie" · Motion-first, georkestreerde beweging.
// Signatuur: bij het wisselen van scherm komen elementen in een verzorgde STAGGER binnen —
// opeenvolgende animation-delay per index, zachte easing, fade+slide+scale met betekenis.
// Beweging stuurt de aandacht: het belangrijkste element verschijnt eerst, secundair volgt.
// Deterministisch (delay via index, GEEN random). prefers-reduced-motion => alles direct
// zichtbaar, geen animatie. Strak, modern, licht palet met één indigo-accent.
// Fonts: Space Grotesk (display/koppen) + Geist (body/UI). Cijfers tabular-nums.

import { useState, type CSSProperties } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Bell,
  TrendingUp,
  TrendingDown,
  MapPin,
  Wallet,
  Clock,
  Calendar,
  Bookmark,
  BookmarkCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  TriangleAlert,
  XCircle,
  FileText,
  RefreshCw,
  CircleAlert,
  Inbox,
  Plus,
  Minus,
  ChevronRight,
  Sparkles,
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

// Light palette, single indigo accent. AA-checked text colors on paper.
const C = {
  paper: "#f7f8fb",
  card: "#ffffff",
  cardSoft: "#f1f3f9",
  line: "rgba(23,26,45,0.08)",
  lineStrong: "rgba(23,26,45,0.14)",
  ink: "#171a2d",
  inkSoft: "#4a4f68",
  muted: "#767c96",
  faint: "#9aa0b8",
  accent: "#4f46e5",
  accentSoft: "#eef0fe",
  green: "#0f7a52",
  amber: "#9a6a12",
  red: "#b42342",
};

const display = { fontFamily: "var(--font-lab-space)" };
const body = { fontFamily: "var(--font-lab-geist)" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, tone: C.green, bg: "#e5f4ec" };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.accent, bg: C.accentSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, tone: C.amber, bg: "#fbf1de" };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red, bg: "#fbe6ec" };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, tone, bg } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ ...body, color: tone, background: bg }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

// Stagger cell: applies a per-index animation-delay so children enter in sequence.
// The parent keys on `screen`, so React remounts and the animation replays on nav.
function stagger(i: number): CSSProperties {
  return { ["--c248-i" as string]: String(i) };
}

function Sparkline({ data, tone }: { data: number[]; tone: string }) {
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
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[11px] font-semibold uppercase tracking-[0.22em]"
      style={{ ...body, color: C.accent }}
    >
      {children}
    </div>
  );
}

function ScreenHead({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="c248-rise mb-6" style={stagger(0)}>
      <Kicker>{kicker}</Kicker>
      <h1
        className="mt-1.5 text-[28px] font-bold leading-none tracking-tight sm:text-[32px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2 max-w-lg text-[13.5px] leading-relaxed"
          style={{ ...body, color: C.muted }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function cardStyle(): CSSProperties {
  return { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14 };
}

// ---- Screens ---------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  return (
    <div>
      <ScreenHead
        kicker="Overzicht"
        title="Goedemorgen, Sanne"
        sub="Drie matches boven 80%. Eén credential vraagt aandacht — de rest is in rustige staat."
      />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <div
              key={k.label}
              className="c248-rise p-4"
              style={{ ...cardStyle(), ...stagger(i + 1) }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium" style={{ ...body, color: C.muted }}>
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ ...body, color: k.up ? C.green : C.amber }}
                >
                  <Trend size={12} strokeWidth={2.4} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-1.5 text-[26px] font-bold tabular-nums leading-none"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-2">
                <Sparkline data={k.spark} tone={C.accent} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="c248-rise mb-3 flex items-center gap-2" style={stagger(5)}>
            <Sparkles size={16} strokeWidth={2.2} style={{ color: C.accent }} aria-hidden="true" />
            <h2 className="text-[15px] font-bold" style={{ ...display, color: C.ink }}>
              Beste match voor jou
            </h2>
          </div>
          <button
            onClick={onOpen}
            className="c248-rise group flex w-full items-start gap-4 p-5 text-left transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(79,70,229,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
            style={{ ...cardStyle(), ...stagger(6) }}
          >
            <span
              className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl leading-none"
              style={{ background: C.accentSoft, color: C.accent }}
              aria-hidden="true"
            >
              <span className="text-[18px] font-bold tabular-nums" style={display}>
                {top.match}
              </span>
              <span className="text-[8px] font-semibold uppercase tracking-wider">match</span>
            </span>
            <div className="min-w-0 flex-1">
              <div
                className="text-[17px] font-semibold leading-tight"
                style={{ ...body, color: C.ink }}
              >
                {top.titel}
              </div>
              <div className="mt-0.5 text-[13px]" style={{ ...body, color: C.muted }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{ ...body, background: C.cardSoft, color: C.inkSoft }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <ChevronRight
              size={20}
              className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
              style={{ color: C.accent }}
              aria-hidden="true"
            />
          </button>

          <div className="c248-rise mb-3 mt-6 flex items-center gap-2" style={stagger(7)}>
            <MessageSquare
              size={16}
              strokeWidth={2.2}
              style={{ color: C.accent }}
              aria-hidden="true"
            />
            <h2 className="text-[15px] font-bold" style={{ ...display, color: C.ink }}>
              Recente berichten
            </h2>
          </div>
          <ul className="space-y-2.5">
            {BERICHTEN.map((b, i) => (
              <li
                key={b.van}
                className="c248-rise flex items-center gap-3 p-3.5"
                style={{ ...cardStyle(), ...stagger(8 + i) }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                  style={{ ...body, background: C.accentSoft, color: C.accent }}
                  aria-hidden="true"
                >
                  {b.initialen}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="truncate text-[13px] font-semibold"
                      style={{ ...body, color: C.ink }}
                    >
                      {b.van}
                    </span>
                    {b.ongelezen && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
                        style={{ ...body, background: C.accent, color: "#fff" }}
                      >
                        nieuw
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[12.5px]" style={{ ...body, color: C.muted }}>
                    {b.preview}
                  </p>
                </div>
                <span
                  className="shrink-0 text-[11px] tabular-nums"
                  style={{ ...body, color: C.faint }}
                >
                  {b.tijd}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="c248-rise mb-3 flex items-center gap-2" style={stagger(9)}>
            <ListTodo size={16} strokeWidth={2.2} style={{ color: C.accent }} aria-hidden="true" />
            <h2 className="text-[15px] font-bold" style={{ ...display, color: C.ink }}>
              Volgende acties
            </h2>
          </div>
          <ul className="space-y-2.5">
            {ACTIES.map((a, i) => (
              <li
                key={a.titel}
                className="c248-rise p-4"
                style={{ ...cardStyle(), ...stagger(10 + i) }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{
                      ...body,
                      color: "#fff",
                      background: a.urgentie === "warning" ? C.amber : C.accent,
                    }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span
                    className="text-[13.5px] font-semibold leading-snug"
                    style={{ ...body, color: C.ink }}
                  >
                    {a.titel}
                  </span>
                </div>
                <p className="mt-1.5 text-[12.5px]" style={{ ...body, color: C.muted }}>
                  {a.detail}
                </p>
                <span
                  className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold"
                  style={{ ...body, color: C.accent }}
                >
                  {a.cta}
                  <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
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
        kicker="Marktplaats"
        title="Open opdrachten"
        sub="Verklaarbare matches, op volgorde van relevantie."
      />

      <div
        className="c248-rise mb-5 flex items-center gap-2 px-4 py-2.5"
        style={{ ...cardStyle(), ...stagger(1) }}
      >
        <Search size={17} className="shrink-0" style={{ color: C.accent }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of skill…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[14px] outline-none placeholder:opacity-60"
          style={{ ...body, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
            style={{ ...body, color: C.accent, background: C.accentSoft }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="c248-rise flex flex-col items-center gap-3 px-6 py-14 text-center"
          style={{ ...cardStyle(), ...stagger(2) }}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.accentSoft, color: C.accent }}
            aria-hidden="true"
          >
            <Inbox size={26} strokeWidth={2} />
          </span>
          <h3 className="text-[17px] font-bold" style={{ ...display, color: C.ink }}>
            Geen resultaten
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...body, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Pas de zoekterm aan of wis het filter.
          </p>
          <button
            onClick={() => setQuery("")}
            className="mt-1 rounded-full px-4 py-2 text-[13px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...body, background: C.accent }}
          >
            Filter wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, i) => {
            const isSaved = saved.has(o.id);
            return (
              <article
                key={o.id}
                className="c248-rise flex h-full flex-col p-5 transition-shadow hover:shadow-[0_8px_24px_-14px_rgba(23,26,45,0.35)]"
                style={{ ...cardStyle(), ...stagger(i + 1) }}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl leading-none"
                    style={{ background: C.accentSoft, color: C.accent }}
                    aria-hidden="true"
                  >
                    <span className="text-[16px] font-bold tabular-nums" style={display}>
                      {o.match}
                    </span>
                    <span className="text-[7.5px] font-semibold uppercase tracking-wider">
                      match
                    </span>
                  </span>
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
                    style={{
                      background: isSaved ? C.accentSoft : C.cardSoft,
                      color: isSaved ? C.accent : C.muted,
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
                  style={{ ...body, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <div className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.muted }}>
                  {o.opdrachtgever}
                </div>
                <dl
                  className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]"
                  style={{ ...body, color: C.inkSoft }}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} style={{ color: C.faint }} aria-hidden="true" />
                    {o.plaats}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wallet size={13} style={{ color: C.faint }} aria-hidden="true" />
                    {o.tarief}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} style={{ color: C.faint }} aria-hidden="true" />
                    {o.uren}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} style={{ color: C.faint }} aria-hidden="true" />
                    {o.start}
                  </div>
                </dl>
                <button
                  onClick={() => onOpen(o)}
                  className="group mt-4 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ ...body, background: C.accent }}
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
    <div>
      <button
        onClick={onBack}
        className="c248-rise mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
        style={{ ...body, color: C.inkSoft, background: C.cardSoft, ...stagger(0) }}
      >
        <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
        Terug
      </button>

      <div className="c248-rise p-6" style={{ ...cardStyle(), ...stagger(1) }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl leading-none"
              style={{ background: C.accentSoft, color: C.accent }}
              aria-hidden="true"
            >
              <span className="text-[18px] font-bold tabular-nums" style={display}>
                {opdracht.match}
              </span>
              <span className="text-[8px] font-semibold uppercase tracking-wider">match</span>
            </span>
            <div>
              <h2
                className="text-[23px] font-bold leading-tight tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[13.5px]" style={{ ...body, color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <button
            onClick={() => toggleSave(opdracht.id)}
            aria-pressed={isSaved}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
            style={{
              ...body,
              color: isSaved ? C.accent : C.inkSoft,
              background: isSaved ? C.accentSoft : C.cardSoft,
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
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m) => (
            <div key={m.label} className="rounded-xl p-3" style={{ background: C.cardSoft }}>
              <m.Icon size={15} style={{ color: C.accent }} aria-hidden="true" />
              <div
                className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...body, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="text-[14px] font-semibold" style={{ ...body, color: C.ink }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="c248-rise p-5" style={{ ...cardStyle(), ...stagger(2) }}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: "#e5f4ec", color: C.green }}
              aria-hidden="true"
            >
              <Plus size={13} strokeWidth={2.8} />
            </span>
            <span className="text-[13px] font-bold" style={{ ...display, color: C.ink }}>
              Waarom deze match
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...body, color: C.inkSoft }}
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
        <div className="c248-rise p-5" style={{ ...cardStyle(), ...stagger(3) }}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: "#fbf1de", color: C.amber }}
              aria-hidden="true"
            >
              <Minus size={13} strokeWidth={2.8} />
            </span>
            <span className="text-[13px] font-bold" style={{ ...display, color: C.ink }}>
              Let op
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...body, color: C.inkSoft }}
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

      <div className="c248-rise mt-4 flex flex-wrap items-center gap-3" style={stagger(4)}>
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...body, background: applied ? C.green : C.accent }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </button>
        {applied && (
          <span className="text-[12.5px]" style={{ ...body, color: C.muted }}>
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
    <div>
      <ScreenHead
        kicker="Vertrouwen"
        title="Verificatie"
        sub="Je credentials en documenten, transparant en verifieerbaar."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c, i) => {
            const done = checked.has(c.naam);
            return (
              <div
                key={c.naam}
                className="c248-rise flex items-center gap-3 p-4"
                style={{ ...cardStyle(), ...stagger(i + 1) }}
              >
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
                  style={{
                    border: `1.5px solid ${done ? C.accent : C.lineStrong}`,
                    background: done ? C.accent : "transparent",
                    color: "#fff",
                  }}
                >
                  {done && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ ...body, color: C.ink }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...body, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <StatusChip status={c.status} />
              </div>
            );
          })}
        </div>

        <div className="c248-rise" style={stagger(5)}>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[15px] font-bold"
              style={{ ...display, color: C.ink }}
            >
              <FileText
                size={17}
                strokeWidth={2.2}
                style={{ color: C.accent }}
                aria-hidden="true"
              />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className="flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
              style={{ background: C.cardSoft, color: C.accent }}
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
                className="rounded-full px-3 py-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
                style={{
                  ...body,
                  color: feedState === s ? "#fff" : C.muted,
                  background: feedState === s ? C.accent : C.cardSoft,
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
                    style={{ background: C.cardSoft }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: C.cardSoft }}
                  />
                </li>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <div
              className="flex flex-col items-center gap-2 px-4 py-8 text-center"
              style={cardStyle()}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "#fbe6ec", color: C.red }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-bold" style={{ ...display, color: C.ink }}>
                Laden mislukt
              </div>
              <p className="text-[12px]" style={{ ...body, color: C.muted }}>
                Verbinding met de documentenkluis verbroken.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className="mt-1 rounded-full px-4 py-2 text-[12px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ ...body, background: C.accent }}
              >
                Opnieuw proberen
              </button>
            </div>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <li key={d.naam} className="flex items-center gap-3 p-3" style={cardStyle()}>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold"
                    style={{ ...body, background: C.cardSoft, color: C.accent }}
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
                    <div className="text-[11px] tabular-nums" style={{ ...body, color: C.muted }}>
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
    <div>
      <ScreenHead kicker="Wachtrij" title="Volgende acties" />

      {openCount === 0 ? (
        <div
          className="c248-rise flex flex-col items-center gap-3 px-6 py-16 text-center"
          style={{ ...cardStyle(), ...stagger(1) }}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "#e5f4ec", color: C.green }}
            aria-hidden="true"
          >
            <Check size={28} strokeWidth={2.4} />
          </span>
          <h3 className="text-[18px] font-bold" style={{ ...display, color: C.ink }}>
            Alles afgerond
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...body, color: C.muted }}>
            De wachtrij is leeg. Je bent helemaal bij.
          </p>
        </div>
      ) : (
        <>
          <div
            className="c248-rise mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2"
            style={{ background: C.accentSoft, ...stagger(1) }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold text-white"
              style={{ ...body, background: C.accent }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[13px] font-semibold" style={{ ...body, color: C.accent }}>
              {openCount} openstaande {openCount === 1 ? "actie" : "acties"}
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              return (
                <li
                  key={a.titel}
                  className="c248-rise flex items-start gap-4 p-5"
                  style={{ ...cardStyle(), ...stagger(i + 2) }}
                >
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
                    style={{
                      border: `1.5px solid ${isDone ? C.green : C.lineStrong}`,
                      background: isDone ? C.green : "transparent",
                      color: "#fff",
                    }}
                  >
                    {isDone && <Check size={16} strokeWidth={3} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[15px] font-semibold leading-snug"
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
                      style={{ ...body, color: C.muted, opacity: isDone ? 0.55 : 1 }}
                    >
                      {a.detail}
                    </p>
                    {!isDone && (
                      <span
                        className="mt-2.5 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                        style={{
                          ...body,
                          color: a.urgentie === "warning" ? C.amber : C.accent,
                          background: a.urgentie === "warning" ? "#fbf1de" : C.accentSoft,
                        }}
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
        </>
      )}
    </div>
  );
}

function Facturen() {
  const badgeTone = (status: string): { fg: string; bg: string } =>
    status === "Betaald"
      ? { fg: C.green, bg: "#e5f4ec" }
      : status === "Openstaand"
        ? { fg: C.amber, bg: "#fbf1de" }
        : { fg: C.muted, bg: C.cardSoft };
  return (
    <div>
      <ScreenHead kicker="Financiën" title="Facturen" />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald deze maand", value: "€ 5.552", tone: C.green },
          { label: "Openstaand", value: "€ 1.350", tone: C.amber },
          { label: "Concept", value: "€ 880", tone: C.muted },
        ].map((s, i) => (
          <div
            key={s.label}
            className="c248-rise p-4"
            style={{ ...cardStyle(), ...stagger(i + 1) }}
          >
            <div className="text-[11px] font-medium" style={{ ...body, color: C.muted }}>
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

      <div className="c248-rise overflow-hidden p-1.5" style={{ ...cardStyle(), ...stagger(4) }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
                    style={{ ...body, color: C.muted }}
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
                    className="transition-colors hover:bg-[#f7f8fb]"
                    style={{ borderBottom: `1px solid ${C.line}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12.5px] font-semibold tabular-nums"
                      style={{ ...body, color: C.accent }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3 text-[13px]" style={{ ...body, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-3 text-[12.5px] tabular-nums"
                      style={{ ...body, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3 text-[13px] font-semibold tabular-nums"
                      style={{ ...body, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{ ...body, color: t.fg, background: t.bg }}
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

export function Concept248() {
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
      style={{ ...body, color: C.ink, background: C.paper }}
    >
      {/* Local styles: staggered entrance keyframes, delay via --c248-i. Reduced-motion => no animation. */}
      <style>{`
        @keyframes c248-rise {
          0% { opacity: 0; transform: translateY(10px) scale(0.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .c248-rise {
          animation: c248-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: calc(var(--c248-i, 0) * 55ms);
        }
        @media (prefers-reduced-motion: reduce) {
          .c248-rise { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
              style={{ background: C.accent }}
              aria-hidden="true"
            >
              <Sparkles size={20} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[19px] font-bold tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Choreografie
              </div>
              <div
                className="text-[11px] font-medium uppercase tracking-[0.2em]"
                style={{ ...body, color: C.muted }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...body, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...body, color: C.green }}
              >
                <BadgeCheck size={12} strokeWidth={2.4} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full text-[14px] font-bold"
              style={{ ...body, background: C.accentSoft, color: C.accent }}
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
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
                style={{
                  ...body,
                  color: on ? "#fff" : C.inkSoft,
                  background: on ? C.accent : C.card,
                  border: `1px solid ${on ? C.accent : C.line}`,
                }}
              >
                <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
                {s.label}
              </button>
            );
          })}
        </nav>

        {/* key={screen} remounts the section so the stagger choreography replays on every navigation. */}
        <main className="flex-1" key={screen}>
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
          style={{ ...body, borderColor: C.line, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare
              size={12}
              strokeWidth={2.2}
              style={{ color: C.accent }}
              aria-hidden="true"
            />
            {BERICHTEN.filter((b) => b.ongelezen).length} ongelezen ·{" "}
            <Bell size={11} strokeWidth={2.2} className="inline" aria-hidden="true" />{" "}
            {ACTIES.length} acties
          </span>
          <span>Beweging met bedoeling</span>
        </footer>
      </div>
    </div>
  );
}
