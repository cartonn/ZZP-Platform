"use client";

// Concept 289 — "Glas-in-lood" · Gebrandschilderd raam / mozaïek (dark-geleid, juweeltinten).
// Signature: gekleurde glasvlakken gescheiden door donkere "loodlijnen" (loodcames als dikke,
// donkere randen tussen de kleurvlakken). Juweeltinten — robijn, saffier, smaragd, amber, amethist —
// op een donker loodwerk-raster met een subtiele lichtinval van linksboven, alsof daglicht door het
// glas valt. Panelen ogen als glaspanelen in een venster; statusbadges spreken glaskleur. Elegant-
// decoratief maar streng georganiseerd; tekstcontrast blijft strikt bewaakt (lichte tekst op donker
// glas, verzadigde randen alleen voor iconen/accenten).
// Fonts: --font-lab-cormorant (display) + --font-lab-geist (body/sans).

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
  Gem,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// Stained-glass palette. Dark lead grid, jewel-toned glass fields, light off-white "daylight".
const C = {
  lead: "#12141b",
  lead2: "#171a22",
  panel: "#1b1f29",
  panelLit: "#232838",
  came: "#08090d",
  cameSoft: "#2c3140",
  fg: "#eceae2",
  fgSoft: "#c3c1b8",
  muted: "#93918a",
  faint: "#6d6b65",
  // Jewel glass fields (dark, saturated) + lighter tints for text/icons on them.
  rubyGlass: "#361420",
  ruby: "#e78499",
  rubyEdge: "#c4213f",
  sapphireGlass: "#132239",
  sapphire: "#8fb6f2",
  sapphireEdge: "#3170d6",
  emeraldGlass: "#0f2b21",
  emerald: "#6fd6a8",
  emeraldEdge: "#1f9d6b",
  amberGlass: "#33260f",
  amber: "#f0c877",
  amberEdge: "#dda033",
  amethystGlass: "#241733",
  amethyst: "#c79bf0",
  amethystEdge: "#9a5cd0",
};

const display = { fontFamily: "var(--font-lab-cormorant), Georgia, serif" };
const sans = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0c877] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12141b]";

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

// Each screen is keyed to one jewel colour of the window.
type Jewel = { glass: string; tint: string; edge: string; naam: string };
const JEWELS: Record<string, Jewel> = {
  ruby: { glass: C.rubyGlass, tint: C.ruby, edge: C.rubyEdge, naam: "Robijn" },
  sapphire: { glass: C.sapphireGlass, tint: C.sapphire, edge: C.sapphireEdge, naam: "Saffier" },
  emerald: { glass: C.emeraldGlass, tint: C.emerald, edge: C.emeraldEdge, naam: "Smaragd" },
  amber: { glass: C.amberGlass, tint: C.amber, edge: C.amberEdge, naam: "Amber" },
  amethyst: { glass: C.amethystGlass, tint: C.amethyst, edge: C.amethystEdge, naam: "Amethist" },
};

const SCREEN_JEWEL: Record<ScreenKey, Jewel> = {
  dashboard: JEWELS.amethyst as Jewel,
  marktplaats: JEWELS.sapphire as Jewel,
  opdracht: JEWELS.amber as Jewel,
  verificatie: JEWELS.emerald as Jewel,
  acties: JEWELS.ruby as Jewel,
  facturen: JEWELS.sapphire as Jewel,
  documenten: JEWELS.amethyst as Jewel,
  berichten: JEWELS.ruby as Jewel,
};

// Light falling through a glass field — a soft diagonal highlight over the jewel tone.
function glassFill(glass: string, lit = C.panelLit): string {
  return `radial-gradient(130% 100% at 22% 8%, ${lit} 0%, ${glass} 58%)`;
}

// A lead came — a thick dark separating line between fields.
const CAME = `2px solid ${C.came}`;

// ---- Primitives -------------------------------------------------------------

function panelStyle(): CSSProperties {
  return {
    background: C.panel,
    border: CAME,
    borderRadius: 6,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
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

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  jewel: Jewel;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, jewel: JEWELS.emerald as Jewel };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Hourglass, jewel: JEWELS.sapphire as Jewel };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: TriangleAlert, jewel: JEWELS.amber as Jewel };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, jewel: JEWELS.ruby as Jewel };
  }
}

