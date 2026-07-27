"use client";

// Concept 487 — "Kompasroos" · Nautisch-cartografisch navigatie-instrument. Warm perkament/
// zeekaart-canvas met diep marineblauw, gegraveerde kompasroos- en peil-lijnen als subtiele
// decoratie. Wayfinding-metafoor: het platform als navigatie — koers, positie, bestemming.
// Fijne serif voor koppen, tabulaire cijfers als coördinaten. Strak en verfijnd, geen cliché.

import { useMemo, useState } from "react";
import {
  Anchor,
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Check,
  ChevronRight,
  Clock,
  Compass,
  FileText,
  Flag,
  LocateFixed,
  MapPin,
  Navigation2,
  Plus,
  Search,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Waves,
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

// — Perkament / zeekaart-palet met diep marineblauw en messing-accent —
const C = {
  bg: "#f4ead3",
  chart: "#f8f1de",
  card: "#fcf7ea",
  cardEdge: "#e4d5b1",
  ink: "#152b40",
  inkSoft: "#3c5064",
  inkMute: "#6d7d8c",
  inkFaint: "#9aa6ad",
  line: "#e0d2ad",
  lineSoft: "#eadfc2",

  navy: "#152b40",
  navyDeep: "#0d1f30",
  navySoft: "#dbe3ea",
  navyText: "#1c3a56",

  brass: "#b0863f",
  brassDeep: "#8f6a2c",
  brassText: "#87621f",
  brassSoft: "#f1e4c4",

  sea: "#2b7a78",
  seaDeep: "#1f5b59",
  seaText: "#1c5a58",
  seaSoft: "#d6e8e5",

  coral: "#b8482f",
  coralDeep: "#993923",
  coralText: "#9a3a24",
  coralSoft: "#f3ddd3",
};

const serif = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif",
};
const body = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const coord = {
  fontFamily: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
  fontVariantNumeric: "tabular-nums" as const,
  letterSpacing: "0.01em",
};

type Palette = { base: string; deep: string; text: string; soft: string };
const P = {
  navy: { base: C.navy, deep: C.navyDeep, text: C.navyText, soft: C.navySoft } as Palette,
  brass: { base: C.brass, deep: C.brassDeep, text: C.brassText, soft: C.brassSoft } as Palette,
  sea: { base: C.sea, deep: C.seaDeep, text: C.seaText, soft: C.seaSoft } as Palette,
  coral: { base: C.coral, deep: C.coralDeep, text: C.coralText, soft: C.coralSoft } as Palette,
};

const SCREEN_META: Record<ScreenKey, { pal: Palette; Icon: LucideIcon; kompas: string }> = {
  dashboard: { pal: P.navy, Icon: Compass, kompas: "Positie" },
  marktplaats: { pal: P.sea, Icon: Navigation2, kompas: "Vaargebied" },
  opdracht: { pal: P.brass, Icon: Flag, kompas: "Bestemming" },
  verificatie: { pal: P.sea, Icon: ShieldCheck, kompas: "Kompas geijkt" },
  acties: { pal: P.coral, Icon: LocateFixed, kompas: "Volgende koers" },
  facturen: { pal: P.brass, Icon: Wallet, kompas: "Scheepskas" },
  documenten: { pal: P.navy, Icon: FileText, kompas: "Kaartenkast" },
  berichten: { pal: P.sea, Icon: Waves, kompas: "Sein" },
};

function credMeta(s: CredStatus): {
  pal: Palette;
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
} {
  switch (s) {
    case "VERIFIED":
      return { pal: P.sea, label: "Geverifieerd", Icon: ShieldCheck, alarm: false };
    case "SUBMITTED":
      return { pal: P.navy, label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return { pal: P.brass, label: "Verloopt binnenkort", Icon: AlertTriangle, alarm: true };
    case "REJECTED":
      return { pal: P.coral, label: "Afgewezen", Icon: X, alarm: true };
  }
}

// —————————————————————————————— Decoratie: kompasroos & peil-lijnen ——————————————————————————————
function CompassRose({
  size = 200,
  stroke = C.navy,
  opacity = 0.14,
  className = "",
}: {
  size?: number;
  stroke?: string;
  opacity?: number;
  className?: string;
}) {
  const c = size / 2;
  const rays = Array.from({ length: 16 }, (_, i) => (i * 360) / 16);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-hidden="true"
      style={{ opacity }}
    >
      <circle cx={c} cy={c} r={c - 4} fill="none" stroke={stroke} strokeWidth="1" />
      <circle cx={c} cy={c} r={c - 22} fill="none" stroke={stroke} strokeWidth="0.75" />
      <circle cx={c} cy={c} r={c - 60} fill="none" stroke={stroke} strokeWidth="0.5" />
      {rays.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const outer = c - 4;
        const inner = deg % 90 === 0 ? c - 78 : deg % 45 === 0 ? c - 44 : c - 22;
        return (
          <line
            key={deg}
            x1={c + Math.sin(rad) * inner}
            y1={c - Math.cos(rad) * inner}
            x2={c + Math.sin(rad) * outer}
            y2={c - Math.cos(rad) * outer}
            stroke={stroke}
            strokeWidth={deg % 90 === 0 ? 1.2 : 0.6}
          />
        );
      })}
      {/* Noord-ster ruit */}
      <polygon
        points={`${c},${c - (c - 20)} ${c + 14},${c} ${c},${c + (c - 20)} ${c - 14},${c}`}
        fill="none"
        stroke={stroke}
        strokeWidth="1"
      />
      <polygon
        points={`${c - (c - 20)},${c} ${c},${c - 14} ${c + (c - 20)},${c} ${c},${c + 14}`}
        fill="none"
        stroke={stroke}
        strokeWidth="0.75"
      />
    </svg>
  );
}

