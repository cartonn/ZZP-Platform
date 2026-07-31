"use client";

// Concept 533 — "Viltstift" · Tactiele rebellie / zichtbaar handwerk. Viltstift- en marker-textuur,
// licht "wobbly" outlines (subtiel geroteerde randen), warme papier-achtergrond, markerstreep-
// highlights en imperfecte maar gedisciplineerde compositie. Menselijk en warm, blijft strak
// leesbaar. Status altijd met label + icoon.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  ChevronRight,
  CircleCheck,
  Clock,
  FileText,
  Highlighter,
  Hourglass,
  MapPin,
  Minus,
  PenLine,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  TriangleAlert,
  X,
  XCircle,
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

// ————————————————————————————— Palet — warm papier + viltstift-inkten —————————————————————————————
const C = {
  bg: "#f7f1e4", // warm papier
  paper: "#fdf9ef",
  paperHi: "#fffdf7",
  sink: "#efe7d6",
  line: "#ddd0b8",
  lineInk: "#2a2620", // inkt-outline (bijna zwart, warm)
  ink: "#2a2620",
  inkSoft: "#514a3d",
  inkMute: "#847a66",
  inkFaint: "#a89c82",
  // viltstift-kleuren
  marker: "#2f6d8f", // blauwe stift (primair)
  markerSoft: "#cfe4ee",
  coral: "#e0552f", // koraal-oranje
  coralSoft: "#fbe0d3",
  grape: "#7a4b96", // paars
  grapeSoft: "#ebddf1",
  lime: "#5c8a2f", // groen
  limeSoft: "#e0edcd",
  gold: "#c98a1f", // oker/geel-markeer
  goldSoft: "#f7e9c6",
  highlight: "#fbe89a", // markerstreep-geel
};

const hand: CSSProperties = {
  fontFamily:
    "'Comic Sans MS', 'Chalkboard SE', 'Segoe Print', 'Bradley Hand', 'Inter', system-ui, sans-serif",
};
const sans: CSSProperties = {
  fontFamily: "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
};
const mono: CSSProperties = {
  fontFamily: "'SF Mono', 'JetBrains Mono', ui-monospace, 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: "'tnum' 1",
};

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6d8f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f1e4]";

// Hand-getekende dubbele-inkt schaduw (geeft de "geschetst" outline)
function inkShadow(color = C.lineInk): string {
  return `2px 2px 0 ${color}`;
}

// ————————————————————————————— Status-taal (label + icoon) —————————————————————————————
type Tone = { fg: string; bg: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { fg: C.lime, bg: C.limeSoft, label: "Geverifieerd", Icon: CircleCheck, alarm: false };
    case "SUBMITTED":
      return {
        fg: C.marker,
        bg: C.markerSoft,
        label: "In beoordeling",
        Icon: Hourglass,
        alarm: false,
      };
    case "EXPIRING":
      return {
        fg: C.gold,
        bg: C.goldSoft,
        label: "Verloopt bijna",
        Icon: TriangleAlert,
        alarm: true,
      };
    case "REJECTED":
      return { fg: C.coral, bg: C.coralSoft, label: "Afgekeurd", Icon: XCircle, alarm: true };
  }
}

function factuurTone(status: string): Tone {
  if (status === "Betaald")
    return { fg: C.lime, bg: C.limeSoft, label: "Betaald", Icon: Check, alarm: false };
  if (status === "Openstaand")
    return { fg: C.gold, bg: C.goldSoft, label: "Openstaand", Icon: Clock, alarm: false };
  return { fg: C.marker, bg: C.markerSoft, label: "Concept", Icon: FileText, alarm: false };
}

function parseEUR(s: string): number {
  const d = s.replace(/[^\d]/g, "");
  return d ? parseInt(d, 10) : 0;
}
const eur0 = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

// —————————————————————————————————————— Primitives ——————————————————————————————————————
// Kaart met licht geroteerde, geschetste outline
function Sketch({
  children,
  className = "",
  as: Tag = "div",
  tilt = 0,
  tone = C.lineInk,
  tint,
  lift = true,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  tilt?: number;
  tone?: string;
  tint?: string;
  lift?: boolean;
}) {
  return (
    <Tag
      className={`relative ${className}`}
      style={{
        background: tint ?? C.paper,
        border: `2px solid ${tone}`,
        borderRadius: "14px 12px 15px 11px",
        boxShadow: lift ? inkShadow(tone) : "none",
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
      }}
    >
      {children}
    </Tag>
  );
}

// Markerstreep-highlight achter tekst
function Mark({ children, color = C.highlight }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="relative inline"
      style={{
        backgroundImage: `linear-gradient(120deg, ${color} 0%, ${color} 100%)`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 60%",
        backgroundPosition: "0 85%",
        padding: "0 2px",
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
      }}
    >
      {children}
    </span>
  );
}

