"use client";

// Concept 296 — "Windtunnel" · aerodynamica / laminaire stroomlijn-velden (dark technisch).
// Signature: donkere achtergrond (#0b0f14) met fijne, vloeiende streamline-curves als
// achtergrond-motief (inline-SVG bezierpaden), data die langs meetlijnen "stroomt", dunne
// meetraster-hairlines en één elektrisch limoen-cyaan accent (#8ef0a0) dat drukverschil/snelheid
// markeert. Kalm-technisch, precisie-instrument-gevoel. Geen deeltjes-chaos — alleen laminaire
// veldlijnen. Fonts: --font-lab-geist (tekst) + --font-lab-mono (data/meetwaarden).

import { useState, type ReactNode } from "react";
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
  Wind,
  Gauge,
  Activity,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// Windtunnel palette — deep instrument dark, one electric lime-cyan for pressure/velocity marks.
const C = {
  base: "#0b0f14",
  panel: "#111823",
  panelSoft: "#0e141d",
  raise: "#16202d",
  line: "#1e2a39",
  lineSoft: "#18232f",
  lineFaint: "#141c26",
  fg: "#e6edf3",
  fgSoft: "#9fb0c0",
  muted: "#617184",
  faint: "#3d4c5e",
  accent: "#8ef0a0",
  accentDim: "#5bbf74",
  accentGlow: "rgba(142,240,160,0.14)",
  warn: "#ffcf6b",
  warnDim: "#c79a3f",
  danger: "#ff7a7a",
  dangerDim: "#c25858",
};

const sans = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ef0a0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f14]";

const SCREEN_META: Record<ScreenKey, { idx: string; maat: string }> = {
  dashboard: { idx: "S1", maat: "OVERZICHT" },
  marktplaats: { idx: "S2", maat: "INSTROOM" },
  opdracht: { idx: "S3", maat: "PROFIEL" },
  verificatie: { idx: "S4", maat: "IJKING" },
  acties: { idx: "S5", maat: "TURBULENTIE" },
  facturen: { idx: "S6", maat: "DEBIET" },
  documenten: { idx: "S7", maat: "KLUIS" },
  berichten: { idx: "S8", maat: "SIGNAAL" },
};

// ---- Streamline field ------------------------------------------------------
// Deterministic laminar flow lines: smooth sine-derived bezier paths that bend around
// a virtual body in the centre. No randomness at render — pure function of index.

function streamPath(row: number, rows: number, amp: number): string {
  const y = ((row + 0.5) / rows) * 100;
  // Distance from centreline drives how much the flow is deflected around the "body".
  const dist = (y - 50) / 50; // -1..1
  const bend = (1 - Math.abs(dist)) * amp * (dist >= 0 ? 1 : -1);
  const c1 = 30;
  const c2 = 70;
  return [
    `M -4 ${y.toFixed(2)}`,
    `C ${c1} ${(y - bend).toFixed(2)}, ${c2} ${(y + bend).toFixed(2)}, 104 ${y.toFixed(2)}`,
  ].join(" ");
}

