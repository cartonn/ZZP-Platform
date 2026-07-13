"use client";

// Concept 281 — "Atlas" · Cartografisch / topografisch (light).
// Signature: de interface als landkaart en survey-chart. Fijne hoogtelijnen (contour) als
// achtergrondtextuur, een coördinaten-graticule, kaartspelden met plaatsnaam voor opdrachten,
// en een gedempt survey-palet (papier-crème, inkt-antraciet, kaart-groen, water-blauw, oker).
// De navigatie leest als een kaartlegenda; marktplaats-opdrachten krijgen afstand/reistijd per pin.
// Fonts: --font-lab-space (koppen) + --font-lab-mono (coördinaten/labels).

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
  Compass,
  Navigation,
  Route,
  Map as MapIcon,
  Milestone,
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

// Survey palette — muted paper-cream, ink-anthracite, map-green, water-blue, elevation-ochre.
const C = {
  paper: "#f4efe3",
  paper2: "#efe8d8",
  paperDeep: "#eae0cc",
  panel: "#faf7ef",
  panelDeep: "#f3ecdc",
  line: "#d7cbae",
  lineSoft: "#e4dabf",
  grid: "#e0d3b6",
  contour: "#e3d6b8",
  contourDeep: "#dccdaa",
  ink: "#292d27",
  fg: "#383d35",
  fgSoft: "#585e50",
  muted: "#847c68",
  faint: "#a99e82",
  green: "#4a7a51",
  greenSoft: "#d6e3ce",
  greenWash: "#e5edda",
  water: "#3d6f8e",
  waterSoft: "#cfe1e9",
  waterWash: "#e0ecf1",
  ochre: "#b07f2c",
  ochreSoft: "#ecdcb2",
  ochreWash: "#f1e7c9",
  rust: "#a85a3b",
  rustSoft: "#eccdbd",
  rustWash: "#f2ddd0",
};

const head = { fontFamily: "var(--font-lab-space), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3d6f8e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4efe3]";

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

// Every screen is a "kaartblad" tinted with one survey pigment + a grid-reference letter.
const SHEET: Record<
  ScreenKey,
  { tone: string; soft: string; wash: string; ref: string; naam: string }
> = {
  dashboard: { tone: C.green, soft: C.greenSoft, wash: C.greenWash, ref: "A1", naam: "Basiskaart" },
  marktplaats: {
    tone: C.water,
    soft: C.waterSoft,
    wash: C.waterWash,
    ref: "B2",
    naam: "Terreinen",
  },
  opdracht: { tone: C.ochre, soft: C.ochreSoft, wash: C.ochreWash, ref: "C3", naam: "Perceel" },
  verificatie: {
    tone: C.green,
    soft: C.greenSoft,
    wash: C.greenWash,
    ref: "D1",
    naam: "Peilmerken",
  },
  acties: { tone: C.ochre, soft: C.ochreSoft, wash: C.ochreWash, ref: "E4", naam: "Route" },
  facturen: { tone: C.water, soft: C.waterSoft, wash: C.waterWash, ref: "F2", naam: "Kadaster" },
  documenten: { tone: C.green, soft: C.greenSoft, wash: C.greenWash, ref: "G1", naam: "Archief" },
  berichten: { tone: C.water, soft: C.waterSoft, wash: C.waterWash, ref: "H2", naam: "Baken" },
};

// Presentational geo-decoration derived from plaats — coordinates, afstand, reistijd per plek.
// Puur cartografische versiering; kern-data blijft uit mock.ts.
const GEO: Record<string, { lat: string; lon: string; afstand: string; reistijd: string }> = {
  Utrecht: { lat: "52.09°N", lon: "05.12°O", afstand: "8 km", reistijd: "12 min" },
  Almere: { lat: "52.37°N", lon: "05.22°O", afstand: "41 km", reistijd: "38 min" },
  Zeist: { lat: "52.09°N", lon: "05.23°O", afstand: "11 km", reistijd: "16 min" },
};

function geoOf(plaats: string): { lat: string; lon: string; afstand: string; reistijd: string } {
  return GEO[plaats] ?? { lat: "52.10°N", lon: "05.10°O", afstand: "— km", reistijd: "— min" };
}

// ---- Cartografische texturen ------------------------------------------------

// Hoogtelijnen (contour) als achtergrondtextuur — concentrische ringen als op een survey-chart.
function contours(a: string, b: string): string {
  return [
    `repeating-radial-gradient(circle at 20% 16%, transparent 0 21px, ${a} 21px 22px, transparent 22px 43px)`,
    `repeating-radial-gradient(circle at 84% 86%, transparent 0 27px, ${b} 27px 28px, transparent 28px 55px)`,
  ].join(", ");
}

// Graticule — fijn coördinatenraster van meridianen en parallellen.
function graticule(gridLine: string, step: number): string {
  return [
    `repeating-linear-gradient(0deg, ${gridLine} 0 1px, transparent 1px ${step}px)`,
    `repeating-linear-gradient(90deg, ${gridLine} 0 1px, transparent 1px ${step}px)`,
  ].join(", ");
}

// ---- Primitives -------------------------------------------------------------

function sheetStyle(): CSSProperties {
  return {
    background: C.panel,
    border: `1px solid ${C.lineSoft}`,
    borderRadius: 12,
  };
}

function Sheet({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={className} style={{ ...sheetStyle(), ...style }}>
      {children}
    </div>
  );
}

// Een coördinaat-label in mono, zoals op een kaartrand.
function Coord({ lat, lon, tone = C.muted }: { lat: string; lon: string; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] tabular-nums tracking-tight"
      style={{ ...mono, color: tone }}
    >
      <Navigation size={11} strokeWidth={2} aria-hidden="true" />
      {lat} · {lon}
    </span>
  );
}

