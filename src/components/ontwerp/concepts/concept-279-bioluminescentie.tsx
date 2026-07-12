"use client";

// Concept 279 — "Bioluminescentie" · Diepdonkere deepzee met zacht gloeiende bio-accenten (dark).
// Signature: een bijna-zwarte diepzee-achtergrond waarin interactieve elementen zacht oplichten.
// Glow/bloom via box-shadow + radiale gradients in bio-groen/cyaan/aqua, organische ronde vormen,
// belangrijke elementen "ademen" (subtiele pulse), en de gloed volgt de hover. Rustgevend-mysterieus
// maar helder leesbaar — hoog tekstcontrast, geen felle neon-drukte. Elke status krijgt een eigen
// gloed + label + icoon. Fonts: --font-lab-sora (display) + --font-lab-spline-mono (cijfers/meta).

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
  Waves,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Hourglass,
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

// Deep-sea palette. Near-black backgrounds; bio accents glow softly. Text stays high-contrast.
const C = {
  abyss: "#03070b",
  deep: "#06121a",
  deep2: "#0a1a24",
  raised: "#0d222e",
  line: "rgba(94,242,176,0.16)",
  lineSoft: "rgba(94,242,176,0.08)",
  fg: "#e9fff5",
  fgSoft: "#c1e3d6",
  muted: "#88ab9e",
  faint: "#5f8175",
  bio: "#5ef2b0",
  bioDeep: "#25cb8c",
  cyan: "#45e6df",
  aqua: "#57c4ff",
  amber: "#ffd166",
  coral: "#ff9179",
};

const display = { fontFamily: "var(--font-lab-sora)" };
const mono = { fontFamily: "var(--font-lab-spline-mono)" };

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

// Each screen carries a bio-tint so the glow shifts hue per section.
const SCREEN_TINT: Record<ScreenKey, string> = {
  dashboard: C.bio,
  marktplaats: C.cyan,
  opdracht: C.aqua,
  verificatie: C.bio,
  acties: C.amber,
  facturen: C.cyan,
  documenten: C.aqua,
  berichten: C.cyan,
};

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5ef2b0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#03070b]";

// Convert a hex accent to an rgba glow string.
function glow(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ---- Primitives -------------------------------------------------------------

function panelStyle(): CSSProperties {
  return {
    background: `linear-gradient(180deg, ${C.deep2} 0%, ${C.deep} 100%)`,
    border: `1px solid ${C.line}`,
    borderRadius: 18,
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

// A soft glowing orb that "breathes" — the core signature of the deep-sea look.
function GlowOrb({
  tint,
  size = 120,
  className,
  style,
}: {
  tint: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={`bio-breathe pointer-events-none absolute rounded-full blur-2xl ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 50% 50%, ${glow(tint, 0.55)} 0%, ${glow(tint, 0.14)} 45%, transparent 72%)`,
        ...style,
      }}
    />
  );
}

// Verification status vocabulary — label + icon + its own bioluminescent hue.
function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tint: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, tint: C.bio };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Hourglass, tint: C.aqua };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, tint: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tint: C.coral };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, tint } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-3 text-[11px] font-semibold"
      style={{
        ...display,
        color: tint,
        background: glow(tint, 0.1),
        border: `1px solid ${glow(tint, 0.32)}`,
        boxShadow: `0 0 14px ${glow(tint, 0.18)}, inset 0 0 10px ${glow(tint, 0.08)}`,
      }}
    >
      <span
        className="flex h-4 w-4 items-center justify-center rounded-full"
        style={{ background: glow(tint, 0.22) }}
        aria-hidden="true"
      >
        <Icon size={11} strokeWidth={2.4} color={tint} />
      </span>
      {label}
    </span>
  );
}

