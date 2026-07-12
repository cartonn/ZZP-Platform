"use client";

// Concept 275 — "Solarisatie" · Fotografische solarisatie / Sabattier-effect (dark).
// Signature: donkere kunstfoto-esthetiek met omgekeerde luminantie-accenten — glow-randen waar het
// licht "omslaat". Hoog-contrast monochroom met één elektrische omslag-kleur (magenta) plus cyaan
// als tweede omslag; subtiele grain-textuur via CSS; dramatische belichting. Artistiek, donker,
// filmisch — maar functioneel en leesbaar. Fonts: Space Grotesk (tekst) + Space Mono (cijfers).

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
  Aperture,
  TrendingUp,
  TrendingDown,
  Bookmark,
  BookmarkCheck,
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

// High-contrast dark film stock with a magenta/cyan luminance-flip.
const C = {
  bg: "#070709",
  bg2: "#0d0d11",
  panel: "#121218",
  panelHi: "#181820",
  line: "#282833",
  lineSoft: "#1d1d25",
  fg: "#f3f3f6",
  fgSoft: "#c6c6d1",
  muted: "#83838f",
  faint: "#5a5a66",
  flip: "#ff26c9", // electric magenta — the point where light "flips"
  flipDim: "rgba(255,38,201,0.16)",
  cyan: "#25e2ff", // second flip
  cyanDim: "rgba(37,226,255,0.14)",
  amber: "#ffb020",
  amberDim: "rgba(255,176,32,0.15)",
  red: "#ff466b",
  redDim: "rgba(255,70,107,0.16)",
};

const sans = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-space-mono)" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff26c9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070709]";

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Search,
};

const glow = (color: string, r = 16) => `0 0 ${r}px ${color}`;

// ---- Grain + panels ---------------------------------------------------------

function Grain() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style={{
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.55) 0.5px, transparent 0.6px), radial-gradient(rgba(255,255,255,0.35) 0.5px, transparent 0.6px)",
        backgroundSize: "3px 3px, 4px 4px",
        backgroundPosition: "0 0, 1px 2px",
        opacity: 0.05,
        mixBlendMode: "screen",
      }}
    />
  );
}

function cardStyle(): CSSProperties {
  return {
    background: `linear-gradient(160deg, ${C.panelHi}, ${C.panel})`,
    border: `1px solid ${C.line}`,
    borderRadius: 12,
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
    <section
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{ ...cardStyle(), ...style }}
    >
      {children}
    </section>
  );
}

// ---- Signature: solarized figures & sparkline -------------------------------

// The Sabattier flip rendered as a gradient text with a magenta glow.
function FlipFigure({
  children,
  size = 26,
  tone = C.flip,
}: {
  children: ReactNode;
  size?: number;
  tone: string;
}) {
  return (
    <span
      className="font-semibold tabular-nums leading-none"
      style={{
        ...mono,
        fontSize: size,
        color: C.fg,
        textShadow: `0 0 18px ${tone}`,
      }}
    >
      {children}
    </span>
  );
}

// Sparkline where luminance inverts along the curve — bright core, glowing flip edge.
function SolarSpark({
  data,
  tone = C.flip,
  height = 46,
}: {
  data: number[];
  tone?: string;
  height?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const id = "sol" + Math.round((data[0] ?? 0) * 100) + data.length;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 70 - 15;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1]!;
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={tone} stopOpacity={0} />
          <stop offset="100%" stopColor={tone} stopOpacity={0.32} />
        </linearGradient>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={C.cyan} />
          <stop offset="100%" stopColor={tone} />
        </linearGradient>
      </defs>
      <polygon points={`0,100 ${line} 100,100`} fill={`url(#${id}-f)`} />
      <polyline
        points={line}
        fill="none"
        stroke={`url(#${id}-s)`}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ filter: `drop-shadow(0 0 4px ${tone})` }}
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r={2.6}
        fill={C.fg}
        style={{ filter: `drop-shadow(0 0 6px ${tone})` }}
      />
    </svg>
  );
}

