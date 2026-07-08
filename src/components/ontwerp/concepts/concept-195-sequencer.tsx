"use client";

// Concept 195 — "Sequencer" · een DAW / piano-roll tijdlijn als planningsoppervlak. Opdrachten,
// verificatie, facturen en berichten liggen als gekleurde clips op horizontale sporen (lanes) langs
// een tijd-as, met een verticale afspeelkop (playhead) en transport-knoppen (afspelen/pauze/skip).
// Toetsenbord-first: een zwevende "Druk ⌘K"-hint opent een commando-palet. Donkere studio-UI met
// felle spoorkleuren; mono-cijfers voor tijd/tarief. Onderscheidt zich radicaal van agenda-, metro-
// of almanak-concepten: dit is een muziekstudio-tijdlijn met sporen + clips + afspeelkop.
// Deterministisch — geen random/Date. UI Nederlands. Fonts: Space Grotesk (display) + Inter (tekst)
// + Geist Mono (tijd/cijfers). Status nooit op kleur alleen: altijd label + icoon + vorm.

import { useEffect, useState } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Circle,
  Square,
  Command,
  AudioLines,
  Search,
  ShieldCheck,
  BadgeCheck,
  Clock,
  TriangleAlert,
  XCircle,
  Check,
  MapPin,
  Coins,
  CalendarDays,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Plus,
  FileText,
  CornerDownLeft,
  Radio,
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
  NAV,
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — donkere studio, felle spoorkleuren. De afspeelkop is een heet signaalrood. ──
const C = {
  bg: "#0c0d12", // studio-basis (bijna zwart, koel)
  bgDeep: "#08090d", // dieper vlak (masthead)
  panel: "#12141c", // spoor-/kaartoppervlak
  panelHi: "#1a1d27", // opgetild vlak / hover
  rail: "#0f1017", // tijdlijn-goot
  line: "#242835", // fijne rand
  lineSoft: "#1b1e29", // rasterlijn
  ink: "#eaecf3", // primaire tekst
  inkSoft: "#a2a9bd", // secundaire tekst
  inkFaint: "#666d81", // labels
  // Spoorkleuren (fel, verzadigd) — elk spoor een eigen timbre
  teal: "#2dd4bf",
  violet: "#a78bfa",
  amber: "#fbbf24",
  rose: "#fb7185",
  // Afspeelkop
  play: "#ff4d6d", // heet signaalrood
  onColor: "#0a0b0f", // tekst op felle kleur
  white: "#f6f8ff",
};

const display = { fontFamily: "var(--font-lab-space)" };
const bodyF = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

// Zet #rrggbb + alpha om naar rgba() — deterministisch, geen afhankelijkheden.
function tint(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ── Status-model — onderscheid via kleur + VORM + icoon + label, nooit kleur alleen. ──
type Variant = "solid" | "outline" | "dashed" | "double";
type StatusStyle = {
  label: string;
  Icon: LucideIcon;
  color: string; // spoor-/accentkleur
  fg: string;
  variant: Variant;
};
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: BadgeCheck,
        color: C.teal,
        fg: C.onColor,
        variant: "solid",
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        color: C.violet,
        fg: C.violet,
        variant: "outline",
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        color: C.amber,
        fg: C.amber,
        variant: "dashed",
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.rose, fg: C.white, variant: "double" };
  }
}

function borderFor(m: StatusStyle): React.CSSProperties {
  if (m.variant === "dashed") return { border: `1px dashed ${m.color}` };
  if (m.variant === "double") return { border: `2.5px double ${m.color}` };
  if (m.variant === "solid") return { border: `1px solid ${m.color}` };
  return { border: `1px solid ${tint(m.color, 0.5)}` };
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const solid = m.variant === "solid";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold"
      style={{
        ...bodyF,
        background: solid ? m.color : tint(m.color, 0.12),
        color: solid ? m.fg : m.color,
        ...borderFor(m),
      }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Kaart / paneel — vlak met fijne rand; interactief tilt licht op bij hover. ──
function Card({
  children,
  className = "",
  style,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl ${
        interactive
          ? "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-24px_rgba(0,0,0,0.9)]"
          : ""
      } ${className}`}
      style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.line}`, ...style }}
    >
      {children}
    </div>
  );
}

// Sectie-kop — gekleurd glyph-blok + display-titel + dunne liniaal.
function SectionHead({
  title,
  sub,
  Icon,
  color = C.teal,
}: {
  title: string;
  sub?: string;
  Icon: LucideIcon;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
        style={{ background: tint(color, 0.14), boxShadow: `inset 0 0 0 1px ${tint(color, 0.4)}` }}
        aria-hidden="true"
      >
        <Icon size={17} strokeWidth={2} style={{ color }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[19px] font-semibold leading-none tracking-[-0.01em]"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-1 text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
      <span
        className="ml-2 hidden h-px flex-1 sm:block"
        style={{ background: `linear-gradient(90deg, ${tint(color, 0.45)}, transparent)` }}
        aria-hidden="true"
      />
    </div>
  );
}

function Meta({
  Icon,
  value,
  color = C.teal,
}: {
  Icon: LucideIcon;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2} style={{ color }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Mono match-badge — percentage als studio-meter.
function MatchBadge({ value, color = C.teal }: { value: number; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold tabular-nums"
      style={{
        ...mono,
        background: tint(color, 0.14),
        color,
        boxShadow: `inset 0 0 0 1px ${tint(color, 0.4)}`,
      }}
    >
      <Radio size={11} strokeWidth={2.4} aria-hidden="true" />
      {value}%
    </span>
  );
}

// Waveform-spark — verticale staafjes als een golfvorm; laatste staaf helder.
function Waveform({ data, color = C.teal }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-[1px]"
          style={{
            height: `${Math.max(12, (v / max) * 100)}%`,
            background: i === data.length - 1 ? color : tint(color, 0.28),
          }}
        />
      ))}
    </div>
  );
}