// — Peil-ring: toont de match-score als kompas-peiling (graden) —
function BearingDial({ value, pal, size = 56 }: { value: number; pal: Palette; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const c = size / 2;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke={C.line} strokeWidth="3" />
        {Array.from({ length: 12 }, (_, i) => {
          const rad = (i * 30 * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={c + Math.sin(rad) * (r - 1)}
              y1={c - Math.cos(rad) * (r - 1)}
              x2={c + Math.sin(rad) * (r - 3)}
              y2={c - Math.cos(rad) * (r - 3)}
              stroke={C.inkFaint}
              strokeWidth="0.75"
            />
          );
        })}
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={pal.base}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform={`rotate(-90 ${c} ${c})`}
        />
      </svg>
      <span
        className="absolute flex flex-col items-center leading-none"
        style={{ color: pal.text }}
      >
        <span className="text-[13px] font-semibold" style={{ ...coord }}>
          {value}
        </span>
        <span className="text-[7px] uppercase tracking-[0.12em]" style={{ color: C.inkMute }}>
          peiling
        </span>
      </span>
    </span>
  );
}

// — Diepgang-grafiek (sparkline als loodlijn / dieptemeting) —
function Sounding({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 96;
  const h = 28;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 3 - ((d - min) / span) * (h - 6)] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={area} fill={tone} opacity="0.1" />
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.4" fill={C.card} stroke={tone} strokeWidth="1.6" />
    </svg>
  );
}

// —————————————————————————————— Primitieven ——————————————————————————————
function Chip({
  children,
  pal,
  Icon,
  outline = false,
}: {
  children: React.ReactNode;
  pal: Palette;
  Icon?: LucideIcon;
  outline?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={
        outline
          ? {
              color: pal.text,
              background: "transparent",
              border: `1px solid ${pal.base}55`,
              ...body,
            }
          : { color: pal.text, background: pal.soft, ...body }
      }
    >
      {Icon && <Icon size={11} aria-hidden="true" />}
      {children}
    </span>
  );
}

