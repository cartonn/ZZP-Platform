"use client";

// Concept 300 — "Zoötroop" · pre-cinema bewegingsstrip / zoetrope (mijlpaal-concept).
// Signature: sequentiële frames die beweging suggereren. Een filmstrip met perforaties en
// herhaalde-met-verschuiving mini-frames als dragend motief; een radiale zoetrope-trommel met
// sleuven waarin de beste match "draait"; subtiele stroboscoop-ritmes. Speels-kinetisch maar
// streng geordend op een 8pt-raster. Neutraal-warm papier met één levendig accent.
// Fonts: kop --font-lab-bricolage · tekst --font-lab-geist · cijfers --font-lab-mono.

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
  Hourglass,
  RefreshCw,
  Bookmark,
  BookmarkCheck,
  Film,
  Play,
  Plus,
  Minus,
  ShieldCheck,
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

// Warm-paper zoetrope palette. Ink on cream, dark drum, a single vivid vermilion accent.
const C = {
  paper: "#f0ece2",
  paperSoft: "#e8e2d4",
  card: "#faf7ef",
  ink: "#1b1815",
  fg: "#3a352e",
  fgSoft: "#6b6458",
  muted: "#8f8879",
  faint: "#b6ae9c",
  drum: "#211d18",
  drumSoft: "#2c261f",
  accent: "#e0562d",
  accentSoft: "#f0764c",
  accentDeep: "#b83f1c",
  line: "#d8d1c1",
  lineSoft: "#e4dece",
  green: "#5c8a4a",
  amber: "#c98a1e",
};

const display = { fontFamily: "var(--font-lab-bricolage), Georgia, serif" };
const sans = { fontFamily: "var(--font-lab-geist), Helvetica, Arial, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0562d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f0ece2]";

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

// ---- Kinetic primitives -----------------------------------------------------

// A filmstrip band with perforations — the load-bearing motif. Repeated frames with a shifting
// accent block suggest motion across the strip.
function Perforation({ vertical = false }: { vertical?: boolean }) {
  return (
    <div
      className={`flex shrink-0 ${vertical ? "flex-col" : "flex-row"} items-center justify-between`}
      style={vertical ? { width: 14, paddingBlock: 6 } : { height: 14, paddingInline: 6 }}
      aria-hidden="true"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          style={{ width: 5, height: 5, borderRadius: 1.5, background: C.drum, opacity: 0.55 }}
        />
      ))}
    </div>
  );
}

// A strip of sequential mini-frames — the same shape stepped/shifted to read as one motion.
function FrameStrip({
  frames = 7,
  active = 3,
  height = 30,
}: {
  frames?: number;
  active?: number;
  height?: number;
}) {
  return (
    <div className="flex items-stretch gap-[3px]" aria-hidden="true" style={{ height }}>
      {Array.from({ length: frames }).map((_, i) => {
        const on = i === active % frames;
        const near = Math.abs(i - (active % frames)) === 1;
        return (
          <div
            key={i}
            className="flex-1"
            style={{
              borderRadius: 2,
              background: on ? C.accent : near ? "rgba(224,86,45,0.35)" : C.lineSoft,
              transform: `translateY(${on ? -2 : 0}px)`,
              transition: "all 0.25s",
            }}
          />
        );
      })}
    </div>
  );
}

// The zoetrope drum — a radial ring of slots with the "spinning" match value at its centre.
function ZoetropeDrum({
  value,
  size = 132,
  slots = 16,
  label,
}: {
  value: number;
  size?: number;
  slots?: number;
  label?: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 2;
  const rInner = rOuter - 11;
  const active = Math.round((value / 100) * slots);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx={cx} cy={cy} r={rOuter} fill={C.drum} />
      <circle cx={cx} cy={cy} r={rInner} fill={C.card} />
      {/* slots around the drum wall */}
      {Array.from({ length: slots }).map((_, i) => {
        const a = (i / slots) * 2 * Math.PI - Math.PI / 2;
        const on = i < active;
        const sx = cx + (rInner + 2) * Math.cos(a);
        const sy = cy + (rInner + 2) * Math.sin(a);
        const ex = cx + (rOuter - 2) * Math.cos(a);
        const ey = cy + (rOuter - 2) * Math.sin(a);
        return (
          <line
            key={i}
            x1={sx}
            y1={sy}
            x2={ex}
            y2={ey}
            stroke={on ? C.accentSoft : C.paperSoft}
            strokeWidth={on ? 3 : 1.6}
            strokeLinecap="round"
            opacity={on ? 0.95 : 0.4}
          />
        );
      })}
      <text
        x={cx}
        y={cy - (label ? 2 : -5)}
        textAnchor="middle"
        style={mono}
        fontSize={size > 110 ? 26 : 19}
        fill={C.ink}
        fontWeight={700}
      >
        {value}
      </text>
      {label && (
        <text
          x={cx}
          y={cy + 13}
          textAnchor="middle"
          style={mono}
          fontSize={7.5}
          fill={C.muted}
          letterSpacing={1.6}
        >
          {label}
        </text>
      )}
    </svg>
  );
}