// ── Tijdlijn (het handtekening-element) ────────────────────────────────────────────
// Sporen (lanes) met clips langs een tijd-as; een verticale afspeelkop snijdt door alles.
type Clip = {
  label: string;
  sub: string;
  left: number;
  width: number;
  match?: number;
  status?: CredStatus;
};
type Track = { id: string; label: string; Icon: LucideIcon; color: string; clips: Clip[] };

const RULER: string[] = ["wk 27", "wk 28", "wk 29", "wk 30", "wk 31", "wk 32", "wk 33", "wk 34"];

// Diensten-spoor uit echte opdrachten; posities vast (niet-overlappend, deterministisch).
const DIENST_POS = [
  { left: 3, width: 31 },
  { left: 37, width: 27 },
  { left: 67, width: 27 },
];
const VERIF_POS = [
  { left: 1, width: 21 },
  { left: 25, width: 17 },
  { left: 46, width: 23 },
  { left: 73, width: 24 },
];
const FACT_POS = [
  { left: 5, width: 16 },
  { left: 25, width: 14 },
  { left: 43, width: 20 },
  { left: 67, width: 25 },
];
const BERICHT_POS = [
  { left: 8, width: 15 },
  { left: 38, width: 17 },
  { left: 64, width: 20 },
];

const TRACKS: Track[] = [
  {
    id: "diensten",
    label: "Diensten",
    Icon: AudioLines,
    color: C.teal,
    clips: OPDRACHTEN.map((o, i) => ({
      label: o.titel,
      sub: o.tarief,
      match: o.match,
      left: DIENST_POS[i]!.left,
      width: DIENST_POS[i]!.width,
    })),
  },
  {
    id: "verificatie",
    label: "Verificatie",
    Icon: ShieldCheck,
    color: C.violet,
    clips: CREDENTIALS.map((c, i) => ({
      label: c.naam,
      sub: c.detail,
      status: c.status,
      left: VERIF_POS[i]!.left,
      width: VERIF_POS[i]!.width,
    })),
  },
  {
    id: "facturen",
    label: "Facturen",
    Icon: Coins,
    color: C.amber,
    clips: FACTUREN.map((f, i) => ({
      label: f.nr,
      sub: `${f.klant} · ${f.bedrag}`,
      left: FACT_POS[i]!.left,
      width: FACT_POS[i]!.width,
    })),
  },
  {
    id: "berichten",
    label: "Berichten",
    Icon: FileText,
    color: C.rose,
    clips: BERICHTEN.map((b, i) => ({
      label: b.van,
      sub: b.preview,
      left: BERICHT_POS[i]!.left,
      width: BERICHT_POS[i]!.width,
    })),
  },
];

// Vaste afspeelkop-posities (%) waar de kop tussen springt bij skip.
const PLAYSTOPS = [8, 24, 40, 56, 72, 88];
const LABEL_COL = 148; // px — breedte van de spoor-labelkolom

