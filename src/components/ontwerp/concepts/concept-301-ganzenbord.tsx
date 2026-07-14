"use client";

// Concept 301 — "Ganzenbord" · speels bordspel-parcours.
// Signature: de next-action-engine en voortgang worden een levendig tegelpad — genummerde
// velden, dobbelsteen-achtige tegels en een pion die de status volgt. Kleurrijk-speels maar
// streng op een 8pt-raster; vrolijke primaire accenten op licht papier. Micro-interacties:
// hover-lift op tegels, pion-hop.
// Fonts: kop --font-lab-baloo · tekst --font-lab-geist · cijfers --font-lab-mono.

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
  Dice5,
  Flag,
  Trophy,
  Sparkles,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
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

// Cheerful board-game palette — cream paper, ink, and a set of vivid primaries.
const C = {
  paper: "#fbf6ea",
  paperSoft: "#f3ebd8",
  card: "#ffffff",
  ink: "#26221a",
  fg: "#413a2d",
  fgSoft: "#6a6252",
  muted: "#948b77",
  faint: "#c4bba4",
  line: "#e7dfca",
  lineSoft: "#f0e9d7",
  red: "#e04a4a",
  redSoft: "#f4dede",
  blue: "#3b7ff0",
  blueSoft: "#dde9fd",
  green: "#22a06b",
  greenSoft: "#d6efe3",
  amber: "#f2a417",
  amberSoft: "#fbedcf",
  purple: "#8b5cf6",
  purpleSoft: "#e8e0fc",
};

const display = { fontFamily: "var(--font-lab-baloo), Verdana, sans-serif" };
const sans = { fontFamily: "var(--font-lab-geist), Helvetica, Arial, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b7ff0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf6ea]";

const SCREEN_INDEX: Record<ScreenKey, number> = {
  dashboard: 1,
  marktplaats: 2,
  opdracht: 3,
  verificatie: 4,
  acties: 5,
  facturen: 6,
  documenten: 7,
  berichten: 8,
};

// A rotating set of playful tile colors so the board reads as a lively parcours.
const TILE_COLORS = [C.blue, C.green, C.amber, C.purple, C.red];

// ---- Playful primitives -----------------------------------------------------

// A dice face rendered as pips — the load-bearing motif for "een zet vooruit".
function DiceFace({ value, size = 44 }: { value: number; size?: number }) {
  const layouts: Record<number, [number, number][]> = {
    1: [[1, 1]],
    2: [
      [0, 0],
      [2, 2],
    ],
    3: [
      [0, 0],
      [1, 1],
      [2, 2],
    ],
    4: [
      [0, 0],
      [2, 0],
      [0, 2],
      [2, 2],
    ],
    5: [
      [0, 0],
      [2, 0],
      [1, 1],
      [0, 2],
      [2, 2],
    ],
    6: [
      [0, 0],
      [2, 0],
      [0, 1],
      [2, 1],
      [0, 2],
      [2, 2],
    ],
  };
  const pips = layouts[Math.min(6, Math.max(1, value))] ?? layouts[1];
  const pad = size * 0.2;
  const step = (size - pad * 2) / 2;
  const r = size * 0.09;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <rect
        x={1}
        y={1}
        width={size - 2}
        height={size - 2}
        rx={size * 0.22}
        fill={C.card}
        stroke={C.ink}
        strokeWidth={2}
      />
      {pips!.map(([cx, cy], i) => (
        <circle key={i} cx={pad + cx * step} cy={pad + cy * step} r={r} fill={C.ink} />
      ))}
    </svg>
  );
}