// Kaartspeld met plaatsnaam — een topografische marker.
function Pin({ plaats, tone, soft }: { plaats: string; tone: string; soft: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="relative flex h-7 w-7 items-center justify-center rounded-full"
        style={{ background: soft, color: tone, border: `1px solid ${tone}` }}
        aria-hidden="true"
      >
        <MapPin size={14} strokeWidth={2.2} />
      </span>
      <span className="text-[13px] font-semibold" style={{ ...head, color: C.ink }}>
        {plaats}
      </span>
    </span>
  );
}

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
      return { label: "In beoordeling", Icon: Hourglass, tone: C.water, soft: C.waterSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, tone: C.ochre, soft: C.ochreSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.rust, soft: C.rustSoft };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, tone, soft } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md py-1 pl-1.5 pr-2.5 text-[11px] font-semibold"
      style={{ ...head, color: tone, background: soft, border: `1px solid ${tone}33` }}
    >
      <span
        className="flex h-4 w-4 items-center justify-center rounded-[4px]"
        style={{ background: tone }}
        aria-hidden="true"
      >
        <Icon size={10} strokeWidth={2.4} color={C.panel} />
      </span>
      {label}
    </span>
  );
}

// Hoogte-index — het match-getal als elevatie op de kaart.
function Elevation({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const tone = value >= 90 ? C.green : value >= 82 ? C.ochre : C.water;
  const soft = value >= 90 ? C.greenSoft : value >= 82 ? C.ochreSoft : C.waterSoft;
  return (
    <span
      className="inline-flex flex-col items-center justify-center rounded-lg px-3 py-1.5"
      style={{ background: soft, border: `1px solid ${tone}44` }}
      aria-label={`Match ${value} procent`}
    >
      <span
        className={`font-bold tabular-nums leading-none ${size === "sm" ? "text-[17px]" : "text-[22px]"}`}
        style={{ ...head, color: tone }}
      >
        {value}
      </span>
      <span
        className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.16em]"
        style={{ ...mono, color: tone }}
      >
        match
      </span>
    </span>
  );
}

