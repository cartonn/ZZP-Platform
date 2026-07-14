"use client";

// Concept 304 — "Zoutvlak" · woestijn-zoutvlakte minimalisme (calm interface).
// Signature: enorme rust en witruimte. Warme zand/klei-neutralen met één ingetogen
// mirage-accent (bleek turquoise). Vlakke horizon-lijnen, veel lucht, subtiele
// scheidingslijnen. Luxe door leegte en typografische rust — geen decoratie, alleen
// wat telt. Match/voortgang als kalme horizon-meter; status met label én icoon.
// Fonts: display --font-lab-cormorant · tekst --font-lab-jakarta · cijfers --font-lab-mono.

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
  Sun,
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

// Warm salt-flat palette. Clay and sand, a single pale turquoise "mirage" accent.
const C = {
  sand: "#efe9df",
  sandDeep: "#e7dfd0",
  card: "#f8f4ec",
  ink: "#2b2924",
  fg: "#4a453d",
  fgSoft: "#746c5f",
  muted: "#9c9485",
  faint: "#c5bdac",
  line: "#ddd5c5",
  lineSoft: "#e9e2d4",
  mirage: "#5fa79d",
  mirageDeep: "#3f867d",
  mirageSoft: "#a9d2cc",
  mirageWash: "#e4efec",
  green: "#6f9a5c",
  amber: "#bf9540",
  rose: "#bd7259",
};

const display = { fontFamily: "var(--font-lab-cormorant), Georgia, serif" };
const sans = { fontFamily: "var(--font-lab-jakarta), Helvetica, Arial, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f867d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe9df]";

// ---- Primitives -------------------------------------------------------------

// A thin horizon line — the load-bearing motif of the salt flat: flat, calm, endless.
function Horizon({ tone = C.line }: { tone?: string }) {
  return <div className="h-px w-full" style={{ background: tone }} aria-hidden="true" />;
}

// A calm horizontal meter — a distant water line across the flat. Value fills from the left.
function SaltMeter({ value, label }: { value: number; label?: string }) {
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-baseline justify-between">
        {label && (
          <span
            className="text-[10px] font-medium uppercase tracking-[0.2em]"
            style={{ ...mono, color: C.muted }}
          >
            {label}
          </span>
        )}
        <span className="text-[13px] font-semibold tabular-nums" style={{ ...mono, color: C.ink }}>
          {value}
          <span style={{ color: C.muted }}>%</span>
        </span>
      </div>
      <div
        className="relative h-1.5 w-full overflow-hidden"
        style={{ background: C.sandDeep, borderRadius: 999 }}
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
            background: `linear-gradient(90deg, ${C.mirageSoft}, ${C.mirage})`,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}

function Kicker({ children, tone = "mirage" }: { children: ReactNode; tone?: "mirage" | "muted" }) {
  return (
    <span
      className="text-[10px] font-medium uppercase tracking-[0.32em]"
      style={{ ...mono, color: tone === "mirage" ? C.mirageDeep : C.muted }}
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
      return { label: "Verloopt bijna", Icon: TriangleAlert, color: C.rose };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.rose };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, color } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...sans, color, background: `${color}14`, borderRadius: 999 }}
    >
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </span>
  );
}

// Filled mirage primary — soft, understated.
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
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold transition-all duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: C.card,
        background: hot ? C.mirageDeep : C.mirage,
        borderRadius: 999,
      }}
    >
      {children}
    </button>
  );
}

// Ghost secondary — hairline outline that warms on hover.
function GhostButton({
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
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-[13px] font-semibold transition-colors duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: on ? C.ink : C.fgSoft,
        background: on ? C.sandDeep : "transparent",
        border: `1px solid ${on ? C.line : C.lineSoft}`,
        borderRadius: 999,
      }}
    >
      {children}
    </button>
  );
}

