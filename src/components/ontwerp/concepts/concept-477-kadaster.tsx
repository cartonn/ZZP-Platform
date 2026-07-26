"use client";

// Concept 477 — "Kadaster" · Nederlandse kadaster-/perceelkaart-esthetiek. Opdrachten en
// certificaten worden getekend als kadastrale percelen: fijne grenslijnen, meetlijnen met
// maatvoering, sectienummers en een licht topografisch raster. Technisch-precies en ambtelijk-
// strak, dun-lijnig, cartografisch kleurgebruik — vertrouwen door meetbare exactheid.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Compass,
  Crosshair,
  FileText,
  Layers,
  MapPin,
  Minus,
  Plus,
  Ruler,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  X,
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
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: kadastrale kaart — gebroken wit canvas, dunne inktlijnen, rood kadaster-accent, water —
const K = {
  paper: "#f5f5f0", // gebroken-wit kaartpapier
  paperAlt: "#eeeee6",
  card: "#fbfbf7", // perceel-vlak
  cardAlt: "#f2f2ea",
  ink: "#1f2937", // inkt
  inkSoft: "#3f4a5a",
  inkMute: "#697386",
  inkFaint: "#9aa2ae",
  line: "#d3d3c7", // perceel-hairline
  lineStrong: "#b4b4a6", // sectiegrens
  red: "#dc2626", // kadaster-accent (grenspaal)
  redSoft: "#fae2e2",
  water: "#93c5cc", // waterblauw
  waterFill: "rgba(147,197,204,0.30)",
  waterInk: "#256b74",
  green: "#3f7d4f", // geverifieerd perceel
  greenSoft: "#dcecdf",
  amber: "#b45309", // verloopt / let op
  amberSoft: "#f6e5ce",
  violet: "#585bb5", // in beoordeling
  violetSoft: "#e2e2f5",
};

const sans = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const mono = {
  fontFamily: "ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

// Topografisch raster: fijn grid + coarser sectie-grid + zachte contour, puur CSS.
function mapBg(): React.CSSProperties {
  return {
    backgroundColor: K.paper,
    backgroundImage: [
      "linear-gradient(rgba(31,41,55,0.045) 1px, transparent 1px)",
      "linear-gradient(90deg, rgba(31,41,55,0.045) 1px, transparent 1px)",
      "linear-gradient(rgba(31,41,55,0.08) 1px, transparent 1px)",
      "linear-gradient(90deg, rgba(31,41,55,0.08) 1px, transparent 1px)",
      "radial-gradient(120% 90% at 88% -8%, rgba(147,197,204,0.16) 0%, rgba(147,197,204,0) 55%)",
    ].join(","),
    backgroundSize: "22px 22px, 22px 22px, 110px 110px, 110px 110px, 100% 100%",
  };
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        ink: K.green,
        wash: K.greenSoft,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        ink: K.violet,
        wash: K.violetSoft,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: K.amber,
        wash: K.amberSoft,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: X,
        alarm: true,
        ink: K.red,
        wash: K.redSoft,
      };
  }
}

// — Meetpunt-hoekjes: kleine L-tekens in de vier hoeken, als kadastrale grenspunten —
function CornerTicks({ tone = K.lineStrong }: { tone?: string }) {
  const base = "pointer-events-none absolute h-2.5 w-2.5";
  return (
    <span aria-hidden="true">
      <span
        className={`${base} left-1.5 top-1.5`}
        style={{ borderTop: `1.5px solid ${tone}`, borderLeft: `1.5px solid ${tone}` }}
      />
      <span
        className={`${base} right-1.5 top-1.5`}
        style={{ borderTop: `1.5px solid ${tone}`, borderRight: `1.5px solid ${tone}` }}
      />
      <span
        className={`${base} bottom-1.5 left-1.5`}
        style={{ borderBottom: `1.5px solid ${tone}`, borderLeft: `1.5px solid ${tone}` }}
      />
      <span
        className={`${base} bottom-1.5 right-1.5`}
        style={{ borderBottom: `1.5px solid ${tone}`, borderRight: `1.5px solid ${tone}` }}
      />
    </span>
  );
}

// — Perceel: kadastraal kaart-vlak met dunne grens, hoekpunten en optioneel sectielabel —
function Parcel({
  children,
  className = "",
  as: Tag = "div",
  interactive = false,
  tint = K.card,
  ticks = true,
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  interactive?: boolean;
  tint?: string;
  ticks?: boolean;
  accent?: string;
}) {
  return (
    <Tag
      className={`kd-parcel relative ${interactive ? "kd-parcel--int" : ""} ${className}`}
      style={{
        background: tint,
        border: `1px solid ${K.line}`,
        boxShadow: "0 1px 0 rgba(31,41,55,0.03)",
        color: K.ink,
        borderLeft: accent ? `2.5px solid ${accent}` : `1px solid ${K.line}`,
      }}
    >
      {ticks && <CornerTicks />}
      {children}
    </Tag>
  );
}

