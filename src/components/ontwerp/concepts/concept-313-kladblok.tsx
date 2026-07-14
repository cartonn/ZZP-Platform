"use client";

// Concept 313 — "Kladblok" · neo-utilitair "honest software".
// Signature: systeem-achtige nadruk, eerlijke 1px-borders, dichte formulieren, strak monospace
// labelwerk, bijna zwart-wit met één functionele blauwe accent. Voelt als een razendsnel intern
// gereedschap — Linear-issue-view kruising met platte HTML. Fonts: labels/kop --font-lab-mono ·
// tekst --font-lab-inter.

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
  Hash,
  Terminal,
  FileText,
  Mail,
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
  DOCUMENTEN,
  BERICHTEN,
  NAV,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// Near black-and-white with a single functional blue accent. No shadows — honest 1px borders only.
const C = {
  bg: "#ffffff",
  sub: "#fafafa",
  subDeep: "#f4f4f5",
  panel: "#ffffff",
  line: "#e4e4e7",
  lineStrong: "#d4d4d8",
  ink: "#101013",
  fg: "#26262b",
  fgSoft: "#57575f",
  muted: "#87878f",
  faint: "#aeaeb5",
  accent: "#2f57e6",
  accentDeep: "#1f3fc0",
  accentSoft: "#eef1fe",
  green: "#15784a",
  greenSoft: "#e7f4ee",
  amber: "#9a6a08",
  amberSoft: "#fbf1dd",
  red: "#c0342b",
  redSoft: "#fbeceb",
  citrus: "#9a6a08",
};

const sans = { fontFamily: "var(--font-lab-inter), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f57e6] focus-visible:ring-offset-1 focus-visible:ring-offset-white";

// ---- Utilitarian primitives -------------------------------------------------

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
      style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 6, ...style }}
    >
      {children}
    </div>
  );
}

// A monospace section label — the honest "// SECTION" work.
function Label({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "accent" | "ink";
}) {
  const color = tone === "accent" ? C.accent : tone === "ink" ? C.ink : C.muted;
  return (
    <span
      className="text-[10.5px] font-medium uppercase tracking-[0.13em]"
      style={{ ...mono, color }}
    >
      {children}
    </span>
  );
}

