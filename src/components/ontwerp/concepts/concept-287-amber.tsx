"use client";

// Concept 287 — "Amber" · Warme amber CRT-terminal / retro-futurist (dark).
// Signature: een amber-fosfor terminal op void-zwart. Alles in warm amber met een dof-amber voor
// secundair, subtiele scanline-textuur, een knipperende cursor-block, monospace overal, een
// status-ticker bovenaan, ASCII-dividers en box-drawing randen, command-prompt-gevoel met `>`.
// Retro maar leesbaar en toegankelijk — geen groen, geen neon-cyaan, puur warm amber.
// Fonts: --font-lab-plex-mono (primair mono) + --font-lab-space-mono (accent mono).

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  Terminal,
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
  FileText,
  RefreshCw,
  CircleAlert,
  Plus,
  Minus,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
  Hourglass,
  ShieldCheck,
  ChevronRight,
  Cpu,
  Activity,
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

// Amber phosphor palette. Warm monochrome on void black — no green, no cyan. Contrast stays legible.
const C = {
  void: "#0a0806",
  panel: "#12100b",
  panel2: "#0f0d08",
  raise: "#1a160e",
  line: "#3a2f1a",
  lineSoft: "#241d10",
  amber: "#ffb000",
  amberBright: "#ffc857",
  amber2: "#e0a63e",
  fg: "#eabf63",
  muted: "#a37f38",
  faint: "#6f571f",
  rust: "#ff5a3c",
  rustSoft: "#3a1710",
  amberWash: "#241a08",
};

const mono: CSSProperties = { fontFamily: "var(--font-lab-plex-mono), ui-monospace, monospace" };
const monoAlt: CSSProperties = {
  fontFamily: "var(--font-lab-space-mono), ui-monospace, monospace",
};

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb000] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0806]";

const glow: CSSProperties = { textShadow: "0 0 8px rgba(255,176,0,0.30)" };

// Subtle CRT scanline texture — faint horizontal amber lines, kept low so text stays readable.
const SCANLINES =
  "repeating-linear-gradient(to bottom, rgba(255,176,0,0.035) 0px, rgba(255,176,0,0.035) 1px, transparent 1px, transparent 3px)";

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: Terminal,
  marktplaats: Search,
  opdracht: FileText,
  verificatie: ShieldCheck,
  acties: Check,
  facturen: Wallet,
  documenten: FileText,
  berichten: Activity,
};

const SCREEN_CMD: Record<ScreenKey, string> = {
  dashboard: "run dashboard",
  marktplaats: "grep --markt",
  opdracht: "cat opdracht",
  verificatie: "verify --docs",
  acties: "todo --list",
  facturen: "ledger --show",
  documenten: "ls documenten",
  berichten: "tail berichten",
};

// ---- Primitives -------------------------------------------------------------

function Cursor({ size = 9 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block align-middle"
      style={{
        width: size,
        height: size + 4,
        background: C.amber,
        animation: "amberBlink 1s steps(1) infinite",
        boxShadow: "0 0 6px rgba(255,176,0,0.6)",
      }}
    />
  );
}

function AsciiRule({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 overflow-hidden" aria-hidden="true">
      {label && (
        <span
          className="shrink-0 text-[10px] uppercase tracking-[0.2em]"
          style={{ ...monoAlt, color: C.amber2 }}
        >
          {label}
        </span>
      )}
      <span
        className="min-w-0 flex-1 truncate text-[12px] leading-none"
        style={{ ...mono, color: C.faint }}
      >
        {"─".repeat(240)}
      </span>
    </div>
  );
}