// — Sectie-eyebrow: ambtelijk label met maatstreep —
function Section({ children, tone = K.red }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.22em]"
      style={{ color: tone, ...sans }}
    >
      <Compass size={13} aria-hidden="true" strokeWidth={2} />
      {children}
    </p>
  );
}

// — Meetlijn: horizontale lijn met eindstreepjes en gecentreerde maatvoering-label —
function MeasureLine({ label, tone = K.inkMute }: { label: string; tone?: string }) {
  return (
    <span className="flex w-full items-center gap-2" aria-hidden="true">
      <span className="h-2 w-px shrink-0" style={{ background: tone }} />
      <span className="relative h-px flex-1" style={{ background: tone }}>
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap px-1 text-[9px] font-bold uppercase tracking-[0.1em]"
          style={{ color: tone, background: K.card, ...mono }}
        >
          {label}
        </span>
      </span>
      <span className="h-2 w-px shrink-0" style={{ background: tone }} />
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  tone = K.red,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.06em] transition-all duration-150 hover:brightness-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f5f0] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{ color: "#fbfbf7", background: tone, border: `1px solid ${tone}`, ...sans }}
    >
      {children}
    </button>
  );
}

function OutlineButton({
  children,
  onClick,
  active = false,
  className = "",
  ariaPressed,
  ariaExpanded,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  ariaPressed?: boolean;
  ariaExpanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.06em] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f5f0] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? "#fbfbf7" : K.inkSoft,
        background: active ? K.ink : K.card,
        border: `1px solid ${active ? K.ink : K.lineStrong}`,
        ...sans,
      }}
    >
      {children}
    </button>
  );
}

// — Sparkline in cartografische stijl: dunne geknikte hoogtelijn met meetpunten —
function ContourLine({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 30;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 3 - ((d - min) / span) * (h - 6)] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      role="img"
    >
      <title>Verloop {id}</title>
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.4"
        strokeDasharray="1 0"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <rect
          key={i}
          x={p[0] - 1}
          y={p[1] - 1}
          width="2"
          height="2"
          fill={tone}
          opacity={i === pts.length - 1 ? 1 : 0.45}
        />
      ))}
      <circle cx={last[0]} cy={last[1]} r="2.4" fill="none" stroke={tone} strokeWidth="1.2" />
    </svg>
  );
}

