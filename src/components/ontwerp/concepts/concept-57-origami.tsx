"use client";

// Concept 57 — "Origami" · Gevouwen papier & facetten (LICHT).
// Panelen als gevouwen papiervlakken: subtiele vouwlijnen (linear-gradients die een knik-
// schaduw suggereren), facetten met licht/donker-vlakken alsof papier vouwt, geometrische
// hoeken en een gevouwen-hoek (dog-ear) micro-detail op kaarten. Papierwit met één rustige
// accentkleur (vermiljoen, als een gevouwen kraanvogel). Diepte ontstaat door facet-
// belichting — een lichte en een donkere helft per vouw — niet door zachte slagschaduw
// (dat zou neumorfisme zijn; bewust vermeden, geen overlap met Relief). Ook géén
// axonometrisch 3D zoals Isometrie: dit zijn platte, gevouwen facetten met knik-belichting.
// Elegant, ambachtelijk-modern, tactiel.
// Palet: papier #f4f0e6, vlak #faf7f0, licht-facet #fffdf8, schaduw-facet #ece6d8,
// inkt #2b2a26, accent vermiljoen #c0532f.
// Fonts: --font-lab-fraunces (display) + --font-lab-jakarta (body).

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListChecks,
  Receipt,
  Search,
  Bell,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  Plus,
  MapPin,
  FileText,
  Send,
  Loader2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Sparkle,
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
  paper: "#f4f0e6",
  panel: "#faf7f0",
  panelHi: "#fffdf8",
  panelLo: "#ece6d8",
  ink: "#2b2a26",
  inkSoft: "#55524a",
  muted: "#8a8578",
  faint: "#b4ae9e",
  line: "#ded7c6",
  lineSoft: "#e8e2d4",
  crease: "#d6cdb8",
  accent: "#c0532f",
  accentDeep: "#9e3f21",
  accentSoft: "#f6e6dd",
  accentLine: "#e7c6b8",
  green: "#3f7a55",
  greenSoft: "#e3efe1",
  greenLine: "#c3ddc2",
  amber: "#96660f",
  amberSoft: "#f4e9cf",
  amberLine: "#e6d3a4",
  red: "#b23a34",
  redSoft: "#f5e1dd",
  redLine: "#e6c3bd",
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const body = { fontFamily: "var(--font-lab-jakarta)" };

type Tone = "green" | "amber" | "red" | "accent";

const TONE: Record<Tone, { fg: string; soft: string; line: string }> = {
  green: { fg: C.green, soft: C.greenSoft, line: C.greenLine },
  amber: { fg: C.amber, soft: C.amberSoft, line: C.amberLine },
  red: { fg: C.red, soft: C.redSoft, line: C.redLine },
  accent: { fg: C.accent, soft: C.accentSoft, line: C.accentLine },
};

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
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

/* ---------- Gevouwen-papier primitieven ---------- */

// De diagonale knik-belichting: een lichte helft die naar een schaduwhelft vouwt.
const foldFace = (angle = 152) =>
  `linear-gradient(${angle}deg, ${C.panelHi} 0%, ${C.panel} 46%, ${C.panelLo} 100%)`;

// Dog-ear: een gevouwen hoek rechtsboven met licht/donker-facet en een knikschaduw eronder.
function DogEar({ size = 20 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute right-0 top-0"
      style={{ width: size, height: size }}
    >
      {/* knikschaduw die de omgeslagen hoek werpt */}
      <span
        className="absolute right-0 top-0"
        style={{
          width: size,
          height: size,
          background: C.crease,
          clipPath: "polygon(100% 0, 0 0, 100% 100%)",
          borderTopRightRadius: 13,
          opacity: 0.6,
        }}
      />
      {/* de omgeslagen flap zelf — donkerder achterkant papier, gevouwen naar binnen */}
      <span
        className="absolute right-[1px] top-[1px]"
        style={{
          width: size - 3,
          height: size - 3,
          background: `linear-gradient(225deg, ${C.panelLo} 0%, ${C.paper} 60%, ${C.lineSoft} 100%)`,
          clipPath: "polygon(100% 0, 0 0, 100% 100%)",
          borderTopRightRadius: 12,
        }}
      />
    </span>
  );
}