function MatchOrb({ value, size = 56 }: { value: number; size?: number }) {
  const tint = value >= 90 ? C.bio : value >= 82 ? C.cyan : C.aqua;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`Match ${value} procent`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={glow(tint, 0.14)}
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tint}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter: `drop-shadow(0 0 5px ${glow(tint, 0.7)})` }}
        />
      </svg>
      <span
        className="absolute inset-0 flex flex-col items-center justify-center leading-none"
        style={{ ...mono }}
      >
        <span
          className="text-[15px] font-semibold tabular-nums"
          style={{ color: tint, textShadow: `0 0 10px ${glow(tint, 0.6)}` }}
        >
          {value}
        </span>
        <span className="mt-0.5 text-[7px] uppercase tracking-[0.16em]" style={{ color: C.faint }}>
          match
        </span>
      </span>
    </span>
  );
}

function Sparkline({ data, tint, height = 34 }: { data: number[]; tint: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 66 - 17;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const gid = `spk-${tint.replace("#", "")}`;
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full overflow-visible"
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tint} stopOpacity={0.28} />
          <stop offset="100%" stopColor={tint} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,100 ${line} 100,100`} fill={`url(#${gid})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tint}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ filter: `drop-shadow(0 0 3px ${glow(tint, 0.6)})` }}
      />
      {last && (
        <circle
          cx={last[0]}
          cy={last[1]}
          r={2.4}
          fill={tint}
          vectorEffect="non-scaling-stroke"
          style={{ filter: `drop-shadow(0 0 4px ${glow(tint, 0.9)})` }}
        />
      )}
    </svg>
  );
}

// Glowing button whose bloom intensifies on hover/focus.
function GlowButton({
  children,
  onClick,
  tint = C.bio,
  className,
  ariaLabel,
  ariaPressed,
}: {
  children: ReactNode;
  onClick?: () => void;
  tint?: string;
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
        ...display,
        color: C.abyss,
        background: `linear-gradient(135deg, ${tint} 0%, ${C.bioDeep} 100%)`,
        boxShadow: hot
          ? `0 0 26px ${glow(tint, 0.55)}, 0 0 8px ${glow(tint, 0.4)}`
          : `0 0 14px ${glow(tint, 0.28)}`,
        transform: hot ? "translateY(-1px)" : "none",
      }}
    >
      {children}
    </button>
  );
}

