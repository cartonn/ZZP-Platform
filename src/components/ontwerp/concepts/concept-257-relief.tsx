"use client";

// Concept 257 — "Reliëf" · Braille & tactiele toegankelijkheid.
// Signatuur: een lichte, hoog-contrast, tactiele emboss-taal. Panelen lijken uit het
// oppervlak geduwd (reliëf via licht/schaduw op de randen), inputs zijn juist ingedrukt
// (debossed). Braille-stippatronen dienen als sectie-markers en status-motief.
//
// TOEGANKELIJKHEID-ALS-ESTHETIEK — NADRUKKELIJK GEEN low-contrast neumorfisme:
//  - Het reliëf zit ALLEEN in de randen/schaduw; alle TEKST blijft glashelder. Body-tekst
//    is #0b1220 / #334155 op lichte panelen (~#eef2f8) => WCAG AA/AAA-contrast.
//  - Status wordt NOOIT met kleur alleen aangeduid: altijd icoon + tekstlabel + braille-motief.
//  - Dikke focusringen (3px accent) en grote raakvlakken (>=44px) overal.
//  - Alle braille-stippen zijn PUUR DECORATIEF (aria-hidden); ze dragen geen betekenis over
//    die niet ook in tekst staat.
// Fonts: Manrope (koppen) + Inter (body). Accent #1d4ed8. Cijfers tabular-nums.

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
  TrendingUp,
  TrendingDown,
  Fingerprint,
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

// High-contrast, light tactile palette. All text tones below meet WCAG AA on the panels.
const C = {
  bg: "#e7ecf3",
  panel: "#eef2f8",
  panelSoft: "#e9eef5",
  ink: "#0b1220", // AAA on panel
  inkSoft: "#334155", // AA
  muted: "#475569", // AA
  faint: "#64748b", // decorative / large only
  line: "#c9d3e2",
  accent: "#1d4ed8",
  accentInk: "#1e3a8a", // AA-strong for text on soft accent
  accentSoft: "#dbe4fb",
  green: "#15803d",
  greenSoft: "#d6ead9",
  amber: "#b45309",
  amberSoft: "#f2e5cd",
  red: "#b91c1c",
  redSoft: "#f2d9d9",
  white: "#ffffff",
};

const heading = { fontFamily: "var(--font-lab-manrope)" };
const body = { fontFamily: "var(--font-lab-inter)" };

// Raised (embossed) surface: light highlight top-left, soft shadow bottom-right. A hairline
// border keeps the panel edge crisp so the relief never dilutes text legibility.
function raised(radius = 20): CSSProperties {
  return {
    background: C.panel,
    borderRadius: radius,
    border: `1px solid ${C.white}`,
    boxShadow: `-6px -6px 12px rgba(255,255,255,0.9), 7px 7px 16px rgba(15,23,42,0.14)`,
  };
}

// Debossed (engraved) surface for inputs, tracks and wells: shadow pressed inward.
function debossed(radius = 14): CSSProperties {
  return {
    background: C.panelSoft,
    borderRadius: radius,
    boxShadow: `inset 3px 3px 7px rgba(15,23,42,0.13), inset -3px -3px 7px rgba(255,255,255,0.9)`,
  };
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e7ecf3]";

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: LayoutDashboard,
};

// --- Braille motif (decorative only) ---------------------------------------
// A braille cell is 2 columns x 3 rows of dots. `dots` is a 6-length mask (top→bottom,
// left→right). Filled dots are raised in the accent tint; empty positions stay subtle.
function BrailleCell({
  dots,
  tone = C.accent,
  size = 5,
}: {
  dots: boolean[];
  tone?: string;
  size?: number;
}) {
  return (
    <span
      className="grid shrink-0 grid-cols-2 gap-[3px]"
      style={{ gridTemplateRows: "repeat(3, minmax(0,1fr))" }}
      aria-hidden="true"
    >
      {dots.map((on, i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            width: size,
            height: size,
            background: on ? tone : "transparent",
            boxShadow: on
              ? `1px 1px 1.5px rgba(15,23,42,0.35), -1px -1px 1.5px rgba(255,255,255,0.7)`
              : `inset 1px 1px 1.5px rgba(15,23,42,0.14), inset -1px -1px 1.5px rgba(255,255,255,0.85)`,
          }}
        />
      ))}
    </span>
  );
}

