"use client";

// Concept 291 — "Futurisme" · Italiaans futurisme / dynamisme (licht, energiek).
// Signature: krachtlijnen (force-lines) en scherpe diagonalen als dragende compositie —
// gekantelde, gefragmenteerde koppen die snelheid suggereren, overlappende bewegingsvlakken,
// schuine accentbalken en pijl-motieven. Eén fel vermiljoen (#e8481f) op warm gebroken-wit
// (#f7f3ec), inkt #1a1613. Alles helt lichtjes; niets staat stil.
// Fonts: --font-lab-anton (dynamische display-kop) + --font-lab-geist (tekst) + --font-lab-mono (cijfers).

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  Search,
  MapPin,
  Wallet,
  Clock,
  Calendar,
  Check,
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  BadgeCheck,
  TriangleAlert,
  XCircle,
  Hourglass,
  Zap,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// Futuristisch palet — warm papier, inkt, één fel vermiljoen. Geen tweede kleur.
const C = {
  paper: "#f7f3ec",
  paperDeep: "#efe8dc",
  card: "#fdfbf6",
  ink: "#1a1613",
  fg: "#2b241d",
  fgSoft: "#6a6055",
  muted: "#948a7c",
  faint: "#c4b9a8",
  line: "#1a1613",
  lineSoft: "#ddd2c0",
  vermiljoen: "#e8481f",
  vermiljoenSoft: "#fbe3da",
  vermiljoenDeep: "#c23611",
};

const display = { fontFamily: "var(--font-lab-anton), Impact, sans-serif" };
const sans = { fontFamily: "var(--font-lab-geist), Helvetica, Arial, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8481f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f3ec]";

// Elke schermsleutel krijgt een gekanteld index-getal — futuristische nummering.
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

// Krachtlijnen — parallelle diagonale strepen die beweging/snelheid suggereren.
function ForceLines({
  count = 6,
  color = C.vermiljoen,
  className,
  opacity = 1,
}: {
  count?: number;
  color?: string;
  className?: string;
  opacity?: number;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ opacity }}
    >
      {Array.from({ length: count }).map((_, i) => {
        const gap = 120 / count;
        const x = i * gap + 4;
        return (
          <line
            key={i}
            x1={x}
            y1={120}
            x2={x + 46}
            y2={0}
            stroke={color}
            strokeWidth={i % 2 === 0 ? 2 : 1}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}

// Mono-kicker met vooruitwijzende pijl — de futuristische bijschrift-stem.
function Kicker({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.24em]"
      style={{ ...mono, color: accent ? C.vermiljoen : C.muted }}
    >
      <span
        className="inline-block h-[1.5px] w-4 -skew-y-[8deg]"
        style={{ background: accent ? C.vermiljoen : C.faint }}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

// Gekantelde display-kop — de kern van de futuristische energie.
function Velocity({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={className}
      style={{ ...display, letterSpacing: "0.01em", lineHeight: 0.92, ...style }}
    >
      {children}
    </span>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  variant: "ink" | "line" | "warn" | "reject";
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, variant: "ink" };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Hourglass, variant: "line" };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, variant: "warn" };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, variant: "reject" };
  }
}

function statusStyle(variant: "ink" | "line" | "warn" | "reject"): CSSProperties {
  switch (variant) {
    case "ink":
      return { color: C.paper, background: C.ink, border: `1.5px solid ${C.ink}` };
    case "line":
      return { color: C.ink, background: C.card, border: `1.5px solid ${C.line}` };
    case "warn":
      return {
        color: C.vermiljoenDeep,
        background: C.vermiljoenSoft,
        border: `1.5px solid ${C.vermiljoen}`,
      };
    case "reject":
      return { color: C.paper, background: C.vermiljoen, border: `1.5px solid ${C.vermiljoen}` };
  }
}

// Schuine status-badge — helt mee met de futuristische diagonaal.
function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, variant } = statusMeta(status);
  return (
    <span
      className="inline-flex -skew-x-[9deg] items-center gap-1.5 px-2.5 py-1"
      style={statusStyle(variant)}
    >
      <span className="inline-flex skew-x-[9deg] items-center gap-1.5">
        <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={sans}>
          {label}
        </span>
      </span>
    </span>
  );
}