function Kicker({ children, tone = "accent" }: { children: ReactNode; tone?: "accent" | "muted" }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-[0.24em]"
      style={{ ...mono, color: tone === "accent" ? C.accent : C.muted }}
    >
      {children}
    </span>
  );
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; color: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, color: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Hourglass, color: C.amber };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, color: C.accent };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.accentDeep };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, color } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em]"
      style={{
        ...sans,
        color,
        background: `${color}18`,
        border: `1.5px solid ${color}`,
        borderRadius: 2,
      }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

// Filled vermilion primary — a hard-edged "film cell" that steps up on hover.
function AccentButton({
  children,
  onClick,
  className,
  ariaLabel,
  ariaPressed,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
}) {
  const [hot, setHot] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-[12.5px] font-bold uppercase tracking-[0.03em] transition-all duration-150 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: C.paper,
        background: hot ? C.accentSoft : C.accent,
        border: `1.5px solid ${C.accentDeep}`,
        borderRadius: 3,
        transform: hot ? "translateY(-1px)" : "none",
        boxShadow: hot ? `0 4px 0 ${C.accentDeep}` : `0 2px 0 ${C.accentDeep}`,
      }}
    >
      {children}
    </button>
  );
}

// Outlined secondary — ink frame on paper, inverts to ink fill.
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
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 text-[12px] font-bold uppercase tracking-[0.03em] transition-colors duration-150 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: on ? C.paper : C.ink,
        background: on ? C.ink : "transparent",
        border: `1.5px solid ${C.ink}`,
        borderRadius: 3,
      }}
    >
      {children}
    </button>
  );
}

