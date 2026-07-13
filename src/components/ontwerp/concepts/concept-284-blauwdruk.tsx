"use client";

// Concept 284 — "Blauwdruk" · Architecturale blauwdruk / technische tekening (dark blue).
// Signature: cyaan/wit lijnwerk op diep blauwdruk-blauw, een fijn drafting-grid als achtergrond,
// technische annotaties met maatvoeringspijlen (dimension lines met eindpijltjes), een revisie-
// titelblok rechtsonder, constructielijnen en leader lines naar labels. Alles oogt geconstrueerd
// en uitgemeten — wireframe-logica als eindontwerp, technisch en gemeten. Nadrukkelijk een
// drafting/blauwdruk, geen neon cyber-grid.
// Fonts: --font-lab-spline-mono (technische mono) + --font-lab-geist (labels/tekst).

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
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
  Hourglass,
  Ruler,
  Compass,
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

// Blueprint palette. Deep drafting blue with cyan/white line work. Cool, technical, measured.
const C = {
  paper: "#0b2540",
  paper2: "#0d2b49",
  panel: "#0e3055",
  panelDeep: "#0a2038",
  ink: "#eaf4ff",
  fg: "#c6ddf1",
  fgSoft: "#9dbdda",
  muted: "#7397ba",
  faint: "#4f739a",
  line: "#1d456f",
  lineSoft: "#173c62",
  grid: "#153a5e",
  gridFine: "#0f3255",
  cyan: "#5fd0e6",
  cyanSoft: "#123a55",
  white: "#f4fbff",
  amber: "#e6b34d",
  amberSoft: "#3a341f",
  green: "#5fd6a4",
  greenSoft: "#123a34",
  red: "#f08a8a",
  redSoft: "#3a2126",
  violet: "#9db4ff",
  violetSoft: "#1c2c52",
};

const mono = { fontFamily: "var(--font-lab-spline-mono), ui-monospace, monospace" };
const sans = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };

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

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fd0e6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b2540]";

// The fine drafting grid — two nested grids like millimeter paper, plus a faint construction wash.
function draftingGrid(): string {
  return [
    `linear-gradient(${C.gridFine} 1px, transparent 1px)`,
    `linear-gradient(90deg, ${C.gridFine} 1px, transparent 1px)`,
    `linear-gradient(${C.grid} 1px, transparent 1px)`,
    `linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`,
  ].join(", ");
}
const GRID_SIZE = "12px 12px, 12px 12px, 60px 60px, 60px 60px";

// ---- Primitives -------------------------------------------------------------

function panelStyle(): CSSProperties {
  return {
    background: C.panel,
    border: `1px solid ${C.line}`,
    borderRadius: 4,
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

// Corner ticks — the little L-marks a draftsman puts on the edges of a plate.
function CornerTicks({ tone = C.cyan }: { tone?: string }) {
  const base = "pointer-events-none absolute h-2.5 w-2.5";
  return (
    <>
      <span
        className={`${base} left-1 top-1 border-l border-t`}
        style={{ borderColor: tone }}
        aria-hidden="true"
      />
      <span
        className={`${base} right-1 top-1 border-r border-t`}
        style={{ borderColor: tone }}
        aria-hidden="true"
      />
      <span
        className={`${base} bottom-1 left-1 border-b border-l`}
        style={{ borderColor: tone }}
        aria-hidden="true"
      />
      <span
        className={`${base} bottom-1 right-1 border-b border-r`}
        style={{ borderColor: tone }}
        aria-hidden="true"
      />
    </>
  );
}

// A horizontal dimension line with arrowheads at both ends and a measure label in the middle.
function DimensionLine({ label, tone = C.cyan }: { label: string; tone?: string }) {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <span className="relative h-px flex-1" style={{ background: tone }}>
        <span
          className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 -rotate-45"
          style={{ borderBottom: `1px solid ${tone}`, borderLeft: `1px solid ${tone}` }}
        />
      </span>
      <span className="text-[9px] uppercase tracking-[0.18em]" style={{ ...mono, color: tone }}>
        {label}
      </span>
      <span className="relative h-px flex-1" style={{ background: tone }}>
        <span
          className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rotate-[135deg]"
          style={{ borderBottom: `1px solid ${tone}`, borderLeft: `1px solid ${tone}` }}
        />
      </span>
    </div>
  );
}

// Verification status vocabulary — label + icon + a technical tone.
function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  soft: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, tone: C.green, soft: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Hourglass, tone: C.cyan, soft: C.cyanSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, tone: C.amber, soft: C.amberSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red, soft: C.redSoft };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, tone, soft } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
      style={{ ...mono, color: tone, background: soft, borderColor: tone }}
    >
      <Icon size={11} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </span>
  );
}

