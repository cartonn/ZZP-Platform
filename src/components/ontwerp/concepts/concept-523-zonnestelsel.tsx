"use client";

// Concept 523 — "Zonnestelsel" · Een orbitaal, radiaal dashboard. Ruimte-donker doek met concentrische
// banen; opdrachten en certificaten cirkelen als "planeten" op ringen rond een centrale zon (jouw
// vertrouwensscore). KPI's zijn radiale meters in plaats van balken, met luminante accenten. Een
// layout-paradigma dat bewust géén grid is. Kleur draagt nooit alleen de status: altijd label + icoon.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  Command,
  FileText,
  ListChecks,
  MapPin,
  Orbit,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Sun,
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

// ————————————————————————————— Palet — ruimte-donker met luminante planeten —————————————————————————————
const C = {
  bg: "#0a0e1a",
  deep: "#070a13",
  panel: "#111725",
  panelSoft: "#0e1420",
  sink: "#0c111c",
  line: "#1e2941",
  lineSoft: "#172035",
  fg: "#e6ebf5",
  fgSoft: "#b3bdd4",
  fgMute: "#7d89a6",
  fgFaint: "#525d78",
  sun: "#f5c451",
  sunSoft: "#2a2411",
  mars: "#e8875a",
  marsSoft: "#2a1a12",
  neptune: "#5b8ff5",
  neptuneSoft: "#141f33",
  venus: "#4fccaf",
  venusSoft: "#10241f",
  pluto: "#e06a86",
  plutoSoft: "#2a1520",
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c451] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e1a]";

// ————————————————————————————— Status-taal (label + icoon) —————————————————————————————
type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.venus,
        soft: C.venusSoft,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return {
        base: C.neptune,
        soft: C.neptuneSoft,
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
      };
    case "EXPIRING":
      return {
        base: C.mars,
        soft: C.marsSoft,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.pluto, soft: C.plutoSoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

function factuurTone(status: string): {
  base: string;
  soft: string;
  label: string;
  Icon: LucideIcon;
} {
  if (status === "Betaald")
    return { base: C.venus, soft: C.venusSoft, label: "Betaald", Icon: Check };
  if (status === "Openstaand")
    return { base: C.mars, soft: C.marsSoft, label: "Openstaand", Icon: Clock };
  return { base: C.neptune, soft: C.neptuneSoft, label: "Concept", Icon: FileText };
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

// Positie op een baan (percentage in een vierkante container). Hoek 0 = boven, met de klok mee.
function orbitPos(radiusPct: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return {
    left: `${50 + radiusPct * Math.cos(a)}%`,
    top: `${50 + radiusPct * Math.sin(a)}%`,
  };
}

const NAV_TONE: Record<ScreenKey, string> = {
  dashboard: C.sun,
  marktplaats: C.neptune,
  opdracht: C.mars,
  verificatie: C.venus,
  acties: C.mars,
  facturen: C.neptune,
  documenten: C.pluto,
  berichten: C.neptune,
};
const SCREEN_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: Orbit,
  marktplaats: Store,
  opdracht: Sparkles,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: FileText,
};

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
      className={`relative rounded-2xl ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${tone ? `${tone}3a` : C.line}`,
        boxShadow: "0 24px 60px -44px rgba(0,0,0,0.9)",
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
  tone = C.sun,
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
  const base = `inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[0.005em] transition-all duration-150 active:scale-[0.98] ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? {
          background: tone,
          color: "#0a0e1a",
          border: `1px solid ${tone}`,
          boxShadow: `0 0 22px -6px ${tone}`,
          ...sans,
        }
      : variant === "outline"
        ? { background: "transparent", color: tone, border: `1px solid ${tone}66`, ...sans }
        : { background: "transparent", color: C.fgSoft, border: "1px solid transparent", ...sans };
  const hover =
    variant === "solid"
      ? "hover:brightness-110"
      : variant === "outline"
        ? "hover:bg-[#111725]"
        : "hover:bg-[#111725]";
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
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: base, boxShadow: `0 0 6px ${base}` }}
        aria-hidden="true"
      />
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

function Kicker({ children, tone = C.sun }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.2em]"
      style={{ color: tone, ...sans }}
    >
      {children}
    </span>
  );
}

// Radiale meter (conic gradient) — vervangt balken
function RadialMeter({
  value,
  tone,
  size = 88,
  thickness = 8,
  label,
  sub,
}: {
  value: number;
  tone: string;
  size?: number;
  thickness?: number;
  label?: string;
  sub?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`${sub ?? "waarde"} ${clamped} procent`}
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(${tone} ${clamped * 3.6}deg, ${C.line} 0deg)`,
          boxShadow: `0 0 20px -6px ${tone}`,
        }}
        aria-hidden="true"
      />
      <span
        className="absolute rounded-full"
        style={{ inset: thickness, background: C.panel }}
        aria-hidden="true"
      />
      <span className="relative flex flex-col items-center">
        <span className="text-[17px] font-semibold leading-none" style={{ color: tone, ...mono }}>
          {label ?? `${clamped}%`}
        </span>
        {sub && (
          <span
            className="mt-0.5 text-[8.5px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: C.fgFaint }}
          >
            {sub}
          </span>
        )}
      </span>
    </span>
  );
}

