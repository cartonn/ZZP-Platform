"use client";

// Concept 539 — "Obsidiaan" · Premium OLED true-black. Diepe, echt-zwarte achtergrond waarop
// glasachtige dieptepanelen met haarfijne lichte randen zweven. Eén lichtgevend accent (koel
// cyaan/elektrisch blauw) draagt de aandacht; een tweede, warm smaragd markeert bevestiging.
// Hoog contrast, luxe en ingetogen — donker maar WCAG-leesbaar. Status altijd label + icoon.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Check,
  ChevronRight,
  CircleAlert,
  Clock,
  Command,
  Diamond,
  Dot,
  FileText,
  Gem,
  Hourglass,
  LayoutGrid,
  ListChecks,
  MapPin,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
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
  BERICHTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ————————————————————————————— Palet — OLED obsidiaan —————————————————————————————
const C = {
  void: "#000000", // true black canvas
  base: "#050608", // near-black chrome
  panel: "rgba(20,23,28,0.72)", // glass paneel
  panelSolid: "#101318",
  raise: "rgba(30,34,41,0.85)", // opgetild vlak
  sink: "rgba(255,255,255,0.03)",
  edge: "rgba(255,255,255,0.10)", // haarfijne lichte rand
  edgeSoft: "rgba(255,255,255,0.06)",
  edgeStrong: "rgba(255,255,255,0.16)",
  text: "#f4f6fb",
  textSoft: "#c3c9d4",
  textMute: "#8a93a3",
  textFaint: "#5c6472",
  cyan: "#38e1ff", // lichtgevend hoofdaccent
  cyanDeep: "#0b5b70",
  cyanGlow: "rgba(56,225,255,0.16)",
  emerald: "#37e0a6", // bevestiging / vast
  emeraldGlow: "rgba(55,224,166,0.14)",
  amber: "#ffbf4d", // waarschuwing / verloopt
  amberGlow: "rgba(255,191,77,0.14)",
  rose: "#ff6b7d", // afgekeurd
  roseGlow: "rgba(255,107,125,0.14)",
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38e1ff] focus-visible:ring-offset-2 focus-visible:ring-offset-black";

// ————————————————————————————— Status-taal (label + icoon) —————————————————————————————
type Tone = { base: string; glow: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.emerald,
        glow: C.emeraldGlow,
        label: "Geverifieerd",
        Icon: BadgeCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return {
        base: C.cyan,
        glow: C.cyanGlow,
        label: "In beoordeling",
        Icon: Hourglass,
        alarm: false,
      };
    case "EXPIRING":
      return {
        base: C.amber,
        glow: C.amberGlow,
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.rose, glow: C.roseGlow, label: "Afgekeurd", Icon: X, alarm: true };
  }
}

function factuurTone(status: string): {
  base: string;
  glow: string;
  label: string;
  Icon: LucideIcon;
} {
  if (status === "Betaald")
    return { base: C.emerald, glow: C.emeraldGlow, label: "Betaald", Icon: Check };
  if (status === "Openstaand")
    return { base: C.amber, glow: C.amberGlow, label: "Openstaand", Icon: Clock };
  return { base: C.cyan, glow: C.cyanGlow, label: "Concept", Icon: FileText };
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
  glow,
  lift = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  glow?: string;
  lift?: boolean;
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: lift ? C.raise : C.panel,
        border: `1px solid ${C.edge}`,
        boxShadow: glow
          ? `0 1px 0 ${C.edgeSoft} inset, 0 0 0 1px rgba(0,0,0,0.6), 0 24px 60px -34px ${glow}`
          : `0 1px 0 ${C.edgeSoft} inset, 0 20px 50px -34px rgba(0,0,0,0.9)`,
        backdropFilter: "blur(10px)",
      }}
    >
      {glow && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full"
          style={{ background: glow, filter: "blur(40px)" }}
        />
      )}
      <span className="relative block">{children}</span>
    </Tag>
  );
}

