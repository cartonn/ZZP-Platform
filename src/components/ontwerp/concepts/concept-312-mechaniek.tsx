"use client";

// Concept 312 — "Mechaniek" · verfijnd mechanisch-toetsenbord-skeuomorfisme.
// Signature: chunky "keycap"-oppervlakken met top-bevel en drukschaduw, bevredigende press-states
// (translate-y bij indrukken), keyboard-first met een zichtbare command-balk en keycap-hints
// (⌘K, ↵, esc). Warm-grijs chassis, één heldere oranje legende-accent. Fonts: kop --font-lab-space
// · tekst --font-lab-geist · keycaps/cijfers --font-lab-mono.

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
  Command,
  CornerDownLeft,
  Keyboard,
  FileText,
  Mail,
  Bell,
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

// Warm-grey chassis, cream keycaps, one bright orange legend accent.
const P = {
  chassis: "#dcd6c9",
  chassisDeep: "#cfc8b8",
  plate: "#c6bfad",
  cap: "#f6f2e9",
  capTop: "#fdfbf6",
  capFace: "#efe9dc",
  capEdge: "#c3bba7",
  capEdgeDeep: "#aba38d",
  ink: "#2c2822",
  fg: "#403a30",
  fgSoft: "#6b6353",
  muted: "#8f8776",
  faint: "#b3aa95",
  line: "#c9c1af",
  lineSoft: "#d7cfbd",
  accent: "#e6552a",
  accentDeep: "#c6431e",
  accentSoft: "#f07a52",
  green: "#3f8f4e",
  amber: "#c98a12",
  red: "#c0392b",
  citrus: "#cf7d16",
};

const display = { fontFamily: "var(--font-lab-space), system-ui, sans-serif" };
const sans = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6552a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#dcd6c9]";

// Raised keycap shadow — a top highlight bevel plus a chunky drop that reads as depth on the switch.
const capShadow = `0 1px 0 rgba(255,255,255,0.9) inset, 0 -3px 0 rgba(0,0,0,0.05) inset, 0 3px 0 ${P.capEdge}, 0 5px 0 ${P.capEdgeDeep}, 0 7px 10px -4px rgba(44,40,34,0.35)`;
const capShadowPressed = `0 1px 0 rgba(255,255,255,0.7) inset, 0 1px 0 ${P.capEdge}, 0 2px 4px -2px rgba(44,40,34,0.3)`;

// ---- Keycap primitives ------------------------------------------------------

// A static raised keycap surface — used for tiles, labels, and legends.
function Keycap({
  children,
  className,
  style,
  accent = false,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  accent?: boolean;
}) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        background: accent
          ? `linear-gradient(180deg, ${P.accentSoft}, ${P.accent})`
          : `linear-gradient(180deg, ${P.capTop}, ${P.capFace})`,
        border: `1px solid ${accent ? P.accentDeep : P.capEdge}`,
        borderRadius: 12,
        boxShadow: accent
          ? `0 1px 0 rgba(255,255,255,0.5) inset, 0 3px 0 ${P.accentDeep}, 0 6px 10px -4px rgba(198,67,30,0.5)`
          : capShadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// A pressable key — satisfying travel: translate-y down and shadow collapses on press.
function KeyButton({
  children,
  onClick,
  variant = "cap",
  className,
  ariaLabel,
  ariaPressed,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "cap" | "accent";
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  active?: boolean;
}) {
  const [down, setDown] = useState(false);
  const accent = variant === "accent";
  const pressed = down;
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") setDown(true);
      }}
      onKeyUp={() => setDown(false)}
      onBlur={() => setDown(false)}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`inline-flex select-none items-center justify-center gap-2 text-[12.5px] font-semibold transition-all duration-75 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: accent ? "#fff" : active ? P.accentDeep : P.ink,
        background: accent
          ? `linear-gradient(180deg, ${P.accentSoft}, ${P.accent})`
          : active
            ? `linear-gradient(180deg, ${P.capTop}, #f3e4d8)`
            : `linear-gradient(180deg, ${P.capTop}, ${P.capFace})`,
        border: `1px solid ${accent ? P.accentDeep : active ? P.accent : P.capEdge}`,
        borderRadius: 12,
        padding: "9px 16px",
        transform: pressed ? "translateY(3px)" : "translateY(0)",
        boxShadow: pressed
          ? capShadowPressed
          : accent
            ? `0 1px 0 rgba(255,255,255,0.5) inset, 0 3px 0 ${P.accentDeep}, 0 6px 10px -4px rgba(198,67,30,0.5)`
            : capShadow,
      }}
    >
      {children}
    </button>
  );
}

