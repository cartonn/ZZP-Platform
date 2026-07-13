"use client";

// Concept 292 — "Instant" · Polaroid / instant-film esthetiek.
// Signature: witte emulsie-frames met dikke onderrand als caption-strook, lichte chemische
// kleurgloed langs de randen, gestapelde en licht-geroteerde fotokaarten, handgeschreven
// onderschriften. Elk datablok voelt als een net-ontwikkelde foto met bijschrift.
// Neutraal warm palet (#ece7df) met kaart-wit #fdfcf9, inkt #2a2723, één analoog accent #d9603f.
// Fonts: --font-lab-manrope (tekst) + --font-lab-architects (handschrift-captions) + --font-lab-mono (cijfers).

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
  Camera,
  Paperclip,
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

// Instant-film palet — warm papier, emulsie-wit, inkt, één analoog oranje-accent.
const C = {
  paper: "#ece7df",
  paperDeep: "#e2dcd0",
  film: "#fdfcf9",
  filmEdge: "#f4efe6",
  ink: "#2a2723",
  fg: "#3b362f",
  fgSoft: "#726a5d",
  muted: "#9c9384",
  faint: "#c3baa9",
  line: "#ddd4c4",
  lineSoft: "#e8e0d2",
  accent: "#d9603f",
  accentSoft: "#f6ddd2",
  accentDeep: "#b8481f",
  glowTeal: "#bfe0d6",
  glowGold: "#f0d9a8",
};

const sans = { fontFamily: "var(--font-lab-manrope), Helvetica, Arial, sans-serif" };
const hand = { fontFamily: "var(--font-lab-architects), 'Comic Sans MS', cursive" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9603f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ece7df]";

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

// De chemische randgloed die instant-film kenmerkt — subtiel, langs de bovenrand van de foto.
const FILM_GLOW =
  "linear-gradient(180deg, rgba(191,224,214,0.35) 0%, rgba(240,217,168,0.14) 26%, rgba(253,252,249,0) 52%)";

// ---- Primitives -------------------------------------------------------------

// Handgeschreven bijschrift — de stem in de onderrand van elke foto.
function Caption({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={className} style={{ ...hand, color: C.fgSoft, ...style }}>
      {children}
    </span>
  );
}

// Mono-kicker — kleine technische regel, als filmstroken-code.
function Kicker({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    <span
      className="text-[10.5px] font-semibold uppercase tracking-[0.2em]"
      style={{ ...mono, color: accent ? C.accent : C.muted }}
    >
      {children}
    </span>
  );
}