function TitleCard({
  screen,
  title,
  sub,
  right,
}: {
  screen: ScreenKey;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  const tone = NAV_TONE[screen];
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <Kicker tone={tone}>
          <Orbit size={12} aria-hidden="true" /> {SCREENS.find((s) => s.key === screen)?.label} ·
          baan
        </Kicker>
        <h1
          className="mt-3 text-[27px] font-semibold leading-[1.08] tracking-[-0.02em] md:text-[33px]"
          style={{ color: C.fg }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed" style={{ color: C.fgMute }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept523() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [palette, setPalette] = useState(false);
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full overflow-hidden antialiased"
      style={{ ...sans, color: C.fg, background: C.bg }}
    >
      {/* Sterrenveld */}
      <StarField />
      <div className="relative mx-auto flex max-w-6xl">
        <OrbitNav screen={screen} setScreen={setScreen} onCommand={() => setPalette(true)} />
        <div className="min-w-0 flex-1">
          <TopBar onCommand={() => setPalette(true)} />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="zs-fade px-4 pb-16 pt-7 sm:px-6 md:px-8">
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

      {palette && (
        <CommandPalette screen={screen} setScreen={setScreen} onClose={() => setPalette(false)} />
      )}

      <style>{`
        @keyframes zsFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .zs-fade { animation: zsFade 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes zsSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .zs-orbit-slow { animation: zsSpin 120s linear infinite; }
        .zs-orbit-med { animation: zsSpin 80s linear infinite; }
        @keyframes zsTwinkle { 0%,100% { opacity: 0.25; } 50% { opacity: 0.7; } }
        .zs-star { animation: zsTwinkle 4s ease-in-out infinite; }
        .zs-row { transition: background 0.18s ease; }
        .zs-row:hover { background: ${C.panelSoft}; }
        .zs-planet { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .zs-planet:hover { transform: translate(-50%,-50%) scale(1.08); }
        @media (prefers-reduced-motion: reduce) {
          .zs-fade, .zs-orbit-slow, .zs-orbit-med, .zs-star { animation: none !important; }
          .zs-row, .zs-planet { transition: none !important; }
        }
      `}</style>
    </div>
  );
}

function StarField() {
  const stars = [
    { x: "8%", y: "12%", s: 2, d: "0s" },
    { x: "22%", y: "38%", s: 1, d: "1.2s" },
    { x: "38%", y: "8%", s: 1.5, d: "0.6s" },
    { x: "62%", y: "22%", s: 1, d: "2s" },
    { x: "78%", y: "10%", s: 2, d: "0.4s" },
    { x: "88%", y: "42%", s: 1.5, d: "1.6s" },
    { x: "15%", y: "72%", s: 1, d: "0.9s" },
    { x: "48%", y: "82%", s: 1.5, d: "2.4s" },
    { x: "72%", y: "68%", s: 1, d: "1.4s" },
    { x: "92%", y: "78%", s: 2, d: "0.2s" },
    { x: "33%", y: "58%", s: 1, d: "2.8s" },
    { x: "58%", y: "48%", s: 1, d: "0.7s" },
  ];
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style={{
        background: `radial-gradient(120% 80% at 15% -10%, ${C.neptune}12, transparent 60%), radial-gradient(120% 90% at 100% 110%, ${C.sun}0e, transparent 55%)`,
      }}
    >
      {stars.map((st, i) => (
        <span
          key={i}
          className="zs-star absolute rounded-full"
          style={{
            left: st.x,
            top: st.y,
            width: st.s,
            height: st.s,
            background: C.fg,
            animationDelay: st.d,
          }}
        />
      ))}
    </div>
  );
}

