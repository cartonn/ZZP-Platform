"use client";

// Concept 59 — "Memphis" · postmodern speels geometrisch (jaren-80 Memphis-design).
// Speelse geometrie rond crisp content: squiggles, zigzag-lijnen, terrazzo-spikkels en
// confetti-vormen in koraal/turquoise/geel/zwart op crème. Dikke zwarte omtreklijnen,
// harde offset-schaduwen, lichtjes schuine decoratie-kaders — maar de UI zelf blijft
// functioneel en leesbaar: de vormen omlijsten de kaarten, ze liggen er nooit overheen.
// Onderscheidend van Dopamine/color-blocking (07, vlakke vlakken), Art-deco (35, symmetrie)
// en Riso (28, offset-druk): dit is expliciet Memphis-postmodernisme met squiggle + terrazzo.
// Palet: crème #f6efe1, papier #fffdf7, inkt #16130f, koraal #ff5d5d, turquoise #12c2b8,
// geel #ffcb3d, violet #7b6cf6.
// Fonts: --font-lab-bricolage (display) + --font-lab-jakarta (body) + --font-lab-space (accent).

import { useState } from "react";
import {
  LayoutGrid,
  Store,
  Briefcase,
  BadgeCheck,
  ListChecks,
  Receipt,
  Search,
  Bell,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  MapPin,
  Plus,
  FileText,
  Send,
  Loader2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RotateCw,
  Star,
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

/* ---------- Palet & typografie ---------- */

const C = {
  cream: "#f6efe1",
  creamDeep: "#efe6d3",
  paper: "#fffdf7",
  ink: "#16130f",
  inkSoft: "#4a453c",
  muted: "#7c766a",
  faint: "#a79f8f",
  line: "#16130f",
  coral: "#ff5d5d",
  coralSoft: "#ffe4e0",
  turq: "#12c2b8",
  turqSoft: "#d7f6f2",
  yellow: "#ffcb3d",
  yellowSoft: "#fff0c4",
  violet: "#7b6cf6",
  violetSoft: "#e9e6ff",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const body = { fontFamily: "var(--font-lab-jakarta)" };
const accent = { fontFamily: "var(--font-lab-space)" };

type Tone = "green" | "amber" | "red" | "violet";

const TONE: Record<Tone, { fg: string; ink: string; soft: string }> = {
  green: { fg: C.turq, ink: "#0a5a54", soft: C.turqSoft },
  amber: { fg: C.yellow, ink: "#7a5600", soft: C.yellowSoft },
  red: { fg: C.coral, ink: "#a12525", soft: C.coralSoft },
  violet: { fg: C.violet, ink: "#3f329c", soft: C.violetSoft },
};

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: BadgeCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

function statusStyle(s: CredStatus): { label: string; tone: Tone; Icon: LucideIcon } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", tone: "green", Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", tone: "amber", Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", tone: "amber", Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", tone: "red", Icon: AlertTriangle };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Memphis-decoratie (puur decoratief, aria-hidden) ---------- */

function Squiggle({ className = "", color = C.coral }: { className?: string; color?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      width="86"
      height="20"
      viewBox="0 0 86 20"
      fill="none"
    >
      <path
        d="M2 10 Q 12 -3 22 10 T 42 10 T 62 10 T 82 10"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function Zigzag({ className = "", color = C.turq }: { className?: string; color?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      width="70"
      height="18"
      viewBox="0 0 70 18"
      fill="none"
    >
      <path
        d="M2 14 L12 4 L22 14 L32 4 L42 14 L52 4 L62 14"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Blob({ className = "", color = C.yellow }: { className?: string; color?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      width="60"
      height="60"
      viewBox="0 0 60 60"
      fill="none"
    >
      <path
        d="M30 3c11 0 22 6 24 18s-6 24-19 30S6 74 3 42 19 3 30 3Z"
        transform="translate(2 -6)"
        fill={color}
        stroke={C.ink}
        strokeWidth="2.4"
      />
    </svg>
  );
}

function Confetti({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      width="120"
      height="80"
      viewBox="0 0 120 80"
      fill="none"
    >
      <circle cx="14" cy="16" r="7" fill={C.coral} stroke={C.ink} strokeWidth="2" />
      <rect
        x="52"
        y="6"
        width="14"
        height="14"
        rx="2"
        fill={C.turq}
        stroke={C.ink}
        strokeWidth="2"
        transform="rotate(18 59 13)"
      />
      <path d="M96 6 L108 24 L84 24 Z" fill={C.yellow} stroke={C.ink} strokeWidth="2" />
      <path d="M8 52 L20 64 M20 52 L8 64" stroke={C.violet} strokeWidth="3" strokeLinecap="round" />
      <circle cx="72" cy="58" r="6" fill={C.violet} stroke={C.ink} strokeWidth="2" />
      <path d="M104 46 q8 8 0 16 q-8 -8 0 -16" fill={C.coral} stroke={C.ink} strokeWidth="2" />
    </svg>
  );
}

// Terrazzo-spikkels als herhaalbare achtergrond (radiale gradients, deterministisch).
const TERRAZZO_BG =
  `radial-gradient(circle at 12% 24%, ${C.coral}44 0 3px, transparent 4px),` +
  `radial-gradient(circle at 42% 68%, ${C.turq}44 0 4px, transparent 5px),` +
  `radial-gradient(circle at 72% 30%, ${C.yellow}66 0 3px, transparent 4px),` +
  `radial-gradient(circle at 88% 78%, ${C.violet}33 0 3px, transparent 4px),` +
  `radial-gradient(circle at 26% 88%, ${C.ink}22 0 2px, transparent 3px),` +
  `radial-gradient(circle at 62% 12%, ${C.coral}33 0 2px, transparent 3px)`;

/* ---------- Bouwstenen ---------- */

// Kaart met dikke omtrek + harde offset-schaduw (Memphis-brutalisme, maar crisp).
function Card({
  children,
  className = "",
  color = C.paper,
  shadow = C.ink,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  shadow?: string;
  as?: "div" | "section";
}) {
  const Tag = as;
  return (
    <Tag
      className={`relative rounded-[18px] ${className}`}
      style={{
        background: color,
        border: `2.5px solid ${C.ink}`,
        boxShadow: `5px 6px 0 0 ${shadow}`,
      }}
    >
      {children}
    </Tag>
  );
}

function Chip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{
        color: TONE[tone].ink,
        background: TONE[tone].soft,
        border: `2px solid ${C.ink}`,
        ...accent,
      }}
    >
      {children}
    </span>
  );
}

function Kicker({ color = C.coral, children }: { color?: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em]"
      style={{ background: color, color: C.ink, border: `2px solid ${C.ink}`, ...accent }}
    >
      {children}
    </span>
  );
}

function SectionHead({
  kickerColor,
  kicker,
  title,
  note,
}: {
  kickerColor?: string;
  kicker: string;
  title: string;
  note?: string;
}) {
  return (
    <div className="relative">
      <Kicker color={kickerColor}>{kicker}</Kicker>
      <h1
        className="relative mt-3 inline-block text-[26px] font-extrabold leading-[1.05] tracking-tight sm:text-[32px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
        <span
          aria-hidden="true"
          className="absolute -bottom-1 left-0 h-2.5 w-full rounded-full"
          style={{ background: C.yellow, zIndex: -1 }}
        />
      </h1>
      {note && (
        <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          {note}
        </p>
      )}
    </div>
  );
}

// Speelse KPI-tegel met sparkline in Memphis-kleur.
function KpiTile({
  label,
  value,
  trend,
  up,
  spark,
  color,
}: {
  label: string;
  value: string;
  trend: string;
  up: boolean;
  spark: number[];
  color: string;
}) {
  const max = Math.max(...spark);
  const min = Math.min(...spark);
  const range = max - min || 1;
  const pts = spark
    .map((v, i) => {
      const x = (i / (spark.length - 1)) * 100;
      const y = 30 - ((v - min) / range) * 26 - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <Card className="overflow-hidden p-4" color={C.paper}>
      <span
        aria-hidden="true"
        className="absolute -right-3 -top-3 h-12 w-12 rounded-full"
        style={{ background: color, border: `2.5px solid ${C.ink}` }}
      />
      <p
        className="relative text-[11px] font-bold uppercase tracking-wide"
        style={{ color: C.muted, ...accent }}
      >
        {label}
      </p>
      <p
        className="mt-1.5 text-[26px] font-extrabold leading-none"
        style={{ ...display, color: C.ink }}
      >
        {value}
      </p>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
          style={{
            background: up ? C.turqSoft : C.yellowSoft,
            color: up ? "#0a5a54" : "#7a5600",
            border: `1.5px solid ${C.ink}`,
            ...accent,
          }}
        >
          {up ? (
            <ArrowUpRight size={12} aria-hidden="true" />
          ) : (
            <ArrowDownRight size={12} aria-hidden="true" />
          )}
          {trend}
        </span>
        <svg
          viewBox="0 0 100 32"
          preserveAspectRatio="none"
          className="h-8 w-[92px]"
          aria-hidden="true"
        >
          <polyline
            points={pts}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Card>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept59() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ color: C.ink, background: C.cream, ...body }}
    >
      {/* Terrazzo-achtergrond */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ backgroundImage: TERRAZZO_BG, backgroundSize: "260px 240px" }}
      />
      {/* Vaste decoratie-elementen rond de rand */}
      <Squiggle className="left-[240px] top-6 hidden lg:block" color={C.coral} />
      <Zigzag className="right-10 top-4 hidden sm:block" color={C.turq} />
      <Blob className="-left-4 bottom-16 hidden opacity-90 lg:block" color={C.violet} />
      <Confetti className="bottom-4 right-4 hidden opacity-90 md:block" />

      <div className="relative flex min-h-[680px]">
        {/* Zijbalk */}
        <aside className="hidden w-[236px] shrink-0 flex-col p-4 md:flex">
          <div className="flex items-center gap-3 px-1 pb-6 pt-1">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{
                background: C.coral,
                border: `2.5px solid ${C.ink}`,
                boxShadow: `3px 4px 0 0 ${C.ink}`,
              }}
            >
              <Sparkles size={20} style={{ color: C.ink }} aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <div className="text-[17px] font-extrabold tracking-tight" style={display}>
                Memphis
              </div>
              <div className="text-[11px] font-semibold" style={{ color: C.muted, ...accent }}>
                ZZP · werkplek
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-2" aria-label="Hoofdnavigatie">
            {SCREENS.map((s, i) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              const accentColor = [C.coral, C.turq, C.yellow, C.violet][i % 4];
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] font-bold transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16130f] focus-visible:ring-offset-2"
                  style={{
                    color: C.ink,
                    background: on ? accentColor : "transparent",
                    border: `2.5px solid ${on ? C.ink : "transparent"}`,
                    boxShadow: on ? `3px 3px 0 0 ${C.ink}` : "none",
                    ...body,
                  }}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{
                      background: on ? C.paper : C.creamDeep,
                      border: `2px solid ${C.ink}`,
                    }}
                  >
                    <Icon size={15} aria-hidden="true" />
                  </span>
                  <span className="flex-1">{s.label}</span>
                  {on && <Star size={14} aria-hidden="true" fill={C.ink} />}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <Card className="p-3.5" color={C.turqSoft} shadow={C.ink}>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-extrabold"
                  style={{ background: C.paper, border: `2.5px solid ${C.ink}`, ...display }}
                >
                  {PROFIEL.initialen}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold">{PROFIEL.naam}</div>
                  <div
                    className="flex items-center gap-1 text-[11px] font-semibold"
                    style={{ color: "#0a5a54", ...accent }}
                  >
                    <BadgeCheck size={12} aria-hidden="true" /> {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-16 shrink-0 items-center gap-3 px-5 sm:px-7"
            style={{ borderBottom: `2.5px solid ${C.ink}` }}
          >
            <h2 className="truncate text-[16px] font-extrabold tracking-tight" style={display}>
              {SCREENS.find((s) => s.key === screen)?.label}
            </h2>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="hidden items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16130f] focus-visible:ring-offset-2 sm:flex"
                style={{
                  background: C.paper,
                  border: `2.5px solid ${C.ink}`,
                  color: C.muted,
                  ...accent,
                }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoeken…</span>
              </button>
              <button
                className="relative rounded-full p-2.5 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16130f] focus-visible:ring-offset-2"
                style={{ background: C.yellow, border: `2.5px solid ${C.ink}`, color: C.ink }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-extrabold"
                  style={{
                    background: C.coral,
                    color: C.paper,
                    border: `2px solid ${C.ink}`,
                    ...accent,
                  }}
                  aria-hidden="true"
                >
                  2
                </span>
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div className="flex gap-2 overflow-x-auto px-4 py-2.5 md:hidden">
            {SCREENS.map((s, i) => {
              const on = s.key === screen;
              const accentColor = [C.coral, C.turq, C.yellow, C.violet][i % 4];
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16130f]"
                  style={{
                    color: C.ink,
                    background: on ? accentColor : C.paper,
                    border: `2px solid ${C.ink}`,
                    ...body,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {screen === "dashboard" && <Dashboard onOpen={open} />}
            {screen === "marktplaats" && (
              <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
            )}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({ onOpen }: { onOpen: (id?: string) => void }) {
  const KPI_COLORS = [C.coral, C.turq, C.yellow, C.violet];
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kickerColor={C.turq}
          kicker="Overzicht"
          title={`Hoi ${PROFIEL.naam.split(" ")[0]}, alles op één bord`}
          note="Je belangrijkste cijfers, matches en acties in één speels overzicht. Eén certificaat vraagt aandacht."
        />
        <Chip tone="green">
          <BadgeCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
        </Chip>
      </div>

      {/* KPI's */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <KpiTile key={k.label} {...k} color={KPI_COLORS[i % 4] as string} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches */}
        <div className="space-y-6 lg:col-span-2">
          <Card as="section" className="overflow-hidden" color={C.paper}>
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: `2.5px solid ${C.ink}`, background: C.coralSoft }}
            >
              <h3 className="flex items-center gap-2 text-[15px] font-extrabold" style={display}>
                <Store size={16} aria-hidden="true" /> Beste matches
              </h3>
              <span className="text-[11px] font-bold" style={{ color: C.muted, ...accent }}>
                verklaarbaar gesorteerd
              </span>
            </div>
            <div>
              {OPDRACHTEN.map((o, i) => (
                <button
                  key={o.id}
                  onClick={() => onOpen(o.id)}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-[#f6efe1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#16130f]"
                  style={{ borderTop: i === 0 ? "none" : `2px solid ${C.creamDeep}` }}
                >
                  <MatchBadge value={o.match} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold">{o.titel}</p>
                    <p
                      className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] font-medium"
                      style={{ color: C.muted }}
                    >
                      <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-right sm:block">
                    <span className="block text-[14px] font-extrabold" style={accent}>
                      {o.tarief}
                    </span>
                    <span className="text-[11px] font-medium" style={{ color: C.muted }}>
                      {o.uren}
                    </span>
                  </span>
                  <ChevronRight size={18} aria-hidden="true" style={{ color: C.ink }} />
                </button>
              ))}
            </div>
          </Card>

          {/* Berichten */}
          <Card as="section" className="overflow-hidden" color={C.paper}>
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: `2.5px solid ${C.ink}`, background: C.turqSoft }}
            >
              <h3 className="text-[15px] font-extrabold" style={display}>
                Berichten
              </h3>
              <Chip tone="red">{ongelezen} ongelezen</Chip>
            </div>
            {BERICHTEN.map((b, i) => (
              <div
                key={b.van}
                className="flex items-center gap-3.5 px-4 py-3.5"
                style={{ borderTop: i === 0 ? "none" : `2px solid ${C.creamDeep}` }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold"
                  style={{
                    background: b.ongelezen ? C.yellow : C.paper,
                    border: `2.5px solid ${C.ink}`,
                    ...display,
                  }}
                >
                  {b.initialen}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-bold">{b.van}</p>
                    {b.ongelezen && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                        style={{ background: C.coral, color: C.paper, ...accent }}
                      >
                        nieuw
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[12px] font-medium" style={{ color: C.muted }}>
                    {b.preview}
                  </p>
                </div>
                <span
                  className="shrink-0 text-[11px] font-semibold"
                  style={{ color: C.faint, ...accent }}
                >
                  {b.tijd}
                </span>
              </div>
            ))}
          </Card>
        </div>

        {/* Zijkolom */}
        <div className="space-y-6">
          {/* Waarschuwing */}
          <Card className="relative overflow-hidden p-5" color={C.yellowSoft} shadow={C.coral}>
            <span
              aria-hidden="true"
              className="absolute -right-4 -top-4 h-14 w-14 rotate-12 rounded-lg"
              style={{ background: C.coral, border: `2.5px solid ${C.ink}` }}
            />
            <div className="relative flex items-center gap-2">
              <AlertTriangle size={15} aria-hidden="true" />
              <span
                className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
                style={{ color: "#7a5600", ...accent }}
              >
                Let op · nu
              </span>
            </div>
            <p className="relative mt-2 text-[17px] font-extrabold leading-snug" style={display}>
              {ACTIES[0]?.titel}
            </p>
            <p
              className="relative mt-1.5 text-[12.5px] font-medium leading-relaxed"
              style={{ color: C.inkSoft }}
            >
              {ACTIES[0]?.detail}
            </p>
            <button
              onClick={() => onOpen()}
              className="relative mt-4 w-full rounded-full py-2.5 text-[13px] font-extrabold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16130f] focus-visible:ring-offset-2"
              style={{ background: C.ink, color: C.paper, border: `2.5px solid ${C.ink}` }}
            >
              {ACTIES[0]?.cta}
            </button>
          </Card>

          {/* Certificaten */}
          <Card className="overflow-hidden" color={C.paper}>
            <div
              className="px-5 py-3.5"
              style={{ borderBottom: `2.5px solid ${C.ink}`, background: C.violetSoft }}
            >
              <h3 className="flex items-center gap-2 text-[15px] font-extrabold" style={display}>
                <BadgeCheck size={16} aria-hidden="true" /> Certificaten
              </h3>
            </div>
            <div className="space-y-0">
              {CREDENTIALS.map((c, i) => {
                const st = statusStyle(c.status);
                return (
                  <div
                    key={c.naam}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderTop: i === 0 ? "none" : `2px solid ${C.creamDeep}` }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: TONE[st.tone].soft, border: `2px solid ${C.ink}` }}
                    >
                      <st.Icon size={14} style={{ color: TONE[st.tone].ink }} aria-hidden="true" />
                    </span>
                    <p className="min-w-0 flex-1 truncate text-[12.5px] font-bold">{c.naam}</p>
                    <Chip tone={st.tone}>{st.label}</Chip>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Ronde match-badge met dikke omtrek.
function MatchBadge({ value }: { value: number }) {
  const tone: Tone = value >= 90 ? "green" : value >= 80 ? "amber" : "violet";
  return (
    <span
      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full"
      style={{ background: TONE[tone].soft, border: `2.5px solid ${C.ink}` }}
      role="img"
      aria-label={`Match ${value} procent`}
    >
      <span
        className="text-[15px] font-extrabold leading-none"
        style={{ ...display, color: TONE[tone].ink }}
      >
        {value}
      </span>
      <span className="text-[8px] font-bold uppercase" style={{ color: C.muted, ...accent }}>
        match
      </span>
    </span>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({
  activeId,
  onSelect,
  onOpen,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onOpen: (id?: string) => void;
}) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const sel = filtered.find((o) => o.id === activeId) ?? filtered[0];

  const refresh = () => {
    setLoading(true);
    window.setTimeout(() => setLoading(false), 800);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kickerColor={C.coral}
          kicker="Marktplaats"
          title="Open opdrachten"
          note="Verklaarbaar gesorteerd op je geverifieerde profiel. Selecteer links om details te zien."
        />
        <button
          onClick={refresh}
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-extrabold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16130f] focus-visible:ring-offset-2"
          style={{
            background: C.turq,
            color: C.ink,
            border: `2.5px solid ${C.ink}`,
            boxShadow: `3px 3px 0 0 ${C.ink}`,
          }}
        >
          <RotateCw size={14} aria-hidden="true" className={loading ? "animate-spin" : ""} />{" "}
          Vernieuwen
        </button>
      </div>

      <Card className="flex items-center gap-3 px-4 py-2.5" color={C.paper}>
        <Search size={16} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] font-medium outline-none placeholder:text-[#a79f8f]"
          style={{ color: C.ink }}
        />
        <span
          className="shrink-0 text-[12px] font-bold tabular-nums"
          style={{ color: C.muted, ...accent }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="flex items-center gap-4 p-4" color={C.paper}>
              <div
                className="h-12 w-12 shrink-0 animate-pulse rounded-full"
                style={{ background: C.creamDeep }}
              />
              <div className="flex-1 space-y-2">
                <div
                  className="h-4 w-2/3 animate-pulse rounded-full"
                  style={{ background: C.creamDeep }}
                />
                <div
                  className="h-3 w-1/3 animate-pulse rounded-full"
                  style={{ background: C.creamDeep }}
                />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="relative overflow-hidden px-6 py-16 text-center" color={C.paper}>
          <Confetti className="left-4 top-4 opacity-70" />
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: C.yellow, border: `2.5px solid ${C.ink}` }}
            aria-hidden="true"
          >
            <Search size={26} />
          </div>
          <p className="mt-4 text-[17px] font-extrabold" style={display}>
            Niks gevonden
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[13px] font-medium" style={{ color: C.muted }}>
            We vinden geen opdracht voor &quot;{q}&quot;. Probeer een bredere zoekterm.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-extrabold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16130f] focus-visible:ring-offset-2"
            style={{ background: C.coral, color: C.paper, border: `2.5px solid ${C.ink}` }}
          >
            Zoekopdracht wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-4">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  className="w-full text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none"
                  aria-pressed={on}
                >
                  <div
                    className="relative flex items-center gap-4 rounded-[18px] p-4"
                    style={{
                      background: on ? C.yellowSoft : C.paper,
                      border: `2.5px solid ${C.ink}`,
                      boxShadow: on ? `5px 6px 0 0 ${C.coral}` : `4px 5px 0 0 ${C.ink}`,
                    }}
                  >
                    <MatchBadge value={o.match} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[11px] font-bold"
                          style={{ color: C.faint, ...accent }}
                        >
                          {o.id}
                        </span>
                      </div>
                      <p className="truncate text-[15px] font-extrabold leading-snug">{o.titel}</p>
                      <p
                        className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] font-medium"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <span className="block text-[15px] font-extrabold" style={accent}>
                        {o.tarief}
                      </span>
                      <span className="text-[11px] font-medium" style={{ color: C.muted }}>
                        {o.uren}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <Card className="sticky top-4 h-fit overflow-hidden" color={C.paper}>
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: `2.5px solid ${C.ink}`, background: C.turqSoft }}
              >
                <span className="text-[12px] font-extrabold" style={accent}>
                  Detail
                </span>
                <span className="text-[11px] font-bold" style={{ color: C.muted, ...accent }}>
                  {sel.id}
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <MatchBadge value={sel.match} />
                  <h3 className="text-[17px] font-extrabold leading-tight" style={display}>
                    {sel.titel}
                  </h3>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { l: "Tarief", v: sel.tarief },
                    { l: "Omvang", v: sel.uren },
                    { l: "Start", v: sel.start },
                  ].map((m, i) => (
                    <div
                      key={m.l}
                      className="rounded-xl p-2 text-center"
                      style={{
                        background: [C.coralSoft, C.yellowSoft, C.turqSoft][i],
                        border: `2px solid ${C.ink}`,
                      }}
                    >
                      <div
                        className="text-[9px] font-bold uppercase"
                        style={{ color: C.muted, ...accent }}
                      >
                        {m.l}
                      </div>
                      <div
                        className="mt-0.5 text-[12px] font-extrabold leading-tight"
                        style={accent}
                      >
                        {m.v}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {sel.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                      style={{ background: C.creamDeep, border: `2px solid ${C.ink}`, ...accent }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => onOpen(sel.id)}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-[13px] font-extrabold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16130f] focus-visible:ring-offset-2"
                  style={{ background: C.ink, color: C.paper, border: `2.5px solid ${C.ink}` }}
                >
                  Opdracht openen <ChevronRight size={15} aria-hidden="true" />
                </button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 900);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="relative overflow-hidden p-5 sm:p-7" color={C.paper}>
        <span
          aria-hidden="true"
          className="absolute -right-6 -top-6 h-20 w-20 rotate-12 rounded-2xl"
          style={{ background: C.yellowSoft, border: `2.5px solid ${C.ink}` }}
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <MatchBadge value={opdracht.match} />
            <div>
              <Kicker color={C.turq}>{opdracht.id}</Kicker>
              <h1
                className="mt-2 text-[24px] font-extrabold leading-tight tracking-tight"
                style={display}
              >
                {opdracht.titel}
              </h1>
              <p
                className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold"
                style={{ color: C.muted }}
              >
                <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {opdracht.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                    style={{ background: C.creamDeep, border: `2px solid ${C.ink}`, ...accent }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-6 py-2.5 text-[14px] font-extrabold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16130f] focus-visible:ring-offset-2 disabled:translate-y-0"
            style={{
              background: state === "sent" ? C.turq : C.coral,
              color: state === "sent" ? C.ink : C.paper,
              border: `2.5px solid ${C.ink}`,
              boxShadow: `3px 4px 0 0 ${C.ink}`,
            }}
          >
            {state === "sending" && (
              <Loader2 size={15} aria-hidden="true" className="animate-spin" />
            )}
            {state === "sent" && <Check size={16} aria-hidden="true" />}
            {state === "idle" && <Send size={15} aria-hidden="true" />}
            {state === "idle" ? "Reageer nu" : state === "sending" ? "Versturen…" : "Verstuurd!"}
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, c: C.coral },
          { l: "Omvang", v: opdracht.uren, c: C.turq },
          { l: "Start", v: opdracht.start, c: C.yellow },
          { l: "Match", v: `${opdracht.match}%`, c: C.violet },
        ].map((m) => (
          <Card key={m.l} className="overflow-hidden p-4" color={C.paper}>
            <span
              aria-hidden="true"
              className="absolute -right-2 -top-2 h-8 w-8 rounded-full"
              style={{ background: m.c, border: `2px solid ${C.ink}` }}
            />
            <p
              className="relative text-[10px] font-bold uppercase"
              style={{ color: C.muted, ...accent }}
            >
              {m.l}
            </p>
            <p className="relative mt-1.5 text-[17px] font-extrabold leading-tight" style={display}>
              {m.v}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-6" color={C.paper}>
        <h3 className="flex items-center gap-2 text-[16px] font-extrabold" style={display}>
          <Sparkles size={17} aria-hidden="true" /> Waarom deze match?
        </h3>
        <p className="mt-1 text-[12.5px] font-medium" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je geverifieerde profiel.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div
            className="rounded-2xl p-4"
            style={{ background: C.turqSoft, border: `2.5px solid ${C.ink}` }}
          >
            <p
              className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wide"
              style={{ color: "#0a5a54", ...accent }}
            >
              <Check size={14} aria-hidden="true" /> Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2 text-[13px] font-medium">
                  <Check
                    size={15}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                    style={{ color: "#0a5a54" }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="rounded-2xl p-4"
            style={{ background: C.yellowSoft, border: `2.5px solid ${C.ink}` }}
          >
            <p
              className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wide"
              style={{ color: "#7a5600", ...accent }}
            >
              <AlertTriangle size={14} aria-hidden="true" /> Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2 text-[13px] font-medium"
                  style={{ color: C.inkSoft }}
                >
                  <Minus
                    size={15}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                    style={{ color: "#7a5600" }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const attention = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;
  const pct = Math.round((verified / total) * 100);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHead
        kickerColor={C.violet}
        kicker="Verificatie"
        title="Certificaten & documenten"
        note="Groen betekent geverifieerd, geel vraagt aandacht, rood is actie nodig. Status staat er altijd als label bij."
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[220px_1fr]">
        <Card
          className="relative overflow-hidden p-5 text-center"
          color={C.turqSoft}
          shadow={C.ink}
        >
          <Blob className="-right-3 -top-3 opacity-60" color={C.paper} />
          <p
            className="text-[11px] font-bold uppercase tracking-wide"
            style={{ color: "#0a5a54", ...accent }}
          >
            Gereedheid
          </p>
          <p className="mt-2 text-[44px] font-extrabold leading-none" style={display}>
            {pct}%
          </p>
          <p className="mt-1 text-[12px] font-semibold" style={{ color: C.inkSoft }}>
            {verified} van {total} geverifieerd
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Chip tone="green">{verified} veilig</Chip>
            <Chip tone="amber">{attention} actie</Chip>
          </div>
        </Card>

        <Card className="overflow-hidden" color={C.paper}>
          <div
            className="px-5 py-3.5"
            style={{ borderBottom: `2.5px solid ${C.ink}`, background: C.coralSoft }}
          >
            <h3 className="text-[15px] font-extrabold" style={display}>
              Jouw certificaten
            </h3>
          </div>
          {CREDENTIALS.map((c, i) => {
            const st = statusStyle(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#f6efe1]"
                style={{ borderTop: i === 0 ? "none" : `2px solid ${C.creamDeep}` }}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: TONE[st.tone].soft, border: `2.5px solid ${C.ink}` }}
                >
                  {c.status === "SUBMITTED" ? (
                    <Loader2
                      size={18}
                      className="animate-spin"
                      style={{ color: TONE[st.tone].ink }}
                      aria-hidden="true"
                    />
                  ) : (
                    <st.Icon size={18} style={{ color: TONE[st.tone].ink }} aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold">{c.naam}</p>
                  <p className="text-[12px] font-medium" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <Chip tone={st.tone}>{st.label}</Chip>
              </div>
            );
          })}
        </Card>
      </div>

      <Card className="overflow-hidden" color={C.paper}>
        <div
          className="px-5 py-3.5"
          style={{ borderBottom: `2.5px solid ${C.ink}`, background: C.yellowSoft }}
        >
          <h3 className="flex items-center gap-2 text-[15px] font-extrabold" style={display}>
            <FileText size={16} aria-hidden="true" /> Documenten
          </h3>
        </div>
        {DOCUMENTEN.map((d, i) => {
          const st = statusStyle(d.status);
          return (
            <div
              key={d.naam}
              className="flex items-center gap-3.5 px-4 py-3.5"
              style={{ borderTop: i === 0 ? "none" : `2px solid ${C.creamDeep}` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: C.creamDeep, border: `2px solid ${C.ink}` }}
                aria-hidden="true"
              >
                <FileText size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold">{d.naam}</p>
                <p
                  className="truncate text-[11.5px] font-medium"
                  style={{ color: C.muted, ...accent }}
                >
                  {d.type} · {d.grootte} · {d.bijgewerkt}
                </p>
              </div>
              <Chip tone={st.tone}>{st.label}</Chip>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties() {
  const meta: Record<
    "warning" | "info",
    { tone: Tone; Icon: LucideIcon; label: string; color: string }
  > = {
    warning: { tone: "amber", Icon: AlertTriangle, label: "Waarschuwing", color: C.yellow },
    info: { tone: "green", Icon: Bell, label: "Melding", color: C.turq },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHead
        kickerColor={C.coral}
        kicker="Acties"
        title="Wat je nu kunt doen"
        note="Op volgorde van urgentie. Elke actie brengt je profiel weer helemaal op orde."
      />
      <div className="space-y-4">
        {ACTIES.map((a, i) => {
          const m = meta[a.urgentie];
          return (
            <Card key={a.titel} className="relative flex items-start gap-4 p-5" color={C.paper}>
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[16px] font-extrabold"
                style={{ background: m.color, border: `2.5px solid ${C.ink}`, ...display }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Chip tone={m.tone}>
                    <m.Icon size={12} aria-hidden="true" /> {m.label}
                  </Chip>
                </div>
                <p className="mt-2 text-[15px] font-extrabold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px] font-medium" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-center rounded-full px-4 py-2 text-[12.5px] font-extrabold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16130f] focus-visible:ring-offset-2"
                style={{ background: C.ink, color: C.paper, border: `2.5px solid ${C.ink}` }}
              >
                {a.cta}
              </button>
            </Card>
          );
        })}
      </div>
      <Card className="flex items-center gap-4 p-5" color={C.turqSoft} shadow={C.ink}>
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ background: C.paper, border: `2.5px solid ${C.ink}` }}
        >
          <Check size={20} aria-hidden="true" style={{ color: "#0a5a54" }} />
        </span>
        <p className="text-[13px] font-medium leading-relaxed" style={{ color: C.inkSoft }}>
          Zodra je deze acties afrondt staat je profiel weer helemaal op orde. Nieuwe acties
          verschijnen hier vanzelf.
        </p>
      </Card>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusMeta: Record<string, { tone: Tone; Icon: LucideIcon; label: string }> = {
    Betaald: { tone: "green", Icon: Check, label: "Betaald" },
    Openstaand: { tone: "amber", Icon: Clock, label: "Openstaand" },
    Concept: { tone: "violet", Icon: FileText, label: "Concept" },
  };
  const totaalBetaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const totaalOpen = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kickerColor={C.violet}
          kicker="Facturen"
          title="Kasstroom"
          note="Betaald, openstaand en concept in één blik."
        />
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-extrabold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16130f] focus-visible:ring-offset-2"
          style={{
            background: C.coral,
            color: C.paper,
            border: `2.5px solid ${C.ink}`,
            boxShadow: `3px 3px 0 0 ${C.ink}`,
          }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="relative overflow-hidden p-5" color={C.turqSoft} shadow={C.ink}>
          <Blob className="-right-4 -top-4 opacity-50" color={C.paper} />
          <p
            className="text-[11px] font-bold uppercase tracking-wide"
            style={{ color: "#0a5a54", ...accent }}
          >
            Ontvangen
          </p>
          <p className="mt-1.5 text-[26px] font-extrabold leading-none" style={display}>
            € {totaalBetaald.toLocaleString("nl-NL")}
          </p>
        </Card>
        <Card className="relative overflow-hidden p-5" color={C.yellowSoft} shadow={C.ink}>
          <span
            aria-hidden="true"
            className="absolute -right-3 -top-3 h-12 w-12 rotate-12 rounded-lg"
            style={{ background: C.paper, border: `2.5px solid ${C.ink}` }}
          />
          <p
            className="relative text-[11px] font-bold uppercase tracking-wide"
            style={{ color: "#7a5600", ...accent }}
          >
            Openstaand
          </p>
          <p className="relative mt-1.5 text-[26px] font-extrabold leading-none" style={display}>
            € {totaalOpen.toLocaleString("nl-NL")}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden" color={C.paper}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[11px] font-extrabold uppercase tracking-wide"
                style={{
                  color: C.ink,
                  borderBottom: `2.5px solid ${C.ink}`,
                  background: C.creamDeep,
                  ...accent,
                }}
              >
                <th className="px-5 py-3.5">Nummer</th>
                <th className="px-5 py-3.5">Klant</th>
                <th className="hidden px-5 py-3.5 sm:table-cell">Datum</th>
                <th className="px-5 py-3.5 text-right">Bedrag</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const m = statusMeta[f.status] ?? statusMeta.Concept!;
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#f6efe1]"
                    style={{ borderTop: i === 0 ? "none" : `2px solid ${C.creamDeep}` }}
                  >
                    <td
                      className="px-5 py-4 text-[12px] font-bold tabular-nums"
                      style={{ color: C.inkSoft, ...accent }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-bold">{f.klant}</td>
                    <td
                      className="hidden px-5 py-4 text-[12px] font-medium tabular-nums sm:table-cell"
                      style={{ color: C.muted, ...accent }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[13px] font-extrabold tabular-nums"
                      style={accent}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <Chip tone={m.tone}>
                          <m.Icon size={12} aria-hidden="true" /> {m.label}
                        </Chip>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