// A small legend hint keycap — e.g. ⌘K, ↵, esc.
function KeyHint({ children }: { children: ReactNode }) {
  return (
    <kbd
      className="inline-flex h-6 min-w-[24px] items-center justify-center gap-1 px-1.5 text-[11px] font-semibold"
      style={{
        ...mono,
        color: P.fg,
        background: `linear-gradient(180deg, ${P.capTop}, ${P.capFace})`,
        border: `1px solid ${P.capEdge}`,
        borderRadius: 6,
        boxShadow: `0 1px 0 rgba(255,255,255,0.8) inset, 0 2px 0 ${P.capEdge}, 0 2px 3px -1px rgba(44,40,34,0.25)`,
      }}
    >
      {children}
    </kbd>
  );
}

function Kicker({ children, tone = "accent" }: { children: ReactNode; tone?: "accent" | "muted" }) {
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-[0.2em]"
      style={{ ...mono, color: tone === "accent" ? P.accent : P.muted }}
    >
      {children}
    </span>
  );
}

// Sparkline as a stepped LED-bar row — reads like a key-travel meter.
function StepBars({ spark, height = 22 }: { spark: number[]; height?: number }) {
  const max = Math.max(...spark);
  return (
    <div className="flex items-end gap-[3px]" style={{ height }} aria-hidden="true">
      {spark.map((v, i) => {
        const on = i === spark.length - 1;
        return (
          <div
            key={i}
            className="flex-1 rounded-[2px]"
            style={{
              height: `${Math.max(14, (v / max) * 100)}%`,
              background: on ? P.accent : `${P.accent}44`,
            }}
          />
        );
      })}
    </div>
  );
}

