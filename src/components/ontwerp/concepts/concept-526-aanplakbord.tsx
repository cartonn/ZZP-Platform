"use client";

// Concept 526 — "Aanplakbord" · Verfijnd prikbord/collage op warm kraftpapier. Elk item is een
// aangeprikte indexkaart met lichte rotatie, een punaise of een reepje washi-tape; notities liggen
// gelaagd maar strak en leesbaar (geen rommel). Tactiel-analoog met een moderne, rustige typografie —
// warm en menselijk, maar met de informatiedichtheid en focus-states van een echt werkinstrument.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Layers,
  ListChecks,
  MapPin,
  Paperclip,
  Pin,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  StickyNote,
  Store,
  TriangleAlert,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ————————————————————————————— Palet — warm kraft & inkt —————————————————————————————
const C = {
  bg: "#e8dcc4",
  board: "#e2d4b8",
  card: "#f7f1e3",
  cardAlt: "#fbf7ec",
  sink: "#efe6d2",
  line: "#cdbf9f",
  lineSoft: "#ddd0b4",
  ink: "#2a2118",
  inkSoft: "#4c4232",
  inkMute: "#7a6c53",
  inkFaint: "#a2916f",
  tape: "#c2410c",
  tapeSoft: "#f3ddc9",
  pin: "#b02f2f",
  green: "#4f7a3a",
  greenSoft: "#e2ebd4",
  amber: "#b8781f",
  amberSoft: "#f2e6cd",
  red: "#a83232",
  redSoft: "#f0dcd4",
  blue: "#3a6a80",
  blueSoft: "#dbe6ea",
};

const sans: CSSProperties = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const mono: CSSProperties = {
  fontFamily: "'SF Mono', 'JetBrains Mono', ui-monospace, 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: "'tnum' 1",
};
const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8dcc4]";

