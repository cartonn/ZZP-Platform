"use client";

// Concept 250 — "Duiding" · Data-journalistiek / verklarende infographic.
// Signatuur: data wordt UITGELEGD, niet alleen getoond. Geannoteerde grafieken met
// bijschriften en label-annotaties, redactionele duiding náást de cijfers, en de match-
// redenen als heldere datastory ("waarom deze match"). Nette staafjes/lijnen/sparklines
// met as-labels en korte captions. Ingetogen redactioneel palet: inkt-zwart op warm wit,
// één signaalkleur (vermiljoen) voor accenten in grafieken. Strak kolomraster, hoge
// informatiedichtheid maar rustig. Fonts: Newsreader (koppen) + Inter (body/cijfers, tabular).

import { useState } from "react";
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
  CornerDownRight,
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

// Editorial ink-on-warm-white palette, single vermilion signal color for chart accents.
const C = {
  paper: "#faf7f2",
  card: "#ffffff",
  cardSoft: "#f2eee6",
  line: "#e2dccf",
  lineStrong: "#cfc7b6",
  grid: "#ece7dc",
  ink: "#1c1a17",
  inkSoft: "#4a453d",
  muted: "#787162",
  faint: "#9c9483",
  signal: "#d9420f", // vermilion signal color
  signalSoft: "#fbe6dd",
  green: "#2f6b3f",
  amber: "#8a5a12",
  red: "#b02a1f",
};

const display = { fontFamily: "var(--font-lab-newsreader)" };
const bodyFont = { fontFamily: "var(--font-lab-inter)" };

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

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; fg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.inkSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, fg: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.red };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, fg } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[11px] font-semibold"
      style={{ ...bodyFont, color: fg, border: `1px solid ${fg}`, background: C.card }}
    >
      <Icon size={11} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

// Kicker: small caps editorial label.
function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10.5px] font-bold uppercase tracking-[0.2em]"
      style={{ ...bodyFont, color: C.signal }}
    >
      {children}
    </div>
  );
}

function cardStyle() {
  return { background: C.card, border: `1px solid ${C.line}`, borderRadius: 8 };
}

// Annotated line chart with axis labels + a callout on the final point.
function AnnotatedLine({ data, caption, unit }: { data: number[]; caption: string; unit: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const W = 100;
  const H = 46;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / span) * (H - 8) - 4;
    return { x, y, v };
  });
  const path = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-14 w-full"
        role="img"
        aria-label={caption}
      >
        {/* baseline grid */}
        <line
          x1="0"
          y1={H - 4}
          x2={W}
          y2={H - 4}
          stroke={C.grid}
          strokeWidth={0.6}
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points={path}
          fill="none"
          stroke={C.signal}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {last && (
          <circle
            cx={last.x}
            cy={last.y}
            r={1.8}
            fill={C.signal}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      <figcaption
        className="mt-1.5 flex items-baseline justify-between gap-2 text-[10.5px]"
        style={{ ...bodyFont, color: C.muted }}
      >
        <span className="inline-flex items-center gap-1">
          <CornerDownRight size={10} aria-hidden="true" />
          {caption}
        </span>
        <span className="tabular-nums">{unit}</span>
      </figcaption>
    </figure>
  );
}

function ScreenHead({
  kicker,
  title,
  standfirst,
}: {
  kicker: string;
  title: string;
  standfirst?: string;
}) {
  return (
    <div className="mb-6 border-b pb-5" style={{ borderColor: C.lineStrong }}>
      <Kicker>{kicker}</Kicker>
      <h1
        className="mt-1.5 text-[30px] font-semibold leading-[1.05] tracking-tight sm:text-[36px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {standfirst && (
        <p
          className="mt-2.5 max-w-2xl text-[14.5px] leading-relaxed"
          style={{ ...display, color: C.inkSoft }}
        >
          {standfirst}
        </p>
      )}
    </div>
  );
}