// A rounded board tile — numbered, colored, with hover-lift handled by the caller.
function BoardTile({
  n,
  color,
  children,
  active = false,
}: {
  n: number;
  color: string;
  children?: ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{
        background: C.card,
        border: `2.5px solid ${active ? C.ink : color}`,
        borderRadius: 14,
        boxShadow: active ? `0 6px 0 ${color}` : `0 3px 0 ${C.line}`,
        transition: "transform 0.18s, box-shadow 0.18s",
      }}
    >
      <span
        className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center text-[10px] font-bold tabular-nums"
        style={{ ...mono, color: C.card, background: color, borderRadius: 7 }}
        aria-hidden="true"
      >
        {n}
      </span>
      {children}
    </div>
  );
}

// The pawn — a game token that "hops" to the active position.
function Pawn({ color = C.red, size = 26 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <ellipse cx="12" cy="21" rx="7" ry="2.2" fill={color} opacity="0.28" />
      <path
        d="M12 2.5c2.4 0 4 1.8 4 3.9 0 1.3-.6 2.3-1.5 3 1.7 1 2.8 2.9 3 5.1H6.5c.2-2.2 1.3-4.1 3-5.1-.9-.7-1.5-1.7-1.5-3 0-2.1 1.6-3.9 4-3.9Z"
        fill={color}
        stroke={C.ink}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Kicker({ children, color = C.blue }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.2em]"
      style={{ ...mono, color }}
    >
      <Sparkles size={12} strokeWidth={2.4} aria-hidden="true" />
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
      return { label: "Geverifieerd", Icon: BadgeCheck, color: C.green, soft: C.greenSoft };
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
      style={{ ...sans, color, background: soft, border: `2px solid ${color}`, borderRadius: 999 }}
    >
      <Icon size={12} strokeWidth={2.6} aria-hidden="true" />
      {label}
    </span>
  );
}

// A chunky board-game button with a hard drop-shadow that "presses" on hover.
function PlayButton({
  children,
  onClick,
  color = C.blue,
  className,
  ariaLabel,
  ariaPressed,
}: {
  children: ReactNode;
  onClick?: () => void;
  color?: string;
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
        background: color,
        border: `2.5px solid ${C.ink}`,
        borderRadius: 12,
        transform: hot ? "translateY(2px)" : "none",
        boxShadow: hot ? `0 1px 0 ${C.ink}` : `0 4px 0 ${C.ink}`,
      }}
    >
      {children}
    </button>
  );
}

// Outlined secondary — ink frame that fills on hover/active.
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
        border: `2.5px solid ${C.ink}`,
        borderRadius: 12,
      }}
    >
      {children}
    </button>
  );
}