// Een Polaroid-frame: emulsie-wit vlak met dikke onderrand voor het handschrift-bijschrift.
function Polaroid({
  children,
  caption,
  tilt = 0,
  className,
  glow = true,
  onClick,
  ariaLabel,
  interactive = false,
}: {
  children: ReactNode;
  caption?: ReactNode;
  tilt?: number;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  interactive?: boolean;
}) {
  const inner = (
    <>
      <div className="relative overflow-hidden" style={{ background: C.filmEdge }}>
        {glow && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-14"
            style={{ background: FILM_GLOW }}
            aria-hidden="true"
          />
        )}
        <div className="relative">{children}</div>
      </div>
      {caption !== undefined && (
        <div className="px-3 pb-3 pt-2.5">
          <Caption className="text-[14px] leading-tight">{caption}</Caption>
        </div>
      )}
    </>
  );
  const frameStyle: CSSProperties = {
    background: C.film,
    border: `1px solid ${C.line}`,
    boxShadow: "0 8px 22px -12px rgba(42,39,35,0.35), 0 2px 4px -2px rgba(42,39,35,0.14)",
    transform: tilt ? `rotate(${tilt}deg)` : undefined,
    padding: 6,
  };
  if (interactive && onClick) {
    return (
      <button
        onClick={onClick}
        aria-label={ariaLabel}
        className={`group block w-full p-0 text-left transition-transform duration-200 hover:-translate-y-1 hover:rotate-0 ${RING} ${className ?? ""}`}
        style={frameStyle}
      >
        {inner}
      </button>
    );
  }
  return (
    <div className={className} style={frameStyle}>
      {inner}
    </div>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  fg: string;
  bg: string;
  border: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: BadgeCheck,
        fg: "#2f6a4f",
        bg: "#dcefe4",
        border: "#8fc3a8",
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Hourglass,
        fg: "#6a5a2f",
        bg: "#f2e8cc",
        border: "#d3bd82",
      };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        Icon: TriangleAlert,
        fg: C.accentDeep,
        bg: C.accentSoft,
        border: C.accent,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: XCircle,
        fg: "#fdfcf9",
        bg: C.accentDeep,
        border: C.accentDeep,
      };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, fg, bg, border } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em]"
      style={{ ...sans, color: fg, background: bg, border: `1px solid ${border}` }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

function MatchTag({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const high = value >= 90;
  return (
    <span className="inline-flex items-baseline gap-1" aria-label={`Match ${value} procent`}>
      <span
        className={`font-extrabold tabular-nums leading-none ${size === "sm" ? "text-[26px]" : "text-[34px]"}`}
        style={{ ...sans, color: high ? C.accent : C.ink }}
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

function Sparkline({
  data,
  height = 30,
  color = C.ink,
}: {
  data: number[];
  height?: number;
  color?: string;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 64 - 16;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1] ?? ([0, 0] as const);
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
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r={2.6} fill={C.accent} />
    </svg>
  );
}

// Bolle instant-knop — zachte ronding, warme schaduw, hover verdiept het accent.
function ShutterButton({
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
  variant?: "solid" | "ink" | "line";
}) {
  const [hot, setHot] = useState(false);
  const bg =
    variant === "solid"
      ? hot
        ? C.accentDeep
        : C.accent
      : variant === "ink"
        ? hot
          ? "#413c34"
          : C.ink
        : hot
          ? C.paperDeep
          : C.film;
  const fg = variant === "line" ? C.ink : C.film;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[12.5px] font-bold transition-colors duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: fg,
        background: bg,
        border: variant === "line" ? `1px solid ${C.line}` : "none",
        boxShadow: variant === "line" ? "none" : "0 4px 12px -4px rgba(42,39,35,0.3)",
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
    <div className="mb-8 flex items-end gap-4">
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-[15px] font-bold tabular-nums"
        style={{ ...mono, color: C.film, background: C.ink, transform: "rotate(-3deg)" }}
        aria-hidden="true"
      >
        {SCREEN_INDEX[screenKey]}
      </span>
      <div className="min-w-0 flex-1">
        <h1
          className="text-[28px] font-extrabold leading-tight tracking-tight sm:text-[34px]"
          style={{ ...sans, color: C.ink }}
        >
          {title}
        </h1>
        {sub && <Caption className="mt-1 block text-[15px] leading-snug">{sub}</Caption>}
      </div>
    </div>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  const tilts = [-1.5, 1, -0.5, 1.5];
  return (
    <div>
      {/* Hero-foto met handgeschreven begroeting. */}
      <Polaroid tilt={-0.6} className="mb-10" caption={`Uitgelicht — ${PROFIEL.plaats}, vandaag`}>
        <div className="flex flex-wrap items-end justify-between gap-6 p-6 sm:p-8">
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
              <span style={{ color: C.accent }}>{voornaam}</span>.
            </h2>
            <p
              className="mt-4 max-w-md text-[14px] leading-relaxed"
              style={{ ...sans, color: C.fgSoft }}
            >
              Een rustig, warm overzicht van je week — elk blok als een ontwikkelde foto met een
              bijschrift dat vertelt wat telt.
            </p>
          </div>
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5"
            style={{ background: "#dcefe4", color: "#2f6a4f", border: "1px solid #8fc3a8" }}
          >
            <BadgeCheck size={16} strokeWidth={2.2} aria-hidden="true" />
            <span className="text-[12px] font-bold uppercase tracking-[0.04em]" style={sans}>
              {PROFIEL.trust}
            </span>
          </span>
        </div>
      </Polaroid>

      {/* KPI-fotokaarten, licht gestapeld en geroteerd. */}
      <div className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Polaroid key={k.label} tilt={tilts[i % tilts.length]} caption={k.label}>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-bold tabular-nums"
                  style={{ ...mono, color: C.faint }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="text-[11px] font-bold tabular-nums"
                  style={{ ...mono, color: k.up ? C.accent : C.fgSoft }}
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
              <div className="mt-3">
                <Sparkline data={k.spark} />
              </div>
            </div>
          </Polaroid>
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
          <Polaroid
            interactive
            onClick={() => onOpen(top)}
            ariaLabel={`Open ${top.titel}`}
            tilt={-0.8}
            caption={`${top.opdrachtgever} · reageert meestal binnen 6 uur`}
          >
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
                        color: C.fg,
                        background: C.filmEdge,
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
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5"
                  style={{ background: C.accent }}
                >
                  <ArrowRight
                    size={17}
                    strokeWidth={2.4}
                    style={{ color: C.film }}
                    aria-hidden="true"
                  />
                </span>
              </div>
            </div>
          </Polaroid>
        </div>

        <div>
          <div className="mb-3">
            <Kicker>Vraagt aandacht</Kicker>
          </div>
          <ul className="space-y-3">
            {ACTIES.map((a, i) => {
              const warn = a.urgentie === "warning";
              return (
                <li
                  key={a.titel}
                  className="rounded-lg p-4"
                  style={{
                    background: C.film,
                    border: `1px solid ${warn ? C.accent : C.line}`,
                    boxShadow: "0 4px 12px -8px rgba(42,39,35,0.3)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: warn ? C.accent : C.faint }}
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
                        style={{ ...sans, color: warn ? C.accent : C.ink }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                      </div>
                    </div>
                  </div>
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
  const tilts = [-0.8, 0.8, -0.5];
  return (
    <div>
      <ScreenHead
        screenKey="marktplaats"
        title="Marktplaats"
        sub="elke opdracht als foto — met een eerlijk bijschrift"
      />

      <div
        className="mb-8 flex items-center gap-3 rounded-full px-4 py-3"
        style={{
          background: C.film,
          border: `1px solid ${C.line}`,
          boxShadow: "0 4px 12px -8px rgba(42,39,35,0.25)",
        }}
      >
        <Search size={16} className="shrink-0" style={{ color: C.ink }} aria-hidden="true" />
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
            style={{ ...sans, color: C.accent }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Polaroid tilt={-0.6} caption="niets gevonden — probeer iets anders">
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Camera size={30} strokeWidth={1.8} style={{ color: C.accent }} aria-hidden="true" />
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
              <ShutterButton onClick={() => setQuery("")} variant="line">
                Filter wissen
              </ShutterButton>
            </div>
          </div>
        </Polaroid>
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <Polaroid
                interactive
                onClick={() => onOpen(o)}
                ariaLabel={`Open ${o.titel}`}
                tilt={tilts[i % tilts.length]}
                caption={`${o.opdrachtgever} · ${o.start}`}
              >
                <div className="p-5">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className="text-[12px] font-bold tabular-nums"
                      style={{ ...mono, color: C.faint }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Kicker>{o.id}</Kicker>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <h3
                      className="text-[18px] font-extrabold leading-tight tracking-tight"
                      style={{ ...sans, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <MatchTag value={o.match} size="sm" />
                  </div>
                  <dl
                    className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[12px]"
                    style={{ ...sans, color: C.fgSoft }}
                  >
                    {[
                      { Icon: MapPin, v: o.plaats },
                      { Icon: Wallet, v: o.tarief },
                      { Icon: Clock, v: o.uren },
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
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                        style={{
                          ...sans,
                          color: C.fg,
                          background: C.filmEdge,
                          border: `1px solid ${C.line}`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div
                    className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold"
                    style={{ ...sans, color: C.accent }}
                  >
                    Bekijk opdracht
                    <ArrowRight
                      size={13}
                      strokeWidth={2.4}
                      className="transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </Polaroid>
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
        <ShutterButton onClick={onBack} variant="line" ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
          Terug
        </ShutterButton>
      </div>

      <Polaroid
        tilt={-0.5}
        className="mb-8"
        caption={`${opdracht.opdrachtgever} · ${opdracht.plaats}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-5 p-6 sm:p-8">
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
      </Polaroid>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
          { Icon: Clock, label: "Inzet", value: opdracht.uren },
          { Icon: Calendar, label: "Start", value: opdracht.start },
          { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-lg p-4"
            style={{
              background: C.film,
              border: `1px solid ${C.line}`,
              boxShadow: "0 4px 12px -10px rgba(42,39,35,0.3)",
            }}
          >
            <m.Icon size={15} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
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
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Polaroid tilt={-0.4} caption="waarom deze past bij jou">
          <div className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <Check size={16} strokeWidth={2.6} style={{ color: "#2f6a4f" }} aria-hidden="true" />
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
                    strokeWidth={2.6}
                    className="mt-0.5 shrink-0"
                    style={{ color: "#2f6a4f" }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </Polaroid>
        <Polaroid tilt={0.4} caption="hier even op letten">
          <div className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <TriangleAlert
                size={16}
                strokeWidth={2.2}
                style={{ color: C.accent }}
                aria-hidden="true"
              />
              <span className="text-[13px] font-bold" style={{ ...sans, color: C.ink }}>
                Even op letten
              </span>
            </div>
            <ul className="space-y-0">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 py-2.5 text-[13.5px]"
                  style={{ ...sans, color: C.fg, borderTop: `1px solid ${C.accentSoft}` }}
                >
                  <TriangleAlert
                    size={16}
                    strokeWidth={2.2}
                    className="mt-0.5 shrink-0"
                    style={{ color: C.accent }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </Polaroid>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <ShutterButton
          onClick={() => setApplied((v) => !v)}
          ariaPressed={applied}
          className="px-6 py-3"
        >
          {applied ? (
            <Check size={16} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <Camera size={16} strokeWidth={2.2} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </ShutterButton>
        {applied && (
          <Caption className="text-[14px]">de opdrachtgever reageert meestal binnen 6 uur</Caption>
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
  const tilts = [-0.8, 0.8, -0.5, 0.6];
  return (
    <div>
      <ScreenHead
        screenKey="verificatie"
        title="Verificatie"
        sub="elke status met eigen vorm, label én icoon — nooit alleen kleur"
      />

      <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, fg, bg, border } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 rounded-full px-3.5 py-2.5"
              style={{ color: fg, background: bg, border: `1px solid ${border}` }}
            >
              <Icon size={16} strokeWidth={2.4} aria-hidden="true" />
              <span className="text-[12px] font-bold uppercase tracking-[0.03em]" style={sans}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Polaroid
        tilt={-0.4}
        className="mb-8"
        caption="veilig bewaard — alleen met jouw toestemming gedeeld"
      >
        <div className="flex items-start gap-4 p-5">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ background: "#dcefe4", color: "#2f6a4f", border: "1px solid #8fc3a8" }}
          >
            <BadgeCheck size={22} strokeWidth={2.2} aria-hidden="true" />
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
      </Polaroid>

      <div className="mb-3">
        <Kicker accent>Certificaten</Kicker>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CREDENTIALS.map((c, i) => {
          const done = checked.has(c.naam);
          return (
            <li key={c.naam}>
              <Polaroid tilt={tilts[i % tilts.length]} caption={c.detail}>
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${C.line}`,
                      background: done ? C.ink : "transparent",
                    }}
                  >
                    {done && (
                      <Check
                        size={13}
                        strokeWidth={2.6}
                        style={{ color: C.film }}
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
                  </div>
                  <StatusPill status={c.status} />
                </div>
              </Polaroid>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties({ done, toggleDone }: { done: Set<string>; toggleDone: (t: string) => void }) {
  const openCount = ACTIES.filter((a) => !done.has(a.titel)).length;
  const tilts = [-0.6, 0.6, -0.4];
  return (
    <div>
      <ScreenHead screenKey="acties" title="Acties" sub="wat vandaag om aandacht vraagt" />

      {openCount === 0 ? (
        <Polaroid tilt={-0.5} caption="niets meer te doen vandaag">
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "#dcefe4", color: "#2f6a4f" }}
            >
              <Check size={24} strokeWidth={2.6} aria-hidden="true" />
            </span>
            <h3
              className="text-[22px] font-extrabold tracking-tight"
              style={{ ...sans, color: C.ink }}
            >
              Alles afgerond
            </h3>
            <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
              Het fotoalbum is bij — alles staat op zijn plek.
            </p>
          </div>
        </Polaroid>
      ) : (
        <>
          <div className="mb-6 flex items-baseline gap-3">
            <span
              className="text-[46px] font-extrabold tabular-nums leading-none"
              style={{ ...sans, color: C.accent }}
            >
              {String(openCount).padStart(2, "0")}
            </span>
            <Caption className="text-[16px]">
              {openCount === 1 ? "actie open" : "acties open"}
            </Caption>
          </div>

          <ul className="space-y-4">
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <li key={a.titel}>
                  <Polaroid tilt={isDone ? 0 : tilts[i % tilts.length]} caption={a.detail}>
                    <div className="flex items-start gap-4 p-5">
                      <button
                        onClick={() => toggleDone(a.titel)}
                        aria-pressed={isDone}
                        aria-label={
                          isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`
                        }
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${RING}`}
                        style={{
                          border: `1.5px solid ${C.line}`,
                          background: isDone ? C.ink : "transparent",
                        }}
                      >
                        {isDone && (
                          <Check
                            size={13}
                            strokeWidth={2.6}
                            style={{ color: C.film }}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                      <span
                        className="mt-0.5 text-[13px] font-bold tabular-nums"
                        style={{ ...mono, color: isDone ? C.faint : warn ? C.accent : C.muted }}
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
                        {!isDone && (
                          <span
                            className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold"
                            style={{ ...sans, color: warn ? C.accent : C.ink }}
                          >
                            {a.cta}
                            <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                          </span>
                        )}
                      </div>
                    </div>
                  </Polaroid>
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
  const statusStyle = (status: string): { fg: string; bg: string; border: string } => {
    if (status === "Betaald") return { fg: "#2f6a4f", bg: "#dcefe4", border: "#8fc3a8" };
    if (status === "Openstaand") return { fg: C.accentDeep, bg: C.accentSoft, border: C.accent };
    return { fg: C.fgSoft, bg: C.filmEdge, border: C.line };
  };
  return (
    <div>
      <ScreenHead screenKey="facturen" title="Facturen" sub="overzichtelijk en zonder gedoe" />

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", accent: false },
          { label: "Openstaand", value: "€ 1.350", accent: true },
          { label: "Concept", value: "€ 880", accent: false },
        ].map((s, i) => (
          <Polaroid key={s.label} tilt={i % 2 === 0 ? -0.6 : 0.6} caption={s.label}>
            <div className="p-4">
              <div
                className="text-[26px] font-extrabold tabular-nums leading-none"
                style={{ ...sans, color: s.accent ? C.accent : C.ink }}
              >
                {s.value}
              </div>
            </div>
          </Polaroid>
        ))}
        <Polaroid tilt={-0.5} caption="per factuur">
          <div className="p-4">
            <Sparkline data={trend} height={44} />
          </div>
        </Polaroid>
      </div>

      <Polaroid tilt={-0.3} caption="je facturen op een rij">
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
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{
                          ...sans,
                          color: st.fg,
                          background: st.bg,
                          border: `1px solid ${st.border}`,
                        }}
                      >
                        {f.status}
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
      </Polaroid>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept292() {
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
      className="min-h-[680px] w-full antialiased"
      style={{ ...sans, color: C.fg, background: C.paper }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-md"
              style={{
                background: C.film,
                border: `1px solid ${C.line}`,
                transform: "rotate(-4deg)",
                boxShadow: "0 4px 10px -6px rgba(42,39,35,0.35)",
              }}
              aria-hidden="true"
            >
              <span
                className="pointer-events-none absolute inset-x-0 top-0 h-4"
                style={{ background: FILM_GLOW }}
              />
              <Camera size={18} strokeWidth={2.2} style={{ color: C.accent }} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[17px] font-extrabold tracking-tight"
                style={{ ...sans, color: C.ink }}
              >
                Instant
              </div>
              <Caption className="text-[12px]">zzp platform</Caption>
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
                <BadgeCheck size={12} strokeWidth={2.2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-md text-[12px] font-bold"
              style={{ ...sans, color: C.film, background: C.ink, transform: "rotate(3deg)" }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
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
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: on ? C.film : C.fgSoft,
                  background: on ? C.ink : C.film,
                  border: `1px solid ${on ? C.ink : C.line}`,
                  boxShadow: on ? "0 4px 10px -6px rgba(42,39,35,0.4)" : "none",
                }}
              >
                <span
                  className="text-[10px] font-bold tabular-nums"
                  style={{ ...mono, color: on ? C.accent : C.faint }}
                >
                  {SCREEN_INDEX[s.key]}
                </span>
                <span className="text-[12.5px] font-bold">{s.label}</span>
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
          className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[10.5px]"
          style={{ ...mono, color: C.muted, borderColor: C.line }}
        >
          <span className="inline-flex items-center gap-2">
            <Paperclip size={12} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
            {SCREENS.length} schermen · instant v292
          </span>
          <span className="uppercase tracking-[0.14em]">Emulsie · handschrift · gloed</span>
        </footer>
      </div>
    </div>
  );
}
