"use client";

// Concept 521 — "Cinemascope" · Cinematisch widescreen. Diep bioscoop-donker doek met subtiele
// letterbox-balken boven en onder, grote serif title-cards en een teal↔amber color-grade. Schermen
// worden gepresenteerd als "scènes" van één doorlopende film: rustig, premium, filmisch. Kleur draagt
// nooit alleen de status — altijd label + icoon. Denk aan de openingstitels van een prestigefilm,
// vertaald naar een strak B2B-werkplatform.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clapperboard,
  Clock,
  Command,
  FileText,
  Film,
  ListChecks,
  MapPin,
  Play,
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

// ————————————————————————————— Palet — bioscoop-donker met teal/amber grade —————————————————————————————
const C = {
  bg: "#0d0f10",
  letterbox: "#060708",
  panel: "#14171a",
  panelSoft: "#191d20",
  sink: "#101315",
  line: "#26292d",
  lineSoft: "#1d2124",
  fg: "#ece7df",
  fgSoft: "#bcb6ab",
  fgMute: "#8b857b",
  fgFaint: "#5e5a52",
  amber: "#e6a15c",
  amberSoft: "#2c2214",
  teal: "#54b6a8",
  tealSoft: "#16302d",
  rose: "#d97a74",
  roseSoft: "#31201f",
  gold: "#dcc06a",
  goldSoft: "#2a2415",
};