// Match as a segmented key-travel gauge (0..100 across 20 segments).
function TravelGauge({ value, size = 64 }: { value: number; size?: number }) {
  const segs = 10;
  const filled = Math.round((value / 100) * segs);
  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5" style={{ width: size + 20 }}>
      <div className="flex items-center gap-[3px]" aria-hidden="true">
        {Array.from({ length: segs }).map((_, i) => (
          <span
            key={i}
            className="rounded-[2px]"
            style={{
              width: 4,
              height: i < filled ? 16 : 9,
              background: i < filled ? P.accent : P.lineSoft,
              boxShadow: i < filled ? `0 1px 0 ${P.accentDeep}` : "none",
              alignSelf: "flex-end",
            }}
          />
        ))}
      </div>
      <span
        className="text-[15px] font-bold tabular-nums leading-none"
        style={{ ...mono, color: P.ink }}
      >
        {value}
        <span className="text-[10px]" style={{ color: P.muted }}>
          %
        </span>
      </span>
    </div>
  );
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; color: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, color: P.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Hourglass, color: P.amber };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, color: P.citrus };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: P.red };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, color } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.03em]"
      style={{
        ...mono,
        color,
        background: `${color}16`,
        border: `1px solid ${color}55`,
        borderRadius: 7,
      }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

function ScreenHead({ title, sub, kicker }: { title: string; sub?: string; kicker: string }) {
  return (
    <div className="mb-7">
      <div className="mb-2 flex items-center gap-2.5">
        <Kicker>{kicker}</Kicker>
        <div className="h-px flex-1" style={{ background: P.line }} aria-hidden="true" />
      </div>
      <h1
        className="text-[28px] font-bold leading-[1.05] tracking-tight sm:text-[36px]"
        style={{ ...display, color: P.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed"
          style={{ ...sans, color: P.fgSoft }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// The command bar — keyboard-first, always visible, with keycap legend hints.
function CommandBar({ onJump }: { onJump: () => void }) {
  return (
    <Keycap className="mb-8 flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <Command size={16} strokeWidth={2.2} style={{ color: P.accent }} aria-hidden="true" />
        <button
          onClick={onJump}
          className={`min-w-0 flex-1 text-left text-[13px] ${RING} rounded`}
          style={{ ...sans, color: P.muted }}
        >
          Typ een commando of spring naar een scherm…
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <KeyHint>
          <Command size={11} strokeWidth={2.4} aria-hidden="true" />K
        </KeyHint>
        <KeyHint>
          <CornerDownLeft size={11} strokeWidth={2.4} aria-hidden="true" />
        </KeyHint>
        <KeyHint>esc</KeyHint>
      </div>
    </Keycap>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      <Keycap className="mb-7 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-6 p-6 sm:p-8">
          <div className="min-w-0">
            <div className="mb-3">
              <Kicker>
                {PROFIEL.plaats} · {PROFIEL.rol}
              </Kicker>
            </div>
            <h1
              className="text-[34px] font-bold leading-[0.98] tracking-tight sm:text-[44px]"
              style={{ ...display, color: P.ink }}
            >
              Goedemorgen,
              <br />
              {voornaam}.
            </h1>
            <p
              className="mt-4 max-w-md text-[13.5px] leading-relaxed"
              style={{ ...sans, color: P.fgSoft }}
            >
              Alles op één toetsenbord: elke actie een toets, elke toets een druk. We tonen alleen
              wat telt en wat nu jouw aandacht vraagt.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-bold"
                style={{
                  ...sans,
                  color: P.green,
                  background: `${P.green}16`,
                  border: `1px solid ${P.green}44`,
                  borderRadius: 9,
                }}
              >
                <ShieldCheck size={14} strokeWidth={2.2} aria-hidden="true" />
                {PROFIEL.trust}
              </span>
              <span
                className="inline-flex items-center gap-1.5 text-[11px]"
                style={{ ...mono, color: P.muted }}
              >
                <Keyboard size={13} strokeWidth={2} aria-hidden="true" />
                Sneltoetsen actief
              </span>
            </div>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group flex flex-col items-center gap-2 rounded-2xl p-2 transition-transform hover:-translate-y-0.5 ${RING}`}
            aria-label={`Open beste match: ${top.titel}`}
          >
            <Keycap accent className="flex flex-col items-center gap-1.5 px-6 py-5">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ ...mono, color: "#fff" }}
              >
                Beste match
              </span>
              <span
                className="text-[40px] font-bold tabular-nums leading-none"
                style={{ ...display, color: "#fff" }}
              >
                {top.match}
                <span className="text-[18px]">%</span>
              </span>
            </Keycap>
            <span
              className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ ...mono, color: P.accent }}
            >
              Openen
              <ArrowRight
                size={11}
                strokeWidth={2.6}
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </button>
        </div>
      </Keycap>

      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Keycap key={k.label} className="p-4">
            <div className="flex items-start justify-between">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ ...mono, color: P.muted }}
              >
                {k.label}
              </span>
              <span
                className="text-[10px] font-bold tabular-nums"
                style={{ ...mono, color: k.up ? P.green : P.citrus }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[24px] font-bold tabular-nums leading-none"
              style={{ ...display, color: P.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <StepBars spark={k.spark} height={18} />
            </div>
          </Keycap>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Matches · reageer</Kicker>
          </div>
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o)}
                className={`group block w-full rounded-2xl text-left ${RING}`}
              >
                <Keycap className="flex items-center gap-4 p-4 transition-transform group-hover:-translate-y-0.5">
                  <TravelGauge value={o.match} size={56} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[10px] font-bold uppercase tracking-[0.13em]"
                      style={{ ...mono, color: P.muted }}
                    >
                      {o.id}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[15px] font-bold leading-tight"
                      style={{ ...display, color: P.ink }}
                    >
                      {o.titel}
                    </div>
                    <div className="mt-0.5 text-[12.5px]" style={{ ...sans, color: P.fgSoft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    className="shrink-0 transition-transform group-hover:translate-x-1"
                    style={{ color: P.accent }}
                    aria-hidden="true"
                  />
                </Keycap>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-3">
              <Kicker tone="muted">Volgende toets</Kicker>
            </div>
            <Keycap className="p-4">
              {ACTIES.slice(0, 1).map((a) => (
                <div key={a.titel}>
                  <div
                    className="mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                    style={{
                      ...mono,
                      color: P.citrus,
                      background: `${P.citrus}16`,
                      borderRadius: 6,
                    }}
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" />
                    Aandacht
                  </div>
                  <div
                    className="text-[14px] font-bold leading-snug"
                    style={{ ...sans, color: P.ink }}
                  >
                    {a.titel}
                  </div>
                  <p
                    className="mt-1.5 text-[12.5px] leading-relaxed"
                    style={{ ...sans, color: P.fgSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <KeyButton variant="accent">
                      {a.cta}
                      <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                    </KeyButton>
                  </div>
                </div>
              ))}
            </Keycap>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <Mail size={13} strokeWidth={2.2} style={{ color: P.accent }} aria-hidden="true" />
              <Kicker tone="muted">Berichten</Kicker>
            </div>
            <Keycap className="overflow-hidden">
              {BERICHTEN.map((b, i) => (
                <div
                  key={b.van}
                  className="flex items-start gap-3 p-3.5"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${P.lineSoft}` }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center text-[10px] font-bold"
                    style={{ ...mono, color: "#fff", background: P.ink, borderRadius: 8 }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="truncate text-[12.5px] font-bold"
                        style={{ ...sans, color: P.ink }}
                      >
                        {b.van}
                      </span>
                      <span
                        className="shrink-0 text-[10px] tabular-nums"
                        style={{ ...mono, color: P.muted }}
                      >
                        {b.tijd}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[12px]" style={{ ...sans, color: P.fgSoft }}>
                      {b.preview}
                    </p>
                  </div>
                  {b.ongelezen && (
                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: P.accent }}
                      aria-label="ongelezen"
                    />
                  )}
                </div>
              ))}
            </Keycap>
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
        kicker="Marktplaats · zoek & reageer"
        title="Opdrachten"
        sub="Typ om te filteren of gebruik de pijltjestoetsen — elke opdracht komt met een verklaarbare match."
      />

      <Keycap className="mb-6 flex flex-wrap items-center gap-3 px-4 py-3">
        <Search size={16} className="shrink-0" style={{ color: P.accent }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="min-w-[8rem] flex-1 bg-transparent text-[14px] outline-none placeholder:opacity-50"
          style={{ ...sans, color: P.ink }}
        />
        <span className="text-[11px] tabular-nums" style={{ ...mono, color: P.muted }}>
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}
        </span>
        {query ? (
          <KeyButton onClick={() => setQuery("")} className="!px-3 !py-1.5 !text-[11px]">
            Wissen
          </KeyButton>
        ) : (
          <KeyHint>/</KeyHint>
        )}
      </Keycap>

      {filtered.length === 0 ? (
        <Keycap className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Keyboard size={30} strokeWidth={1.6} style={{ color: P.accent }} aria-hidden="true" />
          <h3 className="text-[20px] font-bold tracking-tight" style={{ ...display, color: P.ink }}>
            Geen resultaat
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: P.fgSoft }}>
            Geen opdracht voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="mt-1">
            <KeyButton variant="accent" onClick={() => setQuery("")}>
              Filter wissen
            </KeyButton>
          </div>
        </Keycap>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <Keycap key={o.id} className="flex flex-col p-5">
                <div className="flex items-start gap-4">
                  <TravelGauge value={o.match} size={64} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Kicker>{o.id}</Kicker>
                      <span
                        className="px-2 py-0.5 text-[11px] font-bold tabular-nums"
                        style={{
                          ...mono,
                          color: P.accentDeep,
                          background: `${P.accent}16`,
                          borderRadius: 6,
                        }}
                      >
                        {o.tarief}
                      </span>
                    </div>
                    <h3
                      className="text-[17px] font-bold leading-tight"
                      style={{ ...display, color: P.ink }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[13px]" style={{ ...sans, color: P.fgSoft }}>
                      {o.opdrachtgever}
                    </div>
                  </div>
                </div>
                <dl
                  className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12px]"
                  style={{ ...sans, color: P.fgSoft }}
                >
                  {[
                    { Icon: MapPin, v: o.plaats },
                    { Icon: Clock, v: o.uren },
                    { Icon: Calendar, v: o.start },
                  ].map((m, mi) => (
                    <div key={mi} className="flex items-center gap-1.5">
                      <m.Icon
                        size={13}
                        strokeWidth={2}
                        style={{ color: P.accent }}
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
                        ...mono,
                        color: P.fg,
                        background: P.chassisDeep,
                        border: `1px solid ${P.line}`,
                        borderRadius: 6,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-9 w-9 items-center justify-center transition-transform active:translate-y-[2px] ${RING}`}
                    style={{
                      color: isSaved ? "#fff" : P.fg,
                      background: isSaved
                        ? `linear-gradient(180deg, ${P.accentSoft}, ${P.accent})`
                        : `linear-gradient(180deg, ${P.capTop}, ${P.capFace})`,
                      border: `1px solid ${isSaved ? P.accentDeep : P.capEdge}`,
                      borderRadius: 10,
                      boxShadow: isSaved ? `0 2px 0 ${P.accentDeep}` : `0 2px 0 ${P.capEdge}`,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
                    )}
                  </button>
                  <KeyButton variant="accent" onClick={() => onOpen(o)}>
                    Bekijk
                    <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                  </KeyButton>
                </div>
              </Keycap>
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
        <KeyButton onClick={onBack} ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
          Terug
        </KeyButton>
      </div>

      <Keycap className="mb-6 overflow-hidden p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Kicker>{opdracht.id}</Kicker>
              <span
                className="px-2 py-0.5 text-[11px] font-bold tabular-nums"
                style={{
                  ...mono,
                  color: P.accentDeep,
                  background: `${P.accent}16`,
                  borderRadius: 6,
                }}
              >
                {opdracht.tarief}
              </span>
            </div>
            <h2
              className="text-[28px] font-bold leading-[1.03] tracking-tight sm:text-[36px]"
              style={{ ...display, color: P.ink }}
            >
              {opdracht.titel}
            </h2>
            <div className="mt-2 text-[14px]" style={{ ...sans, color: P.fgSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Keycap accent className="flex flex-col items-center px-5 py-4">
              <span
                className="text-[9px] font-bold uppercase tracking-[0.16em]"
                style={{ ...mono, color: "#fff" }}
              >
                Match
              </span>
              <span
                className="text-[34px] font-bold tabular-nums leading-none"
                style={{ ...display, color: "#fff" }}
              >
                {opdracht.match}
                <span className="text-[15px]">%</span>
              </span>
            </Keycap>
            <KeyButton
              onClick={() => toggleSave(opdracht.id)}
              active={isSaved}
              ariaPressed={isSaved}
              ariaLabel={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
              className="!px-3.5 !py-2 !text-[12px]"
            >
              {isSaved ? (
                <BookmarkCheck size={14} strokeWidth={2.2} aria-hidden="true" />
              ) : (
                <Bookmark size={14} strokeWidth={2.2} aria-hidden="true" />
              )}
              {isSaved ? "Bewaard" : "Bewaar"}
            </KeyButton>
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
              style={{ background: P.chassisDeep, border: `1px solid ${P.line}`, borderRadius: 10 }}
            >
              <m.Icon size={15} strokeWidth={2} style={{ color: P.accent }} aria-hidden="true" />
              <div
                className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ ...mono, color: P.muted }}
              >
                {m.label}
              </div>
              <div className="mt-0.5 text-[14px] font-bold" style={{ ...sans, color: P.ink }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </Keycap>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Keycap className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: `${P.green}18`, borderRadius: 7 }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={3} style={{ color: P.green }} />
            </span>
            <span className="text-[13px] font-bold" style={{ ...sans, color: P.ink }}>
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...sans, color: P.fg }}
              >
                <Check
                  size={15}
                  strokeWidth={2.8}
                  className="mt-0.5 shrink-0"
                  style={{ color: P.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Keycap>
        <Keycap className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: `${P.citrus}18`, borderRadius: 7 }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={3} style={{ color: P.citrus }} />
            </span>
            <span className="text-[13px] font-bold" style={{ ...sans, color: P.ink }}>
              Even op letten
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...sans, color: P.fg }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.2}
                  className="mt-0.5 shrink-0"
                  style={{ color: P.citrus }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Keycap>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <KeyButton
          variant="accent"
          onClick={() => setApplied((v) => !v)}
          ariaPressed={applied}
          className="!px-6 !py-3 !text-[13px]"
        >
          {applied ? (
            <Check size={16} strokeWidth={2.8} aria-hidden="true" />
          ) : (
            <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </KeyButton>
        <span
          className="inline-flex items-center gap-1.5 text-[11px]"
          style={{ ...mono, color: P.muted }}
        >
          <KeyHint>
            <CornerDownLeft size={11} strokeWidth={2.4} aria-hidden="true" />
          </KeyHint>
          om te reageren
        </span>
        {applied && (
          <span className="text-[12.5px]" style={{ ...sans, color: P.fgSoft }}>
            De opdrachtgever reageert gemiddeld binnen 6 uur.
          </span>
        )}
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
        kicker="Verificatie · vertrouwen"
        title="Certificaten & documenten"
        sub="Elk bewijsstuk krijgt een status met label én icoon — nooit op kleur alleen. Verlopende stukken vragen actie."
      />

      <Keycap className="mb-6 flex items-start gap-4 p-5">
        <ShieldCheck
          size={24}
          strokeWidth={2.2}
          style={{ color: P.green }}
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        />
        <div>
          <div className="text-[15px] font-bold" style={{ ...sans, color: P.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-1 text-[13px]" style={{ ...sans, color: P.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Keycap>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Certificaten</Kicker>
          </div>
          <div className="space-y-3">
            {CREDENTIALS.map((c) => {
              const expiring = c.status === "EXPIRING";
              return (
                <Keycap
                  key={c.naam}
                  className="flex items-center gap-4 p-4"
                  style={expiring ? { border: `1px solid ${P.citrus}` } : undefined}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center"
                    style={{
                      background: P.chassisDeep,
                      border: `1px solid ${P.line}`,
                      borderRadius: 9,
                    }}
                    aria-hidden="true"
                  >
                    <FileText size={16} strokeWidth={2} style={{ color: P.accent }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold" style={{ ...sans, color: P.ink }}>
                      {c.naam}
                    </div>
                    <div className="text-[12px]" style={{ ...sans, color: P.muted }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusPill status={c.status} />
                </Keycap>
              );
            })}
          </div>

          <Keycap
            className="mt-4 flex items-start gap-3 p-4"
            style={{
              border: `1px solid ${P.citrus}`,
              background: `linear-gradient(180deg, #fbf1e0, #f7ead4)`,
            }}
          >
            <TriangleAlert
              size={18}
              strokeWidth={2.2}
              style={{ color: P.citrus }}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <div className="text-[13px] font-bold" style={{ ...sans, color: P.ink }}>
                VOG verloopt over 23 dagen
              </div>
              <p className="mt-1 text-[12.5px]" style={{ ...sans, color: P.fgSoft }}>
                Vraag op tijd een nieuwe Verklaring Omtrent Gedrag aan om verifieerbaar te blijven.
              </p>
              <div className="mt-3">
                <KeyButton onClick={() => undefined}>
                  VOG vernieuwen
                  <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                </KeyButton>
              </div>
            </div>
          </Keycap>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Kicker tone="muted">Documenten</Kicker>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-7 w-7 items-center justify-center transition-transform active:translate-y-[2px] ${RING}`}
              style={{
                color: P.fg,
                background: `linear-gradient(180deg, ${P.capTop}, ${P.capFace})`,
                border: `1px solid ${P.capEdge}`,
                borderRadius: 8,
                boxShadow: `0 2px 0 ${P.capEdge}`,
              }}
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
                className={`px-3 py-1 text-[11px] font-bold uppercase tracking-[0.03em] transition-transform active:translate-y-[1px] ${RING}`}
                style={{
                  ...mono,
                  color: feedState === s ? "#fff" : P.fg,
                  background:
                    feedState === s
                      ? `linear-gradient(180deg, ${P.accentSoft}, ${P.accent})`
                      : `linear-gradient(180deg, ${P.capTop}, ${P.capFace})`,
                  border: `1px solid ${feedState === s ? P.accentDeep : P.capEdge}`,
                  borderRadius: 7,
                  boxShadow: `0 2px 0 ${feedState === s ? P.accentDeep : P.capEdge}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <div className="space-y-3" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Keycap key={i} className="p-4">
                  <div
                    className="h-3 w-2/3 animate-pulse rounded"
                    style={{ background: P.lineSoft }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: P.lineSoft }}
                  />
                </Keycap>
              ))}
            </div>
          )}

          {feedState === "error" && (
            <Keycap
              className="flex flex-col items-center gap-2 px-4 py-10 text-center"
              style={{ border: `1px solid ${P.red}` }}
            >
              <XCircle size={26} strokeWidth={2} style={{ color: P.red }} aria-hidden="true" />
              <div className="text-[16px] font-bold" style={{ ...display, color: P.ink }}>
                Kluis onbereikbaar
              </div>
              <p className="text-[12px]" style={{ ...sans, color: P.fgSoft }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <KeyButton variant="accent" onClick={() => setFeedState("ok")}>
                  Opnieuw proberen
                </KeyButton>
              </div>
            </Keycap>
          )}

          {feedState === "ok" && (
            <div className="space-y-3">
              {DOCUMENTEN.map((d) => (
                <Keycap key={d.naam} className="flex items-center gap-3 p-3.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{ ...mono, color: "#fff", background: P.ink, borderRadius: 7 }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12.5px] font-bold"
                      style={{ ...sans, color: P.ink }}
                    >
                      {d.naam}
                    </div>
                    <div className="text-[11px] tabular-nums" style={{ ...mono, color: P.muted }}>
                      {d.grootte} · {d.bijgewerkt}
                    </div>
                  </div>
                  <StatusPill status={d.status} />
                </Keycap>
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
        kicker="Acties · volgende beste stap"
        title="Wat vraagt nu je aandacht"
        sub="Druk een actie af zodra je klaar bent — de rest schuift automatisch door."
      />

      {openCount === 0 ? (
        <Keycap className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Check size={30} strokeWidth={2.4} style={{ color: P.green }} aria-hidden="true" />
          <h3 className="text-[20px] font-bold tracking-tight" style={{ ...display, color: P.ink }}>
            Alles afgerond
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: P.fgSoft }}>
            Geen openstaande acties meer. Alle toetsen ingedrukt.
          </p>
        </Keycap>
      ) : (
        <>
          <div className="mb-6 flex items-baseline gap-3">
            <span
              className="text-[38px] font-bold tabular-nums leading-none"
              style={{ ...display, color: P.accent }}
            >
              {String(openCount).padStart(2, "0")}
            </span>
            <span
              className="text-[12px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: P.muted }}
            >
              {openCount === 1 ? "openstaande actie" : "openstaande acties"}
            </span>
          </div>

          <div className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <Keycap
                  key={a.titel}
                  className="flex items-start gap-4 p-5"
                  style={{ opacity: isDone ? 0.6 : 1 }}
                >
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center transition-transform active:translate-y-[2px] ${RING}`}
                    style={{
                      border: `1px solid ${isDone ? P.green : P.capEdge}`,
                      background: isDone
                        ? P.green
                        : `linear-gradient(180deg, ${P.capTop}, ${P.capFace})`,
                      color: "#fff",
                      borderRadius: 7,
                      boxShadow: `0 2px 0 ${isDone ? "#2f6d3b" : P.capEdge}`,
                    }}
                  >
                    {isDone && <Check size={13} strokeWidth={2.8} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                      style={{
                        ...mono,
                        color: warn ? P.citrus : P.accent,
                        background: warn ? `${P.citrus}16` : `${P.accent}14`,
                        borderRadius: 6,
                      }}
                    >
                      {warn ? (
                        <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                      ) : (
                        <Bell size={10} strokeWidth={2.4} aria-hidden="true" />
                      )}
                      {warn ? "Aandacht" : "Info"}
                    </span>
                    <div
                      className="mt-1.5 text-[15px] font-bold leading-snug"
                      style={{
                        ...sans,
                        color: P.ink,
                        textDecoration: isDone ? "line-through" : "none",
                      }}
                    >
                      {a.titel}
                    </div>
                    <p className="mt-1 text-[12.5px]" style={{ ...sans, color: P.fgSoft }}>
                      {a.detail}
                    </p>
                    {!isDone && (
                      <span
                        className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold"
                        style={{ ...sans, color: warn ? P.citrus : P.accent }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </Keycap>
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
    status === "Openstaand" ? P.citrus : status === "Concept" ? P.muted : P.green;
  return (
    <div>
      <ScreenHead
        kicker="Facturen · overzicht"
        title="Facturen"
        sub="Overzichtelijk en zonder gedoe — je weet altijd waar je aan toe bent."
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", color: P.green },
          { label: "Openstaand", value: "€ 1.350", color: P.citrus },
          { label: "Concept", value: "€ 880", color: P.accent },
        ].map((s) => (
          <Keycap key={s.label} className="p-5">
            <div
              className="text-[10px] font-bold uppercase tracking-[0.13em]"
              style={{ ...mono, color: P.muted }}
            >
              {s.label}
            </div>
            <div
              className="mt-2 text-[26px] font-bold tabular-nums"
              style={{ ...display, color: s.color }}
            >
              {s.value}
            </div>
          </Keycap>
        ))}
      </div>

      <Keycap className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${P.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ ...mono, color: P.muted, textAlign: i >= 3 ? "right" : "left" }}
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
                  style={{ borderBottom: `1px solid ${P.lineSoft}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = P.chassisDeep)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td
                    className="px-4 py-4 text-[12.5px] font-bold tabular-nums"
                    style={{ ...mono, color: P.accent }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-4 text-[13px]" style={{ ...sans, color: P.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-4 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: P.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-4 py-4 text-right text-[13px] font-bold tabular-nums"
                    style={{ ...sans, color: P.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.03em]"
                      style={{ ...mono, color: statusColor(f.status) }}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: statusColor(f.status) }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: `1px solid ${P.line}` }}>
                <td
                  className="px-4 py-4 text-[11px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: P.muted }}
                  colSpan={3}
                >
                  Totaal
                </td>
                <td
                  className="px-4 py-4 text-right text-[15px] font-bold tabular-nums"
                  style={{ ...display, color: P.ink }}
                >
                  € 7.782
                </td>
                <td className="px-4 py-4" />
              </tr>
            </tbody>
          </table>
        </div>
      </Keycap>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept312() {
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
      style={{
        ...sans,
        color: P.fg,
        background: `${P.chassis}`,
        backgroundImage: `radial-gradient(rgba(44,40,34,0.05) 1px, transparent 1px)`,
        backgroundSize: "6px 6px",
      }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Keycap accent className="flex h-11 w-11 items-center justify-center">
              <Keyboard size={20} strokeWidth={2.2} style={{ color: "#fff" }} aria-hidden="true" />
            </Keycap>
            <div className="leading-tight">
              <div
                className="text-[19px] font-bold tracking-tight"
                style={{ ...display, color: P.ink }}
              >
                Mechaniek
              </div>
              <div
                className="text-[9px] font-bold uppercase tracking-[0.28em]"
                style={{ ...mono, color: P.accent }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-bold" style={{ ...sans, color: P.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...sans, color: P.fgSoft }}
              >
                <ShieldCheck
                  size={12}
                  strokeWidth={2}
                  style={{ color: P.green }}
                  aria-hidden="true"
                />
                {PROFIEL.trust}
              </div>
            </div>
            <Keycap
              className="flex h-10 w-10 items-center justify-center text-[12px] font-bold"
              style={{ color: P.ink }}
            >
              <span style={{ ...display }}>{PROFIEL.initialen}</span>
            </Keycap>
          </div>
        </header>

        {/* Keycap nav row — chunky pressable caps. */}
        <nav className="mb-6 overflow-x-auto" aria-label="Hoofdnavigatie">
          <div className="flex items-stretch gap-2 pb-2">
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <KeyButton
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  variant={on ? "accent" : "cap"}
                  ariaPressed={on}
                  className="shrink-0 !text-[12px] uppercase !tracking-[0.03em]"
                >
                  {s.label}
                </KeyButton>
              );
            })}
          </div>
        </nav>

        <CommandBar onJump={() => setScreen("marktplaats")} />

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

        <div className="mt-9 h-px w-full" style={{ background: P.line }} aria-hidden="true" />
        <footer
          className="flex flex-wrap items-center justify-between gap-2 pt-4 text-[10.5px]"
          style={{ ...mono, color: P.muted }}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: P.accent }}
              aria-hidden="true"
            />
            {SCREENS.length} schermen · mechaniek v312
          </span>
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            {NAV.slice(0, 3).map((n) => (
              <KeyHint key={n}>{n}</KeyHint>
            ))}
          </span>
          <span className="uppercase tracking-[0.14em]">Keycaps · bevel · press-travel</span>
        </footer>
      </div>
    </div>
  );
}