// A calm card — airy, hairline border, generous radius.
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
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function ScreenHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-10">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-px w-8" style={{ background: C.mirage }} aria-hidden="true" />
        <Kicker>Zoutvlak</Kicker>
      </div>
      <h1
        className="text-[38px] font-normal leading-[1.02] tracking-tight sm:text-[52px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-4 max-w-xl text-[14.5px] leading-relaxed"
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
      {/* Hero — vast air, a single greeting, the best match as a calm horizon. */}
      <div className="mb-14 pt-2">
        <div className="mb-5 flex items-center gap-3">
          <Sun size={15} strokeWidth={1.8} style={{ color: C.mirageDeep }} aria-hidden="true" />
          <Kicker>
            {PROFIEL.plaats} · {PROFIEL.rol}
          </Kicker>
        </div>
        <h1
          className="text-[46px] font-normal leading-[0.98] tracking-tight sm:text-[68px]"
          style={{ ...display, color: C.ink }}
        >
          Goedemorgen, {voornaam}.
        </h1>
        <p
          className="mt-6 max-w-lg text-[15px] leading-relaxed"
          style={{ ...sans, color: C.fgSoft }}
        >
          Een rustige vlakte om te overzien. We tonen alleen wat telt en wat nu je aandacht vraagt —
          niets meer, met alle ruimte eromheen.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <span
            className="inline-flex items-center gap-2 px-3.5 py-2"
            style={{ background: C.mirageWash, borderRadius: 999 }}
          >
            <ShieldCheck size={15} strokeWidth={2} style={{ color: C.mirageDeep }} aria-hidden />
            <span className="text-[12.5px] font-semibold" style={{ ...sans, color: C.mirageDeep }}>
              {PROFIEL.trust}
            </span>
          </span>
          <button
            onClick={() => onOpen(top)}
            className={`inline-flex items-center gap-2 text-[13px] font-semibold ${RING}`}
            style={{ ...sans, color: C.ink, borderRadius: 999 }}
          >
            Beste match openen
            <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>

      <Horizon />

      {/* KPIs — flat, wide-spaced, mono numerals. No boxes-in-boxes. */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-10 py-12 lg:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.label}>
            <div
              className="text-[10px] font-medium uppercase tracking-[0.2em]"
              style={{ ...mono, color: C.muted }}
            >
              {k.label}
            </div>
            <div
              className="mt-3 text-[34px] font-normal tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </div>
            <div
              className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold tabular-nums"
              style={{ ...mono, color: k.up ? C.green : C.rose }}
            >
              {k.trend}
            </div>
          </div>
        ))}
      </div>

      <Horizon />

      <div className="grid grid-cols-1 gap-12 pt-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <Kicker>Matches op de horizon</Kicker>
          </div>
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o)}
                className={`group block w-full text-left ${RING}`}
                style={{ borderRadius: 16 }}
              >
                <Panel
                  className="p-6 transition-colors group-hover:border-[color:var(--acc)]"
                  style={{ ["--acc" as string]: C.mirage }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
                        {o.id}
                      </div>
                      <div
                        className="mt-1 truncate text-[21px] font-normal leading-tight"
                        style={{ ...display, color: C.ink }}
                      >
                        {o.titel}
                      </div>
                      <div className="mt-1 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </div>
                    </div>
                    <ArrowRight
                      size={18}
                      className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
                      style={{ color: C.mirageDeep }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-5">
                    <SaltMeter value={o.match} label="Match" />
                  </div>
                </Panel>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-6">
            <Kicker tone="muted">Vraagt aandacht</Kicker>
          </div>
          <div className="space-y-6">
            {ACTIES.map((a) => {
              const warn = a.urgentie === "warning";
              return (
                <div key={a.titel}>
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0"
                      style={{ background: warn ? C.rose : C.mirage, borderRadius: 999 }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div
                        className="text-[14px] font-semibold leading-snug"
                        style={{ ...sans, color: C.ink }}
                      >
                        {a.titel}
                      </div>
                      <div
                        className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-semibold"
                        style={{ ...sans, color: warn ? C.rose : C.mirageDeep }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5">
                    <Horizon tone={C.lineSoft} />
                  </div>
                </div>
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
        title="Marktplaats"
        sub="Elke opdracht met alle lucht eromheen — mét de redenen waarom ze past of schuurt."
      />

      <div
        className="mb-10 flex items-center gap-3 px-5 py-3.5"
        style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 999 }}
      >
        <Search size={17} className="shrink-0" style={{ color: C.mirageDeep }} aria-hidden="true" />
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
            style={{ ...sans, color: C.mirageDeep, borderRadius: 999 }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-20 text-center">
          <Sun size={30} strokeWidth={1.4} style={{ color: C.mirage }} aria-hidden="true" />
          <h3
            className="text-[26px] font-normal tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Een lege vlakte
          </h3>
          <p className="max-w-xs text-[13.5px]" style={{ ...sans, color: C.fgSoft }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="mt-2">
            <GhostButton onClick={() => setQuery("")}>Filter wissen</GhostButton>
          </div>
        </Panel>
      ) : (
        <div className="space-y-5">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <Panel
                key={o.id}
                className="p-7 transition-colors hover:border-[color:var(--acc)]"
                style={{ ["--acc" as string]: C.mirage }}
              >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5">
                      <Kicker>{o.id}</Kicker>
                    </div>
                    <h3
                      className="text-[24px] font-normal leading-tight"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-1 text-[13.5px]" style={{ ...sans, color: C.fgSoft }}>
                      {o.opdrachtgever}
                    </div>
                    <dl
                      className="mt-5 flex flex-wrap gap-x-7 gap-y-2.5 text-[12.5px]"
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
                            strokeWidth={1.8}
                            style={{ color: C.muted }}
                            aria-hidden
                          />
                          {m.v}
                        </div>
                      ))}
                    </dl>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 text-[11px] font-medium"
                          style={{
                            ...sans,
                            color: C.fg,
                            background: C.sandDeep,
                            borderRadius: 999,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="sm:w-52 sm:shrink-0">
                    <SaltMeter value={o.match} label="Match" />
                    <div className="mt-5 flex items-center gap-2">
                      <button
                        onClick={() => toggleSave(o.id)}
                        aria-pressed={isSaved}
                        aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                        className={`flex h-11 w-11 shrink-0 items-center justify-center transition-colors ${RING}`}
                        style={{
                          color: isSaved ? C.mirageDeep : C.fgSoft,
                          background: isSaved ? C.mirageWash : "transparent",
                          border: `1px solid ${isSaved ? C.mirageSoft : C.line}`,
                          borderRadius: 999,
                        }}
                      >
                        {isSaved ? (
                          <BookmarkCheck size={16} strokeWidth={2} aria-hidden="true" />
                        ) : (
                          <Bookmark size={16} strokeWidth={2} aria-hidden="true" />
                        )}
                      </button>
                      <AccentButton onClick={() => onOpen(o)} className="flex-1">
                        Bekijk
                        <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
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
      <div className="mb-8">
        <GhostButton onClick={onBack} ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
          Terug
        </GhostButton>
      </div>

      <div className="mb-10">
        <div className="mb-2">
          <Kicker>{opdracht.id}</Kicker>
        </div>
        <h2
          className="text-[36px] font-normal leading-[1.02] tracking-tight sm:text-[54px]"
          style={{ ...display, color: C.ink }}
        >
          {opdracht.titel}
        </h2>
        <div className="mt-3 text-[15px]" style={{ ...sans, color: C.fgSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </div>
        <div className="mt-8 max-w-md">
          <SaltMeter value={opdracht.match} label="Match met je profiel" />
        </div>
      </div>

      <Horizon />

      <div className="grid grid-cols-2 gap-x-8 gap-y-8 py-10 sm:grid-cols-4">
        {[
          { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
          { Icon: Clock, label: "Inzet", value: opdracht.uren },
          { Icon: Calendar, label: "Start", value: opdracht.start },
          { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
        ].map((m) => (
          <div key={m.label}>
            <m.Icon
              size={16}
              strokeWidth={1.8}
              style={{ color: C.mirageDeep }}
              aria-hidden="true"
            />
            <div
              className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.muted }}
            >
              {m.label}
            </div>
            <div className="mt-1 text-[15px] font-semibold" style={{ ...sans, color: C.ink }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <Horizon />

      <div className="grid grid-cols-1 gap-10 py-12 md:grid-cols-2">
        <div>
          <div className="mb-4 flex items-center gap-2.5">
            <span
              className="flex h-7 w-7 items-center justify-center"
              style={{ background: C.mirageWash, borderRadius: 999 }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={2.6} style={{ color: C.mirageDeep }} />
            </span>
            <span className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-3.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[14px] leading-relaxed"
                style={{ ...sans, color: C.fg }}
              >
                <Check
                  size={15}
                  strokeWidth={2.4}
                  className="mt-1 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-4 flex items-center gap-2.5">
            <span
              className="flex h-7 w-7 items-center justify-center"
              style={{ background: `${C.rose}18`, borderRadius: 999 }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={2.6} style={{ color: C.rose }} />
            </span>
            <span className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
              Even op letten
            </span>
          </div>
          <ul className="space-y-3.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[14px] leading-relaxed"
                style={{ ...sans, color: C.fg }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2}
                  className="mt-1 shrink-0"
                  style={{ color: C.rose }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Horizon />

      <div className="flex flex-wrap items-center gap-4 pt-10">
        <AccentButton
          onClick={() => setApplied((v) => !v)}
          ariaPressed={applied}
          className="px-6 py-3 text-[14px]"
        >
          {applied ? (
            <Check size={16} strokeWidth={2.4} aria-hidden="true" />
          ) : (
            <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </AccentButton>
        <GhostButton
          onClick={() => toggleSave(opdracht.id)}
          active={isSaved}
          ariaPressed={isSaved}
          ariaLabel={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
        >
          {isSaved ? (
            <BookmarkCheck size={14} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Bookmark size={14} strokeWidth={2} aria-hidden="true" />
          )}
          {isSaved ? "Bewaard" : "Bewaar"}
        </GhostButton>
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
        title="Verificatie"
        sub="Elk certificaat op zijn plek — status met label én icoon, nooit op kleur alleen."
      />

      <div
        className="mb-10 flex items-start gap-4 px-6 py-5"
        style={{ background: C.mirageWash, borderRadius: 16 }}
      >
        <ShieldCheck
          size={24}
          strokeWidth={1.8}
          style={{ color: C.mirageDeep }}
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        />
        <div>
          <div className="text-[16px] font-normal" style={{ ...display, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-1 text-[13px] leading-relaxed" style={{ ...sans, color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <Kicker>Certificaten</Kicker>
          </div>
          <div className="space-y-0">
            {CREDENTIALS.map((c, i) => {
              const done = checked.has(c.naam);
              return (
                <div key={c.naam}>
                  {i > 0 && <Horizon tone={C.lineSoft} />}
                  <div className="flex items-center gap-4 py-5">
                    <button
                      onClick={() => toggleCheck(c.naam)}
                      aria-pressed={done}
                      aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                      style={{
                        border: `1.5px solid ${done ? C.mirageDeep : C.line}`,
                        background: done ? C.mirageDeep : "transparent",
                        color: C.card,
                        borderRadius: 999,
                      }}
                    >
                      {done && <Check size={13} strokeWidth={2.6} aria-hidden="true" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold" style={{ ...sans, color: C.ink }}>
                        {c.naam}
                      </div>
                      <div className="text-[12.5px]" style={{ ...sans, color: C.muted }}>
                        {c.detail}
                      </div>
                    </div>
                    <StatusPill status={c.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-6 flex items-center justify-between">
            <Kicker tone="muted">Documenten</Kicker>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center ${RING}`}
              style={{ color: C.fgSoft, border: `1px solid ${C.line}`, borderRadius: 999 }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={13} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-6 flex gap-2" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? C.card : C.fgSoft,
                  background: feedState === s ? C.mirageDeep : "transparent",
                  border: `1px solid ${feedState === s ? C.mirageDeep : C.line}`,
                  borderRadius: 999,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <div className="space-y-4" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="py-1">
                  <div
                    className="h-3.5 w-2/3 animate-pulse"
                    style={{ background: C.lineSoft, borderRadius: 999 }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse"
                    style={{ background: C.lineSoft, borderRadius: 999 }}
                  />
                </div>
              ))}
            </div>
          )}

          {feedState === "error" && (
            <div
              className="flex flex-col items-center gap-2 px-4 py-10 text-center"
              style={{ background: `${C.rose}10`, borderRadius: 16 }}
            >
              <XCircle size={26} strokeWidth={1.8} style={{ color: C.rose }} aria-hidden="true" />
              <div className="text-[17px] font-normal" style={{ ...display, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12.5px]" style={{ ...sans, color: C.fgSoft }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <AccentButton onClick={() => setFeedState("ok")}>Opnieuw proberen</AccentButton>
              </div>
            </div>
          )}

          {feedState === "ok" && (
            <div className="space-y-0">
              {DOCUMENTEN.map((d, i) => (
                <div key={d.naam}>
                  {i > 0 && <Horizon tone={C.lineSoft} />}
                  <div className="flex items-center gap-3 py-4">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center text-[9px] font-semibold"
                      style={{ ...mono, color: C.fgSoft, background: C.sandDeep, borderRadius: 10 }}
                      aria-hidden="true"
                    >
                      {d.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[13px] font-semibold"
                        style={{ ...sans, color: C.ink }}
                      >
                        {d.naam}
                      </div>
                      <div className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
                        {d.grootte} · {d.bijgewerkt}
                      </div>
                    </div>
                    <StatusPill status={d.status} />
                  </div>
                </div>
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
      <ScreenHead title="Acties" sub="Wat vandaag telt — rustig afgevinkt, met alle ruimte." />

      {openCount === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-20 text-center">
          <Check size={30} strokeWidth={2} style={{ color: C.green }} aria-hidden="true" />
          <h3
            className="text-[26px] font-normal tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Alles afgerond
          </h3>
          <p className="max-w-xs text-[13.5px]" style={{ ...sans, color: C.fgSoft }}>
            Niets meer te doen vandaag. De vlakte is stil.
          </p>
        </Panel>
      ) : (
        <>
          <div className="mb-10 flex items-baseline gap-3">
            <span
              className="text-[52px] font-normal tabular-nums leading-none"
              style={{ ...display, color: C.mirageDeep }}
            >
              {openCount}
            </span>
            <span
              className="text-[12px] font-medium uppercase tracking-[0.2em]"
              style={{ ...mono, color: C.muted }}
            >
              {openCount === 1 ? "actie open" : "acties open"}
            </span>
          </div>

          <div className="space-y-0">
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <div key={a.titel}>
                  {i > 0 && <Horizon tone={C.lineSoft} />}
                  <div className="flex items-start gap-4 py-6">
                    <button
                      onClick={() => toggleDone(a.titel)}
                      aria-pressed={isDone}
                      aria-label={
                        isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`
                      }
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                      style={{
                        border: `1.5px solid ${isDone ? C.mirageDeep : C.line}`,
                        background: isDone ? C.mirageDeep : "transparent",
                        color: C.card,
                        borderRadius: 999,
                      }}
                    >
                      {isDone && <Check size={13} strokeWidth={2.6} aria-hidden="true" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[16px] font-semibold leading-snug"
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
                        className="mt-1 text-[13px] leading-relaxed"
                        style={{ ...sans, color: C.fgSoft, opacity: isDone ? 0.5 : 1 }}
                      >
                        {a.detail}
                      </p>
                      {!isDone && (
                        <span
                          className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-semibold"
                          style={{ ...sans, color: warn ? C.rose : C.mirageDeep }}
                        >
                          {a.cta}
                          <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                        </span>
                      )}
                    </div>
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
  const statusColor = (status: string): string =>
    status === "Openstaand" ? C.rose : status === "Concept" ? C.muted : C.green;
  return (
    <div>
      <ScreenHead
        title="Facturen"
        sub="Overzichtelijk en zonder gedoe — je weet altijd waar je aan toe bent."
      />

      <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-3">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", color: C.green },
          { label: "Openstaand", value: "€ 1.350", color: C.rose },
          { label: "Concept", value: "€ 880", color: C.ink },
        ].map((s) => (
          <div key={s.label}>
            <div
              className="text-[10px] font-medium uppercase tracking-[0.2em]"
              style={{ ...mono, color: C.muted }}
            >
              {s.label}
            </div>
            <div
              className="mt-2.5 text-[36px] font-normal tabular-nums leading-none"
              style={{ ...display, color: s.color }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <Horizon />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-2 py-4 text-[10px] font-medium uppercase tracking-[0.18em]"
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
                  style={{ borderTop: `1px solid ${C.lineSoft}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.card)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td
                    className="px-2 py-5 text-[12.5px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.mirageDeep }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-2 py-5 text-[13.5px]" style={{ ...sans, color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-2 py-5 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-2 py-5 text-right text-[14px] font-semibold tabular-nums"
                    style={{ ...sans, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-2 py-5 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold"
                      style={{ ...sans, color: statusColor(f.status) }}
                    >
                      <span
                        className="h-1.5 w-1.5"
                        style={{ background: statusColor(f.status), borderRadius: 999 }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: `1.5px solid ${C.line}` }}>
                <td
                  className="px-2 py-5 text-[11px] font-medium uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.muted }}
                  colSpan={3}
                >
                  Totaal
                </td>
                <td
                  className="px-2 py-5 text-right text-[18px] font-normal tabular-nums"
                  style={{ ...display, color: C.ink }}
                >
                  € 7.782
                </td>
                <td className="px-2 py-5" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept304() {
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
      style={{ ...sans, color: C.fg, background: C.sand }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-5xl flex-col px-5 py-8 sm:px-8 sm:py-12">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center"
              style={{ background: C.mirageWash, borderRadius: 999 }}
              aria-hidden="true"
            >
              <Sun size={18} strokeWidth={1.8} style={{ color: C.mirageDeep }} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[20px] font-normal tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Zoutvlak
              </div>
              <div
                className="text-[9px] font-medium uppercase tracking-[0.3em]"
                style={{ ...mono, color: C.muted }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[13px] font-semibold" style={{ ...sans, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...sans, color: C.fgSoft }}
              >
                <ShieldCheck
                  size={12}
                  strokeWidth={1.8}
                  style={{ color: C.mirageDeep }}
                  aria-hidden
                />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-10 w-10 items-center justify-center text-[12px] font-semibold"
              style={{ ...sans, color: C.mirageDeep, background: C.mirageWash, borderRadius: 999 }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        {/* Calm pill nav — plenty of air, active tab softly filled. */}
        <nav className="mb-12 overflow-x-auto" aria-label="Hoofdnavigatie">
          <div className="flex items-center gap-1.5">
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`shrink-0 px-4 py-2 text-[13px] font-semibold transition-colors ${RING}`}
                  style={{
                    ...sans,
                    color: on ? C.card : C.fgSoft,
                    background: on ? C.mirageDeep : "transparent",
                    borderRadius: 999,
                  }}
                >
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

        <div className="mt-14">
          <Horizon />
        </div>
        <footer
          className="flex flex-wrap items-center justify-between gap-2 pt-5 text-[10.5px]"
          style={{ ...mono, color: C.muted }}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="h-1.5 w-1.5"
              style={{ background: C.mirage, borderRadius: 999 }}
              aria-hidden="true"
            />
            {SCREENS.length} schermen · zoutvlak v304
          </span>
          <span className="uppercase tracking-[0.2em]">Rust · horizon · leegte</span>
        </footer>
      </div>
    </div>
  );
}
