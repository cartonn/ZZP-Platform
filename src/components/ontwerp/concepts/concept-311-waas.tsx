"use client";

// Concept 311 — "Waas" · progressive blur & scherptediepte.
// Signature: gelaagde, translucente glasvlakken op een koele mesh-achtergrond; de voorgrond
// kraakhelder, de diepere lagen zacht vervaagd (backdrop-blur). Hiërarchie via scherptediepte
// i.p.v. schaduw — rustig, verfijnd, koel. Fonts: kop --font-lab-spline-mono · tekst
// --font-lab-inter · cijfers --font-lab-mono.

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
  Layers,
  Sparkles,
  Bell,
  Mail,
  FileText,
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

// Cool, glassy palette — the focal plane is crisp ink; depth reads as haze, not shadow.
const C = {
  ink: "#141a2b",
  fg: "#323a52",
  fgSoft: "#5b6482",
  muted: "#818aa8",
  faint: "#a7aec6",
  line: "rgba(20,26,43,0.10)",
  lineSoft: "rgba(20,26,43,0.06)",
  glass: "rgba(255,255,255,0.62)",
  glassDeep: "rgba(255,255,255,0.80)",
  glassSoft: "rgba(255,255,255,0.40)",
  accent: "#4f66e6",
  accentSoft: "#6f83f0",
  accentDeep: "#3a4fc4",
  teal: "#1f9ea6",
  violet: "#8b6ff0",
  green: "#1f9d63",
  amber: "#c98a12",
  red: "#d94a52",
  citrus: "#d98a1f",
};

const display = { fontFamily: "var(--font-lab-spline-mono), ui-monospace, monospace" };
const sans = { fontFamily: "var(--font-lab-inter), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f66e6] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

// ---- Depth-of-field background ---------------------------------------------
// A stack of blurred colour fields behind everything — the "waas" (haze). Purely decorative.
function HazeField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute -left-24 -top-24 h-80 w-80 rounded-full"
        style={{
          background: "radial-gradient(circle, #6f83f055, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute right-[-6rem] top-16 h-96 w-96 rounded-full"
        style={{
          background: "radial-gradient(circle, #8b6ff044, transparent 70%)",
          filter: "blur(52px)",
        }}
      />
      <div
        className="absolute bottom-[-8rem] left-1/3 h-96 w-96 rounded-full"
        style={{
          background: "radial-gradient(circle, #1f9ea63a, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(238,241,248,0.4) 0%, rgba(232,236,245,0.7) 100%)",
        }}
      />
    </div>
  );
}

// A glass plane. `depth` pushes the plane back into the haze: more translucent, blurrier, softer.
function Glass({
  children,
  className,
  style,
  depth = 0,
  onMouseEnter,
  onMouseLeave,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  depth?: 0 | 1 | 2;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const bg = depth === 0 ? C.glassDeep : depth === 1 ? C.glass : C.glassSoft;
  const blur = depth === 0 ? 18 : depth === 1 ? 12 : 8;
  return (
    <div
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "relative",
        background: bg,
        backdropFilter: `blur(${blur}px) saturate(150%)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(150%)`,
        border: `1px solid ${depth === 0 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.5)"}`,
        borderRadius: 18,
        boxShadow:
          depth === 0
            ? "0 1px 0 rgba(255,255,255,0.6) inset, 0 10px 40px -20px rgba(20,26,43,0.35)"
            : "0 1px 0 rgba(255,255,255,0.4) inset",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Kicker({ children, tone = "accent" }: { children: ReactNode; tone?: "accent" | "muted" }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-[0.24em]"
      style={{ ...mono, color: tone === "accent" ? C.accent : C.muted }}
    >
      {children}
    </span>
  );
}

// Smooth glassy sparkline — a soft line with a haze-fill beneath.
function Spark({ spark, w = 108, h = 30 }: { spark: number[]; w?: number; h?: number }) {
  const min = Math.min(...spark);
  const max = Math.max(...spark);
  const span = max - min || 1;
  const pts = spark.map((v, i) => {
    const x = (i / (spark.length - 1)) * w;
    const y = h - 3 - ((v - min) / span) * (h - 6);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1]!;
  const gid = `wg-${spark.join("-")}`;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.28" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={C.accent}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r={2.6} fill={C.accent} />
      <circle cx={last[0]} cy={last[1]} r={5} fill={C.accent} opacity={0.18} />
    </svg>
  );
}

// A glassy circular match gauge with a gradient stroke.
function MatchRing({ value, size = 96, label }: { value: number; size?: number; label?: string }) {
  const stroke = Math.max(5, size * 0.07);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  const gid = `mr-${value}-${size}`;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={C.accentSoft} />
            <stop offset="55%" stopColor={C.accent} />
            <stop offset="100%" stopColor={C.violet} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.lineSoft}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold tabular-nums leading-none"
          style={{ ...mono, color: C.ink, fontSize: size > 84 ? 22 : size > 60 ? 17 : 13 }}
        >
          {value}
        </span>
        {label && (
          <span
            className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.18em]"
            style={{ ...mono, color: C.accent }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; color: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, color: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Hourglass, color: C.amber };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, color: C.citrus };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.red };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, color } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...sans, color, background: `${color}18`, border: `1px solid ${color}44` }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

