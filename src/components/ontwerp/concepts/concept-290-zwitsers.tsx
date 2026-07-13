"use client";

// Concept 290 — "Zwitsers" · International Typographic Style / Swiss grid revival (light).
// Signature: streng Müller-Brockmann-raster als compositie-principe — zichtbare kolommen en 8pt-ritme,
// flush-left uitlijning, hiërarchie ALLEEN via typegrootte/gewicht + royale witruimte (geen decoratie,
// geen kleurblokken). Eén felrood accent (#e2231a) als enige kleur naast zwart/wit. Grote index-
// nummers en numerals, monospace cijferlabels, strakke horizontale zwarte regels. Ultra-clean,
// tijdloos, informatie-eerst.
// Fonts: --font-lab-geist (grotesk) + --font-lab-mono (cijfer- en indexlabels).

import { useState, type CSSProperties, type ReactNode } from "react";
import {
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
  RefreshCw,
  Bookmark,
  BookmarkCheck,
  Hourglass,
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

// Swiss palette. Monochrome + exactly one accent red. No other colour anywhere.
const C = {
  paper: "#ffffff",
  paperSoft: "#f7f7f5",
  ink: "#111111",
  fg: "#1a1a1a",
  fgSoft: "#565656",
  muted: "#8a8a8a",
  faint: "#b8b8b8",
  line: "#111111",
  lineSoft: "#e2e2df",
  lineFaint: "#efefec",
  red: "#e2231a",
  redSoft: "#fbe6e5",
};

const sans = { fontFamily: "var(--font-lab-geist), Helvetica, Arial, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2231a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff]";

// Two-digit index for every screen — Swiss numbering.
const SCREEN_INDEX: Record<ScreenKey, string> = {
  dashboard: "01",
  marktplaats: "02",
  opdracht: "03",
  verificatie: "04",
  acties: "05",
  facturen: "06",
  documenten: "07",
  berichten: "08",
};

// ---- Primitives -------------------------------------------------------------

// A hairline black rule — the primary structural device.
function Rule({ strong = false, style }: { strong?: boolean; style?: CSSProperties }) {
  return (
    <div
      style={{
        borderTop: `${strong ? 2 : 1}px solid ${strong ? C.line : C.lineSoft}`,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

// A mono kicker label — small caps tracking, the Swiss caption voice.
function Kicker({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    <span
      className="text-[10.5px] font-medium uppercase tracking-[0.22em]"
      style={{ ...mono, color: accent ? C.red : C.muted }}
    >
      {children}
    </span>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  // Fill treatment keeps statuses distinct without extra colours.
  variant: "ink" | "outline" | "redOutline" | "red";
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, variant: "ink" };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Hourglass, variant: "outline" };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, variant: "redOutline" };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, variant: "red" };
  }
}

function statusStyle(variant: "ink" | "outline" | "redOutline" | "red"): CSSProperties {
  switch (variant) {
    case "ink":
      return { color: C.paper, background: C.ink, border: `1px solid ${C.ink}` };
    case "outline":
      return { color: C.ink, background: C.paper, border: `1px solid ${C.line}` };
    case "redOutline":
      return { color: C.red, background: C.paper, border: `1px solid ${C.red}` };
    case "red":
      return { color: C.paper, background: C.red, border: `1px solid ${C.red}` };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, variant } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
      style={{ ...sans, ...statusStyle(variant) }}
    >
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </span>
  );
}

function MatchTag({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const high = value >= 90;
  return (
    <span className="inline-flex items-baseline gap-1.5" aria-label={`Match ${value} procent`}>
      <span
        className={`font-semibold tabular-nums leading-none ${size === "sm" ? "text-[26px]" : "text-[34px]"}`}
        style={{ ...sans, color: high ? C.red : C.ink }}
      >
        {value}
      </span>
      <span
        className="text-[9px] font-medium uppercase tracking-[0.18em]"
        style={{ ...mono, color: C.muted }}
      >
        %&nbsp;match
      </span>
    </span>
  );
}

function Sparkline({ data, height = 30 }: { data: number[]; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 70 - 12;
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
        stroke={C.ink}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={pts
          .slice(-2)
          .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
          .join(" ")}
        fill="none"
        stroke={C.red}
        strokeWidth={2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Filled black primary — flat, sharp corners, hover inverts to red.
function InkButton({
  children,
  onClick,
  className,
  ariaLabel,
  ariaPressed,
  accent = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  accent?: boolean;
}) {
  const [hot, setHot] = useState(false);
  const base = accent ? C.red : C.ink;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.06em] transition-colors duration-200 ${RING} ${className ?? ""}`}
      style={{ ...sans, color: C.paper, background: hot ? (accent ? C.ink : C.red) : base }}
    >
      {children}
    </button>
  );
}

// Outline secondary — black hairline frame, fills ink on hover/active.
function LineButton({
  children,
  onClick,
  className,
  ariaLabel,
  ariaPressed,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  active?: boolean;
}) {
  const [hot, setHot] = useState(false);
  const on = active || hot;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: on ? C.paper : C.ink,
        background: on ? C.ink : "transparent",
        border: `1px solid ${C.line}`,
      }}
    >
      {children}
    </button>
  );
}

// Swiss section header — oversized index numeral + flush-left title, ruled beneath.
function ScreenHead({
  screenKey,
  title,
  sub,
}: {
  screenKey: ScreenKey;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-start gap-5">
        <span
          className="shrink-0 text-[44px] font-semibold tabular-nums leading-none sm:text-[56px]"
          style={{ ...sans, color: C.red }}
        >
          {SCREEN_INDEX[screenKey]}
        </span>
        <div className="min-w-0 flex-1 pt-1">
          <h1
            className="text-[28px] font-semibold leading-[1.05] tracking-tight sm:text-[36px]"
            style={{ ...sans, color: C.ink }}
          >
            {title}
          </h1>
          {sub && (
            <p
              className="mt-2 max-w-xl text-[14px] leading-relaxed"
              style={{ ...sans, color: C.fgSoft }}
            >
              {sub}
            </p>
          )}
        </div>
      </div>
      <Rule strong style={{ marginTop: 20 }} />
    </div>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      {/* Hero — faint 12-column grid guide behind flush-left type. */}
      <div className="relative mb-10 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 hidden sm:grid"
          style={{ gridTemplateColumns: "repeat(12, 1fr)" }}
          aria-hidden="true"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ borderRight: `1px solid ${C.lineFaint}` }} />
          ))}
        </div>
        <div className="relative py-2">
          <Rule strong />
          <div className="flex flex-wrap items-end justify-between gap-6 py-8">
            <div>
              <div className="mb-4">
                <Kicker accent>
                  {PROFIEL.plaats} · {PROFIEL.rol}
                </Kicker>
              </div>
              <h1
                className="text-[40px] font-semibold leading-[0.98] tracking-tight sm:text-[54px]"
                style={{ ...sans, color: C.ink }}
              >
                Goedemorgen,
                <br />
                {voornaam}.
              </h1>
              <p
                className="mt-5 max-w-md text-[14px] leading-relaxed"
                style={{ ...sans, color: C.fgSoft }}
              >
                Eén raster, geen ruis. Alleen wat telt en wat nu actie vraagt — helder gerangschikt.
              </p>
            </div>
            <div
              className="flex items-center gap-2.5 px-4 py-2.5"
              style={{ border: `1px solid ${C.line}` }}
            >
              <BadgeCheck size={16} strokeWidth={2} style={{ color: C.ink }} aria-hidden="true" />
              <span
                className="text-[12px] font-semibold uppercase tracking-[0.06em]"
                style={{ ...sans, color: C.ink }}
              >
                {PROFIEL.trust}
              </span>
            </div>
          </div>
          <Rule strong />
        </div>
      </div>

      {/* KPI band — cells divided by rules, big numerals, mono captions. */}
      <div
        className="mb-12 grid grid-cols-2 lg:grid-cols-4"
        style={{ borderTop: `1px solid ${C.line}` }}
      >
        {KPIS.map((k, i) => (
          <div
            key={k.label}
            className="p-5"
            style={{
              borderBottom: `1px solid ${C.line}`,
              borderRight: (i + 1) % 4 === 0 ? "none" : `1px solid ${C.lineSoft}`,
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-[10px] font-medium uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.muted }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className="text-[11px] font-semibold tabular-nums"
                style={{ ...mono, color: k.up ? C.ink : C.red }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-4 text-[30px] font-semibold tabular-nums leading-none"
              style={{ ...sans, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-2 text-[11px]" style={{ ...sans, color: C.fgSoft }}>
              {k.label}
            </div>
            <div className="mt-3">
              <Sparkline data={k.spark} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-baseline justify-between">
            <Kicker>Beste match</Kicker>
            <span className="text-[11px]" style={{ ...mono, color: C.faint }}>
              {top.id}
            </span>
          </div>
          <Rule strong />
          <button
            onClick={() => onOpen(top)}
            className={`group block w-full p-0 pt-6 text-left transition-colors ${RING}`}
          >
            <span className="flex items-start justify-between gap-5">
              <span className="min-w-0 flex-1">
                <span
                  className="block text-[24px] font-semibold leading-tight tracking-tight"
                  style={{ ...sans, color: C.ink }}
                >
                  {top.titel}
                </span>
                <span className="mt-1.5 block text-[13px]" style={{ ...sans, color: C.fgSoft }}>
                  {top.opdrachtgever} · {top.plaats} · {top.tarief}
                </span>
                <span className="mt-4 flex flex-wrap gap-1.5">
                  {top.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-0.5 text-[11px] font-medium"
                      style={{ ...sans, color: C.fg, border: `1px solid ${C.lineSoft}` }}
                    >
                      {t}
                    </span>
                  ))}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-3">
                <MatchTag value={top.match} />
                <ArrowRight
                  size={22}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                  style={{ color: C.red }}
                  aria-hidden="true"
                />
              </span>
            </span>
          </button>
          <Rule style={{ marginTop: 24 }} />

          <div
            className="mt-6 flex items-start gap-4 p-5"
            style={{ border: `1px solid ${C.line}` }}
          >
            <BadgeCheck
              size={22}
              strokeWidth={2}
              style={{ color: C.ink }}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
            />
            <div>
              <div className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
                {PROFIEL.trust}
              </div>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ ...sans, color: C.fgSoft }}>
                Je documenten zijn geverifieerd — opdrachtgevers zien meteen dat je te vertrouwen
                bent.
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-4">
            <Kicker>Vraagt aandacht</Kicker>
          </div>
          <Rule strong />
          <ul>
            {ACTIES.map((a, i) => {
              const warn = a.urgentie === "warning";
              return (
                <li
                  key={a.titel}
                  className="py-4"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="text-[12px] font-medium tabular-nums"
                      style={{ ...mono, color: warn ? C.red : C.muted }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[13px] font-semibold leading-snug"
                        style={{ ...sans, color: C.ink }}
                      >
                        {a.titel}
                      </div>
                      <div
                        className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.04em]"
                        style={{ ...sans, color: warn ? C.red : C.ink }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </li>
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
      <ScreenHead
        screenKey="marktplaats"
        title="Marktplaats"
        sub="Eerlijk geordend: waarom een opdracht past — en waar het schuurt."
      />

      <div
        className="mb-8 flex items-center gap-3 px-4 py-3"
        style={{ border: `1px solid ${C.line}` }}
      >
        <Search size={16} className="shrink-0" style={{ color: C.ink }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-50"
          style={{ ...sans, color: C.ink }}
        />
        <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
          {String(filtered.length).padStart(2, "0")}/{String(OPDRACHTEN.length).padStart(2, "0")}
        </span>
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] ${RING}`}
            style={{ ...sans, color: C.red }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 px-6 py-20 text-center"
          style={{ border: `1px solid ${C.line}` }}
        >
          <Search size={30} strokeWidth={1.6} style={{ color: C.ink }} aria-hidden="true" />
          <h3
            className="text-[22px] font-semibold tracking-tight"
            style={{ ...sans, color: C.ink }}
          >
            Geen resultaten
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="mt-1">
            <LineButton onClick={() => setQuery("")}>Filter wissen</LineButton>
          </div>
        </div>
      ) : (
        <div style={{ borderTop: `2px solid ${C.line}` }}>
          {filtered.map((o, i) => {
            const isSaved = saved.has(o.id);
            return (
              <div
                key={o.id}
                className="group grid grid-cols-1 gap-4 py-6 transition-colors sm:grid-cols-[auto,1fr,auto] sm:items-start"
                style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.paperSoft)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div className="flex items-center gap-4 sm:block sm:w-16">
                  <span
                    className="text-[13px] font-medium tabular-nums"
                    style={{ ...mono, color: C.faint }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="mb-1.5">
                    <Kicker>{o.id}</Kicker>
                  </div>
                  <h3
                    className="text-[19px] font-semibold leading-tight tracking-tight"
                    style={{ ...sans, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <div className="mt-1 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
                    {o.opdrachtgever}
                  </div>
                  <dl
                    className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12px]"
                    style={{ ...sans, color: C.fgSoft }}
                  >
                    {[
                      { Icon: MapPin, v: o.plaats },
                      { Icon: Wallet, v: o.tarief },
                      { Icon: Clock, v: o.uren },
                      { Icon: Calendar, v: o.start },
                    ].map((m, mi) => (
                      <div key={mi} className="flex items-center gap-1.5">
                        <m.Icon
                          size={13}
                          strokeWidth={2}
                          style={{ color: C.muted }}
                          aria-hidden="true"
                        />
                        {m.v}
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <MatchTag value={o.match} size="sm" />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSave(o.id)}
                      aria-pressed={isSaved}
                      aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                      className={`flex h-9 w-9 items-center justify-center transition-colors ${RING}`}
                      style={{
                        color: isSaved ? C.paper : C.ink,
                        background: isSaved ? C.ink : "transparent",
                        border: `1px solid ${C.line}`,
                      }}
                    >
                      {isSaved ? (
                        <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                      ) : (
                        <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
                      )}
                    </button>
                    <InkButton onClick={() => onOpen(o)}>
                      Bekijk
                      <ArrowRight
                        size={13}
                        strokeWidth={2.2}
                        className="transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </InkButton>
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
      <div className="mb-6">
        <LineButton onClick={onBack} ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
          Terug
        </LineButton>
      </div>

      <div className="mb-2">
        <Kicker accent>{opdracht.id}</Kicker>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <h2
            className="text-[32px] font-semibold leading-[1.05] tracking-tight sm:text-[42px]"
            style={{ ...sans, color: C.ink }}
          >
            {opdracht.titel}
          </h2>
          <div className="mt-2 text-[14px]" style={{ ...sans, color: C.fgSoft }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <MatchTag value={opdracht.match} />
          <LineButton
            onClick={() => toggleSave(opdracht.id)}
            active={isSaved}
            ariaPressed={isSaved}
            ariaLabel={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
          >
            {isSaved ? (
              <BookmarkCheck size={14} strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <Bookmark size={14} strokeWidth={2.2} aria-hidden="true" />
            )}
            {isSaved ? "Bewaard" : "Bewaar"}
          </LineButton>
        </div>
      </div>

      <Rule strong style={{ marginTop: 24 }} />
      <div
        className="grid grid-cols-2 sm:grid-cols-4"
        style={{ borderBottom: `2px solid ${C.line}` }}
      >
        {[
          { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
          { Icon: Clock, label: "Inzet", value: opdracht.uren },
          { Icon: Calendar, label: "Start", value: opdracht.start },
          { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
        ].map((m, i) => (
          <div
            key={m.label}
            className="py-5 pr-4"
            style={{
              borderRight: (i + 1) % 4 === 0 ? "none" : `1px solid ${C.lineSoft}`,
              paddingLeft: i === 0 ? 0 : 20,
            }}
          >
            <m.Icon size={15} strokeWidth={2} style={{ color: C.muted }} aria-hidden="true" />
            <div
              className="mt-2 text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.muted }}
            >
              {m.label}
            </div>
            <div className="mt-0.5 text-[15px] font-semibold" style={{ ...sans, color: C.ink }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[13px] font-semibold" style={{ ...sans, color: C.ink }}>
              Waarom deze past
            </span>
          </div>
          <Rule strong />
          <ul className="mt-1">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 py-3 text-[13.5px]"
                style={{ ...sans, color: C.fg, borderBottom: `1px solid ${C.lineSoft}` }}
              >
                <Check
                  size={16}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.ink }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[13px] font-semibold" style={{ ...sans, color: C.ink }}>
              Even op letten
            </span>
          </div>
          <Rule strong style={{ borderTopColor: C.red }} />
          <ul className="mt-1">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 py-3 text-[13.5px]"
                style={{ ...sans, color: C.fg, borderBottom: `1px solid ${C.lineSoft}` }}
              >
                <TriangleAlert
                  size={16}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.red }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <InkButton
          onClick={() => setApplied((v) => !v)}
          ariaPressed={applied}
          className="px-6 py-3 text-[13px]"
        >
          {applied ? (
            <Check size={16} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </InkButton>
        {applied && (
          <span className="text-[12.5px]" style={{ ...sans, color: C.muted }}>
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
        screenKey="verificatie"
        title="Verificatie"
        sub="Elke status heeft een eigen vorm, label én icoon — nooit alleen kleur."
      />

      <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, variant } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 px-3.5 py-3"
              style={{ ...statusStyle(variant) }}
            >
              <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
              <span
                className="text-[12px] font-semibold uppercase tracking-[0.04em]"
                style={{ ...sans }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mb-8 flex items-start gap-4 p-5" style={{ border: `1px solid ${C.line}` }}>
        <BadgeCheck
          size={24}
          strokeWidth={2}
          style={{ color: C.ink }}
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        />
        <div>
          <div className="text-[15px] font-semibold" style={{ ...sans, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-1 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Certificaten</Kicker>
          </div>
          <div style={{ borderTop: `2px solid ${C.line}` }}>
            {CREDENTIALS.map((c, i) => {
              const done = checked.has(c.naam);
              return (
                <div
                  key={c.naam}
                  className="flex items-center gap-4 py-4"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${C.line}`,
                      background: done ? C.ink : "transparent",
                      color: C.paper,
                    }}
                  >
                    {done && <Check size={13} strokeWidth={2.6} aria-hidden="true" />}
                  </button>
                  <span
                    className="text-[12px] font-medium tabular-nums"
                    style={{ ...mono, color: C.faint }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
                      {c.naam}
                    </div>
                    <div className="text-[12px]" style={{ ...sans, color: C.muted }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusPill status={c.status} />
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Kicker>Documenten</Kicker>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-7 w-7 items-center justify-center ${RING}`}
              style={{ color: C.ink, border: `1px solid ${C.line}` }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={13} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-4 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? C.paper : C.ink,
                  background: feedState === s ? C.ink : "transparent",
                  border: `1px solid ${C.line}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul
              aria-busy="true"
              aria-label="Documenten laden"
              style={{ borderTop: `1px solid ${C.line}` }}
            >
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="py-4" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                  <div className="h-3 w-2/3 animate-pulse" style={{ background: C.lineFaint }} />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse"
                    style={{ background: C.lineFaint }}
                  />
                </li>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <div
              className="flex flex-col items-center gap-2 px-4 py-10 text-center"
              style={{ border: `1px solid ${C.red}` }}
            >
              <XCircle size={26} strokeWidth={2} style={{ color: C.red }} aria-hidden="true" />
              <div className="text-[15px] font-semibold" style={{ ...sans, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <InkButton onClick={() => setFeedState("ok")} accent>
                  Opnieuw proberen
                </InkButton>
              </div>
            </div>
          )}

          {feedState === "ok" && (
            <ul style={{ borderTop: `1px solid ${C.line}` }}>
              {DOCUMENTEN.map((d) => (
                <li
                  key={d.naam}
                  className="flex items-center gap-3 py-3.5"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{ ...mono, color: C.ink, border: `1px solid ${C.line}` }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12.5px] font-semibold"
                      style={{ ...sans, color: C.ink }}
                    >
                      {d.naam}
                    </div>
                    <div className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
                      {d.grootte} · {d.bijgewerkt}
                    </div>
                  </div>
                  <StatusPill status={d.status} />
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
      <ScreenHead screenKey="acties" title="Acties" sub="Wat vandaag om aandacht vraagt." />

      {openCount === 0 ? (
        <div
          className="flex flex-col items-center gap-3 px-6 py-20 text-center"
          style={{ border: `1px solid ${C.line}` }}
        >
          <Check size={30} strokeWidth={2.2} style={{ color: C.ink }} aria-hidden="true" />
          <h3
            className="text-[22px] font-semibold tracking-tight"
            style={{ ...sans, color: C.ink }}
          >
            Alles afgerond
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Niets meer te doen vandaag. Het raster is leeg.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-baseline gap-3">
            <span
              className="text-[40px] font-semibold tabular-nums leading-none"
              style={{ ...sans, color: C.red }}
            >
              {String(openCount).padStart(2, "0")}
            </span>
            <span
              className="text-[12px] font-medium uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.muted }}
            >
              {openCount === 1 ? "actie open" : "acties open"}
            </span>
          </div>

          <div style={{ borderTop: `2px solid ${C.line}` }}>
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <div
                  key={a.titel}
                  className="flex items-start gap-4 py-5"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${C.line}`,
                      background: isDone ? C.ink : "transparent",
                      color: C.paper,
                    }}
                  >
                    {isDone && <Check size={13} strokeWidth={2.6} aria-hidden="true" />}
                  </button>
                  <span
                    className="mt-0.5 text-[13px] font-medium tabular-nums"
                    style={{ ...mono, color: isDone ? C.faint : warn ? C.red : C.muted }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[15px] font-semibold leading-snug"
                      style={{
                        ...sans,
                        color: C.ink,
                        textDecoration: isDone ? "line-through" : "none",
                        opacity: isDone ? 0.5 : 1,
                      }}
                    >
                      {a.titel}
                    </div>
                    <p
                      className="mt-1 text-[12.5px]"
                      style={{ ...sans, color: C.muted, opacity: isDone ? 0.5 : 1 }}
                    >
                      {a.detail}
                    </p>
                    {!isDone && (
                      <span
                        className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.04em]"
                        style={{ ...sans, color: warn ? C.red : C.ink }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Facturen() {
  const trend = [24.8, 13.5, 30.72, 8.8];
  const statusColor = (status: string): string => (status === "Openstaand" ? C.red : C.ink);
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Facturen"
        sub="Overzichtelijk en zonder gedoe — zodat je weet waar je aan toe bent."
      />

      <div
        className="mb-10 grid grid-cols-1 sm:grid-cols-4"
        style={{ borderTop: `2px solid ${C.line}`, borderBottom: `2px solid ${C.line}` }}
      >
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", accent: false },
          { label: "Openstaand", value: "€ 1.350", accent: true },
          { label: "Concept", value: "€ 880", accent: false },
        ].map((s, i) => (
          <div
            key={s.label}
            className="py-6 pr-4"
            style={{ borderRight: `1px solid ${C.lineSoft}`, paddingLeft: i === 0 ? 0 : 20 }}
          >
            <div
              className="text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.muted }}
            >
              {s.label}
            </div>
            <div
              className="mt-2 text-[28px] font-semibold tabular-nums"
              style={{ ...sans, color: s.accent ? C.red : C.ink }}
            >
              {s.value}
            </div>
          </div>
        ))}
        <div className="flex flex-col justify-between py-6" style={{ paddingLeft: 20 }}>
          <div
            className="text-[10px] font-medium uppercase tracking-[0.14em]"
            style={{ ...mono, color: C.muted }}
          >
            Per factuur
          </div>
          <Sparkline data={trend} height={44} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.line}` }}>
              {["Nr.", "Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                <th
                  key={h}
                  scope="col"
                  className="px-3 py-3 text-[10px] font-medium uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.muted, textAlign: i >= 4 ? "right" : "left" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => (
              <tr
                key={f.nr}
                className="transition-colors"
                style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.paperSoft)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td
                  className="px-3 py-4 text-[12px] tabular-nums"
                  style={{ ...mono, color: C.faint }}
                >
                  {String(i + 1).padStart(2, "0")}
                </td>
                <td
                  className="px-3 py-4 text-[12.5px] font-semibold tabular-nums"
                  style={{ ...sans, color: C.ink }}
                >
                  {f.nr}
                </td>
                <td className="px-3 py-4 text-[13px]" style={{ ...sans, color: C.ink }}>
                  {f.klant}
                </td>
                <td
                  className="px-3 py-4 text-[12.5px] tabular-nums"
                  style={{ ...mono, color: C.muted }}
                >
                  {f.datum}
                </td>
                <td
                  className="px-3 py-4 text-right text-[13px] font-semibold tabular-nums"
                  style={{ ...sans, color: C.ink }}
                >
                  {f.bedrag}
                </td>
                <td className="px-3 py-4 text-right">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]"
                    style={{ ...sans, color: statusColor(f.status) }}
                  >
                    <span
                      className="h-2 w-2"
                      style={{
                        background: f.status === "Betaald" ? C.ink : "transparent",
                        border: `1px solid ${statusColor(f.status)}`,
                      }}
                      aria-hidden="true"
                    />
                    {f.status}
                  </span>
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: `2px solid ${C.line}` }}>
              <td className="px-3 py-4" />
              <td
                className="px-3 py-4 text-[11px] font-medium uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.muted }}
                colSpan={3}
              >
                Totaal
              </td>
              <td
                className="px-3 py-4 text-right text-[15px] font-semibold tabular-nums"
                style={{ ...sans, color: C.ink }}
              >
                € 7.782
              </td>
              <td className="px-3 py-4" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept290() {
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
      style={{ ...sans, color: C.fg, background: C.paper }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center"
              style={{ background: C.red, color: C.paper }}
              aria-hidden="true"
            >
              <span className="text-[16px] font-bold" style={{ ...sans }}>
                Z
              </span>
            </span>
            <div className="leading-tight">
              <div
                className="text-[17px] font-semibold tracking-tight"
                style={{ ...sans, color: C.ink }}
              >
                Zwitsers
              </div>
              <div
                className="text-[9.5px] font-medium uppercase tracking-[0.24em]"
                style={{ ...mono, color: C.muted }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...sans, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...sans, color: C.fgSoft }}
              >
                <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-10 w-10 items-center justify-center text-[12px] font-bold"
              style={{ ...sans, color: C.ink, border: `1px solid ${C.line}` }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <Rule strong />
        <nav
          className="mb-9 flex flex-wrap gap-x-1 gap-y-0 overflow-x-auto"
          aria-label="Hoofdnavigatie"
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 px-3 py-3 text-[12.5px] font-semibold uppercase tracking-[0.04em] transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: on ? C.ink : C.muted,
                  borderTop: `2px solid ${on ? C.red : "transparent"}`,
                }}
              >
                <span
                  className="text-[10px] font-medium tabular-nums"
                  style={{ ...mono, color: on ? C.red : C.faint }}
                >
                  {SCREEN_INDEX[s.key]}
                </span>
                {s.label}
              </button>
            );
          })}
        </nav>

        <main className="flex-1">
          {screen === "dashboard" && (
            <Dashboard
              onOpen={(o) => {
                setActive(o);
                setScreen("opdracht");
              }}
            />
          )}
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

        <Rule strong style={{ marginTop: 40 }} />
        <footer
          className="flex flex-wrap items-center justify-between gap-2 pt-4 text-[10.5px]"
          style={{ ...mono, color: C.muted }}
        >
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2" style={{ background: C.red }} aria-hidden="true" />
            {SCREENS.length} schermen · zwitsers v290
          </span>
          <span className="uppercase tracking-[0.14em]">Grid · type · één rood</span>
        </footer>
      </div>
    </div>
  );
}