function StreamField({ dense = false }: { dense?: boolean }) {
  const rows = dense ? 22 : 15;
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wt-flow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.accent} stopOpacity="0" />
          <stop offset="0.45" stopColor={C.accent} stopOpacity="0.42" />
          <stop offset="0.55" stopColor={C.accent} stopOpacity="0.42" />
          <stop offset="1" stopColor={C.accent} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="wt-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2a3a4d" stopOpacity="0" />
          <stop offset="0.5" stopColor="#2a3a4d" stopOpacity="0.9" />
          <stop offset="1" stopColor="#2a3a4d" stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: rows }).map((_, r) => {
        const amp = 8 + (r % 3) * 3;
        const isMark = r % 4 === 2;
        return (
          <path
            key={r}
            d={streamPath(r, rows, amp)}
            fill="none"
            stroke={isMark ? "url(#wt-flow)" : "url(#wt-line)"}
            strokeWidth={isMark ? 0.5 : 0.32}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}

// Fine measurement grid — instrument hairlines.
function MeasureGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style={{
        backgroundImage: `linear-gradient(${C.lineFaint} 1px, transparent 1px), linear-gradient(90deg, ${C.lineFaint} 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
        maskImage: "radial-gradient(120% 90% at 50% 0%, #000 55%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(120% 90% at 50% 0%, #000 55%, transparent 100%)",
      }}
    />
  );
}

// ---- Status ----------------------------------------------------------------

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  color: string;
  dim: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, color: C.accent, dim: C.accentDim };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Hourglass, color: C.fgSoft, dim: C.muted };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, color: C.warn, dim: C.warnDim };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.danger, dim: C.dangerDim };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, color } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
      style={{
        ...mono,
        color,
        background: `${color}14`,
        border: `1px solid ${color}40`,
      }}
    >
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </span>
  );
}

// A velocity read-out — big number with a "pressure" bar behind it.
function MatchGauge({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const high = value >= 90;
  const col = high ? C.accent : value >= 85 ? C.accentDim : C.fgSoft;
  return (
    <span
      className="inline-flex flex-col items-end"
      aria-label={`Match ${value} procent`}
      style={mono}
    >
      <span className="flex items-baseline gap-1">
        <span
          className={`font-semibold tabular-nums leading-none ${size === "sm" ? "text-[22px]" : "text-[30px]"}`}
          style={{ color: col }}
        >
          {value}
        </span>
        <span
          className="text-[9px] font-medium uppercase tracking-[0.14em]"
          style={{ color: C.muted }}
        >
          %
        </span>
      </span>
      <span
        className="mt-1.5 block overflow-hidden rounded-full"
        style={{
          width: size === "sm" ? 56 : 76,
          height: 3,
          background: C.line,
        }}
        aria-hidden="true"
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: col, boxShadow: `0 0 8px ${col}88` }}
        />
      </span>
    </span>
  );
}

// Streaming data trace — the KPI sparkline as a wind-trace.
function Trace({
  data,
  color = C.accent,
  height = 34,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 66 - 16;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,100 ${line} 100,100`;
  const [lx, ly] = pts[pts.length - 1] ?? ([0, 0] as const);
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <polygon points={area} fill={color} opacity={0.08} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lx} cy={ly} r={1.8} fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ---- Buttons ---------------------------------------------------------------

function PrimaryButton({
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
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[12.5px] font-semibold tracking-[0.01em] transition-all duration-200 hover:brightness-110 active:scale-[0.98] ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: C.base,
        background: C.accent,
        boxShadow: `0 0 0 1px ${C.accent}, 0 8px 24px -12px ${C.accent}`,
      }}
    >
      {children}
    </button>
  );
}

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
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold tracking-[0.01em] transition-colors duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: active ? C.accent : C.fgSoft,
        background: active ? C.accentGlow : "transparent",
        border: `1px solid ${active ? `${C.accent}55` : C.line}`,
      }}
    >
      {children}
    </button>
  );
}

