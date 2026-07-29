"use client";

// Concept 530 — "Passerpunt" · Teken-instrument-precisie. Licht tekenpapier (bg #eef0ec) met inkt-tekst
// (#1c2530) en teken-navy accent (#2b4c7e). De taal van de tekentafel: passer-arcs, dunne dashed
// constructie-/hulplijnen, maatvoering met pijltjes, hoeken en cirkelsegmenten. Alles voelt exact
// uitgemeten en gecomponeerd met liniaal en passer — technisch, koel, rustig. Data staat als het
// "gemeten object" binnen een tekenkader. Kleur is nooit de enige status-drager (label + icoon).

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  Command,
  Compass,
  FileText,
  Hash,
  LayoutGrid,
  ListChecks,
  MapPin,
  Plus,
  Receipt,
  Ruler,
  RotateCcw,
  Search,
  ShieldCheck,
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

// ————————————————————————————— Palet — tekenpapier, inkt & teken-navy —————————————————————————————
const C = {
  bg: "#eef0ec",
  paper: "#f7f8f5",
  paperAlt: "#fbfcfa",
  sink: "#e6e9e3",
  line: "#c9cfc6",
  lineSoft: "#d9ddd5",
  grid: "#dfe3db",
  construct: "#9aa4a0", // dashed hulplijn
  ink: "#1c2530",
  inkSoft: "#3d4753",
  inkMute: "#697380",
  inkFaint: "#98a0a8",
  navy: "#2b4c7e",
  navySoft: "#e2e8f1",
  navyDeep: "#1e3860",
  groen: "#3f7a52",
  groenSoft: "#e2eee6",
  amber: "#9a6b1a",
  amberSoft: "#f2ead6",
  rood: "#b3402f",
  roodSoft: "#f4e2de",
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b4c7e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef0ec]";