// ————————————————————————————— Status-taal (label + icoon) —————————————————————————————
type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.green,
        soft: C.greenSoft,
        label: "Vastgezet",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return { base: C.blue, soft: C.blueSoft, label: "Ingediend", Icon: Clock, alarm: false };
    case "EXPIRING":
      return {
        base: C.amber,
        soft: C.amberSoft,
        label: "Verloopt bijna",
        Icon: TriangleAlert,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.red, soft: C.redSoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

function factuurTone(status: string): {
  base: string;
  soft: string;
  label: string;
  Icon: LucideIcon;
} {
  if (status === "Betaald")
    return { base: C.green, soft: C.greenSoft, label: "Betaald", Icon: Check };
  if (status === "Openstaand")
    return { base: C.amber, soft: C.amberSoft, label: "Openstaand", Icon: Clock };
  return { base: C.blue, soft: C.blueSoft, label: "Concept", Icon: FileText };
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

// deterministische lichte rotatie per index (geen willekeur, wel tactiel)
const TILT = [-1.4, 0.9, -0.6, 1.3, -1.0, 0.6, -0.8, 1.1];
function tilt(i: number): number {
  return TILT[i % TILT.length] ?? 0;
}

// ————————————————————————————— Prikbord-decoratie —————————————————————————————
function Pushpin({ color = C.pin }: { color?: string }) {
  return (
    <span
      className="absolute -top-2 left-1/2 z-10 h-4 w-4 -translate-x-1/2 rounded-full"
      style={{
        background: `radial-gradient(circle at 35% 30%, #ffffffaa, ${color} 55%)`,
        boxShadow: `0 2px 3px rgba(42,33,24,0.35)`,
        border: `1px solid ${color}`,
      }}
      aria-hidden="true"
    />
  );
}

function Tape({ className = "", color = C.tape }: { className?: string; color?: string }) {
  return (
    <span
      className={`absolute z-10 h-5 w-16 ${className}`}
      style={{
        background: `${color}40`,
        borderLeft: `1px dashed ${color}66`,
        borderRight: `1px dashed ${color}66`,
        transform: "rotate(-4deg)",
      }}
      aria-hidden="true"
    />
  );
}

// ————————————————————————————— Primitives —————————————————————————————
function Card({
  children,
  className = "",
  as: Tag = "div",
  tone,
  tiltDeg = 0,
  pin = false,
  tape = false,
  alt = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  tone?: string;
  tiltDeg?: number;
  pin?: boolean;
  tape?: boolean;
  alt?: boolean;
}) {
  return (
    <Tag
      className={`relative rounded-[3px] ${className}`}
      style={{
        background: alt ? C.cardAlt : C.card,
        border: `1px solid ${tone ? `${tone}66` : C.line}`,
        boxShadow: "0 10px 22px -16px rgba(42,33,24,0.6), 0 2px 5px -3px rgba(42,33,24,0.3)",
        transform: tiltDeg ? `rotate(${tiltDeg}deg)` : undefined,
      }}
    >
      {pin && <Pushpin color={tone ?? C.pin} />}
      {tape && <Tape className="-top-2 left-4" color={tone ?? C.tape} />}
      {children}
    </Tag>
  );
}

function Btn({
  children,
  onClick,
  variant = "solid",
  size = "md",
  className = "",
  tone = C.tape,
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
  const pad = size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-4 py-2.5 text-[13px]";
  const base = `inline-flex items-center justify-center gap-2 rounded-[4px] font-semibold tracking-[-0.01em] transition-all duration-150 active:translate-y-px ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? { background: tone, color: C.cardAlt, border: `1px solid ${tone}`, ...sans }
      : variant === "outline"
        ? { background: C.card, color: tone, border: `1px solid ${tone}66`, ...sans }
        : { background: "transparent", color: C.inkSoft, border: "1px solid transparent", ...sans };
  const hover = variant === "solid" ? "hover:brightness-105" : "hover:bg-[#efe6d2]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`${base} ${pad} ${hover} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}

function StatusTag({ base, soft, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[11px] font-semibold"
      style={{ color: base, background: soft, border: `1px solid ${base}55`, ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (aandacht nodig)</span>}
    </span>
  );
}

// Match als gestempeld cijfer op een label
function MatchStamp({ value, tone }: { value: number; tone: string }) {
  return (
    <span
      className="relative inline-flex h-14 w-14 flex-col items-center justify-center rounded-full"
      style={{ border: `2px solid ${tone}`, color: tone, background: `${tone}12` }}
      aria-label={`Match ${value} procent`}
    >
      <span className="text-[15px] font-bold leading-none" style={{ ...mono }}>
        {value}
      </span>
      <span
        className="text-[7px] font-bold uppercase tracking-[0.14em]"
        style={{ color: C.inkMute }}
      >
        match
      </span>
    </span>
  );
}

function Kicker({ children, tone = C.inkMute }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em]"
      style={{ color: tone, ...sans }}
    >
      {children}
    </span>
  );
}

function ScreenHead({
  code,
  title,
  sub,
  right,
  tone = C.tape,
}: {
  code: string;
  title: string;
  sub?: string;
  right?: ReactNode;
  tone?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <span
          className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.16em]"
          style={{ color: tone, background: `${tone}18`, border: `1px solid ${tone}44` }}
        >
          <Pin size={12} aria-hidden="true" />
          {code}
        </span>
        <h1
          className="mt-2.5 text-[25px] font-bold leading-tight tracking-[-0.02em] md:text-[30px]"
          style={{ color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-1.5 max-w-xl text-[13px]" style={{ color: C.inkMute }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

const NAV: Record<ScreenKey, { Icon: LucideIcon; tone: string }> = {
  dashboard: { Icon: Layers, tone: C.tape },
  marktplaats: { Icon: Store, tone: C.blue },
  opdracht: { Icon: MapPin, tone: C.pin },
  verificatie: { Icon: ShieldCheck, tone: C.green },
  acties: { Icon: ListChecks, tone: C.amber },
  facturen: { Icon: Receipt, tone: C.tape },
  documenten: { Icon: FileText, tone: C.blue },
  berichten: { Icon: FileText, tone: C.blue },
};

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept526() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[760px] w-full antialiased"
      style={{
        ...sans,
        color: C.ink,
        background: `radial-gradient(circle at 20% 10%, ${C.bg}, ${C.board})`,
      }}
    >
      <div className="mx-auto flex max-w-6xl">
        <Sidebar screen={screen} setScreen={setScreen} />
        <div className="min-w-0 flex-1">
          <TopBar />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="ab-fade px-4 pb-20 pt-6 sm:px-6 md:px-8">
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
        @keyframes abFade { from { opacity: 0; transform: translateY(6px) rotate(-0.3deg); } to { opacity: 1; transform: none; } }
        .ab-fade { animation: abFade 0.32s cubic-bezier(0.22,1,0.36,1) both; }
        .ab-row { transition: background 0.16s ease, transform 0.16s ease; }
        .ab-row:hover { background: ${C.sink}; }
        .ab-lift { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .ab-lift:hover { transform: rotate(0deg) translateY(-2px); box-shadow: 0 16px 30px -18px rgba(42,33,24,0.7); }
        @media (prefers-reduced-motion: reduce) { .ab-fade, .ab-lift, .ab-row { animation: none !important; transition: none !important; } }
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
      className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col md:flex"
      style={{ background: C.board, borderRight: `1px solid ${C.line}` }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-5"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-[5px]"
          style={{ background: C.tape, color: C.cardAlt, transform: "rotate(-3deg)" }}
          aria-hidden="true"
        >
          <Pin size={17} />
        </span>
        <span>
          <span className="block text-[14px] font-bold tracking-[-0.01em]" style={{ color: C.ink }}>
            Aanplakbord
          </span>
          <span
            className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.2em]"
            style={{ color: C.tape }}
          >
            alles op één bord
          </span>
        </span>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1 overflow-y-auto px-3 py-4">
        <p
          className="px-2 pb-2 text-[9px] font-bold uppercase tracking-[0.2em]"
          style={{ color: C.inkFaint }}
        >
          Aangeprikt
        </p>
        <ul className="space-y-0.5">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const { Icon, tone } = NAV[s.key];
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`group flex w-full items-center gap-2.5 rounded-[5px] px-2.5 py-2 text-left text-[13px] font-semibold transition-colors ${RING}`}
                  style={
                    on
                      ? {
                          background: C.card,
                          color: tone,
                          boxShadow: "0 4px 12px -8px rgba(42,33,24,0.6)",
                        }
                      : { color: C.inkSoft }
                  }
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-[5px]"
                    style={{
                      background: on ? tone : C.sink,
                      color: on ? C.cardAlt : tone,
                      border: `1px solid ${on ? tone : C.line}`,
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={14} />
                  </span>
                  <span className="flex-1">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-4" style={{ borderTop: `1px solid ${C.line}` }}>
        <div
          className="relative mb-3 rounded-[3px] p-3"
          style={{
            background: C.greenSoft,
            border: `1px solid ${C.green}44`,
            transform: "rotate(-1deg)",
          }}
        >
          <Pushpin color={C.green} />
          <p
            className="text-[9px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.green }}
          >
            Dossier op orde
          </p>
          <p className="mt-1 text-[19px] font-bold leading-none" style={{ color: C.ink, ...mono }}>
            {ratio}%
          </p>
          <p className="mt-1 text-[10px]" style={{ color: C.inkMute }}>
            {verified}/{CREDENTIALS.length} kaarten vastgezet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-[5px] text-[11px] font-bold"
            style={{ background: C.tape, color: C.cardAlt, ...mono }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-bold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </span>
            <span
              className="flex items-center gap-1 text-[10px] font-semibold"
              style={{ color: C.green }}
            >
              <ShieldCheck size={10} aria-hidden="true" /> {PROFIEL.trust}
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
      className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 sm:px-6 md:px-8"
      style={{
        background: `${C.bg}ee`,
        borderBottom: `1px solid ${C.line}`,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="flex flex-1 items-center gap-2 rounded-[4px] px-3 py-2"
        style={{ background: C.card, border: `1px solid ${C.line}` }}
      >
        <Search size={14} aria-hidden="true" style={{ color: C.inkFaint }} />
        <span className="text-[12.5px]" style={{ color: C.inkFaint }}>
          Zoek op het bord — opdrachten, certificaten, facturen…
        </span>
        <span
          className="ml-auto hidden rounded-[3px] px-1.5 py-0.5 text-[10px] font-bold sm:inline"
          style={{ background: C.sink, color: C.inkMute, ...mono }}
        >
          ⌘K
        </span>
      </div>
      <span
        className="hidden items-center gap-2 rounded-[4px] px-3 py-2 text-[12px] font-semibold sm:inline-flex"
        style={{ background: C.amberSoft, color: C.amber, border: `1px solid ${C.amber}44` }}
      >
        <Clock size={13} aria-hidden="true" />
        <span style={{ ...mono }}>{eur0.format(open)}</span> openstaand
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
      className="flex gap-1.5 overflow-x-auto px-4 py-2.5 md:hidden"
      style={{ borderBottom: `1px solid ${C.line}`, background: C.board }}
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        const { tone } = NAV[s.key];
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`shrink-0 rounded-[4px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
            style={
              on ? { background: tone, color: C.cardAlt } : { color: C.inkSoft, background: C.card }
            }
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
  return (
    <div className="space-y-7">
      <ScreenHead
        code="Prikbord"
        title={`Het bord van ${PROFIEL.naam.split(" ")[0]}`}
        sub="Alles wat telt op één bord aangeprikt. Drie kaartjes vragen vandaag om aandacht."
        right={
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" tone={C.green} onClick={onVerif}>
              <ShieldCheck size={13} aria-hidden="true" /> Dossier
            </Btn>
            <Btn variant="solid" size="sm" onClick={onActies}>
              Volgende actie <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {KPIS.map((k, i) => (
          <Card
            key={k.label}
            className="ab-lift p-4"
            tiltDeg={tilt(i)}
            pin
            tone={NAV.facturen.tone}
            alt={i % 2 === 1}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold" style={{ color: C.inkMute }}>
                {k.label}
              </p>
            </div>
            <p
              className="mt-2 text-[25px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.ink, ...mono }}
            >
              {k.value}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-[11px] font-bold"
                style={{
                  color: k.up ? C.green : C.amber,
                  background: k.up ? C.greenSoft : C.amberSoft,
                }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
              <span className="inline-flex h-6 items-end gap-[3px]" aria-hidden="true">
                {k.spark.map((d, j) => {
                  const max = Math.max(...k.spark);
                  const min = Math.min(...k.spark);
                  const h = 3 + ((d - min) / (max - min || 1)) * 18;
                  const last = j === k.spark.length - 1;
                  return (
                    <span
                      key={j}
                      className="w-[3px] rounded-sm"
                      style={{ height: h, background: last ? C.tape : `${C.tape}44` }}
                    />
                  );
                })}
              </span>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        <Card className="overflow-hidden" tone={C.blue}>
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <Kicker tone={C.blue}>
              <Store size={13} aria-hidden="true" /> Aangeprikte opdrachten
            </Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className={`rounded-[4px] px-1 text-[11.5px] font-semibold ${RING}`}
              style={{ color: C.blue }}
            >
              Hele bord →
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => {
              const tone = o.match >= 90 ? C.green : C.blue;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className={`ab-row flex w-full items-center gap-3.5 px-5 py-4 text-left ${RING}`}
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <MatchStamp value={o.match} tone={tone} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14px] font-bold"
                        style={{ color: C.ink }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                        style={{ color: C.inkMute }}
                      >
                        <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </span>
                    </span>
                    <span className="hidden shrink-0 text-right sm:block">
                      <span
                        className="block text-[13.5px] font-bold"
                        style={{ color: C.ink, ...mono }}
                      >
                        {o.tarief.replace(" / uur", "")}
                      </span>
                      <span
                        className="text-[9px] font-bold uppercase tracking-[0.1em]"
                        style={{ color: C.inkFaint }}
                      >
                        p/uur
                      </span>
                    </span>
                    <ChevronRight size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="space-y-5">
          <Card className="p-5" tone={C.green} tape>
            <Kicker tone={C.green}>
              <ShieldCheck size={13} aria-hidden="true" /> Vertrouwenskaart
            </Kicker>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[36px] font-bold leading-none tracking-[-0.03em]"
                style={{ color: C.green, ...mono }}
              >
                {ratio}%
              </span>
              <span className="text-[12px]" style={{ color: C.inkMute }}>
                dossier op orde
              </span>
            </div>
            <div className="mt-3 flex gap-1.5" aria-hidden="true">
              {CREDENTIALS.map((c) => {
                const t = credTone(c.status);
                return (
                  <span
                    key={c.naam}
                    className="h-2 flex-1 rounded-[2px]"
                    style={{ background: c.status === "VERIFIED" ? C.green : `${t.base}66` }}
                  />
                );
              })}
            </div>
            <p className="mt-2.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} certificaten vastgezet · {PROFIEL.trust}.
            </p>
          </Card>

          <Card className="p-5" tone={C.amber} as="article" pin>
            <Kicker tone={C.amber}>
              <TriangleAlert size={13} aria-hidden="true" /> Termijn nadert
            </Kicker>
            <h3 className="mt-2 text-[15px] font-bold leading-snug" style={{ color: C.ink }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" full tone={C.amber} className="mt-4" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Card>
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
        code="Marktplaats"
        tone={C.blue}
        title="Opdrachten op het bord"
        sub={`${rows.length} van ${OPDRACHTEN.length} kaartjes sluiten aan op je vastgezette profiel.`}
      />

      <Card className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center" tone={C.blue}>
        <div
          className="flex flex-1 items-center gap-2 rounded-[4px] px-3 py-2"
          style={{ background: C.sink, border: `1px solid ${C.line}` }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter op titel, plaats of opdrachtgever…"
            aria-label="Kaartjes filteren"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a2916f]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Filter wissen"
              className={`flex h-5 w-5 items-center justify-center rounded-[3px] ${RING}`}
              style={{ color: C.inkMute }}
            >
              <X size={13} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <Btn
              key={s}
              size="sm"
              tone={C.blue}
              variant={sort === s ? "solid" : "outline"}
              onClick={() => setSort(s)}
            >
              {s === "match" ? "Match" : "Tarief"}
            </Btn>
          ))}
        </div>
      </Card>

      {mode === "loading" ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Card className="space-y-3 p-5" tiltDeg={tilt(i)}>
                <div
                  className="h-4 w-2/3 animate-pulse rounded-[2px] motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
                <div
                  className="h-3 w-1/2 animate-pulse rounded-[2px] motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
              </Card>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={TriangleAlert}
          tone={C.red}
          titel="Kaartjes losgeraakt"
          tekst="De opdrachten konden zojuist niet van het bord worden gelezen. Prik ze opnieuw vast en probeer het nog eens."
          cta="Opnieuw ophalen"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.blue}
          titel="Geen kaartje gevonden"
          tekst={`Niets voor ${q ? `“${q}”` : "je filter"}. Verruim je zoekopdracht en probeer opnieuw.`}
          cta="Filter wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-5">
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
            className={`rounded text-[10px] font-bold uppercase tracking-[0.14em] underline-offset-2 hover:underline ${RING}`}
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
    <Card className="flex flex-col items-center px-6 py-16 text-center" tone={tone} pin>
      <span
        className="flex h-16 w-16 items-center justify-center rounded-[10px]"
        style={{ color: tone, background: `${tone}1f`, border: `1px solid ${tone}55` }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-4 text-[19px] font-bold" style={{ color: C.ink }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
        {tekst}
      </p>
      <Btn variant="solid" tone={tone} className="mt-5" onClick={onCta}>
        <RotateCcw size={13} aria-hidden="true" /> {cta}
      </Btn>
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
  const tone = strong ? C.green : C.blue;
  return (
    <Card as="article" className="ab-lift overflow-hidden" tone={tone} tiltDeg={tilt(index)} pin>
      <div className="flex items-start gap-4 p-5">
        <span className="shrink-0 pt-0.5 text-center">
          <MatchStamp value={opdracht.match} tone={tone} />
          <span
            className="mt-2 block rounded-[3px] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.06em]"
            style={{ color: tone, background: `${tone}1f`, border: `1px solid ${tone}55` }}
          >
            {strong ? "sterk" : "goed"}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 text-[10px] font-bold"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>#{String(index + 1).padStart(2, "0")}</span>
            <span aria-hidden="true">·</span>
            <span>{opdracht.id}</span>
          </div>
          <h3
            className="mt-1 text-[16px] font-bold leading-snug tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-[3px] px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: C.sink, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[16px] font-bold" style={{ color: C.ink, ...mono }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-[0.1em]"
            style={{ color: C.inkFaint }}
          >
            per uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-2 px-5 py-3"
        style={{ borderTop: `1px solid ${C.lineSoft}`, background: C.sink }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 rounded-[4px] px-1 text-[12px] font-semibold ${RING}`}
          style={{ color: tone }}
        >
          {open ? <X size={13} aria-hidden="true" /> : <StickyNote size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" tone={tone} onClick={onOpen}>
            Reageren <ArrowRight size={12} aria-hidden="true" />
          </Btn>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2"
            style={{ borderTop: `1px solid ${C.lineSoft}` }}
          >
            <RedenKolom
              titel="In je voordeel"
              tone={C.green}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.amber}
              Icon={TriangleAlert}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Card>
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
        className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em]"
        style={{ color: tone }}
      >
        <Icon size={12} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[13px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: tone }}
              aria-hidden="true"
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————————— Opdracht-detail ——————————————————————————————————————
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.green : C.blue;
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur" },
    { l: "Omvang", v: opdracht.uren, s: "per week" },
    { l: "Aanvang", v: opdracht.start, s: "startdatum" },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel" },
  ];
  return (
    <div className="space-y-6">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar het bord
      </Btn>

      <Card className="overflow-hidden" tone={tone} tape>
        <div className="p-6">
          <div
            className="flex items-center gap-2 text-[11px] font-bold"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>{opdracht.id}</span>
            <span aria-hidden="true">·</span>
            <span
              className="rounded-[3px] px-2 py-0.5 uppercase tracking-[0.08em]"
              style={{ color: tone, background: `${tone}18` }}
            >
              {strong ? "sterke match" : "goede match"} {opdracht.match}%
            </span>
          </div>
          <h1
            className="mt-2.5 max-w-2xl text-[25px] font-bold leading-[1.12] tracking-[-0.02em] md:text-[29px]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13.5px]" style={{ color: C.inkMute }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-[3px] px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: C.sink, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Btn variant="solid" tone={tone}>
              Reageren op opdracht <ArrowRight size={14} aria-hidden="true" />
            </Btn>
            <Btn variant="outline">Bewaren</Btn>
          </div>
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-4"
          style={{ borderTop: `1px solid ${C.line}` }}
        >
          {feiten.map((m, i) => (
            <div
              key={m.l}
              className="p-4"
              style={{
                borderRight: i < 3 ? `1px solid ${C.lineSoft}` : "none",
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[9px] font-bold uppercase tracking-[0.14em]"
                style={{ color: C.inkMute }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-bold leading-none"
                style={{ color: C.ink, ...mono }}
              >
                {m.v}
              </p>
              <p className="mt-1 text-[10px]" style={{ color: C.inkFaint }}>
                {m.s}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6" tone={C.blue}>
        <Kicker tone={C.blue}>
          <ListChecks size={13} aria-hidden="true" /> Navolgbaar — geen verborgen score
        </Kicker>
        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je vastgezette profiel. Wat in je voordeel spreekt, en wat goed is om vooraf
          te weten.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <RedenDetail
            titel="In je voordeel"
            tone={C.green}
            Icon={Check}
            items={opdracht.redenen.plus}
          />
          <RedenDetail
            titel="Goed om te weten"
            tone={C.amber}
            Icon={TriangleAlert}
            items={opdracht.redenen.min}
          />
        </div>
      </Card>
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
        className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.12em]"
        style={{ color: tone }}
      >
        <Icon size={13} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-3 space-y-3">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[13.5px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <Icon
              size={15}
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

// —————————————————————————————————————— Verificatie ——————————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <ScreenHead
        code="Verificatie"
        tone={C.green}
        title="Vertrouwensbord"
        sub={`${verified} van ${CREDENTIALS.length} certificaten vastgezet · ${PROFIEL.trust}.`}
        right={
          <div
            className="relative rounded-[3px] px-4 py-2 text-right"
            style={{
              background: C.greenSoft,
              border: `1px solid ${C.green}44`,
              transform: "rotate(-1.5deg)",
            }}
          >
            <Pushpin color={C.green} />
            <p
              className="text-[27px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.green, ...mono }}
            >
              {ratio}%
            </p>
            <p
              className="text-[9px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.green }}
            >
              op orde
            </p>
          </div>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((st) => {
            const t = credTone(st);
            const count = CREDENTIALS.filter((c) => c.status === st).length;
            return (
              <span key={st} className="inline-flex items-center gap-2">
                <span className="text-[16px] font-bold" style={{ color: t.base, ...mono }}>
                  {count}
                </span>
                <StatusTag {...t} />
              </span>
            );
          })}
        </div>
      </Card>

      <ul className="space-y-4">
        {CREDENTIALS.map((c, i) => {
          const t = credTone(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Card
                as="article"
                className="overflow-hidden"
                tone={t.base}
                tiltDeg={isOpen ? 0 : tilt(i) * 0.5}
                pin
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-3 px-5 py-4 text-left ${RING}`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px]"
                    style={{ background: t.soft, color: t.base, border: `1px solid ${t.base}44` }}
                    aria-hidden="true"
                  >
                    <t.Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold" style={{ color: C.ink }}>
                      {c.naam}
                    </span>
                    <span
                      className="block truncate text-[11.5px]"
                      style={{ color: t.alarm ? t.base : C.inkMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="hidden sm:inline-flex">
                    <StatusTag {...t} />
                  </span>
                  <ChevronRight
                    size={16}
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
                      className="px-5 pb-4 sm:pl-[72px]"
                      style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 12 }}
                    >
                      <span className="mb-2 inline-flex sm:hidden">
                        <StatusTag {...t} />
                      </span>
                      <p
                        className="max-w-xl text-[12.5px] leading-relaxed"
                        style={{ color: C.inkSoft }}
                      >
                        {c.detail}. Het document wordt versleuteld bewaard en uitsluitend na jouw
                        toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Btn size="sm" variant="solid" tone={t.base}>
                          {c.status === "EXPIRING"
                            ? "Vernieuwen"
                            : c.status === "REJECTED"
                              ? "Opnieuw indienen"
                              : "Bekijken"}
                        </Btn>
                        <Btn size="sm" variant="outline" tone={t.base}>
                          Historie
                        </Btn>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
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
        code="Acties"
        tone={C.amber}
        title="Kaartjes die om aandacht vragen"
        sub="Op volgorde van urgentie aangeprikt — pak ze één voor één van het bord."
      />
      <ol className="space-y-5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.blue;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Card className="flex items-start gap-4 p-5" tone={tone} tiltDeg={tilt(i)} pin>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px] text-[15px] font-bold"
                  style={{
                    background: `${tone}18`,
                    color: tone,
                    border: `1px solid ${tone}44`,
                    ...mono,
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <Kicker tone={tone}>
                    {warn ? (
                      <TriangleAlert size={13} aria-hidden="true" />
                    ) : (
                      <Paperclip size={13} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </Kicker>
                  <h2
                    className="mt-1.5 text-[16px] font-bold leading-snug"
                    style={{ color: C.ink }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[13px] leading-relaxed"
                    style={{ color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3">
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
              </Card>
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
        code="Facturen"
        tone={C.tape}
        title="Facturen op het bord"
        sub="Klik een kaartje om de opbouw te openen."
        right={
          <Btn variant="solid" size="sm">
            <Plus size={13} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            l: "Betaald",
            v: totals.betaald,
            sub: "2 facturen",
            tone: C.green,
            Icon: Check,
            ti: -1.2,
          },
          {
            l: "Openstaand",
            v: totals.open,
            sub: "1 factuur · 9 dagen",
            tone: C.amber,
            Icon: Clock,
            ti: 0.8,
          },
          {
            l: "Concept",
            v: totals.concept,
            sub: "klaar om te versturen",
            tone: C.blue,
            Icon: FileText,
            ti: -0.6,
          },
        ].map((s) => (
          <Card key={s.l} className="ab-lift p-4" tone={s.tone} tiltDeg={s.ti} pin>
            <div className="flex items-center justify-between">
              <p
                className="text-[9.5px] font-bold uppercase tracking-[0.14em]"
                style={{ color: s.tone }}
              >
                {s.l}
              </p>
              <s.Icon size={14} aria-hidden="true" style={{ color: s.tone }} />
            </div>
            <p
              className="mt-1.5 text-[22px] font-bold leading-none"
              style={{ color: C.ink, ...mono }}
            >
              {eur0.format(s.v)}
            </p>
            <p className="mt-1 text-[11px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Card>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden" tone={C.tape}>
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <Kicker tone={C.tape}>
              <Receipt size={13} aria-hidden="true" /> Facturen
            </Kicker>
            <div className="flex items-center gap-1.5" role="group" aria-label="Facturen sorteren">
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
                <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                  {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.12em] ${i === 3 ? "text-right" : ""}`}
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
                      className={`ab-row cursor-pointer ${RING}`}
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
                        borderTop: `1px solid ${C.lineSoft}`,
                        background: on ? C.greenSoft : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3 text-[12px] font-bold"
                        style={{ color: on ? C.green : C.inkSoft, ...mono }}
                      >
                        {f.nr}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-bold" style={{ color: C.ink }}>
                        {f.klant}
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: C.inkMute, ...mono }}>
                        {f.datum}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-[13px] font-bold"
                        style={{ color: C.ink, ...mono }}
                      >
                        {f.bedrag}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold"
                          style={{ color: t.base }}
                        >
                          <t.Icon size={12} aria-hidden="true" /> {t.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

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
    <Card as="article" className="overflow-hidden" tone={t.base} tape>
      <div className="p-5" style={{ borderBottom: `1px solid ${C.line}` }}>
        <p className="text-[9.5px] font-bold uppercase tracking-[0.18em]" style={{ color: t.base }}>
          Factuurkaart
        </p>
        <p className="text-[17px] font-bold" style={{ color: C.ink, ...mono }}>
          {factuur.nr}
        </p>
      </div>
      <div className="space-y-3 p-5 text-[12.5px]">
        <Row label="Klant" value={factuur.klant} />
        <Row label="Datum" value={factuur.datum} isMono />
        <div className="flex items-baseline justify-between">
          <span className="text-[12px]" style={{ color: C.inkMute }}>
            Status
          </span>
          <span
            className="inline-flex items-center gap-1.5 font-semibold"
            style={{ color: t.base }}
          >
            <t.Icon size={12} aria-hidden="true" /> {t.label}
          </span>
        </div>
        <div className="my-3 h-px" style={{ background: C.line }} />
        <Row label="Subtotaal" value={eur0.format(subtotal)} isMono />
        <Row label="Btw 21%" value={eur0.format(btw)} isMono />
        <div className="my-3 h-px" style={{ background: `${t.base}44` }} />
        <div className="flex items-baseline justify-between">
          <span
            className="text-[12px] font-bold uppercase tracking-[0.12em]"
            style={{ color: C.ink }}
          >
            Totaal
          </span>
          <span className="text-[20px] font-bold" style={{ color: t.base, ...mono }}>
            {factuur.bedrag}
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <Btn variant="solid" size="sm" full tone={t.base}>
            {factuur.status === "Concept"
              ? "Versturen"
              : factuur.status === "Openstaand"
                ? "Herinnering"
                : "Download"}
            <ArrowRight size={13} aria-hidden="true" />
          </Btn>
          <Btn variant="outline" size="sm" tone={t.base}>
            PDF
          </Btn>
        </div>
      </div>
    </Card>
  );
}

function Row({ label, value, isMono = false }: { label: string; value: string; isMono?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0 text-[12px]" style={{ color: C.inkMute }}>
        {label}
      </span>
      <span
        className="min-w-0 flex-1 self-end border-b border-dotted"
        style={{ borderColor: C.line }}
        aria-hidden="true"
      />
      <span
        className="shrink-0 text-right text-[12.5px] font-semibold"
        style={{ color: C.ink, ...(isMono ? mono : sans) }}
      >
        {value}
      </span>
    </div>
  );
}
