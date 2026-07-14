"use client";

// Concept 302 — "Lopende band" · kaiten-conveyor.
// Signature: matches/opdrachten schuiven als op een lopende band horizontaal voorbij (auto-scroll
// met pauze-op-hover). Warm hout + verse mint, tactiel-kinetisch. Kinetische orde: alles beweegt in
// een rustig ritme maar is streng geordend. Respecteert prefers-reduced-motion (animatie uit →
// statische strook).
// Fonts: kop --font-lab-space · tekst --font-lab-geist · cijfers --font-lab-mono.

import { useState, useEffect, type CSSProperties, type ReactNode } from "react";
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
  Pause,
  Play,
  Boxes,
  ShieldCheck,
  Plus,
  Minus,
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

// Warm wood + fresh mint. A tactile conveyor: birch-warm surfaces, mint accents, deep-roast ink.
const C = {
  wood: "#efe6d6",
  woodSoft: "#e6d9c2",
  woodDark: "#d8c8a9",
  belt: "#c9b592",
  card: "#fbf6ec",
  ink: "#2a231a",
  fg: "#453b2c",
  fgSoft: "#6f6350",
  muted: "#948673",
  faint: "#bbac93",
  line: "#ddccae",
  lineSoft: "#e8dcc6",
  mint: "#159b7a",
  mintSoft: "#d3efe4",
  mintDeep: "#0d7159",
  amber: "#c8891f",
  amberSoft: "#f2e2c2",
  red: "#c4553a",
  redSoft: "#f0d9d1",
};

const display = { fontFamily: "var(--font-lab-space), Verdana, sans-serif" };
const sans = { fontFamily: "var(--font-lab-geist), Helvetica, Arial, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159b7a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe6d6]";

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

// Respect the user's motion preference. When reduced, the conveyor is a static, ordered strip.
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

// ---- Kinetic primitives -----------------------------------------------------

// The belt tread — repeating slats that give the conveyor its tactile rhythm.
function BeltTread() {
  return (
    <div
      className="flex h-3 items-stretch overflow-hidden"
      style={{ background: C.belt, borderRadius: 3 }}
      aria-hidden="true"
    >
      <div className="flex min-w-full shrink-0 items-stretch">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="h-full"
            style={{ width: 10, borderRight: `2px solid ${C.woodDark}`, opacity: 0.6 }}
          />
        ))}
      </div>
    </div>
  );
}