// —————————————————————————————————————— Orbit-nav (zijbalk) ——————————————————————————————————————
function OrbitNav({
  screen,
  setScreen,
  onCommand,
}: {
  screen: ScreenKey;
  setScreen: (s: ScreenKey) => void;
  onCommand: () => void;
}) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <aside
      className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col md:flex"
      style={{
        background: `${C.deep}cc`,
        borderRight: `1px solid ${C.line}`,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-5"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${C.sun}, ${C.mars})`,
            color: "#0a0e1a",
            boxShadow: `0 0 18px -2px ${C.sun}`,
          }}
          aria-hidden="true"
        >
          <Sun size={17} />
        </span>
        <span>
          <span
            className="block text-[15px] font-semibold tracking-[-0.01em]"
            style={{ color: C.fg }}
          >
            Zonnestelsel
          </span>
          <span
            className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: C.sun }}
          >
            alles in één baan
          </span>
        </span>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1 overflow-y-auto px-3 py-4">
        <p
          className="px-2 pb-2 text-[9px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: C.fgFaint }}
        >
          Banen
        </p>
        <ul className="space-y-1">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const tone = NAV_TONE[s.key];
            const Icon = SCREEN_ICON[s.key];
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-[13px] transition-colors ${RING}`}
                  style={on ? { background: `${tone}1c`, color: tone } : { color: C.fgSoft }}
                >
                  <span
                    className="relative flex h-7 w-7 items-center justify-center rounded-full"
                    style={{
                      background: on ? tone : C.panel,
                      color: on ? "#0a0e1a" : tone,
                      border: `1px solid ${on ? tone : C.line}`,
                      boxShadow: on ? `0 0 12px -2px ${tone}` : "none",
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={14} />
                  </span>
                  <span className="flex-1 font-medium">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-4" style={{ borderTop: `1px solid ${C.line}` }}>
        <button
          type="button"
          onClick={onCommand}
          className={`mb-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[12px] ${RING}`}
          style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.fgMute }}
        >
          <Command size={13} aria-hidden="true" /> Baan zoeken
          <span className="ml-auto text-[10px]" style={{ color: C.fgFaint, ...mono }}>
            ⌘K
          </span>
        </button>
        <div className="flex items-center gap-3">
          <RadialMeter value={ratio} tone={C.venus} size={46} thickness={5} sub="orde" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-medium" style={{ color: C.fg }}>
              {PROFIEL.naam}
            </span>
            <span className="flex items-center gap-1 text-[10px]" style={{ color: C.venus }}>
              <ShieldCheck size={10} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ onCommand }: { onCommand: () => void }) {
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (a, f) => a + parseEUR(f.bedrag),
    0,
  );
  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 sm:px-6 md:px-8"
      style={{
        background: `${C.bg}dd`,
        borderBottom: `1px solid ${C.line}`,
        backdropFilter: "blur(8px)",
      }}
    >
      <button
        type="button"
        onClick={onCommand}
        className={`flex flex-1 items-center gap-2 rounded-full px-3.5 py-2 ${RING}`}
        style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.fgMute }}
      >
        <Search size={14} aria-hidden="true" />
        <span className="text-[12.5px]">Zoek opdrachten, certificaten, facturen…</span>
        <span
          className="ml-auto hidden rounded-lg px-1.5 py-0.5 text-[10px] font-medium sm:inline"
          style={{ background: C.sink, color: C.fgFaint, ...mono }}
        >
          ⌘K
        </span>
      </button>
      <span
        className="hidden items-center gap-2 rounded-full px-3 py-2 text-[12px] font-medium sm:inline-flex"
        style={{ background: C.marsSoft, color: C.mars, border: `1px solid ${C.mars}44` }}
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
      style={{ borderBottom: `1px solid ${C.line}`, background: `${C.deep}cc` }}
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        const tone = NAV_TONE[s.key];
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${RING}`}
            style={
              on ? { background: tone, color: "#0a0e1a" } : { color: C.fgSoft, background: C.panel }
            }
          >
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