// ————————————————————————————— Status-taal (label + icoon) —————————————————————————————
type Tone = {
  base: string;
  soft: string;
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
};

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.groen,
        soft: C.groenSoft,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return { base: C.navy, soft: C.navySoft, label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return {
        base: C.amber,
        soft: C.amberSoft,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.rood, soft: C.roodSoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

function factuurTone(status: string): {
  base: string;
  soft: string;
  label: string;
  Icon: LucideIcon;
} {
  if (status === "Betaald")
    return { base: C.groen, soft: C.groenSoft, label: "Betaald", Icon: Check };
  if (status === "Openstaand")
    return { base: C.amber, soft: C.amberSoft, label: "Openstaand", Icon: Clock };
  return { base: C.navy, soft: C.navySoft, label: "Concept", Icon: Hash };
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

// ————————————————————————————— Teken-primitieven (passer, maatvoering, tekenkader) —————————————————————————————
// Constructie-hoekmarkeringen: dunne "cross-hair" tekens in de vier hoeken van een tekenkader.
function CornerTick({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const place: Record<typeof pos, CSSProperties> = {
    tl: { top: 6, left: 6 },
    tr: { top: 6, right: 6 },
    bl: { bottom: 6, left: 6 },
    br: { bottom: 6, right: 6 },
  };
  return (
    <span
      className="pointer-events-none absolute h-2.5 w-2.5"
      style={place[pos]}
      aria-hidden="true"
    >
      <span
        className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2"
        style={{ background: C.construct }}
      />
      <span
        className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2"
        style={{ background: C.construct }}
      />
    </span>
  );
}

// Maatvoering-strip: dubbele pijl met maat, zoals op een technische tekening.
function Maatlijn({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1.5" aria-hidden="true">
      <span className="text-navy" style={{ color: C.construct }}>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path
            d="M7 1 L1 4 L7 7"
            stroke={C.construct}
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="h-px flex-1" style={{ background: C.construct }} />
      <span
        className="rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]"
        style={{ color: C.inkMute, background: C.sink, ...mono }}
      >
        {label}
      </span>
      <span className="h-px flex-1" style={{ background: C.construct }} />
      <span style={{ color: C.construct }}>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path
            d="M1 1 L7 4 L1 7"
            stroke={C.construct}
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </span>
  );
}

function Panel({
  children,
  className = "",
  as: Tag = "div",
  ticks = false,
  tone,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  ticks?: boolean;
  tone?: string;
}) {
  return (
    <Tag
      className={`relative rounded-md ${className}`}
      style={{
        background: C.paper,
        border: `1px solid ${tone ? `${tone}55` : C.line}`,
        boxShadow: "0 1px 0 rgba(28,37,48,0.04), 0 12px 30px -26px rgba(28,37,48,0.4)",
      }}
    >
      {ticks && (
        <>
          <CornerTick pos="tl" />
          <CornerTick pos="tr" />
          <CornerTick pos="bl" />
          <CornerTick pos="br" />
        </>
      )}
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
  tone = C.navy,
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
  const base = `inline-flex items-center justify-center gap-2 rounded-md font-semibold tracking-[0.01em] transition-all duration-150 active:scale-[0.98] ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? {
          background: tone,
          color: "#fff",
          border: `1px solid ${tone}`,
          boxShadow: `0 6px 14px -10px ${tone}`,
          ...sans,
        }
      : variant === "outline"
        ? { background: C.paper, color: tone, border: `1px solid ${tone}66`, ...sans }
        : { background: "transparent", color: C.inkSoft, border: "1px solid transparent", ...sans };
  const hover = variant === "solid" ? "hover:brightness-110" : "hover:bg-[#e6e9e3]";
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
      className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: base, background: soft, border: `1px solid ${base}44`, ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// Match als passer-arc: een cirkelsegment dat de "gemeten hoek" tekent.
function MatchArc({ value }: { value: number }) {
  const strong = value >= 90;
  const tone = strong ? C.groen : C.navy;
  const r = 22;
  const cx = 28;
  const cy = 28;
  const frac = value / 100;
  const endAng = -Math.PI / 2 + frac * 2 * Math.PI;
  const startAng = -Math.PI / 2;
  const large = frac > 0.5 ? 1 : 0;
  const x1 = cx + Math.cos(startAng) * r;
  const y1 = cy + Math.sin(startAng) * r;
  const x2 = cx + Math.cos(endAng) * r;
  const y2 = cy + Math.sin(endAng) * r;
  return (
    <span
      className="relative inline-flex h-14 w-14 items-center justify-center"
      aria-label={`Match ${value} procent`}
    >
      <svg
        viewBox="0 0 56 56"
        width="56"
        height="56"
        className="absolute inset-0"
        aria-hidden="true"
      >
        {/* constructie-cirkel */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={C.line}
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        {/* hulpstralen */}
        <line x1={cx} y1={cy} x2={x1} y2={y1} stroke={C.construct} strokeWidth="0.6" />
        <line x1={cx} y1={cy} x2={x2} y2={y2} stroke={C.construct} strokeWidth="0.6" />
        {/* de gemeten arc */}
        <path
          d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
          fill="none"
          stroke={tone}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* passerpunt */}
        <circle cx={cx} cy={cy} r="1.6" fill={tone} />
        <circle cx={x2} cy={y2} r="2" fill={C.paper} stroke={tone} strokeWidth="1.4" />
      </svg>
      <span className="relative text-[13px] font-bold" style={{ color: tone, ...mono }}>
        {value}
      </span>
    </span>
  );
}

function Kicker({ children, tone = C.navy }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em]"
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
}: {
  code: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <span
            className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.2em]"
            style={{ color: C.navy, background: C.navySoft, border: `1px solid ${C.navy}33` }}
          >
            <Compass size={11} aria-hidden="true" />
            {code}
          </span>
          <h1
            className="mt-2.5 text-[26px] font-semibold leading-tight tracking-[-0.02em] md:text-[31px]"
            style={{ color: C.ink, ...sans }}
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
      <div className="mt-4">
        <Maatlijn label="richtlijn" />
      </div>
    </div>
  );
}

const NAV: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: MapPin,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: FileText,
};

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept530() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [palet, setPalet] = useState(false);
  const active = OPDRACHTEN[0] as Opdracht;

  const gridBg: CSSProperties = {
    backgroundColor: C.bg,
    backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`,
    backgroundSize: "26px 26px",
  };

  return (
    <div className="min-h-[760px] w-full antialiased" style={{ ...sans, color: C.ink, ...gridBg }}>
      <div className="mx-auto flex max-w-6xl">
        <Sidebar screen={screen} setScreen={setScreen} onPalet={() => setPalet(true)} />
        <div className="min-w-0 flex-1">
          <TopBar onPalet={() => setPalet(true)} />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="pp-fade px-4 pb-20 pt-6 sm:px-6 md:px-8">
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

      {palet && (
        <Passermenu screen={screen} setScreen={setScreen} onClose={() => setPalet(false)} />
      )}

      <style>{`
        @keyframes ppFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .pp-fade { animation: ppFade 0.32s cubic-bezier(0.22,1,0.36,1) both; }
        .pp-row { transition: background 0.16s ease; }
        .pp-row:hover { background: ${C.paperAlt}; }
        @media (prefers-reduced-motion: reduce) { .pp-fade { animation: none !important; } .pp-row { transition: none !important; } }
      `}</style>
    </div>
  );
}

// —————————————————————————————————————— Sidebar ——————————————————————————————————————
function Sidebar({
  screen,
  setScreen,
  onPalet,
}: {
  screen: ScreenKey;
  setScreen: (s: ScreenKey) => void;
  onPalet: () => void;
}) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <aside
      className="sticky top-0 hidden h-screen w-[244px] shrink-0 flex-col md:flex"
      style={{ background: C.paper, borderRight: `1px solid ${C.line}` }}
    >
      <div className="px-5 py-5" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-md"
            style={{ background: C.navy, color: "#fff", boxShadow: `0 6px 16px -8px ${C.navy}` }}
            aria-hidden="true"
          >
            <Compass size={18} />
          </span>
          <span>
            <span
              className="block text-[15px] font-semibold tracking-[-0.01em]"
              style={{ color: C.ink }}
            >
              Passerpunt
            </span>
            <span
              className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.22em]"
              style={{ color: C.navy }}
            >
              exact gemeten
            </span>
          </span>
        </div>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1 overflow-y-auto px-3 py-4">
        <p
          className="px-2 pb-2 text-[9px] font-bold uppercase tracking-[0.22em]"
          style={{ color: C.inkFaint }}
        >
          Tekenblad
        </p>
        <ul className="space-y-0.5">
          {SCREENS.map((s, idx) => {
            const on = s.key === screen;
            const Icon = NAV[s.key];
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`group relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] font-medium transition-colors ${RING}`}
                  style={
                    on
                      ? {
                          background: C.navySoft,
                          color: C.navyDeep,
                          border: `1px solid ${C.navy}33`,
                        }
                      : { color: C.inkSoft, border: "1px solid transparent" }
                  }
                >
                  <span
                    className="text-[9px] font-bold"
                    style={{ color: on ? C.navy : C.inkFaint, ...mono }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <Icon size={15} aria-hidden="true" style={{ color: on ? C.navy : C.inkMute }} />
                  <span className="flex-1">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={onPalet}
          className={`mt-4 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12px] font-medium ${RING}`}
          style={{ color: C.inkMute, border: `1px dashed ${C.construct}` }}
        >
          <Command size={14} aria-hidden="true" style={{ color: C.navy }} />
          Passermenu
          <span
            className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold"
            style={{ background: C.sink, color: C.inkFaint, ...mono }}
          >
            ⌘K
          </span>
        </button>
      </nav>

      <div className="px-4 py-4" style={{ borderTop: `1px solid ${C.line}` }}>
        <div
          className="mb-3 rounded-md p-3"
          style={{ background: C.groenSoft, border: `1px solid ${C.groen}33` }}
        >
          <p
            className="text-[9px] font-bold uppercase tracking-[0.18em]"
            style={{ color: C.groen }}
          >
            Dossier op orde
          </p>
          <p className="mt-1 text-[18px] font-bold leading-none" style={{ color: C.ink, ...mono }}>
            {verified}/{CREDENTIALS.length}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-md text-[11px] font-bold"
            style={{ background: C.navy, color: "#fff", ...mono }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-semibold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </span>
            <span
              className="flex items-center gap-1 text-[10px] font-semibold"
              style={{ color: C.groen }}
            >
              <ShieldCheck size={10} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ onPalet }: { onPalet: () => void }) {
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
        backdropFilter: "blur(8px)",
      }}
    >
      <button
        type="button"
        onClick={onPalet}
        className={`flex flex-1 items-center gap-2 rounded-md px-3.5 py-2 text-left ${RING}`}
        style={{ background: C.paper, border: `1px solid ${C.line}` }}
        aria-label="Passermenu zoeken openen"
      >
        <Search size={14} aria-hidden="true" style={{ color: C.navy }} />
        <span className="text-[12.5px]" style={{ color: C.inkFaint }}>
          Zoek opdrachten, certificaten, facturen…
        </span>
        <span
          className="ml-auto hidden rounded px-1.5 py-0.5 text-[10px] font-bold sm:inline"
          style={{ background: C.sink, color: C.inkMute, ...mono }}
        >
          ⌘K
        </span>
      </button>
      <span
        className="hidden items-center gap-2 rounded-md px-3 py-2 text-[12px] font-semibold sm:inline-flex"
        style={{ background: C.amberSoft, color: C.amber, border: `1px solid ${C.amber}33` }}
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
      style={{ borderBottom: `1px solid ${C.line}`, background: C.paper }}
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`shrink-0 rounded-md px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
            style={
              on ? { background: C.navy, color: "#fff" } : { color: C.inkSoft, background: C.sink }
            }
          >
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

// —————————————————————————————————————— Passermenu (command-menu) ——————————————————————————————————————
function Passermenu({
  screen,
  setScreen,
  onClose,
}: {
  screen: ScreenKey;
  setScreen: (s: ScreenKey) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const items = SCREENS.filter((s) => s.label.toLowerCase().includes(q.toLowerCase().trim()));
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      style={{ background: "#1c253099", backdropFilter: "blur(3px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Passermenu — snelnavigatie"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-md"
        style={{
          background: C.paper,
          border: `1px solid ${C.navy}44`,
          boxShadow: "0 30px 80px -30px rgba(28,37,48,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-2.5 px-4 py-3.5"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.navy }} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Meet een scherm aan…"
            aria-label="Zoek een scherm"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#98a0a8]"
            style={{ color: C.ink }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className={`rounded p-1 ${RING}`}
            style={{ color: C.inkMute }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="px-3 py-2">
          <Maatlijn label="index" />
        </div>
        <ul className="max-h-72 overflow-y-auto px-2 pb-3">
          {items.length === 0 ? (
            <li className="px-3 py-8 text-center text-[13px]" style={{ color: C.inkMute }}>
              Geen scherm gevonden voor “{q}”.
            </li>
          ) : (
            items.map((s, idx) => {
              const Icon = NAV[s.key];
              const on = s.key === screen;
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => {
                      setScreen(s.key);
                      onClose();
                    }}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[13.5px] font-medium ${RING}`}
                    style={
                      on ? { background: C.navySoft, color: C.navyDeep } : { color: C.inkSoft }
                    }
                  >
                    <span className="text-[9px] font-bold" style={{ color: C.inkFaint, ...mono }}>
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <Icon size={16} aria-hidden="true" style={{ color: C.navy }} />
                    <span className="flex-1">{s.label}</span>
                    <ChevronRight size={15} aria-hidden="true" style={{ color: C.inkFaint }} />
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
        title={`Werkblad — ${PROFIEL.naam.split(" ")[0]}`}
        sub="Alles is ingemeten en op maat. Drie posten vragen vandaag om je aandacht — daarna sluit de tekening."
        right={
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" tone={C.groen} onClick={onVerif}>
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
          <Panel key={k.label} className="p-4" ticks>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold" style={{ color: C.inkMute }}>
                {k.label}
              </p>
              <Ruler size={13} aria-hidden="true" style={{ color: C.navy }} />
            </div>
            <p
              className="mt-2 text-[26px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.ink, ...mono }}
            >
              {k.value}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  color: k.up ? C.groen : C.amber,
                  background: k.up ? C.groenSoft : C.amberSoft,
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
                      className="w-[3px]"
                      style={{ height: h, background: last ? C.navy : `${C.navy}40` }}
                    />
                  );
                })}
              </span>
            </div>
          </Panel>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        <Panel className="overflow-hidden" ticks>
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <Kicker>
              <Store size={13} aria-hidden="true" /> Op maat voor jou
            </Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className={`rounded text-[11.5px] font-semibold ${RING}`}
              style={{ color: C.navy }}
            >
              Alle opdrachten →
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={onOpen}
                  className={`pp-row flex w-full items-center gap-3.5 px-5 py-4 text-left ${RING}`}
                  style={{ borderTop: i === 0 ? "none" : `1px dashed ${C.lineSoft}` }}
                >
                  <MatchArc value={o.match} />
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
                      className="text-[9px] font-bold uppercase tracking-[0.12em]"
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
          <Panel className="p-5" ticks>
            <Kicker tone={C.groen}>
              <ShieldCheck size={13} aria-hidden="true" /> Vertrouwenssaldo
            </Kicker>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[36px] font-bold leading-none tracking-[-0.03em]"
                style={{ color: C.groen, ...mono }}
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
                    className="h-2 flex-1"
                    style={{ background: c.status === "VERIFIED" ? C.groen : `${t.base}66` }}
                  />
                );
              })}
            </div>
            <p className="mt-2.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd · {PROFIEL.trust}.
            </p>
          </Panel>

          <Panel className="p-5" as="article" tone={C.amber}>
            <Kicker tone={C.amber}>
              <AlertTriangle size={13} aria-hidden="true" /> Termijn nadert
            </Kicker>
            <h3 className="mt-2 text-[15px] font-semibold leading-snug" style={{ color: C.ink }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" full tone={C.amber} className="mt-4" onClick={onActies}>
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
          className="flex flex-1 items-center gap-2 rounded-md px-3.5 py-2"
          style={{ background: C.sink, border: `1px solid ${C.line}` }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.navy }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#98a0a8]"
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
                  className="h-4 w-2/3 animate-pulse rounded motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
                <div
                  className="h-3 w-1/2 animate-pulse rounded motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
              </Panel>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={AlertTriangle}
          tone={C.rood}
          titel="Even niet gelukt"
          tekst="De opdrachten konden zojuist niet worden opgehaald. Probeer het rustig opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.navy}
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
            className={`rounded text-[10.5px] font-bold uppercase tracking-[0.16em] underline-offset-2 hover:underline ${RING}`}
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
    <Panel className="flex flex-col items-center px-6 py-16 text-center" ticks tone={tone}>
      <span
        className="flex h-16 w-16 items-center justify-center rounded-md"
        style={{ color: tone, background: `${tone}1a`, border: `1px solid ${tone}44` }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-4 text-[19px] font-semibold" style={{ color: C.ink }}>
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
  return (
    <Panel as="article" className="overflow-hidden" ticks>
      <div className="flex items-start gap-4 p-5">
        <span className="shrink-0 pt-0.5">
          <MatchArc value={opdracht.match} />
          <span className="mt-2 flex justify-center">
            <span
              className="rounded-sm px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.08em]"
              style={{
                color: strong ? C.groen : C.navy,
                background: strong ? C.groenSoft : C.navySoft,
                border: `1px solid ${strong ? C.groen : C.navy}33`,
              }}
            >
              {strong ? "sterk" : "goed"}
            </span>
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 text-[10.5px] font-semibold"
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
                className="rounded-sm px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ background: C.navySoft, color: C.navy, border: `1px solid ${C.navy}22` }}
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
            className="text-[9px] font-bold uppercase tracking-[0.12em]"
            style={{ color: C.inkFaint }}
          >
            per uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-2 px-5 py-3"
        style={{ borderTop: `1px dashed ${C.lineSoft}`, background: C.paperAlt }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 rounded text-[12px] font-semibold ${RING}`}
          style={{ color: C.navy }}
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
            style={{ borderTop: `1px dashed ${C.lineSoft}` }}
          >
            <RedenKolom
              titel="In je voordeel"
              tone={C.groen}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.amber}
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
        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em]"
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
              className="mt-1.5 h-1.5 w-1.5 shrink-0"
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
  const tone = strong ? C.groen : C.navy;
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

      <Panel className="overflow-hidden" ticks>
        <div className="p-6">
          <div
            className="flex items-center gap-2 text-[11px] font-semibold"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>{opdracht.id}</span>
            <span aria-hidden="true">·</span>
            <span
              className="rounded-sm px-2 py-0.5 uppercase tracking-[0.08em]"
              style={{ color: tone, background: `${tone}1a` }}
            >
              {strong ? "sterke match" : "goede match"} {opdracht.match}%
            </span>
          </div>
          <h1
            className="mt-2.5 max-w-2xl text-[26px] font-semibold leading-[1.14] tracking-[-0.02em] md:text-[30px]"
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
                className="rounded-sm px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ background: C.navySoft, color: C.navy, border: `1px solid ${C.navy}22` }}
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
                borderRight: i < 3 ? `1px dashed ${C.lineSoft}` : "none",
                borderTop: i >= 2 ? `1px dashed ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[9px] font-bold uppercase tracking-[0.14em]"
                style={{ color: C.navy }}
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

      <Panel className="p-6" ticks>
        <Kicker>
          <ListChecks size={13} aria-hidden="true" /> Navolgbaar — geen verborgen score
        </Kicker>
        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je geverifieerde profiel. Wat in je voordeel spreekt, en wat goed is om
          vooraf te weten.
        </p>
        <div className="mt-4">
          <Maatlijn label="analyse" />
        </div>
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.groen }}
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
                    style={{ color: C.groen }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.amber }}
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
                    style={{ color: C.amber }}
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
          <div
            className="rounded-md px-4 py-2 text-right"
            style={{ background: C.groenSoft, border: `1px solid ${C.groen}33` }}
          >
            <p
              className="text-[28px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.groen, ...mono }}
            >
              {ratio}%
            </p>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.groen }}
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
                  <span
                    className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                    style={{ background: t.soft, color: t.base, border: `1px solid ${t.base}33` }}
                    aria-hidden="true"
                  >
                    <t.Icon size={17} />
                  </span>
                  <span className="relative min-w-0 flex-1">
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
                      style={{ borderTop: `1px dashed ${C.lineSoft}`, paddingTop: 12 }}
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
        title="Wat vandaag je aandacht vraagt"
        sub="Op volgorde van urgentie — meet ze af en sluit de tekening."
      />
      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.navy;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Panel className="flex items-start gap-4 p-5" tone={tone}>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-[15px] font-bold"
                  style={{
                    background: `${tone}1a`,
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
                      <AlertTriangle size={13} aria-hidden="true" />
                    ) : (
                      <Clock size={13} aria-hidden="true" />
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
          { l: "Betaald", v: totals.betaald, sub: "2 facturen", tone: C.groen, Icon: Check },
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
            tone: C.navy,
            Icon: Hash,
          },
        ].map((s) => (
          <Panel key={s.l} className="p-4" ticks tone={s.tone}>
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.14em]"
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
          </Panel>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="overflow-hidden" ticks>
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <Kicker>
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
                      className={`px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.14em] ${i === 3 ? "text-right" : ""}`}
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
                      className={`pp-row cursor-pointer ${RING}`}
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
                        borderTop: `1px dashed ${C.lineSoft}`,
                        background: on ? C.navySoft : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3 text-[12px] font-semibold"
                        style={{ color: on ? C.navyDeep : C.inkSoft, ...mono }}
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
    <Panel as="article" className="overflow-hidden" ticks tone={t.base}>
      <div className="p-5" style={{ borderBottom: `1px solid ${C.line}` }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: t.base }}>
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
        <Maatlijn label="subtotaal" />
        <Row label="Subtotaal" value={eur0.format(subtotal)} mono />
        <Row label="Btw 21%" value={eur0.format(btw)} mono />
        <Maatlijn label="totaal" />
        <div className="flex items-baseline justify-between">
          <span
            className="text-[12px] font-bold uppercase tracking-[0.14em]"
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
