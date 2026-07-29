"use client";

// Concept 528 — "Fresnel" · Vuurtoren-optiek. Diep teal-zwart met een luminante aqua-bundel. Concentrische
// refractieve lensringen (Fresnel), lichtbundel-gradiënten die vanuit actieve elementen stralen, optische
// glas-diepte en oplichtende randen. Licht als metafoor voor verificatie en vertrouwen dat oplicht. Donker
// en verfijnd, met bewaakte leesbaarheid (WCAG-AA). Kleur nooit als enige status-drager — altijd label + icoon.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  Command,
  CornerDownLeft,
  FileText,
  LayoutGrid,
  ListChecks,
  MapPin,
  Plus,
  Radar,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Waypoints,
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
  BERICHTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ————————————————————————————— Palet — teal-zwart glas & aqua-bundel —————————————————————————————
const C = {
  bg: "#08161a",
  bgDeep: "#050f12",
  panel: "#0e2129",
  panelHi: "#132a33",
  sink: "#0a1b21",
  line: "#1c3843",
  lineHi: "#265060",
  ink: "#d8f0ee",
  inkSoft: "#a7c6c6",
  inkMute: "#7ba0a2",
  inkFaint: "#5c8082",
  aqua: "#4fd1c5",
  aquaDeep: "#2b9f95",
  aquaSoft: "#0f2f31",
  // status
  groen: "#54d6a0",
  groenSoft: "#0f2e29",
  blauw: "#5aa8e0",
  blauwSoft: "#0e2733",
  amber: "#e0b25a",
  amberSoft: "#2e2717",
  koraal: "#e57a86",
  koraalSoft: "#301820",
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4fd1c5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08161a]";

// Lichtbundel-gradiënt die vanuit een punt straalt
const BEAM = `radial-gradient(120% 90% at 50% -10%, ${C.aqua}1c 0%, ${C.aqua}0a 30%, transparent 62%)`;

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
        base: C.amber,
        soft: C.amberSoft,
        label: "Verloopt bijna",
        Icon: Clock,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.koraal, soft: C.koraalSoft, label: "Afgewezen", Icon: X, alarm: true };
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
  return { base: C.blauw, soft: C.blauwSoft, label: "Concept", Icon: FileText };
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

// ————————————————————————————— Fresnel-ring — concentrische lensringen —————————————————————————————
function FresnelRings({ tone = C.aqua, size = 220 }: { tone?: string; size?: number }) {
  return (
    <span
      className="pointer-events-none absolute"
      aria-hidden="true"
      style={{
        right: -size * 0.35,
        top: -size * 0.35,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `repeating-radial-gradient(circle at center, ${tone}00 0px, ${tone}00 8px, ${tone}22 9px, ${tone}00 11px)`,
        opacity: 0.7,
        maskImage: "radial-gradient(circle at center, #000 0%, transparent 72%)",
        WebkitMaskImage: "radial-gradient(circle at center, #000 0%, transparent 72%)",
      }}
    />
  );
}

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
      className={`relative rounded-[18px] ${className}`}
      style={{
        background: `linear-gradient(180deg, ${C.panelHi}, ${C.panel})`,
        border: `1px solid ${glow ? C.lineHi : C.line}`,
        boxShadow: glow
          ? `0 0 0 1px ${C.aqua}22, 0 22px 50px -30px ${C.aqua}55, inset 0 1px 0 ${C.aqua}18`
          : "0 22px 50px -34px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.03)",
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
  tone = C.aqua,
  ariaLabel,
  ariaExpanded,
  full = false,
  type = "button",
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
  type?: "button" | "submit";
}) {
  const pad = size === "sm" ? "px-3.5 py-1.5 text-[12px]" : "px-4 py-2.5 text-[13px]";
  const base = `inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.01em] transition-all duration-200 active:scale-[0.98] ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? {
          background: `linear-gradient(180deg, ${tone}, ${C.aquaDeep})`,
          color: C.bgDeep,
          border: `1px solid ${tone}`,
          boxShadow: `0 0 18px -4px ${tone}88, inset 0 1px 0 ${tone}`,
          ...sans,
        }
      : variant === "outline"
        ? { background: C.sink, color: tone, border: `1px solid ${tone}44`, ...sans }
        : { background: "transparent", color: C.inkSoft, border: "1px solid transparent", ...sans };
  const hover =
    variant === "solid"
      ? "hover:brightness-[1.08]"
      : variant === "outline"
        ? "hover:bg-[#0f2f31]"
        : "hover:bg-[#0f2f31]";
  return (
    <button
      type={type}
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

// Match als oplichtende lens-meter (conic met glow)
function MatchLens({ value }: { value: number }) {
  const strong = value >= 90;
  const tone = strong ? C.groen : C.aqua;
  return (
    <span
      className="relative inline-flex h-14 w-14 items-center justify-center"
      aria-label={`Match ${value} procent`}
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(${tone} ${value * 3.6}deg, ${C.line} 0deg)`,
          boxShadow: `0 0 16px -4px ${tone}99`,
        }}
        aria-hidden="true"
      />
      <span
        className="absolute inset-[3.5px] rounded-full"
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
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
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
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <Kicker tone={C.aqua}>
          <Zap size={13} aria-hidden="true" /> {code}
        </Kicker>
        <h1
          className="mt-2.5 text-[26px] font-bold leading-tight tracking-[-0.03em] md:text-[32px]"
          style={{ color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkMute }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

const NAV: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: Waypoints,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: FileText,
};

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept528() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [cmdOpen, setCmdOpen] = useState(false);
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[760px] w-full antialiased"
      style={{ ...sans, color: C.ink, background: `${BEAM}, ${C.bg}` }}
    >
      <div className="mx-auto flex max-w-6xl">
        <Sidebar screen={screen} setScreen={setScreen} />
        <div className="min-w-0 flex-1">
          <TopBar onCommand={() => setCmdOpen(true)} />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="fr-fade px-4 pb-24 pt-7 sm:px-6 md:px-9">
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

      {cmdOpen && <CommandMenu setScreen={setScreen} onClose={() => setCmdOpen(false)} />}

      <style>{`
        @keyframes frFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .fr-fade { animation: frFade 0.42s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes frPulse { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }
        .fr-pulse { animation: frPulse 3.4s ease-in-out infinite; }
        .fr-row { transition: background 0.2s ease, box-shadow 0.2s ease; }
        .fr-row:hover { background: ${C.panelHi}; box-shadow: inset 3px 0 0 ${C.aqua}; }
        @media (prefers-reduced-motion: reduce) { .fr-fade, .fr-pulse { animation: none !important; } .fr-row { transition: none !important; } }
      `}</style>
    </div>
  );
}

