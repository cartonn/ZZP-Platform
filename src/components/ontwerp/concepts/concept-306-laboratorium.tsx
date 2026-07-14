"use client";

// Concept 306 — "Laboratorium" · chemie-lab / periodiek systeem.
// Signature: statussen en credentials als element-tegels (periodiek-systeem-look met symbool
// + atoomnummer), fijne meetschalen/titratie-accenten, laboratoriumglas-motieven. Precies,
// wetenschappelijk, klinisch-fris (koel wit + één reagent-accent violet). Match = titratie-
// meting op een graduele schaal; status met symbool, label én icoon, nooit op kleur alleen.
// Fonts: display --font-lab-plex (mono-achtig) · tekst --font-lab-inter · cijfers --font-lab-mono.

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
  ShieldCheck,
  Plus,
  Minus,
  FlaskConical,
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

// Clinical cool white, ink, one reagent-violet accent.
const C = {
  bg: "#eef1f4",
  bgDeep: "#e2e8ec",
  card: "#f9fbfc",
  ink: "#131a1f",
  fg: "#2b333a",
  fgSoft: "#59646d",
  muted: "#88949c",
  faint: "#b4bec6",
  line: "#d5dde3",
  lineSoft: "#e5eaee",
  accent: "#6a45d9",
  accentSoft: "#8367e0",
  accentDeep: "#5333bf",
  accentWash: "#ece8fb",
  green: "#12876e",
  amber: "#b07d1c",
  rose: "#c0405b",
};