function MatchOrb({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const tone = value >= 90 ? C.flip : value >= 82 ? C.cyan : C.amber;
  const dim = value >= 90 ? C.flipDim : value >= 82 ? C.cyanDim : C.amberDim;
  const d = size === "sm" ? 48 : 62;
  const r = (d - 6) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div
      className="relative shrink-0"
      style={{ width: d, height: d }}
      aria-label={`Match ${value} procent`}
    >
      <svg width={d} height={d} className="block -rotate-90" aria-hidden="true">
        <circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke={C.line} strokeWidth={3} />
        <circle
          cx={d / 2}
          cy={d / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
          style={{
            filter: `drop-shadow(0 0 5px ${tone})`,
            transition: "stroke-dashoffset 0.6s ease",
          }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center rounded-full"
        style={{ background: `radial-gradient(circle, ${dim}, transparent 70%)` }}
      >
        <span
          className={`font-semibold tabular-nums ${size === "sm" ? "text-[13px]" : "text-[16px]"}`}
          style={{ ...mono, color: C.fg, textShadow: glow(tone, 8) }}
        >
          {value}
        </span>
      </span>
    </div>
  );
}

// ---- Status vocabulary (label + icon) ---------------------------------------

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string; dim: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, tone: C.flip, dim: C.flipDim };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.cyan, dim: C.cyanDim };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, tone: C.amber, dim: C.amberDim };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red, dim: C.redDim };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const { label, Icon, tone, dim } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5 text-[11px] font-semibold"
      style={{
        ...sans,
        color: tone,
        background: dim,
        border: `1px solid ${tone}`,
        boxShadow: `inset 0 0 12px ${dim}`,
      }}
    >
      <Icon
        size={12}
        strokeWidth={2.4}
        aria-hidden="true"
        style={{ filter: `drop-shadow(0 0 3px ${tone})` }}
      />
      {label}
    </span>
  );
}

function SectionTitle({ children, tone = C.flip }: { children: ReactNode; tone?: string }) {
  return (
    <h2
      className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em]"
      style={{ ...sans, color: C.fgSoft }}
    >
      <span
        className="block h-3 w-[3px] rounded-full"
        style={{ background: tone, boxShadow: glow(tone, 8) }}
        aria-hidden="true"
      />
      {children}
    </h2>
  );
}

function ScreenHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-7">
      <div
        className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em]"
        style={{ ...mono, color: C.flip, textShadow: glow(C.flip, 6) }}
      >
        {eyebrow}
      </div>
      <h1
        className="text-[28px] font-semibold leading-tight tracking-tight sm:text-[34px]"
        style={{ ...sans, color: C.fg }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2 max-w-xl text-[14px] leading-relaxed"
          style={{ ...sans, color: C.muted }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const voornaam = PROFIEL.naam.split(" ")[0];
  const top = OPDRACHTEN[0] as Opdracht;
  const tones = [C.flip, C.cyan, C.amber, C.flip];
  return (
    <div>
      <div className="mb-8">
        <div
          className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em]"
          style={{ ...mono, color: C.cyan, textShadow: glow(C.cyan, 6) }}
        >
          {PROFIEL.plaats} · belichting
        </div>
        <h1
          className="text-[32px] font-semibold leading-none tracking-tight sm:text-[40px]"
          style={{ ...sans, color: C.fg }}
        >
          Dag, {voornaam}
        </h1>
        <p className="mt-2 text-[14px]" style={{ ...sans, color: C.muted }}>
          Je platform in de donkere kamer — alleen wat oplicht vraagt aandacht.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const tone = tones[i % tones.length] ?? C.flip;
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <Panel key={k.label} className="p-4">
              <div
                className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${tone}, transparent 70%)`,
                  opacity: 0.18,
                }}
                aria-hidden="true"
              />
              <div className="relative flex items-start justify-between gap-2">
                <span
                  className="text-[10.5px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...sans, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ ...mono, color: k.up ? tone : C.red }}
                >
                  <Trend size={11} strokeWidth={2.2} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div className="relative mt-1.5">
                <FlipFigure size={24} tone={tone}>
                  {k.value}
                </FlipFigure>
              </div>
              <div className="relative mt-2">
                <SolarSpark data={k.spark} tone={tone} />
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <SectionTitle>Beste match</SectionTitle>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group block w-full p-5 text-left transition-transform hover:-translate-y-0.5 ${RING}`}
            style={{
              ...cardStyle(),
              boxShadow: `0 0 0 1px ${C.line}, 0 0 30px rgba(255,38,201,0.08)`,
            }}
          >
            <div className="flex items-start gap-4">
              <MatchOrb value={top.match} />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] tabular-nums" style={{ ...mono, color: C.faint }}>
                  {top.id}
                </span>
                <h3
                  className="mt-0.5 text-[18px] font-semibold leading-tight"
                  style={{ ...sans, color: C.fg }}
                >
                  {top.titel}
                </h3>
                <p className="mt-0.5 text-[13px]" style={{ ...sans, color: C.muted }}>
                  {top.opdrachtgever} · {top.plaats} · {top.tarief}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {top.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11px]"
                      style={{
                        ...sans,
                        color: C.fgSoft,
                        background: C.bg2,
                        border: `1px solid ${C.line}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <ArrowRight
                size={20}
                className="mt-1 shrink-0 transition-transform group-hover:translate-x-1"
                style={{ color: C.flip, filter: glowFilter(C.flip) }}
                aria-hidden="true"
              />
            </div>
          </button>

          <Panel className="mt-5 flex items-start gap-4 p-5">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: C.flipDim,
                color: C.flip,
                border: `1px solid ${C.flip}`,
                boxShadow: glow(C.flipDim, 14),
              }}
              aria-hidden="true"
            >
              <ShieldCheck size={22} strokeWidth={2} />
            </span>
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[14px] font-semibold" style={{ ...sans, color: C.fg }}>
                  {PROFIEL.trust}
                </span>
                <BadgeCheck
                  size={15}
                  strokeWidth={2}
                  style={{ color: C.flip }}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ ...sans, color: C.fgSoft }}>
                Je documenten zijn geverifieerd — opdrachtgevers zien meteen dat het klopt.
              </p>
            </div>
          </Panel>
        </div>

        <div>
          <div className="mb-3">
            <SectionTitle tone={C.amber}>Volgende stappen</SectionTitle>
          </div>
          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const tone = a.urgentie === "warning" ? C.amber : C.cyan;
              const dim = a.urgentie === "warning" ? C.amberDim : C.cyanDim;
              return (
                <Panel key={a.titel} className="p-4">
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-1 block h-2 w-2 shrink-0 rounded-full"
                      style={{ background: tone, boxShadow: glow(tone, 8) }}
                      aria-hidden="true"
                    />
                    <div>
                      <div
                        className="text-[12.5px] font-semibold leading-snug"
                        style={{ ...sans, color: C.fg }}
                      >
                        {a.titel}
                      </div>
                      <div
                        className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold"
                        style={{ ...sans, color: tone, background: dim }}
                      >
                        {a.cta}
                        <ArrowRight size={11} strokeWidth={2.4} aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </Panel>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function glowFilter(tone: string) {
  return `drop-shadow(0 0 5px ${tone})`;
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
        eyebrow="Marktplaats · negatief"
        title="Opdrachten in de donkere kamer"
        sub="We tonen eerlijk waarom een opdracht oplicht — en waar de belichting afwijkt."
      />

      <div
        className="mb-6 flex items-center gap-2 rounded-xl px-4 py-2.5"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <Search
          size={16}
          className="shrink-0"
          style={{ color: C.flip, filter: glowFilter(C.flip) }}
          aria-hidden="true"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent py-1 text-[14px] outline-none placeholder:opacity-50"
          style={{ ...sans, color: C.fg }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${RING}`}
            style={{ ...sans, color: C.flip, background: C.flipDim, border: `1px solid ${C.flip}` }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              background: C.flipDim,
              color: C.flip,
              border: `1px solid ${C.flip}`,
              boxShadow: glow(C.flipDim, 20),
            }}
            aria-hidden="true"
          >
            <Aperture size={28} strokeWidth={1.8} />
          </span>
          <h3 className="text-[19px] font-semibold" style={{ ...sans, color: C.fg }}>
            Niets belicht
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Geen opdracht past bij &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <button
            onClick={() => setQuery("")}
            className={`mt-1 rounded-full px-5 py-2 text-[13px] font-semibold ${RING}`}
            style={{ ...sans, color: C.bg, background: C.flip, boxShadow: glow(C.flipDim, 16) }}
          >
            Filter wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            const tone = o.match >= 90 ? C.flip : o.match >= 82 ? C.cyan : C.amber;
            return (
              <Panel
                key={o.id}
                className="flex h-full flex-col p-5 transition-transform hover:-translate-y-0.5"
              >
                <div
                  className="pointer-events-none absolute -left-8 -top-10 h-24 w-24 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${tone}, transparent 70%)`,
                    opacity: 0.14,
                  }}
                  aria-hidden="true"
                />
                <div className="relative flex items-start justify-between gap-3">
                  <MatchOrb value={o.match} size="sm" />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${RING}`}
                    style={{
                      background: isSaved ? C.flipDim : C.bg2,
                      color: isSaved ? C.flip : C.muted,
                      border: `1px solid ${isSaved ? C.flip : C.line}`,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <div className="relative mt-3 flex flex-1 flex-col">
                  <span className="text-[10px] tabular-nums" style={{ ...mono, color: C.faint }}>
                    {o.id}
                  </span>
                  <h3
                    className="mt-0.5 text-[16px] font-semibold leading-tight"
                    style={{ ...sans, color: C.fg }}
                  >
                    {o.titel}
                  </h3>
                  <div className="mt-0.5 text-[13px]" style={{ ...sans, color: C.muted }}>
                    {o.opdrachtgever}
                  </div>
                  <dl
                    className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]"
                    style={{ ...sans, color: C.fgSoft }}
                  >
                    <div className="flex items-center gap-1.5">
                      <MapPin
                        size={13}
                        strokeWidth={2}
                        style={{ color: C.faint }}
                        aria-hidden="true"
                      />
                      {o.plaats}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wallet
                        size={13}
                        strokeWidth={2}
                        style={{ color: C.faint }}
                        aria-hidden="true"
                      />
                      {o.tarief}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock
                        size={13}
                        strokeWidth={2}
                        style={{ color: C.faint }}
                        aria-hidden="true"
                      />
                      {o.uren}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar
                        size={13}
                        strokeWidth={2}
                        style={{ color: C.faint }}
                        aria-hidden="true"
                      />
                      {o.start}
                    </div>
                  </dl>
                  <button
                    onClick={() => onOpen(o)}
                    className={`group mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-semibold ${RING}`}
                    style={{ ...sans, color: C.bg, background: C.fg }}
                  >
                    Bekijk opdracht
                    <ArrowRight
                      size={14}
                      strokeWidth={2.4}
                      className="transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </button>
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
      <button
        onClick={onBack}
        className={`mb-5 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${RING}`}
        style={{ ...sans, color: C.fgSoft, background: C.panel, border: `1px solid ${C.line}` }}
      >
        <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
        Terug naar marktplaats
      </button>

      <Panel className="p-6">
        <div
          className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full"
          style={{
            background: `radial-gradient(circle, ${C.flip}, transparent 70%)`,
            opacity: 0.16,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <MatchOrb value={opdracht.match} />
            <div>
              <span className="text-[10px] tabular-nums" style={{ ...mono, color: C.faint }}>
                {opdracht.id}
              </span>
              <h2
                className="mt-0.5 text-[24px] font-semibold leading-tight tracking-tight"
                style={{ ...sans, color: C.fg }}
              >
                {opdracht.titel}
              </h2>
              <p className="mt-1 text-[14px]" style={{ ...sans, color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleSave(opdracht.id)}
            aria-pressed={isSaved}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold ${RING}`}
            style={{
              ...sans,
              color: isSaved ? C.flip : C.fgSoft,
              background: isSaved ? C.flipDim : C.bg2,
              border: `1px solid ${isSaved ? C.flip : C.line}`,
            }}
          >
            {isSaved ? (
              <BookmarkCheck size={14} strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <Bookmark size={14} strokeWidth={2.2} aria-hidden="true" />
            )}
            {isSaved ? "Bewaard" : "Bewaar"}
          </button>
        </div>

        <dl className="relative mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-xl p-3"
              style={{ background: C.bg2, border: `1px solid ${C.line}` }}
            >
              <m.Icon size={14} strokeWidth={2} style={{ color: C.cyan }} aria-hidden="true" />
              <dt
                className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...sans, color: C.muted }}
              >
                {m.label}
              </dt>
              <dd className="text-[14px] font-semibold" style={{ ...sans, color: C.fg }}>
                {m.value}
              </dd>
            </div>
          ))}
        </dl>
      </Panel>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="p-5">
          <div className="mb-3 inline-flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-lg"
              style={{ background: C.flipDim, color: C.flip, border: `1px solid ${C.flip}` }}
              aria-hidden="true"
            >
              <Plus size={13} strokeWidth={2.6} />
            </span>
            <span className="text-[14px] font-semibold" style={{ ...sans, color: C.fg }}>
              Waarom deze oplicht
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...sans, color: C.fgSoft }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.flip, filter: glowFilter(C.flip) }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-5">
          <div className="mb-3 inline-flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-lg"
              style={{ background: C.amberDim, color: C.amber, border: `1px solid ${C.amber}` }}
              aria-hidden="true"
            >
              <Minus size={13} strokeWidth={2.6} />
            </span>
            <span className="text-[14px] font-semibold" style={{ ...sans, color: C.fg }}>
              Even op letten
            </span>
          </div>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...sans, color: C.fgSoft }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.amber, filter: glowFilter(C.amber) }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setApplied((v) => !v)}
          aria-pressed={applied}
          className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold ${RING}`}
          style={{
            ...sans,
            color: C.bg,
            background: applied ? C.cyan : C.flip,
            boxShadow: glow(applied ? C.cyanDim : C.flipDim, 18),
          }}
        >
          {applied ? (
            <Check size={17} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </button>
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
        eyebrow="Verificatie · ontwikkeld"
        title="Documenten, uit de ontwikkelbak"
        sub="Elke status licht op met een eigen label én icoon — nooit alleen op kleur te herkennen."
      />

      <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const m = statusMeta(s);
          return (
            <div
              key={s}
              className="rounded-xl p-3"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <m.Icon
                size={16}
                strokeWidth={2.2}
                style={{ color: m.tone, filter: glowFilter(m.tone) }}
                aria-hidden="true"
              />
              <div className="mt-2 text-[12px] font-semibold" style={{ ...sans, color: C.fg }}>
                {m.label}
              </div>
            </div>
          );
        })}
      </div>

      <Panel className="mb-6 flex items-center gap-4 p-5">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: C.flipDim,
            color: C.flip,
            border: `1px solid ${C.flip}`,
            boxShadow: glow(C.flipDim, 14),
          }}
          aria-hidden="true"
        >
          <ShieldCheck size={24} strokeWidth={2} />
        </span>
        <div>
          <div className="text-[15px] font-semibold" style={{ ...sans, color: C.fg }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            const m = statusMeta(c.status);
            return (
              <Panel key={c.naam} className="flex items-center gap-3 p-4">
                <span
                  className="absolute inset-y-0 left-0 w-[3px]"
                  style={{ background: m.tone, boxShadow: glow(m.tone, 8) }}
                  aria-hidden="true"
                />
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${RING}`}
                  style={{
                    border: `1.5px solid ${done ? C.flip : C.line}`,
                    background: done ? C.flip : "transparent",
                    color: C.bg,
                  }}
                >
                  {done && <Check size={15} strokeWidth={2.6} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ ...sans, color: C.fg }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...sans, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <StatusTag status={c.status} />
              </Panel>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle tone={C.cyan}>Documenten</SectionTitle>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${RING}`}
              style={{ background: C.panel, color: C.cyan, border: `1px solid ${C.line}` }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? C.bg : C.muted,
                  background: feedState === s ? C.cyan : C.panel,
                  border: `1px solid ${feedState === s ? C.cyan : C.line}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <li
                  key={i}
                  className="rounded-xl p-3.5"
                  style={{ background: C.panel, border: `1px solid ${C.line}` }}
                >
                  <div
                    className="h-3 w-2/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                  <div
                    className="mt-2 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </li>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Panel className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  background: C.redDim,
                  color: C.red,
                  border: `1px solid ${C.red}`,
                  boxShadow: glow(C.redDim, 14),
                }}
                aria-hidden="true"
              >
                <CircleAlert size={22} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-semibold" style={{ ...sans, color: C.fg }}>
                Belichting mislukt
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <button
                onClick={() => setFeedState("ok")}
                className={`mt-1 rounded-full px-4 py-2 text-[12px] font-semibold ${RING}`}
                style={{ ...sans, color: C.bg, background: C.flip }}
              >
                Opnieuw proberen
              </button>
            </Panel>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => {
                const m = statusMeta(d.status);
                return (
                  <Panel key={d.naam} className="flex items-center gap-3 p-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold"
                      style={{
                        ...mono,
                        background: m.dim,
                        color: m.tone,
                        border: `1px solid ${m.tone}`,
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
                    <StatusTag status={d.status} />
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
      <ScreenHead eyebrow="Acties · overbelicht" title="Wat vandaag oplicht" />

      {openCount === 0 ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              background: C.flipDim,
              color: C.flip,
              border: `1px solid ${C.flip}`,
              boxShadow: glow(C.flipDim, 20),
            }}
            aria-hidden="true"
          >
            <Check size={30} strokeWidth={2.4} />
          </span>
          <h3 className="text-[19px] font-semibold" style={{ ...sans, color: C.fg }}>
            Donkere kamer opgeruimd
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Geen openstaande punten meer vandaag. Alles is ontwikkeld.
          </p>
        </Panel>
      ) : (
        <>
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5"
            style={{ background: C.amberDim, border: `1px solid ${C.amber}` }}
          >
            <span
              className="text-[13px] font-bold tabular-nums"
              style={{ ...mono, color: C.amber, textShadow: glow(C.amber, 6) }}
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ ...sans, color: C.amber }}>
              {openCount === 1 ? "punt" : "punten"} open
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              const tone = warn ? C.amber : C.cyan;
              const dim = warn ? C.amberDim : C.cyanDim;
              return (
                <Panel key={a.titel} className="flex items-start gap-4 p-5">
                  <span
                    className="absolute inset-y-0 left-0 w-[3px]"
                    style={{
                      background: isDone ? C.flip : tone,
                      boxShadow: glow(isDone ? C.flip : tone, 8),
                    }}
                    aria-hidden="true"
                  />
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${RING}`}
                    style={{
                      border: `1.5px solid ${isDone ? C.flip : C.line}`,
                      background: isDone ? C.flip : "transparent",
                      color: C.bg,
                    }}
                  >
                    {isDone && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{ ...sans, color: tone, background: dim }}
                    >
                      {warn ? "Urgent" : "Info"}
                    </span>
                    <div
                      className="mt-1.5 text-[15px] font-semibold leading-snug"
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
                        className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold"
                        style={{ ...sans, color: tone }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </Panel>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function Facturen() {
  const statusMark = (status: string): { Icon: LucideIcon; tone: string; dim: string } =>
    status === "Betaald"
      ? { Icon: Check, tone: C.flip, dim: C.flipDim }
      : status === "Openstaand"
        ? { Icon: Clock, tone: C.amber, dim: C.amberDim }
        : { Icon: FileText, tone: C.muted, dim: C.lineSoft };
  return (
    <div>
      <ScreenHead
        eyebrow="Facturen · positief"
        title="Je facturen"
        sub="Overzichtelijk en zonder gedoe — je weet meteen wat openstaat."
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", tone: C.flip },
          { label: "Openstaand", value: "€ 1.350", tone: C.amber },
          { label: "Concept", value: "€ 880", tone: C.muted },
        ].map((s) => (
          <Panel key={s.label} className="p-4">
            <div
              className="text-[10.5px] font-medium uppercase tracking-[0.1em]"
              style={{ ...sans, color: C.muted }}
            >
              {s.label}
            </div>
            <div className="mt-1">
              <FlipFigure size={22} tone={s.tone}>
                {s.value}
              </FlipFigure>
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="p-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ ...mono, color: C.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const m = statusMark(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-3 py-3 text-[12.5px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.fg }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3 text-[13px]" style={{ ...sans, color: C.fg }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-3 text-[12.5px] tabular-nums"
                      style={{ ...mono, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3 text-[13px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.fg }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5 text-[11px] font-semibold"
                        style={{
                          ...sans,
                          color: m.tone,
                          background: m.dim,
                          border: `1px solid ${m.tone}`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" />
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept275() {
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
      style={{ ...sans, color: C.fg, background: C.bg }}
    >
      {/* dramatic light source */}
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full"
        style={{ background: `radial-gradient(circle, ${C.flip}, transparent 70%)`, opacity: 0.1 }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full"
        style={{ background: `radial-gradient(circle, ${C.cyan}, transparent 70%)`, opacity: 0.08 }}
        aria-hidden="true"
      />
      <Grain />

      <div className="relative mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                background: C.flipDim,
                color: C.flip,
                border: `1px solid ${C.flip}`,
                boxShadow: glow(C.flipDim, 16),
              }}
              aria-hidden="true"
            >
              <Aperture size={19} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[18px] font-semibold tracking-tight"
                style={{ ...sans, color: C.fg }}
              >
                Solarisatie
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{ ...mono, color: C.muted }}
              >
                ZZP platform · donkere kamer
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
                style={{ ...sans, color: C.flip }}
              >
                <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-[13px] font-bold"
              style={{
                ...mono,
                background: C.flipDim,
                color: C.flip,
                border: `1px solid ${C.flip}`,
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
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: on ? C.bg : C.fgSoft,
                  background: on ? C.flip : C.panel,
                  border: `1px solid ${on ? C.flip : C.line}`,
                  boxShadow: on ? glow(C.flipDim, 14) : "none",
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
          className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[11px]"
          style={{ ...mono, borderColor: C.line, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Aperture size={12} strokeWidth={2} style={{ color: C.flip }} aria-hidden="true" />
            {SCREENS.length} schermen · solarisatie v275
          </span>
          <span>Licht dat omslaat</span>
        </footer>
      </div>
    </div>
  );
}
