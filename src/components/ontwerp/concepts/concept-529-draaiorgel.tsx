"use client";

// Concept 529 — "Draaiorgel" · Nederlands draaiorgel-ornament, gedisciplineerd. Warm donker paneel
// (bg #211611) met room-tekst (#f2e6d6), messing/brass accent (#d4a24a) en een vermiljoen tweede stem
// (#c2432f). Rijke maar strakke sierlijsten en gouden hairline-ornamenten omlijsten nuchtere data:
// het kader is feestelijk-ambachtelijk, de inhoud blijft B2B-leesbaar. Geen kermis-kitsch — symmetrie,
// filet-randen en een hoofse rust. Kleur is nooit de enige status-drager (altijd label + icoon).

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
  Hash,
  LayoutGrid,
  ListChecks,
  MapPin,
  Music,
  Plus,
  Receipt,
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

// ————————————————————————————— Palet — warm donker met messing & vermiljoen —————————————————————————————
const C = {
  bg: "#211611",
  bgDeep: "#1a110d",
  panel: "#2a1d16",
  panelSoft: "#332419",
  sink: "#241811",
  line: "#4a3421",
  lineSoft: "#3a2818",
  ink: "#f2e6d6",
  inkSoft: "#d8c6ad",
  inkMute: "#b19a7c",
  inkFaint: "#8a765d",
  brass: "#d4a24a",
  brassSoft: "#3a2c15",
  brassBright: "#e6bd6a",
  vermiljoen: "#d0563f",
  vermiljoenSoft: "#3a1c15",
  groen: "#a9b665",
  groenSoft: "#2c2f18",
  blauw: "#88b0c4",
  blauwSoft: "#1c2a30",
};

