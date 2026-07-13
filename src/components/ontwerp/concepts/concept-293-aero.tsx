"use client";

// Concept 293 — "Aero" · Frutiger Aero revival (glossy 2000s-optimisme).
// Signature: glanzende glas/aqua-oppervlakken met zachte glans-highlights bovenaan knoppen en
// kaarten (puur CSS-gradients, geen afbeeldingen), aqua-verlopen (#2ea6d8 → #7fd4b8), heldere
// hemelblauwe achtergrond met zachte glow, bolle glossy pill-knoppen, natuur-tech gevoel.
// Licht, schoon, hoge helderheid. Inkt #0f2b33.
// Fonts: --font-lab-jakarta (rond/vriendelijk) + --font-lab-mono (cijfers).

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
  Droplet,
  Sparkles,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// Aero-palet — hemelblauw, aqua-verlopen, glas-wit, diepe teal-inkt.
const C = {
  sky: "#dff1fb",
  skyDeep: "#c6e6f6",
  glass: "rgba(255,255,255,0.72)",
  glassSolid: "#f4fbff",
  ink: "#0f2b33",
  fg: "#1d3f48",
  fgSoft: "#4a6b73",
  muted: "#6f8d94",
  faint: "#a7c1c8",
  line: "#bfe0ed",
  lineSoft: "#d6ecf5",
  aqua: "#2ea6d8",
  aquaMint: "#7fd4b8",
  aquaDeep: "#1c7fac",
  mint: "#37b98a",
  amber: "#e8a13c",
  amberDeep: "#c07d18",
  coral: "#e5674f",
  coralDeep: "#c2452e",
};