function MatchTag({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const tone = value >= 90 ? C.green : value >= 82 ? C.cyan : C.amber;
  return (
    <span
      className="inline-flex flex-col items-center rounded-sm border px-2.5 py-1.5 leading-none"
      style={{ borderColor: tone, background: C.panelDeep }}
      aria-label={`Match ${value} procent`}
    >
      <span
        className={`font-semibold tabular-nums ${size === "sm" ? "text-[16px]" : "text-[22px]"}`}
        style={{ ...mono, color: tone }}
      >
        {value}
      </span>
      <span
        className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.24em]"
        style={{ ...mono, color: C.muted }}
      >
        match
      </span>
    </span>
  );
}

function Sparkline({ data, tone, height = 34 }: { data: number[]; tone: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 62 - 20;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      {pts.map(([x, y], i) => (
        <line
          key={i}
          x1={x}
          y1={y}
          x2={x}
          y2={100}
          stroke={tone}
          strokeWidth={0.5}
          opacity={0.25}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {pts.map(([x, y], i) => (
        <rect
          key={`p-${i}`}
          x={x - 1}
          y={y - 1}
          width={2}
          height={2}
          fill={C.paper}
          stroke={tone}
          strokeWidth={0.8}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

// Filled technical button — a cyan plate that inverts on hover.
function PlateButton({
  children,
  onClick,
  tone = C.cyan,
  className,
  ariaLabel,
  ariaPressed,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: string;
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
      className={`inline-flex items-center justify-center gap-2 rounded-sm border px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...mono,
        color: hot ? C.paper : tone,
        background: hot ? tone : "transparent",
        borderColor: tone,
      }}
    >
      {children}
    </button>
  );
}

// Ghost outline button — construction-line border.
function GhostButton({
  children,
  onClick,
  tone = C.fgSoft,
  className,
  ariaLabel,
  ariaPressed,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: string;
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
      className={`inline-flex items-center justify-center gap-2 rounded-sm border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...mono,
        color: on ? C.ink : tone,
        background: on ? C.cyanSoft : "transparent",
        borderColor: on ? C.cyan : C.line,
      }}
    >
      {children}
    </button>
  );
}

// A drafting label with a leader line — a dot, a short line, then the text.
function Leader({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: C.cyan }}
        aria-hidden="true"
      />
      <span className="h-px w-4" style={{ background: C.cyan }} aria-hidden="true" />
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.2em]"
        style={{ ...mono, color: C.cyan }}
      >
        {children}
      </span>
    </span>
  );
}

function ScreenHead({ code, title, sub }: { code: string; title: string; sub?: string }) {
  return (
    <div className="mb-8 border-b pb-5" style={{ borderColor: C.line }}>
      <div className="mb-3">
        <Leader>{code}</Leader>
      </div>
      <h1
        className="text-[26px] font-semibold leading-tight tracking-tight sm:text-[32px]"
        style={{ ...sans, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-2.5 max-w-2xl text-[13.5px] leading-relaxed"
          style={{ ...sans, color: C.fgSoft }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// The revision title block — a draftsman's corner stamp with plate metadata.
function TitleBlock({ screen }: { screen: ScreenKey }) {
  const plate = SCREENS.findIndex((s) => s.key === screen) + 1;
  const label = SCREENS.find((s) => s.key === screen)?.label ?? "";
  return (
    <div
      className="overflow-hidden rounded-sm border text-[10px]"
      style={{ ...mono, borderColor: C.line, background: C.panelDeep, color: C.fgSoft }}
    >
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ background: C.panel, borderBottom: `1px solid ${C.line}` }}
      >
        <span className="uppercase tracking-[0.18em]" style={{ color: C.cyan }}>
          Titelblok
        </span>
        <Compass size={13} strokeWidth={1.8} style={{ color: C.cyan }} aria-hidden="true" />
      </div>
      <dl className="grid grid-cols-2">
        {[
          { k: "Blad", v: `A-${String(plate).padStart(2, "0")}` },
          { k: "Schaal", v: "1:1" },
          { k: "Revisie", v: "R.03" },
          { k: "Weergave", v: label },
          { k: "Getekend", v: PROFIEL.initialen },
          { k: "Datum", v: "13-07" },
        ].map((row, i) => (
          <div
            key={row.k}
            className="flex items-center justify-between gap-2 px-3 py-1.5"
            style={{
              borderBottom: i < 4 ? `1px solid ${C.lineSoft}` : "none",
              borderRight: i % 2 === 0 ? `1px solid ${C.lineSoft}` : "none",
            }}
          >
            <dt className="uppercase tracking-[0.14em]" style={{ color: C.muted }}>
              {row.k}
            </dt>
            <dd className="tabular-nums" style={{ color: C.ink }}>
              {row.v}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ---- Screens ----------------------------------------------------------------

function Dashboard({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const top = OPDRACHTEN[0] as Opdracht;
  const voornaam = PROFIEL.naam.split(" ")[0];
  const kpiTones = [C.cyan, C.green, C.amber, C.violet];
  return (
    <div>
      <div
        className="relative mb-9 overflow-hidden rounded-sm border px-7 py-8 sm:px-9 sm:py-10"
        style={{ borderColor: C.line, background: C.panelDeep }}
      >
        <CornerTicks />
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <div className="mb-3">
              <Leader>Plan · overzicht</Leader>
            </div>
            <h1
              className="text-[30px] font-semibold leading-none tracking-tight sm:text-[40px]"
              style={{ ...sans, color: C.ink }}
            >
              Goedemorgen, {voornaam}
            </h1>
            <p
              className="mt-3.5 max-w-md text-[13.5px] leading-relaxed"
              style={{ ...sans, color: C.fgSoft }}
            >
              Je werk als bouwtekening — elk onderdeel uitgemeten, elke maat gecontroleerd.
            </p>
            <div className="mt-5 max-w-xs">
              <DimensionLine label={`${PROFIEL.plaats} · ${PROFIEL.rol}`} />
            </div>
          </div>
          <div
            className="flex items-center gap-2.5 rounded-sm border px-4 py-2.5"
            style={{ borderColor: C.green, background: C.greenSoft }}
          >
            <ShieldCheck size={16} strokeWidth={2} style={{ color: C.green }} aria-hidden="true" />
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.green }}
            >
              {PROFIEL.trust}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-9 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const tone = kpiTones[i % kpiTones.length] ?? C.cyan;
          return (
            <Panel key={k.label} className="relative p-5">
              <CornerTicks tone={C.lineSoft} />
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums"
                  style={{ ...mono, color: k.up ? C.green : C.amber }}
                >
                  <Trend size={11} strokeWidth={2.2} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-2 text-[24px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-3">
                <Sparkline data={k.spark} tone={tone} />
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4">
            <Leader>Detail · beste match</Leader>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group relative block w-full overflow-hidden rounded-sm p-0 text-left transition-colors duration-200 ${RING}`}
            style={{ ...panelStyle() }}
          >
            <CornerTicks />
            <span className="flex items-start gap-5 p-6">
              <MatchTag value={top.match} />
              <span className="min-w-0 flex-1">
                <span
                  className="text-[9px] font-semibold uppercase tracking-[0.22em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {top.id}
                </span>
                <span
                  className="mt-1 block text-[18px] font-semibold leading-tight"
                  style={{ ...sans, color: C.ink }}
                >
                  {top.titel}
                </span>
                <span className="mt-1 block text-[12.5px]" style={{ ...mono, color: C.muted }}>
                  {top.opdrachtgever} · {top.plaats} · {top.tarief}
                </span>
                <span className="mt-3.5 flex flex-wrap gap-1.5">
                  {top.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-[0.08em]"
                      style={{ ...mono, color: C.fgSoft, borderColor: C.line }}
                    >
                      {t}
                    </span>
                  ))}
                </span>
              </span>
              <ArrowRight
                size={20}
                className="mt-1 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                style={{ color: C.cyan }}
                aria-hidden="true"
              />
            </span>
          </button>

          <Panel className="relative mt-5 flex items-start gap-4 p-6">
            <CornerTicks tone={C.lineSoft} />
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border"
              style={{ borderColor: C.green, background: C.greenSoft, color: C.green }}
              aria-hidden="true"
            >
              <ShieldCheck size={21} strokeWidth={2} />
            </span>
            <div>
              <span className="inline-flex items-center gap-2">
                <span className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
                  {PROFIEL.trust}
                </span>
                <BadgeCheck
                  size={15}
                  strokeWidth={2}
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
              </span>
              <span
                className="mt-1 block text-[12.5px] leading-relaxed"
                style={{ ...sans, color: C.fgSoft }}
              >
                Je documenten zijn geverifieerd en gecontroleerd — opdrachtgevers zien meteen dat de
                maatvoering klopt.
              </span>
            </div>
          </Panel>
        </div>

        <div>
          <div className="mb-4">
            <Leader>Notities · aandacht</Leader>
          </div>
          <ul className="space-y-3">
            {ACTIES.map((a) => {
              const tone = a.urgentie === "warning" ? C.amber : C.cyan;
              return (
                <Panel key={a.titel} className="relative overflow-hidden p-0">
                  <span className="block h-1" style={{ background: tone }} aria-hidden="true" />
                  <div className="p-4">
                    <div
                      className="text-[13px] font-semibold leading-snug"
                      style={{ ...sans, color: C.ink }}
                    >
                      {a.titel}
                    </div>
                    <div
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
                      style={{ ...mono, color: tone }}
                    >
                      {a.cta}
                      <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                    </div>
                  </div>
                </Panel>
              );
            })}
          </ul>
          <div className="mt-5">
            <TitleBlock screen="dashboard" />
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
        code="Blad A-02 · marktplaats"
        title="Opdrachten, technisch uitgemeten"
        sub="Elke opdracht is gemeten tegen jouw profiel — match, tarief en reistijd staan in maat."
      />

      <div
        className="mb-7 flex items-center gap-2.5 rounded-sm border px-4 py-3"
        style={{ borderColor: C.line, background: C.panelDeep }}
      >
        <Search size={16} className="shrink-0" style={{ color: C.cyan }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:opacity-55"
          style={{ ...mono, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`rounded-sm border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${RING}`}
            style={{ ...mono, color: C.cyan, borderColor: C.cyan }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Panel className="relative flex flex-col items-center gap-3 px-6 py-16 text-center">
          <CornerTicks />
          <span
            className="flex h-16 w-16 items-center justify-center rounded-sm border"
            style={{ borderColor: C.cyan, color: C.cyan }}
            aria-hidden="true"
          >
            <Ruler size={28} strokeWidth={1.6} />
          </span>
          <h3 className="text-[20px] font-semibold" style={{ ...sans, color: C.ink }}>
            Leeg tekenblad
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...mono, color: C.muted }}>
            Geen maat gevonden voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="mt-1">
            <GhostButton onClick={() => setQuery("")} tone={C.cyan}>
              Filter wissen
            </GhostButton>
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            const tone = o.match >= 90 ? C.green : o.match >= 82 ? C.cyan : C.amber;
            return (
              <div
                key={o.id}
                className="group relative flex h-full flex-col overflow-hidden rounded-sm border p-6 transition-colors duration-200"
                style={{ borderColor: C.line, background: C.panel }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = tone)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.line)}
              >
                <CornerTicks tone={C.lineSoft} />
                <div className="flex items-start justify-between gap-3">
                  <MatchTag value={o.match} size="sm" />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-9 w-9 items-center justify-center rounded-sm border transition-colors ${RING}`}
                    style={{
                      color: isSaved ? C.cyan : C.muted,
                      background: isSaved ? C.cyanSoft : "transparent",
                      borderColor: isSaved ? C.cyan : C.line,
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
                  className="mt-4 text-[9px] font-semibold uppercase tracking-[0.22em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {o.id}
                </span>
                <h3
                  className="mt-1 text-[16px] font-semibold leading-tight"
                  style={{ ...sans, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <div className="mt-0.5 text-[12.5px]" style={{ ...mono, color: C.muted }}>
                  {o.opdrachtgever}
                </div>
                <dl
                  className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 text-[11.5px]"
                  style={{ ...mono, color: C.fgSoft }}
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
                <div className="my-4">
                  <DimensionLine label={`${o.uren}`} tone={C.lineSoft} />
                </div>
                <div className="mt-auto">
                  <PlateButton onClick={() => onOpen(o)} tone={tone} className="w-full">
                    Bekijk blad
                    <ArrowRight
                      size={14}
                      strokeWidth={2.2}
                      className="transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </PlateButton>
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
  return (
    <div>
      <div className="mb-6">
        <GhostButton onClick={onBack} ariaLabel="Terug naar marktplaats">
          <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
          Terug
        </GhostButton>
      </div>

      <Panel className="relative overflow-hidden p-7">
        <CornerTicks />
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <MatchTag value={opdracht.match} />
            <div>
              <span
                className="text-[9px] font-semibold uppercase tracking-[0.22em]"
                style={{ ...mono, color: C.faint }}
              >
                {opdracht.id}
              </span>
              <h2
                className="mt-1 text-[24px] font-semibold leading-tight tracking-tight"
                style={{ ...sans, color: C.ink }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[13px]" style={{ ...mono, color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <GhostButton
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
          </GhostButton>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
            { Icon: Clock, label: "Inzet", value: opdracht.uren },
            { Icon: Calendar, label: "Start", value: opdracht.start },
            { Icon: MapPin, label: "Plaats", value: opdracht.plaats },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-sm border p-4"
              style={{ borderColor: C.line, background: C.panelDeep }}
            >
              <m.Icon size={15} strokeWidth={2} style={{ color: C.cyan }} aria-hidden="true" />
              <div
                className="mt-2 text-[9px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <DimensionLine label={`Blad ${opdracht.id}`} />
        </div>
      </Panel>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="p-6">
          <div className="mb-3.5 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-sm border"
              style={{ borderColor: C.green, background: C.greenSoft, color: C.green }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={2.6} />
            </span>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.green }}
            >
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px]"
                style={{ ...sans, color: C.fg }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-6">
          <div className="mb-3.5 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-sm border"
              style={{ borderColor: C.amber, background: C.amberSoft, color: C.amber }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={2.6} />
            </span>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.amber }}
            >
              Even op letten
            </span>
          </div>
          <ul className="space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px]"
                style={{ ...sans, color: C.fg }}
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
        <PlateButton
          onClick={() => setApplied((v) => !v)}
          tone={applied ? C.green : C.cyan}
          ariaPressed={applied}
          className="px-6 py-3 text-[13px]"
        >
          {applied ? (
            <Check size={16} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </PlateButton>
        {applied && (
          <span className="text-[12px]" style={{ ...mono, color: C.muted }}>
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
        code="Blad A-04 · verificatie"
        title="Documenten, gecontroleerd op maat"
        sub="Elke status heeft een label én icoon — nooit alleen kleur — zodat de norm altijd leesbaar is."
      />

      <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, tone, soft } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 rounded-sm border px-4 py-3.5"
              style={{ borderColor: tone, background: soft }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border"
                style={{ borderColor: tone, color: tone }}
                aria-hidden="true"
              >
                <Icon size={15} strokeWidth={2.2} />
              </span>
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.ink }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Panel className="relative mb-7 flex items-center gap-4 p-6">
        <CornerTicks tone={C.lineSoft} />
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border"
          style={{ borderColor: C.green, background: C.greenSoft, color: C.green }}
          aria-hidden="true"
        >
          <ShieldCheck size={24} strokeWidth={2} />
        </span>
        <div>
          <div className="text-[15px] font-semibold" style={{ ...sans, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[12.5px]" style={{ ...sans, color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            const { tone, soft } = statusMeta(c.status);
            return (
              <Panel key={c.naam} className="flex items-center gap-3.5 p-4">
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border transition-colors ${RING}`}
                  style={{
                    borderColor: done ? C.cyan : C.line,
                    background: done ? C.cyan : "transparent",
                    color: C.paper,
                  }}
                >
                  {done && <Check size={14} strokeWidth={2.6} aria-hidden="true" />}
                </button>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border"
                  style={{ borderColor: tone, background: soft, color: tone }}
                  aria-hidden="true"
                >
                  <FileText size={16} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ ...sans, color: C.ink }}>
                    {c.naam}
                  </div>
                  <div className="text-[11.5px]" style={{ ...mono, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <StatusPill status={c.status} />
              </Panel>
            );
          })}
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.ink }}
            >
              <FileText size={15} strokeWidth={2} style={{ color: C.cyan }} aria-hidden="true" />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center rounded-sm border ${RING}`}
              style={{ borderColor: C.line, color: C.cyan }}
              aria-label="Vernieuw documenten"
            >
              <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3.5 flex gap-1.5" role="tablist" aria-label="Documentweergave">
            {(["ok", "loading", "error"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={feedState === s}
                onClick={() => setFeedState(s)}
                className={`rounded-sm border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors ${RING}`}
                style={{
                  ...mono,
                  color: feedState === s ? C.paper : C.muted,
                  background: feedState === s ? C.cyan : "transparent",
                  borderColor: feedState === s ? C.cyan : C.line,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2.5" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Panel key={i} className="p-4">
                  <div
                    className="h-3 w-2/3 animate-pulse rounded-sm"
                    style={{ background: C.lineSoft }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded-sm"
                    style={{ background: C.lineSoft }}
                  />
                </Panel>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Panel
              className="flex flex-col items-center gap-2 px-4 py-9 text-center"
              style={{ borderColor: C.red }}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-sm border"
                style={{ borderColor: C.red, background: C.redSoft, color: C.red }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-semibold" style={{ ...sans, color: C.ink }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...mono, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <GhostButton onClick={() => setFeedState("ok")} tone={C.red}>
                  Opnieuw proberen
                </GhostButton>
              </div>
            </Panel>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2.5">
              {DOCUMENTEN.map((d) => {
                const { tone, soft } = statusMeta(d.status);
                return (
                  <Panel key={d.naam} className="flex items-center gap-3 p-3.5">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border text-[9px] font-bold"
                      style={{ ...mono, borderColor: tone, background: soft, color: tone }}
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
      <ScreenHead code="Blad A-05 · acties" title="Openstaande revisiepunten" />

      {openCount === 0 ? (
        <Panel className="relative flex flex-col items-center gap-3 px-6 py-16 text-center">
          <CornerTicks />
          <span
            className="flex h-16 w-16 items-center justify-center rounded-sm border"
            style={{ borderColor: C.green, background: C.greenSoft, color: C.green }}
            aria-hidden="true"
          >
            <Check size={30} strokeWidth={2.2} />
          </span>
          <h3 className="text-[20px] font-semibold" style={{ ...sans, color: C.ink }}>
            Tekening afgetekend
          </h3>
          <p className="max-w-xs text-[13px]" style={{ ...mono, color: C.muted }}>
            Geen openstaande revisiepunten. Het blad is compleet.
          </p>
        </Panel>
      ) : (
        <>
          <div
            className="mb-5 inline-flex items-center gap-2.5 rounded-sm border px-4 py-2"
            style={{ borderColor: C.amber, background: C.amberSoft }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-sm text-[12px] font-bold tabular-nums"
              style={{ ...mono, background: C.amber, color: C.paper }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.amber }}
            >
              {openCount} {openCount === 1 ? "punt" : "punten"} open
            </span>
          </div>

          <ul className="space-y-3.5">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const tone = isDone ? C.green : a.urgentie === "warning" ? C.amber : C.cyan;
              return (
                <Panel key={a.titel} className="overflow-hidden p-0">
                  <span className="block h-1" style={{ background: tone }} aria-hidden="true" />
                  <div className="flex items-start gap-4 p-5">
                    <button
                      onClick={() => toggleDone(a.titel)}
                      aria-pressed={isDone}
                      aria-label={
                        isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`
                      }
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border transition-colors ${RING}`}
                      style={{
                        borderColor: isDone ? C.green : C.line,
                        background: isDone ? C.green : "transparent",
                        color: C.paper,
                      }}
                    >
                      {isDone && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[14.5px] font-semibold leading-snug"
                        style={{
                          ...sans,
                          color: C.ink,
                          textDecoration: isDone ? "line-through" : "none",
                          opacity: isDone ? 0.55 : 1,
                        }}
                      >
                        {a.titel}
                      </div>
                      <p
                        className="mt-1 text-[12.5px]"
                        style={{ ...sans, color: C.muted, opacity: isDone ? 0.55 : 1 }}
                      >
                        {a.detail}
                      </p>
                      {!isDone && (
                        <span
                          className="mt-2.5 inline-flex items-center gap-1 rounded-sm border px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                          style={{ ...mono, color: tone, borderColor: tone }}
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
  const statusMap = (status: string): { tone: string; soft: string; Icon: LucideIcon } =>
    status === "Betaald"
      ? { tone: C.green, soft: C.greenSoft, Icon: Check }
      : status === "Openstaand"
        ? { tone: C.amber, soft: C.amberSoft, Icon: Clock }
        : { tone: C.muted, soft: C.panelDeep, Icon: FileText };
  return (
    <div>
      <ScreenHead
        code="Blad A-06 · facturen"
        title="Facturatie-staat"
        sub="Bedragen in tabelvorm, uitgelijnd en gecontroleerd — zodat je weet waar je aan toe bent."
      />

      <div className="mb-7 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 lg:col-span-2">
          {[
            { label: "Betaald (mnd)", value: "€ 5.552", tone: C.green },
            { label: "Openstaand", value: "€ 1.350", tone: C.amber },
            { label: "Concept", value: "€ 880", tone: C.muted },
          ].map((s) => (
            <Panel key={s.label} className="relative p-5">
              <CornerTicks tone={C.lineSoft} />
              <div
                className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.muted }}
              >
                {s.label}
              </div>
              <div
                className="mt-2 text-[22px] font-semibold tabular-nums"
                style={{ ...mono, color: s.tone }}
              >
                {s.value}
              </div>
            </Panel>
          ))}
        </div>
        <Panel className="flex flex-col justify-between p-5">
          <div
            className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
            style={{ ...mono, color: C.muted }}
          >
            Bedrag per factuur
          </div>
          <Sparkline data={trend} tone={C.cyan} height={48} />
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
                    className="px-3 py-3 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                    style={{ ...mono, color: C.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const sm = statusMap(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.panelDeep)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td
                      className="px-3 py-3.5 text-[12px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3.5 text-[12.5px]" style={{ ...sans, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-3.5 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3.5 text-[13px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                        style={{
                          ...mono,
                          color: sm.tone,
                          background: sm.soft,
                          borderColor: sm.tone,
                        }}
                      >
                        <sm.Icon size={11} strokeWidth={2.4} aria-hidden="true" />
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `1px solid ${C.line}` }}>
                <td
                  className="px-3 py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.muted }}
                >
                  Totaal
                </td>
                <td />
                <td />
                <td
                  className="px-3 py-3.5 text-[13px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.cyan }}
                >
                  € 7.782
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept284() {
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
      className="min-h-[680px] w-full antialiased"
      style={{
        ...sans,
        color: C.fg,
        background: C.paper,
        backgroundImage: draftingGrid(),
        backgroundSize: GRID_SIZE,
      }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-sm border"
              style={{ borderColor: C.cyan, background: C.cyanSoft, color: C.cyan }}
              aria-hidden="true"
            >
              <Compass size={20} strokeWidth={2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[18px] font-semibold tracking-tight"
                style={{ ...sans, color: C.ink }}
              >
                Blauwdruk
              </div>
              <div
                className="text-[9px] font-semibold uppercase tracking-[0.28em]"
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
                className="inline-flex items-center gap-1 text-[10.5px]"
                style={{ ...mono, color: C.green }}
              >
                <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-sm border text-[12px] font-bold"
              style={{ ...mono, borderColor: C.cyan, background: C.cyanSoft, color: C.cyan }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav
          className="mb-9 flex flex-wrap gap-1.5 overflow-x-auto border-y py-2"
          style={{ borderColor: C.line }}
          aria-label="Hoofdnavigatie"
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICONS[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors duration-200 ${RING}`}
                style={{
                  ...mono,
                  color: on ? C.paper : C.fgSoft,
                  background: on ? C.cyan : "transparent",
                  borderColor: on ? C.cyan : C.line,
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
          className="mt-10 flex flex-wrap items-center justify-between gap-2 pt-5 text-[10px] uppercase tracking-[0.14em]"
          style={{ ...mono, borderTop: `1px solid ${C.line}`, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Ruler size={12} strokeWidth={2} style={{ color: C.cyan }} aria-hidden="true" />
            {SCREENS.length} bladen · blauwdruk v284
          </span>
          <span>Technisch · gemeten · in maat</span>
        </footer>
      </div>
    </div>
  );
}