// A horizontal auto-scrolling conveyor. Pauses on hover/focus and respects reduced motion.
// The children are duplicated once so the CSS translate loop is seamless.
function Conveyor({
  running,
  reduced,
  children,
  duration = 26,
  ariaLabel,
}: {
  running: boolean;
  reduced: boolean;
  children: ReactNode;
  duration?: number;
  ariaLabel: string;
}) {
  const [hover, setHover] = useState(false);
  const animate = running && !reduced;
  const paused = hover || !animate;
  return (
    <div
      className="relative overflow-hidden"
      style={{ borderRadius: 12 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      role="group"
      aria-label={ariaLabel}
    >
      <div
        className="flex w-max gap-4"
        style={
          animate
            ? {
                animationName: "concept302-belt",
                animationDuration: `${duration}s`,
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                animationPlayState: paused ? "paused" : "running",
              }
            : undefined
        }
      >
        {children}
        {animate && (
          <span aria-hidden="true" className="flex gap-4">
            {children}
          </span>
        )}
      </div>
      <style>{`@keyframes concept302-belt { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

function Kicker({ children, color = C.mint }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.22em]"
      style={{ ...mono, color }}
    >
      <Boxes size={13} strokeWidth={2.2} aria-hidden="true" />
      {children}
    </span>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  color: string;
  soft: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, color: C.mint, soft: C.mintSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Hourglass, color: C.amber, soft: C.amberSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, color: C.red, soft: C.redSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.red, soft: C.redSoft };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, color, soft } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold"
      style={{ ...sans, color, background: soft, border: `1.5px solid ${color}`, borderRadius: 8 }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

function MintButton({
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
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-[12.5px] font-bold transition-all duration-150 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: C.card,
        background: hot ? C.mintDeep : C.mint,
        border: `1.5px solid ${C.mintDeep}`,
        borderRadius: 10,
        transform: hot ? "translateY(-1px)" : "none",
        boxShadow: hot ? `0 5px 12px ${C.mint}55` : `0 2px 6px ${C.mint}33`,
      }}
    >
      {children}
    </button>
  );
}

function LineButton({
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
  const [hot, setHot] = useState(false);
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
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 text-[12px] font-bold transition-colors duration-150 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: on ? C.card : C.ink,
        background: on ? C.ink : "transparent",
        border: `1.5px solid ${C.ink}`,
        borderRadius: 10,
      }}
    >
      {children}
    </button>
  );
}

// A wood-grain crate — the object that rides the belt.
function Crate({
  children,
  className,
  style,
  color,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  color?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: C.card,
        border: `1.5px solid ${color ?? C.line}`,
        borderRadius: 12,
        boxShadow: `0 2px 0 ${C.woodDark}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function MatchDial({ value, size = 58 }: { value: number; size?: number }) {
  const color = value >= 90 ? C.mint : value >= 82 ? C.amber : C.red;
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`Match ${value} procent`}
    >
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={C.lineSoft} strokeWidth={4} />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - value / 100)}
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      <text
        x={cx}
        y={cx + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        style={mono}
        fontSize={size * 0.3}
        fontWeight={700}
        fill={C.ink}
      >
        {value}
      </text>
    </svg>
  );
}

// The compact card that rides the conveyor.
function BeltCard({ o, onOpen }: { o: Opdracht; onOpen: (o: Opdracht) => void }) {
  return (
    <button
      onClick={() => onOpen(o)}
      className={`group block w-[280px] shrink-0 text-left ${RING}`}
      style={{ borderRadius: 12 }}
      aria-label={`Open opdracht ${o.titel}`}
    >
      <Crate className="p-4 transition-transform duration-150 group-hover:-translate-y-1">
        <div className="flex items-center gap-3">
          <MatchDial value={o.match} />
          <div className="min-w-0">
            <div
              className="text-[9.5px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.muted }}
            >
              {o.id}
            </div>
            <div
              className="mt-0.5 truncate text-[14.5px] font-bold leading-tight"
              style={{ ...display, color: C.ink }}
            >
              {o.titel}
            </div>
            <div className="mt-0.5 truncate text-[11.5px]" style={{ ...sans, color: C.fgSoft }}>
              {o.opdrachtgever} · {o.plaats}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[12px] font-bold" style={{ ...sans, color: C.mintDeep }}>
            {o.tarief}
          </span>
          <span
            className="inline-flex items-center gap-1 text-[11px] font-bold"
            style={{ ...sans, color: C.ink }}
          >
            Bekijk
            <ArrowRight
              size={12}
              strokeWidth={2.4}
              className="transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </Crate>
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
    <div className="mb-7">
      <div className="flex items-center gap-3">
        <span
          className="flex h-7 items-center gap-1.5 px-2.5 text-[11px] font-bold tabular-nums"
          style={{ ...mono, color: C.card, background: C.ink, borderRadius: 7 }}
          aria-hidden="true"
        >
          {SCREEN_INDEX[screenKey]}
        </span>
        <BeltTread />
      </div>
      <h1
        className="mt-3 text-[28px] font-bold leading-none tracking-tight sm:text-[36px]"
        style={{ ...display, color: C.ink }}
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

// ---- Screens ----------------------------------------------------------------

function Dashboard({
  onOpen,
  running,
  setRunning,
  reduced,
}: {
  onOpen: (o: Opdracht) => void;
  running: boolean;
  setRunning: (v: boolean) => void;
  reduced: boolean;
}) {
  const voornaam = PROFIEL.naam.split(" ")[0];
  return (
    <div>
      <Crate className="mb-7 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-6 p-6 sm:p-8">
          <div className="min-w-0">
            <Kicker>
              {PROFIEL.plaats} · {PROFIEL.rol}
            </Kicker>
            <h1
              className="mt-3 text-[36px] font-bold leading-[0.95] tracking-tight sm:text-[46px]"
              style={{ ...display, color: C.ink }}
            >
              Alles loopt, {voornaam}.
            </h1>
            <p
              className="mt-3 max-w-md text-[13.5px] leading-relaxed"
              style={{ ...sans, color: C.fgSoft }}
            >
              Je matches komen in een rustig ritme voorbij — streng geordend, nooit druk. Wat telt
              blijft staan; de rest schuift door.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span
                className="inline-flex items-center gap-2 px-3 py-2 text-[12px] font-bold"
                style={{ ...sans, color: C.mintDeep, background: C.mintSoft, borderRadius: 999 }}
              >
                <ShieldCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                {PROFIEL.trust}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <MatchDial value={(OPDRACHTEN[0] as Opdracht).match} size={92} />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.muted }}
            >
              beste match
            </span>
          </div>
        </div>

        {/* The signature conveyor of live matches. */}
        <div
          className="border-t px-5 py-5 sm:px-8"
          style={{ borderColor: C.lineSoft, background: C.woodSoft }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em]"
              style={{ ...sans, color: C.ink }}
            >
              <Boxes size={16} strokeWidth={2.2} style={{ color: C.mint }} aria-hidden="true" />
              Matches op de band
            </span>
            <button
              onClick={() => setRunning(!running)}
              disabled={reduced}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold transition-colors ${RING} disabled:opacity-40`}
              style={{ ...sans, color: C.ink, border: `1.5px solid ${C.ink}`, borderRadius: 8 }}
              aria-label={running ? "Pauzeer de band" : "Start de band"}
            >
              {running ? (
                <Pause size={12} strokeWidth={2.4} aria-hidden="true" />
              ) : (
                <Play size={12} strokeWidth={2.4} aria-hidden="true" />
              )}
              {reduced ? "Statisch" : running ? "Pauze" : "Start"}
            </button>
          </div>
          <BeltTread />
          <div className="my-2.5">
            <Conveyor
              running={running}
              reduced={reduced}
              ariaLabel="Lopende band met matches"
              duration={24}
            >
              {[...OPDRACHTEN, ...OPDRACHTEN].map((o, i) => (
                <BeltCard key={`${o.id}-${i}`} o={o} onOpen={onOpen} />
              ))}
            </Conveyor>
          </div>
          <BeltTread />
          {reduced && (
            <p className="mt-2 text-[11px]" style={{ ...sans, color: C.muted }}>
              Beweging staat uit vanwege je systeemvoorkeur — de strook is statisch en volledig
              scrolbaar.
            </p>
          )}
        </div>
      </Crate>

      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Crate key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ ...sans, color: C.muted }}
              >
                {k.label}
              </span>
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ ...mono, color: k.up ? C.mint : C.red }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[24px] font-bold tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3 flex items-end gap-[3px]" aria-hidden="true">
              {k.spark.map((v, si) => {
                const max = Math.max(...k.spark);
                return (
                  <span
                    key={si}
                    className="flex-1 rounded-sm"
                    style={{
                      height: 4 + (v / max) * 20,
                      background: si === k.spark.length - 1 ? C.mint : `${C.mint}40`,
                    }}
                  />
                );
              })}
            </div>
          </Crate>
        ))}
      </div>

      <div>
        <div className="mb-3">
          <Kicker color={C.amber}>Vraagt aandacht</Kicker>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {ACTIES.map((a, i) => {
            const warn = a.urgentie === "warning";
            const color = warn ? C.red : C.mint;
            return (
              <Crate key={a.titel} className="p-4" color={warn ? C.red : C.line}>
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center text-[11px] font-bold tabular-nums"
                    style={{ ...mono, color: C.card, background: color, borderRadius: 8 }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div
                      className="text-[13px] font-bold leading-snug"
                      style={{ ...sans, color: C.ink }}
                    >
                      {a.titel}
                    </div>
                    <div
                      className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-bold"
                      style={{ ...sans, color }}
                    >
                      {a.cta}
                      <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </Crate>
            );
          })}
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
  running,
  setRunning,
  reduced,
}: {
  query: string;
  setQuery: (v: string) => void;
  saved: Set<string>;
  toggleSave: (id: string) => void;
  onOpen: (o: Opdracht) => void;
  running: boolean;
  setRunning: (v: boolean) => void;
  reduced: boolean;
}) {
  const q = query.trim().toLowerCase();
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q) ||
      o.opdrachtgever.toLowerCase().includes(q) ||
      o.plaats.toLowerCase().includes(q) ||
      o.tags.some((t) => t.toLowerCase().includes(q)),
  );
  const canBelt = q === "" && !reduced;
  return (
    <div>
      <ScreenHead
        screenKey="marktplaats"
        title="Marktplaats"
        sub="Opdrachten rollen in een rustig ritme voorbij — mét de redenen waarom ze passen of schuren."
      />

      <Crate className="mb-6 flex items-center gap-3 px-4 py-3">
        <Search size={16} className="shrink-0" style={{ color: C.mint }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-50"
          style={{ ...sans, color: C.ink }}
        />
        <span
          className="rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums"
          style={{ ...mono, color: C.mintDeep, background: C.mintSoft }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`px-2 py-0.5 text-[11px] font-bold ${RING}`}
            style={{ ...sans, color: C.red }}
          >
            Wis
          </button>
        )}
      </Crate>

      {/* When unfiltered, show the live conveyor teaser above the ordered list. */}
      {canBelt && (
        <div
          className="mb-6 overflow-hidden"
          style={{ borderRadius: 12, background: C.woodSoft, border: `1.5px solid ${C.line}` }}
        >
          <div className="flex items-center justify-between px-4 pt-3">
            <span
              className="text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ ...sans, color: C.fgSoft }}
            >
              Vers op de band
            </span>
            <button
              onClick={() => setRunning(!running)}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold ${RING}`}
              style={{ ...sans, color: C.ink, border: `1.5px solid ${C.ink}`, borderRadius: 8 }}
              aria-label={running ? "Pauzeer de band" : "Start de band"}
            >
              {running ? (
                <Pause size={11} strokeWidth={2.4} aria-hidden="true" />
              ) : (
                <Play size={11} strokeWidth={2.4} aria-hidden="true" />
              )}
              {running ? "Pauze" : "Start"}
            </button>
          </div>
          <div className="px-4 py-3">
            <Conveyor
              running={running}
              reduced={reduced}
              ariaLabel="Lopende band met opdrachten"
              duration={22}
            >
              {[...OPDRACHTEN, ...OPDRACHTEN].map((o, i) => (
                <BeltCard key={`${o.id}-${i}`} o={o} onOpen={onOpen} />
              ))}
            </Conveyor>
          </div>
          <BeltTread />
        </div>
      )}

      {filtered.length === 0 ? (
        <Crate className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Boxes size={34} strokeWidth={1.6} style={{ color: C.mint }} aria-hidden="true" />
          <h3 className="text-[22px] font-bold tracking-tight" style={{ ...display, color: C.ink }}>
            Lege band
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Er komt niets voorbij voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="mt-1">
            <LineButton onClick={() => setQuery("")}>Filter wissen</LineButton>
          </div>
        </Crate>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <Crate
                key={o.id}
                className="p-5 transition-transform duration-150 hover:-translate-y-0.5"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <MatchDial value={o.match} size={72} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1">
                      <Kicker>{o.id}</Kicker>
                    </div>
                    <h3
                      className="text-[19px] font-bold leading-tight"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
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
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-0.5 text-[11px] font-bold"
                          style={{ ...sans, color: C.fg, background: C.woodSoft, borderRadius: 8 }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <button
                      onClick={() => toggleSave(o.id)}
                      aria-pressed={isSaved}
                      aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                      className={`flex h-9 w-9 items-center justify-center transition-colors ${RING}`}
                      style={{
                        color: isSaved ? C.card : C.ink,
                        background: isSaved ? C.ink : "transparent",
                        border: `1.5px solid ${C.ink}`,
                        borderRadius: 10,
                      }}
                    >
                      {isSaved ? (
                        <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                      ) : (
                        <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
                      )}
                    </button>
                    <MintButton onClick={() => onOpen(o)}>
                      Bekijk
                      <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                    </MintButton>
                  </div>
                </div>
              </Crate>
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
        <LineButton onClick={onBack} ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
          Terug
        </LineButton>
      </div>

      <Crate className="mb-6 overflow-hidden">
        <div className="p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <Kicker>{opdracht.id}</Kicker>
              <h2
                className="mt-2 text-[28px] font-bold leading-[1.02] tracking-tight sm:text-[38px]"
                style={{ ...display, color: C.ink }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-2 text-[14px]" style={{ ...sans, color: C.fgSoft }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <MatchDial value={opdracht.match} size={96} />
              <LineButton
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
              </LineButton>
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
                style={{
                  background: C.woodSoft,
                  border: `1.5px solid ${C.line}`,
                  borderRadius: 10,
                }}
              >
                <m.Icon size={15} strokeWidth={2} style={{ color: C.mint }} aria-hidden="true" />
                <div
                  className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.muted }}
                >
                  {m.label}
                </div>
                <div className="mt-0.5 text-[14px] font-bold" style={{ ...sans, color: C.ink }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>
        <BeltTread />
      </Crate>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Crate className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.mint, borderRadius: 8 }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={3} style={{ color: C.card }} />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.04em]"
              style={{ ...sans, color: C.ink }}
            >
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
                  style={{ color: C.mint }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Crate>
        <Crate className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.amber, borderRadius: 8 }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={3} style={{ color: C.card }} />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.04em]"
              style={{ ...sans, color: C.ink }}
            >
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
                  style={{ color: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Crate>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <MintButton
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
        </MintButton>
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
        title="Verificatie"
        sub="Elk certificaat een krat op de band — status met label én icoon, nooit op kleur alleen."
      />

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, color, soft } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 px-3.5 py-3"
              style={{ background: soft, border: `1.5px solid ${color}`, borderRadius: 10 }}
            >
              <Icon size={16} strokeWidth={2.4} style={{ color }} aria-hidden="true" />
              <span className="text-[12px] font-bold" style={{ ...sans, color: C.ink }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Crate className="mb-6 flex items-start gap-4 p-5">
        <ShieldCheck
          size={24}
          strokeWidth={2.2}
          style={{ color: C.mint }}
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        />
        <div>
          <div className="text-[15px] font-bold" style={{ ...display, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-1 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Crate>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Certificaten</Kicker>
          </div>
          <div className="space-y-3">
            {CREDENTIALS.map((c) => {
              const done = checked.has(c.naam);
              return (
                <Crate key={c.naam} className="flex items-center gap-4 p-4">
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${C.ink}`,
                      background: done ? C.mint : "transparent",
                      color: C.card,
                      borderRadius: 7,
                    }}
                  >
                    {done && <Check size={13} strokeWidth={2.8} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold" style={{ ...sans, color: C.ink }}>
                      {c.naam}
                    </div>
                    <div className="text-[12px]" style={{ ...sans, color: C.muted }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusPill status={c.status} />
                </Crate>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Kicker color={C.amber}>Documenten</Kicker>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-7 w-7 items-center justify-center ${RING}`}
              style={{ color: C.ink, border: `1.5px solid ${C.ink}`, borderRadius: 8 }}
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
                className={`px-3 py-1 text-[11px] font-bold transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? C.card : C.ink,
                  background: feedState === s ? C.ink : "transparent",
                  border: `1.5px solid ${C.ink}`,
                  borderRadius: 8,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <div className="space-y-3" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Crate key={i} className="p-4">
                  <div
                    className="h-3 w-2/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </Crate>
              ))}
            </div>
          )}

          {feedState === "error" && (
            <Crate
              className="flex flex-col items-center gap-2 px-4 py-10 text-center"
              color={C.red}
            >
              <XCircle size={26} strokeWidth={2} style={{ color: C.red }} aria-hidden="true" />
              <div className="text-[15px] font-bold" style={{ ...display, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.fgSoft }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <MintButton onClick={() => setFeedState("ok")}>Opnieuw proberen</MintButton>
              </div>
            </Crate>
          )}

          {feedState === "ok" && (
            <div className="space-y-3">
              {DOCUMENTEN.map((d) => (
                <Crate key={d.naam} className="flex items-center gap-3 p-3.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{ ...mono, color: C.card, background: C.ink, borderRadius: 8 }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12.5px] font-bold"
                      style={{ ...sans, color: C.ink }}
                    >
                      {d.naam}
                    </div>
                    <div className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
                      {d.grootte} · {d.bijgewerkt}
                    </div>
                  </div>
                  <StatusPill status={d.status} />
                </Crate>
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
        screenKey="acties"
        title="Acties"
        sub="Wat vandaag over de band komt — krat voor krat afgevinkt."
      />

      {openCount === 0 ? (
        <Crate className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Check size={30} strokeWidth={2.4} style={{ color: C.mint }} aria-hidden="true" />
          <h3 className="text-[22px] font-bold tracking-tight" style={{ ...display, color: C.ink }}>
            Band leeg
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Niets meer te doen vandaag. Alles is afgehandeld.
          </p>
        </Crate>
      ) : (
        <>
          <div className="mb-6 flex items-baseline gap-3">
            <span
              className="text-[38px] font-bold tabular-nums leading-none"
              style={{ ...display, color: C.red }}
            >
              {String(openCount).padStart(2, "0")}
            </span>
            <span
              className="text-[12px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.muted }}
            >
              {openCount === 1 ? "actie op de band" : "acties op de band"}
            </span>
          </div>

          <div className="space-y-3">
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <Crate key={a.titel} className="flex items-start gap-4 p-5">
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1.5px solid ${C.ink}`,
                      background: isDone ? C.mint : "transparent",
                      color: C.card,
                      borderRadius: 7,
                    }}
                  >
                    {isDone && <Check size={13} strokeWidth={2.8} aria-hidden="true" />}
                  </button>
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[10px] font-bold tabular-nums"
                    style={{
                      ...mono,
                      color: isDone ? C.faint : C.card,
                      background: isDone ? "transparent" : warn ? C.red : C.ink,
                      border: isDone ? `1.5px solid ${C.line}` : "none",
                      borderRadius: 7,
                    }}
                    aria-hidden="true"
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
                      style={{ ...sans, color: C.fgSoft, opacity: isDone ? 0.5 : 1 }}
                    >
                      {a.detail}
                    </p>
                    {!isDone && (
                      <span
                        className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold"
                        style={{ ...sans, color: warn ? C.red : C.mint }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </Crate>
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
    status === "Openstaand" ? C.amber : status === "Concept" ? C.muted : C.mint;
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Facturen"
        sub="Overzichtelijk en zonder gedoe — je weet altijd waar je aan toe bent."
      />

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", color: C.mint },
          { label: "Openstaand", value: "€ 1.350", color: C.amber },
          { label: "Concept", value: "€ 880", color: C.ink },
        ].map((s) => (
          <Crate key={s.label} className="p-5">
            <div
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.muted }}
            >
              {s.label}
            </div>
            <div
              className="mt-2 text-[26px] font-bold tabular-nums"
              style={{ ...display, color: s.color }}
            >
              {s.value}
            </div>
          </Crate>
        ))}
      </div>

      <Crate className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.ink}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em]"
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
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.woodSoft)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td
                    className="px-4 py-4 text-[12.5px] font-bold tabular-nums"
                    style={{ ...mono, color: C.mintDeep }}
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
                    className="px-4 py-4 text-right text-[13px] font-bold tabular-nums"
                    style={{ ...sans, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold"
                      style={{ ...sans, color: statusColor(f.status) }}
                    >
                      <span
                        className="h-2 w-2 rounded-sm"
                        style={{ background: statusColor(f.status) }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: `2px solid ${C.ink}` }}>
                <td
                  className="px-4 py-4 text-[11px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.muted }}
                  colSpan={3}
                >
                  Totaal
                </td>
                <td
                  className="px-4 py-4 text-right text-[15px] font-bold tabular-nums"
                  style={{ ...display, color: C.ink }}
                >
                  € 7.782
                </td>
                <td className="px-4 py-4" />
              </tr>
            </tbody>
          </table>
        </div>
      </Crate>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept302() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set(["OPD-2041"]));
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Set<string>>(new Set());
  const [feedState, setFeedState] = useState<"ok" | "loading" | "error">("ok");
  const [active, setActive] = useState<Opdracht>(OPDRACHTEN[0] as Opdracht);
  const [running, setRunning] = useState(true);
  const reduced = usePrefersReducedMotion();

  const toggleSet = (s: Set<string>, key: string): Set<string> => {
    const n = new Set(s);
    if (n.has(key)) n.delete(key);
    else n.add(key);
    return n;
  };

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...sans, color: C.fg, background: C.wood }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center"
              style={{ background: C.mint, borderRadius: 13, boxShadow: `0 3px 8px ${C.mint}44` }}
              aria-hidden="true"
            >
              <Boxes size={22} strokeWidth={2.2} style={{ color: C.card }} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[20px] font-bold tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Lopende band
              </div>
              <div
                className="text-[9px] font-bold uppercase tracking-[0.24em]"
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
                style={{ ...sans, color: C.mintDeep }}
              >
                <ShieldCheck size={12} strokeWidth={2.2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-10 w-10 items-center justify-center text-[12px] font-bold"
              style={{ ...display, color: C.card, background: C.ink, borderRadius: 11 }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        {/* Conveyor nav — tabs on a belt tread. */}
        <nav className="mb-8 overflow-x-auto" aria-label="Hoofdnavigatie">
          <div
            className="flex items-stretch gap-1.5 p-1.5"
            style={{ background: C.woodSoft, border: `1.5px solid ${C.line}`, borderRadius: 12 }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-2 px-3.5 py-2 text-[12px] font-bold transition-colors ${RING}`}
                  style={{
                    ...sans,
                    color: on ? C.card : C.ink,
                    background: on ? C.ink : "transparent",
                    borderRadius: 9,
                  }}
                >
                  <span
                    className="text-[9px] font-bold tabular-nums"
                    style={{ ...mono, color: on ? C.mint : C.faint }}
                  >
                    {SCREEN_INDEX[s.key]}
                  </span>
                  {s.label}
                </button>
              );
            })}
          </div>
        </nav>

        <main className="flex-1">
          {screen === "dashboard" && (
            <Dashboard
              onOpen={(o) => {
                setActive(o);
                setScreen("opdracht");
              }}
              running={running}
              setRunning={setRunning}
              reduced={reduced}
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
              running={running}
              setRunning={setRunning}
              reduced={reduced}
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

        <div className="mt-9">
          <BeltTread />
        </div>
        <footer
          className="flex flex-wrap items-center justify-between gap-2 pt-4 text-[10.5px]"
          style={{ ...mono, color: C.muted }}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: C.mint }}
              aria-hidden="true"
            />
            {SCREENS.length} schermen · lopende band v302
          </span>
          <span className="uppercase tracking-[0.12em]">Ritme · orde · beweging</span>
        </footer>
      </div>
    </div>
  );
}