// —————————————————————————————————————— Command-menu ——————————————————————————————————————
function CommandMenu({
  setScreen,
  onClose,
}: {
  setScreen: (s: ScreenKey) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const items = useMemo(() => {
    const n = q.toLowerCase().trim();
    return SCREENS.filter((s) => s.label.toLowerCase().includes(n));
  }, [q]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[14vh]"
      style={{ background: "rgba(3,10,12,0.68)", backdropFilter: "blur(4px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Snelmenu"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-[18px]"
        style={{
          background: `${BEAM}, linear-gradient(180deg, ${C.panelHi}, ${C.panel})`,
          border: `1px solid ${C.lineHi}`,
          boxShadow: `0 0 0 1px ${C.aqua}22, 0 40px 90px -30px #000`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <FresnelRings size={260} />
        <div
          className="relative flex items-center gap-2.5 px-4 py-3.5"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.aqua }} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ga naar scherm of zoek…"
            aria-label="Zoeken in snelmenu"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#5c8082]"
            style={{ color: C.ink }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Snelmenu sluiten"
            className={`flex h-6 w-6 items-center justify-center rounded-lg ${RING}`}
            style={{ color: C.inkMute }}
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
        {items.length === 0 ? (
          <div className="relative px-4 py-10 text-center">
            <Radar size={22} aria-hidden="true" style={{ color: C.inkFaint }} className="mx-auto" />
            <p className="mt-2 text-[13px]" style={{ color: C.inkMute }}>
              Geen scherm voor “{q}”.
            </p>
          </div>
        ) : (
          <ul className="relative max-h-72 overflow-y-auto p-2">
            {items.map((s) => {
              const Icon = NAV[s.key];
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => {
                      setScreen(s.key);
                      onClose();
                    }}
                    className={`fr-row flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${RING}`}
                  >
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{
                        background: C.aquaSoft,
                        color: C.aqua,
                        border: `1px solid ${C.aqua}33`,
                      }}
                      aria-hidden="true"
                    >
                      <Icon size={15} />
                    </span>
                    <span className="flex-1 text-[13.5px] font-semibold" style={{ color: C.ink }}>
                      {s.label}
                    </span>
                    <CornerDownLeft size={13} aria-hidden="true" style={{ color: C.inkFaint }} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
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
      style={{ background: C.bgDeep, borderRight: `1px solid ${C.line}` }}
    >
      <div
        className="relative flex items-center gap-2.5 overflow-hidden px-5 py-5"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <FresnelRings size={150} />
        <span
          className="relative flex h-9 w-9 items-center justify-center rounded-2xl"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${C.aqua}, ${C.aquaDeep})`,
            color: C.bgDeep,
            boxShadow: `0 0 20px -2px ${C.aqua}aa`,
          }}
          aria-hidden="true"
        >
          <Zap size={17} />
        </span>
        <span className="relative">
          <span className="block text-[14px] font-bold tracking-[-0.01em]" style={{ color: C.ink }}>
            Fresnel
          </span>
          <span
            className="mt-0.5 block text-[9.5px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: C.aqua }}
          >
            verificatie licht op
          </span>
        </span>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1 overflow-y-auto px-3 py-5">
        <p
          className="px-2 pb-2 text-[9.5px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: C.inkFaint }}
        >
          Overzicht
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
                  className={`group relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-semibold transition-colors ${RING}`}
                  style={
                    on
                      ? {
                          background: C.aquaSoft,
                          color: C.aqua,
                          boxShadow: `inset 2px 0 0 ${C.aqua}`,
                        }
                      : { color: C.inkSoft }
                  }
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={
                      on
                        ? {
                            background: C.aqua,
                            color: C.bgDeep,
                            boxShadow: `0 0 14px -2px ${C.aqua}`,
                          }
                        : { background: C.sink, color: C.inkMute }
                    }
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
          className="relative mb-3 overflow-hidden rounded-2xl p-3.5"
          style={{ background: C.aquaSoft, border: `1px solid ${C.aqua}33` }}
        >
          <FresnelRings size={130} />
          <p
            className="relative text-[9.5px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.aqua }}
          >
            Dossier op orde
          </p>
          <div className="relative mt-1.5 flex items-baseline gap-1.5">
            <span className="text-[20px] font-bold leading-none" style={{ color: C.ink, ...mono }}>
              {ratio}%
            </span>
            <span className="text-[10.5px]" style={{ color: C.inkMute }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
            style={{
              background: `linear-gradient(160deg, ${C.aqua}, ${C.aquaDeep})`,
              color: C.bgDeep,
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

function TopBar({ onCommand }: { onCommand: () => void }) {
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (a, f) => a + parseEUR(f.bedrag),
    0,
  );
  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3.5 sm:px-6 md:px-9"
      style={{
        background: `${C.bg}e6`,
        borderBottom: `1px solid ${C.line}`,
        backdropFilter: "blur(10px)",
      }}
    >
      <button
        type="button"
        onClick={onCommand}
        aria-label="Snelmenu openen"
        className={`flex flex-1 items-center gap-2 rounded-full px-3.5 py-2 text-left transition-colors hover:bg-[#0f2f31] ${RING}`}
        style={{ background: C.sink, border: `1px solid ${C.line}` }}
      >
        <Search size={14} aria-hidden="true" style={{ color: C.aqua }} />
        <span className="text-[12.5px]" style={{ color: C.inkFaint }}>
          Zoek opdrachten, certificaten, facturen…
        </span>
        <span
          className="ml-auto hidden items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10px] font-semibold sm:inline-flex"
          style={{ background: C.panel, color: C.inkMute, border: `1px solid ${C.line}`, ...mono }}
        >
          <Command size={10} aria-hidden="true" /> K
        </span>
      </button>
      <span
        className="hidden items-center gap-2 rounded-full px-3 py-2 text-[12px] font-semibold sm:inline-flex"
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
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
            style={
              on
                ? { background: C.aqua, color: C.bgDeep }
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
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="space-y-8">
      <ScreenHead
        code="Dashboard"
        title={`Goedemorgen ${PROFIEL.naam.split(" ")[0]}`}
        sub="Je bundel staat scherp. Drie dingen vragen vandaag je aandacht — daarna licht je dossier volledig op."
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
          <Panel key={k.label} className="overflow-hidden p-4">
            <FresnelRings size={140} />
            <p className="relative text-[11px] font-semibold" style={{ color: C.inkMute }}>
              {k.label}
            </p>
            <p
              className="relative mt-2 text-[26px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.ink, ...mono }}
            >
              {k.value}
            </p>
            <div className="relative mt-3 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
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
                      className="w-[3px] rounded-full"
                      style={{
                        height: h,
                        background: last ? C.aqua : `${C.aqua}44`,
                        boxShadow: last ? `0 0 6px ${C.aqua}` : "none",
                      }}
                    />
                  );
                })}
              </span>
            </div>
          </Panel>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.55fr_1fr]">
        <Panel className="overflow-hidden">
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <Kicker tone={C.aqua}>
              <Radar size={13} aria-hidden="true" /> In de bundel
            </Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className={`rounded-full text-[11.5px] font-semibold ${RING}`}
              style={{ color: C.aqua }}
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
                  className={`fr-row flex w-full items-center gap-3.5 px-6 py-4 text-left ${RING}`}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
                >
                  <MatchLens value={o.match} />
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
                      className="text-[9.5px] font-semibold uppercase tracking-[0.1em]"
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

        <div className="space-y-6">
          <Panel className="relative overflow-hidden p-6" glow>
            <FresnelRings size={210} />
            <Kicker tone={C.groen}>
              <ShieldCheck size={13} aria-hidden="true" /> Vertrouwenssaldo
            </Kicker>
            <div className="relative mt-2.5 flex items-baseline gap-2">
              <span
                className="text-[38px] font-bold leading-none tracking-[-0.03em]"
                style={{ color: C.groen, ...mono }}
              >
                {ratio}%
              </span>
              <span className="text-[12px]" style={{ color: C.inkMute }}>
                dossier op orde
              </span>
            </div>
            <div className="relative mt-4 flex gap-1.5" aria-hidden="true">
              {CREDENTIALS.map((c) => {
                const t = credTone(c.status);
                return (
                  <span
                    key={c.naam}
                    className="h-1.5 flex-1 rounded-full"
                    style={{
                      background: c.status === "VERIFIED" ? C.groen : `${t.base}66`,
                      boxShadow: c.status === "VERIFIED" ? `0 0 8px ${C.groen}88` : "none",
                    }}
                  />
                );
              })}
            </div>
            <p className="relative mt-3 text-[11.5px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd · {PROFIEL.trust}.
            </p>
          </Panel>

          <Panel className="p-6" as="article">
            <Kicker tone={C.amber}>
              <Clock size={13} aria-hidden="true" /> Termijn nadert
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

          <Panel className="p-5" as="article">
            <Kicker tone={C.blauw}>
              <FileText size={13} aria-hidden="true" /> Berichten
            </Kicker>
            <p className="mt-1.5 text-[12.5px]" style={{ color: C.inkSoft }}>
              {ongelezen} ongelezen · laatste van {BERICHTEN[0]?.van}.
            </p>
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
    <div className="space-y-7">
      <ScreenHead
        code="Marktplaats"
        title="Opdrachten in de bundel"
        sub={`${rows.length} van ${OPDRACHTEN.length} opdrachten sluiten aan op je geverifieerde profiel.`}
      />

      <Panel className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2 rounded-full px-3.5 py-2"
          style={{ background: C.sink, border: `1px solid ${C.line}` }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.aqua }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#5c8082]"
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
              <Panel className="space-y-3 p-6">
                <div className="fr-pulse h-4 w-2/3 rounded-full" style={{ background: C.line }} />
                <div className="fr-pulse h-3 w-1/2 rounded-full" style={{ background: C.line }} />
              </Panel>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={Radar}
          tone={C.koraal}
          titel="Geen signaal"
          tekst="De opdrachten konden zojuist niet worden opgehaald. Probeer het rustig opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.aqua}
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
            className={`rounded text-[10.5px] font-semibold uppercase tracking-[0.14em] underline-offset-2 hover:underline ${RING}`}
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
    <Panel className="relative flex flex-col items-center overflow-hidden px-6 py-16 text-center">
      <FresnelRings size={240} tone={tone} />
      <span
        className="relative flex h-16 w-16 items-center justify-center rounded-3xl"
        style={{
          color: tone,
          background: `${tone}18`,
          border: `1px solid ${tone}44`,
          boxShadow: `0 0 24px -6px ${tone}88`,
        }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="relative mt-4 text-[19px] font-bold" style={{ color: C.ink }}>
        {titel}
      </p>
      <p
        className="relative mt-2 max-w-sm text-[13px] leading-relaxed"
        style={{ color: C.inkSoft }}
      >
        {tekst}
      </p>
      <Btn variant="solid" className="mt-5" onClick={onCta}>
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
    <Panel as="article" className="overflow-hidden" glow={strong}>
      <div className="flex items-start gap-4 p-6">
        <span className="shrink-0 pt-0.5 text-center">
          <MatchLens value={opdracht.match} />
          <span
            className="mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
            style={{
              color: strong ? C.groen : C.aqua,
              background: strong ? C.groenSoft : C.aquaSoft,
              border: `1px solid ${strong ? C.groen : C.aqua}44`,
            }}
          >
            {strong ? "sterk" : "goed"}
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
            className="mt-1 text-[16.5px] font-bold leading-snug tracking-[-0.01em]"
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
                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ background: C.aquaSoft, color: C.aqua, border: `1px solid ${C.aqua}33` }}
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
            className="text-[9.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: C.inkFaint }}
          >
            per uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-2 px-6 py-3"
        style={{ borderTop: `1px solid ${C.line}`, background: C.sink }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 rounded-full text-[12px] font-semibold ${RING}`}
          style={{ color: C.aqua }}
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
            className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2"
            style={{ borderTop: `1px solid ${C.line}` }}
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
              Icon={Clock}
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
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
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

      <Panel className="overflow-hidden" glow>
        <div className="relative overflow-hidden p-7" style={{ background: BEAM }}>
          <FresnelRings size={300} />
          <div
            className="relative flex items-center gap-2 text-[11px] font-semibold"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>{opdracht.id}</span>
            <span aria-hidden="true">·</span>
            <span
              className="rounded-full px-2 py-0.5 uppercase tracking-[0.08em]"
              style={{
                color: strong ? C.groen : C.aqua,
                background: strong ? C.groenSoft : C.aquaSoft,
                border: `1px solid ${strong ? C.groen : C.aqua}44`,
              }}
            >
              {strong ? "sterke match" : "goede match"} {opdracht.match}%
            </span>
          </div>
          <h1
            className="relative mt-3 max-w-2xl text-[26px] font-bold leading-[1.12] tracking-[-0.03em] md:text-[31px]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h1>
          <p
            className="relative mt-2 flex items-center gap-1.5 text-[13.5px]"
            style={{ color: C.inkMute }}
          >
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="relative mt-4 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ background: C.aquaSoft, color: C.aqua, border: `1px solid ${C.aqua}33` }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="relative mt-5 flex flex-wrap gap-2">
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
                borderRight: i < 3 ? `1px solid ${C.line}` : "none",
                borderTop: i >= 2 ? `1px solid ${C.line}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.aqua }}
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

      <Panel className="p-7">
        <Kicker tone={C.aqua}>
          <Sparkles size={13} aria-hidden="true" /> Navolgbaar — geen verborgen score
        </Kicker>
        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je geverifieerde profiel. Wat in je voordeel spreekt, en wat goed is om
          vooraf te weten.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
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
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.amber }}
            >
              <Clock size={13} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <Clock
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
            className="relative overflow-hidden rounded-2xl px-4 py-2 text-right"
            style={{
              background: C.groenSoft,
              border: `1px solid ${C.groen}33`,
              boxShadow: `0 0 22px -8px ${C.groen}88`,
            }}
          >
            <FresnelRings size={140} tone={C.groen} />
            <p
              className="relative text-[28px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.groen, ...mono }}
            >
              {ratio}%
            </p>
            <p
              className="relative text-[10px] font-semibold uppercase tracking-[0.14em]"
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
              <Panel as="article" className="overflow-hidden" glow={c.status === "VERIFIED"}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-3 px-5 py-4 text-left ${RING}`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      background: t.soft,
                      color: t.base,
                      border: `1px solid ${t.base}44`,
                      boxShadow: c.status === "VERIFIED" ? `0 0 16px -4px ${t.base}` : "none",
                    }}
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
                      style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12 }}
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
        sub="Op volgorde van urgentie — één voor één weg te werken."
      />
      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.aqua;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Panel className="flex items-start gap-4 p-6">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[15px] font-bold"
                  style={{
                    background: `${tone}1a`,
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
                    <Clock size={13} aria-hidden="true" />
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
            tone: C.blauw,
            Icon: FileText,
          },
        ].map((s) => (
          <Panel key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <Kicker tone={C.aqua}>
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
                      className={`px-4 py-2.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] ${i === 3 ? "text-right" : ""}`}
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
                      className={`fr-row cursor-pointer ${RING}`}
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
                        borderTop: `1px solid ${C.line}`,
                        background: on ? C.aquaSoft : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3 text-[12px] font-semibold"
                        style={{ color: on ? C.aqua : C.inkSoft, ...mono }}
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
    <Panel as="article" className="overflow-hidden" glow>
      <div
        className="relative overflow-hidden p-5"
        style={{ borderBottom: `1px solid ${C.line}`, background: BEAM }}
      >
        <FresnelRings size={160} />
        <p
          className="relative text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: t.base }}
        >
          Factuur
        </p>
        <p className="relative text-[17px] font-bold" style={{ color: C.ink, ...mono }}>
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
            className="text-[12px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: C.ink }}
          >
            Totaal
          </span>
          <span className="text-[20px] font-bold" style={{ color: t.base, ...mono }}>
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