const serif: CSSProperties = {
  fontFamily: "Georgia, 'Iowan Old Style', 'Times New Roman', 'Droid Serif', serif",
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6a15c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0f10]";

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
        base: C.teal,
        soft: C.tealSoft,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return { base: C.gold, soft: C.goldSoft, label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return {
        base: C.amber,
        soft: C.amberSoft,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.rose, soft: C.roseSoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

function factuurTone(status: string): {
  base: string;
  soft: string;
  label: string;
  Icon: LucideIcon;
} {
  if (status === "Betaald")
    return { base: C.teal, soft: C.tealSoft, label: "Betaald", Icon: Check };
  if (status === "Openstaand")
    return { base: C.amber, soft: C.amberSoft, label: "Openstaand", Icon: Clock };
  return { base: C.gold, soft: C.goldSoft, label: "Concept", Icon: Film };
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

// Scène-nummer per scherm (filmische chapter-index)
const SCENE_NO: Record<ScreenKey, string> = {
  dashboard: "01",
  marktplaats: "02",
  opdracht: "03",
  verificatie: "04",
  acties: "05",
  facturen: "06",
  documenten: "07",
  berichten: "08",
};

const SCREEN_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: Clapperboard,
  marktplaats: Store,
  opdracht: Film,
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
      className={`relative rounded-lg ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${tone ? `${tone}44` : C.line}`,
        boxShadow: "0 24px 60px -40px rgba(0,0,0,0.9)",
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
  tone = C.amber,
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
      ? { background: tone, color: "#0d0f10", border: `1px solid ${tone}`, ...sans }
      : variant === "outline"
        ? { background: "transparent", color: tone, border: `1px solid ${tone}66`, ...sans }
        : { background: "transparent", color: C.fgSoft, border: "1px solid transparent", ...sans };
  const hover =
    variant === "solid"
      ? "hover:brightness-110"
      : variant === "outline"
        ? "hover:bg-[#191d20]"
        : "hover:bg-[#191d20]";
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
      className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
      style={{ color: base, background: soft, border: `1px solid ${base}44`, ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

function Kicker({ children, tone = C.amber }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.28em]"
      style={{ color: tone, ...sans }}
    >
      {children}
    </span>
  );
}

// Match als filmische score-strook
function MatchStrip({ value, tone }: { value: number; tone: string }) {
  return (
    <span className="inline-flex flex-col items-end gap-1" aria-label={`Match ${value} procent`}>
      <span className="text-[18px] font-semibold leading-none" style={{ color: tone, ...mono }}>
        {value}
        <span className="text-[11px]" style={{ color: C.fgFaint }}>
          %
        </span>
      </span>
      <span
        className="relative h-[3px] w-16 overflow-hidden rounded-full"
        style={{ background: C.line }}
        aria-hidden="true"
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: `linear-gradient(90deg, ${C.teal}, ${tone})` }}
        />
      </span>
    </span>
  );
}

// Filmische title-card kop
function TitleCard({
  scene,
  title,
  sub,
  right,
}: {
  scene: ScreenKey;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <span className="inline-flex items-center gap-2.5">
          <span
            className="inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: C.amber, border: `1px solid ${C.amber}44`, background: C.amberSoft }}
          >
            <Film size={11} aria-hidden="true" /> Scène {SCENE_NO[scene]}
          </span>
          <span
            className="text-[10px] uppercase tracking-[0.3em]"
            style={{ color: C.fgFaint, ...mono }}
          >
            {PROFIEL.rol}
          </span>
        </span>
        <h1
          className="mt-3.5 text-[30px] font-normal italic leading-[1.08] tracking-[-0.01em] md:text-[38px]"
          style={{ color: C.fg, ...serif }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2.5 max-w-xl text-[13px] leading-relaxed" style={{ color: C.fgMute }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept521() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [palette, setPalette] = useState(false);
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[760px] w-full antialiased"
      style={{ ...sans, color: C.fg, background: C.bg }}
    >
      {/* Letterbox — bovenbalk */}
      <div
        className="flex h-8 items-center justify-between px-4 sm:px-6"
        style={{ background: C.letterbox, borderBottom: `1px solid ${C.line}` }}
      >
        <span
          className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em]"
          style={{ color: C.fgFaint }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: C.rose }}
            aria-hidden="true"
          />
          Nu speelt
        </span>
        <span
          className="text-[10px] uppercase tracking-[0.3em]"
          style={{ color: C.fgFaint, ...mono }}
        >
          ZZP · een productie in {SCREENS.length} scènes
        </span>
      </div>

      <div className="mx-auto flex max-w-6xl">
        <ReelNav screen={screen} setScreen={setScreen} onCommand={() => setPalette(true)} />
        <div className="min-w-0 flex-1">
          <Marquee screen={screen} onCommand={() => setPalette(true)} />
          <SceneStrip screen={screen} setScreen={setScreen} />
          <main key={screen} className="cs-fade px-4 pb-16 pt-8 sm:px-6 md:px-9">
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

      {/* Letterbox — onderbalk / credits */}
      <div
        className="flex h-8 items-center justify-center px-4"
        style={{ background: C.letterbox, borderTop: `1px solid ${C.line}` }}
      >
        <span
          className="text-[10px] uppercase tracking-[0.32em]"
          style={{ color: C.fgFaint, ...serif }}
        >
          {PROFIEL.naam} — in de hoofdrol · {PROFIEL.trust}
        </span>
      </div>

      {palette && (
        <CommandPalette screen={screen} setScreen={setScreen} onClose={() => setPalette(false)} />
      )}

      <style>{`
        @keyframes csFade { from { opacity: 0; transform: translateY(10px) scale(0.995); } to { opacity: 1; transform: none; } }
        .cs-fade { animation: csFade 0.42s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes csGrain { 0%,100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        .cs-grain { animation: csGrain 3s ease-in-out infinite; }
        .cs-row { transition: background 0.18s ease; }
        .cs-row:hover { background: ${C.panelSoft}; }
        @media (prefers-reduced-motion: reduce) { .cs-fade, .cs-grain { animation: none !important; } .cs-row { transition: none !important; } }
      `}</style>
    </div>
  );
}

// —————————————————————————————————————— Reel-nav (zijbalk) ——————————————————————————————————————
function ReelNav({
  screen,
  setScreen,
  onCommand,
}: {
  screen: ScreenKey;
  setScreen: (s: ScreenKey) => void;
  onCommand: () => void;
}) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <aside
      className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col md:flex"
      style={{ background: C.letterbox, borderRight: `1px solid ${C.line}` }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-5"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-md"
          style={{ background: `linear-gradient(135deg, ${C.amber}, ${C.rose})`, color: "#0d0f10" }}
          aria-hidden="true"
        >
          <Clapperboard size={18} />
        </span>
        <span>
          <span
            className="block text-[15px] font-normal italic tracking-[0.01em]"
            style={{ color: C.fg, ...serif }}
          >
            Cinemascope
          </span>
          <span
            className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: C.amber }}
          >
            werk in beeld
          </span>
        </span>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1 overflow-y-auto px-3 py-4">
        <p
          className="px-2 pb-2.5 text-[9px] font-semibold uppercase tracking-[0.26em]"
          style={{ color: C.fgFaint }}
        >
          Scèneselectie
        </p>
        <ul className="space-y-1">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = SCREEN_ICON[s.key];
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`group flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors ${RING}`}
                  style={on ? { background: C.amberSoft, color: C.amber } : { color: C.fgSoft }}
                >
                  <span
                    className="text-[10px] font-semibold tabular-nums"
                    style={{ color: on ? C.amber : C.fgFaint, ...mono }}
                    aria-hidden="true"
                  >
                    {SCENE_NO[s.key]}
                  </span>
                  <Icon size={15} aria-hidden="true" style={{ color: on ? C.amber : C.fgMute }} />
                  <span className="flex-1 font-medium">{s.label}</span>
                  {on && <Play size={12} aria-hidden="true" style={{ color: C.amber }} />}
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
          className={`mb-3 flex w-full items-center gap-2 rounded-md px-3 py-2 text-[12px] ${RING}`}
          style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.fgMute }}
        >
          <Command size={13} aria-hidden="true" /> Scène zoeken
          <span className="ml-auto text-[10px]" style={{ color: C.fgFaint, ...mono }}>
            ⌘K
          </span>
        </button>
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-md text-[11px] font-semibold"
            style={{ background: C.tealSoft, color: C.teal, ...mono }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-medium" style={{ color: C.fg }}>
              {PROFIEL.naam}
            </span>
            <span className="flex items-center gap-1 text-[10px]" style={{ color: C.teal }}>
              <ShieldCheck size={10} aria-hidden="true" /> {verified}/{CREDENTIALS.length} in beeld
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}