function Timeline({
  tracks,
  pos,
  playing,
  onOpenClip,
}: {
  tracks: Track[];
  pos: number;
  playing: boolean;
  onOpenClip?: () => void;
}) {
  return (
    <div
      className="overflow-x-auto rounded-xl"
      style={{ background: C.rail, boxShadow: `inset 0 0 0 1px ${C.line}` }}
    >
      <div className="relative min-w-[760px] p-3">
        {/* Afspeelkop — verticale lijn met driehoekkop; pulseert bij afspelen */}
        <div
          className="pointer-events-none absolute bottom-3 top-3 z-20"
          style={{ left: `calc(${LABEL_COL}px + (100% - ${LABEL_COL}px - 24px) * ${pos / 100})` }}
          aria-hidden="true"
        >
          <span
            className="absolute inset-y-0 left-0 w-px"
            style={{ background: C.play, boxShadow: `0 0 10px ${C.play}` }}
          />
          <span
            className={`absolute -left-[6px] -top-[3px] h-0 w-0 ${playing ? "animate-pulse" : ""}`}
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: `7px solid ${C.play}`,
            }}
          />
        </div>

        {/* Tijd-as / liniaal */}
        <div className="mb-2 flex" aria-hidden="true">
          <div style={{ width: LABEL_COL }} className="shrink-0 pr-3">
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              Tijd →
            </span>
          </div>
          <div className="relative flex-1">
            <div className="flex justify-between">
              {RULER.map((r) => (
                <span
                  key={r}
                  className="text-[9.5px] font-medium tabular-nums"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sporen */}
        <div className="space-y-1.5">
          {tracks.map((t) => (
            <div key={t.id} className="flex items-stretch">
              {/* Spoor-label */}
              <div
                className="flex shrink-0 items-center gap-2 rounded-l-md pr-3"
                style={{ width: LABEL_COL, borderLeft: `2px solid ${t.color}`, paddingLeft: 10 }}
              >
                <t.Icon size={14} strokeWidth={2} style={{ color: t.color }} aria-hidden="true" />
                <span
                  className="truncate text-[12px] font-semibold"
                  style={{ ...display, color: C.ink }}
                >
                  {t.label}
                </span>
                <span
                  className="ml-auto text-[10px] tabular-nums"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  {t.clips.length}
                </span>
              </div>

              {/* Spoor-goot met clips + rasterlijnen */}
              <div
                className="relative h-14 flex-1 rounded-md"
                style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.lineSoft}` }}
              >
                {/* verticale rasterlijnen (maten) */}
                <div className="pointer-events-none absolute inset-0 flex" aria-hidden="true">
                  {RULER.map((_, i) => (
                    <span
                      key={i}
                      className="flex-1"
                      style={{
                        borderRight: i < RULER.length - 1 ? `1px solid ${C.lineSoft}` : "none",
                      }}
                    />
                  ))}
                </div>
                {t.clips.map((c, i) => {
                  const cm = c.status ? credMeta(c.status) : null;
                  const clipColor = cm ? cm.color : t.color;
                  return (
                    <button
                      key={i}
                      onClick={onOpenClip}
                      className="group absolute bottom-1.5 top-1.5 overflow-hidden rounded-md px-2 text-left transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2"
                      style={{
                        left: `${c.left}%`,
                        width: `${c.width}%`,
                        background: tint(clipColor, 0.16),
                        borderLeft: `3px solid ${clipColor}`,
                        boxShadow: `inset 0 0 0 1px ${tint(clipColor, 0.35)}`,
                        ["--tw-ring-color" as string]: clipColor,
                      }}
                      aria-label={`${c.label} — ${c.sub}`}
                    >
                      <span
                        className="block truncate text-[11px] font-semibold leading-tight"
                        style={{ ...display, color: C.ink }}
                      >
                        {c.label}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5">
                        <span
                          className="truncate text-[10px] tabular-nums"
                          style={{ ...mono, color: clipColor }}
                        >
                          {c.sub}
                        </span>
                        {typeof c.match === "number" && (
                          <span
                            className="ml-auto shrink-0 text-[10px] font-bold tabular-nums"
                            style={{ ...mono, color: clipColor }}
                          >
                            {c.match}%
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Transport — afspeelknoppen (bediening van de afspeelkop). Icoon-only knoppen dragen aria-labels.
function Transport({
  playing,
  onToggle,
  onPrev,
  onNext,
  pos,
}: {
  playing: boolean;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  pos: number;
}) {
  const btn =
    "flex h-9 w-9 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const ring = {
    ["--tw-ring-color" as string]: C.teal,
    ["--tw-ring-offset-color" as string]: C.bgDeep,
  };
  return (
    <div
      className="flex items-center gap-1 rounded-lg px-1.5 py-1.5"
      style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.line}` }}
    >
      <button
        onClick={onPrev}
        aria-label="Vorige positie"
        className={btn}
        style={{ background: C.panelHi, color: C.inkSoft, ...ring }}
      >
        <SkipBack size={15} strokeWidth={2} aria-hidden="true" />
      </button>
      <button
        onClick={onToggle}
        aria-label={playing ? "Pauzeren" : "Afspelen"}
        aria-pressed={playing}
        className={btn}
        style={{ background: C.teal, color: C.onColor, ...ring }}
      >
        {playing ? (
          <Pause size={16} strokeWidth={2.4} aria-hidden="true" />
        ) : (
          <Play size={16} strokeWidth={2.4} aria-hidden="true" />
        )}
      </button>
      <button
        onClick={onNext}
        aria-label="Volgende positie"
        className={btn}
        style={{ background: C.panelHi, color: C.inkSoft, ...ring }}
      >
        <SkipForward size={15} strokeWidth={2} aria-hidden="true" />
      </button>
      <span className="mx-1 h-5 w-px" style={{ background: C.line }} aria-hidden="true" />
      <span
        className="flex h-9 w-9 items-center justify-center rounded-md"
        style={{ background: C.panelHi, color: C.play }}
        aria-hidden="true"
        title="Opnemen"
      >
        <Circle size={12} strokeWidth={3} fill={C.play} />
      </span>
      <span
        className="flex h-9 w-9 items-center justify-center rounded-md"
        style={{ background: C.panelHi, color: C.inkFaint }}
        aria-hidden="true"
        title="Stoppen"
      >
        <Square size={12} strokeWidth={2.4} />
      </span>
      <span className="mx-1 h-5 w-px" style={{ background: C.line }} aria-hidden="true" />
      <span
        className="px-1.5 text-[12px] font-semibold tabular-nums"
        style={{ ...mono, color: C.teal }}
        aria-label={`Positie ${pos} procent`}
      >
        {String(pos).padStart(2, "0")}%
      </span>
    </div>
  );
}