const display = { fontFamily: "var(--font-lab-plex), ui-monospace, monospace" };
const sans = { fontFamily: "var(--font-lab-inter), Helvetica, Arial, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6a45d9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef1f4]";

// ---- Lab primitives ---------------------------------------------------------

// A periodic-table element tile — atomic number, symbol, name. The load-bearing motif.
function ElementTile({
  symbol,
  number,
  name,
  color = C.ink,
  size = 56,
}: {
  symbol: string;
  number: string;
  name?: string;
  color?: string;
  size?: number;
}) {
  return (
    <div
      className="relative flex shrink-0 flex-col items-center justify-center"
      style={{
        width: size,
        height: size,
        background: C.card,
        border: `1.5px solid ${color}`,
        borderRadius: 6,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute left-1 top-0.5 text-[8px] font-semibold tabular-nums"
        style={{ ...mono, color: C.muted }}
      >
        {number}
      </span>
      <span className="text-[18px] font-semibold leading-none" style={{ ...display, color }}>
        {symbol}
      </span>
      {name && (
        <span
          className="absolute bottom-0.5 text-[6.5px] font-medium uppercase tracking-[0.08em]"
          style={{ ...sans, color: C.muted }}
        >
          {name}
        </span>
      )}
    </div>
  );
}

// A titration / graduated measuring scale — value read on a ruled bar with tick marks.
function MeasureBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-baseline justify-between">
        {label && (
          <span
            className="text-[9px] font-semibold uppercase tracking-[0.18em]"
            style={{ ...mono, color: C.muted }}
          >
            {label}
          </span>
        )}
        <span
          className="text-[12px] font-bold tabular-nums"
          style={{ ...mono, color: C.accentDeep }}
        >
          {value}
          <span style={{ color: C.muted }}>%</span>
        </span>
      </div>
      <div
        className="relative h-3 w-full overflow-hidden"
        style={{ background: C.bgDeep, border: `1px solid ${C.line}`, borderRadius: 3 }}
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ? `${label}: ${value}%` : `${value}%`}
      >
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-700"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${C.accentSoft}, ${C.accent})`,
          }}
        />
        {/* graduated ticks */}
        <div
          className="absolute inset-0 flex items-stretch justify-between px-[1px]"
          aria-hidden="true"
        >
          {Array.from({ length: 11 }).map((_, i) => (
            <span
              key={i}
              style={{ width: 1, background: i % 5 === 0 ? C.faint : C.lineSoft, opacity: 0.7 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Kicker({ children, tone = "accent" }: { children: ReactNode; tone?: "accent" | "muted" }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-[0.24em]"
      style={{ ...mono, color: tone === "accent" ? C.accentDeep : C.muted }}
    >
      {children}
    </span>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  color: string;
  symbol: string;
  number: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: BadgeCheck,
        color: C.green,
        symbol: "Vf",
        number: "01",
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Hourglass,
        color: C.amber,
        symbol: "Bo",
        number: "02",
      };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        Icon: TriangleAlert,
        color: C.rose,
        symbol: "Vl",
        number: "03",
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.rose, symbol: "Af", number: "04" };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, color } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold"
      style={{
        ...sans,
        color,
        background: `${color}14`,
        border: `1px solid ${color}40`,
        borderRadius: 4,
      }}
    >
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </span>
  );
}

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
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12.5px] font-semibold transition-all duration-150 ${RING} ${className ?? ""}`}
      style={{ ...sans, color: C.card, background: hot ? C.accentDeep : C.accent, borderRadius: 5 }}
    >
      {children}
    </button>
  );
}

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
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-[12.5px] font-semibold transition-colors duration-150 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: on ? C.card : C.ink,
        background: on ? C.ink : "transparent",
        border: `1px solid ${on ? C.ink : C.line}`,
        borderRadius: 5,
      }}
    >
      {children}
    </button>
  );
}

function Panel({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, ...style }}
    >
      {children}
    </div>
  );
}

function ScreenHead({ title, sub, code }: { title: string; sub?: string; code: string }) {
  return (
    <div className="mb-9">
      <div className="mb-3 flex items-center gap-3">
        <span
          className="inline-flex h-6 items-center gap-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.16em]"
          style={{ ...mono, color: C.accentDeep, background: C.accentWash, borderRadius: 4 }}
        >
          <FlaskConical size={11} strokeWidth={2.2} aria-hidden="true" />
          {code}
        </span>
        <div className="h-px flex-1" style={{ background: C.line }} aria-hidden="true" />
      </div>
      <h1
        className="text-[30px] font-semibold leading-[1.05] tracking-tight sm:text-[40px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-3 max-w-xl text-[14px] leading-relaxed"
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
      <Panel className="mb-8 overflow-hidden">
        <div
          className="flex items-center gap-2 px-5 py-2"
          style={{ background: C.ink }}
          aria-hidden="true"
        >
          {[C.accent, C.green, C.amber, C.rose].map((c, i) => (
            <span key={i} className="h-1.5 w-1.5" style={{ background: c, borderRadius: 999 }} />
          ))}
          <span
            className="ml-2 text-[9px] font-semibold uppercase tracking-[0.2em]"
            style={{ ...mono, color: C.faint }}
          >
            Analyse · sessie {PROFIEL.initialen}
          </span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-6 p-6 sm:p-8">
          <div className="min-w-0">
            <div className="mb-3">
              <Kicker>
                {PROFIEL.plaats} · {PROFIEL.rol}
              </Kicker>
            </div>
            <h1
              className="text-[34px] font-semibold leading-[0.98] tracking-tight sm:text-[46px]"
              style={{ ...display, color: C.ink }}
            >
              Goedemorgen,
              <br />
              {voornaam}.
            </h1>
            <p
              className="mt-4 max-w-md text-[14px] leading-relaxed"
              style={{ ...sans, color: C.fgSoft }}
            >
              Je week onder de microscoop: elke match, deadline en credential gemeten en gewogen. We
              tonen alleen wat telt — precies, zonder ruis.
            </p>
            <div className="mt-5">
              <span
                className="inline-flex items-center gap-2 px-3 py-2"
                style={{ background: C.accentWash, borderRadius: 5 }}
              >
                <ShieldCheck
                  size={15}
                  strokeWidth={2}
                  style={{ color: C.accentDeep }}
                  aria-hidden
                />
                <span
                  className="text-[12px] font-semibold"
                  style={{ ...sans, color: C.accentDeep }}
                >
                  {PROFIEL.trust}
                </span>
              </span>
            </div>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group w-full max-w-[248px] text-left ${RING}`}
            style={{ borderRadius: 8 }}
            aria-label={`Open beste match: ${top.titel}`}
          >
            <div
              className="p-4"
              style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8 }}
            >
              <div className="flex items-center gap-3">
                <ElementTile symbol="Ma" number="Mt" name="match" color={C.accent} size={48} />
                <div className="min-w-0">
                  <div
                    className="text-[9px] font-semibold uppercase tracking-[0.18em]"
                    style={{ ...mono, color: C.muted }}
                  >
                    Beste match
                  </div>
                  <div
                    className="mt-0.5 truncate text-[14px] font-semibold"
                    style={{ ...display, color: C.ink }}
                  >
                    {top.titel}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <MeasureBar value={top.match} label="Meting" />
              </div>
              <div
                className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold transition-transform group-hover:translate-x-0.5"
                style={{ ...sans, color: C.accentDeep }}
              >
                Analyse openen
                <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
              </div>
            </div>
          </button>
        </div>
      </Panel>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.muted }}
              >
                {k.label}
              </span>
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ ...mono, color: k.up ? C.green : C.rose }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-3 text-[24px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </div>
            <div
              className="mt-3.5 flex items-end gap-[3px]"
              aria-hidden="true"
              style={{ height: 22 }}
            >
              {k.spark.slice(-7).map((v, i, arr) => {
                const max = Math.max(...arr);
                const min = Math.min(...arr);
                const h = 4 + ((v - min) / (max - min || 1)) * 18;
                return (
                  <span
                    key={i}
                    className="flex-1"
                    style={{
                      height: h,
                      background: i === arr.length - 1 ? C.accent : C.faint,
                      borderRadius: 1,
                    }}
                  />
                );
              })}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Monsters · matches</Kicker>
          </div>
          <div className="space-y-3">
            {OPDRACHTEN.map((o, i) => (
              <button
                key={o.id}
                onClick={() => onOpen(o)}
                className={`group block w-full text-left ${RING}`}
                style={{ borderRadius: 8 }}
              >
                <Panel
                  className="flex items-center gap-4 p-4 transition-colors group-hover:border-[color:var(--acc)]"
                  style={{ ["--acc" as string]: C.accent }}
                >
                  <ElementTile
                    symbol={o.titel.slice(0, 2)}
                    number={String(i + 1).padStart(2, "0")}
                    color={C.accent}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] tabular-nums" style={{ ...mono, color: C.muted }}>
                      {o.id}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[16px] font-semibold leading-tight"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div className="mt-0.5 text-[12.5px]" style={{ ...sans, color: C.fgSoft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-3 max-w-[220px]">
                      <MeasureBar value={o.match} label="Match" />
                    </div>
                  </div>
                  <ArrowRight
                    size={17}
                    className="shrink-0 transition-transform group-hover:translate-x-1"
                    style={{ color: C.accent }}
                    aria-hidden="true"
                  />
                </Panel>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3">
            <Kicker tone="muted">Reacties · vraagt aandacht</Kicker>
          </div>
          <div className="space-y-3">
            {ACTIES.map((a) => {
              const warn = a.urgentie === "warning";
              return (
                <Panel key={a.titel} className="p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center"
                      style={{ background: warn ? `${C.rose}18` : C.accentWash, borderRadius: 6 }}
                      aria-hidden="true"
                    >
                      <FlaskConical
                        size={14}
                        strokeWidth={2}
                        style={{ color: warn ? C.rose : C.accentDeep }}
                      />
                    </span>
                    <div className="min-w-0">
                      <div
                        className="text-[13px] font-semibold leading-snug"
                        style={{ ...sans, color: C.ink }}
                      >
                        {a.titel}
                      </div>
                      <div
                        className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold"
                        style={{ ...sans, color: warn ? C.rose : C.accentDeep }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </Panel>
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
        code="Marktplaats · lab-02"
        title="Marktplaats"
        sub="Elke opdracht als monster in de reeks — mét de redenen waarom ze past of schuurt."
      />

      <Panel className="mb-6 flex items-center gap-3 px-4 py-3">
        <Search size={16} className="shrink-0" style={{ color: C.accentDeep }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-50"
          style={{ ...sans, color: C.ink }}
        />
        <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`px-2 py-0.5 text-[11px] font-semibold ${RING}`}
            style={{ ...sans, color: C.accentDeep, borderRadius: 4 }}
          >
            Wis
          </button>
        )}
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <FlaskConical
            size={30}
            strokeWidth={1.6}
            style={{ color: C.accent }}
            aria-hidden="true"
          />
          <h3
            className="text-[22px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Geen monster gevonden
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="mt-1">
            <LineButton onClick={() => setQuery("")}>Filter wissen</LineButton>
          </div>
        </Panel>
      ) : (
        <div className="space-y-4">
          {filtered.map((o, idx) => {
            const isSaved = saved.has(o.id);
            return (
              <Panel
                key={o.id}
                className="p-5 transition-colors hover:border-[color:var(--acc)]"
                style={{ ["--acc" as string]: C.accent }}
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <ElementTile
                    symbol={o.titel.slice(0, 2)}
                    number={String(idx + 1).padStart(2, "0")}
                    name="opdracht"
                    color={C.accent}
                    size={64}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1">
                      <Kicker>{o.id}</Kicker>
                    </div>
                    <h3
                      className="text-[19px] font-semibold leading-tight"
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
                            aria-hidden
                          />
                          {m.v}
                        </div>
                      ))}
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-0.5 text-[11px] font-medium"
                          style={{
                            ...sans,
                            color: C.fg,
                            border: `1px solid ${C.line}`,
                            borderRadius: 4,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="sm:w-48 sm:shrink-0">
                    <MeasureBar value={o.match} label="Match" />
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => toggleSave(o.id)}
                        aria-pressed={isSaved}
                        aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                        className={`flex h-10 w-10 shrink-0 items-center justify-center transition-colors ${RING}`}
                        style={{
                          color: isSaved ? C.card : C.ink,
                          background: isSaved ? C.ink : "transparent",
                          border: `1px solid ${isSaved ? C.ink : C.line}`,
                          borderRadius: 5,
                        }}
                      >
                        {isSaved ? (
                          <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                        ) : (
                          <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
                        )}
                      </button>
                      <AccentButton onClick={() => onOpen(o)} className="flex-1">
                        Bekijk
                        <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                      </AccentButton>
                    </div>
                  </div>
                </div>
              </Panel>
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

      <Panel className="mb-6 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <ElementTile
                symbol={opdracht.titel.slice(0, 2)}
                number="Op"
                name="opdracht"
                color={C.accent}
                size={68}
              />
              <div className="min-w-0">
                <div className="mb-2">
                  <Kicker>{opdracht.id}</Kicker>
                </div>
                <h2
                  className="text-[28px] font-semibold leading-[1.05] tracking-tight sm:text-[38px]"
                  style={{ ...display, color: C.ink }}
                >
                  {opdracht.titel}
                </h2>
                <div className="mt-2 text-[14px]" style={{ ...sans, color: C.fgSoft }}>
                  {opdracht.opdrachtgever} · {opdracht.plaats}
                </div>
              </div>
            </div>
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

          <div className="mt-6 max-w-sm">
            <MeasureBar value={opdracht.match} label="Match met je profiel" />
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
                style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 6 }}
              >
                <m.Icon
                  size={15}
                  strokeWidth={2}
                  style={{ color: C.accentDeep }}
                  aria-hidden="true"
                />
                <div
                  className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.muted }}
                >
                  {m.label}
                </div>
                <div className="mt-0.5 text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.green, borderRadius: 5 }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={3} style={{ color: C.card }} />
            </span>
            <span className="text-[13px] font-semibold" style={{ ...sans, color: C.ink }}>
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
                  aria-hidden
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.rose, borderRadius: 5 }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={3} style={{ color: C.card }} />
            </span>
            <span className="text-[13px] font-semibold" style={{ ...sans, color: C.ink }}>
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
                  style={{ color: C.rose }}
                  aria-hidden
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
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
        code="Verificatie · lab-03"
        title="Verificatie"
        sub="Elk certificaat een element in de reeks — status met symbool, label én icoon, nooit op kleur alleen."
      />

      {/* Status legend as element tiles — the periodic-table signature. */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, color, symbol, number } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-3 p-3"
              style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8 }}
            >
              <ElementTile symbol={symbol} number={number} color={color} size={44} />
              <div className="min-w-0">
                <div
                  className="flex items-center gap-1.5 text-[12px] font-semibold"
                  style={{ ...sans, color: C.ink }}
                >
                  <Icon size={13} strokeWidth={2.2} style={{ color }} aria-hidden="true" />
                  {label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Panel
        className="mb-6 flex items-start gap-4 p-5"
        style={{ background: C.accentWash, borderColor: `${C.accent}30` }}
      >
        <ShieldCheck
          size={24}
          strokeWidth={2}
          style={{ color: C.accentDeep }}
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        />
        <div>
          <div className="text-[15px] font-semibold" style={{ ...display, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-1 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Certificaten</Kicker>
          </div>
          <div className="space-y-3">
            {CREDENTIALS.map((c) => {
              const done = checked.has(c.naam);
              const meta = statusMeta(c.status);
              return (
                <Panel key={c.naam} className="flex items-center gap-4 p-4">
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${done ? C.accentDeep : C.line}`,
                      background: done ? C.accentDeep : "transparent",
                      color: C.card,
                      borderRadius: 5,
                    }}
                  >
                    {done && <Check size={13} strokeWidth={2.8} aria-hidden="true" />}
                  </button>
                  <ElementTile
                    symbol={meta.symbol}
                    number={meta.number}
                    color={meta.color}
                    size={44}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
                      {c.naam}
                    </div>
                    <div className="text-[12px]" style={{ ...sans, color: C.muted }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusPill status={c.status} />
                </Panel>
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
              style={{ color: C.ink, border: `1px solid ${C.line}`, borderRadius: 5 }}
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
                className={`px-3 py-1 text-[11px] font-semibold transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? C.card : C.ink,
                  background: feedState === s ? C.ink : "transparent",
                  border: `1px solid ${feedState === s ? C.ink : C.line}`,
                  borderRadius: 5,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <div className="space-y-3" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Panel key={i} className="p-4">
                  <div
                    className="h-3 w-2/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </Panel>
              ))}
            </div>
          )}

          {feedState === "error" && (
            <Panel
              className="flex flex-col items-center gap-2 px-4 py-10 text-center"
              style={{ borderColor: C.rose }}
            >
              <XCircle size={26} strokeWidth={2} style={{ color: C.rose }} aria-hidden="true" />
              <div className="text-[15px] font-semibold" style={{ ...display, color: C.ink }}>
                Meting mislukt
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.fgSoft }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <AccentButton onClick={() => setFeedState("ok")}>Opnieuw proberen</AccentButton>
              </div>
            </Panel>
          )}

          {feedState === "ok" && (
            <div className="space-y-3">
              {DOCUMENTEN.map((d) => (
                <Panel key={d.naam} className="flex items-center gap-3 p-3.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{ ...mono, color: C.card, background: C.ink, borderRadius: 5 }}
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
                </Panel>
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
        code="Acties · lab-04"
        title="Acties"
        sub="Wat vandaag op de agenda staat — stap voor stap afgevinkt."
      />

      {openCount === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Check size={30} strokeWidth={2.4} style={{ color: C.green }} aria-hidden="true" />
          <h3
            className="text-[22px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Reeks voltooid
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Niets meer te doen vandaag. Alle metingen zijn afgerond.
          </p>
        </Panel>
      ) : (
        <>
          <div className="mb-6 flex items-baseline gap-3">
            <span
              className="text-[40px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.accentDeep }}
            >
              {openCount}
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
                <Panel key={a.titel} className="flex items-start gap-4 p-5">
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${isDone ? C.accentDeep : C.line}`,
                      background: isDone ? C.accentDeep : "transparent",
                      color: C.card,
                      borderRadius: 5,
                    }}
                  >
                    {isDone && <Check size={13} strokeWidth={2.8} aria-hidden="true" />}
                  </button>
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center text-[11px] font-bold tabular-nums"
                    style={{
                      ...mono,
                      color: isDone ? C.faint : C.card,
                      background: isDone ? "transparent" : warn ? C.rose : C.ink,
                      border: isDone ? `1px solid ${C.line}` : "none",
                      borderRadius: 5,
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
                        className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold"
                        style={{ ...sans, color: warn ? C.rose : C.accentDeep }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </Panel>
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
    status === "Openstaand" ? C.rose : status === "Concept" ? C.muted : C.green;
  return (
    <div>
      <ScreenHead
        code="Facturen · lab-05"
        title="Facturen"
        sub="Overzichtelijk en zonder gedoe — je weet altijd waar je aan toe bent."
      />

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", color: C.green },
          { label: "Openstaand", value: "€ 1.350", color: C.rose },
          { label: "Concept", value: "€ 880", color: C.ink },
        ].map((s) => (
          <Panel key={s.label} className="p-5">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.muted }}
            >
              {s.label}
            </div>
            <div
              className="mt-2 text-[26px] font-semibold tabular-nums"
              style={{ ...display, color: s.color }}
            >
              {s.value}
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.ink}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em]"
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
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td
                    className="px-4 py-4 text-[12.5px] font-bold tabular-nums"
                    style={{ ...mono, color: C.accentDeep }}
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
                    className="px-4 py-4 text-right text-[13px] font-semibold tabular-nums"
                    style={{ ...sans, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold"
                      style={{ ...sans, color: statusColor(f.status) }}
                    >
                      <span
                        className="h-2 w-2"
                        style={{ background: statusColor(f.status), borderRadius: 999 }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: `1.5px solid ${C.ink}` }}>
                <td
                  className="px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.muted }}
                  colSpan={3}
                >
                  Totaal
                </td>
                <td
                  className="px-4 py-4 text-right text-[15px] font-semibold tabular-nums"
                  style={{ ...display, color: C.ink }}
                >
                  € 7.782
                </td>
                <td className="px-4 py-4" />
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept306() {
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
      style={{ ...sans, color: C.fg, background: C.bg }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center"
              style={{ background: C.accent, borderRadius: 8 }}
              aria-hidden="true"
            >
              <FlaskConical size={20} strokeWidth={2} style={{ color: C.card }} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[20px] font-semibold tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Laboratorium
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
              <div className="text-[12.5px] font-semibold" style={{ ...sans, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...sans, color: C.fgSoft }}
              >
                <ShieldCheck
                  size={12}
                  strokeWidth={2}
                  style={{ color: C.accentDeep }}
                  aria-hidden
                />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-10 w-10 items-center justify-center text-[12px] font-semibold"
              style={{ ...display, color: C.card, background: C.ink, borderRadius: 8 }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        {/* Element-tab nav — each screen a labelled specimen. */}
        <nav className="mb-8 overflow-x-auto" aria-label="Hoofdnavigatie">
          <div
            className="flex items-stretch gap-1 p-1"
            style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8 }}
          >
            {SCREENS.map((s, i) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-2 px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${RING}`}
                  style={{
                    ...sans,
                    color: on ? C.card : C.fgSoft,
                    background: on ? C.ink : "transparent",
                    borderRadius: 5,
                  }}
                >
                  <span
                    className="text-[8.5px] font-bold tabular-nums"
                    style={{ ...mono, color: on ? C.accentSoft : C.faint }}
                  >
                    {String(i + 1).padStart(2, "0")}
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
              style={{ background: C.accent, borderRadius: 999 }}
              aria-hidden="true"
            />
            {SCREENS.length} schermen · laboratorium v306
          </span>
          <span className="uppercase tracking-[0.14em]">Element · meting · precisie</span>
        </footer>
      </div>
    </div>
  );
}
