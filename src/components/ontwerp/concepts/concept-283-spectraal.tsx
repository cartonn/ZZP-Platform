"use client";

// Concept 283 — "Spectraal" · Audio-waveform / spectrogram data-viz (dark).
// Signature: een donkere "stage" waar data als geluid wordt getoond. KPI's en voortgang zijn
// equalizer- en waveform-balken met een frequentie-gradient (cyaan → violet → magenta), match-%
// is amplitude, en een spectrogram-band dient als scheidingslijn. Diepe achtergrond (#0a0d14) met
// een zachte glow-on-hover en een waveform-scrubber-gevoel — onderscheidend door de audio-metafoor.
// Fonts: --font-lab-geist (interface) + --font-lab-mono (cijfers/labels, monospace).

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
  AudioLines,
  Radio,
  Play,
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

// Spectral palette — a dark stage with a cyan→violet→magenta frequency spectrum. High contrast text.
const C = {
  stage: "#0a0d14",
  stage2: "#0c1019",
  panel: "#111725",
  panelHi: "#161f31",
  panelSoft: "#0e1420",
  line: "#1f2942",
  lineSoft: "#18203400",
  border: "#212c46",
  ink: "#f5f8ff",
  fg: "#e2e8f6",
  fgSoft: "#a9b4cd",
  muted: "#7987a2",
  faint: "#4c5872",
  cyan: "#22d3ee",
  sky: "#38bdf8",
  indigo: "#6366f1",
  violet: "#a855f7",
  magenta: "#e0459c",
  green: "#34d399",
  greenSoft: "#0f2a24",
  amber: "#f5a524",
  amberSoft: "#2c2411",
  red: "#fb6f84",
  redSoft: "#2c1620",
  cyanSoft: "#0c2430",
  violetSoft: "#1c1533",
};

const geist = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

// The frequency spectrum — every bar and gauge samples a colour from this ramp by position.
const SPECTRUM = [C.cyan, C.sky, C.indigo, C.violet, C.magenta];

// A fixed presentational amplitude pattern for waveforms (pure styling, not core data).
const WAVE = [
  0.36, 0.62, 0.44, 0.82, 0.55, 0.95, 0.68, 0.5, 0.86, 0.4, 0.66, 0.54, 0.9, 0.48, 0.76, 0.44, 0.6,
  0.34, 0.72, 0.5, 0.84, 0.46, 0.64, 0.38, 0.8, 0.52, 0.7, 0.42,
];

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Sample the spectrum at t in [0,1] with a smooth linear interpolation between stops.
function spectrumAt(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const scaled = clamped * (SPECTRUM.length - 1);
  const i = Math.min(SPECTRUM.length - 2, Math.floor(scaled));
  const f = scaled - i;
  const [r1, g1, b1] = hexToRgb(SPECTRUM[i] ?? C.cyan);
  const [r2, g2, b2] = hexToRgb(SPECTRUM[i + 1] ?? C.magenta);
  const r = Math.round(r1 + (r2 - r1) * f);
  const g = Math.round(g1 + (g2 - g1) * f);
  const b = Math.round(b1 + (b2 - b1) * f);
  return `rgb(${r}, ${g}, ${b})`;
}

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0d14]";

// A soft radial "stage light" backdrop — layered spectrum glows on the deep background.
function stageGlow(): string {
  return `radial-gradient(80% 55% at 8% -6%, ${C.cyanSoft} 0%, transparent 55%), radial-gradient(70% 60% at 100% 8%, ${C.violetSoft} 0%, transparent 55%)`;
}

// ---- Primitives -------------------------------------------------------------

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Radio,
};

function panelStyle(): CSSProperties {
  return {
    background: C.panel,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
  };
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
    <div className={className} style={{ ...panelStyle(), ...style }}>
      {children}
    </div>
  );
}