function MatchTag({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const high = value >= 90;
  return (
    <span
      className="inline-flex items-baseline gap-1"
      aria-label={`Match ${value} procent`}
      style={{ transform: "skewX(-6deg)" }}
    >
      <Velocity
        className={size === "sm" ? "text-[30px]" : "text-[42px]"}
        style={{ color: high ? C.vermiljoen : C.ink }}
      >
        {value}
      </Velocity>
      <span
        className="text-[9px] font-bold uppercase tracking-[0.14em]"
        style={{ ...mono, color: C.muted }}
      >
        % match
      </span>
    </span>
  );
}

// Bewegingslijn — sparkline met een schuine puntmarkering aan de kop.
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
    const y = 100 - ((v - min) / span) * 66 - 14;
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
      <polyline
        points={pts
          .slice(-2)
          .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
          .join(" ")}
        fill="none"
        stroke={C.vermiljoen}
        strokeWidth={2.6}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <rect
        x={last[0] - 2.4}
        y={last[1] - 2.4}
        width={4.8}
        height={4.8}
        fill={C.vermiljoen}
        transform={`rotate(45 ${last[0]} ${last[1]})`}
      />
    </svg>
  );
}

// Gevuld vermiljoen-primary — schuine parallellogram-vorm, hover versnelt de pijl.
function DriveButton({
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
        ? C.vermiljoenDeep
        : C.vermiljoen
      : variant === "ink"
        ? hot
          ? C.vermiljoen
          : C.ink
        : hot
          ? C.ink
          : "transparent";
  const fg = variant === "line" ? (hot ? C.paper : C.ink) : C.paper;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`group inline-flex -skew-x-[10deg] items-center justify-center gap-2 px-5 py-2.5 transition-colors duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: fg,
        background: bg,
        border: variant === "line" ? `1.5px solid ${C.line}` : "none",
      }}
    >
      <span className="inline-flex skew-x-[10deg] items-center gap-2 text-[12.5px] font-bold uppercase tracking-[0.06em]">
        {children}
      </span>
    </button>
  );
}

// Futuristische sectiekop — enorm gekanteld indexgetal + krachtlijnen erachter.
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
    <div className="relative mb-9 overflow-hidden">
      <ForceLines
        count={7}
        className="pointer-events-none absolute -right-6 top-1/2 h-40 w-40 -translate-y-1/2"
        opacity={0.1}
      />
      <div className="relative flex items-end gap-4">
        <Velocity
          className="shrink-0 text-[64px] sm:text-[86px]"
          style={{ color: C.vermiljoen, transform: "skewX(-8deg)" }}
        >
          {SCREEN_INDEX[screenKey]}
        </Velocity>
        <div className="min-w-0 flex-1 pb-2">
          <Velocity className="block text-[30px] uppercase sm:text-[42px]" style={{ color: C.ink }}>
            {title}
          </Velocity>
          {sub && (
            <p
              className="mt-2 max-w-xl text-[13.5px] leading-relaxed"
              style={{ ...sans, color: C.fgSoft }}
            >
              {sub}
            </p>
          )}
        </div>
      </div>
      <div
        className="mt-4 h-[3px] w-full origin-left -skew-y-[0.6deg]"
        style={{ background: C.ink }}
        aria-hidden="true"
      />
    </div>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      {/* Hero — overlappende bewegingsvlakken met gefragmenteerde kop. */}
      <div
        className="relative mb-10 overflow-hidden"
        style={{ background: C.card, border: `1.5px solid ${C.line}` }}
      >
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-2/3 origin-top-right -skew-x-[14deg]"
          style={{ background: C.paperDeep }}
          aria-hidden="true"
        />
        <ForceLines
          count={9}
          className="pointer-events-none absolute -right-10 -top-4 h-[130%] w-1/2"
          opacity={0.16}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6 p-6 sm:p-8">
          <div className="min-w-0">
            <Kicker accent>
              {PROFIEL.plaats} · {PROFIEL.rol}
            </Kicker>
            <div className="mt-4">
              <Velocity
                className="block text-[42px] uppercase sm:text-[62px]"
                style={{ color: C.ink }}
              >
                Goedemorgen,
              </Velocity>
              <Velocity
                className="block text-[42px] uppercase sm:text-[62px]"
                style={{ color: C.vermiljoen, transform: "skewX(-7deg)" }}
              >
                {voornaam}
              </Velocity>
            </div>
            <p
              className="mt-4 max-w-md text-[13.5px] leading-relaxed"
              style={{ ...sans, color: C.fgSoft }}
            >
              Vaart houden. Alleen wat vandaag beweegt en actie vraagt — scherp en zonder ruis
              gerangschikt.
            </p>
          </div>
          <div
            className="flex -skew-x-[9deg] items-center gap-2.5 px-4 py-2.5"
            style={{ background: C.ink, color: C.paper }}
          >
            <span className="flex skew-x-[9deg] items-center gap-2">
              <BadgeCheck size={16} strokeWidth={2.2} aria-hidden="true" />
              <span className="text-[12px] font-bold uppercase tracking-[0.06em]" style={sans}>
                {PROFIEL.trust}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* KPI-band — gekantelde cellen, enorme cijfers, bewegingslijnen. */}
      <div className="mb-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <div
            key={k.label}
            className="relative overflow-hidden p-4"
            style={{ background: C.card, border: `1.5px solid ${C.line}` }}
          >
            <div
              className="absolute left-0 top-0 h-full w-[4px]"
              style={{ background: i === 0 ? C.vermiljoen : C.lineSoft }}
              aria-hidden="true"
            />
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-bold tabular-nums"
                style={{ ...mono, color: C.faint }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                style={{ ...mono, color: k.up ? C.vermiljoen : C.fgSoft }}
              >
                {k.up && <ArrowUpRight size={11} strokeWidth={2.6} aria-hidden="true" />}
                {k.trend}
              </span>
            </div>
            <Velocity className="mt-3 block text-[30px]" style={{ color: C.ink }}>
              {k.value}
            </Velocity>
            <div className="mt-1 text-[11px]" style={{ ...sans, color: C.fgSoft }}>
              {k.label}
            </div>
            <div className="mt-2">
              <Sparkline data={k.spark} color={C.ink} />
            </div>
          </div>
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
            className={`group relative block w-full overflow-hidden p-6 text-left transition-transform duration-200 hover:-translate-y-0.5 ${RING}`}
            style={{ background: C.ink, color: C.paper }}
          >
            <ForceLines
              count={8}
              color={C.vermiljoen}
              className="pointer-events-none absolute -right-6 -top-4 h-[150%] w-1/2"
              opacity={0.28}
            />
            <span className="relative flex items-start justify-between gap-5">
              <span className="min-w-0 flex-1">
                <Velocity className="block text-[26px] uppercase" style={{ color: C.paper }}>
                  {top.titel}
                </Velocity>
                <span className="mt-2 block text-[13px]" style={{ ...sans, color: "#d8cdbd" }}>
                  {top.opdrachtgever} · {top.plaats} · {top.tarief}
                </span>
                <span className="mt-4 flex flex-wrap gap-1.5">
                  {top.tags.map((t) => (
                    <span
                      key={t}
                      className="-skew-x-[9deg] px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{
                        ...sans,
                        color: C.paper,
                        border: "1px solid rgba(247,243,236,0.35)",
                      }}
                    >
                      <span className="inline-block skew-x-[9deg]">{t}</span>
                    </span>
                  ))}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-3">
                <span
                  style={{ transform: "skewX(-6deg)" }}
                  className="inline-flex items-baseline gap-1"
                >
                  <Velocity className="text-[42px]" style={{ color: C.vermiljoen }}>
                    {top.match}
                  </Velocity>
                  <span
                    className="text-[9px] font-bold uppercase tracking-[0.14em]"
                    style={{ ...mono, color: "#d8cdbd" }}
                  >
                    % match
                  </span>
                </span>
                <span
                  className="flex h-10 w-10 -skew-x-[10deg] items-center justify-center transition-transform group-hover:translate-x-1"
                  style={{ background: C.vermiljoen }}
                >
                  <ArrowRight
                    size={20}
                    strokeWidth={2.4}
                    className="skew-x-[10deg]"
                    style={{ color: C.paper }}
                    aria-hidden="true"
                  />
                </span>
              </span>
            </span>
          </button>

          <div
            className="mt-4 flex items-start gap-4 p-5"
            style={{ background: C.card, border: `1.5px solid ${C.line}` }}
          >
            <span
              className="flex h-10 w-10 shrink-0 -skew-x-[10deg] items-center justify-center"
              style={{ background: C.vermiljoenSoft }}
            >
              <BadgeCheck
                size={20}
                strokeWidth={2.2}
                className="skew-x-[10deg]"
                style={{ color: C.vermiljoen }}
                aria-hidden="true"
              />
            </span>
            <div>
              <div className="text-[14px] font-bold" style={{ ...sans, color: C.ink }}>
                {PROFIEL.trust}
              </div>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ ...sans, color: C.fgSoft }}>
                Je documenten zijn geverifieerd — opdrachtgevers zien meteen dat je te vertrouwen
                bent.
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3">
            <Kicker>Vraagt aandacht</Kicker>
          </div>
          <ul className="space-y-2.5">
            {ACTIES.map((a, i) => {
              const warn = a.urgentie === "warning";
              return (
                <li
                  key={a.titel}
                  className="relative overflow-hidden p-4"
                  style={{
                    background: C.card,
                    border: `1.5px solid ${warn ? C.vermiljoen : C.lineSoft}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: warn ? C.vermiljoen : C.faint }}
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
                        className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.04em]"
                        style={{ ...sans, color: warn ? C.vermiljoen : C.ink }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
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
  return (
    <div>
      <ScreenHead
        screenKey="marktplaats"
        title="Marktplaats"
        sub="Eerlijk geordend en met vaart: waarom een opdracht past — en waar het schuurt."
      />

      <div
        className="mb-8 flex -skew-x-[3deg] items-center gap-3 px-4 py-3"
        style={{ background: C.card, border: `1.5px solid ${C.line}` }}
      >
        <span className="flex w-full skew-x-[3deg] items-center gap-3">
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
              className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em] ${RING}`}
              style={{ ...sans, color: C.vermiljoen }}
            >
              Wis
            </button>
          )}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 px-6 py-20 text-center"
          style={{ background: C.card, border: `1.5px solid ${C.line}` }}
        >
          <Search size={30} strokeWidth={1.8} style={{ color: C.vermiljoen }} aria-hidden="true" />
          <Velocity className="text-[24px] uppercase" style={{ color: C.ink }}>
            Geen resultaten
          </Velocity>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="mt-1">
            <DriveButton onClick={() => setQuery("")} variant="line">
              Filter wissen
            </DriveButton>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <button
                onClick={() => onOpen(o)}
                className={`group relative block w-full overflow-hidden p-5 text-left transition-transform duration-200 hover:-translate-y-0.5 ${RING}`}
                style={{ background: C.card, border: `1.5px solid ${C.line}` }}
              >
                <div
                  className="absolute left-0 top-0 h-full w-[5px] origin-top -skew-y-[6deg]"
                  style={{ background: o.match >= 90 ? C.vermiljoen : C.lineSoft }}
                  aria-hidden="true"
                />
                <div className="grid grid-cols-1 gap-4 pl-3 sm:grid-cols-[1fr,auto] sm:items-start">
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
                    <Velocity className="block text-[21px] uppercase" style={{ color: C.ink }}>
                      {o.titel}
                    </Velocity>
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
                      className="inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.05em]"
                      style={{ ...sans, color: C.vermiljoen }}
                    >
                      Bekijk
                      <ArrowRight
                        size={13}
                        strokeWidth={2.6}
                        className="transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </div>
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
        <DriveButton onClick={onBack} variant="line" ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={14} strokeWidth={2.6} aria-hidden="true" />
          Terug
        </DriveButton>
      </div>

      <div
        className="relative mb-6 overflow-hidden p-6 sm:p-8"
        style={{ background: C.ink, color: C.paper }}
      >
        <ForceLines
          count={10}
          color={C.vermiljoen}
          className="pointer-events-none absolute -right-8 -top-6 h-[160%] w-1/2"
          opacity={0.24}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <Kicker accent>{opdracht.id}</Kicker>
            <Velocity
              className="mt-3 block text-[32px] uppercase sm:text-[46px]"
              style={{ color: C.paper }}
            >
              {opdracht.titel}
            </Velocity>
            <div className="mt-2 text-[14px]" style={{ ...sans, color: "#d8cdbd" }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </div>
          </div>
          <span style={{ transform: "skewX(-6deg)" }} className="inline-flex items-baseline gap-1">
            <Velocity className="text-[54px]" style={{ color: C.vermiljoen }}>
              {opdracht.match}
            </Velocity>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: "#d8cdbd" }}
            >
              % match
            </span>
          </span>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
          { Icon: Clock, label: "Inzet", value: opdracht.uren },
          { Icon: Calendar, label: "Start", value: opdracht.start },
          { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
        ].map((m) => (
          <div
            key={m.label}
            className="p-4"
            style={{ background: C.card, border: `1.5px solid ${C.line}` }}
          >
            <m.Icon size={15} strokeWidth={2} style={{ color: C.vermiljoen }} aria-hidden="true" />
            <div
              className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em]"
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
        <div className="p-5" style={{ background: C.card, border: `1.5px solid ${C.line}` }}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 -skew-x-[10deg] items-center justify-center"
              style={{ background: C.ink }}
            >
              <Check
                size={13}
                strokeWidth={2.8}
                className="skew-x-[10deg]"
                style={{ color: C.paper }}
                aria-hidden="true"
              />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.04em]"
              style={{ ...sans, color: C.ink }}
            >
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
                  style={{ color: C.ink }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5" style={{ background: C.card, border: `1.5px solid ${C.vermiljoen}` }}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 -skew-x-[10deg] items-center justify-center"
              style={{ background: C.vermiljoen }}
            >
              <TriangleAlert
                size={13}
                strokeWidth={2.4}
                className="skew-x-[10deg]"
                style={{ color: C.paper }}
                aria-hidden="true"
              />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.04em]"
              style={{ ...sans, color: C.vermiljoenDeep }}
            >
              Even op letten
            </span>
          </div>
          <ul className="space-y-0">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 py-2.5 text-[13.5px]"
                style={{ ...sans, color: C.fg, borderTop: `1px solid ${C.vermiljoenSoft}` }}
              >
                <TriangleAlert
                  size={16}
                  strokeWidth={2.2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.vermiljoen }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <DriveButton
          onClick={() => setApplied((v) => !v)}
          ariaPressed={applied}
          className="px-6 py-3"
        >
          {applied ? (
            <Check size={16} strokeWidth={2.8} aria-hidden="true" />
          ) : (
            <Zap size={16} strokeWidth={2.4} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </DriveButton>
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
          const { label, Icon, variant } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex -skew-x-[7deg] items-center gap-2.5 px-3.5 py-3"
              style={statusStyle(variant)}
            >
              <span className="flex skew-x-[7deg] items-center gap-2.5">
                <Icon size={16} strokeWidth={2.4} aria-hidden="true" />
                <span className="text-[12px] font-bold uppercase tracking-[0.04em]" style={sans}>
                  {label}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <div
        className="mb-8 flex items-start gap-4 p-5"
        style={{ background: C.ink, color: C.paper }}
      >
        <span
          className="flex h-11 w-11 shrink-0 -skew-x-[10deg] items-center justify-center"
          style={{ background: C.vermiljoen }}
        >
          <BadgeCheck
            size={22}
            strokeWidth={2.2}
            className="skew-x-[10deg]"
            style={{ color: C.paper }}
            aria-hidden="true"
          />
        </span>
        <div>
          <div className="text-[15px] font-bold" style={{ ...sans, color: C.paper }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-1 text-[13px]" style={{ ...sans, color: "#d8cdbd" }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </div>

      <div className="mb-3">
        <Kicker accent>Certificaten</Kicker>
      </div>
      <ul className="space-y-2.5">
        {CREDENTIALS.map((c, i) => {
          const done = checked.has(c.naam);
          return (
            <li
              key={c.naam}
              className="flex items-center gap-4 p-4"
              style={{ background: C.card, border: `1.5px solid ${C.line}` }}
            >
              <button
                onClick={() => toggleCheck(c.naam)}
                aria-pressed={done}
                aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                className={`flex h-6 w-6 shrink-0 -skew-x-[10deg] items-center justify-center transition-colors ${RING}`}
                style={{
                  border: `1.5px solid ${C.line}`,
                  background: done ? C.ink : "transparent",
                }}
              >
                {done && (
                  <Check
                    size={13}
                    strokeWidth={2.8}
                    className="skew-x-[10deg]"
                    style={{ color: C.paper }}
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
      <ScreenHead
        screenKey="acties"
        title="Acties"
        sub="Wat vandaag om aandacht vraagt — in volgorde van vaart."
      />

      {openCount === 0 ? (
        <div
          className="flex flex-col items-center gap-3 px-6 py-20 text-center"
          style={{ background: C.card, border: `1.5px solid ${C.line}` }}
        >
          <span
            className="flex h-12 w-12 -skew-x-[10deg] items-center justify-center"
            style={{ background: C.ink }}
          >
            <Check
              size={24}
              strokeWidth={2.6}
              className="skew-x-[10deg]"
              style={{ color: C.paper }}
              aria-hidden="true"
            />
          </span>
          <Velocity className="text-[24px] uppercase" style={{ color: C.ink }}>
            Alles afgerond
          </Velocity>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.muted }}>
            Niets meer te doen vandaag. De baan is vrij.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-baseline gap-3" style={{ transform: "skewX(-6deg)" }}>
            <Velocity className="text-[48px]" style={{ color: C.vermiljoen }}>
              {String(openCount).padStart(2, "0")}
            </Velocity>
            <span
              className="text-[12px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.muted }}
            >
              {openCount === 1 ? "actie open" : "acties open"}
            </span>
          </div>

          <ul className="space-y-3">
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <li
                  key={a.titel}
                  className="relative flex items-start gap-4 overflow-hidden p-5"
                  style={{
                    background: C.card,
                    border: `1.5px solid ${warn && !isDone ? C.vermiljoen : C.lineSoft}`,
                  }}
                >
                  <div
                    className="absolute left-0 top-0 h-full w-[4px] origin-top -skew-y-[6deg]"
                    style={{ background: isDone ? C.faint : warn ? C.vermiljoen : C.ink }}
                    aria-hidden="true"
                  />
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 -skew-x-[10deg] items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${C.line}`,
                      background: isDone ? C.ink : "transparent",
                    }}
                  >
                    {isDone && (
                      <Check
                        size={13}
                        strokeWidth={2.8}
                        className="skew-x-[10deg]"
                        style={{ color: C.paper }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                  <span
                    className="mt-0.5 text-[13px] font-bold tabular-nums"
                    style={{ ...mono, color: isDone ? C.faint : warn ? C.vermiljoen : C.muted }}
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
                        className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.04em]"
                        style={{ ...sans, color: warn ? C.vermiljoen : C.ink }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
                      </span>
                    )}
                  </div>
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
  const statusColor = (status: string): string => (status === "Openstaand" ? C.vermiljoen : C.ink);
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Facturen"
        sub="Overzichtelijk en zonder gedoe — zodat je weet waar je aan toe bent."
      />

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-4">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", accent: false },
          { label: "Openstaand", value: "€ 1.350", accent: true },
          { label: "Concept", value: "€ 880", accent: false },
        ].map((s) => (
          <div
            key={s.label}
            className="p-4"
            style={{
              background: C.card,
              border: `1.5px solid ${s.accent ? C.vermiljoen : C.line}`,
            }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.muted }}
            >
              {s.label}
            </div>
            <Velocity
              className="mt-2 block text-[28px]"
              style={{ color: s.accent ? C.vermiljoen : C.ink }}
            >
              {s.value}
            </Velocity>
          </div>
        ))}
        <div className="flex flex-col justify-between p-4" style={{ background: C.ink }}>
          <div
            className="text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ ...mono, color: "#d8cdbd" }}
          >
            Per factuur
          </div>
          <Sparkline data={trend} height={44} color={C.paper} />
        </div>
      </div>

      <div
        className="overflow-x-auto"
        style={{ border: `1.5px solid ${C.line}`, background: C.card }}
      >
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr style={{ background: C.ink }}>
              {["Nr.", "Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                <th
                  key={h}
                  scope="col"
                  className="px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: "#d8cdbd", textAlign: i >= 4 ? "right" : "left" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => (
              <tr key={f.nr} style={{ borderTop: `1px solid ${C.lineSoft}` }}>
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
                    className="inline-flex -skew-x-[9deg] items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em]"
                    style={{
                      color: statusColor(f.status),
                      border: `1.5px solid ${statusColor(f.status)}`,
                    }}
                  >
                    <span className="skew-x-[9deg]">{f.status}</span>
                  </span>
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: `2px solid ${C.ink}` }}>
              <td className="px-3 py-4" />
              <td
                className="px-3 py-4 text-[11px] font-bold uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.muted }}
                colSpan={3}
              >
                Totaal
              </td>
              <td className="px-3 py-4 text-right" style={{ ...sans, color: C.ink }}>
                <Velocity className="text-[18px]">€ 7.782</Velocity>
              </td>
              <td className="px-3 py-4" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept291() {
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
              className="relative flex h-11 w-11 -skew-x-[10deg] items-center justify-center overflow-hidden"
              style={{ background: C.vermiljoen }}
              aria-hidden="true"
            >
              <ForceLines
                count={5}
                color="#ffffff"
                className="absolute inset-0 h-full w-full"
                opacity={0.35}
              />
              <Velocity className="skew-x-[10deg] text-[20px]" style={{ color: C.paper }}>
                Z
              </Velocity>
            </span>
            <div className="leading-tight">
              <Velocity className="block text-[19px] uppercase" style={{ color: C.ink }}>
                Futurisme
              </Velocity>
              <div
                className="text-[9.5px] font-bold uppercase tracking-[0.24em]"
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
                <BadgeCheck size={12} strokeWidth={2.2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 -skew-x-[10deg] items-center justify-center text-[12px] font-bold"
              style={{ ...sans, color: C.paper, background: C.ink }}
              aria-hidden="true"
            >
              <span className="skew-x-[10deg]">{PROFIEL.initialen}</span>
            </span>
          </div>
        </header>

        <div
          className="mb-6 h-[3px] w-full -skew-y-[0.5deg]"
          style={{ background: C.ink }}
          aria-hidden="true"
        />

        <nav className="mb-9 flex flex-wrap gap-2 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 -skew-x-[9deg] items-center gap-2 px-3.5 py-2.5 transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: on ? C.paper : C.fgSoft,
                  background: on ? C.ink : "transparent",
                  border: `1.5px solid ${on ? C.ink : C.lineSoft}`,
                }}
              >
                <span className="inline-flex skew-x-[9deg] items-center gap-2 text-[12.5px] font-bold uppercase tracking-[0.04em]">
                  <span
                    className="text-[10px] font-bold tabular-nums"
                    style={{ ...mono, color: on ? C.vermiljoen : C.faint }}
                  >
                    {SCREEN_INDEX[s.key]}
                  </span>
                  {s.label}
                  {on && <ChevronRight size={13} strokeWidth={2.6} aria-hidden="true" />}
                </span>
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

        <div
          className="mt-10 h-[3px] w-full -skew-y-[0.5deg]"
          style={{ background: C.ink }}
          aria-hidden="true"
        />
        <footer
          className="flex flex-wrap items-center justify-between gap-2 pt-4 text-[10.5px]"
          style={{ ...mono, color: C.muted }}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block h-2 w-4 -skew-x-[20deg]"
              style={{ background: C.vermiljoen }}
              aria-hidden="true"
            />
            {SCREENS.length} schermen · futurisme v291
          </span>
          <span className="uppercase tracking-[0.14em]">Krachtlijnen · diagonaal · vaart</span>
        </footer>
      </div>
    </div>
  );
}