function Btn({
  children,
  onClick,
  variant = "solid",
  size = "md",
  className = "",
  tone = C.marker,
  ariaLabel,
  ariaExpanded,
  full = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md";
  className?: string;
  tone?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  full?: boolean;
}) {
  const pad = size === "sm" ? "px-3.5 py-2 text-[12.5px]" : "px-5 py-2.5 text-[13.5px]";
  const base = `vs-btn inline-flex items-center justify-center gap-2 font-bold transition-all duration-150 ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? {
          background: tone,
          color: C.paperHi,
          border: `2px solid ${C.lineInk}`,
          borderRadius: "11px 9px 12px 10px",
          boxShadow: inkShadow(),
        }
      : variant === "outline"
        ? {
            background: C.paper,
            color: C.ink,
            border: `2px solid ${C.lineInk}`,
            borderRadius: "11px 9px 12px 10px",
            boxShadow: inkShadow(),
          }
        : {
            background: "transparent",
            color: C.inkSoft,
            border: "2px solid transparent",
            borderRadius: 10,
          };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`${base} ${pad} ${className}`}
      style={{ ...sans, ...style }}
    >
      {children}
    </button>
  );
}

function StatusChip({ fg, bg, label, Icon, alarm, size = "md" }: Tone & { size?: "sm" | "md" }) {
  const pad = size === "sm" ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-[11.5px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold ${pad}`}
      style={{
        color: fg,
        background: bg,
        border: `1.5px solid ${fg}`,
        borderRadius: "9px 7px 10px 8px",
        ...sans,
      }}
    >
      <Icon size={size === "sm" ? 12 : 13} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (actie vereist)</span>}
    </span>
  );
}

// Match als geschetste badge
function MatchBadge({
  value,
  tone = C.marker,
  size = 56,
}: {
  value: number;
  tone?: string;
  size?: number;
}) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
        background: `${tone}18`,
        border: `2px solid ${tone}`,
        borderRadius: "48% 52% 50% 50% / 52% 48% 52% 48%",
        boxShadow: inkShadow(tone),
      }}
      aria-label={`Match ${value} procent`}
    >
      <span className="text-center leading-none">
        <span className="block text-[16px] font-black" style={{ color: tone, ...mono }}>
          {value}
        </span>
        <span
          className="block text-[7px] font-bold uppercase tracking-[0.08em]"
          style={{ color: tone }}
          aria-hidden="true"
        >
          match
        </span>
      </span>
    </span>
  );
}

function Eyebrow({ children, tone = C.inkMute }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.1em]"
      style={{ color: tone, ...sans }}
    >
      {children}
    </span>
  );
}

