"use client";

// Concept 516 — "Metronoom" · Motion/ritme-gedreven. Micro-interactie als designtaal: pulserende
// status-dots, slide-in-accenten, voortgangsbalken, skeleton-shimmer op de loading-state en een
// ritmisch, consistent bewegingsvocabulaire. Beweging is functioneel — het leidt de blik naar wat nu
// telt. Strak neutraal canvas met één levendige violet-accent zodat de motion opvalt. Alle animaties
// respecteren prefers-reduced-motion. Status altijd met label + icoon.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  Briefcase,
  Check,
  ChevronRight,
  Clock,
  FileText,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Minus,
  Plus,
  Radio,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Waves,
  X,
  Zap,
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

// ————————————————————————————— Palet — neutraal canvas + violet-accent —————————————————————————————
const C = {
  bg: "#0f1015",
  panel: "#171922",
  raise: "#1e212c",
  sink: "#12141b",
  line: "#282c39",
  lineSoft: "#20232f",

  ink: "#f2f3f8",
  inkSoft: "#c3c7d4",
  inkMute: "#868ca0",
  inkFaint: "#5b6175",

  accent: "#7c5cff",
  accentBright: "#9b82ff",
  accentSoft: "rgba(124,92,255,0.16)",

  pos: "#33d69f",
  posSoft: "rgba(51,214,159,0.15)",
  info: "#48b0f7",
  infoSoft: "rgba(72,176,247,0.15)",
  warnSoft: "rgba(245,178,58,0.16)",
  neg: "#ff6472",
  negSoft: "rgba(255,100,114,0.15)",
};
const WARN = "#f5b23a";

const sans: CSSProperties = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b82ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1015]";

// ————————————————————————————— Status-taal —————————————————————————————
type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.pos,
        soft: C.posSoft,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return { base: C.info, soft: C.infoSoft, label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return {
        base: WARN,
        soft: C.warnSoft,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.neg, soft: C.negSoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

function factuurTone(status: string): {
  base: string;
  soft: string;
  label: string;
  Icon: LucideIcon;
} {
  if (status === "Betaald") return { base: C.pos, soft: C.posSoft, label: "Betaald", Icon: Check };
  if (status === "Openstaand")
    return { base: WARN, soft: C.warnSoft, label: "Openstaand", Icon: Clock };
  if (status === "Concept")
    return { base: C.info, soft: C.infoSoft, label: "Concept", Icon: FileText };
  return { base: C.neg, soft: C.negSoft, label: status, Icon: AlertTriangle };
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

// ————————————————————————————— Primitives —————————————————————————————
function Panel({
  children,
  className = "",
  as: Tag = "div",
  raise = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  raise?: boolean;
  style?: CSSProperties;
}) {
  return (
    <Tag
      className={`rounded-[14px] ${className}`}
      style={{ background: raise ? C.raise : C.panel, border: `1px solid ${C.line}`, ...style }}
    >
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
  ariaLabel,
  ariaExpanded,
  full = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  full?: boolean;
}) {
  const pad = size === "sm" ? "px-3 py-1.5 text-[12.5px]" : "px-4 py-2.5 text-[13.5px]";
  const base = `mn-btn inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold tracking-[-0.01em] ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? { background: C.accent, color: "#fff", border: `1px solid ${C.accentBright}`, ...sans }
      : variant === "outline"
        ? { background: "transparent", color: C.ink, border: `1px solid ${C.line}`, ...sans }
        : { background: "transparent", color: C.inkSoft, border: "1px solid transparent", ...sans };
  const hover =
    variant === "solid"
      ? "hover:brightness-110"
      : variant === "outline"
        ? "hover:border-[#7c5cff]"
        : "hover:bg-[#1e212c]";
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
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: base, background: soft, border: `1px solid ${base}33`, ...sans }}
    >
      <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
        {alarm && (
          <span
            className="mn-ping absolute inline-flex h-full w-full rounded-full"
            style={{ background: base }}
          />
        )}
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{ background: base }}
        />
      </span>
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// Pulserende live-dot
function LiveDot({ tone }: { tone: string }) {
  return (
    <span className="relative flex h-2 w-2" aria-hidden="true">
      <span
        className="mn-ping absolute inline-flex h-full w-full rounded-full"
        style={{ background: tone }}
      />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: tone }} />
    </span>
  );
}

// Match als voortgangsbalk met glans-animatie
function MatchBar({ value, delay = 0 }: { value: number; delay?: number }) {
  const tone = value >= 90 ? C.pos : value >= 85 ? C.accent : WARN;
  return (
    <span className="block" aria-label={`Match ${value} procent`}>
      <span className="flex items-baseline justify-between">
        <span
          className="text-[9.5px] font-bold uppercase tracking-[0.14em]"
          style={{ color: C.inkFaint }}
        >
          match
        </span>
        <span className="text-[13px] font-bold leading-none" style={{ color: tone }}>
          {value}%
        </span>
      </span>
      <span
        className="mt-1 block h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: C.lineSoft }}
        aria-hidden="true"
      >
        <span
          className="mn-grow block h-full rounded-full"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${tone}, ${C.accentBright})`,
            animationDelay: `${delay}ms`,
          }}
        />
      </span>
    </span>
  );
}