function TermBox({
  label,
  right,
  children,
  bodyClass,
  style,
}: {
  label?: string;
  right?: ReactNode;
  children: ReactNode;
  bodyClass?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className="rounded-[3px]"
      style={{ background: C.panel, border: `1px solid ${C.line}`, ...style }}
    >
      {label && (
        <div
          className="flex items-center justify-between gap-2 px-3 py-1.5"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          <span
            className="inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em]"
            style={{ ...monoAlt, color: C.amber }}
          >
            <span style={{ color: C.faint }} aria-hidden="true">
              {"┌─"}
            </span>
            {label}
          </span>
          {right}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </div>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  code: string;
  Icon: LucideIcon;
  tone: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", code: "OK", Icon: BadgeCheck, tone: C.amber };
    case "SUBMITTED":
      return { label: "In beoordeling", code: "WAIT", Icon: Hourglass, tone: C.amber2 };
    case "EXPIRING":
      return { label: "Verloopt bijna", code: "WARN", Icon: TriangleAlert, tone: C.amberBright };
    case "REJECTED":
      return { label: "Afgewezen", code: "FAIL", Icon: XCircle, tone: C.rust };
  }
}

function StatusBadge({ status }: { status: CredStatus }) {
  const { label, code, Icon, tone } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
      style={{
        ...monoAlt,
        color: tone,
        background: status === "REJECTED" ? C.rustSoft : C.amberWash,
        border: `1px solid ${tone === C.rust ? "#5a2618" : C.line}`,
      }}
    >
      <Icon size={11} strokeWidth={2.2} aria-hidden="true" />
      <span aria-hidden="true">[{code}]</span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

// ASCII match meter — filled/empty blocks + percentage. On-theme and colour-independent.
function MatchMeter({ value, width = 8 }: { value: number; width?: number }) {
  const filled = Math.round((value / 100) * width);
  const tone = value >= 90 ? C.amber : value >= 82 ? C.amberBright : C.amber2;
  return (
    <span
      className="inline-flex items-center gap-2"
      style={{ ...mono }}
      aria-label={`Match ${value} procent`}
    >
      <span className="text-[13px] leading-none tracking-[-0.05em]" style={{ color: tone }}>
        <span aria-hidden="true">{"█".repeat(filled)}</span>
        <span aria-hidden="true" style={{ color: C.faint }}>
          {"░".repeat(Math.max(0, width - filled))}
        </span>
      </span>
      <span className="text-[13px] font-bold tabular-nums" style={{ color: tone }}>
        {value}%
      </span>
    </span>
  );
}

function Sparkline({
  data,
  tone = C.amber,
  height = 30,
}: {
  data: number[];
  tone?: string;
  height?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 66 - 17;
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
        stroke={tone}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {pts.map(([x, y], i) => (
        <rect
          key={i}
          x={x - 1.1}
          y={y - 1.1}
          width={2.2}
          height={2.2}
          fill={tone}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

function TermButton({
  children,
  onClick,
  variant = "solid",
  className,
  ariaLabel,
  ariaPressed,
  tone = C.amber,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "ghost";
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  tone?: string;
}) {
  const [hot, setHot] = useState(false);
  const solid = variant === "solid";
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-[2px] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors duration-150 ${RING} ${className ?? ""}`}
      style={{
        ...monoAlt,
        color: solid ? (hot ? C.void : C.void) : hot ? C.void : tone,
        background: solid ? (hot ? C.amberBright : tone) : hot ? tone : "transparent",
        border: `1px solid ${tone}`,
      }}
    >
      {children}
    </button>
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
      <div
        className="mb-2 flex items-center gap-2 text-[12px]"
        style={{ ...mono, color: C.amber2 }}
      >
        <span style={{ color: C.amber }} aria-hidden="true">
          {">"}
        </span>
        <span>{SCREEN_CMD[screenKey]}</span>
        <Cursor size={7} />
      </div>
      <h1
        className="text-[24px] font-bold uppercase leading-tight tracking-[0.02em] sm:text-[28px]"
        style={{ ...mono, color: C.amber, ...glow }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2 max-w-2xl text-[13px] leading-relaxed"
          style={{ ...mono, color: C.muted }}
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
      <TermBox
        label="session"
        style={{ background: C.panel2 }}
        right={
          <span
            className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em]"
            style={{ ...monoAlt, color: C.amber }}
          >
            <ShieldCheck size={12} strokeWidth={2.2} aria-hidden="true" />
            {PROFIEL.trust}
          </span>
        }
      >
        <div className="p-6 sm:p-8">
          <div className="text-[12px]" style={{ ...mono, color: C.amber2 }}>
            <span style={{ color: C.amber }} aria-hidden="true">
              {">"}
            </span>{" "}
            login — {PROFIEL.plaats} · {PROFIEL.rol}
          </div>
          <h1
            className="mt-3 text-[30px] font-bold uppercase leading-none tracking-[0.02em] sm:text-[40px]"
            style={{ ...mono, color: C.amber, ...glow }}
          >
            Goedemorgen, {voornaam}
            <Cursor />
          </h1>
          <p
            className="mt-4 max-w-md text-[13px] leading-relaxed"
            style={{ ...mono, color: C.muted }}
          >
            Systeem online. Alle sensoren rustig — hieronder de status van je werk, kort en scherp.
          </p>
        </div>
      </TermBox>

      <div className="mt-4">
        <AsciiRule label="metrics" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <TermBox key={k.label}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="text-[10px] uppercase tracking-[0.1em]"
                    style={{ ...monoAlt, color: C.muted }}
                  >
                    {k.label}
                  </span>
                  <span
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                    style={{ ...mono, color: k.up ? C.amber : C.rust }}
                  >
                    <Trend size={11} strokeWidth={2.4} aria-hidden="true" />
                    {k.trend}
                  </span>
                </div>
                <div
                  className="mt-2 text-[24px] font-bold tabular-nums leading-none"
                  style={{ ...mono, color: C.amber, ...glow }}
                >
                  {k.value}
                </div>
                <div className="mt-3">
                  <Sparkline data={k.spark} />
                </div>
              </div>
            </TermBox>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <AsciiRule label="beste_match" />
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group block w-full rounded-[3px] p-0 text-left transition-colors duration-150 ${RING}`}
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.amber)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.line)}
          >
            <span className="block p-5 sm:p-6">
              <span className="flex items-center justify-between gap-3">
                <MatchMeter value={top.match} />
                <span
                  className="text-[10px] uppercase tracking-[0.16em]"
                  style={{ ...monoAlt, color: C.faint }}
                >
                  {top.id}
                </span>
              </span>
              <span
                className="mt-4 block text-[18px] font-bold uppercase leading-tight tracking-[0.01em]"
                style={{ ...mono, color: C.amber }}
              >
                {top.titel}
              </span>
              <span className="mt-1 block text-[12.5px]" style={{ ...mono, color: C.muted }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </span>
              <span className="mt-4 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-[2px] px-2 py-0.5 text-[10.5px] uppercase tracking-[0.06em]"
                    style={{ ...monoAlt, color: C.amber2, border: `1px solid ${C.line}` }}
                  >
                    {t}
                  </span>
                ))}
              </span>
              <span
                className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...monoAlt, color: C.amber }}
              >
                Open opdracht
                <ArrowRight
                  size={14}
                  strokeWidth={2.2}
                  className="transition-transform duration-150 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </span>
          </button>
        </div>

        <div>
          <div className="mb-3">
            <AsciiRule label="alerts" />
          </div>
          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const warn = a.urgentie === "warning";
              return (
                <TermBox key={a.titel}>
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-bold uppercase tracking-[0.1em]"
                        style={{ ...monoAlt, color: warn ? C.amberBright : C.amber2 }}
                      >
                        [{warn ? "WARN" : "INFO"}]
                      </span>
                      <ChevronRight
                        size={12}
                        strokeWidth={2}
                        style={{ color: C.faint }}
                        aria-hidden="true"
                      />
                    </div>
                    <div
                      className="mt-1.5 text-[12.5px] font-semibold leading-snug"
                      style={{ ...mono, color: C.fg }}
                    >
                      {a.titel}
                    </div>
                    <div
                      className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold uppercase tracking-[0.06em]"
                      style={{ ...monoAlt, color: C.amber }}
                    >
                      {a.cta}
                      <ArrowRight size={11} strokeWidth={2.4} aria-hidden="true" />
                    </div>
                  </div>
                </TermBox>
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
        sub="Zoek en filter opdrachten. Elke match toont eerlijk waarom hij past — en waar het schuurt."
      />

      <TermBox label="query" style={{ background: C.panel2 }}>
        <div className="flex items-center gap-2 px-4 py-3">
          <span className="text-[13px]" style={{ ...mono, color: C.amber }} aria-hidden="true">
            {"$"}
          </span>
          <Search size={15} className="shrink-0" style={{ color: C.amber2 }} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="grep opdrachten: titel, plaats of vaardigheid…"
            aria-label="Zoek opdrachten"
            className="w-full bg-transparent text-[13px] outline-none placeholder:opacity-50"
            style={{ ...mono, color: C.amber }}
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className={`rounded-[2px] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${RING}`}
              style={{ ...monoAlt, color: C.void, background: C.amber }}
            >
              clear
            </button>
          ) : (
            <Cursor size={8} />
          )}
        </div>
      </TermBox>

      <div
        className="mt-3 flex items-center justify-between text-[11px]"
        style={{ ...mono, color: C.muted }}
      >
        <span>
          {"//"} {filtered.length} van {OPDRACHTEN.length} resultaten
        </span>
        <span className="uppercase tracking-[0.12em]" style={{ color: C.faint }}>
          sort: match desc
        </span>
      </div>

      {filtered.length === 0 ? (
        <TermBox style={{ marginTop: 16 }}>
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-[3px]"
              style={{ color: C.amber, border: `1px solid ${C.line}`, background: C.amberWash }}
              aria-hidden="true"
            >
              <Search size={24} strokeWidth={1.8} />
            </span>
            <h3 className="text-[18px] font-bold uppercase" style={{ ...mono, color: C.amber }}>
              0 matches
            </h3>
            <p className="max-w-xs text-[12.5px]" style={{ ...mono, color: C.muted }}>
              <span aria-hidden="true">{"> "}</span>
              geen resultaat voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
            </p>
            <div className="mt-1">
              <TermButton onClick={() => setQuery("")} variant="ghost">
                reset filter
              </TermButton>
            </div>
          </div>
        </TermBox>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <div
                key={o.id}
                className="group flex h-full flex-col rounded-[3px] transition-colors duration-150"
                style={{ background: C.panel, border: `1px solid ${C.line}` }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.amber2)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.line)}
              >
                <div
                  className="flex items-center justify-between gap-2 px-4 py-2"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="text-[10px] uppercase tracking-[0.14em]"
                    style={{ ...monoAlt, color: C.faint }}
                  >
                    {o.id}
                  </span>
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-7 w-7 items-center justify-center rounded-[2px] transition-colors ${RING}`}
                    style={{
                      color: isSaved ? C.void : C.amber2,
                      background: isSaved ? C.amber : "transparent",
                      border: `1px solid ${isSaved ? C.amber : C.line}`,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={14} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <Bookmark size={14} strokeWidth={2.2} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <MatchMeter value={o.match} />
                  <h3
                    className="mt-3 text-[15px] font-bold uppercase leading-tight tracking-[0.01em]"
                    style={{ ...mono, color: C.amber }}
                  >
                    {o.titel}
                  </h3>
                  <div className="mt-0.5 text-[12px]" style={{ ...mono, color: C.muted }}>
                    {o.opdrachtgever}
                  </div>
                  <dl
                    className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11.5px]"
                    style={{ ...mono, color: C.fg }}
                  >
                    {[
                      { Icon: MapPin, v: o.plaats },
                      { Icon: Wallet, v: o.tarief },
                      { Icon: Clock, v: o.uren },
                      { Icon: Calendar, v: o.start },
                    ].map((m, mi) => (
                      <div key={mi} className="flex items-center gap-1.5">
                        <m.Icon
                          size={12}
                          strokeWidth={2}
                          style={{ color: C.faint }}
                          aria-hidden="true"
                        />
                        {m.v}
                      </div>
                    ))}
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-1">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-[2px] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.05em]"
                        style={{ ...monoAlt, color: C.amber2, border: `1px solid ${C.lineSoft}` }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto pt-4">
                    <TermButton onClick={() => onOpen(o)} className="w-full">
                      cat opdracht
                      <ArrowRight
                        size={13}
                        strokeWidth={2.2}
                        className="transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </TermButton>
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
      <div className="mb-5">
        <TermButton onClick={onBack} variant="ghost" ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={13} strokeWidth={2.2} aria-hidden="true" />
          cd ..
        </TermButton>
      </div>

      <TermBox label={opdracht.id} style={{ background: C.panel2 }}>
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <MatchMeter value={opdracht.match} width={10} />
              <h2
                className="mt-4 text-[24px] font-bold uppercase leading-tight tracking-[0.01em]"
                style={{ ...mono, color: C.amber, ...glow }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[13px]" style={{ ...mono, color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
            <TermButton
              onClick={() => toggleSave(opdracht.id)}
              variant={isSaved ? "solid" : "ghost"}
              ariaPressed={isSaved}
              ariaLabel={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
            >
              {isSaved ? (
                <BookmarkCheck size={13} strokeWidth={2.2} aria-hidden="true" />
              ) : (
                <Bookmark size={13} strokeWidth={2.2} aria-hidden="true" />
              )}
              {isSaved ? "bewaard" : "bewaar"}
            </TermButton>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
              { Icon: Clock, label: "Inzet", value: opdracht.uren },
              { Icon: Calendar, label: "Start", value: opdracht.start },
              { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-[2px] p-3"
                style={{ background: C.void, border: `1px solid ${C.lineSoft}` }}
              >
                <m.Icon size={14} strokeWidth={2} style={{ color: C.amber2 }} aria-hidden="true" />
                <div
                  className="mt-2 text-[9.5px] uppercase tracking-[0.1em]"
                  style={{ ...monoAlt, color: C.muted }}
                >
                  {m.label}
                </div>
                <div className="text-[13px] font-bold" style={{ ...mono, color: C.amber }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </TermBox>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <TermBox label="waarom_past">
          <ul className="space-y-2.5 p-5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[12.5px]"
                style={{ ...mono, color: C.fg }}
              >
                <span
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px]"
                  style={{ background: C.amber, color: C.void }}
                  aria-hidden="true"
                >
                  <Plus size={11} strokeWidth={2.8} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </TermBox>
        <TermBox label="let_op">
          <ul className="space-y-2.5 p-5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[12.5px]"
                style={{ ...mono, color: C.muted }}
              >
                <span
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px]"
                  style={{ border: `1px solid ${C.amber2}`, color: C.amber2 }}
                  aria-hidden="true"
                >
                  <Minus size={11} strokeWidth={2.8} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </TermBox>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <TermButton
          onClick={() => setApplied((v) => !v)}
          ariaPressed={applied}
          tone={applied ? C.amberBright : C.amber}
          className="px-5 py-2.5"
        >
          {applied ? (
            <Check size={15} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
          )}
          {applied ? "reactie verstuurd" : "reageer — submit"}
        </TermButton>
        {applied && (
          <span
            className="inline-flex items-center gap-1.5 text-[12px]"
            style={{ ...mono, color: C.amber2 }}
          >
            <Cpu size={13} strokeWidth={2} aria-hidden="true" />
            gemiddelde reactietijd opdrachtgever: 6 uur.
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
        sub="Elke status heeft een code, label én icoon — nooit alleen kleur. Documenten blijven privé."
      />

      <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, code, Icon, tone } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 rounded-[3px] px-3 py-3"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px]"
                style={{ color: tone, border: `1px solid ${tone === C.rust ? "#5a2618" : C.line}` }}
                aria-hidden="true"
              >
                <Icon size={15} strokeWidth={2.2} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.08em]"
                  style={{ ...monoAlt, color: tone }}
                >
                  [{code}]
                </div>
                <div className="text-[11px]" style={{ ...mono, color: C.muted }}>
                  {label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <TermBox
        label="trust"
        style={{ marginBottom: 24 }}
        right={
          <span
            className="text-[10px] uppercase tracking-[0.14em]"
            style={{ ...monoAlt, color: C.amber }}
          >
            level: hoog
          </span>
        }
      >
        <div className="flex items-center gap-4 p-5">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px]"
            style={{ color: C.amber, border: `1px solid ${C.line}`, background: C.amberWash }}
            aria-hidden="true"
          >
            <ShieldCheck size={22} strokeWidth={2} />
          </span>
          <div>
            <div className="text-[13px] font-bold uppercase" style={{ ...mono, color: C.amber }}>
              {PROFIEL.trust}
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...mono, color: C.muted }}>
              Documenten versleuteld opgeslagen — alleen gedeeld met jouw toestemming.
            </p>
          </div>
        </div>
      </TermBox>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            const { tone } = statusMeta(c.status);
            return (
              <TermBox key={c.naam}>
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[2px] transition-colors ${RING}`}
                    style={{
                      border: `1px solid ${done ? C.amber : C.line}`,
                      background: done ? C.amber : "transparent",
                      color: C.void,
                    }}
                  >
                    {done ? <Check size={13} strokeWidth={2.8} aria-hidden="true" /> : null}
                  </button>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] text-[9px] font-bold"
                    style={{ ...monoAlt, color: tone, border: `1px solid ${C.line}` }}
                    aria-hidden="true"
                  >
                    <FileText size={16} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold" style={{ ...mono, color: C.amber }}>
                      {c.naam}
                    </div>
                    <div className="text-[11.5px]" style={{ ...mono, color: C.muted }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              </TermBox>
            );
          })}
        </div>

        <div>
          <TermBox
            label="kluis"
            right={
              <button
                onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
                className={`flex h-6 w-6 items-center justify-center rounded-[2px] ${RING}`}
                style={{ color: C.amber, border: `1px solid ${C.line}` }}
                aria-label="Vernieuw documenten"
              >
                <RefreshCw size={12} strokeWidth={2} aria-hidden="true" />
              </button>
            }
          >
            <div className="p-4">
              <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Documentweergave">
                {(["ok", "loading", "error"] as const).map((s) => (
                  <button
                    key={s}
                    role="tab"
                    aria-selected={feedState === s}
                    onClick={() => setFeedState(s)}
                    className={`rounded-[2px] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] transition-colors ${RING}`}
                    style={{
                      ...monoAlt,
                      color: feedState === s ? C.void : C.muted,
                      background: feedState === s ? C.amber : "transparent",
                      border: `1px solid ${feedState === s ? C.amber : C.line}`,
                    }}
                  >
                    {s === "ok" ? "geladen" : s === "loading" ? "laden" : "fout"}
                  </button>
                ))}
              </div>

              {feedState === "loading" && (
                <ul className="space-y-2.5" aria-busy="true" aria-label="Documenten laden">
                  {[0, 1, 2, 3].map((i) => (
                    <li
                      key={i}
                      className="rounded-[2px] p-3.5"
                      style={{ background: C.void, border: `1px solid ${C.lineSoft}` }}
                    >
                      <div
                        className="h-3 w-2/3 animate-pulse rounded-[2px]"
                        style={{ background: C.raise }}
                      />
                      <div
                        className="mt-2 h-2.5 w-1/3 animate-pulse rounded-[2px]"
                        style={{ background: C.raise }}
                      />
                    </li>
                  ))}
                </ul>
              )}

              {feedState === "error" && (
                <div
                  className="flex flex-col items-center gap-2 rounded-[2px] px-4 py-9 text-center"
                  style={{ background: C.rustSoft, border: `1px solid #5a2618` }}
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-[2px]"
                    style={{ color: C.rust, border: `1px solid #5a2618` }}
                    aria-hidden="true"
                  >
                    <CircleAlert size={22} strokeWidth={2} />
                  </span>
                  <div
                    className="text-[13px] font-bold uppercase"
                    style={{ ...mono, color: C.rust }}
                  >
                    [FAIL] kluis offline
                  </div>
                  <p className="text-[11.5px]" style={{ ...mono, color: C.muted }}>
                    <span aria-hidden="true">{"> "}</span>
                    verbinding met documentenkluis mislukt. Probeer opnieuw.
                  </p>
                  <div className="mt-1">
                    <TermButton onClick={() => setFeedState("ok")} variant="ghost" tone={C.rust}>
                      retry
                    </TermButton>
                  </div>
                </div>
              )}

              {feedState === "ok" && (
                <ul className="space-y-2.5">
                  {DOCUMENTEN.map((d) => {
                    const { tone } = statusMeta(d.status);
                    return (
                      <li
                        key={d.naam}
                        className="flex items-center gap-3 rounded-[2px] p-3"
                        style={{ background: C.void, border: `1px solid ${C.lineSoft}` }}
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] text-[8.5px] font-bold"
                          style={{ ...monoAlt, color: tone, border: `1px solid ${C.line}` }}
                          aria-hidden="true"
                        >
                          {d.type}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div
                            className="truncate text-[12px] font-semibold"
                            style={{ ...mono, color: C.amber }}
                          >
                            {d.naam}
                          </div>
                          <div
                            className="text-[10.5px] tabular-nums"
                            style={{ ...mono, color: C.muted }}
                          >
                            {d.grootte} · {d.bijgewerkt}
                          </div>
                        </div>
                        <StatusBadge status={d.status} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </TermBox>
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
        sub="Afvinken wat vandaag om aandacht vraagt."
      />

      {openCount === 0 ? (
        <TermBox>
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-[3px]"
              style={{ color: C.amber, border: `1px solid ${C.line}`, background: C.amberWash }}
              aria-hidden="true"
            >
              <Check size={28} strokeWidth={2.2} />
            </span>
            <h3 className="text-[18px] font-bold uppercase" style={{ ...mono, color: C.amber }}>
              queue leeg
            </h3>
            <p className="max-w-xs text-[12.5px]" style={{ ...mono, color: C.muted }}>
              <span aria-hidden="true">{"> "}</span>
              alle taken afgerond. Systeem in ruststand.
            </p>
          </div>
        </TermBox>
      ) : (
        <>
          <div
            className="mb-5 inline-flex items-center gap-2.5 rounded-[3px] px-3 py-2"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-[2px] text-[12px] font-bold tabular-nums"
              style={{ ...mono, background: C.amber, color: C.void }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span
              className="text-[12px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...monoAlt, color: C.amber }}
            >
              {openCount} {openCount === 1 ? "taak" : "taken"} open
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <TermBox key={a.titel}>
                  <div className="flex items-start gap-4 p-4">
                    <button
                      onClick={() => toggleDone(a.titel)}
                      aria-pressed={isDone}
                      aria-label={
                        isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`
                      }
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] transition-colors ${RING}`}
                      style={{
                        border: `1px solid ${isDone ? C.amber : C.line}`,
                        background: isDone ? C.amber : "transparent",
                        color: C.void,
                      }}
                    >
                      {isDone ? <Check size={15} strokeWidth={2.8} aria-hidden="true" /> : null}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9.5px] font-bold uppercase tracking-[0.1em]"
                          style={{
                            ...monoAlt,
                            color: isDone ? C.faint : warn ? C.amberBright : C.amber2,
                          }}
                        >
                          [{isDone ? "DONE" : warn ? "WARN" : "TODO"}]
                        </span>
                      </div>
                      <div
                        className="mt-1 text-[13.5px] font-semibold leading-snug"
                        style={{
                          ...mono,
                          color: C.amber,
                          textDecoration: isDone ? "line-through" : "none",
                          opacity: isDone ? 0.5 : 1,
                        }}
                      >
                        {a.titel}
                      </div>
                      <p
                        className="mt-1 text-[11.5px]"
                        style={{ ...mono, color: C.muted, opacity: isDone ? 0.5 : 1 }}
                      >
                        {a.detail}
                      </p>
                      {!isDone && (
                        <span
                          className="mt-2.5 inline-flex items-center gap-1 rounded-[2px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
                          style={{ ...monoAlt, color: C.amber, border: `1px solid ${C.line}` }}
                        >
                          {a.cta}
                          <ArrowRight size={11} strokeWidth={2.4} aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  </div>
                </TermBox>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function Facturen() {
  const trend = [24.8, 13.5, 30.72, 8.8];
  const statusMap = (status: string): { code: string; tone: string; Icon: LucideIcon } =>
    status === "Betaald"
      ? { code: "PAID", tone: C.amber, Icon: Check }
      : status === "Openstaand"
        ? { code: "OPEN", tone: C.amberBright, Icon: Clock }
        : { code: "DRAFT", tone: C.muted, Icon: FileText };
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Facturen"
        sub="Grootboek van je omzet — betaald, openstaand en concept, in tabulaire cijfers."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-2">
          {[
            { label: "Betaald (mnd)", value: "€ 5.552", tone: C.amber },
            { label: "Openstaand", value: "€ 1.350", tone: C.amberBright },
            { label: "Concept", value: "€ 880", tone: C.muted },
          ].map((s) => (
            <TermBox key={s.label}>
              <div className="p-4">
                <div
                  className="text-[10px] uppercase tracking-[0.1em]"
                  style={{ ...monoAlt, color: C.muted }}
                >
                  {s.label}
                </div>
                <div
                  className="mt-2 text-[22px] font-bold tabular-nums"
                  style={{ ...mono, color: s.tone }}
                >
                  {s.value}
                </div>
              </div>
            </TermBox>
          ))}
        </div>
        <TermBox label="per_factuur">
          <div className="flex flex-col justify-between p-4">
            <Sparkline data={trend} tone={C.amber} height={44} />
          </div>
        </TermBox>
      </div>

      <TermBox label="ledger">
        <div className="overflow-x-auto p-2">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2.5 text-[10px] uppercase tracking-[0.1em]"
                    style={{ ...monoAlt, color: C.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const sm = statusMap(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.raise)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td
                      className="px-3 py-3 text-[12px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.amber }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3 text-[12.5px]" style={{ ...mono, color: C.fg }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-3 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3 text-[12.5px] font-bold tabular-nums"
                      style={{ ...mono, color: C.amber }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em]"
                        style={{ ...monoAlt, color: sm.tone, border: `1px solid ${C.line}` }}
                      >
                        <sm.Icon size={11} strokeWidth={2.4} aria-hidden="true" />[{sm.code}]
                        <span className="hidden sm:inline">{f.status}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
              <tr style={{ borderTop: `1px solid ${C.line}` }}>
                <td
                  className="px-3 py-3 text-[10.5px] uppercase tracking-[0.1em]"
                  style={{ ...monoAlt, color: C.muted }}
                >
                  Totaal
                </td>
                <td />
                <td />
                <td
                  className="px-3 py-3 text-[13px] font-bold tabular-nums"
                  style={{ ...mono, color: C.amber, ...glow }}
                >
                  € 7.782
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </TermBox>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept287() {
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

  const tickerItems = [
    "SYS OK",
    "SESSIE actief",
    `vertrouwen: ${PROFIEL.trust}`,
    "3 matches > 85%",
    "VOG verloopt over 23 dagen",
    "kluis: versleuteld",
    "reactietijd ~6u",
  ];
  const ticker = tickerItems.join("   ·   ");

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...mono, color: C.fg, background: C.void }}
    >
      <style>{`@keyframes amberBlink{0%,49%{opacity:1}50%,100%{opacity:0}}@keyframes amberMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: SCANLINES }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, rgba(255,176,0,0.05) 0%, transparent 55%)",
        }}
      />

      <div className="relative mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        {/* Status ticker */}
        <div
          className="mb-5 overflow-hidden rounded-[3px]"
          style={{ background: C.panel2, border: `1px solid ${C.line}` }}
        >
          <div className="flex items-center gap-3 px-3 py-2">
            <span
              className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ ...monoAlt, color: C.amber }}
            >
              <Activity size={12} strokeWidth={2.4} aria-hidden="true" />
              live
            </span>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div
                className="inline-flex whitespace-nowrap text-[11px]"
                style={{ ...mono, color: C.amber2, animation: "amberMarquee 26s linear infinite" }}
              >
                <span className="pr-8">{ticker}</span>
                <span className="pr-8" aria-hidden="true">
                  {ticker}
                </span>
              </div>
            </div>
          </div>
        </div>

        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-[3px]"
              style={{ color: C.amber, border: `1px solid ${C.amber}`, background: C.amberWash }}
              aria-hidden="true"
            >
              <Terminal size={19} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="inline-flex items-center gap-1 text-[18px] font-bold uppercase tracking-[0.04em]"
                style={{ ...mono, color: C.amber, ...glow }}
              >
                amber<span style={{ color: C.faint }}>://</span>zzp
                <Cursor size={7} />
              </div>
              <div
                className="text-[9.5px] uppercase tracking-[0.24em]"
                style={{ ...monoAlt, color: C.muted }}
              >
                ZZP platform · crt v287
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12px] font-semibold" style={{ ...mono, color: C.amber }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[10.5px]"
                style={{ ...mono, color: C.amber2 }}
              >
                <BadgeCheck size={11} strokeWidth={2.2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-[3px] text-[12px] font-bold"
              style={{
                ...mono,
                color: C.amber,
                border: `1px solid ${C.line}`,
                background: C.amberWash,
              }}
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
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-[2px] px-3 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] transition-colors duration-150 ${RING}`}
                style={{
                  ...monoAlt,
                  color: on ? C.void : C.amber2,
                  background: on ? C.amber : "transparent",
                  border: `1px solid ${on ? C.amber : C.line}`,
                }}
              >
                <span style={{ color: on ? C.void : C.faint }} aria-hidden="true">
                  {on ? "▸" : "▹"}
                </span>
                <Icon size={13} strokeWidth={2} aria-hidden="true" />
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

        <footer className="mt-10">
          <AsciiRule />
          <div
            className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10.5px] uppercase tracking-[0.1em]"
            style={{ ...monoAlt, color: C.muted }}
          >
            <span className="inline-flex items-center gap-1.5">
              <Terminal size={12} strokeWidth={2} style={{ color: C.amber2 }} aria-hidden="true" />
              {SCREENS.length} schermen · amber phosphor
            </span>
            <span className="inline-flex items-center gap-1.5">
              warm crt-terminal
              <Cursor size={6} />
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