// — Kadastraal peilmeter-balkje —
function Gauge({ value, tone = K.green }: { value: number; tone?: string }) {
  return (
    <span className="flex items-center gap-2" aria-hidden="true">
      <span
        className="relative h-2 w-28 overflow-hidden"
        style={{ background: K.paperAlt, border: `1px solid ${K.line}` }}
      >
        <span
          className="block h-full"
          style={{
            width: `${value}%`,
            background: tone,
            transition: "width 0.7s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span className="text-[12px] font-bold" style={{ color: tone, ...mono }}>
        {value}%
      </span>
    </span>
  );
}

// Sectie-aanduiding uit een opdracht-id afleiden (bv. OPD-2041 → "K · 2041").
function sectieVan(id: string): string {
  const num = id.replace(/\D/g, "");
  return `K · ${num.slice(-4)}`;
}

function matchTone(match: number): { ink: string; wash: string; label: string } {
  if (match >= 90) return { ink: K.green, wash: K.greenSoft, label: "Sterke ligging" };
  if (match >= 85) return { ink: K.waterInk, wash: K.waterFill, label: "Goede ligging" };
  return { ink: K.amber, wash: K.amberSoft, label: "Redelijke ligging" };
}

export function Concept477() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [actief, setActief] = useState<Opdracht>(OPDRACHTEN[0] as Opdracht);

  const openOpdracht = (o?: Opdracht) => {
    if (o) setActief(o);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...sans, color: K.ink, ...mapBg() }}
    >
      <style>{`
        @keyframes kdIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .kd-in { animation: kdIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .kd-parcel--int { transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s cubic-bezier(0.22,1,0.36,1), border-color 0.22s; }
        .kd-parcel--int:hover { transform: translateY(-2px); box-shadow: 0 10px 22px -16px rgba(31,41,55,0.5); border-color: ${K.lineStrong}; }
        @media (prefers-reduced-motion: reduce) { .kd-in { animation: none !important; } .kd-parcel--int { transition: none !important; } .kd-parcel--int:hover { transform: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="kd-in pt-6">
          {screen === "dashboard" && (
            <Dashboard
              onOpen={openOpdracht}
              onActies={() => setScreen("acties")}
              onMarkt={() => setScreen("marktplaats")}
            />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={openOpdracht} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={actief} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </main>
        <FooterLegend />
      </div>
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex items-center justify-between gap-4 py-5">
      <div className="flex items-center gap-3.5">
        <span
          className="relative inline-flex h-11 w-11 items-center justify-center"
          style={{ background: K.card, border: `1.5px solid ${K.ink}`, color: K.red }}
          aria-hidden="true"
        >
          <CornerTicks tone={K.ink} />
          <Crosshair size={20} strokeWidth={2} />
        </span>
        <div>
          <p className="text-[18px] font-bold leading-none tracking-tight" style={{ color: K.ink }}>
            Kadaster
          </p>
          <p
            className="mt-1.5 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em]"
            style={{ color: K.inkMute, ...mono }}
          >
            <MapPin size={11} aria-hidden="true" />
            52.0907° N · 5.1214° O
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] sm:inline-flex"
          style={{
            color: K.green,
            background: K.greenSoft,
            border: `1px solid ${K.green}`,
            ...sans,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-9 w-9 items-center justify-center"
          style={{ background: K.card, border: `1px solid ${K.lineStrong}`, color: K.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center text-[9px] font-bold"
              style={{ background: K.red, color: "#fbfbf7", ...mono }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-bold" style={{ color: K.ink }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[10.5px]" style={{ color: K.inkMute }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-10 w-10 items-center justify-center text-[12px] font-bold"
          style={{ background: K.card, border: `1.5px solid ${K.ink}`, color: K.ink, ...mono }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-1">
      <div
        className="flex items-stretch gap-0 overflow-x-auto"
        style={{ borderBottom: `1.5px solid ${K.lineStrong}` }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#dc2626] motion-reduce:transition-none"
              style={{ color: on ? K.ink : K.inkMute, ...sans }}
            >
              <span
                className="mr-1.5 text-[9px] font-bold"
                style={{ color: on ? K.red : K.inkFaint, ...mono }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              {s.label}
              {on && (
                <span
                  className="absolute inset-x-0 -bottom-[1.5px] h-[2.5px]"
                  style={{ background: K.red }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Dashboard({
  onOpen,
  onActies,
  onMarkt,
}: {
  onOpen: (o: Opdracht) => void;
  onActies: () => void;
  onMarkt: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        <Parcel className="overflow-hidden p-7 md:p-8" interactive>
          <div className="flex items-center justify-between">
            <Section>Perceelkaart · overzicht</Section>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: K.inkFaint, ...mono }}
            >
              Sectie K
            </span>
          </div>
          <h1
            className="mt-4 text-[28px] font-bold leading-[1.08] tracking-[-0.01em] md:text-[38px]"
            style={{ color: K.ink }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[13px] leading-relaxed" style={{ color: K.inkSoft }}>
            Je percelen zijn ingemeten en de grenzen kloppen. Er liggen verse opdrachten in de
            sectie en één meetpunt vraagt vandaag aandacht. Alles staat exact op de kaart.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <PrimaryButton onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </PrimaryButton>
            <OutlineButton onClick={onMarkt}>
              <Layers size={13} aria-hidden="true" />
              Marktplaats
            </OutlineButton>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { l: "Percelen", v: String(OPDRACHTEN.length), i: Layers },
              { l: "Ingemeten", v: `${ratio}%`, i: Ruler },
              { l: "Reacties", v: "7", i: MapPin },
              { l: "Meetpunten", v: `${CREDENTIALS.length}`, i: Crosshair },
            ].map((m) => (
              <div key={m.l} className="pt-3" style={{ borderTop: `1px solid ${K.line}` }}>
                <m.i size={14} aria-hidden="true" style={{ color: K.inkFaint }} />
                <p
                  className="mt-2 text-[20px] font-bold leading-none"
                  style={{ color: K.ink, ...mono }}
                >
                  {m.v}
                </p>
                <p
                  className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: K.inkMute }}
                >
                  {m.l}
                </p>
              </div>
            ))}
          </div>
        </Parcel>

        <Parcel className="p-6" interactive tint={K.cardAlt} accent={K.amber}>
          <div className="flex items-center justify-between">
            <Section tone={K.amber}>Meetpunt · aandacht</Section>
            <AlertTriangle size={17} aria-hidden="true" style={{ color: K.amber }} />
          </div>
          <h2 className="mt-3 text-[17px] font-bold leading-snug" style={{ color: K.ink }}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: K.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <PrimaryButton onClick={onActies} tone={K.amber} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <p
            className="mt-5 flex items-center gap-2 pt-4 text-[11.5px]"
            style={{ color: K.inkMute, borderTop: `1px solid ${K.line}` }}
          >
            <Check size={13} aria-hidden="true" style={{ color: K.green }} />
            {verified}/{CREDENTIALS.length} meetpunten geverifieerd · 7 open reacties
          </p>
        </Parcel>
      </section>

      <section>
        <div className="mb-3">
          <Section tone={K.waterInk}>Meetstaat · deze maand</Section>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = k.up ? K.green : K.amber;
            const Trend = k.up ? TrendingUp : TrendingDown;
            return (
              <Parcel key={k.label} className="p-5" interactive>
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[9.5px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: K.inkMute, ...sans }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold"
                    style={{ color: tone, ...mono }}
                  >
                    <Trend size={11} aria-hidden="true" /> {k.trend.replace(/^\+/, "")}
                  </span>
                </div>
                <p
                  className="mt-3 text-[24px] font-bold leading-none tracking-[-0.01em]"
                  style={{ color: K.ink, ...mono }}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <ContourLine data={k.spark} tone={tone} id={`k477-${i}`} />
                </div>
              </Parcel>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Section>Percelen in jouw sectie</Section>
            <button
              type="button"
              onClick={onMarkt}
              className="text-[10.5px] font-bold uppercase tracking-[0.14em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f5f0]"
              style={{ color: K.red }}
            >
              Alle →
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o) => {
              const mt = matchTone(o.match);
              return (
                <li key={o.id}>
                  <Parcel className="p-4" interactive as="article" accent={mt.ink}>
                    <button
                      type="button"
                      onClick={() => onOpen(o)}
                      className="group flex w-full items-center gap-4 text-left focus-visible:outline-none"
                    >
                      <span
                        className="relative inline-flex h-14 w-14 shrink-0 flex-col items-center justify-center"
                        style={{ background: mt.wash, border: `1px solid ${mt.ink}` }}
                        aria-hidden="true"
                      >
                        <span
                          className="text-[16px] font-bold leading-none"
                          style={{ color: mt.ink, ...mono }}
                        >
                          {o.match}
                        </span>
                        <span
                          className="text-[7px] font-bold uppercase tracking-[0.1em]"
                          style={{ color: mt.ink }}
                        >
                          ligging
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="text-[9px] font-bold uppercase tracking-[0.12em]"
                          style={{ color: K.inkFaint, ...mono }}
                        >
                          {sectieVan(o.id)}
                        </span>
                        <span
                          className="block truncate text-[14px] font-bold"
                          style={{ color: K.ink }}
                        >
                          {o.titel}
                        </span>
                        <span className="block truncate text-[11px]" style={{ color: K.inkMute }}>
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </span>
                      </span>
                      <ChevronRight
                        size={17}
                        aria-hidden="true"
                        className="shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: K.inkFaint }}
                      />
                    </button>
                  </Parcel>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-5">
          <div>
            <div className="mb-3">
              <Section tone={K.green}>Meetpunten · certificaten</Section>
            </div>
            <Parcel className="p-4">
              <ul>
                {CREDENTIALS.map((c, i) => {
                  const st = statusMeta(c.status);
                  return (
                    <li
                      key={c.naam}
                      className="flex items-center gap-3 px-1 py-2.5"
                      style={{ borderTop: i === 0 ? "none" : `1px solid ${K.line}` }}
                    >
                      <span
                        className="inline-flex h-8 w-8 items-center justify-center"
                        style={{
                          background: st.wash,
                          border: `1px solid ${st.ink}`,
                          color: st.ink,
                        }}
                        aria-hidden="true"
                      >
                        <st.Icon size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[12.5px] font-bold"
                          style={{ color: K.ink }}
                        >
                          {c.naam}
                        </span>
                        <span className="block truncate text-[10px]" style={{ color: K.inkMute }}>
                          {st.label}
                          {st.alarm && <span className="sr-only"> (let op)</span>}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Parcel>
          </div>

          <div>
            <div className="mb-3">
              <Section tone={K.violet}>Berichten</Section>
            </div>
            <Parcel className="p-2">
              <ul>
                {BERICHTEN.map((b, i) => (
                  <li
                    key={b.van}
                    className="flex items-center gap-3 px-2 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${K.line}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-[10px] font-bold"
                      style={{
                        background: K.cardAlt,
                        border: `1px solid ${K.lineStrong}`,
                        color: K.inkSoft,
                        ...mono,
                      }}
                      aria-hidden="true"
                    >
                      {b.initialen}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[12px] font-bold" style={{ color: K.ink }}>
                          {b.van}
                        </span>
                        {b.ongelezen && (
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: K.red }}
                            aria-label="ongelezen"
                          />
                        )}
                      </span>
                      <span className="block truncate text-[10.5px]" style={{ color: K.inkMute }}>
                        {b.preview}
                      </span>
                    </span>
                    <span
                      className="shrink-0 text-[9.5px] font-bold"
                      style={{ color: K.inkFaint, ...mono }}
                    >
                      {b.tijd}
                    </span>
                  </li>
                ))}
              </ul>
            </Parcel>
          </div>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(needle) ||
        o.plaats.toLowerCase().includes(needle) ||
        o.opdrachtgever.toLowerCase().includes(needle),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Section>Marktplaats · perceelregister</Section>
          <h1
            className="mt-3 text-[28px] font-bold leading-none tracking-[-0.01em]"
            style={{ color: K.ink }}
          >
            Opdrachten in kaart
          </h1>
          <p className="mt-2 text-[12.5px]" style={{ color: K.inkMute }}>
            {filtered.length} van {OPDRACHTEN.length} percelen passen bij jouw profiel
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-4 py-3"
          style={{ background: K.card, border: `1px solid ${K.lineStrong}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: K.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9aa2ae]"
            style={{ color: K.ink, ...sans }}
          />
        </div>
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Sorteren en laden"
        >
          {(["match", "tarief"] as const).map((s) => (
            <OutlineButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Ligging" : "Tarief"}
            </OutlineButton>
          ))}
          <OutlineButton
            onClick={() => {
              setLoading((v) => !v);
              setError(false);
            }}
            active={loading}
            ariaPressed={loading}
          >
            {loading ? "Stop" : "Herladen"}
          </OutlineButton>
          <OutlineButton
            onClick={() => {
              setError((v) => !v);
              setLoading(false);
            }}
            active={error}
            ariaPressed={error}
          >
            {error ? "Herstel" : "Toon storing"}
          </OutlineButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Parcel className="p-5" ticks={false}>
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24" style={{ background: K.cardAlt }} />
                  <div className="h-5 w-2/3" style={{ background: K.cardAlt }} />
                  <div className="h-3 w-1/2" style={{ background: K.cardAlt }} />
                </div>
              </Parcel>
            </li>
          ))}
        </ul>
      ) : error ? (
        <Parcel className="p-6" accent={K.red}>
          <div className="flex flex-col items-center py-12 text-center" role="alert">
            <span
              className="inline-flex h-14 w-14 items-center justify-center"
              style={{ background: K.redSoft, border: `1px solid ${K.red}`, color: K.red }}
              aria-hidden="true"
            >
              <AlertTriangle size={24} />
            </span>
            <p className="mt-5 text-[19px] font-bold" style={{ color: K.ink }}>
              Kaartlaag niet geladen
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[12.5px]" style={{ color: K.inkSoft }}>
              De perceelgegevens konden niet worden opgehaald. Controleer je verbinding en probeer
              de meting opnieuw.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setError(false)} tone={K.red}>
                Opnieuw meten <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Parcel>
      ) : filtered.length === 0 ? (
        <Parcel className="p-6">
          <div className="flex flex-col items-center py-12 text-center">
            <span
              className="inline-flex h-14 w-14 items-center justify-center"
              style={{
                background: K.cardAlt,
                border: `1px solid ${K.lineStrong}`,
                color: K.inkMute,
              }}
              aria-hidden="true"
            >
              <Search size={24} />
            </span>
            <p className="mt-5 text-[19px] font-bold" style={{ color: K.ink }}>
              Geen perceel gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[12.5px]" style={{ color: K.inkSoft }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Pas de zoekterm aan of wis het
              filter.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Parcel>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktParcel opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarktParcel({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: (o: Opdracht) => void;
}) {
  const [open, setOpen] = useState(false);
  const mt = matchTone(opdracht.match);
  return (
    <Parcel className="p-5" interactive as="article" accent={mt.ink}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
              style={{ color: K.inkMute, border: `1px solid ${K.line}`, ...mono }}
            >
              perceel {String(index + 1).padStart(2, "0")}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ color: K.inkFaint, ...mono }}
            >
              {sectieVan(opdracht.id)} · {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[17px] font-bold leading-snug" style={{ color: K.ink }}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12px]" style={{ color: K.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  color: K.inkSoft,
                  background: K.cardAlt,
                  border: `1px solid ${K.line}`,
                  ...sans,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="relative inline-flex h-14 w-14 flex-col items-center justify-center"
            style={{ background: mt.wash, border: `1px solid ${mt.ink}` }}
            aria-hidden="true"
          >
            <span className="text-[17px] font-bold leading-none" style={{ color: mt.ink, ...mono }}>
              {opdracht.match}
            </span>
            <span
              className="text-[7px] font-bold uppercase tracking-[0.08em]"
              style={{ color: mt.ink }}
            >
              ligging
            </span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: K.ink, ...mono }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Ligging", v: mt.label },
        ].map((m) => (
          <div key={m.l}>
            <MeasureLine label={m.l} />
            <p
              className="mt-1.5 text-center text-[11.5px] font-bold"
              style={{ color: K.inkSoft, ...mono }}
            >
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <OutlineButton onClick={() => setOpen((v) => !v)} ariaExpanded={open}>
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Grensbepaling
        </OutlineButton>
        <div className="ml-auto">
          <PrimaryButton onClick={() => onOpen(opdracht)}>
            Openen <ArrowRight size={13} aria-hidden="true" />
          </PrimaryButton>
        </div>
      </div>

      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="In jouw voordeel"
              tone={K.green}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Grenscorrectie nodig"
              tone={K.amber}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Parcel>
  );
}

function RedenBlok({
  titel,
  tone,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div
      className="p-4"
      style={{
        background: K.cardAlt,
        border: `1px solid ${K.line}`,
        borderLeft: `2.5px solid ${tone}`,
      }}
    >
      <p
        className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em]"
        style={{ color: tone, ...sans }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12px]" style={{ color: K.inkSoft }}>
            <Icon
              size={13}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: tone }}
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const mt = matchTone(opdracht.match);
  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 px-3.5 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f5f0]"
        style={{ color: K.ink, border: `1px solid ${K.lineStrong}`, background: K.card, ...sans }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar register
      </button>

      <Parcel className="p-7 md:p-8" accent={mt.ink}>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{ color: K.inkMute, border: `1px solid ${K.line}`, ...mono }}
          >
            {sectieVan(opdracht.id)} · {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em]"
            style={{ color: "#fbfbf7", background: mt.ink, ...sans }}
          >
            <MapPin size={11} aria-hidden="true" /> {mt.label} · {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[26px] font-bold leading-[1.1] tracking-[-0.01em] md:text-[34px]"
          style={{ color: K.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: K.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <PrimaryButton>
            Reageer op perceel <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
          <OutlineButton>
            <FileText size={13} aria-hidden="true" /> Bewaren
          </OutlineButton>
        </div>
      </Parcel>

      <Parcel ticks={false}>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Ligging", v: `${opdracht.match}%` },
          ].map((m, i) => (
            <div
              key={m.l}
              className="p-5"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${K.line}`,
                borderTop: i >= 2 ? `1px solid ${K.line}` : "none",
              }}
            >
              <p
                className="text-[9px] font-bold uppercase tracking-[0.16em]"
                style={{ color: K.inkMute, ...sans }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[17px] font-bold tracking-[-0.01em]"
                style={{ color: K.ink, ...mono }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Parcel>

      <section>
        <Section>Grensbepaling · waarom dit perceel past</Section>
        <p className="mt-3 max-w-xl text-[13px] leading-relaxed" style={{ color: K.inkSoft }}>
          Ingemeten tegen je geverifieerde profiel — wat in je voordeel spreekt én waar een
          grenscorrectie nodig is. Transparant, zonder verborgen score.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Parcel className="p-6" accent={K.green}>
            <p
              className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em]"
              style={{ color: K.green, ...sans }}
            >
              <Check size={13} aria-hidden="true" /> In jouw voordeel
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13px]"
                  style={{ color: K.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: K.green }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Parcel>
          <Parcel className="p-6" accent={K.amber}>
            <p
              className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em]"
              style={{ color: K.amber, ...sans }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Grenscorrectie nodig
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13px]"
                  style={{ color: K.inkSoft }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: K.amber }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Parcel>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span
            className="text-[11px] font-bold uppercase tracking-[0.1em]"
            style={{ color: mt.ink, ...sans }}
          >
            Ligging {opdracht.match}% — {mt.label.toLowerCase()}
          </span>
          <span className="h-px flex-1" style={{ background: K.line }} aria-hidden="true" />
        </div>
      </section>

      <section>
        <div className="mb-3">
          <Section tone={K.violet}>Vereiste meetpunten</Section>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CREDENTIALS.slice(0, 2).map((c) => {
            const st = statusMeta(c.status);
            return (
              <Parcel key={c.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center"
                  style={{ background: st.wash, border: `1px solid ${st.ink}`, color: st.ink }}
                  aria-hidden="true"
                >
                  <st.Icon size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-bold" style={{ color: K.ink }}>
                    {c.naam}
                  </span>
                  <span className="block truncate text-[10.5px]" style={{ color: K.inkMute }}>
                    {st.label}
                  </span>
                </span>
                <Check size={16} aria-hidden="true" style={{ color: K.green }} />
              </Parcel>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-5">
      <Parcel className="p-7 md:p-8" accent={K.green}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Section tone={K.green}>Verificatie · perceelmeting</Section>
            <h1
              className="mt-3 text-[24px] font-bold leading-tight tracking-[-0.01em]"
              style={{ color: K.ink }}
            >
              Jouw meetpunten
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed" style={{ color: K.inkSoft }}>
              <span className="font-bold" style={{ color: K.green }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van de {CREDENTIALS.length} meetpunten zijn ingemeten en geverifieerd. Eén
              verloopt binnenkort — die zetten we op tijd opnieuw uit. Documenten blijven
              versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <Gauge value={ratio} tone={K.green} />
            </div>
          </div>
          <span
            className="relative inline-flex h-24 w-24 flex-col items-center justify-center"
            style={{ background: K.greenSoft, border: `1.5px solid ${K.green}` }}
          >
            <CornerTicks tone={K.green} />
            <span
              className="text-[26px] font-bold leading-none"
              style={{ color: K.green, ...mono }}
            >
              {ratio}
            </span>
            <span
              className="mt-1 text-[7.5px] font-bold uppercase tracking-[0.16em]"
              style={{ color: K.green }}
            >
              % ingemeten
            </span>
          </span>
        </div>
      </Parcel>

      <Parcel ticks={false}>
        <ul>
          {CREDENTIALS.map((c, idx) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam} style={{ borderTop: idx === 0 ? "none" : `1px solid ${K.line}` }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f2f2ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#dc2626] motion-reduce:transition-none"
                >
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center"
                    style={{ background: st.wash, border: `1px solid ${st.ink}`, color: st.ink }}
                    aria-hidden="true"
                  >
                    <st.Icon size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-bold" style={{ color: K.ink }}>
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[11px]"
                      style={{ color: K.inkMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span
                      className="hidden w-max items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.04em] sm:inline-flex"
                      style={{
                        color: st.ink,
                        background: st.wash,
                        border: `1px solid ${st.ink}`,
                        ...sans,
                      }}
                    >
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </span>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: K.inkFaint,
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                      aria-hidden="true"
                    >
                      <Plus size={16} />
                    </span>
                  </span>
                </button>
                <div
                  className="grid transition-all duration-500 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-4 sm:pl-[76px]">
                      <div
                        className="p-4"
                        style={{ background: K.cardAlt, border: `1px solid ${K.line}` }}
                      >
                        <p
                          className="max-w-xl text-[12.5px] leading-relaxed"
                          style={{ color: K.inkSoft }}
                        >
                          {c.detail}. Dit document wordt versleuteld bewaard en alleen na jouw
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryButton tone={c.status === "EXPIRING" ? K.amber : K.red}>
                            {c.status === "EXPIRING" ? "Opnieuw uitzetten" : "Bekijken"}
                          </PrimaryButton>
                          <OutlineButton>Historie</OutlineButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Parcel>

      <div>
        <div className="mb-3">
          <Section tone={K.violet}>Documentenkast</Section>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Parcel key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center"
                  style={{
                    background: K.cardAlt,
                    border: `1px solid ${K.lineStrong}`,
                    color: K.inkSoft,
                  }}
                  aria-hidden="true"
                >
                  <FileText size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-bold" style={{ color: K.ink }}>
                    {d.naam}
                  </span>
                  <span className="block text-[10px]" style={{ color: K.inkMute, ...mono }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.04em]"
                  style={{ color: st.ink, background: st.wash, border: `1px solid ${st.ink}` }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </Parcel>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-5">
      <div>
        <Section>Acties · op volgorde van urgentie</Section>
        <h1
          className="mt-3 text-[28px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: K.ink }}
        >
          Wat vandaag je aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13px]" style={{ color: K.inkSoft }}>
          Van boven naar beneden ingemeten: het meest dringende meetpunt eerst. Eén ding tegelijk.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? K.amber : K.waterInk;
          const wash = warn ? K.amberSoft : K.waterFill;
          return (
            <li key={a.titel}>
              <Parcel className="p-5" interactive accent={tone}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-10 w-10 items-center justify-center text-[14px] font-bold"
                    style={{ background: wash, border: `1px solid ${tone}`, color: tone, ...mono }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]"
                      style={{
                        color: tone,
                        background: wash,
                        border: `1px solid ${tone}`,
                        ...sans,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Compass size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[17px] font-bold leading-snug"
                      style={{ color: K.ink }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: K.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <PrimaryButton tone={tone}>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </PrimaryButton>
                  </div>
                </div>
              </Parcel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): { ink: string; wash: string; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { ink: K.amber, wash: K.amberSoft, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: K.green, wash: K.greenSoft, Icon: Check };
  return { ink: K.inkMute, wash: K.cardAlt, Icon: FileText };
}

function Facturen() {
  const [sort, setSort] = useState<"datum" | "bedrag">("datum");

  const rows = useMemo(() => {
    if (sort === "datum") return FACTUREN;
    return [...FACTUREN].sort(
      (a, b) =>
        parseInt(b.bedrag.replace(/\D/g, ""), 10) - parseInt(a.bedrag.replace(/\D/g, ""), 10),
    );
  }, [sort]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Section>Facturen · kadastraal register</Section>
          <h1
            className="mt-3 text-[28px] font-bold leading-none tracking-[-0.01em]"
            style={{ color: K.ink }}
          >
            Jouw facturen
          </h1>
        </div>
        <PrimaryButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 8.622", sub: "3 facturen", alarm: false, tone: K.green },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true, tone: K.amber },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false, tone: K.inkMute },
        ].map((s) => (
          <Parcel key={s.l} className="p-5" interactive accent={s.alarm ? K.amber : undefined}>
            <div className="flex items-center justify-between">
              <p
                className="text-[9.5px] font-bold uppercase tracking-[0.1em]"
                style={{ color: K.inkMute, ...sans }}
              >
                {s.l}
              </p>
              {s.alarm && <AlertTriangle size={14} aria-hidden="true" style={{ color: K.amber }} />}
            </div>
            <p
              className="mt-2 text-[24px] font-bold tracking-[-0.01em]"
              style={{ color: s.tone, ...mono }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11px]" style={{ color: K.inkMute }}>
              {s.sub}
            </p>
          </Parcel>
        ))}
      </section>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <OutlineButton
            key={s}
            onClick={() => setSort(s)}
            active={sort === s}
            ariaPressed={sort === s}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </OutlineButton>
        ))}
      </div>

      <Parcel ticks={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <caption className="sr-only">Facturen met status en bedrag</caption>
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${K.lineStrong}` }}>
                {[
                  { h: "Nummer", a: "left" },
                  { h: "Klant", a: "left" },
                  { h: "Datum", a: "left" },
                  { h: "Status", a: "left" },
                  { h: "Bedrag", a: "right" },
                ].map((c) => (
                  <th
                    key={c.h}
                    scope="col"
                    className={`px-4 py-3 text-[9px] font-bold uppercase tracking-[0.14em] ${c.a === "right" ? "text-right" : ""}`}
                    style={{ color: K.inkMute, ...sans }}
                  >
                    {c.h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((f, i) => {
                const ft = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#f2f2ea]"
                    style={{
                      background: i % 2 === 1 ? K.cardAlt : "transparent",
                      borderBottom: `1px solid ${K.line}`,
                    }}
                  >
                    <td
                      className="px-4 py-3 text-[11px] font-bold"
                      style={{ color: K.inkMute, ...mono }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-bold" style={{ color: K.ink }}>
                      {f.klant}
                    </td>
                    <td className="px-4 py-3 text-[11px]" style={{ color: K.inkMute, ...mono }}>
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.04em]"
                        style={{
                          color: ft.ink,
                          background: ft.wash,
                          border: `1px solid ${ft.ink}`,
                          ...sans,
                        }}
                      >
                        {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                        {f.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[13px] font-bold"
                      style={{ color: K.ink, ...mono }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Parcel>
    </div>
  );
}

function FooterLegend() {
  const items: { label: string; tone: string }[] = [
    { label: "Geverifieerd", tone: K.green },
    { label: "In beoordeling", tone: K.violet },
    { label: "Verloopt", tone: K.amber },
    { label: "Afgewezen", tone: K.red },
    { label: "Water", tone: K.water },
  ];
  return (
    <footer
      className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 pt-5"
      style={{ borderTop: `1px solid ${K.line}` }}
    >
      <span
        className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
        style={{ color: K.inkMute, ...sans }}
      >
        Legenda
      </span>
      {items.map((it) => (
        <span
          key={it.label}
          className="inline-flex items-center gap-1.5 text-[10.5px]"
          style={{ color: K.inkSoft }}
        >
          <span
            className="h-2.5 w-2.5"
            style={{ background: it.tone, border: `1px solid ${K.ink}` }}
            aria-hidden="true"
          />
          {it.label}
        </span>
      ))}
      <span
        className="ml-auto text-[9.5px] font-bold uppercase tracking-[0.12em]"
        style={{ color: K.inkFaint, ...mono }}
      >
        Schaal 1:500 · Sectie K
      </span>
    </footer>
  );
}