function Kicker({ children, tone = C.accentBright }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em]"
      style={{ color: tone, ...sans }}
    >
      {children}
    </span>
  );
}

function ScreenHead({
  kicker,
  title,
  sub,
  right,
}: {
  kicker: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <Kicker>
          <Radio size={13} aria-hidden="true" /> {kicker}
        </Kicker>
        <h1
          className="mt-2 text-[26px] font-bold leading-tight tracking-[-0.02em] md:text-[30px]"
          style={{ color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-1 max-w-xl text-[13.5px]" style={{ color: C.inkMute }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

const NAV_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Search,
  opdracht: Briefcase,
  verificatie: Award,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: FileText,
};

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept516() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [selId, setSelId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === selId) ?? (OPDRACHTEN[0] as Opdracht);
  const open = (id: string) => {
    setSelId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="min-h-[760px] w-full antialiased"
      style={{ ...sans, color: C.ink, background: C.bg }}
    >
      <div className="mx-auto flex max-w-6xl">
        <Sidebar screen={screen} setScreen={setScreen} />
        <div className="min-w-0 flex-1">
          <TopBar />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="mn-enter px-4 pb-24 pt-6 sm:px-6 md:px-8">
            {screen === "dashboard" && (
              <Dashboard
                onOpen={open}
                onMarkt={() => setScreen("marktplaats")}
                onActies={() => setScreen("acties")}
                onFacturen={() => setScreen("facturen")}
              />
            )}
            {screen === "marktplaats" && <Marktplaats selId={selId} onOpen={open} />}
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
        @keyframes mnEnter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .mn-enter { animation: mnEnter 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes mnSlide { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: none; } }
        .mn-slide { animation: mnSlide 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes mnPing { 75%, 100% { transform: scale(2.4); opacity: 0; } }
        .mn-ping { animation: mnPing 1.5s cubic-bezier(0,0,0.2,1) infinite; }
        @keyframes mnGrow { from { width: 0 !important; } }
        .mn-grow { animation: mnGrow 0.9s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes mnShimmer { 100% { transform: translateX(100%); } }
        .mn-skel { position: relative; overflow: hidden; background: ${C.lineSoft}; }
        .mn-skel::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, ${C.raise}, transparent); animation: mnShimmer 1.4s infinite; }
        .mn-btn { transition: transform 0.18s cubic-bezier(0.22,1,0.36,1), filter 0.18s ease, border-color 0.18s ease, background 0.18s ease; }
        .mn-btn:hover { transform: translateY(-1px); }
        .mn-btn:active { transform: translateY(0) scale(0.98); }
        .mn-row { transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease; }
        .mn-row:hover { background: ${C.raise}; transform: translateX(3px); }
        .mn-nav { transition: background 0.2s ease, color 0.2s ease; }
        .mn-bar { transition: width 0.9s cubic-bezier(0.22,1,0.36,1); }
        @media (prefers-reduced-motion: reduce) {
          .mn-enter, .mn-slide, .mn-ping, .mn-grow, .mn-skel::after { animation: none !important; }
          .mn-btn:hover, .mn-row:hover { transform: none !important; }
          .mn-btn, .mn-row, .mn-bar { transition: none !important; }
        }
      `}</style>
    </div>
  );
}

// —————————————————————————————————————— Sidebar ——————————————————————————————————————
function Sidebar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <aside
      className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col md:flex"
      style={{ background: C.panel, borderRight: `1px solid ${C.line}` }}
    >
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-[11px]"
          style={{ background: C.accent, color: "#fff" }}
          aria-hidden="true"
        >
          <Waves size={18} />
        </span>
        <span>
          <span
            className="block text-[15px] font-bold leading-none tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            Metronoom
          </span>
          <span
            className="mt-1 flex items-center gap-1.5 text-[10.5px]"
            style={{ color: C.inkMute }}
          >
            <LiveDot tone={C.pos} /> live ritme
          </span>
        </span>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-1">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICON[s.key];
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`mn-nav relative flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-left text-[13.5px] font-medium ${RING}`}
                  style={on ? { background: C.accentSoft, color: C.ink } : { color: C.inkSoft }}
                >
                  {on && (
                    <span
                      className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full"
                      style={{ background: C.accentBright }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon
                    size={16}
                    aria-hidden="true"
                    style={{ color: on ? C.accentBright : C.inkMute }}
                  />
                  {s.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-4" style={{ borderTop: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold"
            style={{ background: C.accent, color: "#fff" }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-semibold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </span>
            <span className="flex items-center gap-1 text-[10.5px]" style={{ color: C.pos }}>
              <ShieldCheck size={10} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header
      className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 sm:px-6 md:px-8"
      style={{
        background: `${C.bg}e6`,
        borderBottom: `1px solid ${C.line}`,
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        className="flex flex-1 items-center gap-2.5 rounded-[10px] px-3.5 py-2.5"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <Search size={15} aria-hidden="true" style={{ color: C.inkFaint }} />
        <span className="text-[12.5px]" style={{ color: C.inkFaint }}>
          Zoek opdrachten, documenten, berichten…
        </span>
      </div>
      <span
        className="hidden items-center gap-2 rounded-[10px] px-3.5 py-2.5 text-[12px] font-semibold sm:inline-flex"
        style={{
          background: C.accentSoft,
          color: C.accentBright,
          border: `1px solid ${C.accent}44`,
        }}
      >
        <Activity size={14} aria-hidden="true" /> 3 nieuwe matches
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
      style={{ borderBottom: `1px solid ${C.line}`, background: C.panel }}
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`mn-btn shrink-0 rounded-[9px] px-3.5 py-1.5 text-[12.5px] font-semibold ${RING}`}
            style={
              on
                ? { background: C.accent, color: "#fff" }
                : { color: C.inkSoft, background: C.raise }
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
  onFacturen,
}: {
  onOpen: (id: string) => void;
  onMarkt: () => void;
  onActies: () => void;
  onFacturen: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <ScreenHead
        kicker="Live overzicht"
        title={`Op ritme, ${PROFIEL.naam.split(" ")[0]}.`}
        sub="Beweging leidt je blik naar wat nu telt."
        right={
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" onClick={onFacturen}>
              <Receipt size={14} aria-hidden="true" /> Facturen
            </Btn>
            <Btn variant="solid" size="sm" onClick={onActies}>
              Volgende actie <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k, i) => (
          <Panel
            key={k.label}
            className="mn-slide p-5"
            style={{ animationDelay: `${i * 70}ms` } as CSSProperties}
          >
            <p className="text-[11.5px] font-semibold" style={{ color: C.inkMute }}>
              {k.label}
            </p>
            <p
              className="mt-2 text-[27px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.ink }}
            >
              {k.value}
            </p>
            <div className="mt-3">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{ color: k.up ? C.pos : WARN, background: k.up ? C.posSoft : C.warnSoft }}
              >
                {k.up ? (
                  <ArrowRight size={12} className="-rotate-45" aria-hidden="true" />
                ) : (
                  <ArrowRight size={12} className="rotate-45" aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <MiniBars data={k.spark} />
          </Panel>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <Kicker>
              <Briefcase size={13} aria-hidden="true" /> Aanbevolen opdrachten
            </Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className={`text-[12px] font-semibold ${RING}`}
              style={{ color: C.accentBright }}
            >
              Alles →
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => onOpen(o.id)}
                  className={`mn-row flex w-full items-center gap-4 px-5 py-4 text-left ${RING}`}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <span className="w-24 shrink-0">
                    <MatchBar value={o.match} delay={i * 100} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14.5px] font-semibold"
                      style={{ color: C.ink }}
                    >
                      {o.titel}
                    </span>
                    <span
                      className="mt-0.5 flex items-center gap-1 truncate text-[12px]"
                      style={{ color: C.inkMute }}
                    >
                      <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-right sm:block">
                    <span className="block text-[14px] font-bold" style={{ color: C.ink }}>
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <span className="text-[10px]" style={{ color: C.inkFaint }}>
                      per uur
                    </span>
                  </span>
                  <ChevronRight size={17} aria-hidden="true" style={{ color: C.inkFaint }} />
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-4">
          <Panel className="p-5" raise>
            <Kicker tone={C.pos}>
              <ShieldCheck size={13} aria-hidden="true" /> Dossier op orde
            </Kicker>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[36px] font-bold leading-none tracking-[-0.02em]"
                style={{ color: C.ink }}
              >
                {ratio}%
              </span>
              <span className="text-[12.5px]" style={{ color: C.inkMute }}>
                geverifieerd
              </span>
            </div>
            <span
              className="mt-3 block h-2 w-full overflow-hidden rounded-full"
              style={{ background: C.lineSoft }}
              aria-hidden="true"
            >
              <span
                className="mn-grow block h-full rounded-full"
                style={{
                  width: `${ratio}%`,
                  background: `linear-gradient(90deg, ${C.pos}, ${C.accentBright})`,
                }}
              />
            </span>
            <p className="mt-2.5 text-[12px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} certificaten · {PROFIEL.trust}.
            </p>
          </Panel>

          <Panel className="relative overflow-hidden p-5" as="article">
            <span
              className="absolute left-0 top-0 h-full w-[3px]"
              style={{ background: WARN }}
              aria-hidden="true"
            />
            <Kicker tone={WARN}>
              <AlertTriangle size={13} aria-hidden="true" /> Termijn nadert
            </Kicker>
            <h3 className="mt-2 text-[15.5px] font-semibold leading-snug" style={{ color: C.ink }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" full className="mt-4" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function MiniBars({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <span className="mt-3 flex h-8 items-end gap-1" aria-hidden="true">
      {data.map((d, i) => {
        const h = 20 + ((d - min) / span) * 80;
        const last = i === data.length - 1;
        return (
          <span
            key={i}
            className="mn-grow flex-1 rounded-t-[2px]"
            style={{
              height: `${h}%`,
              background: last ? C.accentBright : C.accentSoft,
              animationDelay: `${i * 60}ms`,
            }}
          />
        );
      })}
    </span>
  );
}

// —————————————————————————————————————— Marktplaats ——————————————————————————————————————
type Mode = "ok" | "loading" | "leeg";

function Marktplaats({ selId, onOpen }: { selId: string; onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<Mode>("ok");

  const rows = useMemo(() => {
    const n = q.toLowerCase().trim();
    return OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    );
  }, [q]);

  const empty = mode === "leeg" || rows.length === 0;

  return (
    <div className="space-y-5">
      <ScreenHead
        kicker="Marktplaats"
        title="Opdrachten in beweging"
        sub={`${rows.length} van ${OPDRACHTEN.length} sluiten aan op je geverifieerde profiel.`}
      />

      <Panel className="flex flex-col gap-2.5 p-2.5 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[10px] px-3.5 py-2.5"
          style={{ background: C.sink, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#5b6175]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className={`flex h-5 w-5 items-center justify-center rounded-full ${RING}`}
              style={{ color: C.inkMute }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <Btn
          size="sm"
          variant={mode === "loading" ? "solid" : "outline"}
          onClick={() => setMode(mode === "loading" ? "ok" : "loading")}
        >
          <RotateCcw size={13} aria-hidden="true" /> {mode === "loading" ? "Klaar" : "Laadstaat"}
        </Btn>
      </Panel>

      {mode === "loading" ? (
        <ul className="space-y-3.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="flex items-center gap-4 p-5">
                <span className="mn-skel h-12 w-24 rounded-[8px]" />
                <span className="flex-1 space-y-2.5">
                  <span className="mn-skel block h-4 w-2/3 rounded-full" />
                  <span className="mn-skel block h-3 w-1/2 rounded-full" />
                </span>
              </Panel>
            </li>
          ))}
        </ul>
      ) : empty ? (
        <Panel className="flex flex-col items-center px-6 py-16 text-center">
          <span
            className="relative flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              color: C.accentBright,
              background: C.accentSoft,
              border: `1px solid ${C.accent}40`,
            }}
            aria-hidden="true"
          >
            <span
              className="mn-ping absolute inline-flex h-full w-full rounded-full"
              style={{ background: C.accent, opacity: 0.3 }}
            />
            <Search size={28} />
          </span>
          <p className="mt-4 text-[18px] font-semibold" style={{ color: C.ink }}>
            Geen match gevonden
          </p>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            Er beweegt op dit moment niets voor {q ? `“${q}”` : "je zoekterm"}. Verruim je
            zoekopdracht.
          </p>
          <Btn
            variant="outline"
            className="mt-5"
            onClick={() => {
              setQ("");
              setMode("ok");
            }}
          >
            <RotateCcw size={13} aria-hidden="true" /> Zoekterm wissen
          </Btn>
        </Panel>
      ) : (
        <ul className="space-y-3.5">
          {rows.map((o, i) => (
            <li
              key={o.id}
              className="mn-slide"
              style={{ animationDelay: `${i * 80}ms` } as CSSProperties}
            >
              <MarktKaart opdracht={o} selected={o.id === selId} onOpen={onOpen} idx={i} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarktKaart({
  opdracht,
  selected,
  onOpen,
  idx,
}: {
  opdracht: Opdracht;
  selected: boolean;
  onOpen: (id: string) => void;
  idx: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Panel as="article" className="relative overflow-hidden">
      {selected && (
        <span
          className="absolute left-0 top-0 h-full w-[3px]"
          style={{ background: C.accentBright }}
          aria-hidden="true"
        />
      )}
      <div className="flex items-start gap-4 p-5">
        <span className="w-28 shrink-0 pt-0.5">
          <MatchBar value={opdracht.match} delay={idx * 100} />
        </span>
        <div className="min-w-0 flex-1">
          <h3
            className="text-[16px] font-semibold leading-snug tracking-[-0.01em]"
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
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{ background: C.raise, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[16px] font-bold" style={{ color: C.ink }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span className="text-[10px]" style={{ color: C.inkFaint }}>
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
          className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${RING}`}
          style={{ color: C.accentBright }}
        >
          {open ? <Minus size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" onClick={() => onOpen(opdracht.id)}>
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
              tone={C.pos}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={WARN}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Panel>
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
        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: tone }}
      >
        <Icon size={13} aria-hidden="true" /> {titel}
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
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur" },
    { l: "Omvang", v: opdracht.uren, s: "per week" },
    { l: "Aanvang", v: opdracht.start, s: "start" },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel" },
  ];
  return (
    <div className="space-y-5">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </Btn>

      <Panel className="overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2.5">
            <LiveDot tone={opdracht.match >= 90 ? C.pos : C.accentBright} />
            <span
              className="text-[12px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: opdracht.match >= 90 ? C.pos : C.accentBright }}
            >
              {opdracht.match >= 90 ? "Sterke match" : "Goede match"} · {opdracht.match}%
            </span>
          </div>
          <h1
            className="mt-3 max-w-2xl text-[27px] font-bold leading-[1.15] tracking-[-0.02em] md:text-[31px]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13.5px]" style={{ color: C.inkMute }}>
            <MapPin size={15} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{ background: C.raise, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Btn variant="solid">
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
              className="p-5"
              style={{
                borderRight: i < 3 ? `1px solid ${C.lineSoft}` : "none",
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.inkMute }}
              >
                {m.l}
              </p>
              <p className="mt-1.5 text-[19px] font-bold leading-none" style={{ color: C.ink }}>
                {m.v}
              </p>
              <p className="mt-1 text-[10.5px]" style={{ color: C.inkFaint }}>
                {m.s}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-6 md:p-8">
        <Kicker>
          <Zap size={13} aria-hidden="true" /> Motivering — navolgbaar, zonder verborgen score
        </Kicker>
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          <RedenKolom
            titel="In je voordeel"
            tone={C.pos}
            Icon={Check}
            items={opdracht.redenen.plus}
          />
          <RedenKolom
            titel="Goed om te weten"
            tone={WARN}
            Icon={AlertTriangle}
            items={opdracht.redenen.min}
          />
        </div>
      </Panel>
    </div>
  );
}

// —————————————————————————————————————— Verificatie ——————————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <ScreenHead
        kicker="Vertrouwen"
        title="Certificatenregister"
        sub={`${verified} van ${CREDENTIALS.length} geverifieerd · ${PROFIEL.trust}.`}
        right={
          <div className="text-right">
            <p
              className="text-[30px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.ink }}
            >
              {ratio}%
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: C.inkMute }}>
              op orde
            </p>
          </div>
        }
      />

      <Panel className="overflow-hidden">
        <ul>
          {CREDENTIALS.map((c, i) => {
            const t = credTone(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-3.5 px-5 py-4 text-left ${RING}`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]"
                    style={{ background: t.soft, color: t.base }}
                    aria-hidden="true"
                  >
                    <t.Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14px] font-semibold"
                      style={{ color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="block truncate text-[12px]"
                      style={{ color: t.alarm ? t.base : C.inkMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="hidden sm:inline-flex">
                    <StatusTag {...t} />
                  </span>
                  <ChevronRight
                    size={17}
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
                      className="px-5 pb-5 sm:pl-[70px]"
                      style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 14 }}
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
                      <div className="mt-3.5 flex flex-wrap gap-2">
                        <Btn size="sm" variant="solid">
                          {c.status === "EXPIRING"
                            ? "Vernieuwen"
                            : c.status === "REJECTED"
                              ? "Opnieuw indienen"
                              : "Bekijken"}
                        </Btn>
                        <Btn size="sm" variant="outline">
                          Historie
                        </Btn>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

// —————————————————————————————————————— Acties ——————————————————————————————————————
function Acties({ onMarkt, onFacturen }: { onMarkt: () => void; onFacturen: () => void }) {
  return (
    <div className="space-y-5">
      <ScreenHead
        kicker="Vandaag"
        title="Wat nu je aandacht vraagt"
        sub="Op maat van urgentie — werk van boven naar beneden."
      />
      <ol className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? WARN : C.info;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li
              key={a.titel}
              className="mn-slide"
              style={{ animationDelay: `${i * 80}ms` } as CSSProperties}
            >
              <Panel className="relative flex items-start gap-4 overflow-hidden p-5">
                <span
                  className="absolute left-0 top-0 h-full w-[3px]"
                  style={{ background: tone }}
                  aria-hidden="true"
                />
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] text-[15px] font-bold"
                  style={{ background: `${tone}22`, color: tone, ...sans }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Kicker tone={tone}>
                    {warn ? (
                      <AlertTriangle size={12} aria-hidden="true" />
                    ) : (
                      <Clock size={12} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </Kicker>
                  <h2
                    className="mt-1.5 text-[16px] font-semibold leading-snug"
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
                      onClick={goMarkt ? onMarkt : goFacturen ? onFacturen : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————————— Facturen ——————————————————————————————————————
function Facturen() {
  const totals = useMemo(() => {
    const sum = (status: string) =>
      FACTUREN.filter((f) => f.status === status).reduce((a, f) => a + parseEUR(f.bedrag), 0);
    return { betaald: sum("Betaald"), open: sum("Openstaand"), concept: sum("Concept") };
  }, []);
  const totaal = totals.betaald + totals.open + totals.concept;
  return (
    <div className="space-y-5">
      <ScreenHead
        kicker="Facturen"
        title="Je geldstroom"
        sub="Wat binnenkwam, wat onderweg is."
        right={
          <Btn variant="solid" size="sm">
            <Plus size={14} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {[
          { l: "Betaald", v: totals.betaald, tone: C.pos, Icon: Check },
          { l: "Openstaand", v: totals.open, tone: WARN, Icon: Clock },
          { l: "Concept", v: totals.concept, tone: C.info, Icon: FileText },
        ].map((s) => (
          <Panel key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11.5px] font-semibold" style={{ color: C.inkMute }}>
                {s.l}
              </p>
              <s.Icon size={15} aria-hidden="true" style={{ color: s.tone }} />
            </div>
            <p className="mt-1.5 text-[22px] font-bold leading-none" style={{ color: s.tone }}>
              {eur0.format(s.v)}
            </p>
            <span
              className="mt-3 block h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: C.lineSoft }}
              aria-hidden="true"
            >
              <span
                className="mn-grow block h-full rounded-full"
                style={{ width: totaal ? `${(s.v / totaal) * 100}%` : "0%", background: s.tone }}
              />
            </span>
          </Panel>
        ))}
      </section>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 540 }}>
            <caption className="sr-only">Facturen</caption>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={`px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] ${i === 3 ? "text-right" : ""}`}
                    style={{ color: C.inkMute }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const t = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="mn-row"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.inkSoft }}>
                      {f.nr}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[13.5px] font-semibold"
                      style={{ color: C.ink }}
                    >
                      {f.klant}
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.inkMute }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13.5px] font-bold"
                      style={{ color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusTag {...t} alarm={false} />
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