// A soft rounded card — the board's playing surface.
function Card({
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
        border: `2px solid ${color ?? C.line}`,
        borderRadius: 18,
        boxShadow: `0 3px 0 ${C.lineSoft}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function MatchBadge({ value, size = 56 }: { value: number; size?: number }) {
  const color = value >= 90 ? C.green : value >= 82 ? C.blue : C.amber;
  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center"
      style={{
        width: size,
        height: size,
        background: C.card,
        border: `2.5px solid ${color}`,
        borderRadius: 14,
        boxShadow: `0 3px 0 ${color}`,
      }}
      aria-label={`Match ${value} procent`}
    >
      <span className="text-[16px] font-bold tabular-nums leading-none" style={{ ...mono, color }}>
        {value}
      </span>
      <span
        className="mt-0.5 text-[7.5px] font-bold uppercase tracking-[0.12em]"
        style={{ ...sans, color: C.muted }}
      >
        match
      </span>
    </div>
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
    <div className="mb-7 flex items-start gap-3">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center text-[17px] font-bold tabular-nums"
        style={{
          ...display,
          color: C.card,
          background: C.ink,
          borderRadius: 13,
          boxShadow: `0 4px 0 ${C.line}`,
        }}
        aria-hidden="true"
      >
        {SCREEN_INDEX[screenKey]}
      </span>
      <div>
        <h1
          className="text-[28px] font-bold leading-none tracking-tight sm:text-[34px]"
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
    </div>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({
  onOpen,
  onGo,
}: {
  onOpen: (o: Opdracht) => void;
  onGo: (s: ScreenKey) => void;
}) {
  const voornaam = PROFIEL.naam.split(" ")[0];
  // The next-action-engine rendered as a board path. Field 5 (VOG) is where the pawn stands.
  const parcours = [
    { label: "Profiel compleet", done: true, screen: "verificatie" as ScreenKey },
    { label: "Documenten geüpload", done: true, screen: "verificatie" as ScreenKey },
    { label: "3 nieuwe matches", done: false, screen: "marktplaats" as ScreenKey },
    { label: "Reactie versturen", done: false, screen: "opdracht" as ScreenKey },
    { label: "VOG vernieuwen", done: false, screen: "acties" as ScreenKey },
    { label: "Factuur innen", done: false, screen: "facturen" as ScreenKey },
  ];
  const pawnAt = 4; // zero-based field the pawn currently occupies

  return (
    <div>
      {/* Hero — greeting with a dice roll and the trust badge. */}
      <Card className="mb-7 overflow-hidden" style={{ borderColor: C.blue }}>
        <div className="flex flex-wrap items-center justify-between gap-6 p-6 sm:p-8">
          <div className="min-w-0">
            <Kicker color={C.blue}>
              {PROFIEL.plaats} · {PROFIEL.rol}
            </Kicker>
            <h1
              className="mt-3 text-[36px] font-bold leading-[0.95] tracking-tight sm:text-[46px]"
              style={{ ...display, color: C.ink }}
            >
              Zet ’m op, {voornaam}!
            </h1>
            <p
              className="mt-3 max-w-md text-[13.5px] leading-relaxed"
              style={{ ...sans, color: C.fgSoft }}
            >
              Je week is een parcours. We tonen alleen het volgende veld — één zet tegelijk, helder
              en zonder rommel.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span
                className="inline-flex items-center gap-2 px-3 py-2 text-[12px] font-bold"
                style={{ ...sans, color: C.green, background: C.greenSoft, borderRadius: 999 }}
              >
                <ShieldCheck size={15} strokeWidth={2.4} aria-hidden="true" />
                {PROFIEL.trust}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <DiceFace value={5} size={62} />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.muted }}
            >
              5 zetten open
            </span>
          </div>
        </div>

        {/* The board path — genummerd tegelpad met de pion op het actieve veld. */}
        <div
          className="border-t px-5 py-5 sm:px-8"
          style={{ borderColor: C.lineSoft, background: C.paperSoft }}
        >
          <div className="mb-3 flex items-center gap-2">
            <Flag size={15} strokeWidth={2.4} style={{ color: C.red }} aria-hidden="true" />
            <span
              className="text-[12px] font-bold uppercase tracking-[0.14em]"
              style={{ ...sans, color: C.ink }}
            >
              Jouw parcours
            </span>
          </div>
          <ol className="flex gap-2.5 overflow-x-auto pb-2" aria-label="Voortgang parcours">
            {parcours.map((p, i) => {
              const color = TILE_COLORS[i % TILE_COLORS.length]!;
              const here = i === pawnAt;
              return (
                <li key={p.label} className="shrink-0">
                  <button
                    onClick={() => onGo(p.screen)}
                    className={`group relative block w-[132px] text-left ${RING}`}
                    style={{ borderRadius: 14 }}
                    aria-label={`Veld ${i + 1}: ${p.label}${here ? " — jouw pion staat hier" : ""}`}
                  >
                    <div className="transition-transform duration-150 group-hover:-translate-y-1">
                      <BoardTile n={i + 1} color={color} active={here}>
                        <div className="flex flex-col items-center px-2 py-4">
                          {p.done ? (
                            <span
                              className="flex h-7 w-7 items-center justify-center"
                              style={{ background: color, borderRadius: 9 }}
                              aria-hidden="true"
                            >
                              <Check size={16} strokeWidth={3} style={{ color: C.card }} />
                            </span>
                          ) : here ? (
                            <span className="animate-bounce" aria-hidden="true">
                              <Pawn color={C.red} size={28} />
                            </span>
                          ) : (
                            <span
                              className="flex h-7 w-7 items-center justify-center text-[12px] font-bold"
                              style={{
                                ...mono,
                                color,
                                background: C.card,
                                border: `2px dashed ${color}`,
                                borderRadius: 9,
                              }}
                              aria-hidden="true"
                            >
                              ?
                            </span>
                          )}
                          <span
                            className="mt-2.5 text-center text-[11px] font-bold leading-tight"
                            style={{ ...sans, color: C.ink }}
                          >
                            {p.label}
                          </span>
                        </div>
                      </BoardTile>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </Card>

      {/* KPI dice-tiles */}
      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const color = TILE_COLORS[i % TILE_COLORS.length]!;
          return (
            <Card key={k.label} className="p-4" style={{ boxShadow: `0 3px 0 ${color}22` }}>
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...sans, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="text-[11px] font-bold tabular-nums"
                  style={{ ...mono, color: k.up ? C.green : C.red }}
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
                        background: si === k.spark.length - 1 ? color : `${color}44`,
                      }}
                    />
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker color={C.green}>Beste zetten</Kicker>
          </div>
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o)}
                className={`group block w-full text-left ${RING}`}
                style={{ borderRadius: 18 }}
              >
                <Card className="flex items-center gap-4 p-4 transition-transform duration-150 group-hover:-translate-y-0.5">
                  <MatchBadge value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ ...mono, color: C.muted }}
                    >
                      {o.id}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[16px] font-bold leading-tight"
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
                    style={{ color: C.blue }}
                    aria-hidden="true"
                  />
                </Card>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3">
            <Kicker color={C.amber}>Vraagt aandacht</Kicker>
          </div>
          <div className="space-y-3">
            {ACTIES.map((a, i) => {
              const warn = a.urgentie === "warning";
              const color = warn ? C.red : C.blue;
              return (
                <Card key={a.titel} className="p-4" color={warn ? C.red : C.line}>
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center text-[12px] font-bold tabular-nums"
                      style={{ ...mono, color: C.card, background: color, borderRadius: 9 }}
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div
                        className="text-[13px] font-bold leading-snug"
                        style={{ ...sans, color: C.ink }}
                      >
                        {a.titel}
                      </div>
                      <button
                        onClick={() => onGo("acties")}
                        className={`mt-1.5 inline-flex items-center gap-1 text-[12px] font-bold ${RING}`}
                        style={{ ...sans, color }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
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
        screenKey="marktplaats"
        title="Marktplaats"
        sub="Elke opdracht een speelveld — met de redenen waarom je vooruit of terug zet."
      />

      <Card className="mb-6 flex items-center gap-3 px-4 py-3" color={C.blue}>
        <Search size={16} className="shrink-0" style={{ color: C.blue }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-50"
          style={{ ...sans, color: C.ink }}
        />
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
          style={{ ...mono, color: C.blue, background: C.blueSoft }}
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
      </Card>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Dice5 size={34} strokeWidth={1.8} style={{ color: C.blue }} aria-hidden="true" />
          <h3 className="text-[22px] font-bold tracking-tight" style={{ ...display, color: C.ink }}>
            Geen veld gevonden
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Niets past bij &ldquo;{query}&rdquo;. Gooi opnieuw met een andere zoekterm.
          </p>
          <div className="mt-1">
            <LineButton onClick={() => setQuery("")}>Filter wissen</LineButton>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((o, idx) => {
            const isSaved = saved.has(o.id);
            const color = TILE_COLORS[idx % TILE_COLORS.length]!;
            return (
              <Card
                key={o.id}
                className="p-5 transition-transform duration-150 hover:-translate-y-0.5"
                color={color}
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center text-[14px] font-bold tabular-nums"
                      style={{ ...mono, color: C.card, background: color, borderRadius: 11 }}
                      aria-hidden="true"
                    >
                      {idx + 1}
                    </span>
                    <MatchBadge value={o.match} size={62} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1">
                      <Kicker color={color}>{o.id}</Kicker>
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
                            strokeWidth={2.2}
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
                          style={{
                            ...sans,
                            color: C.fg,
                            background: C.paperSoft,
                            borderRadius: 999,
                          }}
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
                      className={`flex h-10 w-10 items-center justify-center transition-colors ${RING}`}
                      style={{
                        color: isSaved ? C.card : C.ink,
                        background: isSaved ? C.ink : "transparent",
                        border: `2.5px solid ${C.ink}`,
                        borderRadius: 12,
                      }}
                    >
                      {isSaved ? (
                        <BookmarkCheck size={16} strokeWidth={2.4} aria-hidden="true" />
                      ) : (
                        <Bookmark size={16} strokeWidth={2.4} aria-hidden="true" />
                      )}
                    </button>
                    <PlayButton onClick={() => onOpen(o)} color={color}>
                      Speel veld
                      <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
                    </PlayButton>
                  </div>
                </div>
              </Card>
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
          <ArrowLeft size={14} strokeWidth={2.6} aria-hidden="true" />
          Terug
        </LineButton>
      </div>

      <Card className="mb-6 p-6 sm:p-7" color={C.blue}>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <Kicker color={C.blue}>{opdracht.id}</Kicker>
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
            <MatchBadge value={opdracht.match} size={84} />
            <LineButton
              onClick={() => toggleSave(opdracht.id)}
              active={isSaved}
              ariaPressed={isSaved}
              ariaLabel={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
            >
              {isSaved ? (
                <BookmarkCheck size={14} strokeWidth={2.4} aria-hidden="true" />
              ) : (
                <Bookmark size={14} strokeWidth={2.4} aria-hidden="true" />
              )}
              {isSaved ? "Bewaard" : "Bewaar"}
            </LineButton>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief, color: C.green },
            { Icon: Clock, label: "Inzet", value: opdracht.uren, color: C.blue },
            { Icon: Calendar, label: "Start", value: opdracht.start, color: C.amber },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats, color: C.purple },
          ].map((m) => (
            <div
              key={m.label}
              className="p-3"
              style={{
                background: C.paperSoft,
                border: `2px solid ${m.color}33`,
                borderRadius: 13,
              }}
            >
              <m.Icon size={16} strokeWidth={2.2} style={{ color: m.color }} aria-hidden="true" />
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
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-5" color={C.green}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center"
              style={{ background: C.green, borderRadius: 10 }}
              aria-hidden="true"
            >
              <ThumbsUp size={15} strokeWidth={2.6} style={{ color: C.card }} />
            </span>
            <span
              className="text-[13px] font-bold uppercase tracking-[0.04em]"
              style={{ ...sans, color: C.ink }}
            >
              Zetten vooruit
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
                  strokeWidth={3}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5" color={C.amber}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center"
              style={{ background: C.amber, borderRadius: 10 }}
              aria-hidden="true"
            >
              <ThumbsDown size={15} strokeWidth={2.6} style={{ color: C.card }} />
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
                  strokeWidth={2.4}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <PlayButton
          onClick={() => setApplied((v) => !v)}
          ariaPressed={applied}
          color={applied ? C.green : C.blue}
          className="px-6 py-3 text-[13px]"
        >
          {applied ? (
            <Check size={16} strokeWidth={3} aria-hidden="true" />
          ) : (
            <ArrowRight size={16} strokeWidth={2.6} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </PlayButton>
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
        sub="Elk certificaat een veld op het bord — status met label én icoon, nooit op kleur alleen."
      />

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, color, soft } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 px-3.5 py-3"
              style={{ background: soft, border: `2px solid ${color}`, borderRadius: 14 }}
            >
              <Icon size={16} strokeWidth={2.6} style={{ color }} aria-hidden="true" />
              <span className="text-[12px] font-bold" style={{ ...sans, color: C.ink }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Card className="mb-6 flex items-start gap-4 p-5" color={C.green}>
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center"
          style={{ background: C.greenSoft, borderRadius: 14 }}
          aria-hidden="true"
        >
          <Trophy size={22} strokeWidth={2.2} style={{ color: C.green }} />
        </span>
        <div>
          <div className="text-[15px] font-bold" style={{ ...display, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-1 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker color={C.purple}>Certificaten</Kicker>
          </div>
          <div className="space-y-3">
            {CREDENTIALS.map((c, i) => {
              const done = checked.has(c.naam);
              const color = TILE_COLORS[i % TILE_COLORS.length]!;
              return (
                <Card key={c.naam} className="flex items-center gap-4 p-4">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center text-[13px] font-bold tabular-nums"
                    style={{ ...mono, color: C.card, background: color, borderRadius: 11 }}
                    aria-hidden="true"
                  >
                    {i + 1}
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
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `2.5px solid ${C.ink}`,
                      background: done ? C.green : "transparent",
                      color: C.card,
                      borderRadius: 10,
                    }}
                  >
                    {done && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                  </button>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Kicker color={C.amber}>Documenten</Kicker>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center ${RING}`}
              style={{ color: C.ink, border: `2.5px solid ${C.ink}`, borderRadius: 10 }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={2.2} aria-hidden="true" />
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
                  border: `2px solid ${C.ink}`,
                  borderRadius: 999,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <div className="space-y-3" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <div
                    className="h-3 w-2/3 animate-pulse rounded-full"
                    style={{ background: C.lineSoft }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded-full"
                    style={{ background: C.lineSoft }}
                  />
                </Card>
              ))}
            </div>
          )}

          {feedState === "error" && (
            <Card className="flex flex-col items-center gap-2 px-4 py-10 text-center" color={C.red}>
              <XCircle size={28} strokeWidth={2} style={{ color: C.red }} aria-hidden="true" />
              <div className="text-[15px] font-bold" style={{ ...display, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.fgSoft }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <PlayButton onClick={() => setFeedState("ok")} color={C.red}>
                  Opnieuw proberen
                </PlayButton>
              </div>
            </Card>
          )}

          {feedState === "ok" && (
            <div className="space-y-3">
              {DOCUMENTEN.map((d) => (
                <Card key={d.naam} className="flex items-center gap-3 p-3.5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{ ...mono, color: C.card, background: C.ink, borderRadius: 11 }}
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
                </Card>
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
        sub="Jouw beurt — gooi de dobbelsteen en vink veld voor veld af."
      />

      {openCount === 0 ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center" color={C.green}>
          <Trophy size={34} strokeWidth={2} style={{ color: C.green }} aria-hidden="true" />
          <h3 className="text-[22px] font-bold tracking-tight" style={{ ...display, color: C.ink }}>
            Uitgespeeld!
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Alle velden gehaald. Niets meer te doen vandaag.
          </p>
        </Card>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-4">
            <DiceFace value={openCount} size={54} />
            <div className="flex items-baseline gap-2">
              <span
                className="text-[38px] font-bold tabular-nums leading-none"
                style={{ ...display, color: C.red }}
              >
                {openCount}
              </span>
              <span
                className="text-[12px] font-bold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.muted }}
              >
                {openCount === 1 ? "veld open" : "velden open"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              const color = warn ? C.red : C.blue;
              return (
                <Card
                  key={a.titel}
                  className="flex items-start gap-4 p-5"
                  color={isDone ? C.line : color}
                >
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `2.5px solid ${C.ink}`,
                      background: isDone ? C.green : "transparent",
                      color: C.card,
                      borderRadius: 11,
                    }}
                  >
                    {isDone ? (
                      <Check size={15} strokeWidth={3} aria-hidden="true" />
                    ) : (
                      <span
                        className="text-[13px] font-bold tabular-nums"
                        style={{ ...mono, color: C.ink }}
                      >
                        {i + 1}
                      </span>
                    )}
                  </button>
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
                        style={{ ...sans, color }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </Card>
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
    status === "Openstaand" ? C.amber : status === "Concept" ? C.muted : C.green;
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Facturen"
        sub="Overzichtelijk en zonder gedoe — je weet altijd waar je aan toe bent."
      />

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", color: C.green, soft: C.greenSoft },
          { label: "Openstaand", value: "€ 1.350", color: C.amber, soft: C.amberSoft },
          { label: "Concept", value: "€ 880", color: C.blue, soft: C.blueSoft },
        ].map((s) => (
          <Card key={s.label} className="p-5" color={s.color}>
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
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `2.5px solid ${C.ink}` }}>
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
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.paperSoft)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td
                    className="px-4 py-4 text-[12.5px] font-bold tabular-nums"
                    style={{ ...mono, color: C.blue }}
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
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{
                        ...sans,
                        color: statusColor(f.status),
                        background: `${statusColor(f.status)}1c`,
                      }}
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
              <tr style={{ borderTop: `2.5px solid ${C.ink}` }}>
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
      </Card>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept301() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set(["OPD-2041"]));
  const [checked, setChecked] = useState<Set<string>>(new Set(["BIG-registratie"]));
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
      style={{ ...sans, color: C.fg, background: C.paper }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center"
              style={{ background: C.blue, borderRadius: 14, boxShadow: `0 4px 0 ${C.ink}` }}
              aria-hidden="true"
            >
              <Pawn color={C.card} size={24} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[20px] font-bold tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Ganzenbord
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
                style={{ ...sans, color: C.green }}
              >
                <ShieldCheck size={12} strokeWidth={2.2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-10 w-10 items-center justify-center text-[12px] font-bold"
              style={{ ...display, color: C.card, background: C.ink, borderRadius: 12 }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        {/* Board nav — genummerde speelvelden. */}
        <nav className="mb-8 overflow-x-auto" aria-label="Hoofdnavigatie">
          <div
            className="flex items-stretch gap-2 p-1.5"
            style={{ background: C.paperSoft, borderRadius: 16 }}
          >
            {SCREENS.map((s, i) => {
              const on = s.key === screen;
              const color = TILE_COLORS[i % TILE_COLORS.length]!;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-2 px-3.5 py-2 text-[12px] font-bold transition-all ${RING}`}
                  style={{
                    ...sans,
                    color: on ? C.card : C.ink,
                    background: on ? C.ink : C.card,
                    border: `2px solid ${on ? C.ink : C.line}`,
                    borderRadius: 12,
                    boxShadow: on ? `0 3px 0 ${color}` : "none",
                  }}
                >
                  <span
                    className="flex h-5 w-5 items-center justify-center text-[10px] font-bold tabular-nums"
                    style={{
                      ...mono,
                      color: on ? C.ink : C.card,
                      background: on ? color : color,
                      borderRadius: 7,
                    }}
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
              onGo={setScreen}
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

        <div
          className="mt-9 h-0.5 w-full rounded-full"
          style={{ background: C.line }}
          aria-hidden="true"
        />
        <footer
          className="flex flex-wrap items-center justify-between gap-2 pt-4 text-[10.5px]"
          style={{ ...mono, color: C.muted }}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: C.blue }}
              aria-hidden="true"
            />
            {SCREENS.length} velden · ganzenbord v301
          </span>
          <span className="uppercase tracking-[0.12em]">Dobbelen · pion · parcours</span>
        </footer>
      </div>
    </div>
  );
}