// ---- Screens ---------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  return (
    <div>
      <ScreenHead
        kicker="Weekcijfers · editie 26"
        title="Je week in cijfers, geduid"
        standfirst="Vier indicatoren vertellen samen één verhaal: je matchkwaliteit stijgt en je omzet trekt aan. Alleen je te factureren bedrag daalt — dat is een teken om twee facturen op te volgen."
      />

      <div
        className="mb-8 grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4"
        style={{ background: C.line }}
      >
        {KPIS.map((k) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <div key={k.label} className="p-4" style={{ background: C.card }}>
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ ...bodyFont, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                  style={{ ...bodyFont, color: k.up ? C.green : C.signal }}
                >
                  <Trend size={12} strokeWidth={2.4} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-1 text-[30px] font-semibold tabular-nums leading-none"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-3">
                <AnnotatedLine data={k.spark} caption="7 weken" unit={`nu ${k.value}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Kicker>Hoofdverhaal · beste match</Kicker>
          <button
            onClick={onOpen}
            className="group mt-3 flex w-full flex-col gap-4 p-5 text-left transition-colors hover:border-[color:var(--c250-signal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9420f] sm:flex-row sm:items-start"
            style={{ ...cardStyle(), ["--c250-signal" as string]: C.signal }}
          >
            <div className="flex shrink-0 items-center gap-3">
              <MatchDial value={top.match} />
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="text-[19px] font-semibold leading-tight"
                style={{ ...display, color: C.ink }}
              >
                {top.titel}
              </div>
              <div className="mt-0.5 text-[13px]" style={{ ...bodyFont, color: C.muted }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <p
                className="mt-2.5 text-[13px] leading-relaxed"
                style={{ ...bodyFont, color: C.inkSoft }}
              >
                Deze match scoort hoog doordat drie geverifieerde factoren samenvallen. Eén
                aandachtspunt weegt licht mee.
              </p>
              <span
                className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold"
                style={{ ...bodyFont, color: C.signal }}
              >
                Lees de volledige duiding
                <ArrowRight
                  size={13}
                  strokeWidth={2.4}
                  className="transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </div>
          </button>

          <div className="mt-6">
            <Kicker>Overige matches</Kicker>
            <ul className="mt-3 divide-y" style={{ borderColor: C.line }}>
              {OPDRACHTEN.slice(1).map((o) => (
                <li key={o.id} className="flex items-center gap-4 py-3.5">
                  <span
                    className="w-9 shrink-0 text-[17px] font-semibold tabular-nums"
                    style={{ ...display, color: C.signal }}
                  >
                    {o.match}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[14px] font-semibold"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div className="text-[12px]" style={{ ...bodyFont, color: C.muted }}>
                      {o.opdrachtgever} · {o.plaats}
                    </div>
                  </div>
                  <span
                    className="shrink-0 text-[12.5px] font-medium tabular-nums"
                    style={{ ...bodyFont, color: C.inkSoft }}
                  >
                    {o.tarief}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="lg:col-span-4">
          <div className="border-l pl-6" style={{ borderColor: C.lineStrong }}>
            <Kicker>In de kantlijn</Kicker>
            <h2
              className="mt-2 text-[17px] font-semibold leading-snug"
              style={{ ...display, color: C.ink }}
            >
              Wat vraagt aandacht
            </h2>
            <ul className="mt-4 space-y-4">
              {ACTIES.map((a, i) => (
                <li key={a.titel} className="flex gap-3">
                  <span
                    className="text-[13px] font-bold tabular-nums"
                    style={{ ...bodyFont, color: C.signal }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div
                      className="text-[13.5px] font-semibold leading-snug"
                      style={{ ...bodyFont, color: C.ink }}
                    >
                      {a.titel}
                    </div>
                    <p
                      className="mt-0.5 text-[12px] leading-relaxed"
                      style={{ ...bodyFont, color: C.muted }}
                    >
                      {a.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Circular match dial with a readable percentage — an infographic centerpiece.
function MatchDial({ value }: { value: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div className="relative h-16 w-16 shrink-0" aria-hidden="true">
      <svg viewBox="0 0 48 48" className="h-16 w-16 -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke={C.grid} strokeWidth={4} />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={C.signal}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span
          className="text-[16px] font-semibold tabular-nums"
          style={{ ...display, color: C.ink }}
        >
          {value}
        </span>
        <span
          className="text-[7px] font-bold uppercase tracking-wider"
          style={{ ...bodyFont, color: C.muted }}
        >
          match
        </span>
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
        kicker="Marktplaats · geordend op relevantie"
        title="Open opdrachten"
        standfirst="De matchscore is geen black box: elke opdracht toont hoeveel geverifieerde factoren meewegen."
      />

      <div
        className="mb-5 flex items-center gap-2 border px-4 py-2.5"
        style={{ borderColor: C.lineStrong, borderRadius: 8, background: C.card }}
      >
        <Search size={17} className="shrink-0" style={{ color: C.signal }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[14px] outline-none placeholder:opacity-60"
          style={{ ...bodyFont, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="rounded-[4px] px-2.5 py-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9420f]"
            style={{ ...bodyFont, color: C.signal, border: `1px solid ${C.signal}` }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 border px-6 py-14 text-center"
          style={{ borderColor: C.line, borderRadius: 8, background: C.card }}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.signalSoft, color: C.signal }}
            aria-hidden="true"
          >
            <Inbox size={26} strokeWidth={2} />
          </span>
          <h3 className="text-[19px] font-semibold" style={{ ...display, color: C.ink }}>
            Geen resultaten
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...bodyFont, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Pas de zoekterm aan of wis het filter.
          </p>
          <button
            onClick={() => setQuery("")}
            className="mt-1 rounded-[4px] px-4 py-2 text-[13px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...bodyFont, background: C.signal }}
          >
            Filter wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            const plus = o.redenen.plus.length;
            const min = o.redenen.min.length;
            const total = plus + min || 1;
            return (
              <article key={o.id} className="flex h-full flex-col p-5" style={cardStyle()}>
                <div className="flex items-start gap-4">
                  <MatchDial value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3
                          className="text-[16.5px] font-semibold leading-tight"
                          style={{ ...display, color: C.ink }}
                        >
                          {o.titel}
                        </h3>
                        <div
                          className="mt-0.5 text-[12.5px]"
                          style={{ ...bodyFont, color: C.muted }}
                        >
                          {o.opdrachtgever}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSave(o.id)}
                        aria-pressed={isSaved}
                        aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9420f]"
                        style={{
                          border: `1px solid ${isSaved ? C.signal : C.line}`,
                          color: isSaved ? C.signal : C.muted,
                        }}
                      >
                        {isSaved ? (
                          <BookmarkCheck size={15} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Bookmark size={15} strokeWidth={2} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Duiding-bar: verhouding pluspunten vs. aandachtspunten */}
                <div className="mt-4">
                  <div
                    className="flex h-2 w-full overflow-hidden rounded-full"
                    style={{ background: C.cardSoft }}
                    aria-hidden="true"
                  >
                    <span style={{ width: `${(plus / total) * 100}%`, background: C.green }} />
                    <span style={{ width: `${(min / total) * 100}%`, background: C.amber }} />
                  </div>
                  <div
                    className="mt-1.5 flex items-center justify-between text-[11px]"
                    style={{ ...bodyFont, color: C.muted }}
                  >
                    <span className="tabular-nums">
                      {plus} sterk · {min} let op
                    </span>
                    <span>waarom deze score</span>
                  </div>
                </div>

                <dl
                  className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]"
                  style={{ ...bodyFont, color: C.inkSoft }}
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
                  className="group mt-4 inline-flex items-center justify-center gap-1.5 rounded-[4px] py-2.5 text-[13px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ ...bodyFont, background: C.ink }}
                >
                  Lees de duiding
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
  const plus = opdracht.redenen.plus.length;
  const min = opdracht.redenen.min.length;
  const total = plus + min || 1;
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9420f]"
        style={{ ...bodyFont, color: C.inkSoft, border: `1px solid ${C.line}` }}
      >
        <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
        Terug naar marktplaats
      </button>

      <div className="border-b pb-6" style={{ borderColor: C.lineStrong }}>
        <Kicker>Match-analyse · {opdracht.id}</Kicker>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <MatchDial value={opdracht.match} />
            <div>
              <h1
                className="text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]"
                style={{ ...display, color: C.ink }}
              >
                {opdracht.titel}
              </h1>
              <div className="mt-1 text-[13.5px]" style={{ ...bodyFont, color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <button
            onClick={() => toggleSave(opdracht.id)}
            aria-pressed={isSaved}
            className="inline-flex items-center gap-1.5 rounded-[4px] px-3 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9420f]"
            style={{
              ...bodyFont,
              color: isSaved ? C.signal : C.inkSoft,
              border: `1px solid ${isSaved ? C.signal : C.line}`,
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
      </div>

      <div
        className="grid grid-cols-2 gap-px border-b sm:grid-cols-4"
        style={{ background: C.line, borderColor: C.line }}
      >
        {[
          { label: "Tarief", value: opdracht.tarief },
          { label: "Inzet", value: opdracht.uren },
          { label: "Start", value: opdracht.start },
          { label: "Match", value: `${opdracht.match}%` },
        ].map((m) => (
          <div key={m.label} className="p-4" style={{ background: C.paper }}>
            <div
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ ...bodyFont, color: C.muted }}
            >
              {m.label}
            </div>
            <div
              className="mt-1 text-[18px] font-semibold tabular-nums"
              style={{ ...display, color: C.ink }}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-8">
        <Kicker>De datastory · waarom deze match</Kicker>
        <p
          className="mt-2 max-w-2xl text-[14.5px] leading-relaxed"
          style={{ ...display, color: C.inkSoft }}
        >
          De score van {opdracht.match}% ontstaat uit {total} gewogen factoren. Hieronder leest u
          welke het zwaarst meewegen — de pluspunten in het groen, de aandachtspunten in het amber.
        </p>

        {/* Stacked weight bar with annotation labels */}
        <div className="mt-5">
          <div
            className="flex h-3 w-full overflow-hidden rounded-full"
            style={{ background: C.cardSoft }}
            aria-hidden="true"
          >
            <span style={{ width: `${(plus / total) * 100}%`, background: C.green }} />
            <span style={{ width: `${(min / total) * 100}%`, background: C.amber }} />
          </div>
          <div
            className="mt-1.5 flex justify-between text-[11px] font-medium tabular-nums"
            style={{ ...bodyFont, color: C.muted }}
          >
            <span>{plus} pluspunten</span>
            <span>
              {min} aandachtspunt{min === 1 ? "" : "en"}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <div className="mb-3 inline-flex items-center gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: "#e2efe4", color: C.green }}
                aria-hidden="true"
              >
                <Plus size={13} strokeWidth={2.8} />
              </span>
              <span
                className="text-[13px] font-bold uppercase tracking-wide"
                style={{ ...bodyFont, color: C.green }}
              >
                Pluspunten
              </span>
            </div>
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r, i) => (
                <li
                  key={r}
                  className="flex gap-3 border-l-2 pl-3 text-[13.5px]"
                  style={{ ...bodyFont, color: C.ink, borderColor: C.green }}
                >
                  <span
                    className="shrink-0 text-[12px] font-bold tabular-nums"
                    style={{ color: C.green }}
                  >
                    +{i + 1}
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-3 inline-flex items-center gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: "#f4ead2", color: C.amber }}
                aria-hidden="true"
              >
                <Minus size={13} strokeWidth={2.8} />
              </span>
              <span
                className="text-[13px] font-bold uppercase tracking-wide"
                style={{ ...bodyFont, color: C.amber }}
              >
                Aandachtspunten
              </span>
            </div>
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex gap-3 border-l-2 pl-3 text-[13.5px]"
                  style={{ ...bodyFont, color: C.inkSoft, borderColor: C.amber }}
                >
                  <TriangleAlert
                    size={15}
                    strokeWidth={2.2}
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

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setApplied((v) => !v)}
            aria-pressed={applied}
            className="inline-flex items-center gap-2 rounded-[4px] px-6 py-3 text-[14px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...bodyFont, background: applied ? C.green : C.signal }}
          >
            {applied ? (
              <Check size={17} strokeWidth={2.6} aria-hidden="true" />
            ) : (
              <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
            )}
            {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
          </button>
          {applied && (
            <span className="text-[12.5px]" style={{ ...bodyFont, color: C.muted }}>
              Gemiddelde reactietijd opdrachtgever: 6 uur.
            </span>
          )}
        </div>
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
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div>
      <ScreenHead
        kicker="Vertrouwensdossier"
        title="Verificatie, cijfermatig"
        standfirst={`${verified} van de ${CREDENTIALS.length} credentials zijn volledig geverifieerd. Eén vraagt actie — daarmee blijft je vertrouwensniveau op peil.`}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-4">
            <span
              className="text-[34px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {verified}/{CREDENTIALS.length}
            </span>
            <div
              className="h-3 flex-1 overflow-hidden rounded-full"
              style={{ background: C.cardSoft }}
              aria-hidden="true"
            >
              <span
                className="block h-full"
                style={{ width: `${(verified / CREDENTIALS.length) * 100}%`, background: C.green }}
              />
            </div>
          </div>
          <ul className="divide-y" style={{ borderColor: C.line }}>
            {CREDENTIALS.map((c, i) => {
              const done = checked.has(c.naam);
              return (
                <li key={c.naam} className="flex items-center gap-4 py-3.5">
                  <span
                    className="w-6 shrink-0 text-[12px] font-bold tabular-nums"
                    style={{ ...bodyFont, color: C.faint }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9420f]"
                    style={{
                      border: `1.5px solid ${done ? C.signal : C.lineStrong}`,
                      background: done ? C.signal : "transparent",
                      color: "#fff",
                    }}
                  >
                    {done && <Check size={14} strokeWidth={3} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[14px] font-semibold"
                      style={{ ...bodyFont, color: C.ink }}
                    >
                      {c.naam}
                    </div>
                    <div className="text-[12px]" style={{ ...bodyFont, color: C.muted }}>
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
            <span
              className="inline-flex items-center gap-2 text-[15px] font-semibold"
              style={{ ...display, color: C.ink }}
            >
              <FileText
                size={17}
                strokeWidth={2.2}
                style={{ color: C.signal }}
                aria-hidden="true"
              />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className="flex h-8 w-8 items-center justify-center rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9420f]"
              style={{ border: `1px solid ${C.line}`, color: C.signal }}
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
                className="rounded-[4px] px-2.5 py-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9420f]"
                style={{
                  ...bodyFont,
                  color: feedState === s ? "#fff" : C.muted,
                  background: feedState === s ? C.signal : "transparent",
                  border: `1px solid ${feedState === s ? C.signal : C.line}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="p-3" style={cardStyle()}>
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
                style={{ background: C.signalSoft, color: C.signal }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-semibold" style={{ ...display, color: C.ink }}>
                Laden mislukt
              </div>
              <p className="text-[12px]" style={{ ...bodyFont, color: C.muted }}>
                Verbinding met de documentenkluis verbroken.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className="mt-1 rounded-[4px] px-4 py-2 text-[12px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ ...bodyFont, background: C.signal }}
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
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] text-[9px] font-bold"
                    style={{ ...bodyFont, border: `1px solid ${C.line}`, color: C.signal }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12.5px] font-semibold"
                      style={{ ...bodyFont, color: C.ink }}
                    >
                      {d.naam}
                    </div>
                    <div
                      className="text-[11px] tabular-nums"
                      style={{ ...bodyFont, color: C.muted }}
                    >
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
      <ScreenHead
        kicker="Redactionele agenda"
        title="Volgende acties"
        standfirst="Op volgorde van urgentie. Wat je afvinkt, verdwijnt uit de agenda."
      />

      {openCount === 0 ? (
        <div
          className="flex flex-col items-center gap-3 border px-6 py-16 text-center"
          style={{ borderColor: C.line, borderRadius: 8, background: C.card }}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "#e2efe4", color: C.green }}
            aria-hidden="true"
          >
            <Check size={28} strokeWidth={2.4} />
          </span>
          <h3 className="text-[20px] font-semibold" style={{ ...display, color: C.ink }}>
            Agenda leeg
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...bodyFont, color: C.muted }}>
            Alle acties afgehandeld. Niets vraagt nu je aandacht.
          </p>
        </div>
      ) : (
        <>
          <div
            className="mb-5 inline-flex items-center gap-2 border px-4 py-2"
            style={{ borderColor: C.lineStrong, borderRadius: 6 }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold text-white"
              style={{ ...bodyFont, background: C.signal }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[13px] font-semibold" style={{ ...bodyFont, color: C.ink }}>
              {openCount} openstaande {openCount === 1 ? "actie" : "acties"}
            </span>
          </div>

          <ul className="divide-y" style={{ borderColor: C.line }}>
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              return (
                <li key={a.titel} className="flex items-start gap-4 py-5">
                  <span
                    className="w-8 shrink-0 pt-0.5 text-[20px] font-semibold tabular-nums"
                    style={{ ...display, color: C.faint }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9420f]"
                    style={{
                      border: `1.5px solid ${isDone ? C.green : C.lineStrong}`,
                      background: isDone ? C.green : "transparent",
                      color: "#fff",
                    }}
                  >
                    {isDone && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-[3px] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide"
                        style={{
                          ...bodyFont,
                          color: a.urgentie === "warning" ? C.amber : C.inkSoft,
                          border: `1px solid ${a.urgentie === "warning" ? C.amber : C.line}`,
                        }}
                      >
                        {a.urgentie === "warning" ? "urgent" : "info"}
                      </span>
                      <span
                        className="text-[15px] font-semibold leading-snug"
                        style={{
                          ...display,
                          color: C.ink,
                          textDecoration: isDone ? "line-through" : "none",
                          opacity: isDone ? 0.5 : 1,
                        }}
                      >
                        {a.titel}
                      </span>
                    </div>
                    <p
                      className="mt-1 text-[13px] leading-relaxed"
                      style={{ ...bodyFont, color: C.muted, opacity: isDone ? 0.5 : 1 }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  {!isDone && (
                    <span
                      className="hidden shrink-0 self-center text-[12.5px] font-semibold sm:inline-flex sm:items-center sm:gap-1"
                      style={{ ...bodyFont, color: C.signal }}
                    >
                      {a.cta}
                      <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                    </span>
                  )}
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
  const badgeMeta = (status: string): { fg: string; Icon: LucideIcon } =>
    status === "Betaald"
      ? { fg: C.green, Icon: Check }
      : status === "Openstaand"
        ? { fg: C.amber, Icon: Clock }
        : { fg: C.muted, Icon: FileText };
  return (
    <div>
      <ScreenHead
        kicker="Financieel overzicht · maand juni"
        title="Facturen"
        standfirst="Betaald, openstaand en concept — in één oogopslag met de bedragen op de tabellijn uitgelijnd."
      />

      <div className="mb-6 grid grid-cols-1 gap-px sm:grid-cols-3" style={{ background: C.line }}>
        {[
          { label: "Betaald deze maand", value: "€ 5.552", tone: C.green },
          { label: "Openstaand", value: "€ 1.350", tone: C.amber },
          { label: "Concept", value: "€ 880", tone: C.muted },
        ].map((s) => (
          <div key={s.label} className="p-4" style={{ background: C.card }}>
            <div
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ ...bodyFont, color: C.muted }}
            >
              {s.label}
            </div>
            <div
              className="mt-1 text-[26px] font-semibold tabular-nums"
              style={{ ...display, color: s.tone }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto border" style={{ borderColor: C.line, borderRadius: 8 }}>
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.lineStrong}`, background: C.paper }}>
              {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                <th
                  key={h}
                  scope="col"
                  className={`px-4 py-3 text-[10.5px] font-bold uppercase tracking-[0.14em] ${i === 3 ? "text-right" : ""}`}
                  style={{ ...bodyFont, color: C.muted }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const m = badgeMeta(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[#faf7f2]"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <td
                    className="px-4 py-3.5 text-[12.5px] font-semibold tabular-nums"
                    style={{ ...bodyFont, color: C.ink }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[13.5px]" style={{ ...display, color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...bodyFont, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-4 py-3.5 text-right text-[14px] font-semibold tabular-nums"
                    style={{ ...bodyFont, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold"
                      style={{ ...bodyFont, color: m.fg }}
                    >
                      <m.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
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

export function Concept250() {
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
      style={{ ...bodyFont, color: C.ink, background: C.paper }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-8 sm:py-8">
        <header
          className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b pb-5"
          style={{ borderColor: C.ink }}
        >
          <div>
            <div
              className="text-[24px] font-semibold leading-none tracking-tight"
              style={{ ...display, color: C.ink }}
            >
              Duiding
            </div>
            <div
              className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.24em]"
              style={{ ...bodyFont, color: C.signal }}
            >
              ZZP platform · data &amp; verhaal
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...bodyFont, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...bodyFont, color: C.green }}
              >
                <BadgeCheck size={12} strokeWidth={2.4} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full text-[14px] font-bold"
              style={{ ...bodyFont, border: `1.5px solid ${C.ink}`, color: C.ink }}
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
                className="inline-flex shrink-0 items-center gap-1.5 rounded-[4px] px-3.5 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9420f]"
                style={{
                  ...bodyFont,
                  color: on ? C.paper : C.inkSoft,
                  background: on ? C.ink : "transparent",
                  border: `1px solid ${on ? C.ink : C.line}`,
                }}
              >
                <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
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
          style={{ ...bodyFont, borderColor: C.lineStrong, color: C.muted }}
        >
          <span>
            {BERICHTEN.filter((b) => b.ongelezen).length} ongelezen berichten · {ACTIES.length}{" "}
            acties in de agenda
          </span>
          <span style={{ color: C.signal }}>Cijfers met context</span>
        </footer>
      </div>
    </div>
  );
}