// A flat button — filled accent (primary) or hairline (ghost). Sharp, no travel.
function Btn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className,
  ariaLabel,
  ariaPressed,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  active?: boolean;
}) {
  const [hot, setHot] = useState(false);
  const primary = variant === "primary";
  const on = active || hot;
  const pad = size === "sm" ? "px-2.5 py-1 text-[11.5px]" : "px-3.5 py-1.5 text-[12.5px]";
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-1.5 font-medium transition-colors duration-100 ${RING} ${pad} ${className ?? ""}`}
      style={{
        ...sans,
        color: primary ? "#fff" : on ? C.ink : C.fg,
        background: primary ? (hot ? C.accentDeep : C.accent) : on ? C.subDeep : C.bg,
        border: `1px solid ${primary ? (hot ? C.accentDeep : C.accent) : active ? C.accent : C.lineStrong}`,
        borderRadius: 5,
      }}
    >
      {children}
    </button>
  );
}

// A block meter — ASCII-flavoured [■■■■■□□□□□] match indicator.
function BlockMeter({
  value,
  cells = 10,
  width = "auto",
}: {
  value: number;
  cells?: number;
  width?: string;
}) {
  const filled = Math.round((value / 100) * cells);
  return (
    <span className="inline-flex items-center gap-1" style={{ width }} aria-hidden="true">
      <span className="flex items-center gap-[2px]">
        {Array.from({ length: cells }).map((_, i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 12,
              borderRadius: 1,
              background: i < filled ? C.accent : C.subDeep,
              border: `1px solid ${i < filled ? C.accent : C.line}`,
            }}
          />
        ))}
      </span>
    </span>
  );
}

function MatchStat({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const fs = size === "lg" ? "text-[26px]" : size === "md" ? "text-[18px]" : "text-[14px]";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-1">
        <span
          className={`${fs} font-semibold tabular-nums leading-none`}
          style={{ ...mono, color: C.ink }}
        >
          {value}
        </span>
        <span className="text-[11px] font-medium" style={{ ...mono, color: C.muted }}>
          % match
        </span>
      </div>
      <BlockMeter value={value} />
    </div>
  );
}

// Sparkline — bare 1px polyline, no fill. Honest and flat.
function LineSpark({ spark, w = 100, h = 26 }: { spark: number[]; w?: number; h?: number }) {
  const min = Math.min(...spark);
  const max = Math.max(...spark);
  const span = max - min || 1;
  const pts = spark
    .map((v, i) => {
      const x = (i / (spark.length - 1)) * w;
      const y = h - 2 - ((v - min) / span) * (h - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={C.accent}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  color: string;
  soft: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, color: C.green, soft: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Hourglass, color: C.amber, soft: C.amberSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, color: C.citrus, soft: C.amberSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.red, soft: C.redSoft };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const { label, Icon, color, soft } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.04em]"
      style={{ ...mono, color, background: soft, border: `1px solid ${color}33`, borderRadius: 4 }}
    >
      <Icon size={11} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </span>
  );
}

// A dense key/value row — the Linear-issue "properties" pattern.
function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-3 py-2"
      style={{ borderTop: `1px solid ${C.line}` }}
    >
      <Label>{k}</Label>
      <span
        className="truncate text-right text-[12.5px] font-medium"
        style={{ ...sans, color: C.fg }}
      >
        {children}
      </span>
    </div>
  );
}

function ScreenHead({ title, sub, path }: { title: string; sub?: string; path: string }) {
  return (
    <div className="mb-6">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Terminal size={12} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
        <span className="text-[11px]" style={{ ...mono, color: C.muted }}>
          {path}
        </span>
      </div>
      <h1
        className="text-[22px] font-semibold tracking-tight sm:text-[26px]"
        style={{ ...mono, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-1.5 max-w-2xl text-[13px] leading-relaxed"
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
      <Panel className="mb-6 overflow-hidden">
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{ background: C.sub, borderBottom: `1px solid ${C.line}` }}
        >
          <Label tone="accent">{`// overzicht`}</Label>
          <span className="text-[11px]" style={{ ...mono, color: C.muted }}>
            {PROFIEL.plaats.toLowerCase()} · {PROFIEL.rol.toLowerCase()}
          </span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-6 p-5">
          <div className="min-w-0">
            <h1
              className="text-[24px] font-semibold tracking-tight"
              style={{ ...mono, color: C.ink }}
            >
              Hoi {voornaam}.
            </h1>
            <p
              className="mt-2 max-w-md text-[13px] leading-relaxed"
              style={{ ...sans, color: C.fgSoft }}
            >
              Een rechttoe-rechtaan werkblad: alleen wat telt, dicht op elkaar, zonder franje. Klik
              door naar de beste match of pak de eerstvolgende actie op.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium"
                style={{
                  ...mono,
                  color: C.green,
                  background: C.greenSoft,
                  border: `1px solid ${C.green}33`,
                  borderRadius: 4,
                }}
              >
                <ShieldCheck size={12} strokeWidth={2.2} aria-hidden="true" />
                {PROFIEL.trust.toLowerCase()}
              </span>
              <span className="text-[11px]" style={{ ...mono, color: C.muted }}>
                {OPDRACHTEN.length} matches · {ACTIES.length} acties
              </span>
            </div>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group text-left ${RING} rounded`}
            aria-label={`Open beste match: ${top.titel}`}
          >
            <Panel className="p-3.5" style={{ background: C.sub }}>
              <Label tone="accent">beste match</Label>
              <div className="mt-1.5">
                <MatchStat value={top.match} size="lg" />
              </div>
              <div
                className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium"
                style={{ ...sans, color: C.accent }}
              >
                {top.titel}
                <ArrowRight
                  size={12}
                  strokeWidth={2.2}
                  className="transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </div>
            </Panel>
          </button>
        </div>
      </Panel>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-3.5">
            <div className="flex items-center justify-between">
              <Label>{k.label}</Label>
              <span
                className="text-[10.5px] font-medium tabular-nums"
                style={{ ...mono, color: k.up ? C.green : C.citrus }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-1.5 text-[22px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-2.5">
              <LineSpark spark={k.spark} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-2.5 flex items-center gap-2">
            <Label tone="ink">matches</Label>
            <div className="h-px flex-1" style={{ background: C.line }} aria-hidden="true" />
          </div>
          <Panel className="overflow-hidden">
            {OPDRACHTEN.map((o, i) => (
              <button
                key={o.id}
                onClick={() => onOpen(o)}
                className={`group flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-[#fafafa] ${RING}`}
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
              >
                <span className="w-[112px] shrink-0">
                  <MatchStat value={o.match} size="sm" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px]" style={{ ...mono, color: C.muted }}>
                      {o.id}
                    </span>
                    <span
                      className="text-[10.5px] font-medium tabular-nums"
                      style={{ ...mono, color: C.accent }}
                    >
                      {o.tarief}
                    </span>
                  </div>
                  <div
                    className="truncate text-[14px] font-medium"
                    style={{ ...sans, color: C.ink }}
                  >
                    {o.titel}
                  </div>
                  <div className="truncate text-[12px]" style={{ ...sans, color: C.fgSoft }}>
                    {o.opdrachtgever} · {o.plaats}
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="shrink-0 transition-transform group-hover:translate-x-0.5"
                  style={{ color: C.faint }}
                  aria-hidden="true"
                />
              </button>
            ))}
          </Panel>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-2.5 flex items-center gap-2">
              <Label tone="ink">volgende actie</Label>
              <div className="h-px flex-1" style={{ background: C.line }} aria-hidden="true" />
            </div>
            <Panel className="p-3.5">
              {ACTIES.slice(0, 1).map((a) => (
                <div key={a.titel}>
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em]"
                    style={{ ...mono, color: C.citrus, background: C.amberSoft, borderRadius: 3 }}
                  >
                    <TriangleAlert size={10} strokeWidth={2.2} aria-hidden="true" />
                    aandacht
                  </span>
                  <div
                    className="mt-2 text-[13.5px] font-medium leading-snug"
                    style={{ ...sans, color: C.ink }}
                  >
                    {a.titel}
                  </div>
                  <p
                    className="mt-1 text-[12px] leading-relaxed"
                    style={{ ...sans, color: C.fgSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <Btn size="sm">
                      {a.cta}
                      <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
              ))}
            </Panel>
          </div>

          <div>
            <div className="mb-2.5 flex items-center gap-2">
              <Mail size={12} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
              <Label tone="ink">berichten</Label>
              <div className="h-px flex-1" style={{ background: C.line }} aria-hidden="true" />
            </div>
            <Panel className="overflow-hidden">
              {BERICHTEN.map((b, i) => (
                <div
                  key={b.van}
                  className="flex items-start gap-2.5 px-3 py-2.5"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center text-[9.5px] font-semibold"
                    style={{
                      ...mono,
                      color: C.fg,
                      background: C.subDeep,
                      border: `1px solid ${C.line}`,
                      borderRadius: 4,
                    }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="truncate text-[12px] font-medium"
                        style={{ ...sans, color: C.ink }}
                      >
                        {b.van}
                      </span>
                      <span
                        className="shrink-0 text-[10px] tabular-nums"
                        style={{ ...mono, color: C.muted }}
                      >
                        {b.tijd}
                      </span>
                    </div>
                    <p
                      className="mt-0.5 truncate text-[11.5px]"
                      style={{ ...sans, color: C.fgSoft }}
                    >
                      {b.preview}
                    </p>
                  </div>
                  {b.ongelezen && (
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: C.accent }}
                      aria-label="ongelezen"
                    />
                  )}
                </div>
              ))}
            </Panel>
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
        path="~/marktplaats"
        title="opdrachten"
        sub="Filter direct terwijl je typt. Elke rij toont de match met een verklaarbare onderbouwing."
      />

      <Panel className="mb-4 flex flex-wrap items-center gap-2 px-3 py-2">
        <Search size={15} className="shrink-0" style={{ color: C.muted }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="filter: titel, plaats, vaardigheid…"
          aria-label="Filter opdrachten"
          className="min-w-[8rem] flex-1 bg-transparent text-[13px] outline-none placeholder:opacity-60"
          style={{ ...mono, color: C.ink }}
        />
        <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
          {String(filtered.length).padStart(2, "0")}/{String(OPDRACHTEN.length).padStart(2, "0")}
        </span>
        {query && (
          <Btn variant="ghost" size="sm" onClick={() => setQuery("")}>
            wissen
          </Btn>
        )}
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <Hash size={26} strokeWidth={1.6} style={{ color: C.faint }} aria-hidden="true" />
          <h3 className="text-[16px] font-semibold" style={{ ...mono, color: C.ink }}>
            0 resultaten
          </h3>
          <p className="max-w-xs text-[12.5px]" style={{ ...sans, color: C.fgSoft }}>
            Geen opdracht voor &ldquo;{query}&rdquo;. Pas de filter aan.
          </p>
          <div className="mt-1">
            <Btn size="sm" onClick={() => setQuery("")}>
              filter wissen
            </Btn>
          </div>
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          <div
            className="hidden items-center gap-3 px-4 py-2 sm:flex"
            style={{ background: C.sub, borderBottom: `1px solid ${C.line}` }}
          >
            <span className="w-[116px]">
              <Label>match</Label>
            </span>
            <span className="flex-1">
              <Label>opdracht</Label>
            </span>
            <span className="w-[120px]">
              <Label>plaats / uren</Label>
            </span>
            <span className="w-[90px] text-right">
              <Label>tarief</Label>
            </span>
            <span className="w-[76px]" />
          </div>
          {filtered.map((o, i) => {
            const isSaved = saved.has(o.id);
            return (
              <div
                key={o.id}
                className="flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-[#fafafa] sm:flex-row sm:items-center"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
              >
                <span className="w-[116px] shrink-0">
                  <MatchStat value={o.match} size="sm" />
                </span>
                <button
                  onClick={() => onOpen(o)}
                  className={`min-w-0 flex-1 text-left ${RING} rounded`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px]" style={{ ...mono, color: C.muted }}>
                      {o.id}
                    </span>
                  </div>
                  <div
                    className="truncate text-[14px] font-medium"
                    style={{ ...sans, color: C.ink }}
                  >
                    {o.titel}
                  </div>
                  <div className="truncate text-[12px]" style={{ ...sans, color: C.fgSoft }}>
                    {o.opdrachtgever}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 text-[10px]"
                        style={{
                          ...mono,
                          color: C.fgSoft,
                          background: C.subDeep,
                          border: `1px solid ${C.line}`,
                          borderRadius: 3,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </button>
                <div
                  className="w-[120px] shrink-0 text-[12px]"
                  style={{ ...sans, color: C.fgSoft }}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin
                      size={12}
                      strokeWidth={2}
                      style={{ color: C.muted }}
                      aria-hidden="true"
                    />
                    {o.plaats}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <Clock
                      size={12}
                      strokeWidth={2}
                      style={{ color: C.muted }}
                      aria-hidden="true"
                    />
                    {o.uren}
                  </div>
                </div>
                <div
                  className="w-[90px] shrink-0 text-left text-[12.5px] font-semibold tabular-nums sm:text-right"
                  style={{ ...mono, color: C.ink }}
                >
                  {o.tarief}
                </div>
                <div className="flex w-[76px] shrink-0 items-center justify-end gap-1.5">
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-7 w-7 items-center justify-center transition-colors ${RING}`}
                    style={{
                      color: isSaved ? C.accent : C.muted,
                      background: isSaved ? C.accentSoft : C.bg,
                      border: `1px solid ${isSaved ? C.accent : C.lineStrong}`,
                      borderRadius: 5,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={13} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <Bookmark size={13} strokeWidth={2.2} aria-hidden="true" />
                    )}
                  </button>
                  <button
                    onClick={() => onOpen(o)}
                    aria-label={`Open ${o.titel}`}
                    className={`flex h-7 w-7 items-center justify-center transition-colors hover:bg-[#f4f4f5] ${RING}`}
                    style={{ color: C.fg, border: `1px solid ${C.lineStrong}`, borderRadius: 5 }}
                  >
                    <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </Panel>
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
      <div className="mb-4">
        <Btn variant="ghost" size="sm" onClick={onBack} ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={13} strokeWidth={2.2} aria-hidden="true" />
          terug
        </Btn>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel className="overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{ background: C.sub, borderBottom: `1px solid ${C.line}` }}
            >
              <span className="text-[11px]" style={{ ...mono, color: C.muted }}>
                {opdracht.id}
              </span>
              <span
                className="text-[11px] font-semibold tabular-nums"
                style={{ ...mono, color: C.accent }}
              >
                {opdracht.tarief}
              </span>
            </div>
            <div className="p-5">
              <h2
                className="text-[22px] font-semibold leading-tight tracking-tight sm:text-[26px]"
                style={{ ...mono, color: C.ink }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1.5 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center gap-1.5">
                    <Plus
                      size={13}
                      strokeWidth={2.6}
                      style={{ color: C.green }}
                      aria-hidden="true"
                    />
                    <Label tone="ink">waarom deze past</Label>
                  </div>
                  <ul className="space-y-1.5">
                    {opdracht.redenen.plus.map((r) => (
                      <li
                        key={r}
                        className="flex items-start gap-2 text-[13px]"
                        style={{ ...sans, color: C.fg }}
                      >
                        <Check
                          size={14}
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
                <div>
                  <div className="mb-2 flex items-center gap-1.5">
                    <Minus
                      size={13}
                      strokeWidth={2.6}
                      style={{ color: C.citrus }}
                      aria-hidden="true"
                    />
                    <Label tone="ink">even op letten</Label>
                  </div>
                  <ul className="space-y-1.5">
                    {opdracht.redenen.min.map((r) => (
                      <li
                        key={r}
                        className="flex items-start gap-2 text-[13px]"
                        style={{ ...sans, color: C.fg }}
                      >
                        <TriangleAlert
                          size={14}
                          strokeWidth={2.2}
                          className="mt-0.5 shrink-0"
                          style={{ color: C.citrus }}
                          aria-hidden="true"
                        />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div
                className="mt-5 flex flex-wrap items-center gap-3"
                style={{ borderTop: `1px solid ${C.line}`, paddingTop: 16 }}
              >
                <Btn onClick={() => setApplied((v) => !v)} ariaPressed={applied}>
                  {applied ? (
                    <Check size={14} strokeWidth={2.6} aria-hidden="true" />
                  ) : (
                    <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
                  )}
                  {applied ? "reactie verstuurd" : "reageer op opdracht"}
                </Btn>
                {applied && (
                  <span className="text-[12px]" style={{ ...sans, color: C.fgSoft }}>
                    Reactietijd opdrachtgever: ~6 uur.
                  </span>
                )}
              </div>
            </div>
          </Panel>
        </div>

        {/* Properties panel — the Linear-issue key/value column. */}
        <div className="space-y-4">
          <Panel className="overflow-hidden">
            <div className="px-3 py-2.5">
              <Label tone="accent">match</Label>
              <div className="mt-2">
                <MatchStat value={opdracht.match} size="lg" />
              </div>
            </div>
            <Row k="tarief">
              <span className="inline-flex items-center gap-1">
                <Wallet size={12} strokeWidth={2} style={{ color: C.muted }} aria-hidden="true" />
                {opdracht.tarief}
              </span>
            </Row>
            <Row k="inzet">
              <span className="inline-flex items-center gap-1">
                <Clock size={12} strokeWidth={2} style={{ color: C.muted }} aria-hidden="true" />
                {opdracht.uren}
              </span>
            </Row>
            <Row k="start">
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} strokeWidth={2} style={{ color: C.muted }} aria-hidden="true" />
                {opdracht.start}
              </span>
            </Row>
            <Row k="plaats">
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} strokeWidth={2} style={{ color: C.muted }} aria-hidden="true" />
                {opdracht.plaats}
              </span>
            </Row>
          </Panel>

          <Panel className="p-3">
            <div className="mb-2">
              <Label>labels</Label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 text-[10.5px]"
                  style={{
                    ...mono,
                    color: C.fgSoft,
                    background: C.subDeep,
                    border: `1px solid ${C.line}`,
                    borderRadius: 3,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-3">
              <Btn
                variant="ghost"
                size="sm"
                onClick={() => toggleSave(opdracht.id)}
                active={isSaved}
                ariaPressed={isSaved}
                ariaLabel={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                className="w-full"
              >
                {isSaved ? (
                  <BookmarkCheck size={13} strokeWidth={2.2} aria-hidden="true" />
                ) : (
                  <Bookmark size={13} strokeWidth={2.2} aria-hidden="true" />
                )}
                {isSaved ? "bewaard" : "bewaar"}
              </Btn>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Verificatie({
  feedState,
  setFeedState,
}: {
  feedState: "ok" | "loading" | "error";
  setFeedState: (s: "ok" | "loading" | "error") => void;
}) {
  return (
    <div>
      <ScreenHead
        path="~/verificatie"
        title="certificaten"
        sub="Status met label én icoon — nooit op kleur alleen. Verlopende stukken vragen om actie."
      />

      <Panel className="mb-4 flex items-start gap-3 p-3.5">
        <ShieldCheck
          size={20}
          strokeWidth={2.2}
          style={{ color: C.green }}
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        />
        <div>
          <div className="text-[14px] font-medium" style={{ ...sans, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[12.5px]" style={{ ...sans, color: C.fgSoft }}>
            Documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-2.5 flex items-center gap-2">
            <Label tone="ink">certificaten</Label>
            <div className="h-px flex-1" style={{ background: C.line }} aria-hidden="true" />
          </div>
          <Panel className="overflow-hidden">
            {CREDENTIALS.map((c, i) => {
              const expiring = c.status === "EXPIRING";
              return (
                <div
                  key={c.naam}
                  className="flex items-center gap-3 px-3.5 py-3"
                  style={{
                    borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
                    background: expiring ? C.amberSoft : "transparent",
                  }}
                >
                  <FileText
                    size={15}
                    strokeWidth={2}
                    style={{ color: C.muted }}
                    aria-hidden="true"
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium" style={{ ...sans, color: C.ink }}>
                      {c.naam}
                    </div>
                    <div className="text-[11.5px]" style={{ ...sans, color: C.fgSoft }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusTag status={c.status} />
                </div>
              );
            })}
          </Panel>

          <Panel
            className="mt-4 flex items-start gap-3 p-3.5"
            style={{ background: C.amberSoft, borderColor: `${C.citrus}44` }}
          >
            <TriangleAlert
              size={16}
              strokeWidth={2.2}
              style={{ color: C.citrus }}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <div className="text-[13px] font-medium" style={{ ...sans, color: C.ink }}>
                VOG verloopt over 23 dagen
              </div>
              <p className="mt-0.5 text-[12px]" style={{ ...sans, color: C.fgSoft }}>
                Vraag op tijd een nieuwe Verklaring Omtrent Gedrag aan om verifieerbaar te blijven.
              </p>
              <div className="mt-2.5">
                <Btn variant="ghost" size="sm">
                  VOG vernieuwen
                  <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                </Btn>
              </div>
            </div>
          </Panel>
        </div>

        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <Label tone="ink">documenten</Label>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-6 w-6 items-center justify-center transition-colors hover:bg-[#f4f4f5] ${RING}`}
              style={{ color: C.fg, border: `1px solid ${C.lineStrong}`, borderRadius: 5 }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={12} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div
            className="mb-3 inline-flex overflow-hidden"
            style={{ border: `1px solid ${C.lineStrong}`, borderRadius: 5 }}
            role="tablist"
            aria-label="Documentweergave"
          >
            {(["ok", "loading", "error"] as const).map((s, i) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className={`px-3 py-1 text-[11px] font-medium uppercase tracking-[0.04em] transition-colors ${RING}`}
                style={{
                  ...mono,
                  color: feedState === s ? "#fff" : C.fg,
                  background: feedState === s ? C.accent : C.bg,
                  borderLeft: i === 0 ? "none" : `1px solid ${C.lineStrong}`,
                }}
              >
                {s === "ok" ? "ok" : s === "loading" ? "laden" : "fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <div className="space-y-2.5" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Panel key={i} className="p-3">
                  <div
                    className="h-3 w-2/3 animate-pulse rounded"
                    style={{ background: C.subDeep }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: C.subDeep }}
                  />
                </Panel>
              ))}
            </div>
          )}

          {feedState === "error" && (
            <Panel
              className="flex flex-col items-center gap-2 px-4 py-9 text-center"
              style={{ borderColor: `${C.red}55`, background: C.redSoft }}
            >
              <XCircle size={22} strokeWidth={2} style={{ color: C.red }} aria-hidden="true" />
              <div className="text-[14px] font-semibold" style={{ ...mono, color: C.ink }}>
                kluis onbereikbaar
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.fgSoft }}>
                Kon de documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <Btn size="sm" onClick={() => setFeedState("ok")}>
                  opnieuw proberen
                </Btn>
              </div>
            </Panel>
          )}

          {feedState === "ok" && (
            <Panel className="overflow-hidden">
              {DOCUMENTEN.map((d, i) => (
                <div
                  key={d.naam}
                  className="flex items-center gap-2.5 px-3 py-2.5"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center text-[9px] font-semibold"
                    style={{
                      ...mono,
                      color: C.fg,
                      background: C.subDeep,
                      border: `1px solid ${C.line}`,
                      borderRadius: 4,
                    }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12px] font-medium"
                      style={{ ...sans, color: C.ink }}
                    >
                      {d.naam}
                    </div>
                    <div className="text-[10.5px] tabular-nums" style={{ ...mono, color: C.muted }}>
                      {d.grootte} · {d.bijgewerkt}
                    </div>
                  </div>
                  <StatusTag status={d.status} />
                </div>
              ))}
            </Panel>
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
        path="~/acties"
        title="acties"
        sub="Een platte checklist: vink af, ruim op. Wat open staat blijft bovenaan."
      />

      {openCount === 0 ? (
        <Panel className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <Check size={26} strokeWidth={2.4} style={{ color: C.green }} aria-hidden="true" />
          <h3 className="text-[16px] font-semibold" style={{ ...mono, color: C.ink }}>
            alles afgerond
          </h3>
          <p className="max-w-xs text-[12.5px]" style={{ ...sans, color: C.fgSoft }}>
            Geen openstaande acties meer.
          </p>
        </Panel>
      ) : (
        <>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-[13px]" style={{ ...mono, color: C.muted }}>
              open:
            </span>
            <span
              className="text-[28px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.accent }}
            >
              {String(openCount).padStart(2, "0")}
            </span>
            <span className="text-[13px]" style={{ ...mono, color: C.muted }}>
              / {String(ACTIES.length).padStart(2, "0")}
            </span>
          </div>

          <Panel className="overflow-hidden">
            {ACTIES.map((a, idx) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <div
                  key={a.titel}
                  className="flex items-start gap-3 px-4 py-3.5"
                  style={{
                    borderTop: idx === 0 ? "none" : `1px solid ${C.line}`,
                    opacity: isDone ? 0.55 : 1,
                  }}
                >
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1px solid ${isDone ? C.green : C.lineStrong}`,
                      background: isDone ? C.green : C.bg,
                      color: "#fff",
                      borderRadius: 4,
                    }}
                  >
                    {isDone && <Check size={12} strokeWidth={2.8} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]" style={{ ...mono, color: C.muted }}>
                        #{String(idx + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-[0.06em]"
                        style={{
                          ...mono,
                          color: warn ? C.citrus : C.accent,
                          background: warn ? C.amberSoft : C.accentSoft,
                          borderRadius: 3,
                        }}
                      >
                        {warn ? "aandacht" : "info"}
                      </span>
                    </div>
                    <div
                      className="mt-1 text-[14px] font-medium leading-snug"
                      style={{
                        ...sans,
                        color: C.ink,
                        textDecoration: isDone ? "line-through" : "none",
                      }}
                    >
                      {a.titel}
                    </div>
                    <p className="mt-0.5 text-[12px]" style={{ ...sans, color: C.fgSoft }}>
                      {a.detail}
                    </p>
                    {!isDone && (
                      <div className="mt-2">
                        <Btn variant="ghost" size="sm">
                          {a.cta}
                          <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                        </Btn>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </Panel>
        </>
      )}
    </div>
  );
}

function Facturen() {
  const statusColor = (status: string): string =>
    status === "Openstaand" ? C.citrus : status === "Concept" ? C.muted : C.green;
  return (
    <div>
      <ScreenHead
        path="~/facturen"
        title="facturen"
        sub="Platte tabel, tabulaire cijfers. Geen ruis, alleen de stand van zaken."
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "betaald (mnd)", value: "€ 5.552", color: C.green },
          { label: "openstaand", value: "€ 1.350", color: C.citrus },
          { label: "concept", value: "€ 880", color: C.accent },
        ].map((s) => (
          <Panel key={s.label} className="p-3.5">
            <Label>{s.label}</Label>
            <div
              className="mt-1.5 text-[22px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: s.color }}
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
              <tr style={{ background: C.sub, borderBottom: `1px solid ${C.line}` }}>
                {["factuur", "klant", "datum", "bedrag", "status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.08em]"
                    style={{ ...mono, color: C.muted, textAlign: i >= 3 ? "right" : "left" }}
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
                  className="transition-colors hover:bg-[#fafafa]"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
                >
                  <td
                    className="px-4 py-3 text-[12px] font-medium tabular-nums"
                    style={{ ...mono, color: C.accent }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13px]" style={{ ...sans, color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[12.5px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.03em]"
                      style={{ ...mono, color: statusColor(f.status) }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: statusColor(f.status) }}
                        aria-hidden="true"
                      />
                      {f.status.toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: `1px solid ${C.lineStrong}`, background: C.sub }}>
                <td
                  className="px-4 py-3 text-[10.5px] font-medium uppercase tracking-[0.08em]"
                  style={{ ...mono, color: C.muted }}
                  colSpan={3}
                >
                  totaal
                </td>
                <td
                  className="px-4 py-3 text-right text-[13.5px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  € 7.782
                </td>
                <td className="px-4 py-3" />
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept313() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set(["OPD-2041"]));
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
      style={{ ...sans, color: C.fg, background: C.sub }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header
          className="mb-4 flex flex-wrap items-center justify-between gap-3 pb-4"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center"
              style={{ background: C.ink, borderRadius: 6 }}
              aria-hidden="true"
            >
              <Terminal size={17} strokeWidth={2.2} style={{ color: "#fff" }} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[16px] font-semibold tracking-tight"
                style={{ ...mono, color: C.ink }}
              >
                kladblok
              </div>
              <div
                className="text-[9.5px] uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.muted }}
              >
                zzp platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12px] font-medium" style={{ ...sans, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[10.5px]"
                style={{ ...mono, color: C.fgSoft }}
              >
                <ShieldCheck
                  size={11}
                  strokeWidth={2}
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {PROFIEL.trust.toLowerCase()}
              </div>
            </div>
            <span
              className="flex h-8 w-8 items-center justify-center text-[11px] font-semibold"
              style={{
                ...mono,
                color: C.fg,
                background: C.subDeep,
                border: `1px solid ${C.lineStrong}`,
                borderRadius: 6,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        {/* Flat tab bar — an honest segmented row. */}
        <nav className="mb-6 overflow-x-auto" aria-label="Hoofdnavigatie">
          <div className="flex items-stretch gap-0.5">
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-colors ${RING}`}
                  style={{
                    ...mono,
                    color: on ? C.ink : C.muted,
                    background: on ? C.bg : "transparent",
                    border: `1px solid ${on ? C.lineStrong : "transparent"}`,
                    borderBottom: on ? `2px solid ${C.accent}` : `1px solid transparent`,
                    borderRadius: "5px 5px 0 0",
                  }}
                >
                  {s.label.toLowerCase()}
                </button>
              );
            })}
          </div>
          <div className="h-px w-full" style={{ background: C.line }} aria-hidden="true" />
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
            <Verificatie feedState={feedState} setFeedState={setFeedState} />
          )}
          {screen === "acties" && (
            <Acties done={done} toggleDone={(t) => setDone((s) => toggleSet(s, t))} />
          )}
          {screen === "facturen" && <Facturen />}
        </main>

        <div className="mt-8 h-px w-full" style={{ background: C.line }} aria-hidden="true" />
        <footer
          className="flex flex-wrap items-center justify-between gap-2 pt-3.5 text-[10.5px]"
          style={{ ...mono, color: C.muted }}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: C.accent }}
              aria-hidden="true"
            />
            {SCREENS.length} schermen · kladblok v313
          </span>
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            {NAV.slice(0, 4).map((n) => (
              <span key={n}>{n.toLowerCase()}</span>
            ))}
          </span>
          <span className="uppercase tracking-[0.1em]">1px-borders · mono · dicht</span>
        </footer>
      </div>
    </div>
  );
}