const sans = { fontFamily: "var(--font-lab-jakarta), Helvetica, Arial, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ea6d8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#dff1fb]";

// De glans-highlight bovenaan glossy oppervlakken — puur CSS, geen afbeelding.
const GLOSS =
  "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.25) 44%, rgba(255,255,255,0) 60%)";
const AQUA_GRAD = `linear-gradient(135deg, ${C.aqua} 0%, ${C.aquaMint} 100%)`;

const SCREEN_INDEX: Record<ScreenKey, string> = {
  dashboard: "01",
  marktplaats: "02",
  opdracht: "03",
  verificatie: "04",
  acties: "05",
  facturen: "06",
  documenten: "07",
  berichten: "08",
};

// ---- Primitives -------------------------------------------------------------

// Glazen kaart — halftransparant, zachte glans bovenaan, subtiele rand + schaduw.
function GlassCard({
  children,
  className,
  style,
  gloss = true,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  gloss?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className ?? ""}`}
      style={{
        background: C.glass,
        border: `1px solid rgba(255,255,255,0.9)`,
        boxShadow: "0 10px 30px -14px rgba(15,43,51,0.35), inset 0 1px 0 rgba(255,255,255,0.9)",
        backdropFilter: "blur(6px)",
        ...style,
      }}
    >
      {gloss && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
          style={{ background: GLOSS }}
          aria-hidden="true"
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

function Kicker({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    <span
      className="text-[10.5px] font-bold uppercase tracking-[0.18em]"
      style={{ ...mono, color: accent ? C.aquaDeep : C.muted }}
    >
      {children}
    </span>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  from: string;
  to: string;
  ink: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: BadgeCheck,
        from: C.mint,
        to: C.aquaMint,
        ink: "#08321f",
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Hourglass,
        from: C.aqua,
        to: "#8fd6ee",
        ink: "#06303f",
      };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        Icon: TriangleAlert,
        from: C.amber,
        to: "#f2c877",
        ink: "#3f2a06",
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, from: C.coral, to: "#f0917d", ink: "#3f0f06" };
  }
}

// Glossy status-pil — aqua/mint-verloop met glans bovenaan, altijd label + icoon.
function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, from, to, ink } = statusMeta(status);
  return (
    <span
      className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.03em]"
      style={{
        ...sans,
        color: ink,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        border: "1px solid rgba(255,255,255,0.7)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{ background: GLOSS }}
        aria-hidden="true"
      />
      <Icon size={12} strokeWidth={2.6} aria-hidden="true" className="relative" />
      <span className="relative">{label}</span>
    </span>
  );
}

function MatchTag({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const high = value >= 90;
  return (
    <span className="inline-flex items-baseline gap-1" aria-label={`Match ${value} procent`}>
      <span
        className={`font-extrabold tabular-nums leading-none ${size === "sm" ? "text-[27px]" : "text-[36px]"}`}
        style={{
          ...sans,
          background: high ? AQUA_GRAD : `linear-gradient(135deg, ${C.ink}, ${C.fgSoft})`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {value}
      </span>
      <span
        className="text-[9px] font-bold uppercase tracking-[0.14em]"
        style={{ ...mono, color: C.muted }}
      >
        % match
      </span>
    </span>
  );
}

function Sparkline({ data, height = 30, id }: { data: number[]; height?: number; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 62 - 18;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,100 ${line} 100,100`;
  const last = pts[pts.length - 1] ?? ([0, 0] as const);
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`aero-fill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.aqua} stopOpacity={0.32} />
          <stop offset="100%" stopColor={C.aqua} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`aero-line-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={C.aqua} />
          <stop offset="100%" stopColor={C.aquaMint} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#aero-fill-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={`url(#aero-line-${id})`}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r={2.8}
        fill="#ffffff"
        stroke={C.aqua}
        strokeWidth={1.6}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Bolle glossy pill-knop — aqua-verloop met glans, of glazen secundair.
function AquaButton({
  children,
  onClick,
  className,
  ariaLabel,
  ariaPressed,
  variant = "solid",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  variant?: "solid" | "glass";
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
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-5 py-2.5 text-[12.5px] font-bold transition-all duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: solid ? "#ffffff" : C.aquaDeep,
        background: solid ? AQUA_GRAD : "rgba(255,255,255,0.7)",
        border: solid ? "1px solid rgba(255,255,255,0.6)" : `1px solid ${C.line}`,
        boxShadow: solid
          ? `0 6px 16px -6px ${C.aqua}, inset 0 1px 0 rgba(255,255,255,0.8)`
          : "inset 0 1px 0 rgba(255,255,255,0.9)",
        transform: hot ? "translateY(-1px)" : "none",
      }}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{ background: GLOSS }}
        aria-hidden="true"
      />
      <span className="relative inline-flex items-center gap-2">{children}</span>
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
    <div className="mb-8 flex items-end gap-4">
      <span
        className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-[15px] font-extrabold tabular-nums text-white"
        style={{ ...mono, background: AQUA_GRAD, boxShadow: `0 6px 16px -6px ${C.aqua}` }}
        aria-hidden="true"
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
          style={{ background: GLOSS }}
        />
        <span className="relative">{SCREEN_INDEX[screenKey]}</span>
      </span>
      <div className="min-w-0 flex-1">
        <h1
          className="text-[28px] font-extrabold leading-tight tracking-tight sm:text-[34px]"
          style={{ ...sans, color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-1 text-[13.5px] leading-snug" style={{ ...sans, color: C.fgSoft }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      {/* Hero — glazen paneel met aqua-glow en glans. */}
      <GlassCard className="mb-10">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
          style={{ background: `radial-gradient(circle, ${C.aquaMint}55 0%, transparent 70%)` }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6 p-6 sm:p-8">
          <div className="min-w-0">
            <Kicker accent>
              {PROFIEL.plaats} · {PROFIEL.rol}
            </Kicker>
            <h2
              className="mt-3 text-[38px] font-extrabold leading-[1.02] tracking-tight sm:text-[50px]"
              style={{ ...sans, color: C.ink }}
            >
              Goedemorgen,
              <br />
              <span
                style={{
                  background: AQUA_GRAD,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {voornaam}
              </span>
              .
            </h2>
            <p
              className="mt-4 max-w-md text-[14px] leading-relaxed"
              style={{ ...sans, color: C.fgSoft }}
            >
              Helder en licht — alleen wat telt en wat nu je aandacht vraagt, rustig gerangschikt op
              een glasheldere achtergrond.
            </p>
          </div>
          <span
            className="relative inline-flex items-center gap-2 overflow-hidden rounded-full px-4 py-2.5 text-white"
            style={{
              background: `linear-gradient(135deg, ${C.mint}, ${C.aquaMint})`,
              boxShadow: `0 6px 16px -6px ${C.mint}`,
            }}
          >
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
              style={{ background: GLOSS }}
              aria-hidden="true"
            />
            <BadgeCheck size={16} strokeWidth={2.4} aria-hidden="true" className="relative" />
            <span
              className="relative text-[12px] font-bold uppercase tracking-[0.04em]"
              style={sans}
            >
              {PROFIEL.trust}
            </span>
          </span>
        </div>
      </GlassCard>

      {/* KPI-glaskaarten. */}
      <div className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <GlassCard key={k.label}>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-bold tabular-nums"
                  style={{ ...mono, color: C.faint }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                  style={{ ...mono, color: k.up ? C.mint : C.fgSoft }}
                >
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-2 text-[28px] font-extrabold tabular-nums leading-none"
                style={{ ...sans, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-1 text-[11px]" style={{ ...sans, color: C.fgSoft }}>
                {k.label}
              </div>
              <div className="mt-3">
                <Sparkline data={k.spark} id={`kpi-${i}`} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-baseline justify-between">
            <Kicker accent>Beste match</Kicker>
            <span className="text-[11px]" style={{ ...mono, color: C.faint }}>
              {top.id}
            </span>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group block w-full text-left ${RING} rounded-2xl`}
            aria-label={`Open ${top.titel}`}
          >
            <GlassCard className="transition-transform duration-200 group-hover:-translate-y-1">
              <div className="flex items-start justify-between gap-5 p-6">
                <div className="min-w-0 flex-1">
                  <h3
                    className="text-[22px] font-extrabold leading-tight tracking-tight"
                    style={{ ...sans, color: C.ink }}
                  >
                    {top.titel}
                  </h3>
                  <div className="mt-1.5 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
                    {top.opdrachtgever} · {top.plaats} · {top.tarief}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {top.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{
                          ...sans,
                          color: C.aquaDeep,
                          background: "rgba(255,255,255,0.7)",
                          border: `1px solid ${C.line}`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-3">
                  <MatchTag value={top.match} />
                  <span
                    className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-white transition-transform group-hover:translate-x-0.5"
                    style={{ background: AQUA_GRAD, boxShadow: `0 6px 14px -6px ${C.aqua}` }}
                  >
                    <span
                      className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
                      style={{ background: GLOSS }}
                      aria-hidden="true"
                    />
                    <ArrowRight
                      size={17}
                      strokeWidth={2.6}
                      className="relative"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </div>
            </GlassCard>
          </button>
        </div>

        <div>
          <div className="mb-3">
            <Kicker>Vraagt aandacht</Kicker>
          </div>
          <ul className="space-y-3">
            {ACTIES.map((a, i) => {
              const warn = a.urgentie === "warning";
              return (
                <li key={a.titel}>
                  <GlassCard style={warn ? { border: `1px solid ${C.amber}` } : undefined}>
                    <div className="flex items-start gap-3 p-4">
                      <span
                        className="text-[13px] font-bold tabular-nums"
                        style={{ ...mono, color: warn ? C.amberDeep : C.faint }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-[13px] font-bold leading-snug"
                          style={{ ...sans, color: C.ink }}
                        >
                          {a.titel}
                        </div>
                        <div
                          className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-bold"
                          style={{ ...sans, color: warn ? C.amberDeep : C.aquaDeep }}
                        >
                          {a.cta}
                          <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </li>
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
  onOpen,
}: {
  query: string;
  setQuery: (v: string) => void;
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
        sub="Helder en eerlijk geordend: waarom een opdracht past — en waar het schuurt."
      />

      <GlassCard className="mb-8">
        <div className="flex items-center gap-3 px-4 py-3">
          <Search size={16} className="shrink-0" style={{ color: C.aquaDeep }} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek op titel, plaats of vaardigheid…"
            aria-label="Zoek opdrachten"
            className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-50"
            style={{ ...sans, color: C.ink }}
          />
          <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
            {String(filtered.length).padStart(2, "0")}/{String(OPDRACHTEN.length).padStart(2, "0")}
          </span>
          {query && (
            <button
              onClick={() => setQuery("")}
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em] ${RING}`}
              style={{ ...sans, color: C.aquaDeep }}
            >
              Wis
            </button>
          )}
        </div>
      </GlassCard>

      {filtered.length === 0 ? (
        <GlassCard>
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Search size={30} strokeWidth={1.8} style={{ color: C.aqua }} aria-hidden="true" />
            <h3
              className="text-[22px] font-extrabold tracking-tight"
              style={{ ...sans, color: C.ink }}
            >
              Geen resultaten
            </h3>
            <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
              Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
            </p>
            <div className="mt-1">
              <AquaButton onClick={() => setQuery("")} variant="glass">
                Filter wissen
              </AquaButton>
            </div>
          </div>
        </GlassCard>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <button
                onClick={() => onOpen(o)}
                className={`group block w-full rounded-2xl text-left ${RING}`}
                aria-label={`Open ${o.titel}`}
              >
                <GlassCard className="transition-transform duration-200 group-hover:-translate-y-1">
                  <div
                    className="absolute left-0 top-0 h-full w-1.5"
                    style={{ background: o.match >= 90 ? AQUA_GRAD : C.lineSoft }}
                    aria-hidden="true"
                  />
                  <div className="grid grid-cols-1 gap-4 p-5 pl-6 sm:grid-cols-[1fr,auto] sm:items-start">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className="text-[12px] font-bold tabular-nums"
                          style={{ ...mono, color: C.faint }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <Kicker>{o.id}</Kicker>
                      </div>
                      <h3
                        className="text-[19px] font-extrabold leading-tight tracking-tight"
                        style={{ ...sans, color: C.ink }}
                      >
                        {o.titel}
                      </h3>
                      <div className="mt-1 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
                        {o.opdrachtgever}
                      </div>
                      <dl
                        className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12px]"
                        style={{ ...sans, color: C.fgSoft }}
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
                              style={{ color: C.muted }}
                              aria-hidden="true"
                            />
                            {m.v}
                          </div>
                        ))}
                      </dl>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <MatchTag value={o.match} size="sm" />
                      <span
                        className="inline-flex items-center gap-1 text-[12px] font-bold"
                        style={{ ...sans, color: C.aquaDeep }}
                      >
                        Bekijk
                        <ArrowRight
                          size={13}
                          strokeWidth={2.6}
                          className="transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [applied, setApplied] = useState(false);
  return (
    <div>
      <div className="mb-6">
        <AquaButton onClick={onBack} variant="glass" ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={14} strokeWidth={2.6} aria-hidden="true" />
          Terug
        </AquaButton>
      </div>

      <GlassCard className="mb-8">
        <div
          className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full"
          style={{ background: `radial-gradient(circle, ${C.aquaMint}55 0%, transparent 70%)` }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0 flex-1">
            <Kicker accent>{opdracht.id}</Kicker>
            <h2
              className="mt-2 text-[30px] font-extrabold leading-[1.05] tracking-tight sm:text-[40px]"
              style={{ ...sans, color: C.ink }}
            >
              {opdracht.titel}
            </h2>
            <div className="mt-2 text-[14px]" style={{ ...sans, color: C.fgSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </div>
          </div>
          <MatchTag value={opdracht.match} />
        </div>
      </GlassCard>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
          { Icon: Clock, label: "Inzet", value: opdracht.uren },
          { Icon: Calendar, label: "Start", value: opdracht.start },
          { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
        ].map((m) => (
          <GlassCard key={m.label}>
            <div className="p-4">
              <m.Icon size={15} strokeWidth={2} style={{ color: C.aquaDeep }} aria-hidden="true" />
              <div
                className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="mt-0.5 text-[15px] font-bold" style={{ ...sans, color: C.ink }}>
                {m.value}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <GlassCard>
          <div className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                style={{ background: `linear-gradient(135deg, ${C.mint}, ${C.aquaMint})` }}
              >
                <Check size={13} strokeWidth={2.8} aria-hidden="true" />
              </span>
              <span className="text-[13px] font-bold" style={{ ...sans, color: C.ink }}>
                Waarom deze past
              </span>
            </div>
            <ul className="space-y-0">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 py-2.5 text-[13.5px]"
                  style={{ ...sans, color: C.fg, borderTop: `1px solid ${C.lineSoft}` }}
                >
                  <Check
                    size={16}
                    strokeWidth={2.8}
                    className="mt-0.5 shrink-0"
                    style={{ color: C.mint }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </GlassCard>
        <GlassCard style={{ border: `1px solid ${C.amber}` }}>
          <div className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                style={{ background: `linear-gradient(135deg, ${C.amber}, #f2c877)` }}
              >
                <TriangleAlert size={13} strokeWidth={2.6} aria-hidden="true" />
              </span>
              <span className="text-[13px] font-bold" style={{ ...sans, color: C.ink }}>
                Even op letten
              </span>
            </div>
            <ul className="space-y-0">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 py-2.5 text-[13.5px]"
                  style={{ ...sans, color: C.fg, borderTop: `1px solid ${C.lineSoft}` }}
                >
                  <TriangleAlert
                    size={16}
                    strokeWidth={2.4}
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amberDeep }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </GlassCard>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <AquaButton
          onClick={() => setApplied((v) => !v)}
          ariaPressed={applied}
          className="px-6 py-3"
        >
          {applied ? (
            <Check size={16} strokeWidth={2.8} aria-hidden="true" />
          ) : (
            <Sparkles size={16} strokeWidth={2.4} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </AquaButton>
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
}: {
  checked: Set<string>;
  toggleCheck: (naam: string) => void;
}) {
  return (
    <div>
      <ScreenHead
        screenKey="verificatie"
        title="Verificatie"
        sub="Elke status heeft een eigen vorm, label én icoon — nooit alleen kleur."
      />

      <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, from, to, ink } = statusMeta(s);
          return (
            <div
              key={s}
              className="relative flex items-center gap-2.5 overflow-hidden rounded-full px-3.5 py-2.5"
              style={{
                color: ink,
                background: `linear-gradient(135deg, ${from}, ${to})`,
                border: "1px solid rgba(255,255,255,0.7)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
              }}
            >
              <span
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
                style={{ background: GLOSS }}
                aria-hidden="true"
              />
              <Icon size={16} strokeWidth={2.6} aria-hidden="true" className="relative" />
              <span
                className="relative text-[12px] font-bold uppercase tracking-[0.03em]"
                style={sans}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <GlassCard className="mb-8">
        <div className="flex items-start gap-4 p-5">
          <span
            className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-white"
            style={{
              background: `linear-gradient(135deg, ${C.mint}, ${C.aquaMint})`,
              boxShadow: `0 6px 14px -6px ${C.mint}`,
            }}
          >
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
              style={{ background: GLOSS }}
              aria-hidden="true"
            />
            <BadgeCheck size={22} strokeWidth={2.4} className="relative" aria-hidden="true" />
          </span>
          <div>
            <div className="text-[15px] font-bold" style={{ ...sans, color: C.ink }}>
              {PROFIEL.trust}
            </div>
            <p className="mt-1 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
              Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="mb-3">
        <Kicker accent>Certificaten</Kicker>
      </div>
      <ul className="space-y-3">
        {CREDENTIALS.map((c, i) => {
          const done = checked.has(c.naam);
          return (
            <li key={c.naam}>
              <GlassCard>
                <div className="flex items-center gap-4 p-4">
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                    className={`relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${done ? "transparent" : C.line}`,
                      background: done ? AQUA_GRAD : "rgba(255,255,255,0.6)",
                    }}
                  >
                    {done && (
                      <Check
                        size={13}
                        strokeWidth={2.8}
                        style={{ color: "#ffffff" }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                  <span
                    className="text-[12px] font-bold tabular-nums"
                    style={{ ...mono, color: C.faint }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold" style={{ ...sans, color: C.ink }}>
                      {c.naam}
                    </div>
                    <div className="text-[12px]" style={{ ...sans, color: C.muted }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusPill status={c.status} />
                </div>
              </GlassCard>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties({ done, toggleDone }: { done: Set<string>; toggleDone: (t: string) => void }) {
  const openCount = ACTIES.filter((a) => !done.has(a.titel)).length;
  return (
    <div>
      <ScreenHead screenKey="acties" title="Acties" sub="Wat vandaag om aandacht vraagt." />

      {openCount === 0 ? (
        <GlassCard>
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span
              className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-white"
              style={{ background: `linear-gradient(135deg, ${C.mint}, ${C.aquaMint})` }}
            >
              <span
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
                style={{ background: GLOSS }}
                aria-hidden="true"
              />
              <Check size={24} strokeWidth={2.6} className="relative" aria-hidden="true" />
            </span>
            <h3
              className="text-[22px] font-extrabold tracking-tight"
              style={{ ...sans, color: C.ink }}
            >
              Alles afgerond
            </h3>
            <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
              Niets meer te doen vandaag. Alles is helder.
            </p>
          </div>
        </GlassCard>
      ) : (
        <>
          <div className="mb-6 flex items-baseline gap-3">
            <span
              className="text-[46px] font-extrabold tabular-nums leading-none"
              style={{
                ...sans,
                background: AQUA_GRAD,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {String(openCount).padStart(2, "0")}
            </span>
            <span
              className="text-[12px] font-bold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.muted }}
            >
              {openCount === 1 ? "actie open" : "acties open"}
            </span>
          </div>

          <ul className="space-y-4">
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <li key={a.titel}>
                  <GlassCard
                    style={warn && !isDone ? { border: `1px solid ${C.amber}` } : undefined}
                  >
                    <div className="flex items-start gap-4 p-5">
                      <button
                        onClick={() => toggleDone(a.titel)}
                        aria-pressed={isDone}
                        aria-label={
                          isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`
                        }
                        className={`relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full transition-colors ${RING}`}
                        style={{
                          border: `1.5px solid ${isDone ? "transparent" : C.line}`,
                          background: isDone ? AQUA_GRAD : "rgba(255,255,255,0.6)",
                        }}
                      >
                        {isDone && (
                          <Check
                            size={13}
                            strokeWidth={2.8}
                            style={{ color: "#ffffff" }}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                      <span
                        className="mt-0.5 text-[13px] font-bold tabular-nums"
                        style={{ ...mono, color: isDone ? C.faint : warn ? C.amberDeep : C.muted }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-[15px] font-bold leading-snug"
                          style={{
                            ...sans,
                            color: C.ink,
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
                            className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold"
                            style={{ ...sans, color: warn ? C.amberDeep : C.aquaDeep }}
                          >
                            {a.cta}
                            <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
                          </span>
                        )}
                      </div>
                    </div>
                  </GlassCard>
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
  const trend = [24.8, 13.5, 30.72, 8.8];
  const statusStyle = (status: string): { from: string; to: string; ink: string } => {
    if (status === "Betaald") return { from: C.mint, to: C.aquaMint, ink: "#08321f" };
    if (status === "Openstaand") return { from: C.amber, to: "#f2c877", ink: "#3f2a06" };
    return { from: "#c9dbe2", to: "#e2eef3", ink: C.fgSoft };
  };
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Facturen"
        sub="Overzichtelijk en zonder gedoe — zodat je weet waar je aan toe bent."
      />

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", accent: false },
          { label: "Openstaand", value: "€ 1.350", accent: true },
          { label: "Concept", value: "€ 880", accent: false },
        ].map((s) => (
          <GlassCard key={s.label}>
            <div className="p-4">
              <div
                className="text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.muted }}
              >
                {s.label}
              </div>
              <div
                className="mt-2 text-[26px] font-extrabold tabular-nums leading-none"
                style={
                  s.accent
                    ? {
                        ...sans,
                        background: `linear-gradient(135deg, ${C.amber}, ${C.amberDeep})`,
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                      }
                    : { ...sans, color: C.ink }
                }
              >
                {s.value}
              </div>
            </div>
          </GlassCard>
        ))}
        <GlassCard>
          <div className="flex h-full flex-col justify-between p-4">
            <div
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.muted }}
            >
              Per factuur
            </div>
            <Sparkline data={trend} height={44} id="fact" />
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="overflow-x-auto p-1">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.line}` }}>
                {["Nr.", "Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-3 text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ ...mono, color: C.muted, textAlign: i >= 4 ? "right" : "left" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const st = statusStyle(f.status);
                return (
                  <tr key={f.nr} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                    <td
                      className="px-3 py-4 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.faint }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td
                      className="px-3 py-4 text-[12.5px] font-bold tabular-nums"
                      style={{ ...sans, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-4 text-[13px]" style={{ ...sans, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-4 text-[12.5px] tabular-nums"
                      style={{ ...mono, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-4 text-right text-[13px] font-bold tabular-nums"
                      style={{ ...sans, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-4 text-right">
                      <span
                        className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{
                          ...sans,
                          color: st.ink,
                          background: `linear-gradient(135deg, ${st.from}, ${st.to})`,
                          border: "1px solid rgba(255,255,255,0.7)",
                        }}
                      >
                        <span
                          className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
                          style={{ background: GLOSS }}
                          aria-hidden="true"
                        />
                        <span className="relative">{f.status}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
              <tr style={{ borderTop: `2px solid ${C.line}` }}>
                <td className="px-3 py-4" />
                <td
                  className="px-3 py-4 text-[11px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.muted }}
                  colSpan={3}
                >
                  Totaal
                </td>
                <td
                  className="px-3 py-4 text-right text-[15px] font-extrabold tabular-nums"
                  style={{ ...sans, color: C.ink }}
                >
                  € 7.782
                </td>
                <td className="px-3 py-4" />
              </tr>
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept293() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [query, setQuery] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Set<string>>(new Set());
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
      style={{
        ...sans,
        color: C.fg,
        background: `radial-gradient(120% 80% at 50% -10%, ${C.glassSolid} 0%, ${C.sky} 45%, ${C.skyDeep} 100%)`,
      }}
    >
      {/* Zachte aqua-glows in de achtergrond. */}
      <div
        className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full"
        style={{ background: `radial-gradient(circle, ${C.aquaMint}44 0%, transparent 70%)` }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full"
        style={{ background: `radial-gradient(circle, ${C.aqua}33 0%, transparent 70%)` }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl text-white"
              style={{ background: AQUA_GRAD, boxShadow: `0 6px 16px -6px ${C.aqua}` }}
              aria-hidden="true"
            >
              <span
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
                style={{ background: GLOSS }}
              />
              <Droplet size={18} strokeWidth={2.4} className="relative" />
            </span>
            <div className="leading-tight">
              <div
                className="text-[17px] font-extrabold tracking-tight"
                style={{ ...sans, color: C.ink }}
              >
                Aero
              </div>
              <div
                className="text-[9.5px] font-bold uppercase tracking-[0.22em]"
                style={{ ...mono, color: C.muted }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-bold" style={{ ...sans, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...sans, color: C.fgSoft }}
              >
                <BadgeCheck size={12} strokeWidth={2.4} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full text-[12px] font-bold text-white"
              style={{
                background: `linear-gradient(135deg, ${C.aquaDeep}, ${C.aqua})`,
                boxShadow: `0 6px 14px -6px ${C.aqua}`,
              }}
              aria-hidden="true"
            >
              <span
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
                style={{ background: GLOSS }}
              />
              <span className="relative">{PROFIEL.initialen}</span>
            </span>
          </div>
        </header>

        <nav className="mb-9 flex flex-wrap gap-2 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-full px-3.5 py-2 transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: on ? "#ffffff" : C.fgSoft,
                  background: on ? AQUA_GRAD : "rgba(255,255,255,0.6)",
                  border: `1px solid ${on ? "rgba(255,255,255,0.6)" : C.line}`,
                  boxShadow: on
                    ? `0 6px 14px -6px ${C.aqua}, inset 0 1px 0 rgba(255,255,255,0.8)`
                    : "inset 0 1px 0 rgba(255,255,255,0.9)",
                }}
              >
                {on && (
                  <span
                    className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
                    style={{ background: GLOSS }}
                    aria-hidden="true"
                  />
                )}
                <span
                  className="relative text-[10px] font-bold tabular-nums"
                  style={{ ...mono, color: on ? "rgba(255,255,255,0.9)" : C.faint }}
                >
                  {SCREEN_INDEX[s.key]}
                </span>
                <span className="relative text-[12.5px] font-bold">{s.label}</span>
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
              onOpen={(o) => {
                setActive(o);
                setScreen("opdracht");
              }}
            />
          )}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && (
            <Verificatie
              checked={checked}
              toggleCheck={(naam) => setChecked((s) => toggleSet(s, naam))}
            />
          )}
          {screen === "acties" && (
            <Acties done={done} toggleDone={(t) => setDone((s) => toggleSet(s, t))} />
          )}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer
          className="mt-10 flex flex-wrap items-center justify-between gap-2 pt-4 text-[10.5px]"
          style={{ ...mono, color: C.muted, borderTop: `1px solid ${C.line}` }}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: AQUA_GRAD }}
              aria-hidden="true"
            />
            {SCREENS.length} schermen · aero v293
          </span>
          <span className="uppercase tracking-[0.14em]">Glas · aqua · glans</span>
        </footer>
      </div>
    </div>
  );
}