function Facet({
  children,
  className = "",
  dogEar = false,
  crease = true,
  angle = 152,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  dogEar?: boolean;
  crease?: boolean;
  angle?: number;
  as?: "div" | "section";
}) {
  const Comp = as;
  return (
    <Comp
      className={`relative rounded-[13px] ${className}`}
      style={{
        background: foldFace(angle),
        border: `1px solid ${C.line}`,
        boxShadow: `0 1px 0 rgba(255,255,255,0.7) inset`,
      }}
    >
      {crease && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[13px]"
          style={{
            background: `linear-gradient(106deg, transparent 0 49.4%, ${C.crease} 49.6%, rgba(255,255,255,0.85) 50.2%, transparent 50.8%)`,
            mixBlendMode: "multiply",
            opacity: 0.4,
          }}
        />
      )}
      {dogEar && <DogEar />}
      {children}
    </Comp>
  );
}

// De faceted match-diamant: een gevouwen ruit met vier facetten (licht boven, schaduw onder).
function MatchDiamond({ value, size = 56 }: { value: number; size?: number }) {
  const tone: Tone = value >= 90 ? "accent" : value >= 80 ? "green" : "amber";
  const stroke = TONE[tone].fg;
  const gid = `fold-${value}-${size}`;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      role="img"
      aria-label={`Matchscore ${value} procent`}
    >
      <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id={`${gid}-hi`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.panelHi} />
            <stop offset="100%" stopColor={C.panel} />
          </linearGradient>
          <linearGradient id={`${gid}-lo`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.panel} />
            <stop offset="100%" stopColor={C.panelLo} />
          </linearGradient>
        </defs>
        {/* vier gevouwen facetten vanuit het midden */}
        <polygon points="24,24 24,2 46,24" fill={`url(#${gid}-hi)`} />
        <polygon points="24,24 2,24 24,2" fill={`url(#${gid}-hi)`} />
        <polygon points="24,24 46,24 24,46" fill={`url(#${gid}-lo)`} />
        <polygon points="24,24 24,46 2,24" fill={`url(#${gid}-lo)`} />
        {/* vouwlijnen */}
        <line x1="24" y1="2" x2="24" y2="46" stroke={C.crease} strokeWidth="0.6" />
        <line x1="2" y1="24" x2="46" y2="24" stroke={C.crease} strokeWidth="0.6" />
        {/* buitenrand van de ruit */}
        <polygon
          points="24,2 46,24 24,46 2,24"
          fill="none"
          stroke={stroke}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold tabular-nums"
        style={{ ...display, color: stroke }}
      >
        {value}
      </span>
    </span>
  );
}

// Gevouwen voortgangsstrook — facetten in plaats van een gladde balk.
function FoldBar({ value, tone = "accent" }: { value: number; tone?: Tone }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className="relative h-2.5 w-full overflow-hidden rounded-full"
      style={{ background: C.panelLo }}
      role="img"
      aria-label={`${pct} procent`}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: `repeating-linear-gradient(115deg, ${TONE[tone].fg} 0 7px, ${TONE[tone].fg}cc 7px 14px)`,
        }}
      />
    </div>
  );
}

/* ---------- Chips, kickers, koppen ---------- */

function Chip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold"
      style={{
        color: TONE[tone].fg,
        background: TONE[tone].soft,
        border: `1px solid ${TONE[tone].line}`,
      }}
    >
      {children}
    </span>
  );
}

function StatusChip({ status }: { status: CredStatus }) {
  const st = statusStyle(status);
  return (
    <Chip tone={st.tone}>
      <st.Icon size={12} aria-hidden="true" /> {st.label}
    </Chip>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.24em]"
      style={{ ...body, color: C.accent }}
    >
      <Sparkle size={11} aria-hidden="true" /> {children}
    </span>
  );
}

function SectionHead({ kicker, title, note }: { kicker: string; title: string; note?: string }) {
  return (
    <div>
      <Kicker>{kicker}</Kicker>
      <h1
        className="mt-2 text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {note && (
        <p
          className="mt-2 max-w-2xl text-[13.5px] leading-relaxed"
          style={{ ...body, color: C.inkSoft }}
        >
          {note}
        </p>
      )}
    </div>
  );
}