function Button({
  children,
  onClick,
  pal = P.navy,
  variant = "solid",
  size = "md",
  className = "",
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  pal?: Palette;
  variant?: "solid" | "quiet" | "outline";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  const pad = size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-4 py-2.5 text-[13px]";
  const styles: React.CSSProperties =
    variant === "solid"
      ? { background: pal.base, color: "#fbf6e8" }
      : variant === "quiet"
        ? { background: pal.soft, color: pal.text }
        : { background: "transparent", color: C.inkSoft, border: `1px solid ${C.cardEdge}` };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4ead3] ${pad} ${className}`}
      style={{
        ...styles,
        ...body,
        boxShadow: variant === "solid" ? "0 1px 2px rgba(13,31,48,0.2)" : undefined,
      }}
    >
      {children}
    </button>
  );
}

function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag
      className={`rounded-xl ${className}`}
      style={{
        background: C.card,
        border: `1px solid ${C.cardEdge}`,
        boxShadow: "0 1px 2px rgba(21,43,64,0.04)",
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function SectionHead({
  children,
  pal,
  Icon,
  sub,
}: {
  children: React.ReactNode;
  pal: Palette;
  Icon: LucideIcon;
  sub?: string;
}) {
  return (
    <div className="mb-3">
      <h2
        className="flex items-center gap-2 text-[15px] font-semibold tracking-[0.01em]"
        style={{ color: C.ink, ...serif }}
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{ background: pal.soft, color: pal.text }}
          aria-hidden="true"
        >
          <Icon size={13} />
        </span>
        {children}
      </h2>
      {sub && (
        <p className="mt-1 text-[12px]" style={{ color: C.inkMute, ...body }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// —————————————————————————————— Hoofdcomponent ——————————————————————————————
export function Concept487() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full overflow-hidden antialiased"
      style={{
        ...body,
        color: C.ink,
        backgroundColor: C.bg,
        backgroundImage: [
          "radial-gradient(60% 50% at 50% -8%, rgba(176,134,63,0.10) 0%, rgba(176,134,63,0) 70%)",
          "linear-gradient(180deg, rgba(21,43,64,0.03) 0%, rgba(21,43,64,0) 26%)",
        ].join(","),
      }}
    >
      {/* Gegraveerde peil-lijnen als achtergrondtextuur */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(21,43,64,0.035) 0, rgba(21,43,64,0.035) 1px, transparent 1px, transparent 34px), repeating-linear-gradient(90deg, rgba(21,43,64,0.035) 0, rgba(21,43,64,0.035) 1px, transparent 1px, transparent 34px)",
          maskImage: "radial-gradient(120% 90% at 50% 0%, #000 40%, transparent 100%)",
        }}
      />
      <CompassRose
        size={340}
        className="pointer-events-none absolute -right-24 -top-20"
        opacity={0.08}
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="pt-6">
          {screen === "dashboard" && (
            <Dashboard
              onOpen={() => setScreen("opdracht")}
              onMarkt={() => setScreen("marktplaats")}
              onActies={() => setScreen("acties")}
            />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties onMarkt={() => setScreen("marktplaats")} />}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header
      className="flex flex-wrap items-center justify-between gap-4 border-b py-5"
      style={{ borderColor: C.line }}
    >
      <div className="flex items-center gap-3">
        <span
          className="relative flex h-11 w-11 items-center justify-center rounded-lg"
          style={{ background: C.navy, color: C.brass }}
          aria-hidden="true"
        >
          <Compass size={22} strokeWidth={1.6} />
        </span>
        <div>
          <p
            className="text-[18px] font-semibold leading-none tracking-[0.02em]"
            style={{ color: C.ink, ...serif }}
          >
            Kompasroos
          </p>
          <p
            className="mt-1.5 flex items-center gap-1.5 text-[11px] leading-none"
            style={{ color: C.inkMute, ...coord }}
          >
            <MapPin size={11} aria-hidden="true" /> 52°05′N · 05°07′E — {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium sm:inline-flex"
          style={{ color: C.seaText, background: C.seaSoft }}
        >
          <ShieldCheck size={12} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: C.card, border: `1px solid ${C.cardEdge}`, color: C.inkMute }}
          aria-label={`${ongelezen} nieuwe seinen`}
        >
          <Waves size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-semibold"
              style={{ background: C.coral, color: "#fbf6e8", ...coord }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[12px] font-semibold"
          style={{ background: C.brassSoft, color: C.brassText, ...coord }}
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
    <nav aria-label="Hoofdnavigatie" className="pt-4">
      <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
        {SCREENS.map((s) => {
          const on = s.key === screen;
          const { pal, Icon } = SCREEN_META[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="group inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4ead3]"
              style={
                on
                  ? { background: C.navy, color: "#fbf6e8" }
                  : { background: "transparent", color: C.inkSoft }
              }
            >
              <Icon size={14} aria-hidden="true" style={{ color: on ? C.brass : pal.text }} />
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// —————————————————————————————————— Dashboard ——————————————————————————————————
function Dashboard({
  onOpen,
  onMarkt,
  onActies,
}: {
  onOpen: () => void;
  onMarkt: () => void;
  onActies: () => void;
}) {
  const koers = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Positie-hero */}
        <div
          className="relative overflow-hidden rounded-2xl p-7 md:p-8"
          style={{
            background: `linear-gradient(135deg, ${C.navyDeep} 0%, ${C.navy} 100%)`,
            color: "#f3ead3",
          }}
        >
          <CompassRose
            size={230}
            stroke="#f3ead3"
            opacity={0.16}
            className="pointer-events-none absolute -bottom-16 -right-12"
          />
          <p
            className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em]"
            style={{ color: C.brass }}
          >
            <Navigation2 size={12} aria-hidden="true" /> Huidige positie
          </p>
          <h1
            className="mt-3 max-w-md text-[26px] font-semibold leading-[1.14] tracking-[0.01em] md:text-[32px]"
            style={{ ...serif }}
          >
            Op koers, {PROFIEL.naam.split(" ")[0]}. Je kompas wijst naar drie sterke bestemmingen.
          </h1>
          <p
            className="mt-3 max-w-md text-[13.5px] leading-relaxed"
            style={{ color: "rgba(243,234,211,0.82)" }}
          >
            Je certificaten zijn geijkt, de vaargeul ligt open en één peiling vraagt je aandacht om
            verifieerbaar te blijven.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Button onClick={onActies} pal={P.brass} className="!bg-[#b0863f] !text-[#152b40]">
              <LocateFixed size={14} aria-hidden="true" /> Volgende koers
            </Button>
            <button
              type="button"
              onClick={onMarkt}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3ead3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1f30]"
              style={{
                background: "rgba(243,234,211,0.12)",
                color: "#f3ead3",
                border: "1px solid rgba(243,234,211,0.25)",
              }}
            >
              Naar vaargebied <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Volgende-koers-kaart */}
        <Card className="flex flex-col p-6">
          <div className="flex items-center justify-between">
            <Chip pal={P.coral} Icon={AlertTriangle}>
              Koerscorrectie
            </Chip>
            <span
              className="text-[10px] uppercase tracking-[0.14em]"
              style={{ color: C.inkFaint, ...coord }}
            >
              Peiling 023°
            </span>
          </div>
          <h2
            className="mt-3 text-[18px] font-semibold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
            {koers.titel}
          </h2>
          <p className="mt-2 flex-1 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {koers.detail}
          </p>
          <div className="mt-4">
            <Button pal={P.coral} onClick={onActies} className="w-full">
              {koers.cta} <ArrowRight size={14} aria-hidden="true" />
            </Button>
          </div>
          <p
            className="mt-4 flex items-center gap-2 border-t pt-3 text-[12px]"
            style={{ color: C.inkMute, borderColor: C.lineSoft }}
          >
            <ShieldCheck size={13} aria-hidden="true" style={{ color: C.seaText }} />
            {verified}/{CREDENTIALS.length} certificaten geijkt · {ratio}% op orde
          </p>
        </Card>
      </section>

      {/* KPI-instrumenten */}
      <section>
        <SectionHead
          pal={P.navy}
          Icon={TrendingUp}
          sub="Metingen deze maand, afgelezen van je instrumenten"
        >
          Instrumentenpaneel
        </SectionHead>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const pal = [P.navy, P.sea, P.brass, P.coral][i % 4] as Palette;
            return (
              <Card key={k.label} className="p-5">
                <div className="flex items-start justify-between">
                  <p
                    className="text-[11px] font-medium uppercase tracking-[0.08em]"
                    style={{ color: C.inkMute }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold"
                    style={{ color: pal.text, background: pal.soft, ...coord }}
                  >
                    <TrendingUp
                      size={10}
                      aria-hidden="true"
                      style={{ transform: k.up ? "none" : "scaleY(-1)" }}
                    />
                    {k.trend.replace(/^\+/, "")}
                  </span>
                </div>
                <p
                  className="mt-2 text-[25px] font-semibold leading-none"
                  style={{ color: C.ink, ...coord }}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <Sounding data={k.spark} tone={pal.base} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Vaargeul + certificaten */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="flex items-center justify-between">
            <SectionHead pal={P.sea} Icon={Navigation2}>
              Bestemmingen in de vaargeul
            </SectionHead>
            <button
              type="button"
              onClick={onMarkt}
              className="rounded text-[12px] font-medium underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b7a78]"
              style={{ color: C.seaText }}
            >
              Volledig vaargebied →
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <li key={o.id}>
                <OpdrachtRow opdracht={o} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <SectionHead pal={P.sea} Icon={ShieldCheck}>
            Geijkt kompas
          </SectionHead>
          <Card className="p-1.5">
            <ul>
              {CREDENTIALS.map((c, i) => {
                const cm = credMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 px-3 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: cm.pal.soft, color: cm.pal.text }}
                      aria-hidden="true"
                    >
                      <cm.Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13px] font-medium"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="block truncate text-[11px]"
                        style={{ color: cm.alarm ? cm.pal.text : C.inkMute }}
                      >
                        {cm.label}
                      </span>
                    </span>
                    {cm.alarm && (
                      <AlertTriangle size={14} aria-hidden="true" style={{ color: cm.pal.text }} />
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
          <div
            className="mt-4 flex items-center gap-3 rounded-xl p-4"
            style={{ background: C.seaSoft, border: `1px solid ${C.sea}22` }}
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ background: C.sea, color: "#f3ead3" }}
              aria-hidden="true"
            >
              <Anchor size={18} />
            </span>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: C.seaText, ...serif }}>
                Veilige ankerplaats
              </p>
              <p className="text-[11.5px]" style={{ color: C.inkSoft }}>
                Je documenten liggen versleuteld voor anker — alleen jij bepaalt wie aan boord komt.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const strong = opdracht.match >= 90;
  const pal = strong ? P.sea : P.navy;
  return (
    <Card as="article" className="overflow-hidden">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[#f6efdb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#152b40]"
      >
        <BearingDial value={opdracht.match} pal={pal} size={54} />
        <span className="min-w-0 flex-1">
          <span
            className="block truncate text-[15px] font-semibold"
            style={{ color: C.ink, ...serif }}
          >
            {opdracht.titel}
          </span>
          <span
            className="mt-0.5 flex items-center gap-1 truncate text-[12px]"
            style={{ color: C.inkMute }}
          >
            <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </span>
          <span
            className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-medium"
            style={{ color: C.seaText }}
          >
            <Check size={12} aria-hidden="true" /> {opdracht.redenen.plus[0]}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-[13px] font-semibold" style={{ color: C.ink, ...coord }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <ChevronRight size={17} aria-hidden="true" style={{ color: C.inkFaint }} />
        </span>
      </button>
    </Card>
  );
}

// —————————————————————————————————— Marktplaats ——————————————————————————————————
type Mode = "ok" | "loading" | "error";

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [mode, setMode] = useState<Mode>("ok");

  const filtered = useMemo(() => {
    const n = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-5">
      <div>
        <p
          className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em]"
          style={{ color: C.seaText }}
        >
          <Navigation2 size={12} aria-hidden="true" /> Vaargebied
        </p>
        <h1
          className="mt-1 text-[26px] font-semibold leading-tight tracking-[0.01em]"
          style={{ color: C.ink, ...serif }}
        >
          Uitgezette koersen
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: C.inkMute }}>
          {filtered.length} van {OPDRACHTEN.length} bestemmingen liggen binnen bereik van je profiel
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-lg px-4 py-2.5"
          style={{ background: C.card, border: `1px solid ${C.cardEdge}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Peil op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#9aa6ad]"
            style={{ color: C.ink, ...body }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[#eadfc2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#152b40]"
              style={{ color: C.inkMute }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={sort === s ? "solid" : "outline"}
              pal={P.navy}
              onClick={() => setSort(s)}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Beste peiling" : "Hoogste tarief"}
            </Button>
          ))}
        </div>
      </div>

      {mode === "loading" ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Card className="p-5">
                <div className="flex items-center gap-4">
                  <div
                    className="h-14 w-14 shrink-0 animate-pulse rounded-full motion-reduce:animate-none"
                    style={{ background: C.lineSoft }}
                  />
                  <div className="flex-1 space-y-2.5">
                    <div
                      className="h-4 w-2/3 animate-pulse rounded motion-reduce:animate-none"
                      style={{ background: C.lineSoft }}
                    />
                    <div
                      className="h-3 w-1/2 animate-pulse rounded motion-reduce:animate-none"
                      style={{ background: C.lineSoft }}
                    />
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          pal={P.coral}
          Icon={AlertTriangle}
          titel="Geen peiling mogelijk"
          tekst="De kaarten laden even niet. Controleer je verbinding en peil opnieuw."
          cta="Opnieuw peilen"
          onCta={() => setMode("ok")}
        />
      ) : filtered.length === 0 ? (
        <StateBlock
          pal={P.navy}
          Icon={Search}
          titel="Buiten bereik"
          tekst={`Geen bestemming voor ${q ? `“${q}”` : "je peiling"}. Verruim je zoekterm en probeer opnieuw.`}
          cta="Zoekterm wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-center gap-4 pt-1">
        {(["loading", "error"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className="rounded text-[11px] font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#152b40]"
            style={{ color: C.inkFaint }}
          >
            {m === "loading" ? "Laadstaat tonen" : "Foutstaat tonen"}
          </button>
        ))}
      </div>
    </div>
  );
}