// A short decorative braille strip used as a section marker.
function BrailleStrip({ tone = C.accent }: { tone?: string }) {
  const cells = [
    [true, false, true, false, true, false],
    [true, true, false, true, false, true],
    [false, true, true, false, true, false],
  ];
  return (
    <span className="flex items-center gap-2" aria-hidden="true">
      {cells.map((c, i) => (
        <BrailleCell key={i} dots={c} tone={tone} />
      ))}
    </span>
  );
}

function SectionTitle({ title, tone = C.accent }: { title: string; tone?: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <BrailleStrip tone={tone} />
      <h2 className="text-[15px] font-bold tracking-tight" style={{ ...heading, color: C.ink }}>
        {title}
      </h2>
    </div>
  );
}

type StatusMeta = { label: string; Icon: LucideIcon; fg: string; bg: string; dots: boolean[] };

function statusMeta(s: CredStatus): StatusMeta {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: BadgeCheck,
        fg: C.green,
        bg: C.greenSoft,
        dots: [true, true, true, true, true, true],
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        fg: C.accentInk,
        bg: C.accentSoft,
        dots: [true, false, true, false, true, false],
      };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        Icon: TriangleAlert,
        fg: C.amber,
        bg: C.amberSoft,
        dots: [true, true, false, true, false, false],
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: XCircle,
        fg: C.red,
        bg: C.redSoft,
        dots: [false, true, false, true, false, true],
      };
  }
}

// Status is conveyed three ways: icon + text label + braille motif. Never colour alone.
function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, fg, bg, dots } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11.5px] font-bold"
      style={{ ...body, color: fg, background: bg, border: `1px solid ${C.white}` }}
    >
      <Icon size={13} strokeWidth={2.6} aria-hidden="true" />
      {label}
      <BrailleCell dots={dots} tone={fg} size={4} />
    </span>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / span) * 76 - 12;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <div className="mt-2 px-2 py-1.5" style={debossed(10)}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-7 w-full"
        aria-hidden="true"
      >
        <polyline
          points={pts}
          fill="none"
          stroke={C.accent}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

function ScreenHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <div className="mb-2">
        <BrailleStrip />
      </div>
      <h1
        className="text-[28px] font-extrabold leading-tight tracking-tight sm:text-[32px]"
        style={{ ...heading, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2 max-w-xl text-[14px] leading-relaxed"
          style={{ ...body, color: C.inkSoft }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  pressed,
}: {
  children: ReactNode;
  onClick: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={pressed}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-6 text-[14px] font-bold text-white transition-transform active:translate-y-px ${focusRing}`}
      style={{
        ...body,
        background: C.accent,
        boxShadow: `-3px -3px 8px rgba(255,255,255,0.35), 4px 4px 10px rgba(15,23,42,0.28)`,
      }}
    >
      {children}
    </button>
  );
}

// ---- Screens ---------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      <ScreenHead
        title={`Voelbaar overzicht, ${voornaam}`}
        sub="Alles wat telt staat in reliëf. Eén onderdeel vraagt vandaag je aandacht."
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <div key={k.label} className="p-4" style={raised(18)}>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11.5px] font-semibold" style={{ ...body, color: C.muted }}>
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                  style={{ ...body, color: k.up ? C.green : C.amber }}
                >
                  <Trend size={12} strokeWidth={2.6} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-1.5 text-[26px] font-extrabold tabular-nums leading-none"
                style={{ ...heading, color: C.ink }}
              >
                {k.value}
              </div>
              <Sparkline data={k.spark} />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle title="Best passende opdracht" />
          <button
            onClick={onOpen}
            className={`group flex w-full items-start gap-4 p-5 text-left transition-transform hover:-translate-y-0.5 ${focusRing}`}
            style={raised()}
          >
            <span
              className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl leading-none"
              style={{ ...debossed(16), color: C.accentInk }}
              aria-hidden="true"
            >
              <span className="text-[20px] font-extrabold tabular-nums" style={heading}>
                {top.match}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-wider">match</span>
            </span>
            <div className="min-w-0 flex-1">
              <div
                className="text-[17px] font-bold leading-tight"
                style={{ ...heading, color: C.ink }}
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
                    className="rounded-full px-3 py-1 text-[11px] font-semibold"
                    style={{ ...body, ...debossed(999), color: C.inkSoft }}
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

          <div className="mt-6">
            <SectionTitle title="Wat vraagt aandacht" tone={C.amber} />
            <ul className="space-y-2.5">
              {ACTIES.slice(0, 2).map((a) => (
                <li key={a.titel} className="flex items-start gap-3 p-4" style={raised(16)}>
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      ...debossed(12),
                      color: a.urgentie === "warning" ? C.amber : C.accentInk,
                    }}
                    aria-hidden="true"
                  >
                    {a.urgentie === "warning" ? (
                      <TriangleAlert size={18} strokeWidth={2.4} />
                    ) : (
                      <ArrowRight size={18} strokeWidth={2.4} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold" style={{ ...body, color: C.ink }}>
                      {a.titel}
                    </div>
                    <p className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.muted }}>
                      {a.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <SectionTitle title="Vertrouwensniveau" tone={C.green} />
          <div className="p-5" style={raised()}>
            <div className="flex items-center gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ ...debossed(14), color: C.green }}
                aria-hidden="true"
              >
                <Fingerprint size={24} strokeWidth={2.2} />
              </span>
              <div>
                <div
                  className="inline-flex items-center gap-2 text-[15px] font-bold"
                  style={{ ...heading, color: C.ink }}
                >
                  {PROFIEL.trust}
                  <BadgeCheck
                    size={15}
                    strokeWidth={2.6}
                    style={{ color: C.green }}
                    aria-hidden="true"
                  />
                </div>
                <div className="text-[12px]" style={{ ...body, color: C.muted }}>
                  {PROFIEL.rol}
                </div>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {CREDENTIALS.map((c) => (
                <li key={c.naam} className="flex items-center gap-2">
                  <BrailleCell
                    dots={statusMeta(c.status).dots}
                    tone={statusMeta(c.status).fg}
                    size={4}
                  />
                  <span
                    className="flex-1 truncate text-[12.5px] font-medium"
                    style={{ ...body, color: C.inkSoft }}
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
    <div>
      <ScreenHead
        title="Marktplaats in reliëf"
        sub="Elke match toont voelbaar waarom hij past — en waar je op moet letten."
      />

      <div className="mb-5 flex items-center gap-2.5 px-4 py-2.5" style={debossed(999)}>
        <Search size={17} className="shrink-0" style={{ color: C.accentInk }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[14px] outline-none placeholder:text-[#64748b]"
          style={{ ...body, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`rounded-full px-3 py-1 text-[11px] font-bold ${focusRing}`}
            style={{ ...body, color: C.accentInk, ...raised(999) }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center" style={raised()}>
          <span
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ ...debossed(18), color: C.accentInk }}
            aria-hidden="true"
          >
            <Inbox size={28} strokeWidth={2.2} />
          </span>
          <h3 className="text-[18px] font-bold" style={{ ...heading, color: C.ink }}>
            Niets gevonden
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...body, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <PrimaryButton onClick={() => setQuery("")}>Filter wissen</PrimaryButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <article key={o.id} className="flex h-full flex-col p-5" style={raised()}>
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl leading-none"
                    style={{ ...debossed(16), color: C.accentInk }}
                    aria-hidden="true"
                  >
                    <span className="text-[17px] font-extrabold tabular-nums" style={heading}>
                      {o.match}
                    </span>
                    <span className="text-[7.5px] font-bold uppercase tracking-wider">match</span>
                  </span>
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-11 w-11 items-center justify-center rounded-full transition-transform active:translate-y-px ${focusRing}`}
                    style={{
                      ...(isSaved ? raised(999) : debossed(999)),
                      color: isSaved ? C.accent : C.muted,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={17} strokeWidth={2.6} aria-hidden="true" />
                    ) : (
                      <Bookmark size={17} strokeWidth={2.2} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <h3
                  className="mt-3 text-[16.5px] font-bold leading-tight"
                  style={{ ...heading, color: C.ink }}
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
                  className={`group mt-4 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full text-[13px] font-bold text-white transition-transform active:translate-y-px ${focusRing}`}
                  style={{
                    ...body,
                    background: C.accent,
                    boxShadow: `-3px -3px 8px rgba(255,255,255,0.35), 4px 4px 10px rgba(15,23,42,0.28)`,
                  }}
                >
                  Bekijk opdracht
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
    <div>
      <button
        onClick={onBack}
        className={`mb-5 inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-4 text-[12px] font-bold ${focusRing}`}
        style={{ ...body, color: C.inkSoft, ...raised(999) }}
      >
        <ArrowLeft size={14} strokeWidth={2.6} aria-hidden="true" />
        Terug
      </button>

      <div className="p-6" style={raised()}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl leading-none"
              style={{ ...debossed(16), color: C.accentInk }}
              aria-hidden="true"
            >
              <span className="text-[20px] font-extrabold tabular-nums" style={heading}>
                {opdracht.match}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-wider">match</span>
            </span>
            <div>
              <h2
                className="text-[23px] font-extrabold leading-tight tracking-tight"
                style={{ ...heading, color: C.ink }}
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
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 text-[12px] font-bold ${focusRing}`}
            style={{
              ...body,
              color: isSaved ? C.accentInk : C.inkSoft,
              ...(isSaved ? raised(999) : debossed(999)),
            }}
          >
            {isSaved ? (
              <BookmarkCheck size={14} strokeWidth={2.6} aria-hidden="true" />
            ) : (
              <Bookmark size={14} strokeWidth={2.2} aria-hidden="true" />
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
            <div key={m.label} className="p-3" style={debossed(14)}>
              <m.Icon size={15} style={{ color: C.accentInk }} aria-hidden="true" />
              <div
                className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ ...body, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="text-[14px] font-bold" style={{ ...body, color: C.ink }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="p-5" style={raised()}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ ...debossed(999), color: C.green }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={3} />
            </span>
            <span className="text-[14px] font-bold" style={{ ...heading, color: C.ink }}>
              Waarom deze past
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
                  strokeWidth={3}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5" style={raised()}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ ...debossed(999), color: C.amber }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={3} />
            </span>
            <span className="text-[14px] font-bold" style={{ ...heading, color: C.ink }}>
              Even op letten
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
                  strokeWidth={2.6}
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

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <PrimaryButton onClick={() => setApplied((v) => !v)} pressed={applied}>
          {applied ? (
            <Check size={17} strokeWidth={3} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.6} aria-hidden="true" />
          )}
          {applied ? "Je reactie is verstuurd" : "Reageer op opdracht"}
        </PrimaryButton>
        {applied && (
          <span className="text-[12.5px]" style={{ ...body, color: C.muted }}>
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
        title="Documenten in reliëf"
        sub="Je gevoelige papieren blijven privé. Status altijd met icoon, tekst én braille-motief."
      />

      <div className="mb-6 flex items-center gap-4 p-5" style={raised()}>
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{ ...debossed(14), color: C.green }}
          aria-hidden="true"
        >
          <ShieldCheck size={24} strokeWidth={2.2} />
        </span>
        <div>
          <div className="text-[15px] font-bold" style={{ ...heading, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[13px]" style={{ ...body, color: C.inkSoft }}>
            Versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            return (
              <div key={c.naam} className="flex items-center gap-3 p-4" style={raised(16)}>
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform active:translate-y-px ${focusRing}`}
                  style={{
                    ...(done ? {} : debossed(12)),
                    background: done ? C.accent : undefined,
                    color: "#fff",
                    boxShadow: done
                      ? `-2px -2px 6px rgba(255,255,255,0.4), 3px 3px 8px rgba(15,23,42,0.28)`
                      : undefined,
                    borderRadius: 12,
                  }}
                >
                  {done && <Check size={18} strokeWidth={3} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold" style={{ ...body, color: C.ink }}>
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

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[15px] font-bold"
              style={{ ...heading, color: C.ink }}
            >
              <FileText
                size={17}
                strokeWidth={2.4}
                style={{ color: C.accentInk }}
                aria-hidden="true"
              />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-11 w-11 items-center justify-center rounded-full ${focusRing}`}
              style={{ ...raised(999), color: C.accentInk }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={15} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className={`min-h-[36px] rounded-full px-3 text-[11px] font-bold ${focusRing}`}
                style={{
                  ...body,
                  color: feedState === s ? "#fff" : C.inkSoft,
                  background: feedState === s ? C.accent : undefined,
                  ...(feedState === s ? {} : debossed(999)),
                  boxShadow:
                    feedState === s
                      ? `-2px -2px 6px rgba(255,255,255,0.35), 3px 3px 8px rgba(15,23,42,0.25)`
                      : undefined,
                  borderRadius: 999,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="p-3.5" style={raised(14)}>
                  <div className="h-3 w-2/3 animate-pulse rounded-full" style={debossed(999)} />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse rounded-full"
                    style={debossed(999)}
                  />
                </li>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <div
              className="flex flex-col items-center gap-2 px-4 py-8 text-center"
              style={raised()}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ ...debossed(14), color: C.red }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2.2} />
              </span>
              <div className="text-[15px] font-bold" style={{ ...heading, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...body, color: C.muted }}>
                We konden je documentenkluis niet bereiken.
              </p>
              <PrimaryButton onClick={() => setFeedState("ok")}>Opnieuw proberen</PrimaryButton>
            </div>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <li key={d.naam} className="flex items-center gap-3 p-3" style={raised(14)}>
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[9px] font-bold"
                    style={{ ...debossed(12), color: C.accentInk }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12.5px] font-bold"
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
      <ScreenHead title="Wat vraagt vandaag je aandacht" />

      {openCount === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center" style={raised()}>
          <span
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ ...debossed(18), color: C.green }}
            aria-hidden="true"
          >
            <Check size={30} strokeWidth={2.6} />
          </span>
          <h3 className="text-[20px] font-bold" style={{ ...heading, color: C.ink }}>
            Je bent helemaal bij
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...body, color: C.muted }}>
            Niets meer te doen vandaag.
          </p>
        </div>
      ) : (
        <>
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2"
            style={raised(999)}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold text-white"
              style={{ ...body, background: C.accent }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[13px] font-bold" style={{ ...body, color: C.accentInk }}>
              {openCount} {openCount === 1 ? "punt" : "punten"} voor vandaag
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              return (
                <li key={a.titel} className="flex items-start gap-4 p-5" style={raised(16)}>
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform active:translate-y-px ${focusRing}`}
                    style={{
                      ...(isDone ? {} : debossed(12)),
                      background: isDone ? C.green : undefined,
                      color: "#fff",
                      boxShadow: isDone
                        ? `-2px -2px 6px rgba(255,255,255,0.4), 3px 3px 8px rgba(15,23,42,0.28)`
                        : undefined,
                      borderRadius: 12,
                    }}
                  >
                    {isDone && <Check size={18} strokeWidth={3} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[15px] font-bold leading-snug"
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
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold"
                        style={{
                          ...body,
                          ...debossed(999),
                          color: a.urgentie === "warning" ? C.amber : C.accentInk,
                        }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
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
      ? { fg: C.green, bg: C.greenSoft }
      : status === "Openstaand"
        ? { fg: C.amber, bg: C.amberSoft }
        : { fg: C.muted, bg: C.panelSoft };
  return (
    <div>
      <ScreenHead
        title="Facturen"
        sub="Overzichtelijk en zonder gedoe — zodat je weet waar je aan toe bent."
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald deze maand", value: "€ 5.552", tone: C.green },
          { label: "Openstaand", value: "€ 1.350", tone: C.amber },
          { label: "Concept", value: "€ 880", tone: C.faint },
        ].map((s) => (
          <div key={s.label} className="p-4" style={raised(16)}>
            <div className="text-[11.5px] font-semibold" style={{ ...body, color: C.muted }}>
              {s.label}
            </div>
            <div
              className="mt-1 text-[22px] font-extrabold tabular-nums"
              style={{ ...heading, color: s.tone }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden p-2" style={raised()}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em]"
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
                  <tr key={f.nr} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td
                      className="px-3 py-3 text-[12.5px] font-bold tabular-nums"
                      style={{ ...body, color: C.accentInk }}
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
                      className="px-3 py-3 text-[13px] font-bold tabular-nums"
                      style={{ ...body, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
                        style={{
                          ...body,
                          color: t.fg,
                          background: t.bg,
                          border: `1px solid ${C.white}`,
                        }}
                      >
                        {f.status === "Betaald" ? (
                          <Check size={11} strokeWidth={3} aria-hidden="true" />
                        ) : f.status === "Openstaand" ? (
                          <Clock size={11} strokeWidth={2.8} aria-hidden="true" />
                        ) : (
                          <FileText size={11} strokeWidth={2.8} aria-hidden="true" />
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

export function Concept257() {
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
      style={{ ...body, color: C.ink, background: C.bg }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ ...raised(16), color: C.accent }}
              aria-hidden="true"
            >
              <Fingerprint size={22} strokeWidth={2.4} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[20px] font-extrabold tracking-tight"
                style={{ ...heading, color: C.ink }}
              >
                Reliëf
              </div>
              <div
                className="text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{ ...body, color: C.muted }}
              >
                Tactiel · toegankelijk
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-bold" style={{ ...body, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px] font-semibold"
                style={{ ...body, color: C.green }}
              >
                <BadgeCheck size={12} strokeWidth={2.6} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-extrabold"
              style={{ ...raised(999), color: C.accentInk }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav className="mb-8 flex flex-wrap gap-2 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICONS[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-4 text-[12.5px] font-bold transition-transform active:translate-y-px ${focusRing}`}
                style={{
                  ...body,
                  color: on ? "#fff" : C.inkSoft,
                  background: on ? C.accent : undefined,
                  ...(on ? {} : raised(999)),
                  boxShadow: on
                    ? `-3px -3px 8px rgba(255,255,255,0.3), 4px 4px 10px rgba(15,23,42,0.26)`
                    : undefined,
                  borderRadius: 999,
                }}
              >
                <Icon size={14} strokeWidth={2.4} aria-hidden="true" />
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
          className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-[11px]"
          style={{ ...body, borderColor: C.line, color: C.muted }}
        >
          <span className="inline-flex items-center gap-2">
            <BrailleStrip />
            Contrast AA/AAA · braille puur decoratief
          </span>
          <span>Voelbaar ontworpen</span>
        </footer>
      </div>
    </div>
  );
}