function Spark({ data, tone = C.coral }: { data: number[]; tone?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data
    .map((d, j) => {
      const x = (j / (data.length - 1)) * 60;
      const y = 20 - ((d - min) / (max - min || 1)) * 18;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={60} height={22} viewBox="0 0 60 22" aria-hidden="true" className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={tone}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScreenHead({
  eyebrow,
  title,
  sub,
  right,
  tone = C.marker,
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: string;
  right?: ReactNode;
  tone?: string;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <Eyebrow tone={tone}>
          <PenLine size={14} aria-hidden="true" /> {eyebrow}
        </Eyebrow>
        <h1
          className="mt-2 text-[30px] font-black leading-[1.02] md:text-[38px]"
          style={{ color: C.ink, ...hand }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed" style={{ color: C.inkMute }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

const NAV_TILT: Record<ScreenKey, number> = {
  dashboard: -1.2,
  marktplaats: 0.8,
  opdracht: -0.6,
  verificatie: 1,
  acties: -0.9,
  facturen: 0.6,
  documenten: -0.5,
  berichten: 0.7,
};

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept533() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[760px] w-full antialiased"
      style={{
        ...sans,
        color: C.ink,
        background: C.bg,
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(42,38,32,0.05) 1px, transparent 0)",
        backgroundSize: "22px 22px",
      }}
    >
      <div className="mx-auto flex max-w-6xl">
        <Sidebar screen={screen} setScreen={setScreen} />
        <div className="min-w-0 flex-1">
          <TopBar />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="vs-enter px-4 pb-24 pt-6 sm:px-6 md:px-8">
            {screen === "dashboard" && (
              <Dashboard
                onOpen={() => setScreen("opdracht")}
                onMarkt={() => setScreen("marktplaats")}
                onActies={() => setScreen("acties")}
                onVerif={() => setScreen("verificatie")}
              />
            )}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && (
              <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
            )}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && (
              <Acties
                onMarkt={() => setScreen("marktplaats")}
                onFacturen={() => setScreen("facturen")}
              />
            )}
            {screen === "facturen" && <Facturen />}
          </main>
        </div>
      </div>

      <style>{`
        @keyframes vsEnter { from { opacity: 0; transform: translateY(8px) rotate(-0.3deg); } to { opacity: 1; transform: none; } }
        .vs-enter { animation: vsEnter 0.34s cubic-bezier(0.22,1,0.36,1) both; }
        .vs-btn { box-shadow: ${inkShadow()}; }
        .vs-btn:active { transform: translate(2px, 2px); box-shadow: 0 0 0 ${C.lineInk} !important; }
        .vs-btn:hover { filter: brightness(1.04); }
        .vs-pop { transition: transform 0.18s ease; }
        .vs-pop:hover { transform: translateY(-3px) rotate(-0.4deg); }
        .vs-row { transition: background 0.16s ease; }
        .vs-row:hover { background: ${C.sink}; }
        @media (prefers-reduced-motion: reduce) {
          .vs-enter, .vs-pop, .vs-row { animation: none !important; transition: none !important; transform: none !important; }
          .vs-btn:active { transform: none; }
        }
      `}</style>
    </div>
  );
}

// —————————————————————————————————————— Sidebar ——————————————————————————————————————
function Sidebar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <aside
      className="sticky top-0 hidden h-screen w-[244px] shrink-0 flex-col md:flex"
      style={{ background: C.paper, borderRight: `2px solid ${C.lineInk}` }}
    >
      <div className="flex items-center gap-3 px-5 py-6">
        <span
          className="flex h-11 w-11 items-center justify-center"
          style={{
            background: C.coral,
            color: C.paperHi,
            border: `2px solid ${C.lineInk}`,
            borderRadius: "48% 52% 50% 50% / 52% 48% 52% 48%",
            boxShadow: inkShadow(),
          }}
          aria-hidden="true"
        >
          <Highlighter size={19} />
        </span>
        <span>
          <span
            className="block text-[18px] font-black leading-none"
            style={{ color: C.ink, ...hand }}
          >
            Viltstift
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.coral }}
          >
            ZZP · werkschrift
          </span>
        </span>
      </div>

      <nav aria-label="Hoofdmenu" className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1.5">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[14px] font-bold ${RING}`}
                  style={{
                    background: on ? C.markerSoft : "transparent",
                    color: on ? C.ink : C.inkSoft,
                    border: on ? `2px solid ${C.lineInk}` : "2px solid transparent",
                    borderRadius: "10px 8px 11px 9px",
                    boxShadow: on ? inkShadow() : "none",
                    transform: on ? `rotate(${NAV_TILT[s.key]}deg)` : undefined,
                  }}
                >
                  <span className="flex-1">{s.label}</span>
                  {on && <ChevronRight size={16} aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-4">
        <Sketch className="p-4" tilt={-1} tone={C.lime} tint={C.limeSoft}>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: C.lime }}>
            Profiel compleet
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[30px] font-black leading-none" style={{ color: C.ink, ...hand }}>
              {ratio}%
            </span>
          </div>
          <div
            className="mt-2.5 h-3 w-full overflow-hidden"
            style={{ background: C.paper, border: `2px solid ${C.lineInk}`, borderRadius: 99 }}
          >
            <span className="block h-full" style={{ width: `${ratio}%`, background: C.lime }} />
          </div>
          <p className="mt-2 text-[11px]" style={{ color: C.inkSoft }}>
            {verified}/{CREDENTIALS.length} certificaten
          </p>
        </Sketch>
        <div className="mt-3 flex items-center gap-3 px-1">
          <span
            className="flex h-10 w-10 items-center justify-center text-[13px] font-black"
            style={{
              background: C.grapeSoft,
              color: C.grape,
              border: `2px solid ${C.lineInk}`,
              borderRadius: "48% 52% 50% 50% / 52% 48% 52% 48%",
              ...mono,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-black" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </span>
            <span
              className="flex items-center gap-1 text-[11px] font-bold"
              style={{ color: C.lime }}
            >
              <ShieldCheck size={11} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (a, f) => a + parseEUR(f.bedrag),
    0,
  );
  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3.5 sm:px-6 md:px-8"
      style={{
        background: `${C.bg}ec`,
        borderBottom: `2px solid ${C.lineInk}`,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="flex flex-1 items-center gap-2.5 px-4 py-2.5"
        style={{
          background: C.paper,
          border: `2px solid ${C.lineInk}`,
          borderRadius: "11px 9px 12px 10px",
          boxShadow: inkShadow(),
        }}
      >
        <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
        <span className="text-[13px]" style={{ color: C.inkFaint }}>
          Zoek opdrachten, certificaten of facturen…
        </span>
      </div>
      <span
        className="hidden items-center gap-2 px-3.5 py-2.5 text-[13px] font-bold sm:inline-flex"
        style={{
          background: C.goldSoft,
          color: C.gold,
          border: `2px solid ${C.lineInk}`,
          borderRadius: "11px 9px 12px 10px",
          boxShadow: inkShadow(),
        }}
      >
        <Clock size={15} aria-hidden="true" />
        <span style={{ ...mono }}>{eur0.format(open)}</span> open
      </span>
    </header>
  );
}

function MobileNav({
  screen,
  setScreen,
}: {
  screen: ScreenKey;
  setScreen: (s: ScreenKey) => void;
}) {
  return (
    <nav
      aria-label="Schermen"
      className="flex gap-2 overflow-x-auto px-4 py-3 md:hidden"
      style={{ borderBottom: `2px solid ${C.lineInk}`, background: C.paper }}
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`shrink-0 px-3.5 py-2 text-[13px] font-bold ${RING}`}
            style={{
              background: on ? C.marker : C.paper,
              color: on ? C.paperHi : C.inkSoft,
              border: `2px solid ${C.lineInk}`,
              borderRadius: "10px 8px 11px 9px",
            }}
          >
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

// —————————————————————————————————————— Dashboard ——————————————————————————————————————
function Dashboard({
  onOpen,
  onMarkt,
  onActies,
  onVerif,
}: {
  onOpen: () => void;
  onMarkt: () => void;
  onActies: () => void;
  onVerif: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  const sparkTones = [C.coral, C.marker, C.lime, C.gold];
  return (
    <div className="space-y-8">
      <ScreenHead
        eyebrow={`Hoi ${PROFIEL.naam.split(" ")[0]}!`}
        title={
          <>
            Je dag in <Mark color={C.highlight}>het kort</Mark>
          </>
        }
        sub="Alles wat telt, met de hand aangestreept. Drie dingen hieronder vragen vandaag je aandacht."
        right={
          <div className="flex flex-wrap gap-2">
            <Btn variant="outline" size="sm" onClick={onVerif}>
              <ShieldCheck size={15} aria-hidden="true" /> Certificaten
            </Btn>
            <Btn variant="solid" size="sm" tone={C.coral} onClick={onActies}>
              Acties <ArrowRight size={15} aria-hidden="true" />
            </Btn>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {KPIS.map((k, i) => {
          const tilt = [-1, 0.8, -0.6, 1][i] ?? 0;
          const tone = sparkTones[i] ?? C.marker;
          return (
            <Sketch key={k.label} className="vs-pop p-5" tilt={tilt}>
              <p className="text-[12px] font-bold" style={{ color: C.inkMute }}>
                {k.label}
              </p>
              <p
                className="mt-2 text-[30px] font-black leading-none"
                style={{ color: C.ink, ...hand }}
              >
                {k.value}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-1 text-[12px] font-bold"
                  style={{ color: k.up ? C.lime : C.gold }}
                >
                  {k.up ? (
                    <ArrowRight size={12} aria-hidden="true" className="-rotate-45" />
                  ) : (
                    <Minus size={12} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
                <Spark data={k.spark} tone={tone} />
              </div>
            </Sketch>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Sketch className="overflow-hidden" tilt={-0.3}>
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: `2px dashed ${C.line}` }}
          >
            <Eyebrow tone={C.marker}>
              <Star size={15} aria-hidden="true" /> Beste matches
            </Eyebrow>
            <button
              type="button"
              onClick={onMarkt}
              className={`inline-flex items-center gap-1 text-[13px] font-bold ${RING}`}
              style={{ color: C.coral }}
            >
              Alles <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => {
              const tone = o.match >= 90 ? C.lime : C.marker;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className={`vs-row flex w-full items-center gap-4 px-6 py-4 text-left ${RING}`}
                    style={{ borderTop: i === 0 ? "none" : `2px dashed ${C.line}` }}
                  >
                    <MatchBadge value={o.match} tone={tone} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[15px] font-black"
                        style={{ color: C.ink }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 flex items-center gap-1 truncate text-[12.5px]"
                        style={{ color: C.inkMute }}
                      >
                        <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </span>
                    </span>
                    <span className="hidden shrink-0 text-right sm:block">
                      <span
                        className="block text-[15px] font-black"
                        style={{ color: C.ink, ...mono }}
                      >
                        {o.tarief.replace(" / uur", "")}
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase"
                        style={{ color: C.inkFaint }}
                      >
                        p/uur
                      </span>
                    </span>
                    <ChevronRight size={18} aria-hidden="true" style={{ color: C.inkFaint }} />
                  </button>
                </li>
              );
            })}
          </ul>
        </Sketch>

        <div className="space-y-6">
          <Sketch className="p-6" tilt={0.6} tone={C.grape} tint={C.grapeSoft}>
            <Eyebrow tone={C.grape}>
              <ShieldCheck size={15} aria-hidden="true" /> Vertrouwen
            </Eyebrow>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className="text-[44px] font-black leading-none"
                style={{ color: C.grape, ...hand }}
              >
                {ratio}%
              </span>
              <span className="text-[13px]" style={{ color: C.inkSoft }}>
                geverifieerd
              </span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {CREDENTIALS.map((c) => {
                const t = credTone(c.status);
                return (
                  <li key={c.naam} className="flex items-center gap-2">
                    <t.Icon size={14} aria-hidden="true" style={{ color: t.fg }} />
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px] font-bold"
                      style={{ color: C.inkSoft }}
                    >
                      {c.naam}
                    </span>
                  </li>
                );
              })}
            </ul>
            <Btn variant="outline" size="sm" full className="mt-4" onClick={onVerif}>
              Bekijk certificaten
            </Btn>
          </Sketch>

          <Sketch className="p-6" tilt={-0.7} tone={C.coral} tint={C.coralSoft}>
            <Eyebrow tone={C.coral}>
              <TriangleAlert size={15} aria-hidden="true" /> Vraagt aandacht
            </Eyebrow>
            <h3 className="mt-2 text-[18px] font-black leading-snug" style={{ color: C.ink }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="md" full tone={C.coral} className="mt-4" onClick={onActies}>
              {primair.cta} <ArrowRight size={15} aria-hidden="true" />
            </Btn>
          </Sketch>
        </div>
      </section>
    </div>
  );
}

// —————————————————————————————————————— Marktplaats ——————————————————————————————————————
type Mode = "ok" | "loading" | "error";

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [mode, setMode] = useState<Mode>("ok");

  const rows = useMemo(() => {
    const n = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    );
    return [...list].sort((a, b) =>
      sort === "match" ? b.match - a.match : parseEUR(b.tarief) - parseEUR(a.tarief),
    );
  }, [q, sort]);

  return (
    <div className="space-y-6">
      <ScreenHead
        eyebrow="Marktplaats"
        title="Opdrachten voor jou"
        sub={`${rows.length} van ${OPDRACHTEN.length} opdrachten passen bij je profiel.`}
      />

      <Sketch className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center" tilt={-0.3}>
        <div
          className="flex flex-1 items-center gap-2.5 px-3.5 py-2.5"
          style={{
            background: C.sink,
            border: `2px solid ${C.line}`,
            borderRadius: "10px 8px 11px 9px",
          }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten filteren"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#a89c82]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Filter wissen"
              className={`flex h-5 w-5 items-center justify-center ${RING}`}
              style={{ color: C.inkMute }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <Btn
              key={s}
              size="sm"
              variant={sort === s ? "solid" : "outline"}
              onClick={() => setSort(s)}
            >
              {s === "match" ? "Match" : "Tarief"}
            </Btn>
          ))}
        </div>
      </Sketch>

      {mode === "loading" ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Sketch className="space-y-3 p-6" tilt={i % 2 ? 0.4 : -0.4}>
                <div
                  className="h-5 w-2/3 animate-pulse motion-reduce:animate-none"
                  style={{ background: C.sink, borderRadius: 8 }}
                />
                <div
                  className="h-4 w-1/2 animate-pulse motion-reduce:animate-none"
                  style={{ background: C.sink, borderRadius: 8 }}
                />
              </Sketch>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={TriangleAlert}
          tone={C.coral}
          titel="Er ging iets mis"
          tekst="De opdrachten konden niet geladen worden. Probeer het opnieuw."
          cta="Opnieuw"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.marker}
          titel="Niets gevonden"
          tekst={`Geen resultaat voor ${q ? `“${q}”` : "je filter"}. Verruim je zoekopdracht.`}
          cta="Filter wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-5">
          {rows.map((o, i) => (
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
            className={`text-[10px] font-bold uppercase tracking-[0.12em] underline-offset-4 hover:underline ${RING}`}
            style={{ color: C.inkFaint }}
          >
            {m === "loading" ? "laadstaat" : "foutstaat"}
          </button>
        ))}
      </div>
    </div>
  );
}

function StateBlock({
  Icon,
  titel,
  tekst,
  cta,
  onCta,
  tone,
}: {
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
  tone: string;
}) {
  return (
    <Sketch className="flex flex-col items-center px-6 py-16 text-center" tilt={-0.4} tone={tone}>
      <span
        className="flex h-16 w-16 items-center justify-center"
        style={{
          color: tone,
          background: `${tone}18`,
          border: `2px solid ${tone}`,
          borderRadius: "48% 52% 50% 50% / 52% 48% 52% 48%",
        }}
        aria-hidden="true"
      >
        <Icon size={30} />
      </span>
      <p className="mt-5 text-[24px] font-black" style={{ color: C.ink, ...hand }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed" style={{ color: C.inkMute }}>
        {tekst}
      </p>
      <Btn variant="solid" tone={tone} className="mt-6" onClick={onCta}>
        {cta}
      </Btn>
    </Sketch>
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
  const tone = strong ? C.lime : C.marker;
  const tilt = index % 2 === 0 ? -0.4 : 0.4;
  return (
    <Sketch as="article" className="vs-pop overflow-hidden" tilt={tilt}>
      <div className="flex items-start gap-4 p-5 sm:p-6">
        <span className="shrink-0 text-center">
          <MatchBadge value={opdracht.match} tone={tone} size={62} />
          <span
            className="mt-2 block px-2 py-0.5 text-[10px] font-black uppercase"
            style={{
              color: tone,
              background: strong ? C.limeSoft : C.markerSoft,
              border: `1.5px solid ${tone}`,
              borderRadius: 8,
            }}
          >
            {strong ? "top!" : "goed"}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-bold" style={{ color: C.inkFaint, ...mono }}>
            {opdracht.id}
          </span>
          <h3 className="mt-1 text-[19px] font-black leading-snug" style={{ color: C.ink }}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[13px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {opdracht.tags.map((t, ti) => (
              <span
                key={t}
                className="px-2.5 py-0.5 text-[11.5px] font-bold"
                style={{
                  background: [C.goldSoft, C.markerSoft, C.grapeSoft][ti % 3],
                  color: C.inkSoft,
                  border: `1.5px solid ${C.line}`,
                  borderRadius: "8px 6px 9px 7px",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[18px] font-black" style={{ color: C.ink, ...mono }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span className="text-[10px] font-bold uppercase" style={{ color: C.inkFaint }}>
            per uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-2 px-5 py-3 sm:px-6"
        style={{ borderTop: `2px dashed ${C.line}`, background: C.sink }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 text-[12.5px] font-bold ${RING}`}
          style={{ color: tone }}
        >
          {open ? <X size={14} aria-hidden="true" /> : <Sparkles size={14} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" tone={tone} onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </Btn>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2 sm:p-6"
            style={{ borderTop: `2px dashed ${C.line}` }}
          >
            <RedenKolom
              titel="In je voordeel"
              tone={C.lime}
              Icon={ThumbsUp}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.gold}
              Icon={TriangleAlert}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Sketch>
  );
}

function RedenKolom({
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
    <div>
      <p
        className="flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.06em]"
        style={{ color: tone }}
      >
        <Icon size={14} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[13.5px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <span
              className="mt-1.5 h-2.5 w-2.5 shrink-0"
              style={{ background: tone, borderRadius: "40% 60% 55% 45%" }}
              aria-hidden="true"
            />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————————— Opdracht-detail ——————————————————————————————————————
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.lime : C.marker;
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur" },
    { l: "Omvang", v: opdracht.uren, s: "per week" },
    { l: "Start", v: opdracht.start, s: "aanvang" },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel" },
  ];
  return (
    <div className="space-y-6">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={15} aria-hidden="true" /> Terug naar marktplaats
      </Btn>

      <Sketch className="overflow-hidden" tilt={-0.3}>
        <div className="p-6 sm:p-8" style={{ background: strong ? C.limeSoft : C.markerSoft }}>
          <div className="flex items-center gap-3">
            <MatchBadge value={opdracht.match} tone={tone} size={66} />
            <div>
              <StatusChip
                fg={tone}
                bg={C.paperHi}
                label={strong ? "Top match" : "Goede match"}
                Icon={Sparkles}
                alarm={false}
                size="sm"
              />
              <span
                className="mt-1.5 block text-[11px] font-bold"
                style={{ color: C.inkMute, ...mono }}
              >
                {opdracht.id}
              </span>
            </div>
          </div>
          <h1
            className="mt-4 max-w-2xl text-[28px] font-black leading-[1.05] md:text-[34px]"
            style={{ color: C.ink, ...hand }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[14px]" style={{ color: C.inkSoft }}>
            <MapPin size={15} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 text-[11.5px] font-bold"
                style={{
                  background: C.paperHi,
                  color: C.inkSoft,
                  border: `1.5px solid ${C.line}`,
                  borderRadius: "8px 6px 9px 7px",
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Btn variant="solid" tone={tone}>
              Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
            </Btn>
            <Btn variant="outline">
              <Bookmark size={15} aria-hidden="true" /> Bewaar
            </Btn>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4">
          {feiten.map((m, i) => (
            <div
              key={m.l}
              className="p-5"
              style={{
                borderRight: i < 3 ? `2px dashed ${C.line}` : "none",
                borderTop: `2px dashed ${C.line}`,
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[22px] font-black leading-none"
                style={{ color: C.ink, ...hand }}
              >
                {m.v}
              </p>
              <p className="mt-1 text-[10px]" style={{ color: C.inkFaint }}>
                {m.s}
              </p>
            </div>
          ))}
        </div>
      </Sketch>

      <Sketch className="p-6 sm:p-8" tilt={0.3}>
        <Eyebrow tone={C.marker}>
          <PenLine size={15} aria-hidden="true" /> Waarom deze match — met de hand nagelopen
        </Eyebrow>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed" style={{ color: C.inkMute }}>
          Afgezet tegen je geverifieerde profiel. Geen verborgen score — je ziet precies wat
          meetelt.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
          <RedenDetail
            titel="In je voordeel"
            tone={C.lime}
            Icon={Check}
            items={opdracht.redenen.plus}
          />
          <RedenDetail
            titel="Goed om te weten"
            tone={C.gold}
            Icon={TriangleAlert}
            items={opdracht.redenen.min}
          />
        </div>
      </Sketch>

      <Sketch className="p-6" tilt={-0.4} tone={C.grape} tint={C.grapeSoft}>
        <Eyebrow tone={C.grape}>
          <ShieldCheck size={15} aria-hidden="true" /> Vereiste certificaten
        </Eyebrow>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            return (
              <StatusChip key={c.naam} {...t} label={`${c.naam.split(" ")[0]} · ${t.label}`} />
            );
          })}
        </div>
      </Sketch>
    </div>
  );
}

function RedenDetail({
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
    <div>
      <p
        className="flex items-center gap-2 text-[13px] font-black uppercase tracking-[0.06em]"
        style={{ color: tone }}
      >
        <Icon size={15} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-4 space-y-3.5">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-3 text-[14.5px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center"
              style={{
                background: `${tone}22`,
                color: tone,
                border: `1.5px solid ${tone}`,
                borderRadius: "40% 60% 55% 45%",
              }}
              aria-hidden="true"
            >
              <Icon size={13} />
            </span>
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————————— Verificatie ——————————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <ScreenHead
        eyebrow="Verificatie"
        title="Jouw certificaten"
        sub={`${verified} van ${CREDENTIALS.length} geverifieerd · ${PROFIEL.trust}.`}
        tone={C.lime}
        right={
          <Sketch className="px-5 py-3 text-right" tilt={1} tone={C.lime} tint={C.limeSoft}>
            <p className="text-[30px] font-black leading-none" style={{ color: C.lime, ...hand }}>
              {ratio}%
            </p>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.08em]"
              style={{ color: C.lime }}
            >
              geverifieerd
            </p>
          </Sketch>
        }
      />

      <Sketch className="flex flex-wrap items-center gap-x-6 gap-y-3 p-5" tilt={-0.3}>
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((st) => {
          const t = credTone(st);
          const count = CREDENTIALS.filter((c) => c.status === st).length;
          return (
            <span key={st} className="inline-flex items-center gap-2">
              <span className="text-[20px] font-black" style={{ color: t.fg, ...hand }}>
                {count}
              </span>
              <StatusChip {...t} size="sm" />
            </span>
          );
        })}
      </Sketch>

      <ul className="space-y-3">
        {CREDENTIALS.map((c, ci) => {
          const t = credTone(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Sketch
                as="article"
                className="overflow-hidden"
                tilt={ci % 2 ? 0.3 : -0.3}
                tone={t.fg}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-4 px-5 py-4 text-left ${RING}`}
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center"
                    style={{
                      background: t.bg,
                      color: t.fg,
                      border: `2px solid ${t.fg}`,
                      borderRadius: "48% 52% 50% 50% / 52% 48% 52% 48%",
                    }}
                    aria-hidden="true"
                  >
                    <t.Icon size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[15px] font-black"
                      style={{ color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="block truncate text-[12.5px]"
                      style={{ color: t.alarm ? t.fg : C.inkMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="hidden sm:inline-flex">
                    <StatusChip {...t} />
                  </span>
                  <ChevronRight
                    size={18}
                    aria-hidden="true"
                    style={{
                      color: C.inkFaint,
                      transform: isOpen ? "rotate(90deg)" : "none",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div
                      className="px-5 pb-5 sm:pl-[76px]"
                      style={{ borderTop: `2px dashed ${C.line}`, paddingTop: 14 }}
                    >
                      <span className="mb-3 inline-flex sm:hidden">
                        <StatusChip {...t} size="sm" />
                      </span>
                      <p
                        className="max-w-xl text-[13px] leading-relaxed"
                        style={{ color: C.inkSoft }}
                      >
                        {c.detail}. Je bewijsstuk wordt versleuteld bewaard en alleen na jouw
                        toestemming door een opdrachtgever ingezien.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2.5">
                        <Btn size="sm" variant="solid" tone={t.fg}>
                          {c.status === "EXPIRING"
                            ? "Vernieuwen"
                            : c.status === "REJECTED"
                              ? "Opnieuw indienen"
                              : "Bekijken"}
                        </Btn>
                        <Btn size="sm" variant="outline">
                          Details
                        </Btn>
                      </div>
                    </div>
                  </div>
                </div>
              </Sketch>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// —————————————————————————————————————— Acties ——————————————————————————————————————
function Acties({ onMarkt, onFacturen }: { onMarkt: () => void; onFacturen: () => void }) {
  return (
    <div className="space-y-6">
      <ScreenHead
        eyebrow="Acties"
        title="Wat vraagt je aandacht"
        sub="Op volgorde van urgentie. Elke actie brengt je een stap verder."
        tone={C.coral}
      />
      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.coral : C.marker;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Sketch
                className="flex items-start gap-4 p-5 sm:p-6"
                tilt={i % 2 ? 0.4 : -0.4}
                tone={tone}
                tint={warn ? C.coralSoft : C.paper}
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center text-[17px] font-black"
                  style={{
                    background: warn ? C.paperHi : C.markerSoft,
                    color: tone,
                    border: `2px solid ${tone}`,
                    borderRadius: "48% 52% 50% 50% / 52% 48% 52% 48%",
                    ...hand,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Eyebrow tone={tone}>
                    {warn ? (
                      <TriangleAlert size={14} aria-hidden="true" />
                    ) : (
                      <Sparkles size={14} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </Eyebrow>
                  <h2
                    className="mt-1.5 text-[18px] font-black leading-snug"
                    style={{ color: C.ink }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[13.5px] leading-relaxed"
                    style={{ color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-4">
                    <Btn
                      variant={warn ? "solid" : "outline"}
                      size="sm"
                      tone={tone}
                      onClick={goMarkt ? onMarkt : goFacturen ? onFacturen : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
              </Sketch>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————————— Facturen ——————————————————————————————————————
function Facturen() {
  const [sort, setSort] = useState<"datum" | "bedrag">("datum");
  const [sel, setSel] = useState<string>(FACTUREN[0]?.nr ?? "");

  const rows = useMemo(() => {
    if (sort === "datum") return FACTUREN;
    return [...FACTUREN].sort((a, b) => parseEUR(b.bedrag) - parseEUR(a.bedrag));
  }, [sort]);

  const totals = useMemo(() => {
    const sum = (status: string) =>
      FACTUREN.filter((f) => f.status === status).reduce((a, f) => a + parseEUR(f.bedrag), 0);
    return { betaald: sum("Betaald"), open: sum("Openstaand"), concept: sum("Concept") };
  }, []);

  const selected = FACTUREN.find((f) => f.nr === sel) ?? FACTUREN[0];

  return (
    <div className="space-y-6">
      <ScreenHead
        eyebrow="Facturen"
        title="Je facturatie"
        sub="Klik een regel voor de opbouw van het bedrag."
        tone={C.gold}
        right={
          <Btn variant="solid" size="sm" tone={C.coral}>
            <Plus size={15} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            l: "Betaald",
            v: totals.betaald,
            sub: "2 facturen",
            fg: C.lime,
            bg: C.limeSoft,
            Icon: Check,
            tilt: -0.6,
          },
          {
            l: "Openstaand",
            v: totals.open,
            sub: "1 factuur · 9 dagen",
            fg: C.gold,
            bg: C.goldSoft,
            Icon: Clock,
            tilt: 0.6,
          },
          {
            l: "Concept",
            v: totals.concept,
            sub: "klaar om te versturen",
            fg: C.marker,
            bg: C.markerSoft,
            Icon: FileText,
            tilt: -0.4,
          },
        ].map((s) => (
          <Sketch key={s.l} className="vs-pop p-5" tilt={s.tilt} tone={s.fg} tint={s.bg}>
            <div className="flex items-center justify-between">
              <p
                className="text-[11px] font-bold uppercase tracking-[0.1em]"
                style={{ color: s.fg }}
              >
                {s.l}
              </p>
              <s.Icon size={16} aria-hidden="true" style={{ color: s.fg }} />
            </div>
            <p
              className="mt-1.5 text-[24px] font-black leading-none"
              style={{ color: C.ink, ...hand }}
            >
              {eur0.format(s.v)}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: C.inkSoft }}>
              {s.sub}
            </p>
          </Sketch>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Sketch className="overflow-hidden" tilt={-0.3}>
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `2px dashed ${C.line}` }}
          >
            <Eyebrow tone={C.marker}>
              <FileText size={15} aria-hidden="true" /> Facturen
            </Eyebrow>
            <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
              {(["datum", "bedrag"] as const).map((s) => (
                <Btn
                  key={s}
                  size="sm"
                  variant={sort === s ? "solid" : "outline"}
                  onClick={() => setSort(s)}
                >
                  {s === "datum" ? "Datum" : "Bedrag"}
                </Btn>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 480 }}>
              <caption className="sr-only">Overzicht van facturen</caption>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.lineInk}` }}>
                  {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] ${i === 3 ? "text-right" : ""}`}
                      style={{ color: C.inkMute }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => {
                  const t = factuurTone(f.status);
                  const on = f.nr === sel;
                  return (
                    <tr
                      key={f.nr}
                      className={`vs-row cursor-pointer ${RING}`}
                      tabIndex={0}
                      role="button"
                      aria-pressed={on}
                      onClick={() => setSel(f.nr)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSel(f.nr);
                        }
                      }}
                      style={{
                        borderBottom: `2px dashed ${C.line}`,
                        background: on ? C.markerSoft : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3.5 text-[12px] font-black"
                        style={{ color: on ? C.marker : C.inkSoft, ...mono }}
                      >
                        {f.nr}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-black" style={{ color: C.ink }}>
                        {f.klant}
                      </td>
                      <td className="px-4 py-3.5 text-[12px]" style={{ color: C.inkMute, ...mono }}>
                        {f.datum}
                      </td>
                      <td
                        className="px-4 py-3.5 text-right text-[13px] font-black"
                        style={{ color: C.ink, ...mono }}
                      >
                        {f.bedrag}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11.5px] font-bold"
                          style={{ color: t.fg }}
                        >
                          <t.Icon size={13} aria-hidden="true" /> {t.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Sketch>

        {selected && <Opbouw factuur={selected} />}
      </div>
    </div>
  );
}

function Opbouw({ factuur }: { factuur: (typeof FACTUREN)[number] }) {
  const total = parseEUR(factuur.bedrag);
  const subtotal = Math.round(total / 1.21);
  const btw = total - subtotal;
  const t = factuurTone(factuur.status);
  return (
    <Sketch as="article" className="overflow-hidden" tilt={0.4} tone={t.fg}>
      <div className="p-5" style={{ background: t.bg }}>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: t.fg }}>
          Factuur
        </p>
        <p className="text-[20px] font-black" style={{ color: C.ink, ...mono }}>
          {factuur.nr}
        </p>
      </div>
      <div className="space-y-3.5 p-5 text-[13px]">
        <Row label="Klant" value={factuur.klant} />
        <Row label="Datum" value={factuur.datum} isMono />
        <div className="flex items-baseline justify-between">
          <span className="text-[13px]" style={{ color: C.inkMute }}>
            Status
          </span>
          <StatusChip {...t} size="sm" />
        </div>
        <div className="my-3 border-t-2 border-dashed" style={{ borderColor: C.line }} />
        <Row label="Subtotaal" value={eur0.format(subtotal)} isMono />
        <Row label="Btw 21%" value={eur0.format(btw)} isMono />
        <div className="my-3 border-t-2" style={{ borderColor: C.lineInk }} />
        <div className="flex items-baseline justify-between">
          <span
            className="text-[12px] font-black uppercase tracking-[0.08em]"
            style={{ color: C.ink }}
          >
            Totaal
          </span>
          <span className="text-[24px] font-black" style={{ color: t.fg, ...hand }}>
            {factuur.bedrag}
          </span>
        </div>
        <div className="mt-5 flex gap-2.5">
          <Btn variant="solid" size="sm" full tone={t.fg}>
            {factuur.status === "Concept"
              ? "Versturen"
              : factuur.status === "Openstaand"
                ? "Herinnering"
                : "Download"}
            <ArrowRight size={13} aria-hidden="true" />
          </Btn>
          <Btn variant="outline" size="sm">
            PDF
          </Btn>
        </div>
      </div>
    </Sketch>
  );
}

function Row({ label, value, isMono = false }: { label: string; value: string; isMono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="shrink-0 text-[13px]" style={{ color: C.inkMute }}>
        {label}
      </span>
      <span
        className="shrink-0 text-right text-[13px] font-black"
        style={{ color: C.ink, ...(isMono ? mono : sans) }}
      >
        {value}
      </span>
    </div>
  );
}
