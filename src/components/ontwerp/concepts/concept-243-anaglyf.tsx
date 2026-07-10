"use client";

// Concept 243 — "Anaglyf" · Stereoscopic red-cyan depth, with restraint.
// A subtle red/cyan channel-split (text-shadow / box-shadow offset) gives HEADINGS, edges
// and accents a 3D stereo feel — purely as ATMOSPHERE. The DATA itself (amounts, statuses,
// job details) stays rock-solid sharp and readable; the offset never touches running figures
// or body text. Deep anthracite / near-black surface; red (#ff3b5c) + cyan (#00e5ff) used
// sparingly and AA-safe. Headings in Space Grotesk / Space Mono; body in Inter. Depth deepens
// subtly on hover (reduced-motion aware). Real text contrast meets AA.

import { useState, type CSSProperties } from "react";
import {
  Layers,
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

// Anaglyph palette. Text tones are AA on the anthracite panels; red/cyan used sparingly.
const C = {
  base: "#0b0c10", // near-black
  panel: "#14161c", // panel surface
  panelUp: "#1a1d25", // raised surface
  line: "rgba(228,232,240,0.12)",
  text: "#eef1f6", // primary text (AA on panels)
  textSoft: "#a6adbd", // muted (AA on panels)
  faint: "#727a8c",
  red: "#ff5d78", // AA-safe warm red for text on dark
  redDeep: "#ff3b5c", // used for glow/edges only
  cyan: "#5fe3ff", // AA-safe cyan for text on dark
  cyanDeep: "#00e5ff", // used for glow/edges only
  amber: "#f4c15a",
  mint: "#57e0a8",
};

const display = { fontFamily: "var(--font-lab-space)" }; // Space Grotesk
const monoDisp = { fontFamily: "var(--font-lab-space-mono)" }; // Space Mono
const body = { fontFamily: "var(--font-lab-inter)" };

// Anaglyph channel-split shadow for HEADINGS/labels only — never on running data.
const anaglyphText = "-1.4px 0 0 rgba(255,59,92,0.62), 1.4px 0 0 rgba(0,229,255,0.62)";

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

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, tone: C.cyan };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.text };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, tone: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red };
  }
}

// Status chip — sharp, label + icon, tinted border/text (no offset). Data-legible.
function StatusChip({ status }: { status: CredStatus }) {
  const { label, Icon, tone } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 text-[11.5px] font-semibold"
      style={{
        ...body,
        color: tone,
        border: `1px solid ${tone}`,
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

// Stereo heading — red/cyan channel offset. Only for titles/labels, never running data.
function StereoHead({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`inline-block ${className}`}
      style={{ ...display, color: C.text, textShadow: anaglyphText, ...style }}
    >
      {children}
    </span>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10.5px] font-bold uppercase tracking-[0.26em]"
      style={{ ...monoDisp, color: C.cyan, textShadow: "-0.8px 0 0 rgba(255,59,92,0.5)" }}
    >
      {children}
    </div>
  );
}

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-5">
      <Kicker>{kicker}</Kicker>
      <h2 className="mt-1.5 text-[23px] font-bold leading-none sm:text-[27px]">
        <StereoHead>{title}</StereoHead>
      </h2>
    </div>
  );
}