// Frosted primary button — glass with an accent wash that brightens on hover.
function GlassButton({
  children,
  onClick,
  variant = "primary",
  className,
  ariaLabel,
  ariaPressed,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  active?: boolean;
}) {
  const [hot, setHot] = useState(false);
  const primary = variant === "primary";
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: primary ? "#ffffff" : on ? C.accentDeep : C.fg,
        background: primary
          ? `linear-gradient(135deg, ${hot ? C.accentSoft : C.accent}, ${C.accentDeep})`
          : on
            ? "rgba(255,255,255,0.85)"
            : "rgba(255,255,255,0.5)",
        border: primary
          ? "1px solid rgba(255,255,255,0.4)"
          : `1px solid ${on ? `${C.accent}55` : C.line}`,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        transform: hot ? "translateY(-1px)" : "none",
        boxShadow: primary
          ? hot
            ? `0 8px 22px -8px ${C.accent}aa`
            : `0 4px 14px -8px ${C.accent}88`
          : "none",
      }}
    >
      {children}
    </button>
  );
}

function ScreenHead({ title, sub, kicker }: { title: string; sub?: string; kicker: string }) {
  return (
    <div className="mb-7">
      <div className="mb-2 flex items-center gap-2.5">
        <Kicker>{kicker}</Kicker>
        <div className="h-px flex-1" style={{ background: C.line }} aria-hidden="true" />
      </div>
      <h1
        className="text-[28px] font-semibold leading-[1.05] tracking-tight sm:text-[36px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed"
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
      {/* Focal hero — crisp foreground plane floating over the haze. */}
      <Glass className="mb-7 overflow-hidden p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles
                size={13}
                strokeWidth={2.2}
                style={{ color: C.accent }}
                aria-hidden="true"
              />
              <Kicker>
                {PROFIEL.plaats} · {PROFIEL.rol}
              </Kicker>
            </div>
            <h1
              className="text-[34px] font-semibold leading-[0.98] tracking-tight sm:text-[44px]"
              style={{ ...display, color: C.ink }}
            >
              Goedemorgen,
              <br />
              {voornaam}.
            </h1>
            <p
              className="mt-4 max-w-md text-[13.5px] leading-relaxed"
              style={{ ...sans, color: C.fgSoft }}
            >
              Alleen wat scherp in beeld hoort staat op de voorgrond. De rest vervaagt in de
              achtergrond tot je het nodig hebt.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                style={{
                  ...sans,
                  color: C.green,
                  background: `${C.green}15`,
                  border: `1px solid ${C.green}33`,
                }}
              >
                <ShieldCheck size={14} strokeWidth={2.2} aria-hidden="true" />
                {PROFIEL.trust}
              </span>
            </div>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group flex flex-col items-center gap-2 rounded-3xl p-2 transition-transform hover:-translate-y-0.5 ${RING}`}
            aria-label={`Open beste match: ${top.titel}`}
          >
            <MatchRing value={top.match} size={132} label="beste match" />
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.accent }}
            >
              Bekijken
              <ArrowRight
                size={11}
                strokeWidth={2.6}
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </button>
        </div>
      </Glass>

      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Glass key={k.label} depth={1} className="p-4">
            <div className="flex items-start justify-between">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.muted }}
              >
                {k.label}
              </span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
                style={{
                  ...mono,
                  color: k.up ? C.green : C.citrus,
                  background: k.up ? `${C.green}14` : `${C.citrus}14`,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[24px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark spark={k.spark} />
            </div>
          </Glass>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Scherp in beeld · beste matches</Kicker>
          </div>
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o)}
                className={`group block w-full rounded-2xl text-left ${RING}`}
              >
                <Glass
                  depth={1}
                  className="flex items-center gap-4 p-4 transition-all group-hover:-translate-y-0.5"
                >
                  <MatchRing value={o.match} size={68} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                      style={{ ...mono, color: C.muted }}
                    >
                      {o.id}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[15px] font-semibold leading-tight"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div className="mt-0.5 text-[12.5px]" style={{ ...sans, color: C.fgSoft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    className="shrink-0 transition-transform group-hover:translate-x-1"
                    style={{ color: C.accent }}
                    aria-hidden="true"
                  />
                </Glass>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-3">
              <Kicker tone="muted">Volgende actie</Kicker>
            </div>
            <Glass className="p-4">
              {ACTIES.slice(0, 1).map((a) => (
                <div key={a.titel}>
                  <div
                    className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                    style={{ ...mono, color: C.citrus, background: `${C.citrus}16` }}
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" />
                    Aandacht
                  </div>
                  <div
                    className="text-[14px] font-semibold leading-snug"
                    style={{ ...sans, color: C.ink }}
                  >
                    {a.titel}
                  </div>
                  <p
                    className="mt-1.5 text-[12.5px] leading-relaxed"
                    style={{ ...sans, color: C.fgSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <GlassButton>
                      {a.cta}
                      <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                    </GlassButton>
                  </div>
                </div>
              ))}
            </Glass>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <Mail size={13} strokeWidth={2.2} style={{ color: C.accent }} aria-hidden="true" />
              <Kicker tone="muted">Berichten</Kicker>
            </div>
            <Glass
              depth={1}
              className="divide-y overflow-hidden"
              style={{ ["--dv" as string]: C.lineSoft }}
            >
              {BERICHTEN.map((b) => (
                <div
                  key={b.van}
                  className="flex items-start gap-3 p-3.5"
                  style={{ borderColor: C.lineSoft }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                    style={{
                      ...mono,
                      color: "#fff",
                      background: `linear-gradient(135deg, ${C.accentSoft}, ${C.violet})`,
                    }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="truncate text-[12.5px] font-semibold"
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
                    <p className="mt-0.5 truncate text-[12px]" style={{ ...sans, color: C.fgSoft }}>
                      {b.preview}
                    </p>
                  </div>
                  {b.ongelezen && (
                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: C.accent }}
                      aria-label="ongelezen"
                    />
                  )}
                </div>
              ))}
            </Glass>
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
        kicker="Marktplaats · gefilterd op scherpte"
        title="Opdrachten in focus"
        sub="Elke opdracht komt scherp naar voren met een verklaarbare match — de rest blijft rustig op de achtergrond."
      />

      <Glass className="mb-6 flex flex-wrap items-center gap-3 px-4 py-3">
        <Search size={16} className="shrink-0" style={{ color: C.accent }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="min-w-[8rem] flex-1 bg-transparent text-[14px] outline-none placeholder:opacity-50"
          style={{ ...sans, color: C.ink }}
        />
        <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}
        </span>
        {query && (
          <GlassButton variant="ghost" onClick={() => setQuery("")}>
            Wissen
          </GlassButton>
        )}
      </Glass>

      {filtered.length === 0 ? (
        <Glass className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Layers size={30} strokeWidth={1.6} style={{ color: C.accent }} aria-hidden="true" />
          <h3
            className="text-[20px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Niets in beeld
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Geen opdracht voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="mt-1">
            <GlassButton onClick={() => setQuery("")}>Filter wissen</GlassButton>
          </div>
        </Glass>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <Glass
                key={o.id}
                depth={1}
                className="flex flex-col p-5 transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-4">
                  <MatchRing value={o.match} size={80} label="match" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Kicker>{o.id}</Kicker>
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                        style={{ ...mono, color: C.accentDeep, background: `${C.accent}14` }}
                      >
                        {o.tarief}
                      </span>
                    </div>
                    <h3
                      className="text-[17px] font-semibold leading-tight"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
                      {o.opdrachtgever}
                    </div>
                  </div>
                </div>
                <dl
                  className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12px]"
                  style={{ ...sans, color: C.fgSoft }}
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
                        style={{ color: C.accent }}
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
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{
                        ...sans,
                        color: C.fg,
                        background: "rgba(255,255,255,0.55)",
                        border: `1px solid ${C.line}`,
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
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${RING}`}
                    style={{
                      color: isSaved ? "#fff" : C.fg,
                      background: isSaved ? C.accent : "rgba(255,255,255,0.5)",
                      border: `1px solid ${isSaved ? C.accent : C.line}`,
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
                    )}
                  </button>
                  <GlassButton onClick={() => onOpen(o)}>
                    Bekijk
                    <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                  </GlassButton>
                </div>
              </Glass>
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
        <GlassButton variant="ghost" onClick={onBack} ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
          Terug
        </GlassButton>
      </div>

      <Glass className="mb-6 overflow-hidden p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Kicker>{opdracht.id}</Kicker>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                style={{ ...mono, color: C.accentDeep, background: `${C.accent}14` }}
              >
                {opdracht.tarief}
              </span>
            </div>
            <h2
              className="text-[28px] font-semibold leading-[1.03] tracking-tight sm:text-[36px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h2>
            <div className="mt-2 text-[14px]" style={{ ...sans, color: C.fgSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <MatchRing value={opdracht.match} size={116} label="match" />
            <GlassButton
              variant="ghost"
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
            </GlassButton>
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
              className="rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.5)", border: `1px solid ${C.line}` }}
            >
              <m.Icon size={15} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
              <div
                className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.13em]"
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
      </Glass>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Glass depth={1} className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: `${C.green}18` }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={3} style={{ color: C.green }} />
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
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Glass>
        <Glass depth={1} className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: `${C.citrus}18` }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={3} style={{ color: C.citrus }} />
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
                  style={{ color: C.citrus }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Glass>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <GlassButton
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
        </GlassButton>
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
  feedState,
  setFeedState,
}: {
  feedState: "ok" | "loading" | "error";
  setFeedState: (s: "ok" | "loading" | "error") => void;
}) {
  return (
    <div>
      <ScreenHead
        kicker="Verificatie · vertrouwenslagen"
        title="Certificaten & documenten"
        sub="Elk bewijsstuk krijgt een status met label én icoon — nooit op kleur alleen. Verlopende stukken komen naar voren."
      />

      <Glass className="mb-6 flex items-start gap-4 p-5">
        <ShieldCheck
          size={24}
          strokeWidth={2.2}
          style={{ color: C.green }}
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        />
        <div>
          <div className="text-[15px] font-semibold" style={{ ...sans, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-1 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Glass>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Certificaten</Kicker>
          </div>
          <div className="space-y-3">
            {CREDENTIALS.map((c) => {
              const expiring = c.status === "EXPIRING";
              return (
                <Glass
                  key={c.naam}
                  depth={1}
                  className="flex items-center gap-4 p-4"
                  style={expiring ? { border: `1px solid ${C.citrus}55` } : undefined}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "rgba(255,255,255,0.6)", border: `1px solid ${C.line}` }}
                    aria-hidden="true"
                  >
                    <FileText size={16} strokeWidth={2} style={{ color: C.accent }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
                      {c.naam}
                    </div>
                    <div className="text-[12px]" style={{ ...sans, color: C.muted }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusPill status={c.status} />
                </Glass>
              );
            })}
          </div>

          <Glass
            className="mt-4 flex items-start gap-3 p-4"
            style={{ border: `1px solid ${C.citrus}55`, background: `${C.citrus}10` }}
          >
            <TriangleAlert
              size={18}
              strokeWidth={2.2}
              style={{ color: C.citrus }}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <div className="text-[13px] font-semibold" style={{ ...sans, color: C.ink }}>
                VOG verloopt over 23 dagen
              </div>
              <p className="mt-1 text-[12.5px]" style={{ ...sans, color: C.fgSoft }}>
                Vraag op tijd een nieuwe Verklaring Omtrent Gedrag aan om verifieerbaar te blijven.
              </p>
              <div className="mt-3">
                <GlassButton variant="ghost">
                  VOG vernieuwen
                  <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                </GlassButton>
              </div>
            </div>
          </Glass>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Kicker tone="muted">Documenten</Kicker>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-7 w-7 items-center justify-center rounded-full ${RING}`}
              style={{
                color: C.fg,
                background: "rgba(255,255,255,0.5)",
                border: `1px solid ${C.line}`,
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
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? "#fff" : C.fg,
                  background: feedState === s ? C.accent : "rgba(255,255,255,0.5)",
                  border: `1px solid ${feedState === s ? C.accent : C.line}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <div className="space-y-3" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Glass key={i} depth={1} className="p-4">
                  <div
                    className="h-3 w-2/3 animate-pulse rounded-full"
                    style={{ background: C.lineSoft }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded-full"
                    style={{ background: C.lineSoft }}
                  />
                </Glass>
              ))}
            </div>
          )}

          {feedState === "error" && (
            <Glass
              className="flex flex-col items-center gap-2 px-4 py-10 text-center"
              style={{ border: `1px solid ${C.red}55` }}
            >
              <XCircle size={26} strokeWidth={2} style={{ color: C.red }} aria-hidden="true" />
              <div className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
                Kluis onbereikbaar
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.fgSoft }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <GlassButton onClick={() => setFeedState("ok")}>Opnieuw proberen</GlassButton>
              </div>
            </Glass>
          )}

          {feedState === "ok" && (
            <div className="space-y-3">
              {DOCUMENTEN.map((d) => (
                <Glass key={d.naam} depth={1} className="flex items-center gap-3 p-3.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[9px] font-semibold"
                    style={{ ...mono, color: "#fff", background: C.ink }}
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
                </Glass>
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
        sub="De belangrijkste acties komen scherp naar voren; afgeronde stappen vervagen naar de achtergrond."
      />

      {openCount === 0 ? (
        <Glass className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Check size={30} strokeWidth={2.4} style={{ color: C.green }} aria-hidden="true" />
          <h3
            className="text-[20px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Alles afgerond
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Geen openstaande acties meer. Rustig in beeld.
          </p>
        </Glass>
      ) : (
        <>
          <div className="mb-6 flex items-baseline gap-3">
            <span
              className="text-[38px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.accent }}
            >
              {String(openCount).padStart(2, "0")}
            </span>
            <span
              className="text-[12px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.muted }}
            >
              {openCount === 1 ? "openstaande actie" : "openstaande acties"}
            </span>
          </div>

          <div className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <Glass
                  key={a.titel}
                  depth={isDone ? 2 : 1}
                  className="flex items-start gap-4 p-5"
                  style={{ opacity: isDone ? 0.6 : 1 }}
                >
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${RING}`}
                    style={{
                      border: `1px solid ${isDone ? C.green : C.line}`,
                      background: isDone ? C.green : "rgba(255,255,255,0.5)",
                      color: "#fff",
                    }}
                  >
                    {isDone && <Check size={13} strokeWidth={2.8} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                        style={{
                          ...mono,
                          color: warn ? C.citrus : C.accent,
                          background: warn ? `${C.citrus}16` : `${C.accent}14`,
                        }}
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Bell size={10} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {warn ? "Aandacht" : "Info"}
                      </span>
                    </div>
                    <div
                      className="mt-1.5 text-[15px] font-semibold leading-snug"
                      style={{
                        ...sans,
                        color: C.ink,
                        textDecoration: isDone ? "line-through" : "none",
                      }}
                    >
                      {a.titel}
                    </div>
                    <p className="mt-1 text-[12.5px]" style={{ ...sans, color: C.fgSoft }}>
                      {a.detail}
                    </p>
                    {!isDone && (
                      <span
                        className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold"
                        style={{ ...sans, color: warn ? C.citrus : C.accent }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </Glass>
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
    status === "Openstaand" ? C.citrus : status === "Concept" ? C.muted : C.green;
  return (
    <div>
      <ScreenHead
        kicker="Facturen · helder overzicht"
        title="Facturen"
        sub="Overzichtelijk en zonder gedoe — je weet altijd waar je aan toe bent."
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", color: C.green },
          { label: "Openstaand", value: "€ 1.350", color: C.citrus },
          { label: "Concept", value: "€ 880", color: C.accent },
        ].map((s) => (
          <Glass key={s.label} depth={1} className="p-5">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
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
          </Glass>
        ))}
      </div>

      <Glass className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.13em]"
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
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.5)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td
                    className="px-4 py-4 text-[12.5px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.accent }}
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
                        className="h-2 w-2 rounded-full"
                        style={{ background: statusColor(f.status) }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: `1px solid ${C.line}` }}>
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
      </Glass>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept311() {
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
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...sans, color: C.fg, background: "#eef1f8" }}
    >
      <HazeField />
      <div className="relative mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${C.accentSoft}, ${C.violet})`,
                border: "1px solid rgba(255,255,255,0.5)",
              }}
              aria-hidden="true"
            >
              <Layers size={20} strokeWidth={2.2} style={{ color: "#fff" }} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[19px] font-semibold tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Waas
              </div>
              <div
                className="text-[9px] font-semibold uppercase tracking-[0.28em]"
                style={{ ...mono, color: C.accent }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              className={`relative flex h-10 w-10 items-center justify-center rounded-full ${RING}`}
              style={{
                background: "rgba(255,255,255,0.55)",
                border: `1px solid ${C.line}`,
                backdropFilter: "blur(10px)",
              }}
              aria-label="Meldingen"
            >
              <Bell size={16} strokeWidth={2} style={{ color: C.fg }} aria-hidden="true" />
              <span
                className="absolute right-2 top-2 h-2 w-2 rounded-full"
                style={{ background: C.accent }}
                aria-hidden="true"
              />
            </button>
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
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold"
              style={{
                ...display,
                color: "#fff",
                background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        {/* Glassy tab strip — floating focal plane over the haze. */}
        <nav className="mb-8 overflow-x-auto" aria-label="Hoofdnavigatie">
          <Glass className="flex items-stretch gap-1 p-1.5" style={{ borderRadius: 999 }}>
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-semibold transition-all ${RING}`}
                  style={{
                    ...sans,
                    color: on ? "#fff" : C.fgSoft,
                    background: on
                      ? `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`
                      : "transparent",
                    boxShadow: on ? `0 4px 14px -8px ${C.accent}aa` : "none",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </Glass>
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

        <div className="mt-9 h-px w-full" style={{ background: C.line }} aria-hidden="true" />
        <footer
          className="flex flex-wrap items-center justify-between gap-2 pt-4 text-[10.5px]"
          style={{ ...mono, color: C.muted }}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: C.accent }}
              aria-hidden="true"
            />
            {SCREENS.length} schermen · waas v311
          </span>
          <span className="hidden items-center gap-2 sm:inline-flex">
            {NAV.slice(0, 4).map((n) => (
              <span key={n} className="inline-flex items-center gap-1">
                {n}
                <ChevronRight
                  size={10}
                  strokeWidth={2}
                  style={{ color: C.faint }}
                  aria-hidden="true"
                />
              </span>
            ))}
          </span>
          <span className="uppercase tracking-[0.14em]">Scherptediepte · glas · haze</span>
        </footer>
      </div>
    </div>
  );
}