// A framed instrument panel.
function Panel({
  children,
  className,
  flow = false,
}: {
  children: ReactNode;
  className?: string;
  flow?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className ?? ""}`}
      style={{ background: C.panel, border: `1px solid ${C.line}` }}
    >
      {flow && (
        <div className="absolute inset-0 opacity-40">
          <StreamField />
        </div>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

function Kicker({ children, color = C.muted }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-[0.24em]"
      style={{ ...mono, color }}
    >
      {children}
    </span>
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
  const m = SCREEN_META[screenKey];
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2.5">
        <span
          className="rounded-md px-2 py-0.5 text-[10px] font-bold tracking-[0.12em]"
          style={{
            ...mono,
            color: C.accent,
            background: C.accentGlow,
            border: `1px solid ${C.accent}33`,
          }}
        >
          {m.idx}
        </span>
        <Kicker>{m.maat}</Kicker>
        <span className="h-px flex-1" style={{ background: C.line }} aria-hidden="true" />
      </div>
      <h1
        className="mt-4 text-[26px] font-semibold leading-[1.05] tracking-tight sm:text-[32px]"
        style={{ ...sans, color: C.fg }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2 max-w-xl text-[13.5px] leading-relaxed"
          style={{ ...sans, color: C.fgSoft }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ---- Screens ---------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div className="space-y-8">
      {/* Hero — laminar flow field with the greeting riding the airstream. */}
      <Panel flow className="px-6 py-8 sm:px-9 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Wind size={13} style={{ color: C.accent }} aria-hidden="true" />
              <Kicker color={C.accent}>
                {PROFIEL.plaats} · {PROFIEL.rol}
              </Kicker>
            </div>
            <h1
              className="text-[32px] font-semibold leading-[0.98] tracking-tight sm:text-[46px]"
              style={{ ...sans, color: C.fg }}
            >
              Goedemorgen, {voornaam}.
            </h1>
            <p
              className="mt-4 max-w-md text-[14px] leading-relaxed"
              style={{ ...sans, color: C.fgSoft }}
            >
              Alles stroomt soepel vandaag. Alleen de meetwaarden die tellen — en waar weerstand
              ontstaat.
            </p>
          </div>
          <div
            className="flex items-center gap-2.5 rounded-full px-4 py-2.5"
            style={{ background: C.accentGlow, border: `1px solid ${C.accent}44` }}
          >
            <BadgeCheck
              size={16}
              strokeWidth={2.2}
              style={{ color: C.accent }}
              aria-hidden="true"
            />
            <span className="text-[12px] font-semibold" style={{ ...sans, color: C.accent }}>
              {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Panel>

      {/* KPI instrument row. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Panel key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-medium tabular-nums"
                style={{ ...mono, color: C.faint }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
                style={{
                  ...mono,
                  color: k.up ? C.accent : C.warn,
                  background: k.up ? C.accentGlow : `${C.warn}18`,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-3 text-[26px] font-semibold tabular-nums leading-none"
              style={{ ...sans, color: C.fg }}
            >
              {k.value}
            </div>
            <div className="mt-1.5 text-[11px]" style={{ ...sans, color: C.fgSoft }}>
              {k.label}
            </div>
            <div className="mt-3">
              <Trace data={k.spark} color={k.up ? C.accent : C.warn} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <Kicker>Beste match · hoogste snelheid</Kicker>
            <span className="text-[11px]" style={{ ...mono, color: C.faint }}>
              {top.id}
            </span>
          </div>
          <Panel flow className="p-0">
            <button
              onClick={() => onOpen(top)}
              className={`group block w-full rounded-2xl p-6 text-left transition-colors hover:bg-white/[0.02] ${RING}`}
            >
              <span className="flex items-start justify-between gap-5">
                <span className="min-w-0 flex-1">
                  <span
                    className="block text-[21px] font-semibold leading-tight tracking-tight"
                    style={{ ...sans, color: C.fg }}
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
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                        style={{
                          ...sans,
                          color: C.fgSoft,
                          background: C.raise,
                          border: `1px solid ${C.line}`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-3">
                  <MatchGauge value={top.match} />
                  <ArrowRight
                    size={20}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                    style={{ color: C.accent }}
                    aria-hidden="true"
                  />
                </span>
              </span>
            </button>
          </Panel>

          <Panel className="flex items-start gap-4 p-5">
            <Gauge
              size={22}
              strokeWidth={2}
              style={{ color: C.accent }}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
            />
            <div>
              <div className="text-[14px] font-semibold" style={{ ...sans, color: C.fg }}>
                {PROFIEL.trust}
              </div>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ ...sans, color: C.fgSoft }}>
                Je documenten zijn geijkt en geverifieerd — opdrachtgevers zien direct dat je
                betrouwbaar bent.
              </p>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Kicker>Turbulentie · vraagt aandacht</Kicker>
          <Panel className="p-2">
            <ul>
              {ACTIES.map((a, i) => {
                const warn = a.urgentie === "warning";
                const col = warn ? C.warn : C.accent;
                return (
                  <li
                    key={a.titel}
                    className="rounded-xl px-3 py-3.5"
                    style={{
                      borderBottom: i < ACTIES.length - 1 ? `1px solid ${C.lineSoft}` : "none",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                        style={{ background: `${col}18`, border: `1px solid ${col}44` }}
                        aria-hidden="true"
                      >
                        {warn ? (
                          <TriangleAlert size={12} strokeWidth={2.2} style={{ color: col }} />
                        ) : (
                          <Activity size={12} strokeWidth={2.2} style={{ color: col }} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-[13px] font-semibold leading-snug"
                          style={{ ...sans, color: C.fg }}
                        >
                          {a.titel}
                        </div>
                        <div
                          className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold"
                          style={{ ...sans, color: col }}
                        >
                          {a.cta}
                          <ChevronRight size={12} strokeWidth={2.4} aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
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
        sub="De instroom, geordend op snelheid: waarom een opdracht past — en waar de weerstand zit."
      />

      <Panel className="mb-6 flex items-center gap-3 px-4 py-3">
        <Search size={16} className="shrink-0" style={{ color: C.muted }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-50"
          style={{ ...sans, color: C.fg }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
          {String(filtered.length).padStart(2, "0")}/{String(OPDRACHTEN.length).padStart(2, "0")}
        </span>
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${RING}`}
            style={{ ...sans, color: C.accent }}
          >
            Wis
          </button>
        )}
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Search size={30} strokeWidth={1.6} style={{ color: C.muted }} aria-hidden="true" />
          <h3 className="text-[20px] font-semibold tracking-tight" style={{ ...sans, color: C.fg }}>
            Geen instroom
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Verruim je zoekterm om de stroom te openen.
          </p>
          <div className="mt-1">
            <GhostButton onClick={() => setQuery("")}>Filter wissen</GhostButton>
          </div>
        </Panel>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <Panel key={o.id} className="p-0">
                <div className="group grid grid-cols-1 gap-4 p-5 transition-colors hover:bg-white/[0.015] sm:grid-cols-[1fr,auto] sm:items-start">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex items-center gap-2">
                      <Kicker>{o.id}</Kicker>
                    </div>
                    <button
                      onClick={() => onOpen(o)}
                      className={`block rounded text-left ${RING}`}
                      aria-label={`Open ${o.titel}`}
                    >
                      <h3
                        className="text-[18px] font-semibold leading-tight tracking-tight transition-colors group-hover:text-white"
                        style={{ ...sans, color: C.fg }}
                      >
                        {o.titel}
                      </h3>
                    </button>
                    <div className="mt-1 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
                      {o.opdrachtgever}
                    </div>
                    <dl
                      className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[12px]"
                      style={{ ...sans, color: C.fgSoft }}
                    >
                      {[
                        { Icon: MapPin, v: o.plaats },
                        { Icon: Wallet, v: o.tarief },
                        { Icon: Clock, v: o.uren },
                        { Icon: Calendar, v: o.start },
                      ].map((mm, mi) => (
                        <div key={mi} className="flex items-center gap-1.5">
                          <mm.Icon
                            size={13}
                            strokeWidth={2}
                            style={{ color: C.muted }}
                            aria-hidden="true"
                          />
                          {mm.v}
                        </div>
                      ))}
                    </dl>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <li
                          key={r}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
                          style={{
                            ...sans,
                            color: C.accent,
                            background: C.accentGlow,
                            border: `1px solid ${C.accent}33`,
                          }}
                        >
                          <Check size={11} strokeWidth={2.6} aria-hidden="true" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <MatchGauge value={o.match} size="sm" />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSave(o.id)}
                        aria-pressed={isSaved}
                        aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${RING}`}
                        style={{
                          color: isSaved ? C.accent : C.fgSoft,
                          background: isSaved ? C.accentGlow : "transparent",
                          border: `1px solid ${isSaved ? `${C.accent}55` : C.line}`,
                        }}
                      >
                        {isSaved ? (
                          <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                        ) : (
                          <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
                        )}
                      </button>
                      <PrimaryButton onClick={() => onOpen(o)}>
                        Bekijk
                        <ArrowRight
                          size={13}
                          strokeWidth={2.4}
                          className="transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </PrimaryButton>
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
      <div className="mb-6">
        <GhostButton onClick={onBack} ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
          Terug naar instroom
        </GhostButton>
      </div>

      <Panel flow className="mb-6 px-6 py-7 sm:px-8">
        <div className="mb-2">
          <Kicker color={C.accent}>{opdracht.id}</Kicker>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <h2
              className="text-[28px] font-semibold leading-[1.05] tracking-tight sm:text-[36px]"
              style={{ ...sans, color: C.fg }}
            >
              {opdracht.titel}
            </h2>
            <div className="mt-2 text-[14px]" style={{ ...sans, color: C.fgSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <MatchGauge value={opdracht.match} />
            <GhostButton
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
            </GhostButton>
          </div>
        </div>
      </Panel>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
          { Icon: Clock, label: "Inzet", value: opdracht.uren },
          { Icon: Calendar, label: "Start", value: opdracht.start },
          { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
        ].map((m) => (
          <Panel key={m.label} className="p-4">
            <m.Icon size={15} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
            <div
              className="mt-2 text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.muted }}
            >
              {m.label}
            </div>
            <div className="mt-0.5 text-[15px] font-semibold" style={{ ...sans, color: C.fg }}>
              {m.value}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: C.accentGlow, border: `1px solid ${C.accent}44` }}
              aria-hidden="true"
            >
              <ArrowRight size={12} strokeWidth={2.4} style={{ color: C.accent }} />
            </span>
            <span className="text-[13px] font-semibold" style={{ ...sans, color: C.fg }}>
              Lift · waarom deze past
            </span>
          </div>
          <ul className="space-y-0">
            {opdracht.redenen.plus.map((r, i) => (
              <li
                key={r}
                className="flex items-start gap-3 py-2.5 text-[13.5px]"
                style={{
                  ...sans,
                  color: C.fg,
                  borderTop: i > 0 ? `1px solid ${C.lineSoft}` : "none",
                }}
              >
                <Check
                  size={16}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.accent }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: `${C.warn}18`, border: `1px solid ${C.warn}44` }}
              aria-hidden="true"
            >
              <TriangleAlert size={12} strokeWidth={2.2} style={{ color: C.warn }} />
            </span>
            <span className="text-[13px] font-semibold" style={{ ...sans, color: C.fg }}>
              Weerstand · even op letten
            </span>
          </div>
          <ul className="space-y-0">
            {opdracht.redenen.min.map((r, i) => (
              <li
                key={r}
                className="flex items-start gap-3 py-2.5 text-[13.5px]"
                style={{
                  ...sans,
                  color: C.fg,
                  borderTop: i > 0 ? `1px solid ${C.lineSoft}` : "none",
                }}
              >
                <TriangleAlert
                  size={16}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.warn }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <PrimaryButton
          onClick={() => setApplied((v) => !v)}
          ariaPressed={applied}
          className="px-6 py-3 text-[13px]"
        >
          {applied ? (
            <Check size={16} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </PrimaryButton>
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
        title="Verificatie & ijking"
        sub="Elke status heeft een eigen label én icoon — nooit alleen kleur. Zo blijft de meting leesbaar."
      />

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, color } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 rounded-xl px-3.5 py-3"
              style={{ background: `${color}12`, border: `1px solid ${color}38` }}
            >
              <Icon size={16} strokeWidth={2.2} style={{ color }} aria-hidden="true" />
              <span className="text-[12px] font-semibold" style={{ ...sans, color: C.fg }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Panel className="mb-6 flex items-start gap-4 p-5">
        <Gauge
          size={24}
          strokeWidth={2}
          style={{ color: C.accent }}
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        />
        <div>
          <div className="text-[15px] font-semibold" style={{ ...sans, color: C.fg }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-1 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Certificaten · meetpunten</Kicker>
          </div>
          <Panel className="p-2">
            {CREDENTIALS.map((c, i) => {
              const done = checked.has(c.naam);
              return (
                <div
                  key={c.naam}
                  className="flex items-center gap-4 rounded-xl px-3 py-3.5"
                  style={{
                    borderBottom: i < CREDENTIALS.length - 1 ? `1px solid ${C.lineSoft}` : "none",
                  }}
                >
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${done ? C.accent : C.line}`,
                      background: done ? C.accent : "transparent",
                      color: C.base,
                    }}
                  >
                    {done && <Check size={13} strokeWidth={2.6} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold" style={{ ...sans, color: C.fg }}>
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
          </Panel>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Kicker>Documentkluis</Kicker>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-7 w-7 items-center justify-center rounded-full ${RING}`}
              style={{ color: C.fgSoft, border: `1px solid ${C.line}` }}
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
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? C.accent : C.fgSoft,
                  background: feedState === s ? C.accentGlow : "transparent",
                  border: `1px solid ${feedState === s ? `${C.accent}55` : C.line}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <Panel className="p-2" aria-busy="true">
              <ul aria-label="Documenten laden">
                {[0, 1, 2, 3].map((i) => (
                  <li
                    key={i}
                    className="px-3 py-3.5"
                    style={{ borderBottom: i < 3 ? `1px solid ${C.lineSoft}` : "none" }}
                  >
                    <div
                      className="h-3 w-2/3 animate-pulse rounded"
                      style={{ background: C.raise }}
                    />
                    <div
                      className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded"
                      style={{ background: C.raise }}
                    />
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {feedState === "error" && (
            <Panel className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <div
                className="absolute inset-0"
                style={{ border: `1px solid ${C.danger}44`, borderRadius: 16 }}
                aria-hidden="true"
              />
              <XCircle size={26} strokeWidth={2} style={{ color: C.danger }} aria-hidden="true" />
              <div className="text-[15px] font-semibold" style={{ ...sans, color: C.fg }}>
                Even geen signaal
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.muted }}>
                We konden je documentkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <PrimaryButton onClick={() => setFeedState("ok")}>Opnieuw proberen</PrimaryButton>
              </div>
            </Panel>
          )}

          {feedState === "ok" && (
            <Panel className="p-2">
              <ul>
                {DOCUMENTEN.map((d, i) => (
                  <li
                    key={d.naam}
                    className="flex items-center gap-3 px-3 py-3"
                    style={{
                      borderBottom: i < DOCUMENTEN.length - 1 ? `1px solid ${C.lineSoft}` : "none",
                    }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[9px] font-bold"
                      style={{
                        ...mono,
                        color: C.fgSoft,
                        background: C.raise,
                        border: `1px solid ${C.line}`,
                      }}
                      aria-hidden="true"
                    >
                      {d.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[12.5px] font-semibold"
                        style={{ ...sans, color: C.fg }}
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
        screenKey="acties"
        title="Turbulentie"
        sub="Waar de stroom vandaag weerstand ondervindt — vink af zodra het is opgelost."
      />

      {openCount === 0 ? (
        <Panel flow className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Check size={30} strokeWidth={2.2} style={{ color: C.accent }} aria-hidden="true" />
          <h3 className="text-[20px] font-semibold tracking-tight" style={{ ...sans, color: C.fg }}>
            Volledig laminair
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Geen turbulentie meer. Alles stroomt vandaag zonder weerstand.
          </p>
        </Panel>
      ) : (
        <>
          <div className="mb-6 flex items-baseline gap-3">
            <span
              className="text-[38px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.warn }}
            >
              {String(openCount).padStart(2, "0")}
            </span>
            <span
              className="text-[12px] font-medium uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.muted }}
            >
              {openCount === 1 ? "punt open" : "punten open"}
            </span>
          </div>

          <div className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              const col = warn ? C.warn : C.accent;
              return (
                <Panel key={a.titel} className="p-5">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleDone(a.titel)}
                      aria-pressed={isDone}
                      aria-label={
                        isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`
                      }
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${RING}`}
                      style={{
                        border: `1.5px solid ${isDone ? C.accent : C.line}`,
                        background: isDone ? C.accent : "transparent",
                        color: C.base,
                      }}
                    >
                      {isDone && <Check size={13} strokeWidth={2.6} aria-hidden="true" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[15px] font-semibold leading-snug"
                        style={{
                          ...sans,
                          color: C.fg,
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
                          className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold"
                          style={{ ...sans, color: col }}
                        >
                          {a.cta}
                          <ChevronRight size={12} strokeWidth={2.4} aria-hidden="true" />
                        </span>
                      )}
                    </div>
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
  const trend = [24.8, 13.5, 30.72, 8.8];
  const statusColor = (status: string): string =>
    status === "Openstaand" ? C.warn : status === "Concept" ? C.muted : C.accent;
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Debiet"
        sub="Het gelddebiet in beeld — betaald, openstaand en concept, zonder ruis."
      />

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-4">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", color: C.accent },
          { label: "Openstaand", value: "€ 1.350", color: C.warn },
          { label: "Concept", value: "€ 880", color: C.fgSoft },
        ].map((s) => (
          <Panel key={s.label} className="p-4">
            <div
              className="text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.muted }}
            >
              {s.label}
            </div>
            <div
              className="mt-2 text-[26px] font-semibold tabular-nums"
              style={{ ...sans, color: s.color }}
            >
              {s.value}
            </div>
          </Panel>
        ))}
        <Panel className="flex flex-col justify-between p-4">
          <div
            className="text-[10px] font-medium uppercase tracking-[0.14em]"
            style={{ ...mono, color: C.muted }}
          >
            Per factuur
          </div>
          <Trace data={trend} color={C.accent} height={40} />
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Nr.", "Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.14em]"
                    style={{ ...mono, color: C.muted, textAlign: i >= 4 ? "right" : "left" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => (
                <tr key={f.nr} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                  <td
                    className="px-4 py-3.5 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.faint }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12.5px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.fg }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[13px]" style={{ ...sans, color: C.fg }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-4 py-3.5 text-right text-[13px] font-semibold tabular-nums"
                    style={{ ...sans, color: C.fg }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                      style={{
                        ...mono,
                        color: statusColor(f.status),
                        background: `${statusColor(f.status)}14`,
                        border: `1px solid ${statusColor(f.status)}38`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: statusColor(f.status) }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: `1px solid ${C.line}` }}>
                <td className="px-4 py-4" />
                <td
                  className="px-4 py-4 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.muted }}
                  colSpan={3}
                >
                  Totaal debiet
                </td>
                <td
                  className="px-4 py-4 text-right text-[15px] font-semibold tabular-nums"
                  style={{ ...sans, color: C.accent }}
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

// ---- Shell -----------------------------------------------------------------

export function Concept296() {
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
      style={{ ...sans, color: C.fg, background: C.base }}
    >
      <MeasureGrid />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-70">
        <StreamField dense />
      </div>
      <div className="relative mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: C.accentGlow, border: `1px solid ${C.accent}55` }}
              aria-hidden="true"
            >
              <Wind size={18} strokeWidth={2.2} style={{ color: C.accent }} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[16px] font-semibold tracking-tight"
                style={{ ...sans, color: C.fg }}
              >
                Windtunnel
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
              <div className="text-[12.5px] font-semibold" style={{ ...sans, color: C.fg }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...sans, color: C.accent }}
              >
                <BadgeCheck size={12} strokeWidth={2.2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
              style={{
                ...sans,
                color: C.accent,
                background: C.panel,
                border: `1px solid ${C.accent}44`,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav
          className="mb-8 flex flex-wrap gap-1.5 overflow-x-auto rounded-full p-1.5"
          aria-label="Hoofdnavigatie"
          style={{ background: C.panelSoft, border: `1px solid ${C.line}` }}
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: on ? C.base : C.fgSoft,
                  background: on ? C.accent : "transparent",
                }}
              >
                <span
                  className="text-[9px] font-bold tabular-nums"
                  style={{ ...mono, color: on ? C.base : C.faint }}
                >
                  {SCREEN_META[s.key].idx}
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

        <footer
          className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[10.5px]"
          style={{ ...mono, color: C.muted, borderColor: C.line }}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: C.accent, boxShadow: `0 0 8px ${C.accent}` }}
              aria-hidden="true"
            />
            {SCREENS.length} meetpunten · windtunnel v296
          </span>
          <span className="uppercase tracking-[0.14em]">Laminair · flow · één limoen</span>
        </footer>
      </div>
    </div>
  );
}