// —————————————————————————————————————— Command palette ——————————————————————————————————————
function CommandPalette({
  screen,
  setScreen,
  onClose,
}: {
  screen: ScreenKey;
  setScreen: (s: ScreenKey) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const rows = SCREENS.filter((s) => s.label.toLowerCase().includes(q.toLowerCase().trim()));
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[16vh]"
      style={{ background: "rgba(7,10,19,0.74)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Baan zoeken"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl"
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          boxShadow: "0 40px 90px -30px rgba(0,0,0,0.9)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-2.5 px-4 py-3.5"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.sun }} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Spring naar een baan…"
            aria-label="Baan zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#525d78]"
            style={{ color: C.fg }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className={`rounded p-1 ${RING}`}
            style={{ color: C.fgMute }}
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
        <ul className="max-h-72 overflow-y-auto p-2">
          {rows.length === 0 ? (
            <li className="px-3 py-8 text-center text-[13px]" style={{ color: C.fgMute }}>
              Geen baan gevonden voor “{q}”.
            </li>
          ) : (
            rows.map((s) => {
              const Icon = SCREEN_ICON[s.key];
              const tone = NAV_TONE[s.key];
              const on = s.key === screen;
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => {
                      setScreen(s.key);
                      onClose();
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] ${RING}`}
                    style={{
                      color: on ? tone : C.fgSoft,
                      background: on ? `${tone}18` : "transparent",
                    }}
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ background: C.sink, color: tone, border: `1px solid ${C.line}` }}
                      aria-hidden="true"
                    >
                      <Icon size={13} />
                    </span>
                    <span className="flex-1 font-medium">{s.label}</span>
                    <ChevronRight size={14} aria-hidden="true" style={{ color: C.fgFaint }} />
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}

// —————————————————————————————————————— Dashboard (orbitaal) ——————————————————————————————————————
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
  const [focus, setFocus] = useState(0);
  const activeOpd = (OPDRACHTEN[focus] ?? OPDRACHTEN[0]) as Opdracht;

  return (
    <div className="space-y-7">
      <TitleCard
        screen="dashboard"
        title={`Goedendag ${PROFIEL.naam.split(" ")[0]} — jouw stelsel staat op koers`}
        sub="Opdrachten cirkelen op hun baan rond je vertrouwenskern. Kies een planeet om in te zoomen."
        right={
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" tone={C.venus} onClick={onVerif}>
              <ShieldCheck size={13} aria-hidden="true" /> Dossier
            </Btn>
            <Btn variant="solid" size="sm" onClick={onActies}>
              Volgende baan <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* Orbitaal systeem */}
        <Panel className="overflow-hidden p-5" tone={C.sun}>
          <div className="flex items-center justify-between">
            <Kicker tone={C.sun}>
              <Orbit size={12} aria-hidden="true" /> Jouw baan van opdrachten
            </Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className={`rounded text-[11.5px] font-medium ${RING}`}
              style={{ color: C.sun }}
            >
              Alle opdrachten →
            </button>
          </div>

          <div className="relative mx-auto mt-4 aspect-square w-full max-w-[380px]">
            {/* Banen */}
            {[30, 44].map((r) => (
              <span
                key={r}
                className="absolute rounded-full"
                style={{
                  left: "50%",
                  top: "50%",
                  width: `${r * 2}%`,
                  height: `${r * 2}%`,
                  transform: "translate(-50%,-50%)",
                  border: `1px dashed ${C.line}`,
                }}
                aria-hidden="true"
              />
            ))}
            <span
              className="zs-orbit-slow absolute rounded-full"
              style={{
                left: "50%",
                top: "50%",
                width: "88%",
                height: "88%",
                transform: "translate(-50%,-50%)",
                border: `1px solid ${C.sun}22`,
              }}
              aria-hidden="true"
            />

            {/* Zon (kern) */}
            <button
              type="button"
              onClick={onVerif}
              aria-label={`Vertrouwenskern ${ratio} procent op orde`}
              className={`zs-planet absolute flex h-[30%] w-[30%] flex-col items-center justify-center rounded-full ${RING}`}
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%,-50%)",
                background: `radial-gradient(circle at 35% 30%, ${C.sun}, ${C.mars})`,
                boxShadow: `0 0 40px -4px ${C.sun}`,
                color: "#0a0e1a",
              }}
            >
              <span className="text-[22px] font-bold leading-none" style={{ ...mono }}>
                {ratio}%
              </span>
              <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.14em]">
                op orde
              </span>
            </button>

            {/* Planeten — opdrachten op de buitenbaan */}
            {OPDRACHTEN.map((o, i) => {
              const angle = i * (360 / OPDRACHTEN.length) + 12;
              const pos = orbitPos(44, angle);
              const tone = o.match >= 90 ? C.venus : o.match >= 85 ? C.neptune : C.mars;
              const on = i === focus;
              return (
                <button
                  key={o.id}
                  type="button"
                  onMouseEnter={() => setFocus(i)}
                  onFocus={() => setFocus(i)}
                  onClick={onOpen}
                  aria-label={`${o.titel}, match ${o.match} procent`}
                  className={`zs-planet absolute flex h-[15%] w-[15%] items-center justify-center rounded-full ${RING}`}
                  style={{
                    left: pos.left,
                    top: pos.top,
                    transform: "translate(-50%,-50%)",
                    background: tone,
                    color: "#0a0e1a",
                    boxShadow: on ? `0 0 26px -2px ${tone}` : `0 0 14px -4px ${tone}`,
                    outline: on ? `2px solid ${tone}` : "none",
                    outlineOffset: 3,
                  }}
                >
                  <span className="text-[13px] font-bold" style={{ ...mono }}>
                    {o.match}
                  </span>
                </button>
              );
            })}

            {/* Manen — certificaten op de binnenbaan */}
            {CREDENTIALS.map((c, i) => {
              const angle = i * (360 / CREDENTIALS.length) + 45;
              const pos = orbitPos(30, angle);
              const t = credTone(c.status);
              return (
                <span
                  key={c.naam}
                  className="absolute flex h-[8%] w-[8%] items-center justify-center rounded-full"
                  style={{
                    left: pos.left,
                    top: pos.top,
                    transform: "translate(-50%,-50%)",
                    background: t.soft,
                    border: `1.5px solid ${t.base}`,
                    boxShadow: `0 0 10px -3px ${t.base}`,
                  }}
                  aria-label={`${c.naam}: ${t.label}`}
                >
                  <t.Icon size={11} style={{ color: t.base }} aria-hidden="true" />
                </span>
              );
            })}
          </div>

          {/* Geselecteerde planeet-info */}
          <button
            type="button"
            onClick={onOpen}
            className={`zs-row mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left ${RING}`}
            style={{ background: C.sink, border: `1px solid ${C.line}` }}
          >
            <RadialMeter
              value={activeOpd.match}
              tone={activeOpd.match >= 90 ? C.venus : C.neptune}
              size={52}
              thickness={5}
              sub="match"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium" style={{ color: C.fg }}>
                {activeOpd.titel}
              </span>
              <span
                className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                style={{ color: C.fgMute }}
              >
                <MapPin size={11} aria-hidden="true" /> {activeOpd.opdrachtgever} ·{" "}
                {activeOpd.plaats} · {activeOpd.tarief.replace(" / uur", "")}/u
              </span>
            </span>
            <ChevronRight size={16} aria-hidden="true" style={{ color: C.fgFaint }} />
          </button>
        </Panel>

        <div className="space-y-5">
          <Panel className="p-5" tone={C.venus}>
            <Kicker tone={C.venus}>
              <ShieldCheck size={12} aria-hidden="true" /> Vertrouwenskern
            </Kicker>
            <div className="mt-3 flex items-center gap-4">
              <RadialMeter value={ratio} tone={C.venus} size={82} thickness={8} sub="op orde" />
              <div className="min-w-0">
                <p className="text-[12.5px] leading-relaxed" style={{ color: C.fgSoft }}>
                  {verified} van {CREDENTIALS.length} certificaten geverifieerd · {PROFIEL.trust}.
                </p>
                <div className="mt-2 flex gap-1.5" aria-hidden="true">
                  {CREDENTIALS.map((c) => {
                    const t = credTone(c.status);
                    return (
                      <span
                        key={c.naam}
                        className="h-1.5 flex-1 rounded-full"
                        style={{ background: c.status === "VERIFIED" ? C.venus : `${t.base}88` }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="p-5" tone={C.mars} as="article">
            <Kicker tone={C.mars}>
              <AlertTriangle size={12} aria-hidden="true" /> Naderende komeet
            </Kicker>
            <h3 className="mt-2.5 text-[16px] font-semibold leading-snug" style={{ color: C.fg }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.fgSoft }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" full tone={C.mars} className="mt-4" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Panel>
        </div>
      </section>

      {/* KPI's als radiale meters */}
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {KPIS.map((k, i) => {
          const tone = [C.sun, C.neptune, C.venus, C.mars][i % 4] ?? C.sun;
          const pct = 40 + ((i * 17) % 55);
          return (
            <Panel key={k.label} className="flex items-center gap-3.5 p-4" tone={tone}>
              <RadialMeter
                value={pct}
                tone={tone}
                size={58}
                thickness={6}
                label={k.value.length > 5 ? "€" : k.value}
                sub="nu"
              />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium" style={{ color: C.fgMute }}>
                  {k.label}
                </p>
                <p
                  className="mt-0.5 text-[17px] font-semibold leading-none"
                  style={{ color: C.fg, ...mono }}
                >
                  {k.value}
                </p>
                <p
                  className="mt-1 text-[11px] font-medium"
                  style={{ color: k.up ? C.venus : C.mars }}
                >
                  {k.up ? "▲" : "▼"} {k.trend}
                </p>
              </div>
            </Panel>
          );
        })}
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
      <TitleCard
        screen="marktplaats"
        title="Opdrachten in jouw baan"
        sub={`${rows.length} van ${OPDRACHTEN.length} opdrachten cirkelen op je geverifieerde profiel.`}
      />

      <Panel className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center" tone={C.neptune}>
        <div
          className="flex flex-1 items-center gap-2 rounded-full px-3.5 py-2"
          style={{ background: C.sink, border: `1px solid ${C.line}` }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.fgFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#525d78]"
            style={{ color: C.fg }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className={`rounded p-0.5 ${RING}`}
              style={{ color: C.fgMute }}
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
              tone={C.neptune}
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
          tone={C.pluto}
          titel="Signaal verloren"
          tekst="De opdrachten konden zojuist niet worden opgehaald. Herstel de verbinding en probeer opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.neptune}
          titel="Geen planeet gevonden"
          tekst={`Niets voor ${q ? `“${q}”` : "je zoekterm"}. Verruim je baan en probeer opnieuw.`}
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
            className={`rounded text-[10px] font-semibold uppercase tracking-[0.16em] underline-offset-2 hover:underline ${RING}`}
            style={{ color: C.fgFaint }}
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
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{
          color: tone,
          background: `${tone}1f`,
          border: `1px solid ${tone}44`,
          boxShadow: `0 0 26px -6px ${tone}`,
        }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-5 text-[20px] font-semibold" style={{ color: C.fg }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
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
  const tone = strong ? C.venus : C.neptune;
  return (
    <Panel as="article" className="overflow-hidden" tone={tone}>
      <div className="flex items-start gap-4 p-5">
        <span className="shrink-0">
          <RadialMeter value={opdracht.match} tone={tone} size={64} thickness={7} sub="match" />
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.12em]"
            style={{ color: C.fgFaint, ...mono }}
          >
            <span>#{String(index + 1).padStart(2, "0")}</span>
            <span aria-hidden="true">·</span>
            <span>{opdracht.id}</span>
            <span aria-hidden="true">·</span>
            <span style={{ color: tone }}>{strong ? "kernbaan" : "buitenbaan"}</span>
          </div>
          <h3
            className="mt-1 text-[16.5px] font-semibold leading-snug tracking-[-0.01em]"
            style={{ color: C.fg }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.fgMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{ background: C.sink, color: C.fgSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[16px] font-semibold" style={{ color: C.fg, ...mono }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span
            className="text-[9px] font-medium uppercase tracking-[0.08em]"
            style={{ color: C.fgFaint }}
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
          className={`inline-flex items-center gap-1.5 rounded text-[12px] font-medium ${RING}`}
          style={{ color: tone }}
        >
          <Sparkles size={13} aria-hidden="true" /> Waarom deze match
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
            className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2"
            style={{ borderTop: `1px solid ${C.lineSoft}` }}
          >
            <RedenKolom
              titel="In je voordeel"
              tone={C.venus}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.mars}
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
        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: tone }}
      >
        <Icon size={12} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-3 space-y-2.5">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[13px] leading-snug"
            style={{ color: C.fgSoft }}
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: tone, boxShadow: `0 0 6px ${tone}` }}
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
  const tone = strong ? C.venus : C.neptune;
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur" },
    { l: "Omvang", v: opdracht.uren, s: "per week" },
    { l: "Aanvang", v: opdracht.start, s: "startdatum" },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel" },
  ];
  return (
    <div className="space-y-6">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar de baan
      </Btn>

      <Panel className="overflow-hidden" tone={tone}>
        <div
          className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center md:p-8"
          style={{
            background: `radial-gradient(120% 120% at 100% 0%, ${tone}14, transparent 55%)`,
          }}
        >
          <RadialMeter value={opdracht.match} tone={tone} size={104} thickness={10} sub="match" />
          <div className="min-w-0 flex-1">
            <div
              className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em]"
              style={{ color: C.fgFaint, ...mono }}
            >
              <span>{opdracht.id}</span>
              <span aria-hidden="true">·</span>
              <span
                className="rounded-full px-2 py-0.5"
                style={{ color: tone, background: `${tone}1f` }}
              >
                {strong ? "kernbaan" : "buitenbaan"}
              </span>
            </div>
            <h1
              className="mt-2.5 max-w-2xl text-[26px] font-semibold leading-[1.12] tracking-[-0.02em] md:text-[31px]"
              style={{ color: C.fg }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-[13.5px]" style={{ color: C.fgMute }}>
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  style={{ background: C.sink, color: C.fgSoft, border: `1px solid ${C.line}` }}
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
                className="text-[9px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.fgMute }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-semibold leading-none"
                style={{ color: C.fg, ...mono }}
              >
                {m.v}
              </p>
              <p className="mt-1 text-[10.5px]" style={{ color: C.fgFaint }}>
                {m.s}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-6 md:p-8" tone={C.sun}>
        <Kicker tone={C.sun}>
          <ListChecks size={12} aria-hidden="true" /> Navolgbaar — geen verborgen score
        </Kicker>
        <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
          Afgezet tegen je geverifieerde profiel. Wat in je voordeel spreekt, en wat goed is om
          vooraf te weten.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.venus }}
            >
              <Check size={13} aria-hidden="true" /> In je voordeel
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ color: C.fgSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.venus }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.mars }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ color: C.fgSoft }}
                >
                  <AlertTriangle
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.mars }}
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
      <TitleCard
        screen="verificatie"
        title="Vertrouwenskern"
        sub={`${verified} van ${CREDENTIALS.length} certificaten geverifieerd · ${PROFIEL.trust}.`}
        right={<RadialMeter value={ratio} tone={C.venus} size={80} thickness={8} sub="op orde" />}
      />

      <Panel className="p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((st) => {
            const t = credTone(st);
            const count = CREDENTIALS.filter((c) => c.status === st).length;
            return (
              <span key={st} className="inline-flex items-center gap-2">
                <span className="text-[16px] font-semibold" style={{ color: t.base, ...mono }}>
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
                  className={`flex w-full items-center gap-3 px-5 py-4 text-left ${RING}`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: t.soft,
                      color: t.base,
                      border: `1px solid ${t.base}55`,
                      boxShadow: `0 0 14px -5px ${t.base}`,
                    }}
                    aria-hidden="true"
                  >
                    <t.Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14px] font-medium"
                      style={{ color: C.fg }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="block truncate text-[11.5px]"
                      style={{ color: t.alarm ? t.base : C.fgMute }}
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
                      color: C.fgFaint,
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
                        style={{ color: C.fgSoft }}
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
      <TitleCard
        screen="acties"
        title="Wat vandaag je aandacht vraagt"
        sub="Op volgorde van urgentie — de dichtstbijzijnde komeet eerst."
      />
      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.mars : C.neptune;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Panel className="flex items-start gap-4 p-5" tone={tone}>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold"
                  style={{
                    background: `${tone}1f`,
                    color: tone,
                    border: `1px solid ${tone}55`,
                    boxShadow: `0 0 14px -5px ${tone}`,
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
                    className="mt-2 text-[16px] font-semibold leading-snug"
                    style={{ color: C.fg }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[13px] leading-relaxed"
                    style={{ color: C.fgSoft }}
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
  const grand = totals.betaald + totals.open + totals.concept;

  return (
    <div className="space-y-6">
      <TitleCard
        screen="facturen"
        title="Je facturen in een baan"
        sub="Klik een regel om de opbouw te openen."
        right={
          <Btn variant="solid" size="sm">
            <Receipt size={13} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: totals.betaald, sub: "2 facturen", tone: C.venus, Icon: Check },
          {
            l: "Openstaand",
            v: totals.open,
            sub: "1 factuur · 9 dagen",
            tone: C.mars,
            Icon: Clock,
          },
          {
            l: "Concept",
            v: totals.concept,
            sub: "klaar om te versturen",
            tone: C.neptune,
            Icon: FileText,
          },
        ].map((s) => (
          <Panel key={s.l} className="flex items-center gap-3.5 p-4" tone={s.tone}>
            <RadialMeter
              value={grand ? Math.round((s.v / grand) * 100) : 0}
              tone={s.tone}
              size={56}
              thickness={6}
              sub="deel"
            />
            <div className="min-w-0">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: s.tone }}
              >
                {s.l}
              </p>
              <p
                className="mt-1 text-[20px] font-semibold leading-none"
                style={{ color: C.fg, ...mono }}
              >
                {eur0.format(s.v)}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: C.fgMute }}>
                {s.sub}
              </p>
            </div>
          </Panel>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="overflow-hidden" tone={C.neptune}>
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <Kicker tone={C.neptune}>
              <Receipt size={12} aria-hidden="true" /> Facturen
            </Kicker>
            <div className="flex items-center gap-1.5" role="group" aria-label="Facturen sorteren">
              {(["datum", "bedrag"] as const).map((s) => (
                <Btn
                  key={s}
                  size="sm"
                  tone={C.neptune}
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
                      className={`px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${i === 3 ? "text-right" : ""}`}
                      style={{ color: C.fgMute }}
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
                      className={`zs-row cursor-pointer ${RING}`}
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
                        background: on ? C.neptuneSoft : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3 text-[12px] font-medium"
                        style={{ color: on ? C.neptune : C.fgSoft, ...mono }}
                      >
                        {f.nr}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-medium" style={{ color: C.fg }}>
                        {f.klant}
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: C.fgMute, ...mono }}>
                        {f.datum}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-[13px] font-semibold"
                        style={{ color: C.fg, ...mono }}
                      >
                        {f.bedrag}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11.5px] font-medium"
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
    <Panel as="article" className="overflow-hidden" tone={t.base}>
      <div className="p-5" style={{ borderBottom: `1px solid ${C.line}` }}>
        <p
          className="text-[9px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: t.base }}
        >
          Factuur
        </p>
        <p className="text-[17px] font-semibold" style={{ color: C.fg, ...mono }}>
          {factuur.nr}
        </p>
      </div>
      <div className="space-y-3 p-5 text-[12.5px]">
        <Row label="Klant" value={factuur.klant} />
        <Row label="Datum" value={factuur.datum} isMono />
        <div className="flex items-baseline justify-between">
          <span className="text-[12px]" style={{ color: C.fgMute }}>
            Status
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: t.base }}>
            <t.Icon size={12} aria-hidden="true" /> {t.label}
          </span>
        </div>
        <div className="my-3 h-px" style={{ background: C.line }} />
        <Row label="Subtotaal" value={eur0.format(subtotal)} isMono />
        <Row label="Btw 21%" value={eur0.format(btw)} isMono />
        <div className="my-3 h-px" style={{ background: `${t.base}44` }} />
        <div className="flex items-baseline justify-between">
          <span
            className="text-[12px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: C.fg }}
          >
            Totaal
          </span>
          <span className="text-[20px] font-semibold" style={{ color: t.base, ...mono }}>
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
      <span className="shrink-0 text-[12px]" style={{ color: C.fgMute }}>
        {label}
      </span>
      <span
        className="min-w-0 flex-1 self-end border-b border-dotted"
        style={{ borderColor: C.line }}
        aria-hidden="true"
      />
      <span
        className="shrink-0 text-right text-[12.5px] font-medium"
        style={{ color: C.fg, ...(isMono ? mono : sans) }}
      >
        {value}
      </span>
    </div>
  );
}
