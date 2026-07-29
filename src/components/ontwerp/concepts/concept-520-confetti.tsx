"use client";

// Concept 520 — "Confetti" · Kleurrijk-speels maar smaakvol. Levendig multi-color palet met een
// eigen accent per sectie/status, ronde vriendelijke vormen, speelse maar functionele badges en een
// vleugje viering bij positieve acties (subtiele confetti-sparks bij een geverifieerd certificaat of
// betaalde factuur). Vrolijk en energiek maar professioneel B2B — hoog contrast tekst, kleur nooit als
// enige status-drager (altijd label + icoon). Denk Duolingo-plezier op een zakelijk platform.

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
  Heart,
  LayoutGrid,
  ListChecks,
  MapPin,
  PartyPopper,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
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

// ————————————————————————————— Palet — vrolijk multi-color op zacht papier —————————————————————————————
const C = {
  bg: "#fbf7ff",
  panel: "#ffffff",
  sink: "#f6f1fb",
  line: "#ece4f5",
  lineSoft: "#f2ecf8",
  ink: "#241a33",
  inkSoft: "#4b3f5e",
  inkMute: "#7d7290",
  inkFaint: "#a89bbd",
  // sectie-accenten
  grape: "#7c3aed",
  grapeSoft: "#f0e9ff",
  ocean: "#0ea5e9",
  oceanSoft: "#e2f5fe",
  mint: "#10b981",
  mintSoft: "#dcf7ee",
  sun: "#f59e0b",
  sunSoft: "#fdf0d6",
  coral: "#f43f6e",
  coralSoft: "#fde4ea",
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf7ff]";