function AccentButton({
  children,
  onClick,
  className = "",
  disabled = false,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c0532f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f0e6] disabled:opacity-70 disabled:hover:translate-y-0 ${className}`}
      style={{
        ...body,
        background: `linear-gradient(150deg, ${C.accent}, ${C.accentDeep})`,
        color: "#fdf6f2",
        boxShadow: `0 1px 0 rgba(255,255,255,0.25) inset`,
      }}
    >
      {children}
    </button>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept57() {
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
      style={{ ...body, color: C.ink, background: C.paper }}
    >
      {/* fijne papier-vouwstructuur op de achtergrond */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(152deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 46px), repeating-linear-gradient(28deg, rgba(0,0,0,0.02) 0 1px, transparent 1px 46px)`,
          maskImage: "radial-gradient(130% 100% at 50% 0%, #000 55%, transparent 100%)",
        }}
      />

      <div className="relative flex min-h-[680px]">
        {/* Zijbalk */}
        <aside className="hidden w-[228px] shrink-0 flex-col p-4 md:flex">
          <div className="flex items-center gap-3 px-2 pb-6 pt-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: `linear-gradient(150deg, ${C.accent}, ${C.accentDeep})`,
                boxShadow: `0 1px 0 rgba(255,255,255,0.3) inset`,
              }}
            >
              {/* gevouwen kraanvogel-glyph */}
              <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
                <polygon points="12,3 20,12 12,10" fill="#fdf1ec" opacity="0.95" />
                <polygon points="12,3 4,12 12,10" fill="#f6cdbd" />
                <polygon points="12,10 20,12 12,21" fill="#fbe0d6" />
                <polygon points="12,10 4,12 12,21" fill="#f2b9a5" />
              </svg>
            </span>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold tracking-tight" style={display}>
                Origami
              </div>
              <div className="text-[10px]" style={{ color: C.muted }}>
                ZZP · gevouwen werk
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1" aria-label="Hoofdnavigatie">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c0532f]"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? foldFace(150) : "transparent",
                    border: `1px solid ${on ? C.line : "transparent"}`,
                    boxShadow: on ? "0 1px 0 rgba(255,255,255,0.7) inset" : "none",
                  }}
                >
                  <Icon size={16} aria-hidden="true" style={{ color: on ? C.accent : C.faint }} />
                  <span className="flex-1 font-medium">{s.label}</span>
                  {on && (
                    <span
                      className="h-4 w-1 rounded-full"
                      style={{ background: C.accent }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <Facet className="p-3.5" dogEar>
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold"
                  style={{
                    background: C.accentSoft,
                    color: C.accentDeep,
                    border: `1px solid ${C.accentLine}`,
                  }}
                >
                  {PROFIEL.initialen}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</div>
                  <div
                    className="flex items-center gap-1.5 text-[10.5px]"
                    style={{ color: C.green }}
                  >
                    <ShieldCheck size={11} aria-hidden="true" /> {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </Facet>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-16 shrink-0 items-center gap-3 px-5 sm:px-7"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <h2 className="truncate text-[15px] font-semibold tracking-tight" style={display}>
              {SCREENS.find((s) => s.key === screen)?.label}
            </h2>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="hidden items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] transition-colors hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c0532f] sm:flex"
                style={{ border: `1px solid ${C.line}`, color: C.muted, background: C.panel }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoek opdrachten…</span>
              </button>
              <button
                className="relative rounded-lg p-2.5 transition-colors hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c0532f]"
                style={{ border: `1px solid ${C.line}`, color: C.inkSoft, background: C.panel }}
                aria-label="Meldingen, 2 ongelezen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
                  style={{ background: C.accent, border: `1.5px solid ${C.panel}` }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div className="flex gap-1.5 overflow-x-auto px-4 py-2 md:hidden">
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c0532f]"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? C.panel : "transparent",
                    border: `1px solid ${on ? C.line : C.lineSoft}`,
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
            {screen === "acties" && <Acties onOpen={open} />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-[13px] p-4"
          style={{ background: foldFace(150), border: `1px solid ${C.line}` }}
        >
          <div
            className="h-3 w-20 rounded-full motion-safe:animate-pulse"
            style={{ background: C.panelLo }}
          />
          <div
            className="mt-3 h-6 w-16 rounded-md motion-safe:animate-pulse"
            style={{ background: C.panelLo }}
          />
          <div
            className="mt-3 h-2.5 w-full rounded-full motion-safe:animate-pulse"
            style={{ background: C.lineSoft }}
          />
        </div>
      ))}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: (id?: string) => void }) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(t);
  }, []);
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kicker="Gevouwen overzicht"
          title={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}`}
          note="Elk vlak is een gevouwen blad — één kant vangt het licht, de andere de schaduw. Eén waarschuwing vraagt vandaag om aandacht."
        />
        <Chip tone="green">
          <Check size={12} aria-hidden="true" /> Profiel op orde
        </Chip>
      </div>

      {/* KPI-facetten */}
      {loading ? (
        <KpiSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Facet key={k.label} className="p-4" dogEar angle={i % 2 === 0 ? 150 : 128}>
              <p
                className="text-[11px] font-medium uppercase tracking-wide"
                style={{ color: C.muted }}
              >
                {k.label}
              </p>
              <div className="mt-2 flex items-end justify-between gap-2">
                <span
                  className="text-[24px] font-semibold leading-none tracking-tight"
                  style={display}
                >
                  {k.value}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
                  style={{ color: k.up ? C.green : C.amber }}
                >
                  {k.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
              </div>
              <div className="mt-3">
                <FoldBar
                  value={digits(k.value) > 100 ? 72 : digits(k.value)}
                  tone={k.up ? "accent" : "amber"}
                />
              </div>
            </Facet>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Beste matches */}
          <Facet className="overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <h3 className="text-[14px] font-semibold tracking-tight" style={display}>
                Beste matches
              </h3>
              <span className="text-[11px]" style={{ color: C.muted }}>
                verklaarbaar gesorteerd
              </span>
            </div>
            <div>
              {OPDRACHTEN.map((o, i) => (
                <button
                  key={o.id}
                  onClick={() => onOpen(o.id)}
                  className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#fffdf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c0532f]"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <MatchDiamond value={o.match} size={52} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold">{o.titel}</p>
                    <p
                      className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px]"
                      style={{ color: C.muted }}
                    >
                      <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-[13px] font-semibold tabular-nums">{o.tarief}</p>
                    <p className="text-[11px]" style={{ color: C.muted }}>
                      {o.uren}
                    </p>
                  </div>
                  <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
                </button>
              ))}
            </div>
          </Facet>

          {/* Berichten */}
          <Facet className="overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <h3 className="text-[14px] font-semibold tracking-tight" style={display}>
                Berichten
              </h3>
              <Chip tone="accent">{ongelezen} ongelezen</Chip>
            </div>
            {BERICHTEN.map((b, i) => (
              <div
                key={b.van}
                className="flex items-center gap-3.5 px-4 py-3.5"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10.5px] font-semibold"
                  style={{
                    background: b.ongelezen ? C.accentSoft : C.panelLo,
                    color: b.ongelezen ? C.accentDeep : C.muted,
                    border: `1px solid ${b.ongelezen ? C.accentLine : C.line}`,
                  }}
                >
                  {b.initialen}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[12.5px] font-semibold">{b.van}</p>
                    {b.ongelezen && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: C.accent }}
                        aria-hidden="true"
                      />
                    )}
                    {b.ongelezen && <span className="sr-only">ongelezen</span>}
                  </div>
                  <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                    {b.preview}
                  </p>
                </div>
                <span className="shrink-0 text-[10.5px] tabular-nums" style={{ color: C.faint }}>
                  {b.tijd}
                </span>
              </div>
            ))}
          </Facet>
        </div>

        {/* Zijkolom */}
        <div className="space-y-6">
          <Facet className="p-5" dogEar>
            <h3 className="mb-3 text-[14px] font-semibold" style={display}>
              Certificaten
            </h3>
            <div className="space-y-3">
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div key={c.naam} className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: TONE[st.tone].soft,
                        border: `1px solid ${TONE[st.tone].line}`,
                      }}
                    >
                      <st.Icon size={14} style={{ color: TONE[st.tone].fg }} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium">{c.naam}</p>
                    </div>
                    <span
                      className="text-[10.5px] font-semibold"
                      style={{ color: TONE[st.tone].fg }}
                    >
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Facet>

          {/* Waarschuwing */}
          <div
            className="relative overflow-hidden rounded-[13px] p-5"
            style={{
              background: `linear-gradient(150deg, ${C.accentSoft}, ${C.redSoft})`,
              border: `1px solid ${C.accentLine}`,
            }}
          >
            <DogEar />
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} style={{ color: C.accentDeep }} aria-hidden="true" />
              <span
                className="text-[10.5px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: C.accentDeep }}
              >
                Waarschuwing
              </span>
            </div>
            <p className="mt-2 text-[15px] font-semibold leading-snug" style={display}>
              {ACTIES[0]?.titel}
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: C.inkSoft }}>
              {ACTIES[0]?.detail}
            </p>
            <AccentButton onClick={() => onOpen()} className="mt-4 w-full">
              {ACTIES[0]?.cta}
            </AccentButton>
          </div>
        </div>
      </div>
    </div>
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
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const sel = filtered.find((o) => o.id === activeId) ?? filtered[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <SectionHead
        kicker="Marktplaats"
        title="Open opdrachten"
        note="Selecteer links; de gevouwen detailkaart rechts vouwt de gekozen opdracht open."
      />

      <Facet className="flex items-center gap-3 px-4 py-2.5">
        <Search size={16} aria-hidden="true" style={{ color: C.accent }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#8a8578]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Facet>

      {filtered.length === 0 ? (
        <Facet className="px-6 py-16 text-center" dogEar>
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: C.panelLo, border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Search size={22} style={{ color: C.accent }} />
          </span>
          <p className="mt-4 text-[16px] font-semibold" style={display}>
            Niets gevouwen om te tonen
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen opdracht voor &quot;{q}&quot;. Verbreed je zoekopdracht om meer te zien.
          </p>
          <AccentButton onClick={() => setQ("")} className="mt-5">
            Zoekopdracht wissen
          </AccentButton>
        </Facet>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  className="w-full text-left focus-visible:outline-none"
                >
                  <div
                    className="relative flex items-center gap-4 rounded-[13px] p-4 transition-transform hover:-translate-y-0.5"
                    style={{
                      background: foldFace(on ? 128 : 152),
                      border: `1px solid ${on ? C.accentLine : C.line}`,
                      boxShadow: on
                        ? `0 1px 0 rgba(255,255,255,0.7) inset, 0 0 0 1px ${C.accentSoft}`
                        : "0 1px 0 rgba(255,255,255,0.7) inset",
                    }}
                  >
                    <DogEar />
                    <MatchDiamond value={o.match} size={54} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]" style={{ color: C.faint }}>
                          {o.id}
                        </span>
                        {on && (
                          <span className="text-[10px] font-semibold" style={{ color: C.accent }}>
                            geselecteerd
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[14px] font-semibold leading-snug">{o.titel}</p>
                      <p
                        className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-[13px] font-semibold tabular-nums">{o.tarief}</p>
                      <p className="mt-0.5 text-[10.5px]" style={{ color: C.muted }}>
                        {o.uren}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <Facet className="sticky top-4 h-fit p-5" dogEar angle={128}>
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: C.muted }}
                >
                  {sel.id}
                </span>
                <Chip tone={sel.match >= 90 ? "accent" : "green"}>
                  <MatchDiamond value={sel.match} size={16} /> match
                </Chip>
              </div>
              <div className="mt-4 flex flex-col items-center text-center">
                <MatchDiamond value={sel.match} size={82} />
                <p className="mt-3 text-[16px] font-semibold" style={display}>
                  {sel.titel}
                </p>
                <p
                  className="mt-1 flex items-center gap-1.5 text-[12px]"
                  style={{ color: C.muted }}
                >
                  <MapPin size={12} aria-hidden="true" /> {sel.opdrachtgever} · {sel.plaats}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { l: "Tarief", v: sel.tarief },
                  { l: "Omvang", v: sel.uren },
                  { l: "Start", v: sel.start },
                ].map((m) => (
                  <div
                    key={m.l}
                    className="rounded-lg px-2 py-2 text-center"
                    style={{ background: C.panelLo, border: `1px solid ${C.line}` }}
                  >
                    <div
                      className="text-[9px] uppercase tracking-[0.12em]"
                      style={{ color: C.muted }}
                    >
                      {m.l}
                    </div>
                    <div className="mt-0.5 text-[11.5px] font-semibold">{m.v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {sel.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md px-2 py-0.5 text-[10.5px]"
                    style={{
                      color: C.inkSoft,
                      background: C.panelHi,
                      border: `1px solid ${C.line}`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <AccentButton onClick={() => onOpen(sel.id)} className="mt-5 w-full">
                Opdracht openen <ChevronRight size={14} aria-hidden="true" />
              </AccentButton>
            </Facet>
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
      <Facet className="p-5 sm:p-7" dogEar>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <MatchDiamond value={opdracht.match} size={78} />
            <div>
              <Kicker>{opdracht.id}</Kicker>
              <h1
                className="mt-1.5 text-[24px] font-semibold leading-tight tracking-tight"
                style={display}
              >
                {opdracht.titel}
              </h1>
              <p
                className="mt-1.5 flex items-center gap-1.5 text-[12.5px]"
                style={{ color: C.inkSoft }}
              >
                <MapPin size={13} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {opdracht.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md px-2 py-0.5 text-[10.5px]"
                    style={{
                      color: C.inkSoft,
                      background: C.panelHi,
                      border: `1px solid ${C.line}`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <AccentButton onClick={react} disabled={state !== "idle"} className="shrink-0 px-5">
            {state === "sending" && (
              <Loader2 size={15} aria-hidden="true" className="animate-spin" />
            )}
            {state === "sent" && <Check size={15} aria-hidden="true" />}
            {state === "idle" && <Send size={14} aria-hidden="true" />}
            {state === "idle"
              ? "Reageer op opdracht"
              : state === "sending"
                ? "Versturen…"
                : "Reactie verstuurd"}
          </AccentButton>
        </div>
      </Facet>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <Facet key={m.l} className="p-4" angle={i % 2 === 0 ? 150 : 128}>
            <p
              className="text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ color: C.muted }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[17px] font-semibold tracking-tight" style={display}>
              {m.v}
            </p>
          </Facet>
        ))}
      </div>

      <Facet className="p-6">
        <h3 className="text-[16px] font-semibold" style={display}>
          Waarom deze match
        </h3>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je geverifieerde profiel.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.green }}
            >
              <Check size={13} aria-hidden="true" /> Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded"
                    style={{ background: C.greenSoft, border: `1px solid ${C.greenLine}` }}
                    aria-hidden="true"
                  >
                    <Check size={11} style={{ color: C.green }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.amber }}
            >
              <Minus size={13} aria-hidden="true" /> Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded"
                    style={{ background: C.amberSoft, border: `1px solid ${C.amberLine}` }}
                    aria-hidden="true"
                  >
                    <Minus size={11} style={{ color: C.amber }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Facet>
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
        kicker="Verificatie"
        title="Certificaten & documenten"
        note="Elk bewijsstuk is een gevouwen blad met een eigen status. Groen = veilig, amber = aandacht, rood = actie."
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[240px_1fr]">
        <Facet className="p-5" dogEar>
          <p
            className="text-[11px] font-medium uppercase tracking-[0.16em]"
            style={{ color: C.muted }}
          >
            Gereedheid
          </p>
          <p className="mt-2 text-[34px] font-semibold leading-none tracking-tight" style={display}>
            {pct}%
          </p>
          <div className="mt-3">
            <FoldBar value={pct} tone="green" />
          </div>
          <div className="mt-4 flex gap-2">
            <Chip tone="green">{verified} veilig</Chip>
            <Chip tone="amber">{attention} actie</Chip>
          </div>
        </Facet>

        <Facet className="overflow-hidden">
          <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            <h3 className="text-[14px] font-semibold" style={display}>
              Certificatenlijst
            </h3>
          </div>
          {CREDENTIALS.map((c, i) => {
            const st = statusStyle(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#fffdf8]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: TONE[st.tone].soft,
                    border: `1px solid ${TONE[st.tone].line}`,
                  }}
                >
                  {c.status === "SUBMITTED" ? (
                    <Loader2
                      size={16}
                      className="motion-safe:animate-spin"
                      style={{ color: TONE[st.tone].fg }}
                      aria-hidden="true"
                    />
                  ) : (
                    <st.Icon size={16} style={{ color: TONE[st.tone].fg }} aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold">{c.naam}</p>
                  <p className="text-[11.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <StatusChip status={c.status} />
              </div>
            );
          })}
        </Facet>
      </div>

      <Facet className="overflow-hidden">
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
          <h3 className="text-[14px] font-semibold" style={display}>
            Documentenarchief
          </h3>
        </div>
        {DOCUMENTEN.map((d, i) => {
          const st = statusStyle(d.status);
          return (
            <div
              key={d.naam}
              className="flex items-center gap-3.5 px-4 py-3.5"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: C.panelLo, border: `1px solid ${C.line}` }}
                aria-hidden="true"
              >
                <FileText size={15} style={{ color: C.accent }} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold">{d.naam}</p>
                <p className="truncate text-[11px]" style={{ color: C.muted }}>
                  {d.type} · {d.grootte} · {d.bijgewerkt}
                </p>
              </div>
              <span className="hidden sm:block">
                <StatusChip status={d.status} />
              </span>
              <span className="sm:hidden">
                <st.Icon size={16} style={{ color: TONE[st.tone].fg }} aria-hidden="true" />
              </span>
            </div>
          );
        })}
      </Facet>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onOpen }: { onOpen: (id?: string) => void }) {
  const meta: Record<"warning" | "info", { tone: Tone; Icon: LucideIcon; label: string }> = {
    warning: { tone: "amber", Icon: AlertTriangle, label: "Waarschuwing" },
    info: { tone: "accent", Icon: Bell, label: "Melding" },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHead
        kicker="Acties"
        title="Volgende beste stappen"
        note="Op volgorde van urgentie — netjes gevouwen zodat je precies weet wat nu telt."
      />
      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const m = meta[a.urgentie];
          return (
            <Facet key={a.titel} className="flex items-start gap-4 p-5" dogEar={i === 0}>
              <span className="flex flex-col items-center gap-2 pt-0.5">
                <span className="text-[10px] font-semibold tabular-nums" style={{ color: C.faint }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: TONE[m.tone].soft,
                    border: `1px solid ${TONE[m.tone].line}`,
                  }}
                >
                  <m.Icon size={18} style={{ color: TONE[m.tone].fg }} aria-hidden="true" />
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <Chip tone={m.tone}>{m.label}</Chip>
                <p className="mt-2 text-[14px] font-semibold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onOpen()}
                className="shrink-0 self-center rounded-lg px-4 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c0532f]"
                style={{
                  color: TONE[m.tone].fg,
                  background: TONE[m.tone].soft,
                  border: `1px solid ${TONE[m.tone].line}`,
                }}
              >
                {a.cta}
              </button>
            </Facet>
          );
        })}
      </div>
      <Facet className="flex items-center gap-4 p-5">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: C.greenSoft, border: `1px solid ${C.greenLine}` }}
        >
          <Check size={18} style={{ color: C.green }} aria-hidden="true" />
        </span>
        <p className="text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Meer heb je nu niet te doen. Nieuwe acties vouwen we hier voor je open zodra ze relevant
          worden.
        </p>
      </Facet>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusTone: Record<string, Tone> = {
    Betaald: "green",
    Openstaand: "amber",
    Concept: "accent",
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
          kicker="Facturen"
          title="Kasstroom"
          note="Betaald en openstaand, netjes gevouwen."
        />
        <AccentButton className="shrink-0">
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </AccentButton>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Facet className="p-5" dogEar>
          <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: C.muted }}>
            Ontvangen
          </p>
          <p
            className="mt-1.5 text-[22px] font-semibold tabular-nums tracking-tight"
            style={{ ...display, color: C.green }}
          >
            € {totaalBetaald.toLocaleString("nl-NL")}
          </p>
        </Facet>
        <Facet className="p-5" dogEar>
          <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: C.muted }}>
            Openstaand
          </p>
          <p
            className="mt-1.5 text-[22px] font-semibold tabular-nums tracking-tight"
            style={{ ...display, color: C.amber }}
          >
            € {totaalOpen.toLocaleString("nl-NL")}
          </p>
        </Facet>
      </div>

      <Facet className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.muted, borderBottom: `1px solid ${C.line}` }}
              >
                <th className="px-5 py-3.5 font-semibold">Nummer</th>
                <th className="px-5 py-3.5 font-semibold">Klant</th>
                <th className="hidden px-5 py-3.5 font-semibold sm:table-cell">Datum</th>
                <th className="px-5 py-3.5 text-right font-semibold">Bedrag</th>
                <th className="px-5 py-3.5 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const tone = statusTone[f.status] ?? "accent";
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#fffdf8]"
                    style={{ borderTop: `1px solid ${C.lineSoft}` }}
                  >
                    <td className="px-5 py-4 text-[12px] tabular-nums" style={{ color: C.inkSoft }}>
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-medium">{f.klant}</td>
                    <td
                      className="hidden px-5 py-4 text-[12px] tabular-nums sm:table-cell"
                      style={{ color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-5 py-4 text-right text-[13px] font-semibold tabular-nums">
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <Chip tone={tone}>{f.status}</Chip>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Facet>
    </div>
  );
}
