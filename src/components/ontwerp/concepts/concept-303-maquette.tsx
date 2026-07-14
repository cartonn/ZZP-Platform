"use client";

// Concept 303 — "Maquette" · isometrische schaalmaquette.
// Signature: het platform als architecturale museum-maquette. Isometrische module-blokjes met
// zachte slagschaduw op museumwit, subtiele dieptelagen en fijne maatstreepjes. Ruimtelijk,
// precies, premium-licht.
// Fonts: kop --font-lab-space · tekst --font-lab-inter · cijfers --font-lab-mono.

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
  Box,
  Ruler,
  Layers,
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

// Museum-white light. Cool paper, precise graphite lines, one architect's blueprint blue,
// plus warm brass for accents. Isometric blocks read as scale-model modules.
const C = {
  paper: "#f4f5f7",
  paperSoft: "#eceef1",
  card: "#ffffff",
  ink: "#1c2128",
  fg: "#39414c",
  fgSoft: "#616b78",
  muted: "#8b95a3",
  faint: "#b7c0cc",
  line: "#dfe3e9",
  lineSoft: "#eaedf1",
  blue: "#2f6bd8",
  blueSoft: "#e2ecfb",
  blueDeep: "#1f4fa8",
  brass: "#b58535",
  brassSoft: "#f2e8d4",
  green: "#2e9e6b",
  greenSoft: "#dcf1e7",
  amber: "#cf9412",
  amberSoft: "#f8ecca",
  red: "#d0503f",
  redSoft: "#f7dfda",
};

const display = { fontFamily: "var(--font-lab-space), Verdana, sans-serif" };
const sans = { fontFamily: "var(--font-lab-inter), Helvetica, Arial, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bd8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f5f7]";

const SCREEN_INDEX: Record<ScreenKey, string> = {
  dashboard: "A",
  marktplaats: "B",
  opdracht: "C",
  verificatie: "D",
  acties: "E",
  facturen: "F",
  documenten: "G",
  berichten: "H",
};

// ---- Isometric primitives ---------------------------------------------------

// A scale-model block rendered isometrically — the load-bearing motif. Height encodes a value;
// top/left/right faces give it dimensional weight with a soft cast shadow.
function IsoBlock({
  height = 34,
  size = 46,
  color = C.blue,
  label,
}: {
  height?: number;
  size?: number;
  color?: string;
  label?: string;
}) {
  const w = size;
  const hw = w / 2;
  const d = hw * 0.58; // vertical foreshorten of the top rhombus
  const totalH = d * 2 + height + 6;
  // top diamond points
  const topY = 3;
  return (
    <svg width={w} height={totalH} viewBox={`0 0 ${w} ${totalH}`} aria-hidden="true">
      {/* cast shadow */}
      <ellipse cx={hw} cy={totalH - 2} rx={hw * 0.82} ry={d * 0.5} fill={C.ink} opacity={0.09} />
      {/* right face */}
      <path
        d={`M ${hw} ${topY + d} L ${w - 1} ${topY + d / 2} L ${w - 1} ${topY + d / 2 + height} L ${hw} ${topY + d + height} Z`}
        fill={color}
        opacity={0.62}
      />
      {/* left face */}
      <path
        d={`M ${hw} ${topY + d} L 1 ${topY + d / 2} L 1 ${topY + d / 2 + height} L ${hw} ${topY + d + height} Z`}
        fill={color}
        opacity={0.85}
      />
      {/* top face */}
      <path
        d={`M ${hw} ${topY} L ${w - 1} ${topY + d / 2} L ${hw} ${topY + d} L 1 ${topY + d / 2} Z`}
        fill={color}
      />
      {label && (
        <text
          x={hw}
          y={topY + d / 2 + 3}
          textAnchor="middle"
          style={mono}
          fontSize={11}
          fontWeight={700}
          fill={C.card}
        >
          {label}
        </text>
      )}
    </svg>
  );
}

// Fine measurement ticks — the maquette's ruler edge.
function RulerEdge({ ticks = 24 }: { ticks?: number }) {
  return (
    <div className="flex items-end gap-0" style={{ height: 12 }} aria-hidden="true">
      {Array.from({ length: ticks }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 1,
            marginRight: 7,
            height: i % 5 === 0 ? 12 : 6,
            background: i % 5 === 0 ? C.muted : C.faint,
          }}
        />
      ))}
    </div>
  );
}