// ————————————————————————————— Status-taal (label + icoon) —————————————————————————————
type Tone = {
  base: string;
  soft: string;
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  feest?: boolean;
};

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.mint,
        soft: C.mintSoft,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        feest: true,
      };
    case "SUBMITTED":
      return {
        base: C.ocean,
        soft: C.oceanSoft,
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
      };
    case "EXPIRING":
      return {
        base: C.sun,
        soft: C.sunSoft,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.coral, soft: C.coralSoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

function factuurTone(status: string): {
  base: string;
  soft: string;
  label: string;
  Icon: LucideIcon;
  feest?: boolean;
} {
  if (status === "Betaald")
    return { base: C.mint, soft: C.mintSoft, label: "Betaald", Icon: Check, feest: true };
  if (status === "Openstaand")
    return { base: C.sun, soft: C.sunSoft, label: "Openstaand", Icon: Clock };
  return { base: C.ocean, soft: C.oceanSoft, label: "Concept", Icon: Hash };
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

// per-KPI kleurrotatie
const KPI_TONES = [C.grape, C.ocean, C.mint, C.sun];

// ————————————————————————————— Confetti-spark (viering) —————————————————————————————
function Confetti({ tone }: { tone: string }) {
  const dots = [
    { c: C.grape, x: "8%", y: "18%", d: "0s" },
    { c: C.ocean, x: "82%", y: "12%", d: "0.15s" },
    { c: C.sun, x: "20%", y: "78%", d: "0.3s" },
    { c: C.coral, x: "90%", y: "70%", d: "0.1s" },
    { c: tone, x: "55%", y: "8%", d: "0.22s" },
  ];
  return (
    <span className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {dots.map((d, i) => (
        <span
          key={i}
          className="cf-pop absolute h-1.5 w-1.5 rounded-full"
          style={{ background: d.c, left: d.x, top: d.y, animationDelay: d.d }}
        />
      ))}
    </span>
  );
}

// ————————————————————————————— Primitives —————————————————————————————
function Panel({
  children,
  className = "",
  as: Tag = "div",
  tone,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  tone?: string;
}) {
  return (
    <Tag
      className={`relative rounded-3xl ${className}`}
      style={{
        background: C.panel,
        border: `1.5px solid ${tone ? `${tone}44` : C.line}`,
        boxShadow: "0 14px 34px -26px rgba(70,40,120,0.4)",
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
  tone = C.grape,
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
  const pad = size === "sm" ? "px-3.5 py-1.5 text-[12px]" : "px-4 py-2.5 text-[13px]";
  const base = `inline-flex items-center justify-center gap-2 rounded-full font-bold tracking-[-0.01em] transition-all duration-150 active:scale-[0.97] ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? {
          background: tone,
          color: "#fff",
          border: `1.5px solid ${tone}`,
          boxShadow: `0 8px 20px -10px ${tone}`,
          ...sans,
        }
      : variant === "outline"
        ? { background: C.panel, color: tone, border: `1.5px solid ${tone}55`, ...sans }
        : {
            background: "transparent",
            color: C.inkSoft,
            border: "1.5px solid transparent",
            ...sans,
          };
  const hover =
    variant === "solid"
      ? "hover:brightness-110"
      : variant === "outline"
        ? "hover:bg-[#f6f1fb]"
        : "hover:bg-[#f6f1fb]";
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
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ color: base, background: soft, border: `1.5px solid ${base}44`, ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// Match als vrolijke ronde meter
function MatchRing({ value, tone }: { value: number; tone: string }) {
  return (
    <span
      className="relative inline-flex h-14 w-14 items-center justify-center"
      aria-label={`Match ${value} procent`}
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: `conic-gradient(${tone} ${value * 3.6}deg, ${C.line} 0deg)` }}
        aria-hidden="true"
      />
      <span
        className="absolute inset-[3.5px] rounded-full"
        style={{ background: C.panel }}
        aria-hidden="true"
      />
      <span className="relative text-[13px] font-extrabold" style={{ color: tone, ...mono }}>
        {value}
      </span>
    </span>
  );
}

function Kicker({ children, tone = C.inkMute }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em]"
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
  tone = C.grape,
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
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em]"
          style={{ color: tone, background: `${tone}18` }}
        >
          <Sparkles size={12} aria-hidden="true" />
          {code}
        </span>
        <h1
          className="mt-2.5 text-[26px] font-extrabold leading-tight tracking-[-0.025em] md:text-[31px]"
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
  dashboard: { Icon: LayoutGrid, tone: C.grape },
  marktplaats: { Icon: Store, tone: C.ocean },
  opdracht: { Icon: Heart, tone: C.coral },
  verificatie: { Icon: ShieldCheck, tone: C.mint },
  acties: { Icon: ListChecks, tone: C.sun },
  facturen: { Icon: Receipt, tone: C.grape },
  documenten: { Icon: FileText, tone: C.ocean },
  berichten: { Icon: FileText, tone: C.ocean },
};

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept520() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

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
          <main key={screen} className="cf-fade px-4 pb-20 pt-6 sm:px-6 md:px-8">
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
        @keyframes cfFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .cf-fade { animation: cfFade 0.34s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes cfPop { 0% { opacity: 0; transform: translateY(6px) scale(0.4); } 40% { opacity: 1; } 100% { opacity: 0; transform: translateY(-10px) scale(1); } }
        .cf-pop { animation: cfPop 1.8s ease-in-out infinite; }
        .cf-row { transition: background 0.16s ease, transform 0.16s ease; }
        .cf-row:hover { background: ${C.sink}; }
        @media (prefers-reduced-motion: reduce) { .cf-fade, .cf-pop { animation: none !important; } .cf-row { transition: none !important; } }
      `}</style>
    </div>
  );
}

// —————————————————————————————————————— Sidebar ——————————————————————————————————————
function Sidebar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <aside
      className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col md:flex"
      style={{ background: C.panel, borderRight: `1.5px solid ${C.line}` }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-5"
        style={{ borderBottom: `1.5px solid ${C.line}` }}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-2xl"
          style={{ background: `linear-gradient(135deg, ${C.grape}, ${C.coral})`, color: "#fff" }}
          aria-hidden="true"
        >
          <PartyPopper size={17} />
        </span>
        <span>
          <span
            className="block text-[14px] font-extrabold tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            Confetti
          </span>
          <span
            className="mt-0.5 block text-[9.5px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.grape }}
          >
            werk mag vieren
          </span>
        </span>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1 overflow-y-auto px-3 py-4">
        <p
          className="px-2 pb-2 text-[9.5px] font-extrabold uppercase tracking-[0.18em]"
          style={{ color: C.inkFaint }}
        >
          Overzicht
        </p>
        <ul className="space-y-1">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const { Icon, tone } = NAV[s.key];
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`group flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-left text-[13px] font-bold transition-colors ${RING}`}
                  style={on ? { background: `${tone}18`, color: tone } : { color: C.inkSoft }}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-xl"
                    style={{ background: on ? tone : `${tone}16`, color: on ? "#fff" : tone }}
                    aria-hidden="true"
                  >
                    <Icon size={15} />
                  </span>
                  <span className="flex-1">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-4" style={{ borderTop: `1.5px solid ${C.line}` }}>
        <div
          className="relative mb-3 overflow-hidden rounded-2xl p-3"
          style={{ background: C.mintSoft, border: `1.5px solid ${C.mint}33` }}
        >
          <Confetti tone={C.mint} />
          <p
            className="relative text-[9.5px] font-extrabold uppercase tracking-[0.14em]"
            style={{ color: C.mint }}
          >
            Dossier op orde
          </p>
          <p
            className="relative mt-1 text-[18px] font-extrabold leading-none"
            style={{ color: C.ink, ...mono }}
          >
            {verified}/{CREDENTIALS.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-extrabold"
            style={{
              background: `linear-gradient(135deg, ${C.grape}, ${C.ocean})`,
              color: "#fff",
              ...mono,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-bold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </span>
            <span
              className="flex items-center gap-1 text-[10px] font-bold"
              style={{ color: C.mint }}
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
        borderBottom: `1.5px solid ${C.line}`,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="flex flex-1 items-center gap-2 rounded-full px-3.5 py-2"
        style={{ background: C.panel, border: `1.5px solid ${C.line}` }}
      >
        <Search size={14} aria-hidden="true" style={{ color: C.inkFaint }} />
        <span className="text-[12.5px]" style={{ color: C.inkFaint }}>
          Zoek opdrachten, certificaten, facturen…
        </span>
        <span
          className="ml-auto hidden rounded-lg px-1.5 py-0.5 text-[10px] font-bold sm:inline"
          style={{ background: C.sink, color: C.inkMute, ...mono }}
        >
          ⌘K
        </span>
      </div>
      <span
        className="hidden items-center gap-2 rounded-full px-3 py-2 text-[12px] font-bold sm:inline-flex"
        style={{ background: C.sunSoft, color: C.sun, border: `1.5px solid ${C.sun}44` }}
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
      style={{ borderBottom: `1.5px solid ${C.line}`, background: C.panel }}
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
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${RING}`}
            style={
              on ? { background: tone, color: "#fff" } : { color: C.inkSoft, background: C.sink }
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
        title={`Hoi ${PROFIEL.naam.split(" ")[0]}, mooie dag om te matchen!`}
        sub="Je profiel straalt. Drie dingen vragen vandaag even je aandacht — daarna is alles op orde."
        right={
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" tone={C.mint} onClick={onVerif}>
              <ShieldCheck size={13} aria-hidden="true" /> Dossier
            </Btn>
            <Btn variant="solid" size="sm" onClick={onActies}>
              Volgende actie <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {KPIS.map((k, i) => {
          const tone = KPI_TONES[i % KPI_TONES.length];
          return (
            <Panel key={k.label} className="p-4" tone={tone}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold" style={{ color: C.inkMute }}>
                  {k.label}
                </p>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: tone }}
                  aria-hidden="true"
                />
              </div>
              <p
                className="mt-2 text-[26px] font-extrabold leading-none tracking-[-0.02em]"
                style={{ color: C.ink, ...mono }}
              >
                {k.value}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                  style={{
                    color: k.up ? C.mint : C.sun,
                    background: k.up ? C.mintSoft : C.sunSoft,
                  }}
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
                        style={{ height: h, background: last ? tone : `${tone}44` }}
                      />
                    );
                  })}
                </span>
              </div>
            </Panel>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        <Panel className="overflow-hidden" tone={C.ocean}>
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: `1.5px solid ${C.line}` }}
          >
            <Kicker tone={C.ocean}>
              <Store size={13} aria-hidden="true" /> Toppers voor jou
            </Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className={`rounded-full text-[11.5px] font-bold ${RING}`}
              style={{ color: C.ocean }}
            >
              Alle opdrachten →
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => {
              const tone = o.match >= 90 ? C.mint : C.grape;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className={`cf-row flex w-full items-center gap-3.5 px-5 py-4 text-left ${RING}`}
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <MatchRing value={o.match} tone={tone} />
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
                        className="block text-[13.5px] font-extrabold"
                        style={{ color: C.ink, ...mono }}
                      >
                        {o.tarief.replace(" / uur", "")}
                      </span>
                      <span
                        className="text-[9.5px] font-bold uppercase tracking-[0.1em]"
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
        </Panel>

        <div className="space-y-5">
          <Panel className="relative overflow-hidden p-5" tone={C.mint}>
            <Confetti tone={C.mint} />
            <Kicker tone={C.mint}>
              <ShieldCheck size={13} aria-hidden="true" /> Vertrouwenssaldo
            </Kicker>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[36px] font-extrabold leading-none tracking-[-0.03em]"
                style={{ color: C.mint, ...mono }}
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
                    className="h-2 flex-1 rounded-full"
                    style={{ background: c.status === "VERIFIED" ? C.mint : `${t.base}66` }}
                  />
                );
              })}
            </div>
            <p className="mt-2.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd · {PROFIEL.trust}.
            </p>
          </Panel>

          <Panel className="p-5" tone={C.sun} as="article">
            <Kicker tone={C.sun}>
              <AlertTriangle size={13} aria-hidden="true" /> Termijn nadert
            </Kicker>
            <h3 className="mt-2 text-[15px] font-bold leading-snug" style={{ color: C.ink }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" full tone={C.sun} className="mt-4" onClick={onActies}>
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
        tone={C.ocean}
        title="Opdrachten die bij je passen"
        sub={`${rows.length} van ${OPDRACHTEN.length} opdrachten sluiten aan op je geverifieerde profiel.`}
      />

      <Panel className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center" tone={C.ocean}>
        <div
          className="flex flex-1 items-center gap-2 rounded-full px-3.5 py-2"
          style={{ background: C.sink, border: `1.5px solid ${C.line}` }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a89bbd]"
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
              tone={C.ocean}
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
          tone={C.coral}
          titel="Even niet gelukt"
          tekst="De opdrachten konden zojuist niet worden opgehaald. Probeer het rustig opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.grape}
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
            className={`rounded text-[10.5px] font-bold uppercase tracking-[0.14em] underline-offset-2 hover:underline ${RING}`}
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
    <Panel className="flex flex-col items-center px-6 py-16 text-center" tone={tone}>
      <span
        className="flex h-16 w-16 items-center justify-center rounded-3xl"
        style={{ color: tone, background: `${tone}1f`, border: `1.5px solid ${tone}44` }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-4 text-[19px] font-extrabold" style={{ color: C.ink }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
        {tekst}
      </p>
      <Btn variant="solid" tone={tone} className="mt-5" onClick={onCta}>
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
  const tone = strong ? C.mint : C.grape;
  return (
    <Panel as="article" className="overflow-hidden" tone={tone}>
      <div className="flex items-start gap-4 p-5">
        <span className="shrink-0 pt-0.5">
          <MatchRing value={opdracht.match} tone={tone} />
          <span className="mt-2 flex justify-center">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em]"
              style={{ color: tone, background: `${tone}1f`, border: `1.5px solid ${tone}44` }}
            >
              {strong ? "sterk" : "goed"}
            </span>
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 text-[10.5px] font-bold"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>#{String(index + 1).padStart(2, "0")}</span>
            <span aria-hidden="true">·</span>
            <span>{opdracht.id}</span>
          </div>
          <h3
            className="mt-1 text-[16.5px] font-extrabold leading-snug tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t, ti) => {
              const tt = [C.grape, C.ocean, C.sun][ti % 3];
              return (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                  style={{ background: `${tt}14`, color: tt, border: `1.5px solid ${tt}33` }}
                >
                  {t}
                </span>
              );
            })}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[16px] font-extrabold" style={{ color: C.ink, ...mono }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span
            className="text-[9.5px] font-bold uppercase tracking-[0.1em]"
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
          className={`inline-flex items-center gap-1.5 rounded-full text-[12px] font-bold ${RING}`}
          style={{ color: tone }}
        >
          {open ? <X size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
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
              tone={C.mint}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.sun}
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
        className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.1em]"
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
  const tone = strong ? C.mint : C.grape;
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur", c: C.grape },
    { l: "Omvang", v: opdracht.uren, s: "per week", c: C.ocean },
    { l: "Aanvang", v: opdracht.start, s: "startdatum", c: C.sun },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel", c: C.mint },
  ];
  return (
    <div className="space-y-6">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </Btn>

      <Panel className="overflow-hidden" tone={tone}>
        <div className="p-6">
          <div
            className="flex items-center gap-2 text-[11px] font-bold"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>{opdracht.id}</span>
            <span aria-hidden="true">·</span>
            <span
              className="rounded-full px-2 py-0.5 uppercase tracking-[0.08em]"
              style={{ color: tone, background: `${tone}18` }}
            >
              {strong ? "sterke match" : "goede match"} {opdracht.match}%
            </span>
          </div>
          <h1
            className="mt-2.5 max-w-2xl text-[26px] font-extrabold leading-[1.12] tracking-[-0.025em] md:text-[30px]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13.5px]" style={{ color: C.inkMute }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t, ti) => {
              const tt = [C.grape, C.ocean, C.sun][ti % 3];
              return (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                  style={{ background: `${tt}14`, color: tt, border: `1.5px solid ${tt}33` }}
                >
                  {t}
                </span>
              );
            })}
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
          style={{ borderTop: `1.5px solid ${C.line}` }}
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
                className="text-[9.5px] font-extrabold uppercase tracking-[0.12em]"
                style={{ color: m.c }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-extrabold leading-none"
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

      <Panel className="p-6" tone={C.grape}>
        <Kicker tone={C.grape}>
          <ListChecks size={13} aria-hidden="true" /> Navolgbaar — geen verborgen score
        </Kicker>
        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je geverifieerde profiel. Wat in je voordeel spreekt, en wat goed is om
          vooraf te weten.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.1em]"
              style={{ color: C.mint }}
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
                    style={{ color: C.mint }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.1em]"
              style={{ color: C.sun }}
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
                    style={{ color: C.sun }}
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
        tone={C.mint}
        title="Vertrouwensregister"
        sub={`${verified} van ${CREDENTIALS.length} certificaten geverifieerd · ${PROFIEL.trust}.`}
        right={
          <div
            className="relative overflow-hidden rounded-2xl px-4 py-2 text-right"
            style={{ background: C.mintSoft }}
          >
            <Confetti tone={C.mint} />
            <p
              className="relative text-[28px] font-extrabold leading-none tracking-[-0.02em]"
              style={{ color: C.mint, ...mono }}
            >
              {ratio}%
            </p>
            <p
              className="relative text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.mint }}
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
                <span className="text-[16px] font-extrabold" style={{ color: t.base, ...mono }}>
                  {count}
                </span>
                <StatusTag {...t} />
              </span>
            );
          })}
        </div>
      </Panel>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const t = credTone(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Panel as="article" className="overflow-hidden" tone={t.base}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`relative flex w-full items-center gap-3 px-5 py-4 text-left ${RING}`}
                >
                  {t.feest && <Confetti tone={t.base} />}
                  <span
                    className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: t.soft, color: t.base, border: `1.5px solid ${t.base}33` }}
                    aria-hidden="true"
                  >
                    <t.Icon size={17} />
                  </span>
                  <span className="relative min-w-0 flex-1">
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
                  <span className="relative hidden sm:inline-flex">
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
                        <Btn size="sm" variant="outline">
                          Historie
                        </Btn>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
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
        tone={C.sun}
        title="Wat vandaag je aandacht vraagt"
        sub="Op volgorde van urgentie — vink ze af en vier je voortgang."
      />
      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.sun : C.ocean;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Panel className="flex items-start gap-4 p-5" tone={tone}>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[15px] font-extrabold"
                  style={{ background: `${tone}18`, color: tone, ...mono }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <Kicker tone={tone}>
                    {warn ? (
                      <AlertTriangle size={13} aria-hidden="true" />
                    ) : (
                      <Clock size={13} aria-hidden="true" />
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
        tone={C.grape}
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
          {
            l: "Betaald",
            v: totals.betaald,
            sub: "2 facturen",
            tone: C.mint,
            Icon: Check,
            feest: true,
          },
          {
            l: "Openstaand",
            v: totals.open,
            sub: "1 factuur · 9 dagen",
            tone: C.sun,
            Icon: Clock,
            feest: false,
          },
          {
            l: "Concept",
            v: totals.concept,
            sub: "klaar om te versturen",
            tone: C.ocean,
            Icon: Hash,
            feest: false,
          },
        ].map((s) => (
          <Panel key={s.l} className="relative overflow-hidden p-4" tone={s.tone}>
            {s.feest && <Confetti tone={s.tone} />}
            <div className="relative flex items-center justify-between">
              <p
                className="text-[10px] font-extrabold uppercase tracking-[0.12em]"
                style={{ color: s.tone }}
              >
                {s.l}
              </p>
              <s.Icon size={14} aria-hidden="true" style={{ color: s.tone }} />
            </div>
            <p
              className="relative mt-1.5 text-[22px] font-extrabold leading-none"
              style={{ color: C.ink, ...mono }}
            >
              {eur0.format(s.v)}
            </p>
            <p className="relative mt-1 text-[11px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="overflow-hidden" tone={C.grape}>
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: `1.5px solid ${C.line}` }}
          >
            <Kicker tone={C.grape}>
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
                <tr style={{ borderBottom: `1.5px solid ${C.line}` }}>
                  {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`px-4 py-2.5 text-[9.5px] font-extrabold uppercase tracking-[0.12em] ${i === 3 ? "text-right" : ""}`}
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
                      className={`cf-row cursor-pointer ${RING}`}
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
                        background: on ? C.grapeSoft : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3 text-[12px] font-bold"
                        style={{ color: on ? C.grape : C.inkSoft, ...mono }}
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
                        className="px-4 py-3 text-right text-[13px] font-extrabold"
                        style={{ color: C.ink, ...mono }}
                      >
                        {f.bedrag}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11.5px] font-bold"
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
    <Panel as="article" className="relative overflow-hidden" tone={t.base}>
      {t.feest && <Confetti tone={t.base} />}
      <div className="relative p-5" style={{ borderBottom: `1.5px solid ${C.line}` }}>
        <p
          className="text-[10px] font-extrabold uppercase tracking-[0.18em]"
          style={{ color: t.base }}
        >
          Factuur
        </p>
        <p className="text-[17px] font-extrabold" style={{ color: C.ink, ...mono }}>
          {factuur.nr}
        </p>
      </div>
      <div className="relative space-y-3 p-5 text-[12.5px]">
        <Row label="Klant" value={factuur.klant} />
        <Row label="Datum" value={factuur.datum} mono />
        <div className="flex items-baseline justify-between">
          <span className="text-[12px]" style={{ color: C.inkMute }}>
            Status
          </span>
          <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: t.base }}>
            <t.Icon size={12} aria-hidden="true" /> {t.label}
          </span>
        </div>
        <div className="my-3 h-px" style={{ background: C.line }} />
        <Row label="Subtotaal" value={eur0.format(subtotal)} mono />
        <Row label="Btw 21%" value={eur0.format(btw)} mono />
        <div className="my-3 h-px" style={{ background: `${t.base}44` }} />
        <div className="flex items-baseline justify-between">
          <span
            className="text-[12px] font-extrabold uppercase tracking-[0.12em]"
            style={{ color: C.ink }}
          >
            Totaal
          </span>
          <span className="text-[20px] font-extrabold" style={{ color: t.base, ...mono }}>
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
        className="shrink-0 text-right text-[12.5px] font-bold"
        style={{ color: C.ink, ...(isMono ? mono : sans) }}
      >
        {value}
      </span>
    </div>
  );
}