// Commando-palet — toetsenbord-first overlay (⌘K). Navigeert tussen schermen.
function CommandPalette({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (k: ScreenKey) => void;
}) {
  const [q, setQ] = useState("");
  if (!open) return null;
  const results = SCREENS.filter((s) => s.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      style={{ background: "rgba(6,7,10,0.72)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Commando-palet"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl"
        style={{
          background: C.panel,
          boxShadow: `0 24px 70px -20px rgba(0,0,0,0.8), inset 0 0 0 1px ${C.line}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-2.5 px-4 py-3"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <Search size={16} style={{ color: C.teal }} aria-hidden="true" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && results[0]) {
                onSelect(results[0].key);
              }
            }}
            placeholder="Spring naar scherm of actie…"
            aria-label="Commando zoeken"
            className="flex-1 bg-transparent text-[14px] outline-none placeholder:opacity-50"
            style={{ ...bodyF, color: C.ink }}
          />
          <kbd
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
            style={{
              ...mono,
              background: C.panelHi,
              color: C.inkFaint,
              boxShadow: `inset 0 0 0 1px ${C.line}`,
            }}
          >
            esc
          </kbd>
        </div>
        <div className="max-h-[46vh] overflow-y-auto p-2">
          <div
            className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ ...mono, color: C.inkFaint }}
          >
            Schermen
          </div>
          {results.length === 0 ? (
            <div
              className="px-3 py-6 text-center text-[13px]"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Geen commando voor &ldquo;{q}&rdquo;.
            </div>
          ) : (
            results.map((s, i) => (
              <button
                key={s.key}
                onClick={() => onSelect(s.key)}
                className="group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-[#1a1d27] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{ ["--tw-ring-color" as string]: C.teal }}
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-bold tabular-nums"
                  style={{
                    ...mono,
                    background: C.panelHi,
                    color: C.teal,
                    boxShadow: `inset 0 0 0 1px ${C.line}`,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span
                  className="flex-1 text-[13.5px] font-medium"
                  style={{ ...bodyF, color: C.ink }}
                >
                  {s.label}
                </span>
                <CornerDownLeft
                  size={14}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ color: C.inkFaint }}
                  aria-hidden="true"
                />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept195() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [playing, setPlaying] = useState(false);
  const [stop, setStop] = useState(2);
  const [palette, setPalette] = useState(false);
  const active = OPDRACHTEN[0] as Opdracht;
  const pos = PLAYSTOPS[stop]!;

  // Toetsenbord-first: ⌘K / Ctrl+K opent het palet, Escape sluit het.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
      if (e.key === "Escape") setPalette(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const prev = () => setStop((s) => Math.max(0, s - 1));
  const next = () => setStop((s) => Math.min(PLAYSTOPS.length - 1, s + 1));

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* subtiele studio-gloed */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(120% 55% at 50% -10%, ${tint(C.teal, 0.06)}, transparent 60%)`,
        }}
        aria-hidden="true"
      />

      <CommandPalette
        open={palette}
        onClose={() => setPalette(false)}
        onSelect={(k) => {
          setScreen(k);
          setPalette(false);
        }}
      />

      <div className="relative z-10">
        {/* Masthead */}
        <header className="relative" style={{ background: C.bgDeep }}>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${C.teal}, ${C.violet}, transparent)`,
            }}
            aria-hidden="true"
          />
          <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
            <div className="flex items-center gap-3.5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: C.teal, boxShadow: `0 0 24px -6px ${C.teal}` }}
                aria-hidden="true"
              >
                <AudioLines size={21} strokeWidth={2.2} style={{ color: C.onColor }} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.34em]"
                  style={{ ...mono, color: C.teal }}
                >
                  Sequencer
                </div>
                <div
                  className="text-[22px] font-semibold leading-none tracking-[-0.01em]"
                  style={{ ...display, color: C.ink }}
                >
                  Studio
                </div>
                <div
                  className="mt-1 text-[10px] uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  Diensten · Verificatie · Omzet
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Transport
                playing={playing}
                onToggle={() => setPlaying((p) => !p)}
                onPrev={prev}
                onNext={next}
                pos={pos}
              />
              <button
                onClick={() => setPalette(true)}
                className="hidden items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:inline-flex"
                style={{
                  ...bodyF,
                  background: C.panel,
                  color: C.inkSoft,
                  boxShadow: `inset 0 0 0 1px ${C.line}`,
                  ["--tw-ring-color" as string]: C.teal,
                  ["--tw-ring-offset-color" as string]: C.bgDeep,
                }}
                aria-label="Open commando-palet"
              >
                <Command size={13} aria-hidden="true" /> K
              </button>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
                style={{ ...mono, background: C.violet, color: C.onColor }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-switcher (nav-tabs) */}
          <nav
            className="relative mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 pb-3 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative shrink-0 rounded-md px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={
                    on
                      ? {
                          ...bodyF,
                          background: C.teal,
                          color: C.onColor,
                          ["--tw-ring-color" as string]: C.teal,
                          ["--tw-ring-offset-color" as string]: C.bgDeep,
                        }
                      : {
                          ...bodyF,
                          background: C.panel,
                          color: C.inkSoft,
                          boxShadow: `inset 0 0 0 1px ${C.line}`,
                          ["--tw-ring-color" as string]: C.teal,
                          ["--tw-ring-offset-color" as string]: C.bgDeep,
                        }
                  }
                >
                  {s.label}
                </button>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          {screen === "dashboard" && (
            <Dashboard
              pos={pos}
              playing={playing}
              onOpen={() => setScreen("opdracht")}
              onActies={() => setScreen("acties")}
            />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail
              opdracht={active}
              pos={pos}
              playing={playing}
              onBack={() => setScreen("marktplaats")}
            />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer className="relative mx-auto max-w-6xl px-4 pb-24 md:px-8">
          <div
            className="flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-[11px]"
            style={{ ...mono, borderColor: C.line, color: C.inkFaint }}
          >
            <span className="flex items-center gap-2">
              <AudioLines size={12} aria-hidden="true" /> Sporen, clips en een afspeelkop — je
              planning als tijdlijn.
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              {NAV.slice(0, 5).map((n) => (
                <span key={n} className="rounded px-1.5 py-0.5" style={{ background: C.panel }}>
                  {n}
                </span>
              ))}
            </span>
          </div>
        </footer>
      </div>

      {/* Zwevende toetsenbord-hint */}
      <button
        onClick={() => setPalette(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-semibold shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.panelHi,
          color: C.ink,
          boxShadow: `0 12px 34px -12px rgba(0,0,0,0.9), inset 0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.teal,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
        aria-label="Open commando-palet met toetsenbord"
      >
        <span className="flex items-center gap-1">
          <kbd
            className="rounded px-1.5 py-0.5 text-[11px]"
            style={{
              ...mono,
              background: C.panel,
              color: C.teal,
              boxShadow: `inset 0 0 0 1px ${C.line}`,
            }}
          >
            ⌘
          </kbd>
          <kbd
            className="rounded px-1.5 py-0.5 text-[11px]"
            style={{
              ...mono,
              background: C.panel,
              color: C.teal,
              boxShadow: `inset 0 0 0 1px ${C.line}`,
            }}
          >
            K
          </kbd>
        </span>
        Druk om te navigeren
      </button>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({
  pos,
  playing,
  onOpen,
  onActies,
}: {
  pos: number;
  playing: boolean;
  onOpen: () => void;
  onActies: () => void;
}) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];
  const trackTint = [C.teal, C.violet, C.amber, C.rose];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <Card className="relative">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(90% 120% at 100% 0%, ${tint(C.teal, 0.1)}, transparent 55%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-xl p-6 sm:p-8">
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold"
            style={{
              ...bodyF,
              background: tint(C.teal, 0.14),
              color: C.teal,
              boxShadow: `inset 0 0 0 1px ${tint(C.teal, 0.4)}`,
            }}
          >
            <Radio size={12} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-4 text-[30px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[40px]"
            style={{ ...display, color: C.ink }}
          >
            Drie diensten in de mix, één spoor vraagt aandacht.
          </h1>
          <p
            className="mt-3 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Je VOG verloopt binnenkort — regel het en houd je tijdlijn schoon. De afspeelkop staat
            klaar op je eerstvolgende dienst.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: C.teal,
                color: C.onColor,
                ["--tw-ring-color" as string]: C.teal,
                ["--tw-ring-offset-color" as string]: C.bg,
              }}
            >
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: C.panelHi,
                color: C.ink,
                boxShadow: `inset 0 0 0 1px ${C.line}`,
                ["--tw-ring-color" as string]: C.teal,
                ["--tw-ring-offset-color" as string]: C.bg,
              }}
            >
              <TriangleAlert
                size={14}
                strokeWidth={2.2}
                style={{ color: C.amber }}
                aria-hidden="true"
              />{" "}
              Los actie op
            </button>
          </div>
        </div>
      </Card>

      {/* KPI's als waveform-meters */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Card key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
                style={{
                  ...mono,
                  background: k.up ? tint(trackTint[i % 4]!, 0.16) : C.panelHi,
                  color: k.up ? trackTint[i % 4] : C.inkSoft,
                  boxShadow: `inset 0 0 0 1px ${k.up ? tint(trackTint[i % 4]!, 0.4) : C.line}`,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[26px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Waveform data={k.spark} color={trackTint[i % 4]} />
            </div>
          </Card>
        ))}
      </div>

      {/* Signatuur-tijdlijn */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHead title="Tijdlijn" sub="Sporen, clips en de afspeelkop" Icon={AudioLines} />
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium"
            style={{ ...mono, color: C.inkFaint }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: C.play, boxShadow: `0 0 8px ${C.play}` }}
              aria-hidden="true"
            />
            Afspeelkop op {String(pos).padStart(2, "0")}%
          </span>
        </div>
        <Timeline tracks={TRACKS} pos={pos} playing={playing} onOpenClip={onOpen} />
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* Matches */}
        <section className="space-y-4">
          <SectionHead
            title="Aanbevolen matches"
            sub="Op match-percentage gerangschikt"
            Icon={Radio}
            color={C.violet}
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o, i) => (
              <Card key={o.id} interactive>
                <button
                  onClick={onOpen}
                  className="relative flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: trackTint[i % 4] }}
                >
                  <span
                    className="w-1.5 shrink-0 self-stretch rounded-full"
                    style={{ background: trackTint[i % 4] }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[15px] font-semibold"
                          style={{ ...display, color: C.ink }}
                        >
                          {o.titel}
                        </div>
                        <div
                          className="mt-0.5 truncate text-[12.5px]"
                          style={{ ...bodyF, color: C.inkSoft }}
                        >
                          {o.opdrachtgever} · {o.plaats} · <span style={mono}>{o.tarief}</span>
                        </div>
                      </div>
                      <MatchBadge value={o.match} color={trackTint[i % 4]} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium"
                          style={{ ...bodyF, background: C.panelHi, color: C.inkSoft }}
                        >
                          <Check
                            size={11}
                            strokeWidth={2.6}
                            style={{ color: trackTint[i % 4] }}
                            aria-hidden="true"
                          />{" "}
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className="shrink-0"
                    style={{ color: C.inkFaint }}
                    aria-hidden="true"
                  />
                </button>
              </Card>
            ))}
          </div>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <SectionHead
            title="Vertrouwen"
            sub="Certificaat-dekking"
            Icon={ShieldCheck}
            color={C.teal}
          />
          <Card className="p-5">
            <div className="flex items-center gap-5">
              <span
                className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${C.teal} 0deg, ${C.teal} ${dek * 3.6}deg, ${C.line} ${dek * 3.6}deg 360deg)`,
                }}
                aria-hidden="true"
              >
                <span
                  className="absolute inset-[8px] flex flex-col items-center justify-center rounded-full"
                  style={{ background: C.panel }}
                >
                  <span
                    className="text-[26px] font-semibold tabular-nums leading-none"
                    style={{ ...mono, color: C.teal }}
                  >
                    {dek}
                    <span className="text-[13px]" style={{ color: C.inkFaint }}>
                      %
                    </span>
                  </span>
                </span>
              </span>
              <div>
                <StatusTag status="VERIFIED" />
                <p className="mt-2 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {verified}/{CREDENTIALS.length} certificaten geverifieerd. Opdrachtgevers zien
                  alleen geverifieerde documenten.
                </p>
              </div>
            </div>
          </Card>

          {/* Prioriteit */}
          <Card className="relative" style={{ background: C.amber, boxShadow: "none" }}>
            <div className="relative p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...mono, background: "rgba(10,11,15,0.14)", color: C.onColor }}
              >
                <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
              </span>
              <h3
                className="mt-2.5 text-[20px] font-semibold leading-tight tracking-[-0.01em]"
                style={{ ...display, color: C.onColor }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ ...bodyF, color: "rgba(10,11,15,0.78)" }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: C.onColor,
                  color: C.amber,
                  ["--tw-ring-color" as string]: C.onColor,
                  ["--tw-ring-offset-color" as string]: C.amber,
                }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — zoek + skeleton-loading + empty-state + foutstrook ────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(true);
  const trackTint = [C.teal, C.violet, C.amber];

  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 650);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Marktplaats"
          sub="Open opdrachten als clips"
          Icon={Search}
          color={C.violet}
        />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-lg px-3.5 py-2"
            style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.line}` }}
          >
            <Search size={15} style={{ color: C.violet }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[12.5px] outline-none placeholder:opacity-50"
              style={{ ...bodyF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opnieuw laden"
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.panel,
              boxShadow: `inset 0 0 0 1px ${C.line}`,
              ["--tw-ring-color" as string]: C.violet,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            <SkipForward
              size={15}
              className={loading ? "animate-pulse" : ""}
              style={{ color: C.violet }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Foutstrook */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-xl p-4"
          role="alert"
          style={{ background: tint(C.rose, 0.1), border: `1px dashed ${C.rose}` }}
        >
          <XCircle size={18} strokeWidth={2.2} style={{ color: C.rose }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold" style={{ ...display, color: C.ink }}>
              Sommige clips konden niet worden geladen
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
              Er ging iets mis bij het ophalen van de nieuwste opdrachten. Probeer opnieuw te laden.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.rose, ["--tw-ring-color" as string]: C.rose }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-11 w-11 shrink-0 animate-pulse rounded-lg"
                  style={{ background: C.panelHi }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse rounded"
                    style={{ background: C.panelHi }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              background: tint(C.violet, 0.12),
              boxShadow: `inset 0 0 0 1px ${tint(C.violet, 0.4)}`,
            }}
            aria-hidden="true"
          >
            <Search size={28} strokeWidth={1.6} style={{ color: C.violet }} />
          </span>
          <p className="text-[20px] font-semibold" style={{ ...display, color: C.ink }}>
            Geen clip gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Niets gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan om de sporen opnieuw te
            vullen.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-lg px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...bodyF,
              background: C.violet,
              color: C.onColor,
              ["--tw-ring-color" as string]: C.violet,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            Zoekterm wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, i) => {
            const col = trackTint[i % 3]!;
            return (
              <Card key={o.id} interactive className="flex flex-col">
                <div
                  className="h-1 w-full"
                  style={{ background: `linear-gradient(90deg, ${col}, ${tint(col, 0.2)})` }}
                  aria-hidden="true"
                />
                <div className="relative flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                      style={{ ...mono, color: C.inkFaint }}
                    >
                      {o.id}
                    </span>
                    <h3
                      className="mt-1 text-[15.5px] font-semibold leading-tight"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {o.opdrachtgever}
                    </p>
                  </div>
                  <MatchBadge value={o.match} color={col} />
                </div>
                <div className="relative px-4 pb-4">
                  <dl className="grid grid-cols-2 gap-y-2 text-[12px]">
                    <Meta Icon={MapPin} value={o.plaats} color={col} />
                    <Meta Icon={Coins} value={o.tarief} color={col} />
                    <Meta Icon={Clock} value={o.uren} color={col} />
                    <Meta Icon={CalendarDays} value={o.start} color={col} />
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded px-2 py-0.5 text-[10.5px] font-medium"
                        style={{ ...bodyF, background: C.panelHi, color: C.inkSoft }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={onOpen}
                  className="relative mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    ...bodyF,
                    borderTop: `1px solid ${C.line}`,
                    color: col,
                    ["--tw-ring-color" as string]: col,
                  }}
                >
                  Open clip <ArrowRight size={14} aria-hidden="true" />
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail — verklaarbare matching + focus-tijdlijn ─────────────────────────
function OpdrachtDetail({
  opdracht,
  pos,
  playing,
  onBack,
}: {
  opdracht: Opdracht;
  pos: number;
  playing: boolean;
  onBack: () => void;
}) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  const focusTrack: Track[] = [
    {
      id: "focus",
      label: opdracht.plaats,
      Icon: AudioLines,
      color: C.teal,
      clips: [
        { label: opdracht.titel, sub: opdracht.tarief, match: opdracht.match, left: 14, width: 52 },
        { label: "Intake", sub: opdracht.start, left: 4, width: 8 },
        { label: "Evaluatie", sub: "na 4 wk", left: 74, width: 20 },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.panel,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.teal,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Card className="relative">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(80% 130% at 100% 0%, ${tint(C.teal, 0.12)}, transparent 55%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="inline-block rounded-md px-2.5 py-1 text-[11px] font-semibold"
              style={{
                ...mono,
                background: tint(C.teal, 0.14),
                color: C.teal,
                boxShadow: `inset 0 0 0 1px ${tint(C.teal, 0.4)}`,
              }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[28px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[36px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span
              className="text-[44px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.teal }}
            >
              {opdracht.match}
              <span className="text-[18px]" style={{ color: C.inkFaint }}>
                %
              </span>
            </span>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              match
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Card key={f.l} interactive className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-md"
              style={{ background: tint(C.teal, 0.12) }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={2} style={{ color: C.teal }} />
            </span>
            <div
              className="mt-3 text-[16px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Card>
        ))}
      </div>

      {/* Focus-tijdlijn voor deze opdracht */}
      <section className="space-y-3">
        <SectionHead
          title="Planning"
          sub="Deze opdracht op de tijdlijn"
          Icon={AudioLines}
          color={C.teal}
        />
        <Timeline tracks={focusTrack} pos={pos} playing={playing} />
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} color={C.teal} />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: tint(C.teal, 0.16) }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.6} style={{ color: C.teal }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" Icon={TriangleAlert} color={C.amber} />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: tint(C.amber, 0.14),
                      boxShadow: `inset 0 0 0 1px ${tint(C.amber, 0.4)}`,
                    }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} style={{ color: C.amber }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.teal,
            color: C.onColor,
            ["--tw-ring-color" as string]: C.teal,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.panel,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.line}`,
            ["--tw-ring-color" as string]: C.teal,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={15} strokeWidth={2} style={{ color: C.teal }} aria-hidden="true" /> Bewaar
          clip
        </button>
      </div>
    </div>
  );
}

// ── Verificatie — certificaten met status-chips + vertrouwensniveau ─────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Verificatie"
          sub="Certificaten &amp; documenten"
          Icon={ShieldCheck}
          color={C.violet}
        />
        <button
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.violet,
            color: C.onColor,
            ["--tw-ring-color" as string]: C.violet,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Card className="relative">
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <span
            className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${C.violet} 0deg, ${C.violet} ${dek * 3.6}deg, ${C.line} ${dek * 3.6}deg 360deg)`,
            }}
            aria-hidden="true"
          >
            <span
              className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full"
              style={{ background: C.panel }}
            >
              <span
                className="text-[30px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: C.violet }}
              >
                {dek}
                <span className="text-[15px]" style={{ color: C.inkFaint }}>
                  %
                </span>
              </span>
            </span>
          </span>
          <div className="max-w-sm">
            <div className="text-[20px] font-semibold" style={{ ...display, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elk geverifieerd certificaat versterkt je profiel. Houd je dekking hoog, dan blijft je
              tijdlijn schoon voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-semibold"
              style={{ ...bodyF, background: C.teal, color: C.onColor }}
            >
              <BadgeCheck size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const solid = m.variant === "solid";
          const actionable = c.status !== "VERIFIED";
          return (
            <Card key={c.naam} interactive className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: solid ? m.color : tint(m.color, 0.14),
                  ...(solid ? {} : borderFor(m)),
                }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.2} style={{ color: solid ? m.fg : m.color }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-semibold"
                  style={{ ...display, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...bodyF,
                        background: C.panelHi,
                        color: C.ink,
                        boxShadow: `inset 0 0 0 1px ${C.line}`,
                        ["--tw-ring-color" as string]: m.color,
                        ["--tw-ring-offset-color" as string]: C.panel,
                      }}
                    >
                      {c.status === "EXPIRING"
                        ? "Vernieuwen"
                        : c.status === "REJECTED"
                          ? "Opnieuw indienen"
                          : "Bekijk"}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Documenten-strook — verrijking */}
      <section className="space-y-3">
        <SectionHead
          title="Documenten"
          sub="Privé — alleen geverifieerde zijn zichtbaar"
          Icon={FileText}
          color={C.amber}
        />
        <Card>
          {DOCUMENTEN.map((d, i) => (
            <div
              key={d.naam}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                style={{ background: C.panelHi, color: C.amber }}
                aria-hidden="true"
              >
                <FileText size={16} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[13.5px] font-semibold"
                  style={{ ...bodyF, color: C.ink }}
                >
                  {d.naam}
                </div>
                <div
                  className="mt-0.5 text-[11.5px] tabular-nums"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  {d.type} · {d.grootte} · {d.bijgewerkt}
                </div>
              </div>
              <StatusTag status={d.status} />
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}

// ── Acties (next-action) + berichten ────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <SectionHead
        title="Volgende beste acties"
        sub="Op urgentie gerangschikt — pak de bovenste eerst"
        Icon={Radio}
        color={C.rose}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const col = warn ? C.amber : C.teal;
          return (
            <li key={a.titel}>
              <Card interactive className="flex items-stretch">
                <span className="w-1.5 shrink-0" style={{ background: col }} aria-hidden="true" />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[16px] font-semibold tabular-nums"
                    style={{
                      ...mono,
                      background: tint(col, 0.14),
                      color: col,
                      boxShadow: `inset 0 0 0 1px ${tint(col, 0.4)}`,
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                        style={{
                          ...mono,
                          background: tint(col, 0.14),
                          color: col,
                          boxShadow: `inset 0 0 0 1px ${tint(col, 0.4)}`,
                        }}
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Radio size={10} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[17px] font-semibold"
                        style={{ ...display, color: C.ink }}
                      >
                        {a.titel}
                      </h3>
                    </div>
                    <p
                      className="mt-1.5 text-[13px] leading-relaxed"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                    <button
                      className="mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        warn
                          ? {
                              ...bodyF,
                              background: C.amber,
                              color: C.onColor,
                              ["--tw-ring-color" as string]: C.amber,
                              ["--tw-ring-offset-color" as string]: C.bg,
                            }
                          : {
                              ...bodyF,
                              background: C.panelHi,
                              color: C.ink,
                              boxShadow: `inset 0 0 0 1px ${C.line}`,
                              ["--tw-ring-color" as string]: C.teal,
                              ["--tw-ring-offset-color" as string]: C.bg,
                            }
                      }
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      {/* Berichten-strook */}
      <section className="space-y-3">
        <SectionHead title="Berichten" sub="Recente gesprekken" Icon={FileText} color={C.violet} />
        <Card>
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  ...mono,
                  background: tint(C.violet, 0.14),
                  color: C.violet,
                  boxShadow: `inset 0 0 0 1px ${tint(C.violet, 0.4)}`,
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[14px] font-semibold"
                    style={{ ...display, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.rose }}
                      aria-label="Ongelezen"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {b.preview}
                </p>
              </div>
              <span
                className="shrink-0 text-[11px] tabular-nums"
                style={{ ...mono, color: C.inkFaint }}
              >
                {b.tijd}
              </span>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; color: string; variant: Variant } => {
    if (status === "Betaald")
      return { label: "Betaald", Icon: Check, color: C.teal, variant: "solid" };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, color: C.amber, variant: "dashed" };
    return { label: "Concept", Icon: FileText, color: C.inkFaint, variant: "outline" };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Facturen" sub="Omzet &amp; openstaand" Icon={Coins} color={C.amber} />
        <button
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.amber,
            color: C.onColor,
            ["--tw-ring-color" as string]: C.amber,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, col: C.teal },
          { l: "Openstaand", v: `${open}`, col: C.amber },
          { l: "Te factureren", v: "€ 1.350", col: C.violet },
        ].map((s) => (
          <Card key={s.l} interactive className="p-4">
            <div
              className="h-1 w-10 rounded-full"
              style={{ background: s.col }}
              aria-hidden="true"
            />
            <div className="mt-3 text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
              {s.l}
            </div>
            <div
              className="mt-1 text-[26px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {s.v}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.panelHi }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...mono, color: C.inkFaint }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const m = factMeta(f.status);
                const solid = m.variant === "solid";
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors"
                    style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
                  >
                    <td
                      className="px-4 py-3 text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          ...bodyF,
                          background: solid ? m.color : tint(m.color, 0.12),
                          color: solid ? C.onColor : m.color,
                          border:
                            m.variant === "dashed"
                              ? `1px dashed ${m.color}`
                              : solid
                                ? `1px solid ${m.color}`
                                : `1px solid ${C.line}`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[14px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.teal }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: "rgba(10,11,15,0.7)" }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[16px] font-bold tabular-nums"
                  style={{ ...mono, color: C.onColor }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