function Marquee({ screen, onCommand }: { screen: ScreenKey; onCommand: () => void }) {
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (a, f) => a + parseEUR(f.bedrag),
    0,
  );
  const current = SCREENS.find((s) => s.key === screen)?.label ?? "Dashboard";
  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 sm:px-6 md:px-9"
      style={{
        background: `${C.bg}e6`,
        borderBottom: `1px solid ${C.line}`,
        backdropFilter: "blur(8px)",
      }}
    >
      <span
        className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]"
        style={{ color: C.fgFaint }}
      >
        <Film size={13} aria-hidden="true" style={{ color: C.amber }} />
        {current}
      </span>
      <button
        type="button"
        onClick={onCommand}
        className={`ml-auto flex items-center gap-2 rounded-md px-3.5 py-2 text-[12px] ${RING}`}
        style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.fgMute }}
      >
        <Search size={14} aria-hidden="true" />
        <span className="hidden sm:inline">Zoek scène, opdracht, certificaat…</span>
        <span
          className="ml-1 rounded px-1.5 py-0.5 text-[10px]"
          style={{ background: C.sink, color: C.fgFaint, ...mono }}
        >
          ⌘K
        </span>
      </button>
      <span
        className="hidden items-center gap-2 rounded-md px-3 py-2 text-[12px] font-medium sm:inline-flex"
        style={{ background: C.amberSoft, color: C.amber, border: `1px solid ${C.amber}44` }}
      >
        <Clock size={13} aria-hidden="true" />
        <span style={{ ...mono }}>{eur0.format(open)}</span> openstaand
      </span>
    </header>
  );
}