// A paper "film cell" card — sharp corners, subtle perforation edge.
function Cell({
  children,
  className,
  style,
  perforated = false,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  perforated?: boolean;
}) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        background: C.card,
        border: `1.5px solid ${C.line}`,
        borderRadius: 4,
        ...style,
      }}
    >
      {perforated && (
        <div className="absolute inset-x-0 top-0" style={{ paddingInline: 8 }}>
          <Perforation />
        </div>
      )}
      {children}
    </div>
  );
}

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
    <div className="mb-7">
      <div className="flex items-center gap-3">
        <span
          className="flex h-8 items-center gap-2 px-2.5 text-[11px] font-bold tabular-nums"
          style={{ ...mono, color: C.paper, background: C.ink, borderRadius: 2 }}
          aria-hidden="true"
        >
          <Film size={12} strokeWidth={2.4} />
          {SCREEN_INDEX[screenKey]}
        </span>
        <div className="h-px flex-1" style={{ background: C.line }} aria-hidden="true" />
      </div>
      <h1
        className="mt-3 text-[30px] font-bold leading-none tracking-tight sm:text-[40px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed"
          style={{ ...sans, color: C.fgSoft }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      {/* Hero — the zoetrope drum turning next to the greeting, framed by a filmstrip edge. */}
      <div
        className="mb-8 overflow-hidden"
        style={{ borderRadius: 6, border: `1.5px solid ${C.line}`, background: C.card }}
      >
        <div
          className="flex items-center justify-between"
          style={{ background: C.drum, paddingInline: 10 }}
        >
          <Perforation />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-6 p-6 sm:p-8">
          <div className="min-w-0">
            <div className="mb-3">
              <Kicker>
                {PROFIEL.plaats} · {PROFIEL.rol}
              </Kicker>
            </div>
            <h1
              className="text-[38px] font-bold leading-[0.95] tracking-tight sm:text-[50px]"
              style={{ ...display, color: C.ink }}
            >
              Goedemorgen,
              <br />
              {voornaam}.
            </h1>
            <p
              className="mt-4 max-w-md text-[13.5px] leading-relaxed"
              style={{ ...sans, color: C.fgSoft }}
            >
              Frame voor frame komt je week in beweging. We tonen alleen wat telt en wat nu draait —
              helder geordend, nooit druk.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div
                className="inline-flex items-center gap-2.5 px-3 py-2"
                style={{ border: `1.5px solid ${C.line}`, borderRadius: 3 }}
              >
                <ShieldCheck
                  size={15}
                  strokeWidth={2.2}
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                <span className="text-[12px] font-semibold" style={{ ...sans, color: C.ink }}>
                  {PROFIEL.trust}
                </span>
              </div>
              <div className="hidden w-28 sm:block">
                <FrameStrip active={4} />
              </div>
            </div>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group flex flex-col items-center p-2 transition-transform hover:-translate-y-0.5 ${RING}`}
            style={{ borderRadius: 8 }}
            aria-label={`Open beste match: ${top.titel}`}
          >
            <ZoetropeDrum value={top.match} size={150} label="BESTE MATCH" slots={20} />
            <span
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.accent }}
            >
              <Play
                size={11}
                strokeWidth={2.6}
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
              Afspelen
            </span>
          </button>
        </div>
        <div
          className="flex items-center justify-between"
          style={{ background: C.drum, paddingInline: 10 }}
        >
          <Perforation />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Cell key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.muted }}
              >
                {k.label}
              </span>
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ ...mono, color: k.up ? C.green : C.accent }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-3 text-[24px] font-bold tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <FrameStrip active={i + 2} height={16} frames={7} />
            </div>
          </Cell>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Matches in beeld</Kicker>
          </div>
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o)}
                className={`group block w-full text-left ${RING}`}
                style={{ borderRadius: 4 }}
              >
                <Cell
                  className="flex items-center gap-4 p-4 transition-colors group-hover:border-[color:var(--acc)]"
                  style={{ ["--acc" as string]: C.accent }}
                >
                  <ZoetropeDrum value={o.match} size={74} slots={16} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                      style={{ ...mono, color: C.muted }}
                    >
                      {o.id}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[16px] font-bold leading-tight"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div className="mt-0.5 text-[12.5px]" style={{ ...sans, color: C.fgSoft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    className="shrink-0 transition-transform group-hover:translate-x-1"
                    style={{ color: C.accent }}
                    aria-hidden="true"
                  />
                </Cell>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3">
            <Kicker tone="muted">Vraagt aandacht</Kicker>
          </div>
          <div className="space-y-3">
            {ACTIES.map((a, i) => {
              const warn = a.urgentie === "warning";
              return (
                <Cell key={a.titel} className="p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center text-[10px] font-bold tabular-nums"
                      style={{
                        ...mono,
                        color: C.paper,
                        background: warn ? C.accent : C.ink,
                        borderRadius: 2,
                      }}
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div
                        className="text-[13px] font-semibold leading-snug"
                        style={{ ...sans, color: C.ink }}
                      >
                        {a.titel}
                      </div>
                      <div
                        className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.03em]"
                        style={{ ...sans, color: warn ? C.accent : C.ink }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </Cell>
              );
            })}
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
        screenKey="marktplaats"
        title="Marktplaats"
        sub="Elke opdracht als een frame in de strip — mét de redenen waarom ze past of schuurt."
      />

      <Cell className="mb-6 flex items-center gap-3 px-4 py-3">
        <Search size={16} className="shrink-0" style={{ color: C.accent }} aria-hidden="true" />
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
            className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em] ${RING}`}
            style={{ ...sans, color: C.accent }}
          >
            Wis
          </button>
        )}
      </Cell>

      {filtered.length === 0 ? (
        <Cell className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Film size={30} strokeWidth={1.6} style={{ color: C.accent }} aria-hidden="true" />
          <h3 className="text-[22px] font-bold tracking-tight" style={{ ...display, color: C.ink }}>
            Lege strip
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="mt-1">
            <LineButton onClick={() => setQuery("")}>Filter wissen</LineButton>
          </div>
        </Cell>
      ) : (
        <div className="space-y-4">
          {filtered.map((o, idx) => {
            const isSaved = saved.has(o.id);
            return (
              <div key={o.id} className="flex items-stretch gap-2">
                {/* left filmstrip rail with frame index */}
                <div
                  className="hidden flex-col items-center justify-between py-3 sm:flex"
                  style={{ width: 30, background: C.drum, borderRadius: 3 }}
                  aria-hidden="true"
                >
                  <Perforation vertical />
                  <span
                    className="text-[10px] font-bold tabular-nums"
                    style={{ ...mono, color: C.paperSoft }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <Perforation vertical />
                </div>
                <Cell
                  className="flex-1 p-5 transition-colors hover:border-[color:var(--acc)]"
                  style={{ ["--acc" as string]: C.accent }}
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <ZoetropeDrum value={o.match} size={90} label="MATCH" slots={18} />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1">
                        <Kicker>{o.id}</Kicker>
                      </div>
                      <h3
                        className="text-[19px] font-bold leading-tight"
                        style={{ ...display, color: C.ink }}
                      >
                        {o.titel}
                      </h3>
                      <div className="mt-0.5 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
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
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2.5 py-0.5 text-[11px] font-semibold"
                            style={{
                              ...sans,
                              color: C.fg,
                              border: `1.5px solid ${C.line}`,
                              borderRadius: 2,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <button
                        onClick={() => toggleSave(o.id)}
                        aria-pressed={isSaved}
                        aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                        className={`flex h-9 w-9 items-center justify-center transition-colors ${RING}`}
                        style={{
                          color: isSaved ? C.paper : C.ink,
                          background: isSaved ? C.ink : "transparent",
                          border: `1.5px solid ${C.ink}`,
                          borderRadius: 3,
                        }}
                      >
                        {isSaved ? (
                          <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                        ) : (
                          <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
                        )}
                      </button>
                      <AccentButton onClick={() => onOpen(o)}>
                        Bekijk
                        <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                      </AccentButton>
                    </div>
                  </div>
                </Cell>
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
      <div className="mb-5">
        <LineButton onClick={onBack} ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
          Terug
        </LineButton>
      </div>

      <div
        className="mb-6 overflow-hidden"
        style={{ borderRadius: 6, border: `1.5px solid ${C.line}`, background: C.card }}
      >
        <div
          className="flex items-center justify-between"
          style={{ background: C.drum, paddingInline: 10 }}
        >
          <Perforation />
        </div>
        <div className="p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="mb-2">
                <Kicker>{opdracht.id}</Kicker>
              </div>
              <h2
                className="text-[30px] font-bold leading-[1.02] tracking-tight sm:text-[40px]"
                style={{ ...display, color: C.ink }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-2 text-[14px]" style={{ ...sans, color: C.fgSoft }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <ZoetropeDrum value={opdracht.match} size={116} label="MATCH" slots={20} />
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

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
              { Icon: Clock, label: "Inzet", value: opdracht.uren },
              { Icon: Calendar, label: "Start", value: opdracht.start },
              { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
            ].map((m) => (
              <div
                key={m.label}
                className="p-3"
                style={{ background: C.paper, border: `1.5px solid ${C.line}`, borderRadius: 3 }}
              >
                <m.Icon size={15} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
                <div
                  className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.muted }}
                >
                  {m.label}
                </div>
                <div className="mt-0.5 text-[14px] font-bold" style={{ ...sans, color: C.ink }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          className="flex items-center justify-between"
          style={{ background: C.drum, paddingInline: 10 }}
        >
          <Perforation />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Cell className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.green, borderRadius: 2 }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={3} style={{ color: C.paper }} />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.04em]"
              style={{ ...sans, color: C.ink }}
            >
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...sans, color: C.fg }}
              >
                <Check
                  size={15}
                  strokeWidth={2.8}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Cell>
        <Cell className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.accent, borderRadius: 2 }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={3} style={{ color: C.paper }} />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.04em]"
              style={{ ...sans, color: C.ink }}
            >
              Even op letten
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...sans, color: C.fg }}
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
        </Cell>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <AccentButton
          onClick={() => setApplied((v) => !v)}
          ariaPressed={applied}
          className="px-6 py-3 text-[13px]"
        >
          {applied ? (
            <Check size={16} strokeWidth={2.8} aria-hidden="true" />
          ) : (
            <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </AccentButton>
        {applied && (
          <span className="text-[12.5px]" style={{ ...sans, color: C.fgSoft }}>
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
        sub="Elk certificaat een eigen frame — status met label én icoon, nooit op kleur alleen."
      />

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, color } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 px-3.5 py-3"
              style={{ background: `${color}14`, border: `1.5px solid ${color}`, borderRadius: 3 }}
            >
              <Icon size={16} strokeWidth={2.4} style={{ color }} aria-hidden="true" />
              <span className="text-[12px] font-bold" style={{ ...sans, color: C.ink }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Cell className="mb-6 flex items-start gap-4 p-5">
        <ShieldCheck
          size={24}
          strokeWidth={2.2}
          style={{ color: C.green }}
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        />
        <div>
          <div className="text-[15px] font-bold" style={{ ...display, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-1 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Cell>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Certificaten</Kicker>
          </div>
          <div className="space-y-3">
            {CREDENTIALS.map((c) => {
              const done = checked.has(c.naam);
              return (
                <Cell key={c.naam} className="flex items-center gap-4 p-4">
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${C.ink}`,
                      background: done ? C.ink : "transparent",
                      color: C.paper,
                      borderRadius: 2,
                    }}
                  >
                    {done && <Check size={13} strokeWidth={2.8} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold" style={{ ...sans, color: C.ink }}>
                      {c.naam}
                    </div>
                    <div className="text-[12px]" style={{ ...sans, color: C.muted }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusPill status={c.status} />
                </Cell>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Kicker tone="muted">Documenten</Kicker>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-7 w-7 items-center justify-center ${RING}`}
              style={{ color: C.ink, border: `1.5px solid ${C.ink}`, borderRadius: 3 }}
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
                className={`px-3 py-1 text-[11px] font-bold uppercase tracking-[0.04em] transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? C.paper : C.ink,
                  background: feedState === s ? C.ink : "transparent",
                  border: `1.5px solid ${C.ink}`,
                  borderRadius: 3,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <div className="space-y-3" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Cell key={i} className="p-4">
                  <div
                    className="h-3 w-2/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </Cell>
              ))}
            </div>
          )}

          {feedState === "error" && (
            <Cell
              className="flex flex-col items-center gap-2 px-4 py-10 text-center"
              style={{ borderColor: C.accent }}
            >
              <XCircle size={26} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
              <div className="text-[15px] font-bold" style={{ ...display, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.fgSoft }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <AccentButton onClick={() => setFeedState("ok")}>Opnieuw proberen</AccentButton>
              </div>
            </Cell>
          )}

          {feedState === "ok" && (
            <div className="space-y-3">
              {DOCUMENTEN.map((d) => (
                <Cell key={d.naam} className="flex items-center gap-3 p-3.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{ ...mono, color: C.paper, background: C.ink, borderRadius: 2 }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12.5px] font-bold"
                      style={{ ...sans, color: C.ink }}
                    >
                      {d.naam}
                    </div>
                    <div className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
                      {d.grootte} · {d.bijgewerkt}
                    </div>
                  </div>
                  <StatusPill status={d.status} />
                </Cell>
              ))}
            </div>
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
        screenKey="acties"
        title="Acties"
        sub="Wat vandaag draait — frame voor frame afgevinkt."
      />

      {openCount === 0 ? (
        <Cell className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Check size={30} strokeWidth={2.4} style={{ color: C.green }} aria-hidden="true" />
          <h3 className="text-[22px] font-bold tracking-tight" style={{ ...display, color: C.ink }}>
            Alles afgerond
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Niets meer te doen vandaag. De strip is leeg.
          </p>
        </Cell>
      ) : (
        <>
          <div className="mb-6 flex items-baseline gap-3">
            <span
              className="text-[38px] font-bold tabular-nums leading-none"
              style={{ ...display, color: C.accent }}
            >
              {String(openCount).padStart(2, "0")}
            </span>
            <span
              className="text-[12px] font-semibold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.muted }}
            >
              {openCount === 1 ? "actie open" : "acties open"}
            </span>
          </div>

          <div className="space-y-3">
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <Cell key={a.titel} className="flex items-start gap-4 p-5">
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${C.ink}`,
                      background: isDone ? C.ink : "transparent",
                      color: C.paper,
                      borderRadius: 2,
                    }}
                  >
                    {isDone && <Check size={13} strokeWidth={2.8} aria-hidden="true" />}
                  </button>
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[10px] font-bold tabular-nums"
                    style={{
                      ...mono,
                      color: isDone ? C.faint : C.paper,
                      background: isDone ? "transparent" : warn ? C.accent : C.ink,
                      border: isDone ? `1.5px solid ${C.line}` : "none",
                      borderRadius: 2,
                    }}
                    aria-hidden="true"
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
                      style={{ ...sans, color: C.fgSoft, opacity: isDone ? 0.5 : 1 }}
                    >
                      {a.detail}
                    </p>
                    {!isDone && (
                      <span
                        className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.03em]"
                        style={{ ...sans, color: warn ? C.accent : C.ink }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </Cell>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Facturen() {
  const statusColor = (status: string): string =>
    status === "Openstaand" ? C.accent : status === "Concept" ? C.muted : C.green;
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Facturen"
        sub="Overzichtelijk en zonder gedoe — je weet altijd waar je aan toe bent."
      />

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", color: C.green },
          { label: "Openstaand", value: "€ 1.350", color: C.accent },
          { label: "Concept", value: "€ 880", color: C.ink },
        ].map((s) => (
          <Cell key={s.label} className="p-5">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.muted }}
            >
              {s.label}
            </div>
            <div
              className="mt-2 text-[26px] font-bold tabular-nums"
              style={{ ...display, color: s.color }}
            >
              {s.value}
            </div>
          </Cell>
        ))}
      </div>

      <Cell className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.ink}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ ...mono, color: C.muted, textAlign: i >= 3 ? "right" : "left" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => (
                <tr
                  key={f.nr}
                  className="transition-colors"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.paperSoft)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td
                    className="px-4 py-4 text-[12.5px] font-bold tabular-nums"
                    style={{ ...mono, color: C.accent }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-4 text-[13px]" style={{ ...sans, color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-4 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-4 py-4 text-right text-[13px] font-bold tabular-nums"
                    style={{ ...sans, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.04em]"
                      style={{ ...sans, color: statusColor(f.status) }}
                    >
                      <span
                        className="h-2 w-2"
                        style={{ background: statusColor(f.status), borderRadius: 1 }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: `1.5px solid ${C.ink}` }}>
                <td
                  className="px-4 py-4 text-[11px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.muted }}
                  colSpan={3}
                >
                  Totaal
                </td>
                <td
                  className="px-4 py-4 text-right text-[15px] font-bold tabular-nums"
                  style={{ ...display, color: C.ink }}
                >
                  € 7.782
                </td>
                <td className="px-4 py-4" />
              </tr>
            </tbody>
          </table>
        </div>
      </Cell>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept300() {
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
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center" aria-hidden="true">
              <ZoetropeDrum value={30} size={44} slots={12} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[19px] font-bold tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Zoötroop
              </div>
              <div
                className="text-[9px] font-semibold uppercase tracking-[0.26em]"
                style={{ ...mono, color: C.muted }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-bold" style={{ ...sans, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...sans, color: C.fgSoft }}
              >
                <ShieldCheck
                  size={12}
                  strokeWidth={2}
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-10 w-10 items-center justify-center text-[12px] font-bold"
              style={{ ...display, color: C.paper, background: C.ink, borderRadius: 3 }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        {/* Filmstrip nav — perforated rail of frame tabs. */}
        <nav className="mb-8 overflow-x-auto" aria-label="Hoofdnavigatie">
          <div
            className="flex items-stretch gap-1 p-1"
            style={{ background: C.drum, borderRadius: 5 }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-2 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.03em] transition-colors ${RING}`}
                  style={{
                    ...sans,
                    color: on ? C.ink : C.paperSoft,
                    background: on ? C.paper : "transparent",
                    borderRadius: 3,
                  }}
                >
                  <span
                    className="text-[9px] font-bold tabular-nums"
                    style={{ ...mono, color: on ? C.accent : C.faint }}
                  >
                    {SCREEN_INDEX[s.key]}
                  </span>
                  {s.label}
                </button>
              );
            })}
          </div>
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

        <div className="mt-9 h-px w-full" style={{ background: C.line }} aria-hidden="true" />
        <footer
          className="flex flex-wrap items-center justify-between gap-2 pt-4 text-[10.5px]"
          style={{ ...mono, color: C.muted }}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2 w-2"
              style={{ background: C.accent, borderRadius: 1 }}
              aria-hidden="true"
            />
            {SCREENS.length} schermen · zoötroop v300
          </span>
          <span className="uppercase tracking-[0.14em]">Frames · trommel · beweging</span>
        </footer>
      </div>
    </div>
  );
}