function Kicker({ children, color = C.blue }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em]"
      style={{ ...mono, color }}
    >
      <Ruler size={12} strokeWidth={2} aria-hidden="true" />
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
      return { label: "Verloopt bijna", Icon: TriangleAlert, color: C.brass, soft: C.brassSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, color: C.red, soft: C.redSoft };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, color, soft } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...sans, color, background: soft, border: `1px solid ${color}55`, borderRadius: 6 }}
    >
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </span>
  );
}

// Primary button with a subtle 3D lift, echoing the isometric depth.
function BlueButton({
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
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-[12.5px] font-semibold transition-all duration-150 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: C.card,
        background: hot ? C.blueDeep : C.blue,
        borderRadius: 8,
        transform: hot ? "translateY(-1px)" : "none",
        boxShadow: hot ? `0 6px 16px ${C.blue}44` : `0 2px 6px ${C.blue}2e`,
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
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 text-[12px] font-semibold transition-colors duration-150 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: on ? C.card : C.ink,
        background: on ? C.ink : C.card,
        border: `1px solid ${on ? C.ink : C.line}`,
        borderRadius: 8,
      }}
    >
      {children}
    </button>
  );
}

// A gallery plinth — a crisp card floating on museum-white with a soft cast shadow.
function Plinth({
  children,
  className,
  style,
  raised = true,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  raised?: boolean;
}) {
  return (
    <div
      className={className}
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        boxShadow: raised
          ? "0 1px 2px rgba(28,33,40,0.04), 0 12px 28px -18px rgba(28,33,40,0.35)"
          : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function MatchGauge({ value, size = 58 }: { value: number; size?: number }) {
  const color = value >= 90 ? C.green : value >= 82 ? C.blue : C.brass;
  // Height of the iso-block encodes the match value.
  const h = 10 + (value / 100) * 30;
  return (
    <div className="flex shrink-0 flex-col items-center" style={{ width: size }}>
      <IsoBlock height={h} size={size * 0.78} color={color} />
      <span
        className="mt-1 text-[13px] font-bold tabular-nums leading-none"
        style={{ ...mono, color: C.ink }}
      >
        {value}
        <span className="text-[8px] font-semibold" style={{ color: C.muted }}>
          %
        </span>
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
    <div className="mb-7">
      <div className="mb-3 flex items-center gap-3">
        <span
          className="flex h-7 w-7 items-center justify-center text-[12px] font-bold"
          style={{ ...mono, color: C.card, background: C.ink, borderRadius: 7 }}
          aria-hidden="true"
        >
          {SCREEN_INDEX[screenKey]}
        </span>
        <RulerEdge />
      </div>
      <h1
        className="text-[28px] font-bold leading-none tracking-tight sm:text-[36px]"
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
  onGo,
}: {
  onOpen: (o: Opdracht) => void;
  onGo: (s: ScreenKey) => void;
}) {
  const voornaam = PROFIEL.naam.split(" ")[0];
  const modules: { key: ScreenKey; label: string; color: string; h: number }[] = [
    { key: "marktplaats", label: "Markt", color: C.blue, h: 46 },
    { key: "verificatie", label: "Verificatie", color: C.green, h: 34 },
    { key: "acties", label: "Acties", color: C.brass, h: 26 },
    { key: "facturen", label: "Facturen", color: C.ink, h: 40 },
  ];
  return (
    <div>
      <Plinth className="mb-7 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-6 p-6 sm:p-8">
          <div className="min-w-0">
            <Kicker>
              {PROFIEL.plaats} · {PROFIEL.rol}
            </Kicker>
            <h1
              className="mt-3 text-[34px] font-bold leading-[0.98] tracking-tight sm:text-[44px]"
              style={{ ...display, color: C.ink }}
            >
              Jouw platform,
              <br />
              op schaal, {voornaam}.
            </h1>
            <p
              className="mt-3 max-w-md text-[13.5px] leading-relaxed"
              style={{ ...sans, color: C.fgSoft }}
            >
              Elke module een blokje in de maquette. We tonen alleen wat telt, ruimtelijk geordend —
              precies, rustig, overzichtelijk.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span
                className="inline-flex items-center gap-2 px-3 py-2 text-[12px] font-semibold"
                style={{ ...sans, color: C.green, background: C.greenSoft, borderRadius: 999 }}
              >
                <ShieldCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                {PROFIEL.trust}
              </span>
            </div>
          </div>
          <MatchGauge value={(OPDRACHTEN[0] as Opdracht).match} size={88} />
        </div>

        {/* The maquette — an isometric platform of module blocks on a grid plinth. */}
        <div
          className="border-t px-5 py-6 sm:px-8"
          style={{ borderColor: C.lineSoft, background: C.paperSoft }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Layers size={15} strokeWidth={2.2} style={{ color: C.blue }} aria-hidden="true" />
            <span
              className="text-[12px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...sans, color: C.ink }}
            >
              Platform-maquette
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {modules.map((m) => (
              <button
                key={m.key}
                onClick={() => onGo(m.key)}
                className={`group flex flex-col items-center gap-3 p-4 transition-transform duration-150 hover:-translate-y-1 ${RING}`}
                style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12 }}
                aria-label={`Open module ${m.label}`}
              >
                <IsoBlock height={m.h} size={56} color={m.color} />
                <span className="text-[12px] font-semibold" style={{ ...sans, color: C.ink }}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Plinth>

      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Plinth key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.1em]"
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
                      background: si === k.spark.length - 1 ? C.blue : C.blueSoft,
                    }}
                  />
                );
              })}
            </div>
          </Plinth>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker color={C.green}>Beste matches</Kicker>
          </div>
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o)}
                className={`group block w-full text-left ${RING}`}
                style={{ borderRadius: 12 }}
              >
                <Plinth className="flex items-center gap-4 p-4 transition-transform duration-150 group-hover:-translate-y-0.5">
                  <MatchGauge value={o.match} size={52} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[10px] font-semibold uppercase tracking-[0.12em]"
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
                </Plinth>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3">
            <Kicker color={C.brass}>Vraagt aandacht</Kicker>
          </div>
          <div className="space-y-3">
            {ACTIES.map((a, i) => {
              const warn = a.urgentie === "warning";
              const color = warn ? C.brass : C.blue;
              return (
                <Plinth key={a.titel} className="p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center text-[10px] font-bold tabular-nums"
                      style={{ ...mono, color: C.card, background: color, borderRadius: 6 }}
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div
                        className="text-[13px] font-semibold leading-snug"
                        style={{ ...sans, color: C.ink }}
                      >
                        {a.titel}
                      </div>
                      <button
                        onClick={() => onGo("acties")}
                        className={`mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold ${RING}`}
                        style={{ ...sans, color }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </Plinth>
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
        sub="Elke opdracht een module op schaal — mét de redenen waarom ze past of schuurt."
      />

      <Plinth className="mb-6 flex items-center gap-3 px-4 py-3">
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
          className="rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums"
          style={{ ...mono, color: C.blue, background: C.blueSoft }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`px-2 py-0.5 text-[11px] font-semibold ${RING}`}
            style={{ ...sans, color: C.red }}
          >
            Wis
          </button>
        )}
      </Plinth>

      {filtered.length === 0 ? (
        <Plinth className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Box size={34} strokeWidth={1.6} style={{ color: C.blue }} aria-hidden="true" />
          <h3 className="text-[22px] font-bold tracking-tight" style={{ ...display, color: C.ink }}>
            Lege maquette
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Geen module gevonden voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="mt-1">
            <LineButton onClick={() => setQuery("")}>Filter wissen</LineButton>
          </div>
        </Plinth>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            return (
              <Plinth
                key={o.id}
                className="p-5 transition-transform duration-150 hover:-translate-y-0.5"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <MatchGauge value={o.match} size={68} />
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
                          className="px-2.5 py-0.5 text-[11px] font-semibold"
                          style={{
                            ...sans,
                            color: C.fg,
                            background: C.paperSoft,
                            border: `1px solid ${C.line}`,
                            borderRadius: 6,
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
                      className={`flex h-9 w-9 items-center justify-center transition-colors ${RING}`}
                      style={{
                        color: isSaved ? C.card : C.ink,
                        background: isSaved ? C.ink : C.card,
                        border: `1px solid ${isSaved ? C.ink : C.line}`,
                        borderRadius: 8,
                      }}
                    >
                      {isSaved ? (
                        <BookmarkCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                      ) : (
                        <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
                      )}
                    </button>
                    <BlueButton onClick={() => onOpen(o)}>
                      Bekijk
                      <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                    </BlueButton>
                  </div>
                </div>
              </Plinth>
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

      <Plinth className="mb-6 p-6 sm:p-7">
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
            <MatchGauge value={opdracht.match} size={84} />
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
              style={{ background: C.paperSoft, border: `1px solid ${C.line}`, borderRadius: 9 }}
            >
              <m.Icon size={15} strokeWidth={2} style={{ color: C.blue }} aria-hidden="true" />
              <div
                className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
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
      </Plinth>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Plinth className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.green, borderRadius: 6 }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={3} style={{ color: C.card }} />
            </span>
            <span
              className="text-[13px] font-semibold uppercase tracking-[0.04em]"
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
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Plinth>
        <Plinth className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center"
              style={{ background: C.brass, borderRadius: 6 }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={3} style={{ color: C.card }} />
            </span>
            <span
              className="text-[13px] font-semibold uppercase tracking-[0.04em]"
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
                  style={{ color: C.brass }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Plinth>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <BlueButton
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
        </BlueButton>
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
        sub="Elk certificaat een blokje in de maquette — status met label én icoon, nooit op kleur alleen."
      />

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, color, soft } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 px-3.5 py-3"
              style={{ background: soft, border: `1px solid ${color}44`, borderRadius: 9 }}
            >
              <Icon size={16} strokeWidth={2.2} style={{ color }} aria-hidden="true" />
              <span className="text-[12px] font-semibold" style={{ ...sans, color: C.ink }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Plinth className="mb-6 flex items-start gap-4 p-5">
        <ShieldCheck
          size={24}
          strokeWidth={2.2}
          style={{ color: C.green }}
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
      </Plinth>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <Kicker>Certificaten</Kicker>
          </div>
          <div className="space-y-3">
            {CREDENTIALS.map((c) => {
              const done = checked.has(c.naam);
              return (
                <Plinth key={c.naam} className="flex items-center gap-4 p-4">
                  <button
                    onClick={() => toggleCheck(c.naam)}
                    aria-pressed={done}
                    aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1px solid ${done ? C.green : C.line}`,
                      background: done ? C.green : C.card,
                      color: C.card,
                      borderRadius: 6,
                    }}
                  >
                    {done && <Check size={13} strokeWidth={2.8} aria-hidden="true" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
                      {c.naam}
                    </div>
                    <div className="text-[12px]" style={{ ...sans, color: C.muted }}>
                      {c.detail}
                    </div>
                  </div>
                  <StatusPill status={c.status} />
                </Plinth>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Kicker color={C.brass}>Documenten</Kicker>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-7 w-7 items-center justify-center ${RING}`}
              style={{
                color: C.ink,
                border: `1px solid ${C.line}`,
                borderRadius: 7,
                background: C.card,
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
                className={`px-3 py-1 text-[11px] font-semibold transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? C.card : C.ink,
                  background: feedState === s ? C.ink : C.card,
                  border: `1px solid ${feedState === s ? C.ink : C.line}`,
                  borderRadius: 7,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <div className="space-y-3" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Plinth key={i} className="p-4" raised={false}>
                  <div
                    className="h-3 w-2/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </Plinth>
              ))}
            </div>
          )}

          {feedState === "error" && (
            <Plinth
              className="flex flex-col items-center gap-2 px-4 py-10 text-center"
              style={{ borderColor: C.red }}
            >
              <XCircle size={26} strokeWidth={2} style={{ color: C.red }} aria-hidden="true" />
              <div className="text-[15px] font-bold" style={{ ...display, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.fgSoft }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <BlueButton onClick={() => setFeedState("ok")}>Opnieuw proberen</BlueButton>
              </div>
            </Plinth>
          )}

          {feedState === "ok" && (
            <div className="space-y-3">
              {DOCUMENTEN.map((d) => (
                <Plinth key={d.naam} className="flex items-center gap-3 p-3.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center text-[9px] font-bold"
                    style={{ ...mono, color: C.card, background: C.ink, borderRadius: 7 }}
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
                </Plinth>
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
        sub="Wat vandaag telt — blok voor blok afgevinkt in de maquette."
      />

      {openCount === 0 ? (
        <Plinth className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Check size={30} strokeWidth={2.4} style={{ color: C.green }} aria-hidden="true" />
          <h3 className="text-[22px] font-bold tracking-tight" style={{ ...display, color: C.ink }}>
            Maquette compleet
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Alle blokken staan. Niets meer te doen vandaag.
          </p>
        </Plinth>
      ) : (
        <>
          <div className="mb-6 flex items-baseline gap-3">
            <span
              className="text-[38px] font-bold tabular-nums leading-none"
              style={{ ...display, color: C.brass }}
            >
              {String(openCount).padStart(2, "0")}
            </span>
            <span
              className="text-[12px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.muted }}
            >
              {openCount === 1 ? "blok open" : "blokken open"}
            </span>
          </div>

          <div className="space-y-3">
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              const warn = a.urgentie === "warning";
              return (
                <Plinth key={a.titel} className="flex items-start gap-4 p-5">
                  <button
                    onClick={() => toggleDone(a.titel)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${RING}`}
                    style={{
                      border: `1px solid ${isDone ? C.green : C.line}`,
                      background: isDone ? C.green : C.card,
                      color: C.card,
                      borderRadius: 6,
                    }}
                  >
                    {isDone && <Check size={13} strokeWidth={2.8} aria-hidden="true" />}
                  </button>
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[10px] font-bold tabular-nums"
                    style={{
                      ...mono,
                      color: isDone ? C.faint : C.card,
                      background: isDone ? C.paperSoft : warn ? C.brass : C.ink,
                      borderRadius: 6,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[15px] font-semibold leading-snug"
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
                        className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold"
                        style={{ ...sans, color: warn ? C.brass : C.blue }}
                      >
                        {a.cta}
                        <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </Plinth>
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
    status === "Openstaand" ? C.brass : status === "Concept" ? C.muted : C.green;
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Facturen"
        sub="Overzichtelijk en zonder gedoe — je weet altijd waar je aan toe bent."
      />

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Betaald (mnd)", value: "€ 5.552", color: C.green, h: 40 },
          { label: "Openstaand", value: "€ 1.350", color: C.brass, h: 26 },
          { label: "Concept", value: "€ 880", color: C.ink, h: 18 },
        ].map((s) => (
          <Plinth key={s.label} className="flex items-center gap-4 p-5">
            <IsoBlock height={s.h} size={44} color={s.color} />
            <div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.muted }}
              >
                {s.label}
              </div>
              <div
                className="mt-1 text-[24px] font-bold tabular-nums"
                style={{ ...display, color: s.color }}
              >
                {s.value}
              </div>
            </div>
          </Plinth>
        ))}
      </div>

      <Plinth className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
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
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold"
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
              <tr style={{ borderTop: `1px solid ${C.line}` }}>
                <td
                  className="px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.1em]"
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
      </Plinth>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept303() {
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
              style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12 }}
              aria-hidden="true"
            >
              <IsoBlock height={16} size={30} color={C.blue} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[20px] font-bold tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Maquette
              </div>
              <div
                className="text-[9px] font-semibold uppercase tracking-[0.24em]"
                style={{ ...mono, color: C.muted }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...sans, color: C.ink }}>
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
              style={{ ...display, color: C.card, background: C.ink, borderRadius: 11 }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        {/* Museum-label nav — indexed plates on a ruler baseline. */}
        <nav className="mb-8 overflow-x-auto" aria-label="Hoofdnavigatie">
          <div
            className="flex items-stretch gap-1.5 p-1.5"
            style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12 }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-2 px-3.5 py-2 text-[12px] font-semibold transition-colors ${RING}`}
                  style={{
                    ...sans,
                    color: on ? C.card : C.ink,
                    background: on ? C.ink : "transparent",
                    borderRadius: 8,
                  }}
                >
                  <span
                    className="text-[9px] font-bold"
                    style={{ ...mono, color: on ? C.blueSoft : C.faint }}
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

        <div className="mt-9 flex items-center gap-3">
          <RulerEdge ticks={30} />
        </div>
        <footer
          className="flex flex-wrap items-center justify-between gap-2 pt-3 text-[10.5px]"
          style={{ ...mono, color: C.muted }}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: C.blue }}
              aria-hidden="true"
            />
            {SCREENS.length} modules · maquette v303
          </span>
          <span className="uppercase tracking-[0.12em]">Schaal · diepte · precisie</span>
        </footer>
      </div>
    </div>
  );
}