const serif: CSSProperties = {
  fontFamily:
    "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, 'Times New Roman', serif",
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6bd6a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#211611]";

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
      return {
        base: C.blauw,
        soft: C.blauwSoft,
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
      };
    case "EXPIRING":
      return {
        base: C.brass,
        soft: C.brassSoft,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return {
        base: C.vermiljoen,
        soft: C.vermiljoenSoft,
        label: "Afgewezen",
        Icon: X,
        alarm: true,
      };
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
    return { base: C.brass, soft: C.brassSoft, label: "Openstaand", Icon: Clock };
  return { base: C.blauw, soft: C.blauwSoft, label: "Concept", Icon: Hash };
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

// ————————————————————————————— Ornament-primitieven (sierlijst / filet / rozet) —————————————————————————————
// Symmetrische gouden hoek-flourish — geplaatst in de vier hoeken van een kader.
function CornerFlourish({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const rot: Record<typeof pos, string> = {
    tl: "rotate(0deg)",
    tr: "rotate(90deg)",
    br: "rotate(180deg)",
    bl: "rotate(270deg)",
  };
  const place: Record<typeof pos, CSSProperties> = {
    tl: { top: -1, left: -1 },
    tr: { top: -1, right: -1 },
    br: { bottom: -1, right: -1 },
    bl: { bottom: -1, left: -1 },
  };
  return (
    <span
      className="pointer-events-none absolute h-8 w-8"
      style={{ ...place[pos], transform: rot[pos] }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" width="32" height="32" fill="none">
        <path
          d="M1 12 C1 5 5 1 12 1"
          stroke={C.brass}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M5 14 C5 8 8 5 14 5"
          stroke={C.brass}
          strokeWidth="0.7"
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle cx="12" cy="12" r="1.6" fill={C.brass} opacity="0.85" />
      </svg>
    </span>
  );
}

// Gouden hairline-scheiding met centraal rozet — de "filet".
function Filet({ tone = C.brass }: { tone?: string }) {
  return (
    <span className="flex items-center gap-2 py-0.5" aria-hidden="true">
      <span
        className="h-px flex-1"
        style={{ background: `linear-gradient(90deg, transparent, ${tone}66)` }}
      />
      <span
        className="inline-block h-1.5 w-1.5 rotate-45"
        style={{ border: `1px solid ${tone}` }}
      />
      <span
        className="h-px flex-1"
        style={{ background: `linear-gradient(90deg, ${tone}66, transparent)` }}
      />
    </span>
  );
}

function Panel({
  children,
  className = "",
  as: Tag = "div",
  ornate = false,
  tone,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  ornate?: boolean;
  tone?: string;
}) {
  return (
    <Tag
      className={`relative rounded-xl ${className}`}
      style={{
        background: `linear-gradient(180deg, ${C.panel}, ${C.sink})`,
        border: `1px solid ${tone ? `${tone}55` : C.line}`,
        boxShadow: `0 18px 40px -30px #000, inset 0 1px 0 ${C.brass}14`,
      }}
    >
      {ornate && (
        <>
          <CornerFlourish pos="tl" />
          <CornerFlourish pos="tr" />
          <CornerFlourish pos="bl" />
          <CornerFlourish pos="br" />
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
  tone = C.brass,
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
  const base = `inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-[0.01em] transition-all duration-150 active:scale-[0.98] ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? {
          background: `linear-gradient(180deg, ${tone}, ${tone}cc)`,
          color: C.bgDeep,
          border: `1px solid ${tone}`,
          boxShadow: `0 8px 18px -10px ${tone}, inset 0 1px 0 #ffffff55`,
          ...sans,
        }
      : variant === "outline"
        ? { background: "transparent", color: tone, border: `1px solid ${tone}66`, ...sans }
        : { background: "transparent", color: C.inkSoft, border: "1px solid transparent", ...sans };
  const hover = variant === "solid" ? "hover:brightness-110" : "hover:bg-[#332419]";
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
      style={{ color: base, background: soft, border: `1px solid ${base}55`, ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// Match als draaiorgel-rozet (pijpjes-ring rond de kern).
function MatchRozet({ value }: { value: number }) {
  const strong = value >= 90;
  const tone = strong ? C.groen : C.brass;
  const pipes = 24;
  const filled = Math.round((value / 100) * pipes);
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
        {Array.from({ length: pipes }).map((_, i) => {
          const ang = (i / pipes) * 2 * Math.PI - Math.PI / 2;
          const on = i < filled;
          const r1 = 20;
          const r2 = 25;
          const cx = 28;
          const cy = 28;
          return (
            <line
              key={i}
              x1={cx + Math.cos(ang) * r1}
              y1={cy + Math.sin(ang) * r1}
              x2={cx + Math.cos(ang) * r2}
              y2={cy + Math.sin(ang) * r2}
              stroke={on ? tone : C.line}
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}
        <circle cx="28" cy="28" r="16" fill="none" stroke={`${tone}44`} strokeWidth="0.8" />
      </svg>
      <span className="relative text-[13px] font-bold" style={{ color: tone, ...mono }}>
        {value}
      </span>
    </span>
  );
}

function Kicker({ children, tone = C.brass }: { children: ReactNode; tone?: string }) {
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
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.2em]"
            style={{ color: C.brass, background: C.brassSoft, border: `1px solid ${C.brass}44` }}
          >
            <Music size={11} aria-hidden="true" />
            {code}
          </span>
          <h1
            className="mt-2.5 text-[26px] font-semibold leading-tight tracking-[-0.01em] md:text-[31px]"
            style={{ color: C.ink, ...serif }}
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
        <Filet />
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
export function Concept529() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [palet, setPalet] = useState(false); // command-menu ("orgelboek")
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[760px] w-full antialiased"
      style={{
        ...sans,
        color: C.ink,
        background: `radial-gradient(120% 80% at 50% 0%, ${C.bg}, ${C.bgDeep})`,
      }}
    >
      <div className="mx-auto flex max-w-6xl">
        <Sidebar screen={screen} setScreen={setScreen} onPalet={() => setPalet(true)} />
        <div className="min-w-0 flex-1">
          <TopBar onPalet={() => setPalet(true)} />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="do-fade px-4 pb-20 pt-6 sm:px-6 md:px-8">
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

      {palet && <Orgelboek screen={screen} setScreen={setScreen} onClose={() => setPalet(false)} />}

      <style>{`
        @keyframes doFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .do-fade { animation: doFade 0.34s cubic-bezier(0.22,1,0.36,1) both; }
        .do-row { transition: background 0.16s ease; }
        .do-row:hover { background: ${C.panelSoft}; }
        @media (prefers-reduced-motion: reduce) { .do-fade { animation: none !important; } .do-row { transition: none !important; } }
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
      style={{
        background: `linear-gradient(180deg, ${C.panel}, ${C.bgDeep})`,
        borderRight: `1px solid ${C.line}`,
      }}
    >
      <div className="relative px-5 py-5" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{
              background: `linear-gradient(160deg, ${C.brassBright}, ${C.brass})`,
              color: C.bgDeep,
              boxShadow: `0 6px 16px -8px ${C.brass}`,
            }}
            aria-hidden="true"
          >
            <Music size={18} />
          </span>
          <span>
            <span
              className="block text-[15px] font-semibold tracking-[0.02em]"
              style={{ color: C.ink, ...serif }}
            >
              Draaiorgel
            </span>
            <span
              className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.24em]"
              style={{ color: C.brass }}
            >
              werk op maat
            </span>
          </span>
        </div>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1 overflow-y-auto px-3 py-4">
        <p
          className="px-2 pb-2 text-[9px] font-bold uppercase tracking-[0.22em]"
          style={{ color: C.inkFaint }}
        >
          Register
        </p>
        <ul className="space-y-1">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV[s.key];
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors ${RING}`}
                  style={
                    on
                      ? {
                          background: C.brassSoft,
                          color: C.brassBright,
                          border: `1px solid ${C.brass}44`,
                        }
                      : { color: C.inkSoft, border: "1px solid transparent" }
                  }
                >
                  {on && (
                    <span
                      className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
                      style={{ background: C.brass }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon size={16} aria-hidden="true" style={{ color: on ? C.brass : C.inkMute }} />
                  <span className="flex-1">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={onPalet}
          className={`mt-4 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium ${RING}`}
          style={{ color: C.inkMute, border: `1px dashed ${C.line}` }}
        >
          <Command size={14} aria-hidden="true" style={{ color: C.brass }} />
          Orgelboek openen
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
          className="mb-3 rounded-lg p-3"
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
            className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
            style={{ background: C.brass, color: C.bgDeep, ...mono }}
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
        background: `${C.bg}ee`,
        borderBottom: `1px solid ${C.line}`,
        backdropFilter: "blur(8px)",
      }}
    >
      <button
        type="button"
        onClick={onPalet}
        className={`flex flex-1 items-center gap-2 rounded-lg px-3.5 py-2 text-left ${RING}`}
        style={{ background: C.sink, border: `1px solid ${C.line}` }}
        aria-label="Orgelboek zoeken openen"
      >
        <Search size={14} aria-hidden="true" style={{ color: C.brass }} />
        <span className="text-[12.5px]" style={{ color: C.inkFaint }}>
          Zoek opdrachten, certificaten, facturen…
        </span>
        <span
          className="ml-auto hidden rounded px-1.5 py-0.5 text-[10px] font-bold sm:inline"
          style={{ background: C.panelSoft, color: C.inkMute, ...mono }}
        >
          ⌘K
        </span>
      </button>
      <span
        className="hidden items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold sm:inline-flex"
        style={{ background: C.brassSoft, color: C.brass, border: `1px solid ${C.brass}44` }}
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
            className={`shrink-0 rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
            style={
              on
                ? { background: C.brass, color: C.bgDeep }
                : { color: C.inkSoft, background: C.sink }
            }
          >
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

// —————————————————————————————————————— Orgelboek (command-menu) ——————————————————————————————————————
function Orgelboek({
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
      style={{ background: "#0a0705cc", backdropFilter: "blur(4px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Orgelboek — snelnavigatie"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl"
        style={{
          background: `linear-gradient(180deg, ${C.panel}, ${C.sink})`,
          border: `1px solid ${C.brass}55`,
          boxShadow: `0 30px 80px -30px #000, inset 0 1px 0 ${C.brass}22`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-2.5 px-4 py-3.5"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.brass }} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Blader door het register…"
            aria-label="Zoek een scherm"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#8a765d]"
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
        <div className="px-2 py-2">
          <Filet />
        </div>
        <ul className="max-h-72 overflow-y-auto px-2 pb-3">
          {items.length === 0 ? (
            <li className="px-3 py-8 text-center text-[13px]" style={{ color: C.inkMute }}>
              Geen scherm gevonden voor “{q}”.
            </li>
          ) : (
            items.map((s) => {
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
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] font-medium ${RING}`}
                    style={
                      on ? { background: C.brassSoft, color: C.brassBright } : { color: C.inkSoft }
                    }
                  >
                    <Icon size={16} aria-hidden="true" style={{ color: C.brass }} />
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
        title={`Goedendag ${PROFIEL.naam.split(" ")[0]}`}
        sub="Het register speelt gelijkmatig. Drie zaken vragen vandaag om je aandacht — daarna is alles gestemd."
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
          <Panel key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold" style={{ color: C.inkMute }}>
                {k.label}
              </p>
              <span
                className="inline-block h-1.5 w-1.5 rotate-45"
                style={{ border: `1px solid ${C.brass}` }}
                aria-hidden="true"
              />
            </div>
            <p
              className="mt-2 text-[26px] font-bold leading-none tracking-[-0.01em]"
              style={{ color: C.ink, ...mono }}
            >
              {k.value}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  color: k.up ? C.groen : C.brass,
                  background: k.up ? C.groenSoft : C.brassSoft,
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
                      style={{ height: h, background: last ? C.brass : `${C.brass}44` }}
                    />
                  );
                })}
              </span>
            </div>
          </Panel>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        <Panel className="overflow-hidden" ornate>
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <Kicker>
              <Store size={13} aria-hidden="true" /> Voor jou gestemd
            </Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className={`rounded-full text-[11.5px] font-semibold ${RING}`}
              style={{ color: C.brass }}
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
                  className={`do-row flex w-full items-center gap-3.5 px-5 py-4 text-left ${RING}`}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <MatchRozet value={o.match} />
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
          <Panel className="p-5" ornate>
            <Kicker tone={C.groen}>
              <ShieldCheck size={13} aria-hidden="true" /> Vertrouwenssaldo
            </Kicker>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[36px] font-bold leading-none tracking-[-0.02em]"
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
                    className="h-2 flex-1 rounded-full"
                    style={{ background: c.status === "VERIFIED" ? C.groen : `${t.base}66` }}
                  />
                );
              })}
            </div>
            <p className="mt-2.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd · {PROFIEL.trust}.
            </p>
          </Panel>

          <Panel className="p-5" as="article" tone={C.brass}>
            <Kicker>
              <AlertTriangle size={13} aria-hidden="true" /> Termijn nadert
            </Kicker>
            <h3
              className="mt-2 text-[15px] font-semibold leading-snug"
              style={{ color: C.ink, ...serif }}
            >
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" full tone={C.brass} className="mt-4" onClick={onActies}>
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
          className="flex flex-1 items-center gap-2 rounded-lg px-3.5 py-2"
          style={{ background: C.sink, border: `1px solid ${C.line}` }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.brass }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#8a765d]"
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
          tone={C.vermiljoen}
          titel="Even niet gelukt"
          tekst="De opdrachten konden zojuist niet worden opgehaald. Probeer het rustig opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.brass}
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
    <Panel className="flex flex-col items-center px-6 py-16 text-center" ornate tone={tone}>
      <span
        className="flex h-16 w-16 items-center justify-center rounded-xl"
        style={{ color: tone, background: `${tone}1f`, border: `1px solid ${tone}55` }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-4 text-[19px] font-semibold" style={{ color: C.ink, ...serif }}>
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
    <Panel as="article" className="overflow-hidden" ornate>
      <div className="flex items-start gap-4 p-5">
        <span className="shrink-0 pt-0.5">
          <MatchRozet value={opdracht.match} />
          <span className="mt-2 flex justify-center">
            <span
              className="rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.08em]"
              style={{
                color: strong ? C.groen : C.brass,
                background: strong ? C.groenSoft : C.brassSoft,
                border: `1px solid ${strong ? C.groen : C.brass}44`,
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
            className="mt-1 text-[16.5px] font-semibold leading-snug"
            style={{ color: C.ink, ...serif }}
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
                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{
                  background: C.brassSoft,
                  color: C.brass,
                  border: `1px solid ${C.brass}33`,
                }}
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
        style={{ borderTop: `1px solid ${C.lineSoft}`, background: C.sink }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 rounded-full text-[12px] font-semibold ${RING}`}
          style={{ color: C.brass }}
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
              tone={C.groen}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.brass}
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
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45"
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
  const tone = strong ? C.groen : C.brass;
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

      <Panel className="overflow-hidden" ornate>
        <div className="p-6">
          <div
            className="flex items-center gap-2 text-[11px] font-semibold"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>{opdracht.id}</span>
            <span aria-hidden="true">·</span>
            <span
              className="rounded-full px-2 py-0.5 uppercase tracking-[0.08em]"
              style={{ color: tone, background: `${tone}1f` }}
            >
              {strong ? "sterke match" : "goede match"} {opdracht.match}%
            </span>
          </div>
          <h1
            className="mt-2.5 max-w-2xl text-[26px] font-semibold leading-[1.14] tracking-[-0.01em] md:text-[30px]"
            style={{ color: C.ink, ...serif }}
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
                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{
                  background: C.brassSoft,
                  color: C.brass,
                  border: `1px solid ${C.brass}33`,
                }}
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
                style={{ color: C.brass }}
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

      <Panel className="p-6" ornate>
        <Kicker>
          <ListChecks size={13} aria-hidden="true" /> Navolgbaar — geen verborgen score
        </Kicker>
        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je geverifieerde profiel. Wat in je voordeel spreekt, en wat goed is om
          vooraf te weten.
        </p>
        <div className="mt-4">
          <Filet />
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
              style={{ color: C.brass }}
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
                    style={{ color: C.brass }}
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
            className="rounded-xl px-4 py-2 text-right"
            style={{ background: C.groenSoft, border: `1px solid ${C.groen}44` }}
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
                    className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: t.soft, color: t.base, border: `1px solid ${t.base}44` }}
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
        title="Wat vandaag je aandacht vraagt"
        sub="Op volgorde van urgentie — werk ze bij en houd het register gestemd."
      />
      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.brass : C.blauw;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Panel className="flex items-start gap-4 p-5" tone={tone}>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[15px] font-bold"
                  style={{
                    background: `${tone}1f`,
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
                      <AlertTriangle size={13} aria-hidden="true" />
                    ) : (
                      <Clock size={13} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </Kicker>
                  <h2
                    className="mt-1.5 text-[16px] font-semibold leading-snug"
                    style={{ color: C.ink, ...serif }}
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
            tone: C.brass,
            Icon: Clock,
          },
          {
            l: "Concept",
            v: totals.concept,
            sub: "klaar om te versturen",
            tone: C.blauw,
            Icon: Hash,
          },
        ].map((s) => (
          <Panel key={s.l} className="p-4" tone={s.tone}>
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
        <Panel className="overflow-hidden" ornate>
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
                      className={`do-row cursor-pointer ${RING}`}
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
                        background: on ? C.brassSoft : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3 text-[12px] font-semibold"
                        style={{ color: on ? C.brassBright : C.inkSoft, ...mono }}
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
    <Panel as="article" className="overflow-hidden" ornate tone={t.base}>
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
        <Filet />
        <Row label="Subtotaal" value={eur0.format(subtotal)} mono />
        <Row label="Btw 21%" value={eur0.format(btw)} mono />
        <Filet tone={t.base} />
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