// Panel with anaglyph edge — a red/cyan split box-shadow that deepens on hover.
function panelStyle(raised = false): CSSProperties {
  return {
    background: raised ? C.panelUp : C.panel,
    border: `1px solid ${C.line}`,
    borderRadius: 10,
    boxShadow: "-2px 0 0 rgba(255,59,92,0.16), 2px 0 0 rgba(0,229,255,0.16)",
  };
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

// Match readout — sharp mono number with stereo-edged ring.
function MatchReadout({ value }: { value: number }) {
  return (
    <div
      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[7px] leading-none"
      style={{
        border: `1px solid ${C.cyan}`,
        background: "rgba(255,255,255,0.02)",
        boxShadow: "-1.5px 0 0 rgba(255,59,92,0.22), 1.5px 0 0 rgba(0,229,255,0.22)",
      }}
    >
      <span className="text-[16px] font-bold tabular-nums" style={{ ...monoDisp, color: C.text }}>
        {value}
      </span>
      <span
        className="text-[7.5px] font-bold uppercase tracking-widest"
        style={{ ...monoDisp, color: C.textSoft }}
      >
        match
      </span>
    </div>
  );
}

// ---- Screens ---------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  return (
    <div className="space-y-8">
      <SectionHead kicker="overzicht · z=0" title="Dashboard" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const tones = [C.cyan, C.red, C.mint, C.amber];
          const tone = tones[i % tones.length] ?? C.cyan;
          return (
            <div key={k.label} className="c243-depth p-4" style={panelStyle()}>
              <div className="flex items-center justify-between">
                <span
                  className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...monoDisp, color: C.textSoft }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[10.5px] font-bold"
                  style={{ ...monoDisp, color: k.up ? C.mint : C.amber }}
                >
                  <Trend size={11} strokeWidth={2.6} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              {/* Data value stays sharp — no channel offset */}
              <div
                className="mt-1 text-[27px] font-bold tabular-nums leading-none"
                style={{ ...monoDisp, color: C.text }}
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div>
            <SectionHead kicker="match · top" title="Beste matches" />
            <ul className="space-y-2.5">
              {OPDRACHTEN.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => onOpen(o)}
                    className="c243-depth group flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c243-cyan)]"
                    style={{ ...panelStyle(true), ["--c243-cyan" as string]: C.cyanDeep }}
                  >
                    <MatchReadout value={o.match} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[15px] font-semibold"
                        style={{ ...body, color: C.text }}
                      >
                        {o.titel}
                      </div>
                      <div
                        className="truncate text-[12.5px]"
                        style={{ ...body, color: C.textSoft }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </div>
                    </div>
                    <ArrowRight
                      size={18}
                      className="shrink-0 transition-transform group-hover:translate-x-1"
                      style={{ color: C.cyan }}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHead kicker="inbox · stream" title="Berichten" />
            <ul className="space-y-2.5">
              {BERICHTEN.map((b) => (
                <li key={b.van} className="flex items-center gap-3 p-3" style={panelStyle()}>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] text-[12px] font-bold"
                    style={{ ...monoDisp, border: `1px solid ${C.line}`, color: C.cyan }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="truncate text-[13px] font-semibold"
                        style={{ ...body, color: C.text }}
                      >
                        {b.van}
                      </span>
                      {b.ongelezen && (
                        <span
                          className="rounded-[4px] px-1.5 py-0.5 text-[9px] font-bold uppercase"
                          style={{ ...monoDisp, color: C.base, background: C.cyan }}
                        >
                          nieuw
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[12.5px]" style={{ ...body, color: C.textSoft }}>
                      {b.preview}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px]" style={{ ...monoDisp, color: C.textSoft }}>
                    {b.tijd}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <SectionHead kicker="task · queue" title="Acties" />
            <ul className="space-y-2.5">
              {ACTIES.map((a, i) => (
                <li key={a.titel} className="c243-depth p-4" style={panelStyle()}>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-[4px] text-[10px] font-bold"
                      style={{
                        ...monoDisp,
                        color: C.base,
                        background: a.urgentie === "warning" ? C.amber : C.cyan,
                      }}
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <span
                      className="text-[14px] font-semibold leading-snug"
                      style={{ ...body, color: C.text }}
                    >
                      {a.titel}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12.5px]" style={{ ...body, color: C.textSoft }}>
                    {a.detail}
                  </p>
                  <span
                    className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-bold"
                    style={{ ...monoDisp, color: C.cyan }}
                  >
                    {a.cta}
                    <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHead kicker="trust · certs" title="Certificaten" />
            <ul className="space-y-2">
              {CREDENTIALS.map((c) => (
                <li
                  key={c.naam}
                  className="flex items-center justify-between gap-2 p-3"
                  style={panelStyle()}
                >
                  <span
                    className="truncate text-[12.5px] font-medium"
                    style={{ ...body, color: C.text }}
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
    <div className="space-y-6">
      <SectionHead kicker="zoek · opdrachten" title="Marktplaats" />

      <div className="flex items-center gap-2 px-3.5 py-2.5" style={panelStyle()}>
        <Search size={17} className="shrink-0" style={{ color: C.cyan }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of skill…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[13.5px] outline-none placeholder:opacity-50"
          style={{ ...body, color: C.text }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="rounded-[5px] px-2.5 py-1 text-[11px] font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c243-cyan)]"
            style={{
              ...monoDisp,
              color: C.red,
              border: `1px solid ${C.red}`,
              ["--c243-cyan" as string]: C.cyanDeep,
            }}
          >
            wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 px-6 py-14 text-center"
          style={panelStyle()}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-[7px]"
            style={{ border: `1px solid ${C.red}`, color: C.red }}
            aria-hidden="true"
          >
            <Inbox size={26} strokeWidth={2} />
          </span>
          <h3 className="text-[17px] font-bold">
            <StereoHead>Geen resultaten</StereoHead>
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...body, color: C.textSoft }}>
            Geen opdracht voor &ldquo;{query}&rdquo;. Pas je zoekterm aan of wis het filter.
          </p>
          <button
            onClick={() => setQuery("")}
            className="mt-1 rounded-[6px] px-4 py-2 text-[13px] font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c243-cyan)]"
            style={{
              ...monoDisp,
              color: C.base,
              background: C.cyan,
              ["--c243-cyan" as string]: C.cyanDeep,
            }}
          >
            filter wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <article
                key={o.id}
                className="c243-depth flex h-full flex-col p-5"
                style={panelStyle()}
              >
                <div className="flex items-start justify-between gap-3">
                  <MatchReadout value={o.match} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className="flex h-9 w-9 items-center justify-center rounded-[6px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c243-cyan)]"
                    style={{
                      border: `1px solid ${isSaved ? C.cyan : C.line}`,
                      color: isSaved ? C.cyan : C.textSoft,
                      ["--c243-cyan" as string]: C.cyanDeep,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={16} aria-hidden="true" />
                    ) : (
                      <Bookmark size={16} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <h3
                  className="mt-3 text-[16px] font-semibold leading-tight"
                  style={{ ...body, color: C.text }}
                >
                  {o.titel}
                </h3>
                <div className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.textSoft }}>
                  {o.opdrachtgever}
                </div>
                <dl
                  className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]"
                  style={{ ...body, color: C.text }}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} style={{ color: C.textSoft }} aria-hidden="true" />
                    {o.plaats}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wallet size={13} style={{ color: C.textSoft }} aria-hidden="true" />
                    {o.tarief}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} style={{ color: C.textSoft }} aria-hidden="true" />
                    {o.uren}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} style={{ color: C.textSoft }} aria-hidden="true" />
                    {o.start}
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-[4px] border px-2 py-0.5 text-[10.5px] font-semibold"
                      style={{ ...monoDisp, borderColor: C.line, color: C.textSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => onOpen(o)}
                  className="group mt-4 inline-flex items-center justify-center gap-1.5 rounded-[6px] py-2.5 text-[13px] font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c243-cyan)]"
                  style={{
                    ...monoDisp,
                    color: C.cyan,
                    border: `1px solid ${C.cyan}`,
                    ["--c243-cyan" as string]: C.cyanDeep,
                  }}
                >
                  open opdracht
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
  saved: boolean;
  toggleSave: () => void;
  onBack: () => void;
}) {
  const [applied, setApplied] = useState(false);
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c243-cyan)]"
        style={{
          ...monoDisp,
          color: C.textSoft,
          border: `1px solid ${C.line}`,
          ["--c243-cyan" as string]: C.cyanDeep,
        }}
      >
        <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
        terug
      </button>

      <div className="c243-depth p-6" style={panelStyle(true)}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <MatchReadout value={opdracht.match} />
            <div>
              <h2 className="text-[23px] font-bold leading-tight sm:text-[26px]">
                <StereoHead style={body}>{opdracht.titel}</StereoHead>
              </h2>
              <div className="mt-1 text-[13.5px]" style={{ ...body, color: C.textSoft }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <button
            onClick={toggleSave}
            aria-pressed={saved}
            className="inline-flex items-center gap-1.5 rounded-[6px] px-3 py-2 text-[12px] font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c243-cyan)]"
            style={{
              ...monoDisp,
              color: saved ? C.cyan : C.textSoft,
              border: `1px solid ${saved ? C.cyan : C.line}`,
              ["--c243-cyan" as string]: C.cyanDeep,
            }}
          >
            {saved ? (
              <BookmarkCheck size={14} aria-hidden="true" />
            ) : (
              <Bookmark size={14} aria-hidden="true" />
            )}
            {saved ? "bewaard" : "bewaar"}
          </button>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "tarief", value: opdracht.tarief },
            { Icon: Clock, label: "inzet", value: opdracht.uren },
            { Icon: Calendar, label: "start", value: opdracht.start },
            { Icon: MapPin, label: "plaats", value: opdracht.plaats },
          ].map((m) => (
            <div key={m.label} className="p-3" style={panelStyle()}>
              <m.Icon size={15} style={{ color: C.cyan }} aria-hidden="true" />
              <dt
                className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.16em]"
                style={{ ...monoDisp, color: C.textSoft }}
              >
                {m.label}
              </dt>
              <dd className="text-[14.5px] font-semibold" style={{ ...body, color: C.text }}>
                {m.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="rounded-[4px] border px-2 py-0.5 text-[10.5px] font-semibold"
              style={{ ...monoDisp, borderColor: C.line, color: C.textSoft }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="p-5" style={panelStyle()}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-[5px]"
              style={{ color: C.cyan, border: `1px solid ${C.cyan}` }}
              aria-hidden="true"
            >
              <Plus size={13} strokeWidth={2.8} />
            </span>
            <span
              className="text-[13px] font-bold uppercase"
              style={{ ...monoDisp, color: C.cyan }}
            >
              waarom dit past
            </span>
          </div>
          <ul className="space-y-2">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...body, color: C.text }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.cyan }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5" style={panelStyle()}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-[5px]"
              style={{ color: C.amber, border: `1px solid ${C.amber}` }}
              aria-hidden="true"
            >
              <Minus size={13} strokeWidth={2.8} />
            </span>
            <span
              className="text-[13px] font-bold uppercase"
              style={{ ...monoDisp, color: C.amber }}
            >
              let op
            </span>
          </div>
          <ul className="space-y-2">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...body, color: C.text }}
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

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className="inline-flex items-center gap-2 rounded-[6px] px-6 py-3 text-[14px] font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c243-cyan)]"
          style={{
            ...monoDisp,
            color: C.base,
            background: applied ? C.mint : C.cyan,
            ["--c243-cyan" as string]: C.cyanDeep,
          }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.8} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.6} aria-hidden="true" />
          )}
          {applied ? "reactie verstuurd" : "reageer op opdracht"}
        </button>
        {applied && (
          <span className="text-[12.5px]" style={{ ...body, color: C.textSoft }}>
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
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-8">
      <div>
        <SectionHead kicker="verify · trust" title="Verificatie" />
        <p className="-mt-2 text-[12.5px]" style={{ ...body, color: C.textSoft }}>
          {verified} van {CREDENTIALS.length} geverifieerd · {PROFIEL.trust}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            return (
              <div key={c.naam} className="flex items-center gap-3 p-4" style={panelStyle()}>
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c243-cyan)]"
                  style={{
                    border: `1px solid ${done ? C.cyan : C.line}`,
                    background: done ? C.cyan : "transparent",
                    color: C.base,
                    ["--c243-cyan" as string]: C.cyanDeep,
                  }}
                >
                  {done && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ ...body, color: C.text }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...body, color: C.textSoft }}>
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
            <span className="inline-flex items-center gap-2 text-[15px] font-bold">
              <FileText size={17} strokeWidth={2.4} style={{ color: C.cyan }} aria-hidden="true" />
              <StereoHead>Documenten</StereoHead>
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className="flex h-8 w-8 items-center justify-center rounded-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c243-cyan)]"
              style={{
                border: `1px solid ${C.line}`,
                color: C.cyan,
                ["--c243-cyan" as string]: C.cyanDeep,
              }}
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
                className="rounded-[5px] px-2.5 py-1 text-[10.5px] font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c243-cyan)]"
                style={{
                  ...monoDisp,
                  color: feedState === s ? C.base : C.textSoft,
                  background: feedState === s ? C.cyan : "transparent",
                  border: `1px solid ${feedState === s ? C.cyan : C.line}`,
                  ["--c243-cyan" as string]: C.cyanDeep,
                }}
              >
                {s === "ok" ? "geladen" : s === "loading" ? "laden" : "fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="p-3" style={panelStyle()}>
                  <div
                    className="h-3 w-2/3 animate-pulse rounded"
                    style={{ background: "rgba(238,241,246,0.12)" }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: "rgba(238,241,246,0.08)" }}
                  />
                </li>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <div
              className="flex flex-col items-center gap-2 px-4 py-8 text-center"
              style={panelStyle()}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-[6px]"
                style={{ color: C.red, border: `1px solid ${C.red}` }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-bold">
                <StereoHead>Laden mislukt</StereoHead>
              </div>
              <p className="text-[12px]" style={{ ...body, color: C.textSoft }}>
                Kon de documentenkluis niet bereiken.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className="mt-1 rounded-[6px] px-4 py-2 text-[12px] font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c243-cyan)]"
                style={{
                  ...monoDisp,
                  color: C.base,
                  background: C.cyan,
                  ["--c243-cyan" as string]: C.cyanDeep,
                }}
              >
                opnieuw
              </button>
            </div>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => (
                <li key={d.naam} className="flex items-center gap-3 p-3" style={panelStyle()}>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] text-[8.5px] font-bold"
                    style={{ ...monoDisp, border: `1px solid ${C.line}`, color: C.cyan }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12.5px] font-semibold"
                      style={{ ...body, color: C.text }}
                    >
                      {d.naam}
                    </div>
                    <div className="text-[11px]" style={{ ...monoDisp, color: C.textSoft }}>
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
    <div className="space-y-6">
      <SectionHead kicker="task · queue" title="Acties" />

      {openCount === 0 ? (
        <div
          className="flex flex-col items-center gap-3 px-6 py-14 text-center"
          style={panelStyle()}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-[7px]"
            style={{ border: `1px solid ${C.mint}`, color: C.mint }}
            aria-hidden="true"
          >
            <Check size={28} strokeWidth={2.4} />
          </span>
          <h3 className="text-[17px] font-bold">
            <StereoHead>Wachtrij leeg</StereoHead>
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...body, color: C.textSoft }}>
            Je hebt alle acties afgerond. Nieuwe taken verschijnen hier vanzelf.
          </p>
        </div>
      ) : (
        <>
          <div className="inline-flex items-center gap-2 px-4 py-2" style={panelStyle()}>
            <span
              className="flex h-6 w-6 items-center justify-center rounded-[5px] text-[12px] font-bold"
              style={{ ...monoDisp, color: C.base, background: C.cyan }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[13px] font-semibold" style={{ ...body, color: C.text }}>
              {openCount} openstaande acties in de wachtrij
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              return (
                <li
                  key={a.titel}
                  className="c243-depth flex items-start gap-4 p-5"
                  style={panelStyle(isDone)}
                >
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c243-cyan)]"
                    style={{
                      border: `1px solid ${isDone ? C.mint : C.line}`,
                      background: isDone ? C.mint : "transparent",
                      color: C.base,
                      ["--c243-cyan" as string]: C.cyanDeep,
                    }}
                  >
                    {isDone && <Check size={16} strokeWidth={3} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[15px] font-semibold leading-snug"
                      style={{
                        ...body,
                        color: C.text,
                        textDecoration: isDone ? "line-through" : "none",
                        opacity: isDone ? 0.55 : 1,
                      }}
                    >
                      {a.titel}
                    </div>
                    <p
                      className="mt-1 text-[12.5px]"
                      style={{ ...body, color: C.textSoft, opacity: isDone ? 0.55 : 1 }}
                    >
                      {a.detail}
                    </p>
                    {!isDone && (
                      <span
                        className="mt-2.5 inline-flex items-center gap-1 rounded-[6px] px-3 py-1.5 text-[12px] font-bold uppercase"
                        style={{
                          ...monoDisp,
                          color: a.urgentie === "warning" ? C.amber : C.cyan,
                          border: `1px solid ${a.urgentie === "warning" ? C.amber : C.cyan}`,
                        }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  {a.urgentie === "warning" && !isDone && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase"
                      style={{ ...monoDisp, color: C.amber }}
                    >
                      <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" />
                      urgent
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
  const badgeTone = (status: string): string =>
    status === "Betaald" ? C.mint : status === "Openstaand" ? C.amber : C.textSoft;
  return (
    <div className="space-y-6">
      <SectionHead kicker="fin · facturen" title="Facturen" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "betaald mnd", value: "€ 5.552", tone: C.mint },
          { label: "openstaand", value: "€ 1.350", tone: C.amber },
          { label: "concept", value: "€ 880", tone: C.textSoft },
        ].map((s) => (
          <div key={s.label} className="p-4" style={panelStyle()}>
            <div
              className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ ...monoDisp, color: C.textSoft }}
            >
              {s.label}
            </div>
            <div
              className="mt-1 text-[24px] font-bold tabular-nums"
              style={{ ...monoDisp, color: s.tone }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="p-1.5" style={panelStyle()}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["factuur", "klant", "datum", "bedrag", "status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em]"
                    style={{ ...monoDisp, color: C.textSoft }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => (
                <tr key={f.nr} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td
                    className="px-3 py-3 text-[12.5px] font-bold"
                    style={{ ...monoDisp, color: C.cyan }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-3 py-3 text-[13px]" style={{ ...body, color: C.text }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-3 py-3 text-[12.5px]"
                    style={{ ...monoDisp, color: C.textSoft }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-3 py-3 text-[13px] font-semibold tabular-nums"
                    style={{ ...monoDisp, color: C.text }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 text-[11px] font-bold uppercase"
                      style={{
                        ...monoDisp,
                        color: badgeTone(f.status),
                        border: `1px solid ${badgeTone(f.status)}`,
                      }}
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

export function Concept243() {
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
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, color: C.text, background: C.base }}
    >
      {/* Depth deepens on hover — anaglyph channel offset grows slightly. Reduced-motion aware. */}
      <style>{`
        .c243-depth { transition: box-shadow 240ms ease, transform 240ms ease; }
        .c243-depth:hover {
          box-shadow: -4px 0 0 rgba(255,59,92,0.30), 4px 0 0 rgba(0,229,255,0.30);
          transform: translateY(-1px);
        }
        @media (prefers-reduced-motion: reduce) {
          .c243-depth { transition: none; }
          .c243-depth:hover { transform: none; box-shadow: -2px 0 0 rgba(255,59,92,0.16), 2px 0 0 rgba(0,229,255,0.16); }
        }
      `}</style>

      <div className="relative z-[1] mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-[8px]"
              style={{
                border: `1px solid ${C.cyan}`,
                color: C.cyan,
                boxShadow: "-2px 0 0 rgba(255,59,92,0.3), 2px 0 0 rgba(0,229,255,0.3)",
              }}
              aria-hidden="true"
            >
              <Layers size={20} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div className="text-[20px] font-bold">
                <StereoHead>ANAGLYF</StereoHead>
              </div>
              <div
                className="text-[10px] font-bold uppercase tracking-[0.24em]"
                style={{ ...monoDisp, color: C.textSoft }}
              >
                zzp · stereo z-depth
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...body, color: C.text }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[10.5px]"
                style={{ ...monoDisp, color: C.cyan }}
              >
                <BadgeCheck size={11} strokeWidth={2.4} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-[8px] text-[14px] font-bold"
              style={{ ...monoDisp, border: `1px solid ${C.red}`, color: C.red }}
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
                className="inline-flex shrink-0 items-center gap-1.5 rounded-[6px] px-3.5 py-2 text-[12px] font-bold uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c243-cyan)]"
                style={{
                  ...monoDisp,
                  color: on ? C.base : C.textSoft,
                  background: on ? C.cyan : "transparent",
                  border: `1px solid ${on ? C.cyan : C.line}`,
                  ["--c243-cyan" as string]: C.cyanDeep,
                }}
              >
                <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
                {s.label}
              </button>
            );
          })}
        </nav>

        <main>
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
              saved={saved.has(active.id)}
              toggleSave={() => setSaved((s) => toggleSet(s, active.id))}
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
          className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[10.5px]"
          style={{ ...monoDisp, borderColor: C.line, color: C.textSoft }}
        >
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare
              size={12}
              strokeWidth={2.2}
              style={{ color: C.cyan }}
              aria-hidden="true"
            />
            {BERICHTEN.filter((b) => b.ongelezen).length} ongelezen ·{" "}
            <ListChecks size={11} strokeWidth={2.2} className="inline" aria-hidden="true" />{" "}
            {ACTIES.length} acties
          </span>
          <span style={{ color: C.red }}>depth//atmosphere · data//scherp</span>
        </footer>
      </div>
    </div>
  );
}