function SceneStrip({
  screen,
  setScreen,
}: {
  screen: ScreenKey;
  setScreen: (s: ScreenKey) => void;
}) {
  return (
    <nav
      aria-label="Scènes"
      className="flex gap-1.5 overflow-x-auto px-4 py-2.5 md:hidden"
      style={{ borderBottom: `1px solid ${C.line}`, background: C.letterbox }}
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`shrink-0 rounded-md px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${RING}`}
            style={
              on
                ? { background: C.amber, color: "#0d0f10" }
                : { color: C.fgSoft, background: C.panel }
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
      style={{ background: "rgba(6,7,8,0.72)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Scène zoeken"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl"
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
          <Search size={16} aria-hidden="true" style={{ color: C.amber }} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Spring naar een scène…"
            aria-label="Scène zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#5e5a52]"
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
              Geen scène gevonden voor “{q}”.
            </li>
          ) : (
            rows.map((s) => {
              const Icon = SCREEN_ICON[s.key];
              const on = s.key === screen;
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => {
                      setScreen(s.key);
                      onClose();
                    }}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[13px] ${RING}`}
                    style={{
                      color: on ? C.amber : C.fgSoft,
                      background: on ? C.amberSoft : "transparent",
                    }}
                  >
                    <span
                      className="text-[10px] tabular-nums"
                      style={{ color: C.fgFaint, ...mono }}
                    >
                      {SCENE_NO[s.key]}
                    </span>
                    <Icon size={15} aria-hidden="true" />
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
    <div className="space-y-9">
      <TitleCard
        scene="dashboard"
        title={`Goedendag ${PROFIEL.naam.split(" ")[0]} — het doek gaat open`}
        sub="Drie scènes vragen vandaag je aandacht. Daarna staat het hele verhaal weer op scherp."
        right={
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" tone={C.teal} onClick={onVerif}>
              <ShieldCheck size={13} aria-hidden="true" /> Dossier
            </Btn>
            <Btn variant="solid" size="sm" onClick={onActies}>
              Volgende scène <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {KPIS.map((k, i) => {
          const tone = i % 2 === 0 ? C.amber : C.teal;
          return (
            <Panel key={k.label} className="overflow-hidden p-4" tone={tone}>
              <div className="flex items-center justify-between">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: C.fgMute }}
                >
                  {k.label}
                </p>
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: tone }}
                  aria-hidden="true"
                />
              </div>
              <p
                className="mt-3 text-[26px] font-normal leading-none tracking-[-0.01em]"
                style={{ color: C.fg, ...serif }}
              >
                {k.value}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className="text-[11px] font-medium"
                  style={{ color: k.up ? C.teal : C.amber, ...mono }}
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
                        style={{ height: h, background: last ? tone : `${tone}55` }}
                      />
                    );
                  })}
                </span>
              </div>
            </Panel>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Panel className="overflow-hidden" tone={C.amber}>
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <Kicker tone={C.amber}>
              <Store size={12} aria-hidden="true" /> Op het affiche voor jou
            </Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className={`rounded text-[11.5px] font-medium ${RING}`}
              style={{ color: C.amber }}
            >
              Alle scènes →
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => {
              const tone = o.match >= 90 ? C.teal : C.amber;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className={`cs-row flex w-full items-center gap-4 px-5 py-4 text-left ${RING}`}
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="text-[11px] font-semibold tabular-nums"
                      style={{ color: C.fgFaint, ...mono }}
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[15px] font-normal italic"
                        style={{ color: C.fg, ...serif }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-1 flex items-center gap-1 truncate text-[11.5px]"
                        style={{ color: C.fgMute }}
                      >
                        <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </span>
                    </span>
                    <MatchStrip value={o.match} tone={tone} />
                    <ChevronRight size={16} aria-hidden="true" style={{ color: C.fgFaint }} />
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="space-y-5">
          <Panel className="overflow-hidden p-5" tone={C.teal}>
            <Kicker tone={C.teal}>
              <ShieldCheck size={12} aria-hidden="true" /> Vertrouwensscore
            </Kicker>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className="text-[40px] font-normal leading-none"
                style={{ color: C.teal, ...serif }}
              >
                {ratio}%
              </span>
              <span className="text-[12px]" style={{ color: C.fgMute }}>
                dossier in beeld
              </span>
            </div>
            <div className="mt-4 flex gap-1.5" aria-hidden="true">
              {CREDENTIALS.map((c) => {
                const t = credTone(c.status);
                return (
                  <span
                    key={c.naam}
                    className="h-1.5 flex-1 rounded-full"
                    style={{ background: c.status === "VERIFIED" ? C.teal : `${t.base}77` }}
                  />
                );
              })}
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed" style={{ color: C.fgMute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd · {PROFIEL.trust}.
            </p>
          </Panel>

          <Panel className="p-5" tone={C.amber} as="article">
            <Kicker tone={C.amber}>
              <AlertTriangle size={12} aria-hidden="true" /> Cliffhanger
            </Kicker>
            <h3
              className="mt-2.5 text-[17px] font-normal italic leading-snug"
              style={{ color: C.fg, ...serif }}
            >
              {primair.titel}
            </h3>
            <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: C.fgSoft }}>
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
    <div className="space-y-7">
      <TitleCard
        scene="marktplaats"
        title="De casting — opdrachten die bij je passen"
        sub={`${rows.length} van ${OPDRACHTEN.length} opdrachten sluiten aan op je geverifieerde profiel.`}
      />

      <Panel className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center" tone={C.amber}>
        <div
          className="flex flex-1 items-center gap-2 rounded-md px-3.5 py-2"
          style={{ background: C.sink, border: `1px solid ${C.line}` }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.fgFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#5e5a52]"
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
              tone={C.amber}
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
          tone={C.rose}
          titel="De montage hapert even"
          tekst="De opdrachten konden zojuist niet worden opgehaald. Draai de rol opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.amber}
          titel="Geen rol gevonden"
          tekst={`Niets voor ${q ? `“${q}”` : "je zoekterm"}. Verruim de casting en probeer opnieuw.`}
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
            className={`rounded text-[10px] font-semibold uppercase tracking-[0.2em] underline-offset-2 hover:underline ${RING}`}
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
        className="flex h-16 w-16 items-center justify-center rounded-lg"
        style={{ color: tone, background: `${tone}1f`, border: `1px solid ${tone}44` }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-5 text-[22px] font-normal italic" style={{ color: C.fg, ...serif }}>
        {titel}
      </p>
      <p className="mt-2.5 max-w-sm text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
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
  const tone = strong ? C.teal : C.amber;
  return (
    <Panel as="article" className="overflow-hidden" tone={tone}>
      <div className="flex items-start gap-4 p-5">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-[13px] font-semibold"
          style={{ background: `${tone}1f`, color: tone, border: `1px solid ${tone}44`, ...mono }}
          aria-hidden="true"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em]"
            style={{ color: C.fgFaint, ...mono }}
          >
            <span>{opdracht.id}</span>
            <span aria-hidden="true">·</span>
            <span style={{ color: tone }}>{strong ? "hoofdrol" : "bijrol"}</span>
          </div>
          <h3
            className="mt-1.5 text-[18px] font-normal italic leading-snug"
            style={{ color: C.fg, ...serif }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.fgMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-sm px-2.5 py-0.5 text-[11px] font-medium"
                style={{ background: C.sink, color: C.fgSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
          <MatchStrip value={opdracht.match} tone={tone} />
          <span className="text-[15px] font-normal" style={{ color: C.fg, ...serif }}>
            {opdracht.tarief.replace(" / uur", "")}
            <span className="text-[10px]" style={{ color: C.fgFaint }}>
              {" "}
              p/uur
            </span>
          </span>
        </div>
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
              tone={C.teal}
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
        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em]"
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
  const tone = strong ? C.teal : C.amber;
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur" },
    { l: "Omvang", v: opdracht.uren, s: "per week" },
    { l: "Aanvang", v: opdracht.start, s: "startdatum" },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel" },
  ];
  return (
    <div className="space-y-6">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar de casting
      </Btn>

      <Panel className="overflow-hidden" tone={tone}>
        <div
          className="p-6 md:p-8"
          style={{ background: `linear-gradient(135deg, ${tone}14, transparent 60%)` }}
        >
          <div
            className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em]"
            style={{ color: C.fgFaint, ...mono }}
          >
            <span>{opdracht.id}</span>
            <span aria-hidden="true">·</span>
            <span
              className="rounded-sm px-2 py-0.5"
              style={{ color: tone, background: `${tone}1f` }}
            >
              {strong ? "sterke match" : "goede match"} {opdracht.match}%
            </span>
          </div>
          <h1
            className="mt-4 max-w-2xl text-[30px] font-normal italic leading-[1.1] md:text-[38px]"
            style={{ color: C.fg, ...serif }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-3 flex items-center gap-1.5 text-[13.5px]" style={{ color: C.fgMute }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-sm px-2.5 py-0.5 text-[11px] font-medium"
                style={{ background: C.sink, color: C.fgSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
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
                className="text-[9px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.fgMute }}
              >
                {m.l}
              </p>
              <p
                className="mt-2 text-[19px] font-normal leading-none"
                style={{ color: C.fg, ...serif }}
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

      <Panel className="p-6 md:p-8" tone={C.amber}>
        <Kicker tone={C.amber}>
          <ListChecks size={12} aria-hidden="true" /> Navolgbaar — geen verborgen score
        </Kicker>
        <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
          Afgezet tegen je geverifieerde profiel. Wat in je voordeel spreekt, en wat goed is om
          vooraf te weten.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.teal }}
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
                    style={{ color: C.teal }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.amber }}
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
      <TitleCard
        scene="verificatie"
        title="De aftiteling — jouw vertrouwensregister"
        sub={`${verified} van ${CREDENTIALS.length} certificaten geverifieerd · ${PROFIEL.trust}.`}
        right={
          <div
            className="rounded-lg px-5 py-3 text-right"
            style={{ background: C.tealSoft, border: `1px solid ${C.teal}44` }}
          >
            <p className="text-[30px] font-normal leading-none" style={{ color: C.teal, ...serif }}>
              {ratio}%
            </p>
            <p
              className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: C.teal }}
            >
              in beeld
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
                <span className="text-[16px] font-normal" style={{ color: t.base, ...serif }}>
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
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                    style={{ background: t.soft, color: t.base, border: `1px solid ${t.base}44` }}
                    aria-hidden="true"
                  >
                    <t.Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[15px] font-normal italic"
                      style={{ color: C.fg, ...serif }}
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
        scene="acties"
        title="Het draaiboek — wat vandaag je aandacht vraagt"
        sub="Op volgorde van urgentie. Werk ze af en de volgende scène kan beginnen."
      />
      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.teal;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Panel className="flex items-start gap-4 p-5" tone={tone}>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-[16px] font-normal"
                  style={{
                    background: `${tone}1f`,
                    color: tone,
                    border: `1px solid ${tone}44`,
                    ...serif,
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
                    className="mt-2 text-[17px] font-normal italic leading-snug"
                    style={{ color: C.fg, ...serif }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                    style={{ color: C.fgSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3.5">
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
      <TitleCard
        scene="facturen"
        title="De boekhouding — jouw facturen in beeld"
        sub="Klik een regel om de opbouw te openen."
        right={
          <Btn variant="solid" size="sm">
            <Receipt size={13} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: totals.betaald, sub: "2 facturen", tone: C.teal, Icon: Check },
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
            tone: C.gold,
            Icon: Film,
          },
        ].map((s) => (
          <Panel key={s.l} className="p-4" tone={s.tone}>
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: s.tone }}
              >
                {s.l}
              </p>
              <s.Icon size={14} aria-hidden="true" style={{ color: s.tone }} />
            </div>
            <p
              className="mt-2 text-[24px] font-normal leading-none"
              style={{ color: C.fg, ...serif }}
            >
              {eur0.format(s.v)}
            </p>
            <p className="mt-1 text-[11px]" style={{ color: C.fgMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="overflow-hidden" tone={C.amber}>
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
                  tone={C.amber}
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
                      className={`px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${i === 3 ? "text-right" : ""}`}
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
                      className={`cs-row cursor-pointer ${RING}`}
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
                        className="px-4 py-3 text-[12px] font-medium"
                        style={{ color: on ? C.amber : C.fgSoft, ...mono }}
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
          className="text-[9px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: t.base }}
        >
          Factuur
        </p>
        <p className="text-[18px] font-normal" style={{ color: C.fg, ...serif }}>
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
          <span className="text-[22px] font-normal" style={{ color: t.base, ...serif }}>
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