function StatusPill({ status }: { status: CredStatus }) {
  const { label, Icon, jewel } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[4px] py-1 pl-1.5 pr-2.5 text-[11px] font-semibold"
      style={{ ...sans, color: jewel.tint, background: jewel.glass, border: CAME }}
    >
      <span
        className="flex h-4 w-4 items-center justify-center rounded-[3px]"
        style={{ background: jewel.edge }}
        aria-hidden="true"
      >
        <Icon size={10} strokeWidth={2.4} color={C.lead} />
      </span>
      {label}
    </span>
  );
}

function jewelForMatch(value: number): Jewel {
  return value >= 90
    ? (JEWELS.emerald as Jewel)
    : value >= 82
      ? (JEWELS.amber as Jewel)
      : (JEWELS.ruby as Jewel);
}

function MatchTag({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const jewel = jewelForMatch(value);
  return (
    <span
      className="inline-flex items-center gap-2 rounded-[5px] px-2.5 py-1"
      style={{ background: jewel.glass, border: CAME }}
      aria-label={`Match ${value} procent`}
    >
      <span
        className={`font-medium tabular-nums leading-none ${size === "sm" ? "text-[16px]" : "text-[20px]"}`}
        style={{ ...display, color: jewel.tint }}
      >
        {value}
      </span>
      <span
        className="text-[9px] font-semibold uppercase tracking-[0.16em]"
        style={{ ...sans, color: jewel.tint }}
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
    const y = 100 - ((v - min) / span) * 64 - 18;
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
      <polygon points={`0,100 ${line} 100,100`} fill={tone} opacity={0.16} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// A small mosaic band — jewel-glass tiles separated by lead cames. Purely decorative.
function MosaicBand({ tiles }: { tiles: string[] }) {
  return (
    <div className="flex overflow-hidden rounded-[5px]" style={{ border: CAME }} aria-hidden="true">
      {tiles.map((t, i) => (
        <span
          key={i}
          className="h-2.5 flex-1"
          style={{
            background: t,
            borderRight: i < tiles.length - 1 ? CAME : "none",
          }}
        />
      ))}
    </div>
  );
}

// Filled "leaded glass" button — a jewel tile in a lead frame; hover lifts the daylight.
function GlassButton({
  children,
  onClick,
  jewel = JEWELS.amethyst as Jewel,
  className,
  ariaLabel,
  ariaPressed,
}: {
  children: ReactNode;
  onClick?: () => void;
  jewel?: Jewel;
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
      className={`inline-flex items-center justify-center gap-2 rounded-[5px] px-5 py-2.5 text-[13px] font-semibold transition-colors duration-300 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: hot ? C.lead : jewel.tint,
        background: hot ? jewel.edge : jewel.glass,
        border: CAME,
      }}
    >
      {children}
    </button>
  );
}

// Outline "came" button — a lead frame that fills with jewel glass on hover/active.
function CameButton({
  children,
  onClick,
  jewel = JEWELS.sapphire as Jewel,
  className,
  ariaLabel,
  ariaPressed,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  jewel?: Jewel;
  className?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  active?: boolean;
}) {
  const [hot, setHot] = useState(false);
  const lit = active || hot;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-[5px] px-4 py-2 text-[12.5px] font-semibold transition-colors duration-300 ${RING} ${className ?? ""}`}
      style={{
        ...sans,
        color: lit ? jewel.tint : C.fgSoft,
        background: lit ? jewel.glass : "transparent",
        border: CAME,
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
  const j = SCREEN_JEWEL[screenKey];
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className="h-3.5 w-3.5 rounded-[3px]"
          style={{ background: j.edge, border: CAME }}
          aria-hidden="true"
        />
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.24em]"
          style={{ ...sans, color: j.tint }}
        >
          {j.naam}
        </span>
      </div>
      <h1
        className="text-[32px] font-medium leading-tight tracking-tight sm:text-[40px]"
        style={{ ...display, color: C.fg }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="mt-3 max-w-xl text-[14.5px] leading-relaxed"
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
  const kpiJewels = [JEWELS.amethyst, JEWELS.sapphire, JEWELS.emerald, JEWELS.amber] as Jewel[];
  return (
    <div>
      <div
        className="mb-10 overflow-hidden rounded-[8px] px-7 py-9 sm:px-9 sm:py-11"
        style={{
          border: CAME,
          background: C.panel,
          backgroundImage: glassFill(C.amethystGlass),
        }}
      >
        <div className="mb-6">
          <MosaicBand
            tiles={[C.rubyEdge, C.amberEdge, C.emeraldEdge, C.sapphireEdge, C.amethystEdge]}
          />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div
              className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em]"
              style={{ ...sans, color: C.amethyst }}
            >
              {PROFIEL.plaats} · {PROFIEL.rol}
            </div>
            <h1
              className="text-[36px] font-medium leading-none tracking-tight sm:text-[46px]"
              style={{ ...display, color: C.fg }}
            >
              Goedemorgen, {voornaam}
            </h1>
            <p
              className="mt-4 max-w-md text-[14.5px] leading-relaxed"
              style={{ ...sans, color: C.fgSoft }}
            >
              Je werk in gebrandschilderde vlakken — elk gekozen wat telt, gevat in lood.
            </p>
          </div>
          <div
            className="flex items-center gap-2.5 rounded-[5px] px-4 py-2.5"
            style={{ background: C.emeraldGlass, border: CAME }}
          >
            <ShieldCheck
              size={16}
              strokeWidth={2}
              style={{ color: C.emerald }}
              aria-hidden="true"
            />
            <span className="text-[12.5px] font-semibold" style={{ ...sans, color: C.emerald }}>
              {PROFIEL.trust}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          const jewel = kpiJewels[i % kpiJewels.length] ?? (JEWELS.amethyst as Jewel);
          return (
            <Panel
              key={k.label}
              className="p-5"
              style={{ backgroundImage: glassFill(jewel.glass) }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...sans, color: C.muted }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ ...sans, color: k.up ? C.emerald : C.amber }}
                >
                  <Trend size={11} strokeWidth={2.2} aria-hidden="true" />
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-2 text-[28px] font-medium tabular-nums leading-none"
                style={{ ...display, color: C.fg }}
              >
                {k.value}
              </div>
              <div className="mt-3">
                <Sparkline data={k.spark} tone={jewel.tint} />
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Gem size={16} strokeWidth={2} style={{ color: C.emerald }} aria-hidden="true" />
            <h2
              className="text-[18px] font-medium tracking-tight"
              style={{ ...display, color: C.fg }}
            >
              Beste match
            </h2>
          </div>
          <button
            onClick={() => onOpen(top)}
            className={`group block w-full overflow-hidden rounded-[7px] p-0 text-left transition-colors duration-300 ${RING}`}
            style={{ ...panelStyle(), backgroundImage: glassFill(C.emeraldGlass) }}
          >
            <span className="flex items-start gap-5 p-6">
              <MatchTag value={top.match} />
              <span className="min-w-0 flex-1">
                <span
                  className="block text-[20px] font-medium leading-tight"
                  style={{ ...display, color: C.fg }}
                >
                  {top.titel}
                </span>
                <span className="mt-1 block text-[13px]" style={{ ...sans, color: C.muted }}>
                  {top.opdrachtgever} · {top.plaats} · {top.tarief}
                </span>
                <span className="mt-3.5 flex flex-wrap gap-1.5">
                  {top.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-[4px] px-2.5 py-0.5 text-[11px]"
                      style={{ ...sans, color: C.fgSoft, background: C.lead2, border: CAME }}
                    >
                      {t}
                    </span>
                  ))}
                </span>
              </span>
              <ArrowRight
                size={20}
                className="mt-1 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                style={{ color: C.emerald }}
                aria-hidden="true"
              />
            </span>
          </button>

          <Panel
            className="mt-5 flex items-start gap-4 p-6"
            style={{ backgroundImage: glassFill(C.sapphireGlass) }}
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[5px]"
              style={{ background: C.sapphireGlass, color: C.sapphire, border: CAME }}
              aria-hidden="true"
            >
              <ShieldCheck size={21} strokeWidth={2} />
            </span>
            <div>
              <span className="inline-flex items-center gap-2">
                <span className="text-[14.5px] font-semibold" style={{ ...sans, color: C.fg }}>
                  {PROFIEL.trust}
                </span>
                <BadgeCheck
                  size={15}
                  strokeWidth={2}
                  style={{ color: C.emerald }}
                  aria-hidden="true"
                />
              </span>
              <span
                className="mt-1 block text-[13px] leading-relaxed"
                style={{ ...sans, color: C.fgSoft }}
              >
                Je documenten zijn geverifieerd — opdrachtgevers zien meteen dat je te vertrouwen
                bent.
              </span>
            </div>
          </Panel>
        </div>

        <div>
          <div className="mb-4 flex items-center gap-2">
            <ListTodo size={16} strokeWidth={2} style={{ color: C.amber }} aria-hidden="true" />
            <h2
              className="text-[18px] font-medium tracking-tight"
              style={{ ...display, color: C.fg }}
            >
              Vraagt aandacht
            </h2>
          </div>
          <ul className="space-y-3.5">
            {ACTIES.map((a) => {
              const jewel =
                a.urgentie === "warning" ? (JEWELS.amber as Jewel) : (JEWELS.sapphire as Jewel);
              return (
                <Panel key={a.titel} className="overflow-hidden p-0">
                  <span
                    className="block h-1.5"
                    style={{ background: jewel.edge }}
                    aria-hidden="true"
                  />
                  <div className="p-4">
                    <div
                      className="text-[13px] font-semibold leading-snug"
                      style={{ ...sans, color: C.fg }}
                    >
                      {a.titel}
                    </div>
                    <div
                      className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold"
                      style={{ ...sans, color: jewel.tint }}
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
        title="Opdrachten in glas gevat"
        sub="We tonen eerlijk waarom een opdracht past — en waar het schuurt."
      />

      <div
        className="mb-7 flex items-center gap-2.5 rounded-[6px] px-5 py-3"
        style={{ background: C.panel, border: CAME }}
      >
        <Search size={16} className="shrink-0" style={{ color: C.sapphire }} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op titel, plaats of vaardigheid…"
          aria-label="Zoek opdrachten"
          className="w-full bg-transparent text-[14px] outline-none placeholder:opacity-55"
          style={{ ...sans, color: C.fg }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className={`rounded-[4px] px-3 py-1 text-[11px] font-semibold ${RING}`}
            style={{ ...sans, color: C.sapphire, background: C.sapphireGlass, border: CAME }}
          >
            Wis
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Panel
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          style={{ backgroundImage: glassFill(C.sapphireGlass) }}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-[6px]"
            style={{ background: C.sapphireGlass, color: C.sapphire, border: CAME }}
            aria-hidden="true"
          >
            <Search size={28} strokeWidth={1.8} />
          </span>
          <h3 className="text-[24px] font-medium" style={{ ...display, color: C.fg }}>
            Een leeg venster
          </h3>
          <p className="max-w-xs text-[13.5px]" style={{ ...sans, color: C.muted }}>
            Geen match voor &ldquo;{query}&rdquo;. Probeer een andere zoekterm.
          </p>
          <div className="mt-1">
            <CameButton onClick={() => setQuery("")} jewel={JEWELS.sapphire as Jewel}>
              Filter wissen
            </CameButton>
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const isSaved = saved.has(o.id);
            const jewel = jewelForMatch(o.match);
            return (
              <div
                key={o.id}
                className="group flex h-full flex-col overflow-hidden rounded-[7px] p-6 transition-colors duration-300"
                style={{
                  background: C.panel,
                  border: CAME,
                  backgroundImage: glassFill(C.panel),
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundImage = glassFill(jewel.glass))
                }
                onMouseLeave={(e) => (e.currentTarget.style.backgroundImage = glassFill(C.panel))}
              >
                <div className="flex items-start justify-between gap-3">
                  <MatchTag value={o.match} size="sm" />
                  <button
                    onClick={() => toggleSave(o.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Verwijder uit bewaard" : "Bewaar opdracht"}
                    className={`flex h-9 w-9 items-center justify-center rounded-[5px] transition-colors ${RING}`}
                    style={{
                      color: isSaved ? jewel.tint : C.muted,
                      background: isSaved ? jewel.glass : "transparent",
                      border: CAME,
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
                  className="mt-4 text-[9.5px] font-semibold uppercase tracking-[0.18em]"
                  style={{ ...sans, color: C.faint }}
                >
                  {o.id}
                </span>
                <h3
                  className="mt-1 text-[19px] font-medium leading-tight"
                  style={{ ...display, color: C.fg }}
                >
                  {o.titel}
                </h3>
                <div className="mt-0.5 text-[13px]" style={{ ...sans, color: C.muted }}>
                  {o.opdrachtgever}
                </div>
                <dl
                  className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 text-[12px]"
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
                        style={{ color: C.faint }}
                        aria-hidden="true"
                      />
                      {m.v}
                    </div>
                  ))}
                </dl>
                <div className="mt-5">
                  <GlassButton onClick={() => onOpen(o)} jewel={jewel} className="w-full">
                    Bekijk opdracht
                    <ArrowRight
                      size={14}
                      strokeWidth={2.2}
                      className="transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </GlassButton>
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
        <CameButton
          onClick={onBack}
          jewel={JEWELS.amber as Jewel}
          ariaLabel="Terug naar marktplaats"
        >
          <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" />
          Terug
        </CameButton>
      </div>

      <Panel className="overflow-hidden p-7" style={{ backgroundImage: glassFill(C.amberGlass) }}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <MatchTag value={opdracht.match} />
            <div>
              <span
                className="text-[9.5px] font-semibold uppercase tracking-[0.2em]"
                style={{ ...sans, color: C.faint }}
              >
                {opdracht.id}
              </span>
              <h2
                className="mt-1 text-[28px] font-medium leading-tight tracking-tight"
                style={{ ...display, color: C.fg }}
              >
                {opdracht.titel}
              </h2>
              <div className="mt-1 text-[14px]" style={{ ...sans, color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </div>
            </div>
          </div>
          <CameButton
            onClick={() => toggleSave(opdracht.id)}
            jewel={JEWELS.ruby as Jewel}
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
          </CameButton>
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
              className="rounded-[6px] p-4"
              style={{ background: C.panel, border: CAME }}
            >
              <m.Icon size={15} strokeWidth={2} style={{ color: C.amber }} aria-hidden="true" />
              <div
                className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...sans, color: C.muted }}
              >
                {m.label}
              </div>
              <div className="text-[14px] font-semibold" style={{ ...sans, color: C.fg }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="p-6" style={{ backgroundImage: glassFill(C.emeraldGlass) }}>
          <div className="mb-3.5 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-[5px]"
              style={{ background: C.emeraldGlass, color: C.emerald, border: CAME }}
              aria-hidden="true"
            >
              <Plus size={14} strokeWidth={2.6} />
            </span>
            <span className="text-[14.5px] font-semibold" style={{ ...sans, color: C.fg }}>
              Waarom deze past
            </span>
          </div>
          <ul className="space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...sans, color: C.fgSoft }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.emerald }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-6" style={{ backgroundImage: glassFill(C.rubyGlass) }}>
          <div className="mb-3.5 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-[5px]"
              style={{ background: C.rubyGlass, color: C.ruby, border: CAME }}
              aria-hidden="true"
            >
              <Minus size={14} strokeWidth={2.6} />
            </span>
            <span className="text-[14.5px] font-semibold" style={{ ...sans, color: C.fg }}>
              Even op letten
            </span>
          </div>
          <ul className="space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ ...sans, color: C.fgSoft }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.ruby }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <GlassButton
          onClick={() => setApplied((v) => !v)}
          jewel={applied ? (JEWELS.emerald as Jewel) : (JEWELS.amethyst as Jewel)}
          ariaPressed={applied}
          className="px-6 py-3 text-[14px]"
        >
          {applied ? (
            <Check size={17} strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
          )}
          {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
        </GlassButton>
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
        title="Documenten, in glas gecontroleerd"
        sub="Elke status heeft een eigen glaskleur, label én icoon — nooit alleen kleur."
      />

      <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((s) => {
          const { label, Icon, jewel } = statusMeta(s);
          return (
            <div
              key={s}
              className="flex items-center gap-2.5 rounded-[6px] px-4 py-3.5"
              style={{ background: jewel.glass, border: CAME }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px]"
                style={{ background: jewel.edge, color: C.lead }}
                aria-hidden="true"
              >
                <Icon size={15} strokeWidth={2.2} />
              </span>
              <span className="text-[12px] font-semibold" style={{ ...sans, color: jewel.tint }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <Panel
        className="mb-7 flex items-center gap-4 p-6"
        style={{ backgroundImage: glassFill(C.emeraldGlass) }}
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[6px]"
          style={{ background: C.emeraldGlass, color: C.emerald, border: CAME }}
          aria-hidden="true"
        >
          <ShieldCheck size={24} strokeWidth={2} />
        </span>
        <div>
          <div className="text-[15px] font-semibold" style={{ ...sans, color: C.fg }}>
            {PROFIEL.trust}
          </div>
          <p className="mt-0.5 text-[13px]" style={{ ...sans, color: C.fgSoft }}>
            Je documenten worden versleuteld bewaard en alleen gedeeld met jouw toestemming.
          </p>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {CREDENTIALS.map((c) => {
            const done = checked.has(c.naam);
            const { jewel } = statusMeta(c.status);
            return (
              <Panel key={c.naam} className="flex items-center gap-3.5 p-4">
                <button
                  onClick={() => toggleCheck(c.naam)}
                  aria-pressed={done}
                  aria-label={done ? `${c.naam} afgevinkt` : `Vink ${c.naam} af`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] transition-colors ${RING}`}
                  style={{
                    border: CAME,
                    background: done ? C.emeraldEdge : "transparent",
                    color: C.lead,
                  }}
                >
                  {done && <Check size={14} strokeWidth={2.6} aria-hidden="true" />}
                </button>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px]"
                  style={{ background: jewel.glass, color: jewel.tint, border: CAME }}
                  aria-hidden="true"
                >
                  <FileText size={16} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold" style={{ ...sans, color: C.fg }}>
                    {c.naam}
                  </div>
                  <div className="text-[12px]" style={{ ...sans, color: C.muted }}>
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
              className="inline-flex items-center gap-2 text-[15px] font-semibold"
              style={{ ...sans, color: C.fg }}
            >
              <FileText
                size={16}
                strokeWidth={2}
                style={{ color: C.amethyst }}
                aria-hidden="true"
              />
              Documenten
            </span>
            <button
              onClick={() => setFeedState(feedState === "loading" ? "ok" : "loading")}
              className={`flex h-8 w-8 items-center justify-center rounded-[5px] ${RING}`}
              style={{ background: C.panel, color: C.amethyst, border: CAME }}
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
                className={`rounded-[4px] px-3.5 py-1 text-[11px] font-semibold transition-colors ${RING}`}
                style={{
                  ...sans,
                  color: feedState === s ? C.amethyst : C.muted,
                  background: feedState === s ? C.amethystGlass : "transparent",
                  border: CAME,
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
                    className="h-3 w-2/3 animate-pulse rounded-[3px]"
                    style={{ background: C.lead2 }}
                  />
                  <div
                    className="mt-2.5 h-2.5 w-1/3 animate-pulse rounded-[3px]"
                    style={{ background: C.lead2 }}
                  />
                </Panel>
              ))}
            </ul>
          )}

          {feedState === "error" && (
            <Panel
              className="flex flex-col items-center gap-2 px-4 py-9 text-center"
              style={{ backgroundImage: glassFill(C.rubyGlass) }}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-[6px]"
                style={{ background: C.rubyGlass, color: C.ruby, border: CAME }}
                aria-hidden="true"
              >
                <CircleAlert size={24} strokeWidth={2} />
              </span>
              <div className="text-[15px] font-semibold" style={{ ...sans, color: C.fg }}>
                Even niet gelukt
              </div>
              <p className="text-[12px]" style={{ ...sans, color: C.muted }}>
                We konden je documentenkluis niet bereiken. Probeer het zo nog eens.
              </p>
              <div className="mt-1">
                <CameButton onClick={() => setFeedState("ok")} jewel={JEWELS.ruby as Jewel}>
                  Opnieuw proberen
                </CameButton>
              </div>
            </Panel>
          )}

          {feedState === "ok" && (
            <ul className="space-y-2.5">
              {DOCUMENTEN.map((d) => {
                const { jewel } = statusMeta(d.status);
                return (
                  <Panel key={d.naam} className="flex items-center gap-3 p-3.5">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] text-[9px] font-bold"
                      style={{ ...sans, background: jewel.glass, color: jewel.tint, border: CAME }}
                      aria-hidden="true"
                    >
                      {d.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[12.5px] font-semibold"
                        style={{ ...sans, color: C.fg }}
                      >
                        {d.naam}
                      </div>
                      <div className="text-[11px] tabular-nums" style={{ ...sans, color: C.muted }}>
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
      <ScreenHead screenKey="acties" title="Wat vandaag om aandacht vraagt" />

      {openCount === 0 ? (
        <Panel
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          style={{ backgroundImage: glassFill(C.emeraldGlass) }}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-[6px]"
            style={{ background: C.emeraldGlass, color: C.emerald, border: CAME }}
            aria-hidden="true"
          >
            <Check size={30} strokeWidth={2.2} />
          </span>
          <h3 className="text-[24px] font-medium" style={{ ...display, color: C.fg }}>
            Alles helder
          </h3>
          <p className="max-w-xs text-[13.5px]" style={{ ...sans, color: C.muted }}>
            Niets meer te doen vandaag. Het venster is compleet.
          </p>
        </Panel>
      ) : (
        <>
          <div
            className="mb-5 inline-flex items-center gap-2.5 rounded-[5px] px-4 py-2"
            style={{ background: C.amberGlass, border: CAME }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[12px] font-bold tabular-nums"
              style={{ ...sans, background: C.amberEdge, color: C.lead }}
              aria-hidden="true"
            >
              {openCount}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ ...sans, color: C.amber }}>
              {openCount} {openCount === 1 ? "actie" : "acties"} open
            </span>
          </div>

          <ul className="space-y-3.5">
            {ACTIES.map((a) => {
              const isDone = done.has(a.titel);
              const jewel = isDone
                ? (JEWELS.emerald as Jewel)
                : a.urgentie === "warning"
                  ? (JEWELS.amber as Jewel)
                  : (JEWELS.sapphire as Jewel);
              return (
                <Panel key={a.titel} className="overflow-hidden p-0">
                  <span
                    className="block h-1.5"
                    style={{ background: jewel.edge }}
                    aria-hidden="true"
                  />
                  <div className="flex items-start gap-4 p-5">
                    <button
                      onClick={() => toggleDone(a.titel)}
                      aria-pressed={isDone}
                      aria-label={
                        isDone ? `${a.titel} afgerond` : `Markeer ${a.titel} als afgerond`
                      }
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] transition-colors ${RING}`}
                      style={{
                        border: CAME,
                        background: isDone ? C.emeraldEdge : "transparent",
                        color: C.lead,
                      }}
                    >
                      {isDone && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[15px] font-semibold leading-snug"
                        style={{
                          ...sans,
                          color: C.fg,
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
                          className="mt-2.5 inline-flex items-center gap-1 rounded-[4px] px-3 py-1.5 text-[12px] font-semibold"
                          style={{ ...sans, color: jewel.tint, background: jewel.glass }}
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
  const statusJewel = (status: string): Jewel =>
    status === "Betaald"
      ? (JEWELS.emerald as Jewel)
      : status === "Openstaand"
        ? (JEWELS.amber as Jewel)
        : (JEWELS.amethyst as Jewel);
  return (
    <div>
      <ScreenHead
        screenKey="facturen"
        title="Je facturen"
        sub="Overzichtelijk en zonder gedoe — zodat je weet waar je aan toe bent."
      />

      <div className="mb-7 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 lg:col-span-2">
          {[
            { label: "Betaald (mnd)", value: "€ 5.552", jewel: JEWELS.emerald as Jewel },
            { label: "Openstaand", value: "€ 1.350", jewel: JEWELS.amber as Jewel },
            { label: "Concept", value: "€ 880", jewel: JEWELS.amethyst as Jewel },
          ].map((s) => (
            <Panel
              key={s.label}
              className="p-5"
              style={{ backgroundImage: glassFill(s.jewel.glass) }}
            >
              <div
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...sans, color: C.muted }}
              >
                {s.label}
              </div>
              <div
                className="mt-2 text-[26px] font-medium tabular-nums"
                style={{ ...display, color: s.jewel.tint }}
              >
                {s.value}
              </div>
            </Panel>
          ))}
        </div>
        <Panel className="flex flex-col justify-between p-5">
          <div
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...sans, color: C.muted }}
          >
            Bedrag per factuur
          </div>
          <Sparkline data={trend} tone={C.sapphire} height={48} />
        </Panel>
      </div>

      <Panel className="overflow-hidden p-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ borderBottom: CAME }}>
                {["Factuur", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-3 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                    style={{ ...sans, color: C.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const j = statusJewel(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors"
                    style={{ borderBottom: `1px solid ${C.cameSoft}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.lead2)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td
                      className="px-3 py-3.5 text-[12.5px] font-semibold tabular-nums"
                      style={{ ...sans, color: C.fg }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-3 py-3.5 text-[13px]" style={{ ...sans, color: C.fg }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-3 py-3.5 text-[12.5px] tabular-nums"
                      style={{ ...sans, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3.5 text-[13px] font-semibold tabular-nums"
                      style={{ ...sans, color: C.fg }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[4px] py-0.5 pl-1 pr-2.5 text-[11px] font-semibold"
                        style={{ ...sans, color: j.tint, background: j.glass, border: CAME }}
                      >
                        <span
                          className="flex h-4 w-4 items-center justify-center rounded-[3px]"
                          style={{ background: j.edge }}
                          aria-hidden="true"
                        >
                          {f.status === "Betaald" ? (
                            <Check size={10} strokeWidth={2.6} color={C.lead} />
                          ) : f.status === "Openstaand" ? (
                            <Clock size={10} strokeWidth={2.4} color={C.lead} />
                          ) : (
                            <FileText size={10} strokeWidth={2.4} color={C.lead} />
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

export function Concept289() {
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
        color: C.fgSoft,
        background: C.lead,
        backgroundImage: `radial-gradient(140% 90% at 15% 0%, ${C.lead2} 0%, ${C.lead} 60%)`,
      }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-[6px]"
              style={{ background: C.amethystGlass, color: C.amethyst, border: CAME }}
              aria-hidden="true"
            >
              <Sparkles size={19} strokeWidth={2.2} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[21px] font-medium tracking-tight"
                style={{ ...display, color: C.fg }}
              >
                Glas-in-lood
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.24em]"
                style={{ ...sans, color: C.muted }}
              >
                ZZP platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ ...sans, color: C.fg }}>
                {PROFIEL.naam}
              </div>
              <div
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ ...sans, color: C.emerald }}
              >
                <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-[6px] text-[13px] font-bold"
              style={{ ...sans, background: C.emeraldGlass, color: C.emerald, border: CAME }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <nav className="mb-9 flex flex-wrap gap-1.5 overflow-x-auto" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICONS[s.key];
            const j = SCREEN_JEWEL[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-[5px] px-4 py-2 text-[12.5px] font-semibold transition-colors duration-300 ${RING}`}
                style={{
                  ...sans,
                  color: on ? j.tint : C.fgSoft,
                  background: on ? j.glass : "transparent",
                  border: CAME,
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
          className="mt-10 flex flex-wrap items-center justify-between gap-2 pt-5 text-[11px]"
          style={{ ...sans, borderTop: `1px solid ${C.cameSoft}`, color: C.muted }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Gem size={12} strokeWidth={2} style={{ color: C.amethyst }} aria-hidden="true" />
            {SCREENS.length} schermen · glas-in-lood v289
          </span>
          <span>Juweeltinten, gevat in lood</span>
        </footer>
      </div>
    </div>
  );
}
