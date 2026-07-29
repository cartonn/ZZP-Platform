"use client";

// Concept 519 — "Nachtlamp" · Warm premium-dark met lamplicht-gloed. Diepe warme houtskool/espresso
// achtergrond (nooit koud-blauw), een amber/perzik gloed-accent alsof een lamp het scherm verlicht,
// zachte vignettering en subtiele warmte-gradiënten rond actieve elementen. Rustig, cosy, premium
// avond-gevoel — hoog contrast en leesbaar. Positief = warme amber/goud, waarschuwing = koelere tint.
// Status altijd met label + icoon, nooit kleur alleen.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Hash,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Moon,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkle,
  Star,
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

// ————————————————————————————— Palet — espresso + lamplicht-amber —————————————————————————————
const C = {
  bg: "#181310",
  bgDeep: "#120e0b",
  panel: "#211a15",
  panelUp: "#2a211b",
  sink: "#1b1512",
  line: "#39302a",
  lineSoft: "#2e2621",
  ink: "#f6eee6",
  inkSoft: "#d6c8bb",
  inkMute: "#a1907f",
  inkFaint: "#7a6a5c",
  amber: "#f0a34a",
  amberSoft: "rgba(240,163,74,0.14)",
  gold: "#f4c06a",
  peach: "#f2b78a",
  pos: "#eab35a",
  posSoft: "rgba(234,179,90,0.14)",
  info: "#8fb6c9",
  infoSoft: "rgba(143,182,201,0.14)",
  warn: "#c98f5a",
  warnSoft: "rgba(201,143,90,0.16)",
  neg: "#d98a7f",
  negSoft: "rgba(217,138,127,0.16)",
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0a34a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#181310]";

// ————————————————————————————— Status-taal (label + icoon) —————————————————————————————
type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.gold,
        soft: C.posSoft,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return { base: C.info, soft: C.infoSoft, label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return {
        base: C.warn,
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
  if (status === "Betaald") return { base: C.gold, soft: C.posSoft, label: "Betaald", Icon: Check };
  if (status === "Openstaand")
    return { base: C.warn, soft: C.warnSoft, label: "Openstaand", Icon: Clock };
  return { base: C.info, soft: C.infoSoft, label: "Concept", Icon: Hash };
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
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  glow?: boolean;
}) {
  return (
    <Tag
      className={`relative rounded-2xl ${className}`}
      style={{
        background: glow ? `linear-gradient(155deg, ${C.panelUp}, ${C.panel})` : C.panel,
        border: `1px solid ${glow ? "rgba(240,163,74,0.28)" : C.line}`,
        boxShadow: glow
          ? "0 0 0 1px rgba(240,163,74,0.05), 0 18px 46px -22px rgba(240,163,74,0.35)"
          : "0 12px 30px -24px rgba(0,0,0,0.7)",
      }}
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
  const pad = size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-4 py-2.5 text-[13px]";
  const base = `inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.01em] transition-all duration-150 ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? {
          background: `linear-gradient(160deg, ${C.gold}, ${C.amber})`,
          color: "#241708",
          border: "1px solid rgba(255,220,170,0.4)",
          boxShadow: "0 10px 24px -12px rgba(240,163,74,0.65)",
          ...sans,
        }
      : variant === "outline"
        ? { background: C.panelUp, color: C.ink, border: `1px solid ${C.line}`, ...sans }
        : { background: "transparent", color: C.inkSoft, border: "1px solid transparent", ...sans };
  const hover =
    variant === "solid"
      ? "hover:brightness-105"
      : variant === "outline"
        ? "hover:bg-[#31261f]"
        : "hover:bg-[#231b16]";
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
      style={{ color: base, background: soft, border: `1px solid ${base}44`, ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// Match als warme gloeiende ring
function MatchRing({ value }: { value: number }) {
  const strong = value >= 90;
  const tone = strong ? C.gold : C.peach;
  return (
    <span
      className="relative inline-flex h-14 w-14 items-center justify-center"
      aria-label={`Match ${value} procent`}
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(${tone} ${value * 3.6}deg, ${C.lineSoft} 0deg)`,
          filter: strong ? "drop-shadow(0 0 6px rgba(244,192,106,0.5))" : "none",
        }}
        aria-hidden="true"
      />
      <span
        className="absolute inset-[3px] rounded-full"
        style={{ background: C.panel }}
        aria-hidden="true"
      />
      <span className="relative text-[13px] font-bold" style={{ color: tone, ...mono }}>
        {value}
      </span>
    </span>
  );
}