function StateBlock({
  pal,
  Icon,
  titel,
  tekst,
  cta,
  onCta,
}: {
  pal: Palette;
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <Card className="flex flex-col items-center px-6 py-14 text-center">
      <span
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: pal.soft, color: pal.text }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-5 text-[19px] font-semibold" style={{ color: C.ink, ...serif }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
        {tekst}
      </p>
      <Button pal={pal} onClick={onCta} className="mt-6">
        {cta} <ArrowRight size={14} aria-hidden="true" />
      </Button>
    </Card>
  );
}

function MarktKaart({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  const pal = strong ? P.sea : P.navy;
  return (
    <Card as="article" className="p-5">
      <div className="flex items-start gap-4">
        <BearingDial value={opdracht.match} pal={pal} size={58} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Chip pal={pal} Icon={strong ? Navigation2 : Compass}>
              {strong ? "Recht op koers" : "Goede koers"}
            </Chip>
            <span className="text-[11px] font-medium" style={{ color: C.inkFaint, ...coord }}>
              № {String(index + 1).padStart(2, "0")} · {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[17px] font-semibold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded px-2 py-0.5 text-[11px] font-medium"
                style={{ background: C.chart, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="shrink-0 text-[15px] font-semibold" style={{ color: C.ink, ...coord }}>
          {opdracht.tarief.replace(" / uur", "")}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#152b40]"
          style={{ color: C.navyText, background: C.navySoft }}
        >
          {open ? <X size={13} aria-hidden="true" /> : <Compass size={13} aria-hidden="true" />}
          Peiling verklaren
        </button>
        <div className="ml-auto">
          <Button pal={pal} onClick={onOpen}>
            Koers zetten <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="In je voordeel"
              pal={P.sea}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Let op de stroming"
              pal={P.brass}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function RedenBlok({
  titel,
  pal,
  Icon,
  items,
}: {
  titel: string;
  pal: Palette;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div className="rounded-lg p-4" style={{ background: pal.soft }}>
      <p
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: pal.text }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.inkSoft }}>
            <span
              className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: pal.base }}
              aria-hidden="true"
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————— Opdracht-detail ——————————————————————————————————
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const pal = strong ? P.sea : P.navy;
  return (
    <div className="space-y-5">
      <Button variant="outline" size="sm" onClick={onBack}>
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar vaargebied
      </Button>

      <div
        className="relative overflow-hidden rounded-2xl p-7 md:p-8"
        style={{
          background: `linear-gradient(135deg, ${C.navyDeep} 0%, ${C.navy} 100%)`,
          color: "#f3ead3",
        }}
      >
        <CompassRose
          size={220}
          stroke="#f3ead3"
          opacity={0.15}
          className="pointer-events-none absolute -bottom-14 -right-10"
        />
        <div className="relative flex flex-wrap items-center gap-2">
          <span
            className="rounded px-2 py-0.5 text-[11px] font-medium"
            style={{ background: "rgba(243,234,211,0.14)", ...coord }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium"
            style={{ background: "rgba(243,234,211,0.14)" }}
          >
            <Navigation2 size={12} aria-hidden="true" /> Peiling {opdracht.match}°
          </span>
        </div>
        <h1
          className="relative mt-4 max-w-2xl text-[26px] font-semibold leading-[1.14] tracking-[0.01em] md:text-[32px]"
          style={{ ...serif }}
        >
          {opdracht.titel}
        </h1>
        <p
          className="relative mt-2 flex items-center gap-1.5 text-[13.5px]"
          style={{ color: "rgba(243,234,211,0.85)" }}
        >
          <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="relative mt-6 flex flex-wrap gap-2.5">
          <Button pal={P.brass} className="!bg-[#b0863f] !text-[#152b40]">
            <Flag size={14} aria-hidden="true" /> Koers zetten
          </Button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3ead3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1f30]"
            style={{
              background: "rgba(243,234,211,0.12)",
              color: "#f3ead3",
              border: "1px solid rgba(243,234,211,0.25)",
            }}
          >
            <Anchor size={14} aria-hidden="true" /> Bewaren op kaart
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, p: P.sea, Icon: Wallet },
          { l: "Omvang", v: opdracht.uren, p: P.navy, Icon: Clock },
          { l: "Vertrek", v: opdracht.start, p: P.brass, Icon: Flag },
          { l: "Peiling", v: `${opdracht.match}%`, p: P.sea, Icon: Navigation2 },
        ].map((m) => (
          <Card key={m.l} className="p-5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: m.p.soft, color: m.p.text }}
              aria-hidden="true"
            >
              <m.Icon size={16} />
            </span>
            <p
              className="mt-3 text-[10px] font-medium uppercase tracking-[0.1em]"
              style={{ color: C.inkMute }}
            >
              {m.l}
            </p>
            <p className="mt-1 text-[18px] font-semibold" style={{ color: C.ink, ...coord }}>
              {m.v}
            </p>
          </Card>
        ))}
      </div>

      <section>
        <SectionHead
          pal={P.brass}
          Icon={Compass}
          sub="Afgezet tegen je geverifieerde profiel — open en zonder verborgen score."
        >
          Waarom deze peiling klopt
        </SectionHead>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-6">
            <p
              className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.seaText }}
            >
              <Check size={14} aria-hidden="true" /> In je voordeel
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.sea, color: "#f3ead3" }}
                    aria-hidden="true"
                  >
                    <Check size={12} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-6">
            <p
              className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.brassText }}
            >
              <AlertTriangle size={14} aria-hidden="true" /> Let op de stroming
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.brass, color: "#f3ead3" }}
                    aria-hidden="true"
                  >
                    <AlertTriangle size={12} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div
          className="mt-4 flex items-center gap-3 rounded-xl p-4"
          style={{ background: pal.soft, border: `1px solid ${pal.base}22` }}
        >
          <Navigation2 size={17} aria-hidden="true" style={{ color: pal.text }} />
          <p className="text-[12.5px] font-medium" style={{ color: pal.text }}>
            Peiling {opdracht.match}% —{" "}
            {strong ? "recht op je bestemming af." : "een koers die goed aansluit op je vaart."}
          </p>
        </div>
      </section>
    </div>
  );
}