// A card that lifts with a spectrum glow on hover/focus — the "stage light" effect.
function GlowCard({
  children,
  accent = C.cyan,
  className,
  style,
}: {
  children: ReactNode;
  accent?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const [hot, setHot] = useState(false);
  return (
    <div
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      className={`transition-all duration-300 ${className ?? ""}`}
      style={{
        ...panelStyle(),
        borderColor: hot ? accent : C.border,
        background: hot ? C.panelHi : C.panel,
        boxShadow: hot ? `0 0 0 1px ${accent}22, 0 14px 40px -18px ${accent}88` : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Vertical equalizer bars with a frequency gradient — the core KPI/spark visual.
function Equalizer({
  data,
  height = 42,
  active = true,
}: {
  data: number[];
  height?: number;
  active?: boolean;
}) {
  const max = Math.max(...data, 1);
  const n = data.length;
  return (
    <div className="flex items-end gap-[3px]" style={{ height }} aria-hidden="true">
      {data.map((v, i) => {
        const t = n <= 1 ? 0.5 : i / (n - 1);
        const tone = spectrumAt(t);
        const h = Math.max(12, (v / max) * 100);
        return (
          <span
            key={i}
            className="flex-1 rounded-t-[2px] transition-all duration-500"
            style={{
              height: `${h}%`,
              background: `linear-gradient(to top, ${tone}33, ${tone})`,
              boxShadow: active ? `0 0 8px -2px ${tone}` : "none",
              opacity: active ? 1 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
}

// Match-% rendered as an amplitude waveform — filled bars up to the value, muted beyond.
function MatchWave({
  value,
  bars = 26,
  height = 34,
  showLabel = true,
}: {
  value: number;
  bars?: number;
  height?: number;
  showLabel?: boolean;
}) {
  const filled = Math.round((value / 100) * bars);
  const tone = spectrumAt(value / 100);
  return (
    <div
      className="inline-flex items-center gap-2.5"
      aria-label={`Match ${value} procent`}
      role="img"
    >
      <div className="flex items-center gap-[2px]" style={{ height }} aria-hidden="true">
        {Array.from({ length: bars }).map((_, i) => {
          const amp = WAVE[i % WAVE.length] ?? 0.5;
          const on = i < filled;
          const barTone = on ? spectrumAt(i / (bars - 1)) : C.faint;
          return (
            <span
              key={i}
              className="w-[3px] rounded-full transition-all duration-300"
              style={{
                height: `${Math.max(14, amp * 100)}%`,
                background: barTone,
                boxShadow: on ? `0 0 6px -1px ${barTone}` : "none",
                opacity: on ? 1 : 0.5,
              }}
            />
          );
        })}
      </div>
      {showLabel && (
        <span className="inline-flex items-baseline gap-1">
          <span
            className="text-[18px] font-semibold tabular-nums leading-none"
            style={{ ...mono, color: tone }}
          >
            {value}
          </span>
          <span
            className="text-[9px] font-semibold uppercase tracking-[0.16em]"
            style={{ ...mono, color: C.muted }}
          >
            match
          </span>
        </span>
      )}
    </div>
  );
}

// A spectrogram band — a strip of frequency cells with pseudo-random intensity. Used as a divider.
function SpectrogramBand({ rows = 3, cols = 48 }: { rows?: number; cols?: number }) {
  return (
    <div
      className="flex flex-col gap-[2px] overflow-hidden rounded-lg p-[3px]"
      style={{ background: C.stage2, border: `1px solid ${C.line}` }}
      aria-hidden="true"
    >
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-[2px]">
          {Array.from({ length: cols }).map((_, c) => {
            const amp = WAVE[(c + r * 7) % WAVE.length] ?? 0.5;
            const tone = spectrumAt(c / (cols - 1));
            return (
              <span
                key={c}
                className="h-[6px] flex-1 rounded-[1px]"
                style={{ background: tone, opacity: 0.18 + amp * 0.62 }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// A scrubber-style progress rail with a playhead — the waveform-scrubber feel.
function Scrubber({ progress, accent = C.cyan }: { progress: number; accent?: string }) {
  const pct = Math.max(0, Math.min(100, progress));
  return (
    <div className="relative w-full" aria-hidden="true">
      <div className="h-[6px] w-full overflow-hidden rounded-full" style={{ background: C.stage2 }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(to right, ${C.cyan}, ${C.violet}, ${C.magenta})`,
          }}
        />
      </div>
      <span
        className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full"
        style={{
          left: `calc(${pct}% - 7px)`,
          background: C.ink,
          boxShadow: `0 0 0 3px ${accent}, 0 0 12px -2px ${accent}`,
        }}
      />
    </div>
  );
}

// Verification status vocabulary — label + icon + a spectrum-adjacent tone.
function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  soft: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, tone: C.green, soft: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Hourglass, tone: C.cyan, soft: C.cyanSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, tone: C.amber, soft: C.amberSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red, soft: C.redSoft };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, tone, soft } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-3 text-[11px] font-semibold"
      style={{ ...geist, color: tone, background: soft, border: `1px solid ${tone}44` }}
    >
      <span
        className="flex h-4 w-4 items-center justify-center rounded-full"
        style={{ background: tone }}
        aria-hidden="true"
      >
        <Icon size={10} strokeWidth={2.4} color={C.stage} />
      </span>
      {label}
    </span>
  );
}

// Filled glowing button — a lit key on the stage. Hover intensifies the glow.
function SpectralButton({
  children,
  onClick,
  accent = C.cyan,
  className,
  ariaLabel,
  ariaPressed,
}: {
  children: ReactNode;
  onClick?: () => void;
  accent?: string;
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all duration-300 ${RING} ${className ?? ""}`}
      style={{
        ...geist,
        color: C.stage,
        background: `linear-gradient(120deg, ${accent}, ${spectrumAt(0.72)})`,
        boxShadow: hot ? `0 0 22px -4px ${accent}` : `0 0 0 0 ${accent}`,
      }}
    >
      {children}
    </button>
  );
}

// Outline "channel" secondary button — lights its border on hover / when active.
function GhostButton({
  children,
  onClick,
  accent = C.cyan,
  className,
  ariaLabel,
  ariaPressed,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  accent?: string;
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  active?: boolean;
}) {
  const [hot, setHot] = useState(false);
  const lit = active || hot;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-300 ${RING} ${className ?? ""}`}
      style={{
        ...geist,
        color: lit ? accent : C.fgSoft,
        background: lit ? `${accent}14` : "transparent",
        border: `1px solid ${lit ? accent : C.border}`,
      }}
    >
      {children}
    </button>
  );
}

function ScreenHead({
  channel,
  title,
  sub,
  accent = C.cyan,
}: {
  channel: string;
  title: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className="flex h-6 items-end gap-[2px] rounded px-1"
          style={{ background: C.stage2, border: `1px solid ${C.line}` }}
          aria-hidden="true"
        >
          {[0.5, 0.9, 0.65].map((h, i) => (
            <span
              key={i}
              className="w-[2px] rounded-full"
              style={{ height: `${h * 16}px`, background: spectrumAt(i / 2) }}
            />
          ))}
        </span>
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.24em]"
          style={{ ...mono, color: accent }}
        >
          {channel}
        </span>
      </div>
      <h1
        className="text-[30px] font-semibold leading-tight tracking-tight sm:text-[36px]"
        style={{ ...geist, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-3 max-w-xl text-[14.5px] leading-relaxed"
          style={{ ...geist, color: C.fgSoft }}
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
      <div
        className="mb-9 overflow-hidden rounded-[22px] px-7 py-8 sm:px-9 sm:py-10"
        style={{
          border: `1px solid ${C.border}`,
          background: C.panelSoft,
          backgroundImage: stageGlow(),
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <div
              className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
              style={{ ...mono, color: C.cyan }}
            >
              <AudioLines size={13} strokeWidth={2.2} aria-hidden="true" />
              {PROFIEL.plaats} · live
            </div>
            <h1
              className="text-[32px] font-semibold leading-none tracking-tight sm:text-[42px]"
              style={{ ...geist, color: C.ink }}
            >
              Goedemorgen, {voornaam}
            </h1>
            <p
              className="mt-4 max-w-md text-[14.5px] leading-relaxed"
              style={{ ...geist, color: C.fgSoft }}
            >
              Je werk, gestemd als een frequentie — alles wat telt komt bovenaan het spectrum.
            </p>
          </div>
          <div
            className="flex items-center gap-2.5 rounded-full px-4 py-2.5"
            style={{ background: C.greenSoft, border: `1px solid ${C.green}44` }}
          >
            <ShieldCheck size={16} strokeWidth={2} style={{ color: C.green }} aria-hidden="true" />
            <span className="text-[12.5px] font-semibold" style={{ ...geist, color: C.green }}>
              {PROFIEL.trust}
            </span>
          </div>
        </div>
        <div className="mt-7">
          <SpectrogramBand />
        </div>
      </div>

      <div className="mb-9 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const accent = k.up ? C.cyan : C.amber;
          return (
            <GlowCard key={k.label} accent={accent} className="p-5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ ...mono, color: k.up ? C.green : C.amber }}
                >
                  <Trend size={11} strokeWidth={2.2} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-2 text-[27px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-4">
                <Equalizer data={k.spark} />
              </div>
            </GlowCard>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <AudioLines size={16} strokeWidth={2} style={{ color: C.cyan }} aria-hidden="true" />
            <h2
              className="text-[15px] font-semibold tracking-tight"
              style={{ ...geist, color: C.ink }}
            >
              Sterkste signaal
            </h2>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group block w-full overflow-hidden rounded-[18px] p-0 text-left transition-all duration-300 ${RING}`}
            style={{ ...panelStyle(), background: C.panel }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.violet;
              e.currentTarget.style.boxShadow = `0 16px 44px -20px ${C.violet}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span className="block p-6">
              <span className="flex items-start justify-between gap-4">
                <span className="min-w-0">
                  <span
                    className="text-[9.5px] font-semibold uppercase tracking-[0.2em]"
                    style={{ ...mono, color: C.faint }}
                  >
                    {top.id}
                  </span>
                  <span
                    className="mt-1 block text-[19px] font-semibold leading-tight"
                    style={{ ...geist, color: C.ink }}
                  >
                    {top.titel}
                  </span>
                  <span className="mt-1 block text-[13px]" style={{ ...geist, color: C.muted }}>
                    {top.opdrachtgever} · {top.plaats} · {top.tarief}
                  </span>
                </span>
                <ArrowRight
                  size={20}
                  className="mt-1 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                  style={{ color: C.violet }}
                  aria-hidden="true"
                />
              </span>
              <span className="mt-5 block">
                <MatchWave value={top.match} bars={34} height={40} />
              </span>
              <span className="mt-4 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2.5 py-0.5 text-[11px]"
                    style={{
                      ...geist,
                      color: C.fgSoft,
                      background: C.stage2,
                      border: `1px solid ${C.line}`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </span>
            </span>
          </button>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {OPDRACHTEN.slice(1).map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o)}
                className={`group block w-full rounded-[16px] p-5 text-left transition-all duration-300 ${RING}`}
                style={{ ...panelStyle() }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = spectrumAt(o.match / 100);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                <span className="flex items-center justify-between gap-3">
                  <span
                    className="text-[9.5px] font-semibold uppercase tracking-[0.18em]"
                    style={{ ...mono, color: C.faint }}
                  >
                    {o.id}
                  </span>
                  <MatchWave value={o.match} bars={12} height={22} showLabel />
                </span>
                <span
                  className="mt-2.5 block text-[14.5px] font-semibold leading-snug"
                  style={{ ...geist, color: C.ink }}
                >
                  {o.titel}
                </span>
                <span className="mt-0.5 block text-[12.5px]" style={{ ...geist, color: C.muted }}>
                  {o.opdrachtgever} · {o.tarief}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center gap-2">
            <ListTodo size={16} strokeWidth={2} style={{ color: C.amber }} aria-hidden="true" />
            <h2
              className="text-[15px] font-semibold tracking-tight"
              style={{ ...geist, color: C.ink }}
            >
              Vraagt aandacht
            </h2>
          </div>
          <ul className="space-y-3">
            {ACTIES.map((a, i) => {
              const accent = a.urgentie === "warning" ? C.amber : C.cyan;
              return (
                <GlowCard key={a.titel} accent={accent} className="overflow-hidden p-0">
                  <div className="flex">
                    <span
                      className="w-1 shrink-0"
                      style={{ background: spectrumAt(i / Math.max(1, ACTIES.length - 1)) }}
                      aria-hidden="true"
                    />
                    <div className="p-4">
                      <div
                        className="text-[13px] font-semibold leading-snug"
                        style={{ ...geist, color: C.ink }}
                      >
                        {a.titel}
                      </div>
                      <div
                        className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold"
                        style={{ ...geist, color: accent }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </GlowCard>
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
        channel="Marktplaats"
        accent={C.violet}
        title="Opdrachten op frequentie"
        sub="De amplitude toont hoe sterk een opdracht met je profiel resoneert."
      />

      <div
        className="mb-7 flex items-center gap-2.5 rounded-full px-5 py-3"
        style={{ background: C.panel, border: `1px solid ${C.border}` }}
      >
        <Search size={16} className="shrink-0" style={{ color: C.violet }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-50"
          style={{ ...geist, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${RING}`}
            style={{ ...geist, color: C.violet, background: `${C.violet}18` }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.stage2, color: C.violet, border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Radio size={28} strokeWidth={1.8} />
          </span>
          <h3 className="text-[20px] font-semibold" style={{ ...geist, color: C.ink }}>
            Stilte op dit kanaal
          </h3>
          <p className="max-w-xs text-[13.5px]" style={{ ...geist, color: C.muted }}>
            Geen signaal voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="mt-1">
            <GhostButton onClick={() => setQuery("")} accent={C.violet}>
              Filter wissen
            </GhostButton>
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            const accent = spectrumAt(o.match / 100);
            return (
              <GlowCard key={o.id} accent={accent} className="group flex h-full flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="text-[9.5px] font-semibold uppercase tracking-[0.18em]"
                    style={{ ...mono, color: C.faint }}
                  >
                    {o.id}
                  </span>
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${RING}`}
                    style={{
                      color: isSaved ? accent : C.muted,
                      background: isSaved ? `${accent}18` : "transparent",
                      border: `1px solid ${isSaved ? accent : C.border}`,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={16} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <Bookmark size={16} strokeWidth={2.2} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <h3
                  className="mt-3 text-[17px] font-semibold leading-tight"
                  style={{ ...geist, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <div className="mt-0.5 text-[13px]" style={{ ...geist, color: C.muted }}>
                  {o.opdrachtgever}
                </div>
                <div className="mt-4">
                  <MatchWave value={o.match} bars={22} height={30} />
                </div>
                <dl
                  className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 text-[12px]"
                  style={{ ...geist, color: C.fgSoft }}
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
                        style={{ color: C.faint }}
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
                      className="rounded-full px-2.5 py-0.5 text-[11px]"
                      style={{
                        ...geist,
                        color: C.fgSoft,
                        background: C.stage2,
                        border: `1px solid ${C.line}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-5">
                  <SpectralButton onClick={() => onOpen(o)} accent={accent} className="w-full">
                    Bekijk opdracht
                    <ArrowRight
                      size={14}
                      strokeWidth={2.2}
                      className="transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </SpectralButton>
                </div>
              </GlowCard>
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
  const accent = spectrumAt(opdracht.match / 100);
  return (
    <div>
      <div className="mb-6">
        <GhostButton onClick={onBack} accent={C.violet} ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
          Terug
        </GhostButton>
      </div>

      <div
        className="overflow-hidden rounded-[20px] p-7"
        style={{
          border: `1px solid ${C.border}`,
          background: C.panelSoft,
          backgroundImage: stageGlow(),
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <span
              className="text-[9.5px] font-semibold uppercase tracking-[0.2em]"
              style={{ ...mono, color: C.faint }}
            >
              {opdracht.id}
            </span>
            <h2
              className="mt-1 text-[26px] font-semibold leading-tight tracking-tight"
              style={{ ...geist, color: C.ink }}
            >
              {opdracht.titel}
            </h2>
            <div className="mt-1 text-[14px]" style={{ ...geist, color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </div>
          </div>
          <GhostButton
            onClick={() => toggleSave(opdracht.id)}
            accent={accent}
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

        <div
          className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"
          style={{ background: C.panel, border: `1px solid ${C.border}` }}
        >
          <div>
            <div
              className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.muted }}
            >
              Amplitude van de match
            </div>
            <MatchWave value={opdracht.match} bars={40} height={44} />
          </div>
          <div className="min-w-[180px] flex-1">
            <Scrubber progress={opdracht.match} accent={accent} />
            <div
              className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.faint }}
            >
              <span>lage resonantie</span>
              <span>hoge resonantie</span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m, i) => (
            <div
              key={m.label}
              className="rounded-2xl p-4"
              style={{ background: C.panel, border: `1px solid ${C.border}` }}
            >
              <m.Icon
                size={15}
                strokeWidth={2}
                style={{ color: spectrumAt(i / 3) }}
                aria-hidden="true"
              />
              <div
                className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="text-[14px] font-semibold" style={{ ...geist, color: C.ink }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="rounded-full px-3 py-1 text-[11.5px]"
              style={{
                ...geist,
                color: C.fgSoft,
                background: C.stage2,
                border: `1px solid ${C.line}`,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="p-6">
          <div className="mb-3.5 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: C.greenSoft, color: C.green }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={2.6} />
            </span>
            <span className="text-[14.5px] font-semibold" style={{ ...geist, color: C.ink }}>
              Waarom dit resoneert
            </span>
          </div>
          <ul className="space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...geist, color: C.fg }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-6">
          <div className="mb-3.5 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: C.amberSoft, color: C.amber }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={2.6} />
            </span>
            <span className="text-[14.5px] font-semibold" style={{ ...geist, color: C.ink }}>
              Even op letten
            </span>
          </div>
          <ul className="space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...geist, color: C.fgSoft }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <SpectralButton
          onClick={() => setApplied((v) => !v)}
          accent={applied ? C.green : accent}
          ariaPressed={applied}
          className="px-6 py-3 text-[14px]"
        >
          {applied ? (
            <Check size={17} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <Play size={16} strokeWidth={2.4} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </SpectralButton>
        {applied && (
          <span className="text-[12.5px]" style={{ ...geist, color: C.muted }}>
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
        channel="Verificatie"
        accent={C.green}
        title="Documenten, helder gemeten"
        sub="Elke status heeft een eigen kleur, label én icoon — nooit alleen kleur."
      />

      <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, tone, soft } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 rounded-2xl px-4 py-3.5"
              style={{ background: soft, border: `1px solid ${tone}33` }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: tone, color: C.stage }}
                aria-hidden="true"
              >
                <Icon size={15} strokeWidth={2.2} />
              </span>
              <span className="text-[12px] font-semibold" style={{ ...geist, color: C.ink }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Panel className="mb-7 flex items-center gap-4 p-6" style={{ backgroundImage: stageGlow() }}>
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          style={{ background: C.greenSoft, color: C.green, border: `1px solid ${C.green}44` }}
          aria-hidden="true"
        >
          <ShieldCheck size={24} strokeWidth={2} />
        </span>
        <div>
          <div className="text-[15px] font-semibold" style={{ ...geist, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[13px]" style={{ ...geist, color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            const { tone, soft } = statusMeta(c.status);
            return (
              <GlowCard key={c.naam} accent={tone} className="flex items-center gap-3.5 p-4">
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${RING}`}
                  style={{
                    border: `1.5px solid ${done ? C.green : C.border}`,
                    background: done ? C.green : "transparent",
                    color: C.stage,
                  }}
                >
                  {done && <Check size={14} strokeWidth={2.6} aria-hidden="true" />}
                </button>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: soft, color: tone, border: `1px solid ${tone}33` }}
                  aria-hidden="true"
                >
                  <FileText size={16} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ ...geist, color: C.ink }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...geist, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <StatusPill status={c.status} />
              </GlowCard>
            );
          })}
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[15px] font-semibold"
              style={{ ...geist, color: C.ink }}
            >
              <FileText size={16} strokeWidth={2} style={{ color: C.cyan }} aria-hidden="true" />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center rounded-full ${RING}`}
              style={{ background: C.panel, color: C.cyan, border: `1px solid ${C.border}` }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3.5 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className={`rounded-full px-3.5 py-1 text-[11px] font-semibold transition-all ${RING}`}
                style={{
                  ...geist,
                  color: feedState === s ? C.stage : C.muted,
                  background: feedState === s ? C.cyan : "transparent",
                  border: `1px solid ${feedState === s ? C.cyan : C.border}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2.5" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Panel key={i} className="p-4">
                  <div
                    className="h-3 w-2/3 animate-pulse rounded-full"
                    style={{ background: C.stage2 }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded-full"
                    style={{ background: C.stage2 }}
                  />
                </Panel>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Panel className="flex flex-col items-center gap-2 px-4 py-9 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: C.redSoft, color: C.red, border: `1px solid ${C.red}44` }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-semibold" style={{ ...geist, color: C.ink }}>
                Signaal verloren
              </div>
              <p className="text-[12px]" style={{ ...geist, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <GhostButton onClick={() => setFeedState("ok")} accent={C.red}>
                  Opnieuw proberen
                </GhostButton>
              </div>
            </Panel>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2.5">
              {DOCUMENTEN.map((d) => {
                const { tone, soft } = statusMeta(d.status);
                return (
                  <Panel key={d.naam} className="flex items-center gap-3 p-3.5">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[9px] font-bold"
                      style={{
                        ...mono,
                        background: soft,
                        color: tone,
                        border: `1px solid ${tone}33`,
                      }}
                      aria-hidden="true"
                    >
                      {d.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[12.5px] font-semibold"
                        style={{ ...geist, color: C.ink }}
                      >
                        {d.naam}
                      </div>
                      <div className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
                        {d.grootte} · {d.bijgewerkt}
                      </div>
                    </div>
                    <StatusPill status={d.status} />
                  </Panel>
                );
              })}
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
      <ScreenHead channel="Acties" accent={C.amber} title="Wat vandaag om aandacht vraagt" />

      {openCount === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.greenSoft, color: C.green, border: `1px solid ${C.green}44` }}
            aria-hidden="true"
          >
            <Check size={30} strokeWidth={2.2} />
          </span>
          <h3 className="text-[20px] font-semibold" style={{ ...geist, color: C.ink }}>
            Stilte — alles afgestemd
          </h3>
          <p className="max-w-xs text-[13.5px]" style={{ ...geist, color: C.muted }}>
            Niets meer te doen vandaag. Het kanaal is schoon.
          </p>
        </Panel>
      ) : (
        <>
          <div
            className="mb-5 inline-flex items-center gap-2.5 rounded-full px-4 py-2"
            style={{ background: C.amberSoft, border: `1px solid ${C.amber}44` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold tabular-nums"
              style={{ ...mono, background: C.amber, color: C.stage }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ ...geist, color: C.amber }}>
              {openCount} {openCount === 1 ? "actie" : "acties"} open
            </span>
          </div>

          <ul className="space-y-3.5">
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              const accent = isDone
                ? C.green
                : a.urgentie === "warning"
                  ? C.amber
                  : spectrumAt(i / Math.max(1, ACTIES.length - 1));
              return (
                <GlowCard key={a.titel} accent={accent} className="overflow-hidden p-0">
                  <div className="flex">
                    <span
                      className="w-1 shrink-0"
                      style={{ background: accent }}
                      aria-hidden="true"
                    />
                    <div className="flex flex-1 items-start gap-4 p-5">
                      <button
                        onClick={() => toggleDone(a.titel)}
                        aria-pressed={isDone}
                        aria-label={
                          isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`
                        }
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${RING}`}
                        style={{
                          border: `1.5px solid ${isDone ? C.green : C.border}`,
                          background: isDone ? C.green : "transparent",
                          color: C.stage,
                        }}
                      >
                        {isDone && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-[15px] font-semibold leading-snug"
                          style={{
                            ...geist,
                            color: C.ink,
                            textDecoration: isDone ? "line-through" : "none",
                            opacity: isDone ? 0.5 : 1,
                          }}
                        >
                          {a.titel}
                        </div>
                        <p
                          className="mt-1 text-[12.5px]"
                          style={{ ...geist, color: C.muted, opacity: isDone ? 0.5 : 1 }}
                        >
                          {a.detail}
                        </p>
                        {!isDone && (
                          <span
                            className="mt-2.5 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                            style={{ ...geist, color: accent, background: `${accent}18` }}
                          >
                            {a.cta}
                            <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </GlowCard>
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
  const statusTone = (status: string): { tone: string; soft: string; Icon: LucideIcon } =>
    status === "Betaald"
      ? { tone: C.green, soft: C.greenSoft, Icon: Check }
      : status === "Openstaand"
        ? { tone: C.amber, soft: C.amberSoft, Icon: Clock }
        : { tone: C.muted, soft: C.stage2, Icon: FileText };

  const parseBedrag = (b: string): number =>
    Number(
      b
        .replace(/[^0-9,]/g, "")
        .replace(/\./g, "")
        .replace(",", "."),
    ) || 0;
  const totaal = FACTUREN.reduce((sum, f) => sum + parseBedrag(f.bedrag), 0);
  const totaalLabel = `€ ${totaal.toLocaleString("nl-NL")}`;

  return (
    <div>
      <ScreenHead
        channel="Facturen"
        accent={C.magenta}
        title="Je facturen"
        sub="Overzichtelijk en zonder gedoe — je weet precies waar je aan toe bent."
      />

      <div className="mb-7 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 lg:col-span-2">
          {[
            { label: "Betaald (mnd)", value: "€ 5.552", tone: C.green },
            { label: "Openstaand", value: "€ 1.350", tone: C.amber },
            { label: "Concept", value: "€ 880", tone: C.muted },
          ].map((s) => (
            <Panel key={s.label} className="p-5">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.muted }}
              >
                {s.label}
              </div>
              <div
                className="mt-2 text-[24px] font-semibold tabular-nums"
                style={{ ...mono, color: s.tone }}
              >
                {s.value}
              </div>
            </Panel>
          ))}
        </div>
        <Panel className="flex flex-col justify-between p-5">
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.muted }}
          >
            Bedrag per factuur
          </div>
          <div className="mt-3">
            <Equalizer data={trend} height={48} />
          </div>
        </Panel>
      </div>

      <Panel className="overflow-hidden p-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ ...mono, color: C.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const sm = statusTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.panelHi)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td
                      className="px-3 py-3.5 text-[12.5px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3.5 text-[13px]" style={{ ...geist, color: C.fg }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-3.5 text-[12.5px] tabular-nums"
                      style={{ ...mono, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3.5 text-[13px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full py-0.5 pl-1 pr-2.5 text-[11px] font-semibold"
                        style={{
                          ...geist,
                          color: sm.tone,
                          background: sm.soft,
                          border: `1px solid ${sm.tone}33`,
                        }}
                      >
                        <span
                          className="flex h-4 w-4 items-center justify-center rounded-full"
                          style={{ background: sm.tone }}
                          aria-hidden="true"
                        >
                          <sm.Icon size={10} strokeWidth={2.4} color={C.stage} />
                        </span>
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `1px solid ${C.border}` }}>
                <td
                  colSpan={3}
                  className="px-3 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.muted }}
                >
                  Totaal gefactureerd
                </td>
                <td
                  className="px-3 py-3.5 text-[14px] font-bold tabular-nums"
                  style={{ ...mono, color: C.magenta }}
                >
                  {totaalLabel}
                </td>
                <td className="px-3 py-3.5" />
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept283() {
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

  const navAccent = (k: ScreenKey): string => {
    const idx = SCREENS.findIndex((s) => s.key === k);
    return spectrumAt(SCREENS.length <= 1 ? 0.5 : idx / (SCREENS.length - 1));
  };

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...geist, color: C.fg, background: C.stage, backgroundImage: stageGlow() }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${C.cyan}, ${C.violet}, ${C.magenta})`,
                color: C.stage,
              }}
              aria-hidden="true"
            >
              <AudioLines size={20} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[19px] font-semibold tracking-tight"
                style={{ ...geist, color: C.ink }}
              >
                Spectraal
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.24em]"
                style={{ ...mono, color: C.muted }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...geist, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...geist, color: C.green }}
              >
                <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-[13px] font-bold"
              style={{
                ...mono,
                background: C.stage2,
                color: C.cyan,
                border: `1px solid ${C.border}`,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav className="mb-9 flex flex-wrap gap-1.5 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICONS[s.key];
            const accent = navAccent(s.key);
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-300 ${RING}`}
                style={{
                  ...geist,
                  color: on ? C.stage : C.fgSoft,
                  background: on ? accent : "transparent",
                  border: `1px solid ${on ? accent : C.border}`,
                  boxShadow: on ? `0 0 18px -6px ${accent}` : "none",
                }}
              >
                <Icon size={14} strokeWidth={2} aria-hidden="true" />
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
          className="mt-10 flex flex-wrap items-center justify-between gap-2 pt-5 text-[11px]"
          style={{ ...mono, borderTop: `1px solid ${C.line}`, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <AudioLines size={12} strokeWidth={2} style={{ color: C.cyan }} aria-hidden="true" />
            {SCREENS.length} kanalen · spectraal v283
          </span>
          <span>Donker, luid en helder</span>
        </footer>
      </div>
    </div>
  );
}