// Terreinprofiel — een hoogtelijn-sparkline (survey elevation trace).
function Profile({ data, tone, height = 34 }: { data: number[]; tone: string; height?: number }) {
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
      <defs>
        <linearGradient id={`el-${tone.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity={0.22} />
          <stop offset="100%" stopColor={tone} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {[26, 52, 78].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="100"
          y2={y}
          stroke={tone}
          strokeWidth={0.4}
          strokeDasharray="1.5 2"
          opacity={0.28}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <polygon points={`0,100 ${line} 100,100`} fill={`url(#el-${tone.replace("#", "")})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.3} fill={tone} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

// Primaire "kompas"-knop — ingekleurd survey-vlak; hover verdiept naar inkt.
function CompassButton({
  children,
  onClick,
  tone = C.water,
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-colors duration-200 ${RING} ${className ?? ""}`}
      style={{ ...head, color: C.panel, background: hot ? C.ink : tone }}
    >
      {children}
    </button>
  );
}

// Secundaire "legenda"-knop — dunne kaartlijn; hover wast een pigment.
function LegendButton({
  children,
  onClick,
  tone = C.green,
  soft = C.greenSoft,
  className,
  ariaLabel,
  ariaPressed,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: string;
  soft?: string;
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-semibold transition-colors duration-200 ${RING} ${className ?? ""}`}
      style={{
        ...head,
        color: tone,
        background: on ? soft : "transparent",
        border: `1px solid ${on ? tone : C.line}`,
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
  const s = SHEET[screenKey];
  return (
    <div className="mb-8">
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <span
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{ ...mono, color: s.tone, background: s.soft, border: `1px solid ${s.tone}44` }}
        >
          <Milestone size={11} strokeWidth={2} aria-hidden="true" />
          Blad {s.ref}
        </span>
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ ...mono, color: C.muted }}
        >
          {s.naam}
        </span>
      </div>
      <h1
        className="text-[29px] font-semibold leading-tight tracking-tight sm:text-[35px]"
        style={{ ...head, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-3 max-w-xl text-[14px] leading-relaxed"
          style={{ ...head, color: C.fgSoft }}
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
  const g = geoOf(top.plaats);
  const kpiTones = [C.green, C.water, C.ochre, C.rust];
  return (
    <div>
      <div
        className="mb-9 overflow-hidden rounded-2xl px-7 py-8 sm:px-9 sm:py-10"
        style={{
          border: `1px solid ${C.line}`,
          background: C.panelDeep,
          backgroundImage: `${graticule(C.grid, 30)}, ${contours(C.contour, C.contourDeep)}`,
        }}
      >
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Compass size={14} strokeWidth={2} style={{ color: C.green }} aria-hidden="true" />
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.green }}
              >
                {PROFIEL.plaats} · {PROFIEL.rol}
              </span>
            </div>
            <h1
              className="text-[33px] font-semibold leading-none tracking-tight sm:text-[41px]"
              style={{ ...head, color: C.ink }}
            >
              Goedemorgen, {voornaam}
            </h1>
            <p
              className="mt-4 max-w-md text-[14px] leading-relaxed"
              style={{ ...head, color: C.fgSoft }}
            >
              Je werkgebied in kaart — hoogtelijnen, peilmerken en de kortste route naar de volgende
              opdracht.
            </p>
            <div className="mt-4">
              <Coord
                lat={geoOf(PROFIEL.plaats).lat}
                lon={geoOf(PROFIEL.plaats).lon}
                tone={C.muted}
              />
            </div>
          </div>
          <div
            className="flex items-center gap-2.5 rounded-lg px-4 py-2.5"
            style={{ background: C.greenSoft, border: `1px solid ${C.green}44` }}
          >
            <ShieldCheck size={16} strokeWidth={2} style={{ color: C.green }} aria-hidden="true" />
            <span className="text-[12.5px] font-semibold" style={{ ...head, color: C.green }}>
              {PROFIEL.trust}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-9 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const tone = kpiTones[i % kpiTones.length] ?? C.green;
          return (
            <Sheet key={k.label} className="p-5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ ...mono, color: k.up ? C.green : C.ochre }}
                >
                  <Trend size={11} strokeWidth={2.2} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-2 text-[26px] font-semibold tabular-nums leading-none"
                style={{ ...head, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-3">
                <Profile data={k.spark} tone={tone} />
              </div>
            </Sheet>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <MapIcon size={16} strokeWidth={2} style={{ color: C.green }} aria-hidden="true" />
            <h2
              className="text-[16px] font-semibold tracking-tight"
              style={{ ...head, color: C.ink }}
            >
              Dichtstbijzijnde match
            </h2>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group block w-full overflow-hidden rounded-xl p-0 text-left transition-colors duration-200 ${RING}`}
            style={{
              ...sheetStyle(),
              backgroundImage: contours(C.contour, C.contourDeep),
            }}
          >
            <span className="flex items-start gap-5 p-6">
              <Elevation value={top.match} />
              <span className="min-w-0 flex-1">
                <span className="mb-1.5 block">
                  <Coord lat={g.lat} lon={g.lon} tone={C.faint} />
                </span>
                <span
                  className="block text-[18px] font-semibold leading-tight"
                  style={{ ...head, color: C.ink }}
                >
                  {top.titel}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <Pin plaats={top.plaats} tone={C.green} soft={C.greenSoft} />
                  <span className="text-[12.5px]" style={{ ...head, color: C.muted }}>
                    {top.opdrachtgever}
                  </span>
                </span>
                <span className="mt-3.5 flex flex-wrap gap-1.5">
                  {top.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md px-2.5 py-0.5 text-[11px]"
                      style={{
                        ...mono,
                        color: C.fgSoft,
                        background: C.paper2,
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
                className="mt-1 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                style={{ color: C.green }}
                aria-hidden="true"
              />
            </span>
            <span
              className="flex items-center justify-between gap-3 px-6 py-3"
              style={{ borderTop: `1px solid ${C.lineSoft}`, background: C.panelDeep }}
            >
              <span
                className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold"
                style={{ ...mono, color: C.water }}
              >
                <Route size={13} strokeWidth={2} aria-hidden="true" />
                {g.afstand} · {g.reistijd} reistijd
              </span>
              <span className="text-[11px]" style={{ ...mono, color: C.muted }}>
                {top.tarief}
              </span>
            </span>
          </button>

          <Sheet
            className="mt-5 flex items-start gap-4 p-6"
            style={{ backgroundImage: contours(C.greenWash, C.greenSoft) }}
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
              style={{ background: C.greenSoft, color: C.green, border: `1px solid ${C.green}44` }}
              aria-hidden="true"
            >
              <ShieldCheck size={21} strokeWidth={2} />
            </span>
            <div>
              <span className="inline-flex items-center gap-2">
                <span className="text-[14.5px] font-semibold" style={{ ...head, color: C.ink }}>
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
                className="mt-1 block text-[13px] leading-relaxed"
                style={{ ...head, color: C.fgSoft }}
              >
                Je peilmerken zijn ingemeten en geverifieerd — opdrachtgevers zien meteen dat je
                positie klopt.
              </span>
            </div>
          </Sheet>
        </div>

        <div>
          <div className="mb-4 flex items-center gap-2">
            <ListTodo size={16} strokeWidth={2} style={{ color: C.ochre }} aria-hidden="true" />
            <h2
              className="text-[16px] font-semibold tracking-tight"
              style={{ ...head, color: C.ink }}
            >
              Vraagt aandacht
            </h2>
          </div>
          <ul className="space-y-3.5">
            {ACTIES.map((a) => {
              const tone = a.urgentie === "warning" ? C.rust : C.ochre;
              const soft = a.urgentie === "warning" ? C.rustSoft : C.ochreSoft;
              return (
                <Sheet key={a.titel} className="overflow-hidden p-0">
                  <span className="block h-1" style={{ background: tone }} aria-hidden="true" />
                  <div className="p-4">
                    <div
                      className="text-[13px] font-semibold leading-snug"
                      style={{ ...head, color: C.ink }}
                    >
                      {a.titel}
                    </div>
                    <div
                      className="mt-1.5 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-semibold"
                      style={{ ...head, color: tone, background: soft }}
                    >
                      {a.cta}
                      <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                    </div>
                  </div>
                </Sheet>
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
        title="Opdrachten op de kaart"
        sub="Elke opdracht als peilmerk — met coördinaat, afstand en reistijd vanaf jouw standplaats."
      />

      <div
        className="mb-7 flex items-center gap-2.5 rounded-lg px-5 py-3"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <Search size={16} className="shrink-0" style={{ color: C.water }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-55"
          style={{ ...head, color: C.ink }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`rounded-md px-3 py-1 text-[11px] font-semibold ${RING}`}
            style={{ ...head, color: C.water, background: C.waterSoft }}
          >
            Wis
          </button>
        )}
      </div>

      <div
        className="mb-6 flex flex-wrap items-center gap-2 text-[11px]"
        style={{ ...mono, color: C.muted }}
      >
        <span
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1"
          style={{ background: C.panelDeep, border: `1px solid ${C.lineSoft}` }}
        >
          <Compass size={12} strokeWidth={2} aria-hidden="true" />
          Standplaats {PROFIEL.plaats}
        </span>
        <span
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1"
          style={{ background: C.panelDeep, border: `1px solid ${C.lineSoft}` }}
        >
          {filtered.length} van {OPDRACHTEN.length} peilmerken
        </span>
      </div>

      {filtered.length === 0 ? (
        <Sheet
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          style={{ backgroundImage: contours(C.waterWash, C.waterSoft) }}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-xl"
            style={{ background: C.waterSoft, color: C.water, border: `1px solid ${C.water}44` }}
            aria-hidden="true"
          >
            <MapIcon size={28} strokeWidth={1.8} />
          </span>
          <h3 className="text-[22px] font-semibold" style={{ ...head, color: C.ink }}>
            Terra incognita
          </h3>
          <p className="max-w-xs text-[13.5px]" style={{ ...head, color: C.muted }}>
            Geen peilmerk voor &ldquo;{query}&rdquo;. Verleg de zoekterm en kartografeer opnieuw.
          </p>
          <div className="mt-1">
            <LegendButton onClick={() => setQuery("")} tone={C.water} soft={C.waterSoft}>
              Filter wissen
            </LegendButton>
          </div>
        </Sheet>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            const g = geoOf(o.plaats);
            const p =
              o.match >= 90
                ? { tone: C.green, soft: C.greenSoft, wash: C.greenWash }
                : o.match >= 82
                  ? { tone: C.ochre, soft: C.ochreSoft, wash: C.ochreWash }
                  : { tone: C.water, soft: C.waterSoft, wash: C.waterWash };
            return (
              <div
                key={o.id}
                className="group flex h-full flex-col overflow-hidden rounded-xl transition-colors duration-200"
                style={{
                  background: C.panel,
                  border: `1px solid ${C.lineSoft}`,
                  backgroundImage: contours(C.contour, C.contourDeep),
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundImage = contours(p.wash, p.soft))
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundImage = contours(C.contour, C.contourDeep))
                }
              >
                <div
                  className="flex items-center justify-between px-5 py-2.5"
                  style={{ borderBottom: `1px solid ${C.lineSoft}`, background: `${p.soft}66` }}
                >
                  <Coord lat={g.lat} lon={g.lon} tone={p.tone} />
                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                    style={{ ...mono, color: C.faint }}
                  >
                    {o.id}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <Elevation value={o.match} size="sm" />
                    <button
                      onClick={() => toggleSave(o.id)}
                      aria-pressed={isSaved}
                      aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${RING}`}
                      style={{
                        color: isSaved ? p.tone : C.muted,
                        background: isSaved ? p.soft : "transparent",
                        border: `1px solid ${isSaved ? p.tone : C.line}`,
                      }}
                    >
                      {isSaved ? (
                        <BookmarkCheck size={16} strokeWidth={2.2} aria-hidden="true" />
                      ) : (
                        <Bookmark size={16} strokeWidth={2.2} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <h3
                    className="mt-4 text-[17px] font-semibold leading-tight"
                    style={{ ...head, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <div className="mt-2">
                    <Pin plaats={o.plaats} tone={p.tone} soft={p.soft} />
                  </div>
                  <div className="mt-1 text-[12.5px]" style={{ ...head, color: C.muted }}>
                    {o.opdrachtgever}
                  </div>

                  <div
                    className="mt-4 flex items-center justify-between rounded-lg px-3 py-2"
                    style={{ background: C.panelDeep, border: `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold"
                      style={{ ...mono, color: p.tone }}
                    >
                      <Route size={13} strokeWidth={2} aria-hidden="true" />
                      {g.afstand}
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 text-[11.5px]"
                      style={{ ...mono, color: C.muted }}
                    >
                      <Clock size={12} strokeWidth={2} aria-hidden="true" />
                      {g.reistijd}
                    </span>
                  </div>

                  <dl
                    className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]"
                    style={{ ...head, color: C.fgSoft }}
                  >
                    {[
                      { Icon: Wallet, v: o.tarief },
                      { Icon: Clock, v: o.uren },
                      { Icon: Calendar, v: o.start },
                      { Icon: Milestone, v: `Blad ${o.id.slice(-2)}` },
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

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md px-2 py-0.5 text-[10.5px]"
                        style={{
                          ...mono,
                          color: C.fgSoft,
                          background: C.paper2,
                          border: `1px solid ${C.lineSoft}`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-5">
                    <CompassButton onClick={() => onOpen(o)} tone={p.tone} className="w-full">
                      Bekijk perceel
                      <ArrowRight
                        size={14}
                        strokeWidth={2.2}
                        className="transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </CompassButton>
                  </div>
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
  const g = geoOf(opdracht.plaats);
  return (
    <div>
      <div className="mb-6">
        <LegendButton
          onClick={onBack}
          tone={C.ochre}
          soft={C.ochreSoft}
          ariaLabel="Terug naar marktplaats"
        >
          <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
          Terug naar kaart
        </LegendButton>
      </div>

      <Sheet
        className="overflow-hidden"
        style={{ backgroundImage: contours(C.ochreWash, C.ochreSoft) }}
      >
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-7 py-3"
          style={{ borderBottom: `1px solid ${C.lineSoft}`, background: `${C.ochreSoft}55` }}
        >
          <Coord lat={g.lat} lon={g.lon} tone={C.ochre} />
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ ...mono, color: C.faint }}
          >
            Perceel {opdracht.id}
          </span>
        </div>
        <div className="p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <Elevation value={opdracht.match} />
              <div>
                <h2
                  className="text-[26px] font-semibold leading-tight tracking-tight"
                  style={{ ...head, color: C.ink }}
                >
                  {opdracht.titel}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Pin plaats={opdracht.plaats} tone={C.ochre} soft={C.ochreSoft} />
                  <span className="text-[14px]" style={{ ...head, color: C.muted }}>
                    {opdracht.opdrachtgever}
                  </span>
                </div>
              </div>
            </div>
            <LegendButton
              onClick={() => toggleSave(opdracht.id)}
              tone={C.water}
              soft={C.waterSoft}
              active={isSaved}
              ariaPressed={isSaved}
              ariaLabel={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
            >
              {isSaved ? (
                <BookmarkCheck size={14} strokeWidth={2.2} aria-hidden="true" />
              ) : (
                <Bookmark size={14} strokeWidth={2.2} aria-hidden="true" />
              )}
              {isSaved ? "Gemarkeerd" : "Markeer"}
            </LegendButton>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { Icon: Wallet, label: "Tarief", value: opdracht.tarief },
              { Icon: Clock, label: "Inzet", value: opdracht.uren },
              { Icon: Calendar, label: "Start", value: opdracht.start },
              { Icon: Route, label: "Afstand", value: `${g.afstand} · ${g.reistijd}` },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-lg p-4"
                style={{ background: C.panel, border: `1px solid ${C.lineSoft}` }}
              >
                <m.Icon size={15} strokeWidth={2} style={{ color: C.ochre }} aria-hidden="true" />
                <div
                  className="mt-2 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.muted }}
                >
                  {m.label}
                </div>
                <div className="text-[13.5px] font-semibold" style={{ ...head, color: C.ink }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-md px-2.5 py-1 text-[11px]"
                style={{
                  ...mono,
                  color: C.fgSoft,
                  background: C.paper2,
                  border: `1px solid ${C.lineSoft}`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </Sheet>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Sheet className="p-6" style={{ backgroundImage: contours(C.greenWash, C.greenSoft) }}>
          <div className="mb-3.5 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: C.greenSoft, color: C.green, border: `1px solid ${C.green}44` }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={2.6} />
            </span>
            <span className="text-[14.5px] font-semibold" style={{ ...head, color: C.ink }}>
              Op hoogte — waarom dit past
            </span>
          </div>
          <ul className="space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...head, color: C.fgSoft }}
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
        </Sheet>
        <Sheet className="p-6" style={{ backgroundImage: contours(C.ochreWash, C.ochreSoft) }}>
          <div className="mb-3.5 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: C.ochreSoft, color: C.ochre, border: `1px solid ${C.ochre}44` }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={2.6} />
            </span>
            <span className="text-[14.5px] font-semibold" style={{ ...head, color: C.ink }}>
              Ruw terrein — even op letten
            </span>
          </div>
          <ul className="space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...head, color: C.fgSoft }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.ochre }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Sheet>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <CompassButton
          onClick={() => setApplied((v) => !v)}
          tone={applied ? C.green : C.water}
          ariaPressed={applied}
          className="px-6 py-3 text-[14px]"
        >
          {applied ? (
            <Check size={17} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <Navigation size={16} strokeWidth={2.2} aria-hidden="true" />
          )}
          {applied ? "Koers uitgezet" : "Zet koers — reageer"}
        </CompassButton>
        {applied && (
          <span className="text-[12.5px]" style={{ ...head, color: C.muted }}>
            De opdrachtgever peilt gemiddeld binnen 6 uur terug.
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
        title="Peilmerken — ingemeten en gecontroleerd"
        sub="Elke status heeft een eigen kleur, label én icoon — nooit alleen kleur."
      />

      {/* Legenda: de vier peilmerk-statussen als kaartsymbolen */}
      <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, tone, soft } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 rounded-lg px-4 py-3.5"
              style={{ background: soft, border: `1px solid ${tone}33` }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: tone, color: C.panel }}
                aria-hidden="true"
              >
                <Icon size={15} strokeWidth={2.2} />
              </span>
              <span className="text-[12px] font-semibold" style={{ ...head, color: C.ink }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Sheet
        className="mb-7 flex items-center gap-4 p-6"
        style={{ backgroundImage: contours(C.greenWash, C.greenSoft) }}
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
          style={{ background: C.greenSoft, color: C.green, border: `1px solid ${C.green}44` }}
          aria-hidden="true"
        >
          <ShieldCheck size={24} strokeWidth={2} />
        </span>
        <div>
          <div className="text-[15px] font-semibold" style={{ ...head, color: C.ink }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[13px]" style={{ ...head, color: C.fgSoft }}>
            Je bewijsstukken worden versleuteld bewaard en alleen met jouw toestemming ingezien.
          </p>
        </div>
      </Sheet>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {CREDENTIALS.map((c, i) => {
            const done = checked.has(c.naam);
            const { tone, soft } = statusMeta(c.status);
            return (
              <Sheet key={c.naam} className="flex items-center gap-3.5 p-4">
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${RING}`}
                  style={{
                    border: `1.5px solid ${done ? C.green : C.line}`,
                    background: done ? C.green : "transparent",
                    color: C.panel,
                  }}
                >
                  {done && <Check size={14} strokeWidth={2.6} aria-hidden="true" />}
                </button>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: soft, color: tone, border: `1px solid ${tone}33` }}
                  aria-hidden="true"
                >
                  <FileText size={16} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[9.5px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.faint }}
                    >
                      PM-{String(i + 1).padStart(2, "0")}
                    </span>
                    <div
                      className="truncate text-[14px] font-semibold"
                      style={{ ...head, color: C.ink }}
                    >
                      {c.naam}
                    </div>
                  </div>
                  <div className="text-[12px]" style={{ ...head, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <StatusPill status={c.status} />
              </Sheet>
            );
          })}
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-2 text-[15px] font-semibold"
              style={{ ...head, color: C.ink }}
            >
              <FileText size={16} strokeWidth={2} style={{ color: C.water }} aria-hidden="true" />
              Documentkluis
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${RING}`}
              style={{ background: C.panel, color: C.water, border: `1px solid ${C.line}` }}
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
                className={`rounded-md px-3.5 py-1 text-[11px] font-semibold transition-colors ${RING}`}
                style={{
                  ...head,
                  color: feedState === s ? C.panel : C.muted,
                  background: feedState === s ? C.water : "transparent",
                  border: `1px solid ${feedState === s ? C.water : C.line}`,
                }}
              >
                {s === "ok" ? "Geladen" : s === "loading" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {feedState === "loading" && (
            <ul className="space-y-2.5" aria-busy="true" aria-label="Documenten laden">
              {[0, 1, 2, 3].map((i) => (
                <Sheet key={i} className="p-4">
                  <div
                    className="h-3 w-2/3 animate-pulse rounded"
                    style={{ background: C.paper2 }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded"
                    style={{ background: C.paper2 }}
                  />
                </Sheet>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Sheet
              className="flex flex-col items-center gap-2 px-4 py-9 text-center"
              style={{ backgroundImage: contours(C.rustWash, C.rustSoft) }}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-lg"
                style={{ background: C.rustSoft, color: C.rust, border: `1px solid ${C.rust}44` }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-semibold" style={{ ...head, color: C.ink }}>
                Verbinding verbroken
              </div>
              <p className="text-[12px]" style={{ ...head, color: C.muted }}>
                We konden de documentkluis niet peilen. Probeer het zo opnieuw.
              </p>
              <div className="mt-1">
                <LegendButton onClick={() => setFeedState("ok")} tone={C.rust} soft={C.rustSoft}>
                  Opnieuw peilen
                </LegendButton>
              </div>
            </Sheet>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2.5">
              {DOCUMENTEN.map((d) => {
                const { tone, soft } = statusMeta(d.status);
                return (
                  <Sheet key={d.naam} className="flex items-center gap-3 p-3.5">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold"
                      style={{
                        ...mono,
                        background: soft,
                        color: tone,
                        border: `1px solid ${tone}33`,
                      }}
                      aria-hidden="true"
                    >
                      {d.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[12.5px] font-semibold"
                        style={{ ...head, color: C.ink }}
                      >
                        {d.naam}
                      </div>
                      <div className="text-[11px] tabular-nums" style={{ ...mono, color: C.muted }}>
                        {d.grootte} · {d.bijgewerkt}
                      </div>
                    </div>
                    <StatusPill status={d.status} />
                  </Sheet>
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
      <ScreenHead
        screenKey="acties"
        title="Route — de volgende bakens"
        sub="Werk de route af; elk baken dat je passeert wordt afgestreept op de kaart."
      />

      {openCount === 0 ? (
        <Sheet
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          style={{ backgroundImage: contours(C.greenWash, C.greenSoft) }}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-xl"
            style={{ background: C.greenSoft, color: C.green, border: `1px solid ${C.green}44` }}
            aria-hidden="true"
          >
            <Check size={30} strokeWidth={2.2} />
          </span>
          <h3 className="text-[22px] font-semibold" style={{ ...head, color: C.ink }}>
            Bestemming bereikt
          </h3>
          <p className="max-w-xs text-[13.5px]" style={{ ...head, color: C.muted }}>
            Alle bakens gepasseerd. De route voor vandaag is voltooid.
          </p>
        </Sheet>
      ) : (
        <>
          <div
            className="mb-5 inline-flex items-center gap-2.5 rounded-lg px-4 py-2"
            style={{ background: C.ochreSoft, border: `1px solid ${C.ochre}44` }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md text-[12px] font-bold tabular-nums"
              style={{ ...mono, background: C.ochre, color: C.panel }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ ...head, color: C.ochre }}>
              {openCount} {openCount === 1 ? "baken" : "bakens"} te gaan
            </span>
          </div>

          <ol className="relative space-y-3.5">
            {ACTIES.map((a, i) => {
              const isDone = done.has(a.titel);
              const tone = isDone ? C.green : a.urgentie === "warning" ? C.rust : C.ochre;
              const soft = isDone
                ? C.greenSoft
                : a.urgentie === "warning"
                  ? C.rustSoft
                  : C.ochreSoft;
              return (
                <Sheet key={a.titel} className="overflow-hidden p-0">
                  <span className="block h-1" style={{ background: tone }} aria-hidden="true" />
                  <div className="flex items-start gap-4 p-5">
                    <button
                      onClick={() => toggleDone(a.titel)}
                      aria-pressed={isDone}
                      aria-label={
                        isDone ? `${a.titel} gepasseerd` : `Markeer ${a.titel} als gepasseerd`
                      }
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${RING}`}
                      style={{
                        border: `1.5px solid ${isDone ? C.green : C.line}`,
                        background: isDone ? C.green : "transparent",
                        color: C.panel,
                      }}
                    >
                      {isDone ? (
                        <Check size={16} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <span
                          className="text-[12px] font-bold tabular-nums"
                          style={{ ...mono, color: C.muted }}
                        >
                          {i + 1}
                        </span>
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[15px] font-semibold leading-snug"
                        style={{
                          ...head,
                          color: C.ink,
                          textDecoration: isDone ? "line-through" : "none",
                          opacity: isDone ? 0.55 : 1,
                        }}
                      >
                        {a.titel}
                      </div>
                      <p
                        className="mt-1 text-[12.5px]"
                        style={{ ...head, color: C.muted, opacity: isDone ? 0.55 : 1 }}
                      >
                        {a.detail}
                      </p>
                      {!isDone && (
                        <span
                          className="mt-2.5 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[12px] font-semibold"
                          style={{ ...head, color: tone, background: soft }}
                        >
                          {a.cta}
                          <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  </div>
                </Sheet>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}

function Facturen() {
  const trend = [24.8, 13.5, 30.72, 8.8];
  const statusMap = (status: string): { tone: string; soft: string } =>
    status === "Betaald"
      ? { tone: C.green, soft: C.greenSoft }
      : status === "Openstaand"
        ? { tone: C.ochre, soft: C.ochreSoft }
        : { tone: C.muted, soft: C.paper2 };

  const parseBedrag = (s: string): number =>
    Number(
      s
        .replace(/[^0-9.,]/g, "")
        .replace(/\./g, "")
        .replace(",", "."),
    ) || 0;
  const totaal = FACTUREN.reduce((sum, f) => sum + parseBedrag(f.bedrag), 0);
  const totaalLabel = `€ ${totaal.toLocaleString("nl-NL")}`;

  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Kadaster — je facturen"
        sub="Overzichtelijk ingemeten, met tabulaire bedragen en een sluitende totaalregel."
      />

      <div className="mb-7 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 lg:col-span-2">
          {[
            { label: "Betaald (mnd)", value: "€ 5.552", tone: C.green },
            { label: "Openstaand", value: "€ 1.350", tone: C.ochre },
            { label: "Concept", value: "€ 880", tone: C.muted },
          ].map((s) => (
            <Sheet key={s.label} className="p-5">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.muted }}
              >
                {s.label}
              </div>
              <div
                className="mt-2 text-[24px] font-semibold tabular-nums"
                style={{ ...head, color: s.tone }}
              >
                {s.value}
              </div>
            </Sheet>
          ))}
        </div>
        <Sheet className="flex flex-col justify-between p-5">
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.muted }}
          >
            Bedrag per factuur
          </div>
          <Profile data={trend} tone={C.water} height={48} />
        </Sheet>
      </div>

      <Sheet className="overflow-hidden p-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Perceel", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
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
                      className="px-3 py-3.5 text-[12.5px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3.5 text-[13px]" style={{ ...head, color: C.ink }}>
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
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md py-0.5 pl-1 pr-2.5 text-[11px] font-semibold"
                        style={{
                          ...head,
                          color: sm.tone,
                          background: sm.soft,
                          border: `1px solid ${sm.tone}33`,
                        }}
                      >
                        <span
                          className="flex h-4 w-4 items-center justify-center rounded-[4px]"
                          style={{ background: sm.tone }}
                          aria-hidden="true"
                        >
                          {f.status === "Betaald" ? (
                            <Check size={10} strokeWidth={2.6} color={C.panel} />
                          ) : f.status === "Openstaand" ? (
                            <Clock size={10} strokeWidth={2.4} color={C.panel} />
                          ) : (
                            <FileText size={10} strokeWidth={2.4} color={C.panel} />
                          )}
                        </span>
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `2px solid ${C.line}` }}>
                <td
                  className="px-3 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.muted }}
                  colSpan={3}
                >
                  Totaal ingemeten
                </td>
                <td
                  className="px-3 py-3.5 text-[14px] font-bold tabular-nums"
                  style={{ ...head, color: C.ink }}
                >
                  {totaalLabel}
                </td>
                <td className="px-3 py-3.5" />
              </tr>
            </tfoot>
          </table>
        </div>
      </Sheet>
    </div>
  );
}

// ---- Shell ------------------------------------------------------------------

export function Concept281() {
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
        ...head,
        color: C.fg,
        background: C.paper,
        backgroundImage: `${graticule(C.grid, 40)}, ${contours(C.contour, C.contourDeep)}`,
      }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-lg"
              style={{ background: C.ink, color: C.paper }}
              aria-hidden="true"
            >
              <Compass size={20} strokeWidth={2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[19px] font-semibold tracking-tight"
                style={{ ...head, color: C.ink }}
              >
                Atlas
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{ ...mono, color: C.muted }}
              >
                ZZP platform · survey
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...head, color: C.ink }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...mono, color: C.green }}
              >
                <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[13px] font-bold"
              style={{
                ...head,
                background: C.greenSoft,
                color: C.green,
                border: `1px solid ${C.green}44`,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav
          className="mb-9 flex flex-wrap gap-1.5 overflow-x-auto rounded-xl p-1.5"
          aria-label="Kaartlegenda"
          style={{ background: C.panelDeep, border: `1px solid ${C.lineSoft}` }}
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICONS[s.key];
            const sheet = SHEET[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold transition-colors duration-200 ${RING}`}
                style={{
                  ...head,
                  color: on ? C.panel : C.fgSoft,
                  background: on ? sheet.tone : "transparent",
                  border: `1px solid ${on ? sheet.tone : "transparent"}`,
                }}
              >
                <Icon size={14} strokeWidth={2} aria-hidden="true" />
                {s.label}
                <span
                  className="text-[9px] font-semibold tabular-nums tracking-[0.08em]"
                  style={{ ...mono, color: on ? `${C.panel}cc` : C.faint }}
                >
                  {sheet.ref}
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
          className="mt-10 flex flex-wrap items-center justify-between gap-2 pt-5 text-[11px]"
          style={{ ...mono, borderTop: `1px solid ${C.line}`, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Compass size={12} strokeWidth={2} style={{ color: C.green }} aria-hidden="true" />
            {SCREENS.length} kaartbladen · atlas v281
          </span>
          <span>Schaal 1:1 · alle coördinaten ingemeten</span>
        </footer>
      </div>
    </div>
  );
}