// —————————————————————————————————— Verificatie ——————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <div
        className="relative overflow-hidden rounded-2xl p-7 md:p-8"
        style={{
          background: `linear-gradient(135deg, ${C.seaDeep} 0%, ${C.sea} 100%)`,
          color: "#f0f7f5",
        }}
      >
        <CompassRose
          size={210}
          stroke="#f0f7f5"
          opacity={0.16}
          className="pointer-events-none absolute -bottom-14 right-6"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <p
              className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em]"
              style={{ color: "rgba(240,247,245,0.85)" }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> Kompas geijkt
            </p>
            <h1
              className="mt-2 text-[24px] font-semibold leading-tight tracking-[0.01em]"
              style={{ ...serif }}
            >
              {PROFIEL.trust}
            </h1>
            <p
              className="mt-2 text-[14px] leading-relaxed"
              style={{ color: "rgba(240,247,245,0.9)" }}
            >
              {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort — op tijd geijkt, dan blijf je op koers. Je documenten blijven privé.
            </p>
          </div>
          <span
            className="flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: "rgba(240,247,245,0.18)" }}
            aria-hidden="true"
          >
            <span className="text-[30px] font-semibold leading-none" style={{ ...coord }}>
              {ratio}
            </span>
            <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.14em]">
              % geijkt
            </span>
          </span>
        </div>
        <div
          className="relative mt-5 h-2 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(240,247,245,0.25)" }}
          aria-hidden="true"
        >
          <span
            className="block h-full rounded-full"
            style={{
              width: `${ratio}%`,
              background: "#f0f7f5",
              transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        </div>
      </div>

      <div>
        <SectionHead pal={P.sea} Icon={ShieldCheck}>
          Certificaten aan boord
        </SectionHead>
        <Card className="overflow-hidden">
          <ul>
            {CREDENTIALS.map((c, i) => {
              const cm = credMeta(c.status);
              const isOpen = open === c.naam;
              return (
                <li
                  key={c.naam}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f6efdb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2b7a78]"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: cm.pal.soft, color: cm.pal.text }}
                      aria-hidden="true"
                    >
                      <cm.Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14.5px] font-semibold"
                        style={{ color: C.ink, ...serif }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12px]"
                        style={{ color: C.inkMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="hidden sm:inline-flex">
                        <Chip pal={cm.pal} Icon={cm.Icon}>
                          {cm.label}
                          {cm.alarm && <span className="sr-only"> (let op)</span>}
                        </Chip>
                      </span>
                      <ChevronRight
                        size={18}
                        aria-hidden="true"
                        className="transition-transform motion-reduce:transition-none"
                        style={{ color: C.inkFaint, transform: isOpen ? "rotate(90deg)" : "none" }}
                      />
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-300 motion-reduce:transition-none"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-4 sm:pl-[76px]">
                        <div
                          className="rounded-lg p-4"
                          style={{ background: C.chart, border: `1px solid ${C.line}` }}
                        >
                          <p
                            className="max-w-xl text-[13px] leading-relaxed"
                            style={{ color: C.inkSoft }}
                          >
                            {c.detail}. Je document wordt versleuteld bewaard en alleen na jouw
                            toestemming gedeeld met een opdrachtgever.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              pal={
                                c.status === "EXPIRING"
                                  ? P.brass
                                  : c.status === "REJECTED"
                                    ? P.coral
                                    : P.sea
                              }
                            >
                              {c.status === "EXPIRING"
                                ? "Vernieuwen"
                                : c.status === "REJECTED"
                                  ? "Opnieuw indienen"
                                  : "Bekijken"}
                            </Button>
                            <Button size="sm" variant="outline">
                              Logboek
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div>
        <SectionHead pal={P.navy} Icon={FileText}>
          Kaartenkast
        </SectionHead>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const cm = credMeta(d.status);
            return (
              <Card key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: C.chart, color: C.inkSoft }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium" style={{ color: C.ink }}>
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...coord }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <Chip pal={cm.pal} Icon={cm.Icon}>
                  {cm.label}
                </Chip>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// —————————————————————————————————— Acties ——————————————————————————————————
function Acties({ onMarkt }: { onMarkt: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <p
          className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em]"
          style={{ color: C.coralText }}
        >
          <LocateFixed size={12} aria-hidden="true" /> Koersplan
        </p>
        <h1
          className="mt-1 text-[26px] font-semibold leading-tight tracking-[0.01em]"
          style={{ color: C.ink, ...serif }}
        >
          Volgende koersen, op peiling gezet
        </h1>
        <p className="mt-1 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Van boven naar beneden afhandelen — één peiling per keer houdt je op koers.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const pal = warn ? P.coral : P.navy;
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel}>
              <Card className="p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-[15px] font-semibold"
                    style={{ background: pal.soft, color: pal.text, ...coord }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <Chip pal={pal} Icon={warn ? AlertTriangle : Flag}>
                      {warn ? "Koerscorrectie" : "Aanbevolen koers"}
                    </Chip>
                    <h2
                      className="mt-2 text-[17px] font-semibold leading-snug"
                      style={{ color: C.ink, ...serif }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <Button pal={pal} onClick={goMarkt ? onMarkt : undefined}>
                      {a.cta} <ArrowRight size={14} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      <div
        className="flex items-center gap-3 rounded-xl p-5"
        style={{ background: C.seaSoft, border: `1px solid ${C.sea}22` }}
      >
        <span
          className="flex h-11 w-11 items-center justify-center rounded-lg"
          style={{ background: C.sea, color: "#f3ead3" }}
          aria-hidden="true"
        >
          <Anchor size={20} />
        </span>
        <div>
          <p className="text-[14px] font-semibold" style={{ color: C.seaText, ...serif }}>
            Nog {ACTIES.length} peilingen tot je weer helemaal op koers ligt.
          </p>
          <p className="text-[12px]" style={{ color: C.inkSoft }}>
            Elke afgehandelde koers maakt je profiel sterker en beter zichtbaar in de vaargeul.
          </p>
        </div>
      </div>
    </div>
  );
}

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurPalette(status: string): Palette {
  if (status === "Betaald") return P.sea;
  if (status === "Openstaand") return P.coral;
  return P.navy;
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
          <p
            className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em]"
            style={{ color: C.brassText }}
          >
            <Wallet size={12} aria-hidden="true" /> Scheepskas
          </p>
          <h1
            className="mt-1 text-[26px] font-semibold leading-tight tracking-[0.01em]"
            style={{ color: C.ink, ...serif }}
          >
            Facturen & vrachtbrieven
          </h1>
        </div>
        <Button pal={P.navy}>
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </Button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", p: P.sea, Icon: Check },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", p: P.coral, Icon: Clock },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", p: P.navy, Icon: FileText },
        ].map((s) => (
          <Card key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: s.p.soft, color: s.p.text }}
                aria-hidden="true"
              >
                <s.Icon size={16} />
              </span>
              <Chip pal={s.p}>{s.l}</Chip>
            </div>
            <p className="mt-3 text-[23px] font-semibold" style={{ color: C.ink, ...coord }}>
              {s.v}
            </p>
            <p className="mt-0.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Card>
        ))}
      </section>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={sort === s ? "solid" : "outline"}
            pal={P.navy}
            onClick={() => setSort(s)}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div
          className="hidden grid-cols-[1.6fr_1fr_1fr_auto] gap-4 border-b px-5 py-3 text-[11px] font-medium uppercase tracking-[0.08em] sm:grid"
          style={{ color: C.inkMute, borderColor: C.lineSoft }}
        >
          <span>Klant · nummer</span>
          <span>Datum</span>
          <span className="text-right">Bedrag</span>
          <span className="text-right">Status</span>
        </div>
        <ul>
          {rows.map((f, i) => {
            const pal = factuurPalette(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 sm:grid-cols-[1.6fr_1fr_1fr_auto] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span className="min-w-0">
                  <span
                    className="block truncate text-[13.5px] font-medium"
                    style={{ color: C.ink }}
                  >
                    {f.klant}
                  </span>
                  <span className="block text-[11px]" style={{ color: C.inkMute, ...coord }}>
                    {f.nr}
                  </span>
                </span>
                <span
                  className="hidden text-[12.5px] sm:block"
                  style={{ color: C.inkSoft, ...coord }}
                >
                  {f.datum}
                </span>
                <span
                  className="hidden text-right text-[14px] font-semibold sm:block"
                  style={{ color: C.ink, ...coord }}
                >
                  {f.bedrag}
                </span>
                <span className="flex items-center justify-end gap-3">
                  <span
                    className="text-[14px] font-semibold sm:hidden"
                    style={{ color: C.ink, ...coord }}
                  >
                    {f.bedrag}
                  </span>
                  <Chip pal={pal}>{f.status}</Chip>
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