function Btn({
  children,
  onClick,
  variant = "solid",
  size = "md",
  className = "",
  tone = C.cyan,
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
  const base = `inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-[-0.01em] transition-all duration-150 active:translate-y-px ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? {
          background: tone,
          color: "#04070a",
          border: `1px solid ${tone}`,
          boxShadow: `0 0 22px -6px ${tone}`,
          ...sans,
        }
      : variant === "outline"
        ? {
            background: "rgba(255,255,255,0.02)",
            color: tone,
            border: `1px solid ${tone}55`,
            ...sans,
          }
        : {
            background: "transparent",
            color: C.textSoft,
            border: "1px solid transparent",
            ...sans,
          };
  const hover =
    variant === "solid"
      ? "hover:brightness-110"
      : "hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.18)]";
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

function StatusTag({ base, glow, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-semibold"
      style={{ color: base, background: glow, border: `1px solid ${base}44`, ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (aandacht vereist)</span>}
    </span>
  );
}

// Match als lichtgevende ring
function MatchRing({ value, tone }: { value: number; tone: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  return (
    <span
      className="relative inline-flex h-14 w-14 items-center justify-center"
      aria-label={`Match ${value} procent`}
    >
      <svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        aria-hidden="true"
        className="rotate-[-90deg]"
      >
        <circle cx="28" cy="28" r={r} fill="none" stroke={C.edge} strokeWidth="3.5" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          style={{ filter: `drop-shadow(0 0 5px ${tone})` }}
        />
      </svg>
      <span className="absolute text-[13px] font-bold" style={{ color: tone, ...mono }}>
        {value}
      </span>
    </span>
  );
}

function Sparkline({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 22 - ((d - min) / span) * 20;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width="72"
      height="24"
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={tone}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ filter: `drop-shadow(0 0 3px ${tone})` }}
      />
    </svg>
  );
}

function Kicker({ children, tone = C.textMute }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em]"
      style={{ color: tone, ...sans }}
    >
      {children}
    </span>
  );
}

function ScreenHead({
  kicker,
  KIcon,
  title,
  sub,
  right,
  tone = C.cyan,
}: {
  kicker: string;
  KIcon: LucideIcon;
  title: string;
  sub?: string;
  right?: ReactNode;
  tone?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <span
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em]"
          style={{ color: tone, background: `${tone}14`, border: `1px solid ${tone}33` }}
        >
          <KIcon size={12} aria-hidden="true" />
          {kicker}
        </span>
        <h1
          className="mt-3 text-[25px] font-bold leading-tight tracking-[-0.025em] md:text-[30px]"
          style={{ color: C.text }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-1.5 max-w-xl text-[13px]" style={{ color: C.textMute }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

const NAV: Record<ScreenKey, { Icon: LucideIcon }> = {
  dashboard: { Icon: LayoutGrid },
  marktplaats: { Icon: Store },
  opdracht: { Icon: MapPin },
  verificatie: { Icon: ShieldCheck },
  acties: { Icon: ListChecks },
  facturen: { Icon: Receipt },
  documenten: { Icon: FileText },
  berichten: { Icon: Bell },
};

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept539() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[760px] w-full antialiased"
      style={{
        ...sans,
        color: C.text,
        background: `radial-gradient(120% 90% at 12% -8%, ${C.cyanGlow} 0%, transparent 42%), radial-gradient(90% 80% at 100% 0%, ${C.emeraldGlow} 0%, transparent 40%), ${C.void}`,
      }}
    >
      <div className="mx-auto flex max-w-6xl">
        <Sidebar screen={screen} setScreen={setScreen} />
        <div className="min-w-0 flex-1">
          <TopBar />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="ob-fade px-4 pb-24 pt-6 sm:px-6 md:px-8">
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
                onVerif={() => setScreen("verificatie")}
              />
            )}
            {screen === "facturen" && <Facturen />}
          </main>
        </div>
      </div>

      <style>{`
        @keyframes obFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .ob-fade { animation: obFade 0.34s cubic-bezier(0.22,1,0.36,1) both; }
        .ob-row { transition: background 0.16s ease, box-shadow 0.16s ease; }
        .ob-row:hover { background: rgba(255,255,255,0.035); }
        @media (prefers-reduced-motion: reduce) { .ob-fade { animation: none !important; } .ob-row { transition: none !important; } }
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
      className="sticky top-0 hidden h-screen w-[238px] shrink-0 flex-col md:flex"
      style={{ background: C.base, borderRight: `1px solid ${C.edgeSoft}` }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-5"
        style={{ borderBottom: `1px solid ${C.edgeSoft}` }}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            background: `linear-gradient(140deg, ${C.cyan}, ${C.cyanDeep})`,
            color: "#04070a",
            boxShadow: `0 0 20px -4px ${C.cyan}`,
          }}
          aria-hidden="true"
        >
          <Gem size={17} />
        </span>
        <span>
          <span
            className="block text-[14px] font-bold tracking-[-0.01em]"
            style={{ color: C.text }}
          >
            Obsidiaan
          </span>
          <span
            className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.22em]"
            style={{ color: C.cyan }}
          >
            werkruimte · zzp
          </span>
        </span>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1 overflow-y-auto px-3 py-4">
        <p
          className="px-2 pb-2 text-[9px] font-bold uppercase tracking-[0.2em]"
          style={{ color: C.textFaint }}
        >
          Overzicht
        </p>
        <ul className="space-y-1">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const { Icon } = NAV[s.key];
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-[13px] font-semibold transition-all ${RING}`}
                  style={
                    on
                      ? {
                          background: C.cyanGlow,
                          color: C.text,
                          border: `1px solid ${C.cyan}44`,
                        }
                      : { color: C.textMute, border: "1px solid transparent" }
                  }
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                    style={{
                      background: on ? C.cyan : C.sink,
                      color: on ? "#04070a" : C.textMute,
                      border: `1px solid ${on ? C.cyan : C.edgeSoft}`,
                      boxShadow: on ? `0 0 16px -4px ${C.cyan}` : "none",
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={14} />
                  </span>
                  <span className="flex-1">{s.label}</span>
                  {on && <Dot size={18} aria-hidden="true" style={{ color: C.cyan }} />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-4" style={{ borderTop: `1px solid ${C.edgeSoft}` }}>
        <div
          className="relative mb-3 overflow-hidden rounded-xl p-3"
          style={{ background: C.emeraldGlow, border: `1px solid ${C.emerald}33` }}
        >
          <p
            className="text-[9px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.emerald }}
          >
            Vertrouwensdossier
          </p>
          <p className="mt-1 text-[20px] font-bold leading-none" style={{ color: C.text, ...mono }}>
            {ratio}%
          </p>
          <p className="mt-1 text-[10px]" style={{ color: C.textMute }}>
            {verified}/{CREDENTIALS.length} geverifieerd
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[11px] font-bold"
            style={{
              background: `linear-gradient(140deg, ${C.cyan}22, ${C.emerald}22)`,
              color: C.text,
              border: `1px solid ${C.edge}`,
              ...mono,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-bold" style={{ color: C.text }}>
              {PROFIEL.naam}
            </span>
            <span
              className="flex items-center gap-1 text-[10px] font-semibold"
              style={{ color: C.emerald }}
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
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 sm:px-6 md:px-8"
      style={{
        background: "rgba(0,0,0,0.72)",
        borderBottom: `1px solid ${C.edgeSoft}`,
        backdropFilter: "blur(14px)",
      }}
    >
      <div
        className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2"
        style={{ background: C.sink, border: `1px solid ${C.edge}` }}
      >
        <Search size={14} aria-hidden="true" style={{ color: C.textFaint }} />
        <span className="truncate text-[12.5px]" style={{ color: C.textFaint }}>
          Zoek opdrachten, certificaten, facturen…
        </span>
        <span
          className="ml-auto hidden items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold sm:inline-flex"
          style={{ background: C.raise, color: C.textMute, border: `1px solid ${C.edge}`, ...mono }}
        >
          <Command size={10} aria-hidden="true" /> K
        </span>
      </div>
      <span
        className="hidden items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold sm:inline-flex"
        style={{ background: C.amberGlow, color: C.amber, border: `1px solid ${C.amber}33` }}
      >
        <Clock size={13} aria-hidden="true" />
        <span style={{ ...mono }}>{eur0.format(open)}</span> openstaand
      </span>
      <button
        type="button"
        aria-label={`Meldingen, ${ongelezen} ongelezen`}
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl ${RING}`}
        style={{ background: C.sink, color: C.textSoft, border: `1px solid ${C.edge}` }}
      >
        <Bell size={15} aria-hidden="true" />
        {ongelezen > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
            style={{ background: C.cyan, color: "#04070a", ...mono }}
          >
            {ongelezen}
          </span>
        )}
      </button>
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
      style={{ borderBottom: `1px solid ${C.edgeSoft}`, background: C.base }}
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
            style={
              on
                ? { background: C.cyan, color: "#04070a" }
                : { color: C.textSoft, background: C.sink, border: `1px solid ${C.edgeSoft}` }
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
  const bericht = BERICHTEN[0];
  return (
    <div className="space-y-7">
      <ScreenHead
        kicker="Overzicht"
        KIcon={Sparkles}
        title={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}`}
        sub="Alles wat telt in één donker, rustig beeld. Drie punten vragen vandaag om aandacht."
        right={
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" tone={C.emerald} onClick={onVerif}>
              <ShieldCheck size={13} aria-hidden="true" /> Dossier
            </Btn>
            <Btn variant="solid" size="sm" onClick={onActies}>
              Volgende actie <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold" style={{ color: C.textMute }}>
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold"
                style={{
                  color: k.up ? C.emerald : C.amber,
                  background: k.up ? C.emeraldGlow : C.amberGlow,
                }}
              >
                {k.up ? (
                  <ArrowUpRight size={11} aria-hidden="true" />
                ) : (
                  <Dot size={11} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <p
              className="mt-2 text-[25px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.text, ...mono }}
            >
              {k.value}
            </p>
            <div className="mt-3">
              <Sparkline data={k.spark} tone={k.up ? C.cyan : C.amber} />
            </div>
          </Panel>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        <Panel className="overflow-hidden" glow={C.cyanGlow}>
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: `1px solid ${C.edgeSoft}` }}
          >
            <Kicker tone={C.cyan}>
              <Store size={13} aria-hidden="true" /> Beste matches
            </Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className={`inline-flex items-center gap-1 rounded-md px-1 text-[11.5px] font-semibold ${RING}`}
              style={{ color: C.cyan }}
            >
              Naar marktplaats <ArrowRight size={12} aria-hidden="true" />
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => {
              const tone = o.match >= 90 ? C.emerald : C.cyan;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className={`ob-row flex w-full items-center gap-3.5 px-5 py-4 text-left ${RING}`}
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.edgeSoft}` }}
                  >
                    <MatchRing value={o.match} tone={tone} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14px] font-bold"
                        style={{ color: C.text }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                        style={{ color: C.textMute }}
                      >
                        <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </span>
                    </span>
                    <span className="hidden shrink-0 text-right sm:block">
                      <span
                        className="block text-[13.5px] font-bold"
                        style={{ color: C.text, ...mono }}
                      >
                        {o.tarief.replace(" / uur", "")}
                      </span>
                      <span
                        className="text-[9px] font-bold uppercase tracking-[0.1em]"
                        style={{ color: C.textFaint }}
                      >
                        p/uur
                      </span>
                    </span>
                    <ChevronRight size={16} aria-hidden="true" style={{ color: C.textFaint }} />
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="space-y-5">
          <Panel className="p-5" glow={C.emeraldGlow}>
            <Kicker tone={C.emerald}>
              <ShieldCheck size={13} aria-hidden="true" /> Vertrouwensniveau
            </Kicker>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[36px] font-bold leading-none tracking-[-0.03em]"
                style={{ color: C.emerald, ...mono }}
              >
                {ratio}%
              </span>
              <span className="text-[12px]" style={{ color: C.textMute }}>
                geverifieerd
              </span>
            </div>
            <div className="mt-3 flex gap-1.5" aria-hidden="true">
              {CREDENTIALS.map((c) => {
                const t = credTone(c.status);
                return (
                  <span
                    key={c.naam}
                    className="h-2 flex-1 rounded-full"
                    style={{
                      background: t.base,
                      opacity: c.status === "VERIFIED" ? 1 : 0.4,
                      boxShadow: c.status === "VERIFIED" ? `0 0 8px -1px ${t.base}` : "none",
                    }}
                  />
                );
              })}
            </div>
            <p className="mt-2.5 text-[11.5px]" style={{ color: C.textMute }}>
              {verified} van {CREDENTIALS.length} bewijsstukken geverifieerd.
            </p>
            <Btn
              variant="outline"
              size="sm"
              tone={C.emerald}
              full
              className="mt-4"
              onClick={onVerif}
            >
              Bekijk dossier <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Panel>

          <Panel className="p-5" glow={C.amberGlow} as="article">
            <Kicker tone={C.amber}>
              <TriangleAlert size={13} aria-hidden="true" /> Actie nodig
            </Kicker>
            <h3 className="mt-2 text-[15px] font-bold leading-snug" style={{ color: C.text }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.textSoft }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" full tone={C.amber} className="mt-4" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Panel>

          {bericht && (
            <Panel className="p-4">
              <Kicker>
                <Bell size={12} aria-hidden="true" /> Recent bericht
              </Kicker>
              <div className="mt-2.5 flex items-start gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                  style={{
                    background: C.raise,
                    color: C.text,
                    border: `1px solid ${C.edge}`,
                    ...mono,
                  }}
                  aria-hidden="true"
                >
                  {bericht.initialen}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[12.5px] font-bold" style={{ color: C.text }}>
                      {bericht.van}
                    </span>
                    {bericht.ongelezen && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: C.cyan, boxShadow: `0 0 6px ${C.cyan}` }}
                        aria-label="ongelezen"
                      />
                    )}
                  </span>
                  <span
                    className="mt-0.5 block text-[11.5px] leading-snug"
                    style={{ color: C.textMute }}
                  >
                    {bericht.preview}
                  </span>
                </span>
              </div>
            </Panel>
          )}
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
        kicker="Marktplaats"
        KIcon={Store}
        title="Opdrachten voor jou"
        sub={`${rows.length} van ${OPDRACHTEN.length} opdrachten sluiten aan op je geverifieerde profiel.`}
      />

      <Panel className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: C.sink, border: `1px solid ${C.edge}` }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.textFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten filteren"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#5c6472]"
            style={{ color: C.text }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Filter wissen"
              className={`flex h-5 w-5 items-center justify-center rounded-md ${RING}`}
              style={{ color: C.textMute }}
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
                  className="h-4 w-2/3 animate-pulse rounded motion-reduce:animate-none"
                  style={{ background: C.edgeSoft }}
                />
                <div
                  className="h-3 w-1/2 animate-pulse rounded motion-reduce:animate-none"
                  style={{ background: C.edgeSoft }}
                />
              </Panel>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={CircleAlert}
          tone={C.rose}
          titel="Laden onderbroken"
          tekst="De opdrachten konden zojuist niet worden geladen. Controleer je verbinding en probeer opnieuw."
          cta="Opnieuw laden"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.cyan}
          titel="Geen opdracht gevonden"
          tekst={`Niets voor ${q ? `“${q}”` : "je filter"}. Verruim je zoekopdracht en probeer opnieuw.`}
          cta="Filter wissen"
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
            className={`rounded text-[10px] font-bold uppercase tracking-[0.14em] underline-offset-2 hover:underline ${RING}`}
            style={{ color: C.textFaint }}
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
    <Panel className="flex flex-col items-center px-6 py-16 text-center" glow={`${tone}22`}>
      <span
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ color: tone, background: `${tone}1a`, border: `1px solid ${tone}44` }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-4 text-[19px] font-bold" style={{ color: C.text }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed" style={{ color: C.textSoft }}>
        {tekst}
      </p>
      <Btn variant="solid" tone={tone} className="mt-5" onClick={onCta}>
        {cta}
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
  const tone = strong ? C.emerald : C.cyan;
  return (
    <Panel as="article" className="overflow-hidden" glow={`${tone}18`}>
      <div className="flex items-start gap-4 p-5">
        <span className="shrink-0 pt-0.5 text-center">
          <MatchRing value={opdracht.match} tone={tone} />
          <span
            className="mt-2 block rounded-md px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.06em]"
            style={{ color: tone, background: `${tone}1a`, border: `1px solid ${tone}44` }}
          >
            {strong ? "topmatch" : "sterk"}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 text-[10px] font-bold"
            style={{ color: C.textFaint, ...mono }}
          >
            <span>#{String(index + 1).padStart(2, "0")}</span>
            <span aria-hidden="true">·</span>
            <span>{opdracht.id}</span>
          </div>
          <h3
            className="mt-1 text-[16px] font-bold leading-snug tracking-[-0.01em]"
            style={{ color: C.text }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.textMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: C.sink, color: C.textSoft, border: `1px solid ${C.edgeSoft}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[16px] font-bold" style={{ color: C.text, ...mono }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-[0.1em]"
            style={{ color: C.textFaint }}
          >
            per uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-2 px-5 py-3"
        style={{ borderTop: `1px solid ${C.edgeSoft}`, background: C.sink }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 rounded-md px-1 text-[12px] font-semibold ${RING}`}
          style={{ color: tone }}
        >
          {open ? <X size={13} aria-hidden="true" /> : <ListChecks size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" tone={tone} onClick={onOpen}>
            Reageer <ArrowRight size={12} aria-hidden="true" />
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
            style={{ borderTop: `1px solid ${C.edgeSoft}` }}
          >
            <RedenKolom
              titel="In je voordeel"
              tone={C.emerald}
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
        className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em]"
        style={{ color: tone }}
      >
        <Icon size={12} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[13px] leading-snug"
            style={{ color: C.textSoft }}
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: tone }}
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
  const tone = strong ? C.emerald : C.cyan;
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur" },
    { l: "Omvang", v: opdracht.uren, s: "per week" },
    { l: "Aanvang", v: opdracht.start, s: "startdatum" },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel" },
  ];
  // Vereiste certificaten afgeleid uit tags — compliance-beeld
  const vereist = CREDENTIALS.slice(0, 3);
  return (
    <div className="space-y-6">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </Btn>

      <Panel className="overflow-hidden" glow={`${tone}20`}>
        <div className="p-6">
          <div
            className="flex items-center gap-2 text-[11px] font-bold"
            style={{ color: C.textFaint, ...mono }}
          >
            <span>{opdracht.id}</span>
            <span aria-hidden="true">·</span>
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 uppercase tracking-[0.08em]"
              style={{ color: tone, background: `${tone}18` }}
            >
              <Diamond size={10} aria-hidden="true" /> match {opdracht.match}%
            </span>
          </div>
          <h1
            className="mt-2.5 max-w-2xl text-[25px] font-bold leading-[1.12] tracking-[-0.02em] md:text-[29px]"
            style={{ color: C.text }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13.5px]" style={{ color: C.textMute }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: C.sink, color: C.textSoft, border: `1px solid ${C.edge}` }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Btn variant="solid" tone={tone}>
              Reageer op deze opdracht <ArrowRight size={14} aria-hidden="true" />
            </Btn>
            <Btn variant="outline">Bewaren</Btn>
          </div>
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-4"
          style={{ borderTop: `1px solid ${C.edgeSoft}` }}
        >
          {feiten.map((m, i) => (
            <div
              key={m.l}
              className="p-4"
              style={{
                borderRight: i < 3 ? `1px solid ${C.edgeSoft}` : "none",
                borderTop: i >= 2 ? `1px solid ${C.edgeSoft}` : "none",
              }}
            >
              <p
                className="text-[9px] font-bold uppercase tracking-[0.14em]"
                style={{ color: C.textMute }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-bold leading-none"
                style={{ color: C.text, ...mono }}
              >
                {m.v}
              </p>
              <p className="mt-1 text-[10px]" style={{ color: C.textFaint }}>
                {m.s}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel className="p-6" glow={C.cyanGlow}>
          <Kicker tone={C.cyan}>
            <ListChecks size={13} aria-hidden="true" /> Navolgbaar — geen verborgen score
          </Kicker>
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.textSoft }}>
            Berekend op je geverifieerde profiel. Wat in je voordeel spreekt, en wat je vooraf goed
            wil weten.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
            <RedenDetail
              titel="In je voordeel"
              tone={C.emerald}
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
        </Panel>

        <Panel className="p-6" glow={C.emeraldGlow} as="article">
          <Kicker tone={C.emerald}>
            <ShieldCheck size={13} aria-hidden="true" /> Vereiste certificaten
          </Kicker>
          <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: C.textSoft }}>
            Deze opdracht vraagt onderstaande bewijsstukken. Groen betekent geverifieerd.
          </p>
          <ul className="mt-4 space-y-2.5">
            {vereist.map((c) => {
              const t = credTone(c.status);
              return (
                <li
                  key={c.naam}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: C.sink, border: `1px solid ${C.edgeSoft}` }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: t.glow, color: t.base, border: `1px solid ${t.base}33` }}
                    aria-hidden="true"
                  >
                    <t.Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[12.5px] font-bold"
                      style={{ color: C.text }}
                    >
                      {c.naam}
                    </span>
                    <span className="text-[10.5px]" style={{ color: C.textMute }}>
                      {c.detail}
                    </span>
                  </span>
                  <StatusTag {...t} />
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
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
            style={{ color: C.textSoft }}
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
        kicker="Verificatie"
        KIcon={ShieldCheck}
        tone={C.emerald}
        title="Je vertrouwensdossier"
        sub={`${verified} van ${CREDENTIALS.length} bewijsstukken geverifieerd · ${PROFIEL.trust}.`}
        right={
          <div
            className="relative overflow-hidden rounded-xl px-4 py-2 text-right"
            style={{ background: C.emeraldGlow, border: `1px solid ${C.emerald}33` }}
          >
            <p
              className="text-[27px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.emerald, ...mono }}
            >
              {ratio}%
            </p>
            <p
              className="text-[9px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.emerald }}
            >
              geverifieerd
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

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const t = credTone(c.status);
          const isOpen = open === c.naam;
          const herstel = c.status === "EXPIRING" || c.status === "REJECTED";
          return (
            <li key={c.naam}>
              <Panel as="article" className="overflow-hidden" glow={herstel ? t.glow : undefined}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`relative flex w-full items-center gap-3 px-5 py-4 text-left ${RING}`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: t.glow, color: t.base, border: `1px solid ${t.base}33` }}
                    aria-hidden="true"
                  >
                    <t.Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14px] font-bold"
                      style={{ color: C.text }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="block truncate text-[11.5px]"
                      style={{ color: t.alarm ? t.base : C.textMute }}
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
                      color: C.textFaint,
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
                      style={{ borderTop: `1px solid ${C.edgeSoft}`, paddingTop: 12 }}
                    >
                      <span className="mb-2 inline-flex sm:hidden">
                        <StatusTag {...t} />
                      </span>
                      <p
                        className="max-w-xl text-[12.5px] leading-relaxed"
                        style={{ color: C.textSoft }}
                      >
                        {c.detail}. Het bewijsstuk wordt versleuteld bewaard en uitsluitend na jouw
                        toestemming ingezien door een opdrachtgever.
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
                          Details
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
function Acties({
  onMarkt,
  onFacturen,
  onVerif,
}: {
  onMarkt: () => void;
  onFacturen: () => void;
  onVerif: () => void;
}) {
  return (
    <div className="space-y-6">
      <ScreenHead
        kicker="Acties"
        KIcon={ListChecks}
        tone={C.amber}
        title="Wat je nu het beste doet"
        sub="Op volgorde van urgentie. Werk het belangrijkste eerst weg."
      />
      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.cyan;
          const goVerif = a.cta.toLowerCase().includes("vog");
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Panel className="flex items-start gap-4 p-5" glow={warn ? tone + "18" : undefined}>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold"
                  style={{
                    background: `${tone}18`,
                    color: tone,
                    border: `1px solid ${tone}33`,
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
                      <Sparkles size={13} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </Kicker>
                  <h2
                    className="mt-1.5 text-[16px] font-bold leading-snug"
                    style={{ color: C.text }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[13px] leading-relaxed"
                    style={{ color: C.textSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <Btn
                      variant={warn ? "solid" : "outline"}
                      size="sm"
                      tone={tone}
                      onClick={
                        goVerif ? onVerif : goMarkt ? onMarkt : goFacturen ? onFacturen : undefined
                      }
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
        kicker="Facturen"
        KIcon={Receipt}
        title="Facturatie"
        sub="Klik een regel om de opbouw te openen."
        right={
          <Btn variant="solid" size="sm">
            <Plus size={13} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: totals.betaald, sub: "2 facturen", tone: C.emerald, Icon: Check },
          {
            l: "Openstaand",
            v: totals.open,
            sub: "1 factuur · 9 dagen",
            tone: C.amber,
            Icon: Clock,
          },
          {
            l: "Concept",
            v: totals.concept,
            sub: "klaar om te versturen",
            tone: C.cyan,
            Icon: FileText,
          },
        ].map((s) => (
          <Panel key={s.l} className="p-4" glow={`${s.tone}14`}>
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
              style={{ color: C.text, ...mono }}
            >
              {eur0.format(s.v)}
            </p>
            <p className="mt-1 text-[11px]" style={{ color: C.textMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="overflow-hidden" glow={C.cyanGlow}>
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: `1px solid ${C.edgeSoft}` }}
          >
            <Kicker tone={C.cyan}>
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
                <tr style={{ borderBottom: `1px solid ${C.edgeSoft}` }}>
                  {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.12em] ${i === 3 ? "text-right" : ""}`}
                      style={{ color: C.textMute }}
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
                      className={`ob-row cursor-pointer ${RING}`}
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
                        borderTop: `1px solid ${C.edgeSoft}`,
                        background: on ? C.cyanGlow : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3 text-[12px] font-bold"
                        style={{ color: on ? C.cyan : C.textSoft, ...mono }}
                      >
                        {f.nr}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-bold" style={{ color: C.text }}>
                        {f.klant}
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: C.textMute, ...mono }}>
                        {f.datum}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-[13px] font-bold"
                        style={{ color: C.text, ...mono }}
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
    <Panel as="article" className="overflow-hidden" glow={t.glow}>
      <div className="p-5" style={{ borderBottom: `1px solid ${C.edgeSoft}` }}>
        <p className="text-[9.5px] font-bold uppercase tracking-[0.18em]" style={{ color: t.base }}>
          Opbouw factuur
        </p>
        <p className="text-[17px] font-bold" style={{ color: C.text, ...mono }}>
          {factuur.nr}
        </p>
      </div>
      <div className="space-y-3 p-5 text-[12.5px]">
        <Row label="Klant" value={factuur.klant} />
        <Row label="Datum" value={factuur.datum} isMono />
        <div className="flex items-baseline justify-between">
          <span className="text-[12px]" style={{ color: C.textMute }}>
            Status
          </span>
          <span
            className="inline-flex items-center gap-1.5 font-semibold"
            style={{ color: t.base }}
          >
            <t.Icon size={12} aria-hidden="true" /> {t.label}
          </span>
        </div>
        <div className="my-3 h-px" style={{ background: C.edgeSoft }} />
        <Row label="Subtotaal" value={eur0.format(subtotal)} isMono />
        <Row label="Btw 21%" value={eur0.format(btw)} isMono />
        <div className="my-3 h-px" style={{ background: `${t.base}44` }} />
        <div className="flex items-baseline justify-between">
          <span
            className="text-[12px] font-bold uppercase tracking-[0.12em]"
            style={{ color: C.text }}
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
          <Btn variant="outline" size="sm">
            PDF
          </Btn>
        </div>
      </div>
    </Panel>
  );
}

function Row({ label, value, isMono = false }: { label: string; value: string; isMono?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0 text-[12px]" style={{ color: C.textMute }}>
        {label}
      </span>
      <span
        className="min-w-0 flex-1 self-end border-b border-dotted"
        style={{ borderColor: C.edgeSoft }}
        aria-hidden="true"
      />
      <span
        className="shrink-0 text-right text-[12.5px] font-semibold"
        style={{ color: C.text, ...(isMono ? mono : sans) }}
      >
        {value}
      </span>
    </div>
  );
}