function Kicker({ children, tone = C.inkMute }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em]"
      style={{ color: tone, ...mono }}
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
}: {
  code: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div
      className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b pb-5"
      style={{ borderColor: C.line }}
    >
      <div className="min-w-0">
        <Kicker tone={C.amber}>
          <Sparkle size={12} aria-hidden="true" />
          {code}
        </Kicker>
        <h1
          className="mt-2 text-[25px] font-semibold leading-tight tracking-[-0.02em] md:text-[29px]"
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

const NAV_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Search,
  opdracht: Star,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: FileText,
};

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept519() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[760px] w-full antialiased"
      style={{
        ...sans,
        color: C.ink,
        background: `radial-gradient(1100px 620px at 74% -6%, rgba(240,163,74,0.16), transparent 60%), radial-gradient(760px 520px at 8% 108%, rgba(201,143,90,0.10), transparent 55%), ${C.bg}`,
      }}
    >
      <div className="mx-auto flex max-w-6xl">
        <Sidebar screen={screen} setScreen={setScreen} />
        <div className="min-w-0 flex-1">
          <TopBar />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="nl-fade px-4 pb-20 pt-6 sm:px-6 md:px-8">
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
        @keyframes nlFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .nl-fade { animation: nlFade 0.34s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes nlGlow { 0%,100% { opacity: 0.7; } 50% { opacity: 1; } }
        .nl-lamp { animation: nlGlow 4.5s ease-in-out infinite; }
        .nl-row { transition: background 0.16s ease; }
        .nl-row:hover { background: ${C.sink}; }
        @media (prefers-reduced-motion: reduce) { .nl-fade, .nl-lamp { animation: none !important; } .nl-row { transition: none !important; } }
      `}</style>
    </div>
  );
}

// —————————————————————————————————————— Sidebar ——————————————————————————————————————
function Sidebar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <aside
      className="sticky top-0 hidden h-screen w-[238px] shrink-0 flex-col md:flex"
      style={{ background: `${C.bgDeep}`, borderRight: `1px solid ${C.line}` }}
    >
      <div
        className="relative flex items-center gap-2.5 px-5 py-5"
        style={{ borderBottom: `1px solid ${C.lineSoft}` }}
      >
        <span
          className="nl-lamp absolute left-4 top-4 h-9 w-9 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(240,163,74,0.5), transparent 70%)",
            filter: "blur(6px)",
          }}
          aria-hidden="true"
        />
        <span
          className="relative flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: `linear-gradient(160deg, ${C.gold}, ${C.amber})`, color: "#241708" }}
          aria-hidden="true"
        >
          <Moon size={17} />
        </span>
        <span className="relative">
          <span className="block text-[14px] font-bold tracking-[-0.01em]" style={{ color: C.ink }}>
            Nachtlamp
          </span>
          <span
            className="mt-0.5 block text-[9.5px] uppercase tracking-[0.2em]"
            style={{ color: C.amber, ...mono }}
          >
            werkplek na zonsondergang
          </span>
        </span>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1 overflow-y-auto px-3 py-4">
        <p
          className="px-2 pb-2 text-[9.5px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: C.inkFaint, ...mono }}
        >
          Overzicht
        </p>
        <ul className="space-y-0.5">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICON[s.key];
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium transition-colors ${RING}`}
                  style={
                    on
                      ? {
                          background: C.amberSoft,
                          color: C.gold,
                          border: "1px solid rgba(240,163,74,0.3)",
                        }
                      : { color: C.inkSoft, border: "1px solid transparent" }
                  }
                >
                  <Icon size={15} aria-hidden="true" style={{ color: on ? C.amber : C.inkFaint }} />
                  <span className="flex-1">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-4" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
        <div
          className="mb-3 rounded-xl p-3"
          style={{ background: C.amberSoft, border: "1px solid rgba(240,163,74,0.2)" }}
        >
          <p
            className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.peach, ...mono }}
          >
            Dossier op orde
          </p>
          <p className="mt-1 text-[18px] font-bold leading-none" style={{ color: C.gold, ...mono }}>
            {verified}/{CREDENTIALS.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
            style={{
              background: `linear-gradient(160deg, ${C.gold}, ${C.amber})`,
              color: "#241708",
              ...mono,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-semibold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </span>
            <span className="flex items-center gap-1 text-[10px]" style={{ color: C.gold }}>
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
        background: `${C.bg}e6`,
        borderBottom: `1px solid ${C.line}`,
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        className="flex flex-1 items-center gap-2 rounded-full px-3.5 py-2"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <Search size={14} aria-hidden="true" style={{ color: C.inkFaint }} />
        <span className="text-[12.5px]" style={{ color: C.inkFaint }}>
          Zoek opdrachten, certificaten, facturen…
        </span>
        <span
          className="ml-auto hidden rounded-md px-1.5 py-0.5 text-[10px] font-semibold sm:inline"
          style={{ background: C.sink, color: C.inkMute, border: `1px solid ${C.line}`, ...mono }}
        >
          ⌘K
        </span>
      </div>
      <span
        className="hidden items-center gap-2 rounded-full px-3 py-2 text-[12px] font-semibold sm:inline-flex"
        style={{ background: C.warnSoft, color: C.warn, border: `1px solid ${C.warn}44` }}
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
      style={{ borderBottom: `1px solid ${C.line}`, background: C.bgDeep }}
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
            style={
              on
                ? { background: `linear-gradient(160deg, ${C.gold}, ${C.amber})`, color: "#241708" }
                : { color: C.inkSoft, background: C.panel }
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
        code="Dashboard"
        title={`Goedenavond, ${PROFIEL.naam.split(" ")[0]}.`}
        sub="Rustig moment om je werk bij te werken. Drie dingen vragen vanavond je aandacht."
        right={
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" onClick={onVerif}>
              <ShieldCheck size={13} aria-hidden="true" /> Dossier
            </Btn>
            <Btn variant="solid" size="sm" onClick={onActies}>
              Volgende actie <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <p className="text-[11px] font-medium" style={{ color: C.inkMute }}>
              {k.label}
            </p>
            <p
              className="mt-2 text-[26px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.ink, ...mono }}
            >
              {k.value}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="text-[11.5px] font-semibold"
                style={{ color: k.up ? C.gold : C.warn, ...mono }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
              <span className="inline-flex h-6 items-end gap-[3px]" aria-hidden="true">
                {k.spark.map((d, j) => {
                  const max = Math.max(...k.spark);
                  const min = Math.min(...k.spark);
                  const h = 4 + ((d - min) / (max - min || 1)) * 18;
                  const last = j === k.spark.length - 1;
                  return (
                    <span
                      key={j}
                      className="w-[3px] rounded-full"
                      style={{ height: h, background: last ? C.amber : "rgba(240,163,74,0.3)" }}
                    />
                  );
                })}
              </span>
            </div>
          </Panel>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        <Panel className="overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <Kicker tone={C.amber}>
              <Star size={12} aria-hidden="true" /> Voor jou verlicht
            </Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className={`rounded-full text-[11.5px] font-semibold ${RING}`}
              style={{ color: C.amber }}
            >
              Volledige markt →
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={onOpen}
                  className={`nl-row flex w-full items-center gap-3.5 px-5 py-4 text-left ${RING}`}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <MatchRing value={o.match} />
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14px] font-semibold"
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
                      className="text-[9.5px] uppercase tracking-[0.1em]"
                      style={{ color: C.inkFaint }}
                    >
                      p/uur
                    </span>
                  </span>
                  <ChevronRight size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-5">
          <Panel className="p-5">
            <Kicker tone={C.gold}>
              <ShieldCheck size={12} aria-hidden="true" /> Vertrouwenssaldo
            </Kicker>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[34px] font-bold leading-none tracking-[-0.02em]"
                style={{ color: C.gold, ...mono }}
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
                    className="h-1.5 flex-1 rounded-full"
                    style={{ background: c.status === "VERIFIED" ? C.gold : `${t.base}66` }}
                  />
                );
              })}
            </div>
            <p className="mt-2.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd · {PROFIEL.trust}.
            </p>
          </Panel>

          <Panel className="p-5" glow as="article">
            <Kicker tone={C.warn}>
              <AlertTriangle size={12} aria-hidden="true" /> Termijn nadert
            </Kicker>
            <h3 className="mt-2 text-[15px] font-semibold leading-snug" style={{ color: C.ink }}>
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
        title="Opdrachten die bij je passen"
        sub={`${rows.length} van ${OPDRACHTEN.length} opdrachten sluiten aan op je geverifieerde profiel.`}
      />

      <Panel className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2 rounded-full px-3.5 py-2"
          style={{ background: C.sink, border: `1px solid ${C.line}` }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#7a6a5c]"
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
              <X size={13} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5" role="group" aria-label="Sorteren">
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
      </Panel>

      {mode === "loading" ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="space-y-3 p-5">
                <div
                  className="h-4 w-2/3 animate-pulse rounded-full motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
                <div
                  className="h-3 w-1/2 animate-pulse rounded-full motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
              </Panel>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={AlertTriangle}
          tone={C.neg}
          titel="De markt kon niet laden"
          tekst="De opdrachten konden zojuist niet worden opgehaald. Probeer het rustig opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.amber}
          titel="Geen opdracht gevonden"
          tekst={`Niets voor ${q ? `“${q}”` : "je zoekterm"}. Verruim je zoekopdracht en probeer het opnieuw.`}
          cta="Zoekterm wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-4">
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
            className={`rounded text-[10.5px] uppercase tracking-[0.14em] underline-offset-2 hover:underline ${RING}`}
            style={{ color: C.inkFaint, ...mono }}
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
    <Panel className="flex flex-col items-center px-6 py-16 text-center">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ color: tone, background: `${tone}22`, border: `1px solid ${tone}44` }}
        aria-hidden="true"
      >
        <Icon size={24} />
      </span>
      <p className="mt-4 text-[18px] font-semibold" style={{ color: C.ink }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
        {tekst}
      </p>
      <Btn variant="outline" className="mt-5" onClick={onCta}>
        <RotateCcw size={13} aria-hidden="true" /> {cta}
      </Btn>
    </Panel>
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
  const tone = strong ? C.gold : C.peach;
  return (
    <Panel as="article" className="overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        <span className="shrink-0 pt-0.5">
          <MatchRing value={opdracht.match} />
          <span className="mt-2 flex justify-center">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
              style={{ color: tone, background: `${tone}1f`, border: `1px solid ${tone}44` }}
            >
              {strong ? "sterk" : "goed"}
            </span>
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 text-[10.5px]"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>#{String(index + 1).padStart(2, "0")}</span>
            <span aria-hidden="true">·</span>
            <span>{opdracht.id}</span>
          </div>
          <h3
            className="mt-1 text-[16.5px] font-semibold leading-snug tracking-[-0.01em]"
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
          <span className="text-[9.5px] uppercase tracking-[0.1em]" style={{ color: C.inkFaint }}>
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
          className={`inline-flex items-center gap-1.5 rounded-full text-[12px] font-semibold ${RING}`}
          style={{ color: C.amber }}
        >
          {open ? <X size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" onClick={onOpen}>
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
              tone={C.gold}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.warn}
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
        style={{ color: tone, ...mono }}
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
              className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
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
  const tone = strong ? C.gold : C.peach;
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur" },
    { l: "Omvang", v: opdracht.uren, s: "per week" },
    { l: "Aanvang", v: opdracht.start, s: "startdatum" },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel" },
  ];
  return (
    <div className="space-y-6">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </Btn>

      <Panel glow className="overflow-hidden">
        <div className="p-6">
          <div
            className="flex items-center gap-2 text-[11px]"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>{opdracht.id}</span>
            <span aria-hidden="true">·</span>
            <span className="font-bold uppercase tracking-[0.1em]" style={{ color: tone }}>
              {strong ? "sterke match" : "goede match"} {opdracht.match}%
            </span>
          </div>
          <h1
            className="mt-2 max-w-2xl text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] md:text-[30px]"
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
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{ background: C.sink, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
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
              className="p-4"
              style={{
                borderRight: i < 3 ? `1px solid ${C.lineSoft}` : "none",
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.inkMute, ...mono }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-bold leading-none"
                style={{ color: C.ink, ...mono }}
              >
                {m.v}
              </p>
              <p className="mt-1 text-[10.5px]" style={{ color: C.inkFaint }}>
                {m.s}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-6">
        <Kicker tone={C.amber}>
          <ListChecks size={12} aria-hidden="true" /> Navolgbaar — geen verborgen score
        </Kicker>
        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je geverifieerde profiel. Wat in je voordeel spreekt, en wat goed is om
          vooraf te weten.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.gold, ...mono }}
            >
              <Check size={13} aria-hidden="true" /> In je voordeel
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.gold }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.warn, ...mono }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.warn }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
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
    <div className="space-y-6">
      <ScreenHead
        code="Verificatie"
        title="Vertrouwensregister"
        sub={`${verified} van ${CREDENTIALS.length} certificaten geverifieerd · ${PROFIEL.trust}.`}
        right={
          <div className="text-right">
            <p
              className="text-[30px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.gold, ...mono }}
            >
              {ratio}%
            </p>
            <p
              className="text-[10px] uppercase tracking-[0.14em]"
              style={{ color: C.inkMute, ...mono }}
            >
              op orde
            </p>
          </div>
        }
      />

      <Panel className="p-4">
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
      </Panel>

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
                  className={`flex w-full items-center gap-3 px-5 py-4 text-left ${RING}`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: t.soft, color: t.base, border: `1px solid ${t.base}33` }}
                    aria-hidden="true"
                  >
                    <t.Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14px] font-semibold"
                      style={{ color: C.ink }}
                    >
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
                      className="px-5 pb-4 sm:pl-[68px]"
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
    <div className="space-y-6">
      <ScreenHead
        code="Acties"
        title="Wat vanavond je aandacht vraagt"
        sub="Op volgorde van urgentie — werk rustig van boven naar beneden."
      />
      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.amber;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Panel className="flex items-start gap-4 p-5" glow={warn}>
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold"
                  style={{
                    background: `${tone}22`,
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
        title="Je facturen"
        sub="Klik een regel om de opbouw te openen."
        right={
          <Btn variant="solid" size="sm">
            <Plus size={13} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: totals.betaald, sub: "2 facturen", tone: C.gold, Icon: Check },
          {
            l: "Openstaand",
            v: totals.open,
            sub: "1 factuur · 9 dagen",
            tone: C.warn,
            Icon: Clock,
          },
          {
            l: "Concept",
            v: totals.concept,
            sub: "klaar om te versturen",
            tone: C.info,
            Icon: Hash,
          },
        ].map((s) => (
          <Panel key={s.l} className="p-4">
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.inkMute, ...mono }}
              >
                {s.l}
              </p>
              <s.Icon size={13} aria-hidden="true" style={{ color: s.tone }} />
            </div>
            <p
              className="mt-1.5 text-[22px] font-bold leading-none"
              style={{ color: s.tone, ...mono }}
            >
              {eur0.format(s.v)}
            </p>
            <p className="mt-1 text-[11px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <Kicker tone={C.amber}>
              <Receipt size={12} aria-hidden="true" /> Facturen
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
                      className={`px-4 py-2.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] ${i === 3 ? "text-right" : ""}`}
                      style={{ color: C.inkMute, ...mono }}
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
                      className={`nl-row cursor-pointer ${RING}`}
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
                        background: on ? C.amberSoft : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3 text-[12px]"
                        style={{ color: on ? C.gold : C.inkSoft, ...mono }}
                      >
                        {f.nr}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: C.ink }}>
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
        </Panel>

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
    <Panel as="article" glow className="overflow-hidden">
      <div className="p-5" style={{ borderBottom: `1px solid ${C.line}` }}>
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: C.peach, ...mono }}
        >
          Factuur
        </p>
        <p className="text-[17px] font-bold" style={{ color: C.ink, ...mono }}>
          {factuur.nr}
        </p>
      </div>
      <div className="space-y-3 p-5 text-[12.5px]">
        <Row label="Klant" value={factuur.klant} />
        <Row label="Datum" value={factuur.datum} mono />
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
        <Row label="Subtotaal" value={eur0.format(subtotal)} mono />
        <Row label="Btw 21%" value={eur0.format(btw)} mono />
        <div className="my-3 h-px" style={{ background: `${C.gold}66` }} />
        <div className="flex items-baseline justify-between">
          <span
            className="text-[12px] font-bold uppercase tracking-[0.12em]"
            style={{ color: C.ink, ...mono }}
          >
            Totaal
          </span>
          <span className="text-[20px] font-bold" style={{ color: C.gold, ...mono }}>
            {factuur.bedrag}
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <Btn variant="solid" size="sm" full>
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
    </Panel>
  );
}

function Row({
  label,
  value,
  mono: isMono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
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