// A quiet, outline-style secondary button that lights up on interaction.
function GhostButton({
  children,
  onClick,
  tint = C.bio,
  className,
  ariaLabel,
  ariaPressed,
}: {
  children: ReactNode;
  onClick?: () => void;
  tint?: string;
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-300 hover:-translate-y-px ${RING} ${className ?? ""}`}
      style={{
        ...display,
        color: tint,
        background: glow(tint, 0.06),
        border: `1px solid ${glow(tint, 0.28)}`,
      }}
    >
      {children}
    </button>
  );
}

function ScreenHead({
  screenKey,
  eyebrow,
  title,
  sub,
}: {
  screenKey: ScreenKey;
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  const tint = SCREEN_TINT[screenKey];
  return (
    <div className="mb-7">
      <div className="mb-2.5 flex items-center gap-2">
        <span
          className="bio-breathe flex h-2 w-2 rounded-full"
          style={{ background: tint, boxShadow: `0 0 10px ${glow(tint, 0.9)}` }}
          aria-hidden="true"
        />
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.22em]"
          style={{ ...mono, color: tint }}
        >
          {eyebrow}
        </span>
      </div>
      <h1
        className="text-[27px] font-semibold leading-tight tracking-tight sm:text-[32px]"
        style={{ ...display, color: C.fg }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2.5 max-w-xl text-[14px] leading-relaxed"
          style={{ ...display, color: C.fgSoft }}
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
  const kpiTints = [C.bio, C.cyan, C.aqua, C.amber];
  return (
    <div>
      <div className="relative mb-8 overflow-hidden rounded-[22px]">
        <GlowOrb tint={C.bio} size={220} style={{ top: -70, left: -40 }} />
        <GlowOrb tint={C.aqua} size={180} style={{ bottom: -80, right: 20 }} />
        <div
          className="relative flex flex-wrap items-end justify-between gap-5 px-6 py-8 sm:px-8"
          style={{
            border: `1px solid ${C.line}`,
            borderRadius: 22,
            background: `radial-gradient(140% 120% at 15% 0%, ${C.raised} 0%, ${C.deep} 60%)`,
          }}
        >
          <div>
            <div
              className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
              style={{ ...mono, color: C.bio }}
            >
              {PROFIEL.plaats} · {PROFIEL.rol}
            </div>
            <h1
              className="text-[30px] font-semibold leading-none tracking-tight sm:text-[38px]"
              style={{ ...display, color: C.fg }}
            >
              Goedeavond, {voornaam}
            </h1>
            <p className="mt-3 max-w-md text-[14px]" style={{ ...display, color: C.fgSoft }}>
              Rustig overzicht — wat oplicht, vraagt om jouw aandacht.
            </p>
          </div>
          <div
            className="bio-breathe flex items-center gap-2.5 rounded-full px-4 py-2"
            style={{
              background: glow(C.bio, 0.08),
              border: `1px solid ${glow(C.bio, 0.3)}`,
              boxShadow: `0 0 18px ${glow(C.bio, 0.16)}`,
            }}
          >
            <ShieldCheck size={16} strokeWidth={2} style={{ color: C.bio }} aria-hidden="true" />
            <span className="text-[12.5px] font-semibold" style={{ ...display, color: C.bio }}>
              {PROFIEL.trust}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const tint = kpiTints[i % kpiTints.length] ?? C.bio;
          return (
            <Panel key={k.label} className="relative overflow-hidden p-4">
              <span
                className="pointer-events-none absolute right-0 top-0 h-16 w-16 rounded-full blur-2xl"
                style={{ background: glow(tint, 0.16) }}
                aria-hidden="true"
              />
              <div className="relative flex items-center justify-between gap-2">
                <span
                  className="text-[10.5px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...display, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ ...mono, color: k.up ? C.bio : C.amber }}
                >
                  <Trend size={11} strokeWidth={2.2} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="relative mt-1.5 text-[24px] font-semibold tabular-nums leading-none"
                style={{ ...display, color: C.fg, textShadow: `0 0 16px ${glow(tint, 0.3)}` }}
              >
                {k.value}
              </div>
              <div className="relative mt-2.5">
                <Sparkline data={k.spark} tint={tint} />
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={16} strokeWidth={2} style={{ color: C.cyan }} aria-hidden="true" />
            <h2
              className="text-[15px] font-semibold tracking-tight"
              style={{ ...display, color: C.fg }}
            >
              Beste match
            </h2>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group relative block w-full overflow-hidden p-0 text-left transition-transform duration-300 hover:-translate-y-0.5 ${RING} rounded-[18px]`}
            style={panelStyle()}
          >
            <GlowOrb
              tint={C.cyan}
              size={200}
              className="opacity-70 transition-opacity duration-500 group-hover:opacity-100"
              style={{ top: -70, right: -50 }}
            />
            <span className="relative flex items-start gap-4 p-5">
              <MatchOrb value={top.match} size={62} />
              <span className="min-w-0 flex-1">
                <span
                  className="block text-[17px] font-semibold leading-tight"
                  style={{ ...display, color: C.fg }}
                >
                  {top.titel}
                </span>
                <span className="mt-0.5 block text-[13px]" style={{ ...display, color: C.muted }}>
                  {top.opdrachtgever} · {top.plaats} · {top.tarief}
                </span>
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {top.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11px]"
                      style={{
                        ...display,
                        color: C.fgSoft,
                        background: glow(C.cyan, 0.08),
                        border: `1px solid ${C.lineSoft}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </span>
              </span>
              <ArrowRight
                size={20}
                className="mt-1 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                style={{ color: C.cyan }}
                aria-hidden="true"
              />
            </span>
          </button>

          <Panel className="relative mt-6 overflow-hidden p-5">
            <GlowOrb tint={C.bio} size={150} style={{ bottom: -70, left: -30 }} />
            <div className="relative flex items-start gap-4">
              <span
                className="bio-breathe flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: glow(C.bio, 0.12),
                  border: `1px solid ${glow(C.bio, 0.34)}`,
                  color: C.bio,
                  boxShadow: `0 0 16px ${glow(C.bio, 0.28)}`,
                }}
                aria-hidden="true"
              >
                <ShieldCheck size={21} strokeWidth={2} />
              </span>
              <div>
                <span className="inline-flex items-center gap-2">
                  <span className="text-[14px] font-semibold" style={{ ...display, color: C.fg }}>
                    {PROFIEL.trust}
                  </span>
                  <BadgeCheck
                    size={15}
                    strokeWidth={2}
                    style={{ color: C.bio }}
                    aria-hidden="true"
                  />
                </span>
                <span
                  className="mt-1 block text-[13px] leading-relaxed"
                  style={{ ...display, color: C.fgSoft }}
                >
                  Je documenten zijn geverifieerd — opdrachtgevers zien direct dat je te vertrouwen
                  bent.
                </span>
              </div>
            </div>
          </Panel>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <ListTodo size={16} strokeWidth={2} style={{ color: C.amber }} aria-hidden="true" />
            <h2
              className="text-[15px] font-semibold tracking-tight"
              style={{ ...display, color: C.fg }}
            >
              Vraagt aandacht
            </h2>
          </div>
          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const tint = a.urgentie === "warning" ? C.amber : C.aqua;
              return (
                <Panel key={a.titel} className="relative overflow-hidden p-4">
                  <span
                    className="absolute left-0 top-4 h-[calc(100%-2rem)] w-[3px] rounded-full"
                    style={{ background: tint, boxShadow: `0 0 10px ${glow(tint, 0.7)}` }}
                    aria-hidden="true"
                  />
                  <div className="pl-2.5">
                    <div
                      className="text-[12.5px] font-semibold leading-snug"
                      style={{ ...display, color: C.fg }}
                    >
                      {a.titel}
                    </div>
                    <div
                      className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold"
                      style={{ ...display, color: tint }}
                    >
                      {a.cta}
                      <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
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
        eyebrow="Marktplaats"
        title="Opdrachten die oplichten"
        sub="We tonen eerlijk waarom een opdracht past — en waar de stroming afwijkt."
      />

      <div
        className="mb-6 flex items-center gap-2.5 rounded-full px-5 py-3"
        style={{
          background: C.deep,
          border: `1px solid ${C.line}`,
          boxShadow: `inset 0 0 20px ${glow(C.cyan, 0.05)}`,
        }}
      >
        <Search size={16} className="shrink-0" style={{ color: C.cyan }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-50"
          style={{ ...display, color: C.fg }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${RING}`}
            style={{ ...display, color: C.cyan, background: glow(C.cyan, 0.1) }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Panel className="relative flex flex-col items-center gap-3 overflow-hidden px-6 py-16 text-center">
          <GlowOrb tint={C.cyan} size={200} style={{ top: -40 }} />
          <span
            className="bio-breathe relative flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              background: glow(C.cyan, 0.1),
              border: `1px solid ${glow(C.cyan, 0.3)}`,
              color: C.cyan,
            }}
            aria-hidden="true"
          >
            <Waves size={28} strokeWidth={1.8} />
          </span>
          <h3 className="relative text-[20px] font-semibold" style={{ ...display, color: C.fg }}>
            Stil water
          </h3>
          <p className="relative max-w-xs text-[13px]" style={{ ...display, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="relative mt-1">
            <GhostButton onClick={() => setQuery("")} tint={C.cyan}>
              Filter wissen
            </GhostButton>
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            const tint = o.match >= 90 ? C.bio : o.match >= 82 ? C.cyan : C.aqua;
            return (
              <div
                key={o.id}
                className="group relative flex h-full flex-col overflow-hidden rounded-[18px] p-5 transition-transform duration-300 hover:-translate-y-1"
                style={panelStyle()}
              >
                <span
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: glow(tint, 0.22) }}
                  aria-hidden="true"
                />
                <div className="relative flex items-start justify-between gap-3">
                  <MatchOrb value={o.match} />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${RING}`}
                    style={{
                      color: isSaved ? C.bio : C.muted,
                      background: isSaved ? glow(C.bio, 0.12) : glow(C.fg, 0.04),
                      border: `1px solid ${isSaved ? glow(C.bio, 0.34) : C.lineSoft}`,
                      boxShadow: isSaved ? `0 0 14px ${glow(C.bio, 0.24)}` : "none",
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={16} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <Bookmark size={16} strokeWidth={2.2} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <span
                  className="relative mt-3 text-[9.5px] font-semibold uppercase tracking-[0.18em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {o.id}
                </span>
                <h3
                  className="relative mt-1 text-[16px] font-semibold leading-tight"
                  style={{ ...display, color: C.fg }}
                >
                  {o.titel}
                </h3>
                <div className="relative mt-0.5 text-[13px]" style={{ ...display, color: C.muted }}>
                  {o.opdrachtgever}
                </div>
                <dl
                  className="relative mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 text-[12px]"
                  style={{ ...display, color: C.fgSoft }}
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
                <div className="relative mt-5">
                  <GlowButton onClick={() => onOpen(o)} tint={tint} className="w-full">
                    Bekijk opdracht
                    <ArrowRight
                      size={14}
                      strokeWidth={2.2}
                      className="transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </GlowButton>
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
  const tint = opdracht.match >= 90 ? C.bio : opdracht.match >= 82 ? C.cyan : C.aqua;
  return (
    <div>
      <div className="mb-5">
        <GhostButton onClick={onBack} tint={C.aqua} ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
          Terug
        </GhostButton>
      </div>

      <Panel className="relative overflow-hidden p-6">
        <GlowOrb tint={tint} size={240} style={{ top: -90, right: -60 }} />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <MatchOrb value={opdracht.match} size={68} />
            <div>
              <span
                className="text-[9.5px] font-semibold uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.faint }}
              >
                {opdracht.id}
              </span>
              <h2
                className="mt-1 text-[24px] font-semibold leading-tight tracking-tight"
                style={{ ...display, color: C.fg }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[14px]" style={{ ...display, color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <GhostButton
            onClick={() => toggleSave(opdracht.id)}
            tint={C.bio}
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

        <div className="relative mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-2xl p-3.5"
              style={{ background: glow(C.fg, 0.03), border: `1px solid ${C.lineSoft}` }}
            >
              <m.Icon size={15} strokeWidth={2} style={{ color: tint }} aria-hidden="true" />
              <div
                className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...display, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="text-[14px] font-semibold" style={{ ...display, color: C.fg }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="relative overflow-hidden p-5">
          <GlowOrb tint={C.bio} size={130} style={{ bottom: -60, left: -20 }} />
          <div className="relative mb-3 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: glow(C.bio, 0.12), color: C.bio }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={2.6} />
            </span>
            <span className="text-[14px] font-semibold" style={{ ...display, color: C.fg }}>
              Waarom deze past
            </span>
          </div>
          <ul className="relative space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...display, color: C.fgSoft }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.bio }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="relative overflow-hidden p-5">
          <GlowOrb tint={C.amber} size={130} style={{ bottom: -60, right: -20 }} />
          <div className="relative mb-3 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: glow(C.amber, 0.12), color: C.amber }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={2.6} />
            </span>
            <span className="text-[14px] font-semibold" style={{ ...display, color: C.fg }}>
              Even op letten
            </span>
          </div>
          <ul className="relative space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px]"
                style={{ ...display, color: C.fgSoft }}
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
        <GlowButton
          onClick={() => setApplied((v) => !v)}
          tint={applied ? C.bio : C.cyan}
          ariaPressed={applied}
          className="px-6 py-3 text-[14px]"
        >
          {applied ? (
            <Check size={17} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </GlowButton>
        {applied && (
          <span className="text-[12.5px]" style={{ ...display, color: C.muted }}>
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
        eyebrow="Verificatie"
        title="Elk bewijsstuk licht op"
        sub="Elke status heeft een eigen gloed — herkenbaar aan kleur, label én icoon."
      />

      {/* Legend: the four verification states, each with its own bioluminescent glow */}
      <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, tint } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3"
              style={{
                background: glow(tint, 0.06),
                border: `1px solid ${glow(tint, 0.24)}`,
              }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: glow(tint, 0.14),
                  color: tint,
                  boxShadow: `0 0 12px ${glow(tint, 0.24)}`,
                }}
                aria-hidden="true"
              >
                <Icon size={15} strokeWidth={2.2} />
              </span>
              <span className="text-[12px] font-semibold" style={{ ...display, color: C.fg }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Panel className="relative mb-6 overflow-hidden p-5">
        <GlowOrb tint={C.bio} size={160} style={{ top: -70, left: -20 }} />
        <div className="relative flex items-center gap-4">
          <span
            className="bio-breathe flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{
              background: glow(C.bio, 0.12),
              border: `1px solid ${glow(C.bio, 0.34)}`,
              color: C.bio,
              boxShadow: `0 0 18px ${glow(C.bio, 0.3)}`,
            }}
            aria-hidden="true"
          >
            <ShieldCheck size={24} strokeWidth={2} />
          </span>
          <div>
            <div className="text-[15px] font-semibold" style={{ ...display, color: C.fg }}>
              {PROFIEL.trust}
            </div>
            <p className="mt-0.5 text-[13px]" style={{ ...display, color: C.fgSoft }}>
              Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            const { tint } = statusMeta(c.status);
            return (
              <Panel key={c.naam} className="flex items-center gap-3 overflow-hidden p-4">
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${RING}`}
                  style={{
                    border: `1.5px solid ${done ? C.bio : C.line}`,
                    background: done ? glow(C.bio, 0.16) : "transparent",
                    color: C.bio,
                    boxShadow: done ? `0 0 12px ${glow(C.bio, 0.3)}` : "none",
                  }}
                >
                  {done && <Check size={14} strokeWidth={2.6} aria-hidden="true" />}
                </button>
                <span
                  className="h-9 w-[3px] shrink-0 rounded-full"
                  style={{ background: tint, boxShadow: `0 0 8px ${glow(tint, 0.6)}` }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ ...display, color: C.fg }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...display, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <StatusPill status={c.status} />
              </Panel>
            );
          })}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[15px] font-semibold"
              style={{ ...display, color: C.fg }}
            >
              <FileText size={16} strokeWidth={2} style={{ color: C.aqua }} aria-hidden="true" />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center rounded-full ${RING}`}
              style={{
                background: glow(C.aqua, 0.08),
                color: C.aqua,
                border: `1px solid ${C.line}`,
              }}
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
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${RING}`}
                style={{
                  ...display,
                  color: feedState === s ? C.abyss : C.muted,
                  background: feedState === s ? C.aqua : glow(C.fg, 0.04),
                  border: `1px solid ${feedState === s ? C.aqua : C.lineSoft}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Panel key={i} className="p-4">
                  <div
                    className="h-3 w-2/3 animate-pulse rounded-full"
                    style={{ background: glow(C.aqua, 0.14) }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded-full"
                    style={{ background: glow(C.aqua, 0.09) }}
                  />
                </Panel>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Panel className="relative flex flex-col items-center gap-2 overflow-hidden px-4 py-9 text-center">
              <GlowOrb tint={C.coral} size={140} style={{ top: -50 }} />
              <span
                className="relative flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: glow(C.coral, 0.12), color: C.coral }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div
                className="relative text-[15px] font-semibold"
                style={{ ...display, color: C.fg }}
              >
                Even geen verbinding
              </div>
              <p className="relative text-[12px]" style={{ ...display, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="relative mt-1">
                <GhostButton onClick={() => setFeedState("ok")} tint={C.bio}>
                  Opnieuw proberen
                </GhostButton>
              </div>
            </Panel>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2">
              {DOCUMENTEN.map((d) => {
                const { tint } = statusMeta(d.status);
                return (
                  <Panel key={d.naam} className="flex items-center gap-3 p-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[9px] font-bold"
                      style={{
                        ...mono,
                        background: glow(tint, 0.12),
                        color: tint,
                        border: `1px solid ${glow(tint, 0.28)}`,
                      }}
                      aria-hidden="true"
                    >
                      {d.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[12.5px] font-semibold"
                        style={{ ...display, color: C.fg }}
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
      <ScreenHead screenKey="acties" eyebrow="Acties" title="Wat vandaag oplicht" />

      {openCount === 0 ? (
        <Panel className="relative flex flex-col items-center gap-3 overflow-hidden px-6 py-16 text-center">
          <GlowOrb tint={C.bio} size={200} style={{ top: -40 }} />
          <span
            className="bio-breathe relative flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              background: glow(C.bio, 0.12),
              border: `1px solid ${glow(C.bio, 0.32)}`,
              color: C.bio,
              boxShadow: `0 0 20px ${glow(C.bio, 0.28)}`,
            }}
            aria-hidden="true"
          >
            <Check size={30} strokeWidth={2.2} />
          </span>
          <h3 className="relative text-[20px] font-semibold" style={{ ...display, color: C.fg }}>
            Alles rustig
          </h3>
          <p className="relative max-w-xs text-[13px]" style={{ ...display, color: C.muted }}>
            Niets meer te doen vandaag. De diepte is stil.
          </p>
        </Panel>
      ) : (
        <>
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-2"
            style={{ background: glow(C.amber, 0.08), border: `1px solid ${glow(C.amber, 0.24)}` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold tabular-nums"
              style={{ ...mono, background: glow(C.amber, 0.18), color: C.amber }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ ...display, color: C.amber }}>
              {openCount} {openCount === 1 ? "actie" : "acties"} open
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const tint = isDone ? C.bio : a.urgentie === "warning" ? C.amber : C.aqua;
              return (
                <Panel key={a.titel} className="relative overflow-hidden p-5">
                  <span
                    className="absolute left-0 top-5 h-[calc(100%-2.5rem)] w-[3px] rounded-full"
                    style={{ background: tint, boxShadow: `0 0 10px ${glow(tint, 0.7)}` }}
                    aria-hidden="true"
                  />
                  <div className="flex items-start gap-4 pl-2.5">
                    <button
                      onClick={() => toggleDone(a.titel)}
                      aria-pressed={isDone}
                      aria-label={
                        isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`
                      }
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${RING}`}
                      style={{
                        border: `1.5px solid ${isDone ? C.bio : C.line}`,
                        background: isDone ? glow(C.bio, 0.16) : "transparent",
                        color: C.bio,
                        boxShadow: isDone ? `0 0 12px ${glow(C.bio, 0.3)}` : "none",
                      }}
                    >
                      {isDone && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[15px] font-semibold leading-snug"
                        style={{
                          ...display,
                          color: C.fg,
                          textDecoration: isDone ? "line-through" : "none",
                          opacity: isDone ? 0.55 : 1,
                        }}
                      >
                        {a.titel}
                      </div>
                      <p
                        className="mt-1 text-[12.5px]"
                        style={{ ...display, color: C.muted, opacity: isDone ? 0.55 : 1 }}
                      >
                        {a.detail}
                      </p>
                      {!isDone && (
                        <span
                          className="mt-2.5 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                          style={{ ...display, color: tint, background: glow(tint, 0.1) }}
                        >
                          {a.cta}
                          <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                        </span>
                      )}
                    </div>
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
  const trend = [24.8, 13.5, 30.72, 8.8];
  const statusTint = (status: string): string =>
    status === "Betaald" ? C.bio : status === "Openstaand" ? C.amber : C.muted;
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        eyebrow="Facturen"
        title="Je facturen"
        sub="Overzichtelijk en zonder gedoe — zodat je weet waar je aan toe bent."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-2">
          {[
            { label: "Betaald (mnd)", value: "€ 5.552", tint: C.bio },
            { label: "Openstaand", value: "€ 1.350", tint: C.amber },
            { label: "Concept", value: "€ 880", tint: C.muted },
          ].map((s) => (
            <Panel key={s.label} className="relative overflow-hidden p-4">
              <span
                className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full blur-2xl"
                style={{ background: glow(s.tint, 0.18) }}
                aria-hidden="true"
              />
              <div
                className="relative text-[10.5px] font-medium uppercase tracking-[0.1em]"
                style={{ ...display, color: C.muted }}
              >
                {s.label}
              </div>
              <div
                className="relative mt-1.5 text-[22px] font-semibold tabular-nums"
                style={{ ...display, color: s.tint, textShadow: `0 0 14px ${glow(s.tint, 0.3)}` }}
              >
                {s.value}
              </div>
            </Panel>
          ))}
        </div>
        <Panel className="flex flex-col justify-between p-4">
          <div
            className="text-[10.5px] font-medium uppercase tracking-[0.1em]"
            style={{ ...display, color: C.muted }}
          >
            Bedrag per factuur
          </div>
          <Sparkline data={trend} tint={C.cyan} height={48} />
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
                    className="px-3 py-3 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                    style={{ ...display, color: C.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const tint = statusTint(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = glow(C.cyan, 0.04))}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td
                      className="px-3 py-3.5 text-[12.5px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.fg }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3.5 text-[13px]" style={{ ...display, color: C.fg }}>
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
                      style={{ ...mono, color: C.fg }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full py-0.5 pl-1 pr-2.5 text-[11px] font-semibold"
                        style={{
                          ...display,
                          color: tint,
                          background: glow(tint, 0.1),
                          border: `1px solid ${glow(tint, 0.28)}`,
                        }}
                      >
                        <span
                          className="flex h-4 w-4 items-center justify-center rounded-full"
                          style={{ background: glow(tint, 0.2) }}
                          aria-hidden="true"
                        >
                          {f.status === "Betaald" ? (
                            <Check size={10} strokeWidth={2.6} color={tint} />
                          ) : f.status === "Openstaand" ? (
                            <Clock size={10} strokeWidth={2.4} color={tint} />
                          ) : (
                            <FileText size={10} strokeWidth={2.4} color={tint} />
                          )}
                        </span>
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

export function Concept279() {
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
      style={{ ...display, color: C.fg, background: C.abyss }}
    >
      {/* Deep-sea keyframes; motion is disabled for users who prefer reduced motion. */}
      <style>{`
        @keyframes bioBreathe { 0%,100%{opacity:.62;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
        .bio-breathe { animation: bioBreathe 5.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .bio-breathe { animation: none !important; } }
      `}</style>

      {/* Ambient abyssal glow behind everything */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <span
          className="bio-breathe absolute rounded-full blur-3xl"
          style={{
            width: 420,
            height: 420,
            top: -160,
            left: -120,
            background: `radial-gradient(circle, ${glow(C.bio, 0.12)} 0%, transparent 70%)`,
          }}
        />
        <span
          className="absolute rounded-full blur-3xl"
          style={{
            width: 360,
            height: 360,
            bottom: -140,
            right: -80,
            background: `radial-gradient(circle, ${glow(C.aqua, 0.1)} 0%, transparent 70%)`,
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="bio-breathe flex h-11 w-11 items-center justify-center rounded-full"
              style={{
                background: `radial-gradient(circle at 40% 35%, ${C.bio} 0%, ${C.bioDeep} 70%)`,
                color: C.abyss,
                boxShadow: `0 0 20px ${glow(C.bio, 0.5)}`,
              }}
              aria-hidden="true"
            >
              <Waves size={19} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[18px] font-semibold tracking-tight"
                style={{ ...display, color: C.fg }}
              >
                Bioluminescentie
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.24em]"
                style={{ ...mono, color: C.faint }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...display, color: C.fg }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...display, color: C.bio }}
              >
                <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-bold"
              style={{
                ...mono,
                background: glow(C.bio, 0.12),
                border: `1px solid ${glow(C.bio, 0.32)}`,
                color: C.bio,
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
            const tint = SCREEN_TINT[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-300 ${RING}`}
                style={{
                  ...display,
                  color: on ? C.abyss : C.fgSoft,
                  background: on
                    ? `linear-gradient(135deg, ${tint} 0%, ${C.bioDeep} 100%)`
                    : glow(C.fg, 0.04),
                  border: `1px solid ${on ? glow(tint, 0.5) : C.lineSoft}`,
                  boxShadow: on ? `0 0 18px ${glow(tint, 0.4)}` : "none",
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
          className="mt-10 flex flex-wrap items-center justify-between gap-2 pt-4 text-[11px]"
          style={{ ...mono, borderTop: `1px solid ${C.line}`, color: C.faint }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Waves size={12} strokeWidth={2} style={{ color: C.bio }} aria-hidden="true" />
            {SCREENS.length} schermen · deepzee v279
          </span>
          <span>Alles wat oplicht, telt</span>
        </footer>
      </div>
    </div>
  );
}
