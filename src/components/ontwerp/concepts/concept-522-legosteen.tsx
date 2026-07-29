"use client";

// Concept 522 — "Legosteen" · Een modulair bouwsysteem. Chunky primaire blokken (rood/geel/blauw)
// met tactiele "stud"-noppen die in een strak grid klikken, dikke zwarte hairlines en harde offset-
// schaduwen voor een fysiek, klikbaar gevoel. Bauhaus-primair, speels maar ordelijk en B2B-professioneel
// — geen speelgoed-kitsch. Kleur draagt nooit alleen de status: altijd label + icoon.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Blocks,
  Check,
  ChevronRight,
  Clock,
  Command,
  FileText,
  Grid3x3,
  LayoutGrid,
  ListChecks,
  MapPin,
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

// ————————————————————————————— Palet — primair op licht papier, zwarte hairlines —————————————————————————————
const C = {
  bg: "#f4f2ec",
  panel: "#ffffff",
  sink: "#eceae1",
  ink: "#141414",
  inkSoft: "#37372f",
  inkMute: "#6d6d63",
  inkFaint: "#9a9a8f",
  lineSoft: "#dcd9ce",
  red: "#d81e2c",
  redSoft: "#fbe3e5",
  yellow: "#f5b915",
  yellowSoft: "#fdf1cf",
  blue: "#1c5fd8",
  blueSoft: "#dde7fb",
  green: "#1f9d54",
  greenSoft: "#d9f2e2",
  orange: "#e8792b",
  orangeSoft: "#fce6d5",
};
const BLACK = C.ink;

const sans: CSSProperties = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const mono: CSSProperties = {
  fontFamily: "'SF Mono', 'JetBrains Mono', ui-monospace, 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: "'tnum' 1",
};
const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c5fd8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f2ec]";

// ————————————————————————————— Status-taal (label + icoon) —————————————————————————————
type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.green,
        soft: C.greenSoft,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return { base: C.blue, soft: C.blueSoft, label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return {
        base: C.orange,
        soft: C.orangeSoft,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.red, soft: C.redSoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

function factuurTone(status: string): {
  base: string;
  soft: string;
  label: string;
  Icon: LucideIcon;
} {
  if (status === "Betaald")
    return { base: C.green, soft: C.greenSoft, label: "Betaald", Icon: Check };
  if (status === "Openstaand")
    return { base: C.orange, soft: C.orangeSoft, label: "Openstaand", Icon: Clock };
  return { base: C.blue, soft: C.blueSoft, label: "Concept", Icon: FileText };
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

const BRICK_TONES = [C.red, C.yellow, C.blue, C.green];
const NAV_TONE: Record<ScreenKey, string> = {
  dashboard: C.red,
  marktplaats: C.blue,
  opdracht: C.yellow,
  verificatie: C.green,
  acties: C.orange,
  facturen: C.blue,
  documenten: C.red,
  berichten: C.yellow,
};
const SCREEN_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: Blocks,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: FileText,
};

// ————————————————————————————— Studs (noppen) —————————————————————————————
function Studs({ n = 3, color }: { n?: number; color: string }) {
  return (
    <span className="pointer-events-none absolute left-3 top-2 flex gap-1.5" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <span
          key={i}
          className="h-2.5 w-2.5 rounded-full"
          style={{
            background: color,
            border: `1.5px solid ${BLACK}`,
            boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.2)",
          }}
        />
      ))}
    </span>
  );
}

// ————————————————————————————— Primitives (blokken) —————————————————————————————
function Brick({
  children,
  className = "",
  as: Tag = "div",
  shadow = true,
  bg = C.panel,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  shadow?: boolean;
  bg?: string;
}) {
  return (
    <Tag
      className={`relative rounded-md ${className}`}
      style={{
        background: bg,
        border: `2px solid ${BLACK}`,
        boxShadow: shadow ? `5px 5px 0 ${BLACK}` : "none",
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
  tone = C.blue,
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
  const base = `lego-btn inline-flex items-center justify-center gap-2 rounded-md font-bold tracking-[-0.01em] ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? {
          background: tone,
          color: tone === C.yellow ? BLACK : "#fff",
          border: `2px solid ${BLACK}`,
          boxShadow: `3px 3px 0 ${BLACK}`,
          ...sans,
        }
      : variant === "outline"
        ? {
            background: C.panel,
            color: BLACK,
            border: `2px solid ${BLACK}`,
            boxShadow: `3px 3px 0 ${BLACK}`,
            ...sans,
          }
        : { background: "transparent", color: C.inkSoft, border: "2px solid transparent", ...sans };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`${base} ${pad} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}

function StatusTag({ base, soft, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-bold"
      style={{ color: BLACK, background: soft, border: `2px solid ${BLACK}`, ...sans }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: base, border: `1px solid ${BLACK}` }}
        aria-hidden="true"
      />
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

function Kicker({ children, tone = C.blue }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10.5px] font-black uppercase tracking-[0.1em]"
      style={{
        color: tone === C.yellow ? BLACK : "#fff",
        background: tone,
        border: `2px solid ${BLACK}`,
        ...sans,
      }}
    >
      {children}
    </span>
  );
}

// Match als gestapelde blokjes-meter
function MatchStack({ value, tone }: { value: number; tone: string }) {
  const filled = Math.round(value / 20); // 0..5
  return (
    <span className="inline-flex flex-col items-center gap-1" aria-label={`Match ${value} procent`}>
      <span className="flex flex-col-reverse gap-[3px]" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="h-[7px] w-8 rounded-[2px]"
            style={{ background: i < filled ? tone : C.sink, border: `1.5px solid ${BLACK}` }}
          />
        ))}
      </span>
      <span className="text-[12px] font-black" style={{ color: BLACK, ...mono }}>
        {value}
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
          <Blocks size={12} aria-hidden="true" /> {SCREENS.find((s) => s.key === screen)?.label}
        </Kicker>
        <h1
          className="mt-3 text-[27px] font-black leading-[1.05] tracking-[-0.03em] md:text-[33px]"
          style={{ color: BLACK }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed" style={{ color: C.inkMute }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept522() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [palette, setPalette] = useState(false);
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[760px] w-full antialiased"
      style={{ ...sans, color: BLACK, background: C.bg }}
    >
      <div className="mx-auto flex max-w-6xl">
        <BrickNav screen={screen} setScreen={setScreen} onCommand={() => setPalette(true)} />
        <div className="min-w-0 flex-1">
          <TopBar onCommand={() => setPalette(true)} />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="lego-fade px-4 pb-16 pt-7 sm:px-6 md:px-8">
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
        @keyframes legoFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .lego-fade { animation: legoFade 0.32s cubic-bezier(0.22,1,0.36,1) both; }
        .lego-btn { transition: transform 0.1s ease, box-shadow 0.1s ease; }
        .lego-btn:hover { transform: translate(-1px,-1px); }
        .lego-btn:active { transform: translate(2px,2px); box-shadow: 0 0 0 ${BLACK} !important; }
        .lego-row { transition: background 0.15s ease; }
        .lego-row:hover { background: ${C.sink}; }
        @media (prefers-reduced-motion: reduce) { .lego-fade { animation: none !important; } .lego-btn, .lego-row { transition: none !important; } }
      `}</style>
    </div>
  );
}

// —————————————————————————————————————— Nav (stapel blokken) ——————————————————————————————————————
function BrickNav({
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
      className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col md:flex"
      style={{ background: C.bg, borderRight: `2px solid ${BLACK}` }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-5"
        style={{ borderBottom: `2px solid ${BLACK}` }}
      >
        <span
          className="relative flex h-9 w-9 items-center justify-center rounded-md"
          style={{ background: C.red, border: `2px solid ${BLACK}` }}
          aria-hidden="true"
        >
          <Blocks size={17} color="#fff" />
        </span>
        <span>
          <span
            className="block text-[15px] font-black tracking-[-0.02em]"
            style={{ color: BLACK }}
          >
            Legosteen
          </span>
          <span
            className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.blue }}
          >
            bouw je werk op
          </span>
        </span>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1 overflow-y-auto px-3 py-4">
        <p
          className="px-2 pb-2 text-[9px] font-black uppercase tracking-[0.16em]"
          style={{ color: C.inkFaint }}
        >
          Bouwstenen
        </p>
        <ul className="space-y-2">
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
                  className={`lego-btn relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 pl-3 text-left text-[13px] font-bold ${RING}`}
                  style={
                    on
                      ? {
                          background: tone,
                          color: tone === C.yellow ? BLACK : "#fff",
                          border: `2px solid ${BLACK}`,
                          boxShadow: `3px 3px 0 ${BLACK}`,
                        }
                      : { background: C.panel, color: C.inkSoft, border: `2px solid ${BLACK}` }
                  }
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded"
                    style={{
                      background: on ? "rgba(255,255,255,0.25)" : tone,
                      border: `1.5px solid ${BLACK}`,
                      color: on ? "inherit" : tone === C.yellow ? BLACK : "#fff",
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={13} />
                  </span>
                  <span className="flex-1">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-4" style={{ borderTop: `2px solid ${BLACK}` }}>
        <button
          type="button"
          onClick={onCommand}
          className={`lego-btn mb-3 flex w-full items-center gap-2 rounded-md px-3 py-2 text-[12px] font-bold ${RING}`}
          style={{ background: C.panel, border: `2px solid ${BLACK}` }}
        >
          <Command size={13} aria-hidden="true" /> Zoek blok
          <span className="ml-auto text-[10px]" style={{ color: C.inkMute, ...mono }}>
            ⌘K
          </span>
        </button>
        <Brick className="p-3" shadow={false} bg={C.greenSoft}>
          <p
            className="text-[9px] font-black uppercase tracking-[0.12em]"
            style={{ color: C.green }}
          >
            Dossier gebouwd
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[18px] font-black leading-none" style={{ color: BLACK, ...mono }}>
              {verified}/{CREDENTIALS.length}
            </span>
            <span className="flex gap-1" aria-hidden="true">
              {CREDENTIALS.map((c) => (
                <span
                  key={c.naam}
                  className="h-3 w-3 rounded-[2px]"
                  style={{
                    background: c.status === "VERIFIED" ? C.green : C.panel,
                    border: `1.5px solid ${BLACK}`,
                  }}
                />
              ))}
            </span>
          </div>
        </Brick>
        <div className="mt-3 flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-md text-[11px] font-black"
            style={{ background: C.yellow, border: `2px solid ${BLACK}`, color: BLACK, ...mono }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-bold" style={{ color: BLACK }}>
              {PROFIEL.naam}
            </span>
            <span
              className="flex items-center gap-1 text-[10px] font-bold"
              style={{ color: C.green }}
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
      className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 sm:px-6 md:px-8"
      style={{ background: C.bg, borderBottom: `2px solid ${BLACK}` }}
    >
      <button
        type="button"
        onClick={onCommand}
        className={`lego-btn flex flex-1 items-center gap-2 rounded-md px-3.5 py-2 ${RING}`}
        style={{ background: C.panel, border: `2px solid ${BLACK}` }}
      >
        <Search size={14} aria-hidden="true" style={{ color: C.inkMute }} />
        <span className="text-[12.5px] font-medium" style={{ color: C.inkMute }}>
          Zoek opdrachten, certificaten, facturen…
        </span>
        <span
          className="ml-auto hidden rounded px-1.5 py-0.5 text-[10px] font-bold sm:inline"
          style={{ background: C.sink, color: C.inkMute, border: `1.5px solid ${BLACK}`, ...mono }}
        >
          ⌘K
        </span>
      </button>
      <span
        className="hidden items-center gap-2 rounded-md px-3 py-2 text-[12px] font-bold sm:inline-flex"
        style={{ background: C.orangeSoft, color: BLACK, border: `2px solid ${BLACK}` }}
      >
        <Clock size={13} aria-hidden="true" style={{ color: C.orange }} />
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
      className="flex gap-2 overflow-x-auto px-4 py-3 md:hidden"
      style={{ borderBottom: `2px solid ${BLACK}`, background: C.bg }}
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
            className={`lego-btn shrink-0 rounded-md px-3.5 py-1.5 text-[12.5px] font-bold ${RING}`}
            style={
              on
                ? {
                    background: tone,
                    color: tone === C.yellow ? BLACK : "#fff",
                    border: `2px solid ${BLACK}`,
                    boxShadow: `3px 3px 0 ${BLACK}`,
                  }
                : { background: C.panel, color: C.inkSoft, border: `2px solid ${BLACK}` }
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
      style={{ background: "rgba(20,20,20,0.4)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Blok zoeken"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-md"
        style={{
          background: C.panel,
          border: `2px solid ${BLACK}`,
          boxShadow: `6px 6px 0 ${BLACK}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-2.5 px-4 py-3.5"
          style={{ borderBottom: `2px solid ${BLACK}`, background: C.yellow }}
        >
          <Search size={16} aria-hidden="true" style={{ color: BLACK }} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Spring naar een bouwsteen…"
            aria-label="Blok zoeken"
            className="w-full bg-transparent text-[14px] font-bold outline-none placeholder:text-[#6d6d63]"
            style={{ color: BLACK }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className={`rounded p-1 ${RING}`}
            style={{ color: BLACK }}
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
        <ul className="max-h-72 overflow-y-auto p-2">
          {rows.length === 0 ? (
            <li
              className="px-3 py-8 text-center text-[13px] font-medium"
              style={{ color: C.inkMute }}
            >
              Geen bouwsteen gevonden voor “{q}”.
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
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[13px] font-bold ${RING}`}
                    style={{ color: BLACK, background: on ? C.sink : "transparent" }}
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded"
                      style={{
                        background: tone,
                        border: `1.5px solid ${BLACK}`,
                        color: tone === C.yellow ? BLACK : "#fff",
                      }}
                      aria-hidden="true"
                    >
                      <Icon size={13} />
                    </span>
                    <span className="flex-1">{s.label}</span>
                    <ChevronRight size={14} aria-hidden="true" style={{ color: C.inkFaint }} />
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
      <TitleCard
        screen="dashboard"
        title={`Hoi ${PROFIEL.naam.split(" ")[0]}, laten we bouwen`}
        sub="Drie blokken vragen vandaag je aandacht. Klik ze op hun plek en je dossier staat weer strak."
        right={
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" onClick={onVerif}>
              <ShieldCheck size={13} aria-hidden="true" /> Dossier
            </Btn>
            <Btn variant="solid" size="sm" tone={C.red} onClick={onActies}>
              Volgende blok <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {KPIS.map((k, i) => {
          const tone = BRICK_TONES[i % BRICK_TONES.length] ?? C.red;
          return (
            <Brick key={k.label} className="relative overflow-hidden p-4 pt-7">
              <Studs n={3} color={tone} />
              <div className="flex items-center justify-between">
                <p className="text-[10.5px] font-bold" style={{ color: C.inkMute }}>
                  {k.label}
                </p>
                <span
                  className="h-3 w-3 rounded-[2px]"
                  style={{ background: tone, border: `1.5px solid ${BLACK}` }}
                  aria-hidden="true"
                />
              </div>
              <p
                className="mt-2 text-[26px] font-black leading-none tracking-[-0.02em]"
                style={{ color: BLACK, ...mono }}
              >
                {k.value}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className="rounded px-2 py-0.5 text-[11px] font-black"
                  style={{
                    color: BLACK,
                    background: k.up ? C.greenSoft : C.orangeSoft,
                    border: `1.5px solid ${BLACK}`,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend}
                </span>
                <span className="inline-flex h-6 items-end gap-[3px]" aria-hidden="true">
                  {k.spark.map((d, j) => {
                    const max = Math.max(...k.spark);
                    const min = Math.min(...k.spark);
                    const h = 4 + ((d - min) / (max - min || 1)) * 16;
                    const last = j === k.spark.length - 1;
                    return (
                      <span
                        key={j}
                        className="w-[4px] rounded-[1px]"
                        style={{
                          height: h,
                          background: last ? tone : C.sink,
                          border: `1px solid ${BLACK}`,
                        }}
                      />
                    );
                  })}
                </span>
              </div>
            </Brick>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Brick className="overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: `2px solid ${BLACK}`, background: C.blueSoft }}
          >
            <Kicker tone={C.blue}>
              <Store size={12} aria-hidden="true" /> Toppers voor jou
            </Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className={`rounded text-[11.5px] font-bold ${RING}`}
              style={{ color: C.blue }}
            >
              Alle opdrachten →
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => {
              const tone = o.match >= 90 ? C.green : C.blue;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className={`lego-row flex w-full items-center gap-4 px-5 py-4 text-left ${RING}`}
                    style={{ borderTop: i === 0 ? "none" : `2px solid ${C.lineSoft}` }}
                  >
                    <MatchStack value={o.match} tone={tone} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14.5px] font-bold"
                        style={{ color: BLACK }}
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
                        className="block text-[13.5px] font-black"
                        style={{ color: BLACK, ...mono }}
                      >
                        {o.tarief.replace(" / uur", "")}
                      </span>
                      <span
                        className="text-[9px] font-bold uppercase tracking-[0.08em]"
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
        </Brick>

        <div className="space-y-5">
          <Brick className="relative overflow-hidden p-5 pt-7" bg={C.greenSoft}>
            <Studs n={4} color={C.green} />
            <Kicker tone={C.green}>
              <ShieldCheck size={12} aria-hidden="true" /> Vertrouwenstoren
            </Kicker>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span
                className="text-[38px] font-black leading-none tracking-[-0.03em]"
                style={{ color: BLACK, ...mono }}
              >
                {ratio}%
              </span>
              <span className="text-[12px]" style={{ color: C.inkMute }}>
                dossier gebouwd
              </span>
            </div>
            <div className="mt-3 flex gap-1.5" aria-hidden="true">
              {CREDENTIALS.map((c) => (
                <span
                  key={c.naam}
                  className="h-4 flex-1 rounded-[2px]"
                  style={{
                    background: c.status === "VERIFIED" ? C.green : C.panel,
                    border: `1.5px solid ${BLACK}`,
                  }}
                />
              ))}
            </div>
            <p className="mt-2.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd · {PROFIEL.trust}.
            </p>
          </Brick>

          <Brick className="relative overflow-hidden p-5 pt-7" as="article" bg={C.orangeSoft}>
            <Studs n={2} color={C.orange} />
            <Kicker tone={C.orange}>
              <AlertTriangle size={12} aria-hidden="true" /> Termijn nadert
            </Kicker>
            <h3 className="mt-2.5 text-[15px] font-bold leading-snug" style={{ color: BLACK }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" full tone={C.orange} className="mt-4" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Brick>
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
      <TitleCard
        screen="marktplaats"
        title="Opdrachten die passen"
        sub={`${rows.length} van ${OPDRACHTEN.length} opdrachten klikken op je geverifieerde profiel.`}
      />

      <Brick className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2 rounded-md px-3.5 py-2"
          style={{ background: C.sink, border: `2px solid ${BLACK}` }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.inkMute }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] font-medium outline-none placeholder:text-[#9a9a8f]"
            style={{ color: BLACK }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className={`rounded p-0.5 ${RING}`}
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
              tone={C.blue}
              variant={sort === s ? "solid" : "outline"}
              onClick={() => setSort(s)}
            >
              {s === "match" ? "Match" : "Tarief"}
            </Btn>
          ))}
        </div>
      </Brick>

      {mode === "loading" ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Brick className="space-y-3 p-5">
                <div
                  className="h-4 w-2/3 animate-pulse rounded motion-reduce:animate-none"
                  style={{ background: C.sink }}
                />
                <div
                  className="h-3 w-1/2 animate-pulse rounded motion-reduce:animate-none"
                  style={{ background: C.sink }}
                />
              </Brick>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={AlertTriangle}
          tone={C.red}
          titel="Blok viel eraf"
          tekst="De opdrachten konden zojuist niet worden opgehaald. Klik opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.blue}
          titel="Geen blok gevonden"
          tekst={`Niets voor ${q ? `“${q}”` : "je zoekterm"}. Verruim je zoekopdracht en probeer opnieuw.`}
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
            className={`rounded text-[10px] font-black uppercase tracking-[0.14em] underline-offset-2 hover:underline ${RING}`}
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
    <Brick className="flex flex-col items-center px-6 py-16 text-center">
      <span
        className="flex h-16 w-16 items-center justify-center rounded-md"
        style={{
          color: tone === C.yellow ? BLACK : "#fff",
          background: tone,
          border: `2px solid ${BLACK}`,
          boxShadow: `4px 4px 0 ${BLACK}`,
        }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-5 text-[20px] font-black" style={{ color: BLACK }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
        {tekst}
      </p>
      <Btn variant="solid" tone={tone} className="mt-5" onClick={onCta}>
        <RotateCcw size={13} aria-hidden="true" /> {cta}
      </Btn>
    </Brick>
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
  const tone = strong ? C.green : C.blue;
  return (
    <Brick as="article" className="overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        <span className="shrink-0">
          <MatchStack value={opdracht.match} tone={tone} />
          <span
            className="mt-2 block rounded px-2 py-0.5 text-center text-[9px] font-black uppercase tracking-[0.06em]"
            style={{
              color: BLACK,
              background: strong ? C.greenSoft : C.blueSoft,
              border: `1.5px solid ${BLACK}`,
            }}
          >
            {strong ? "sterk" : "goed"}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 text-[10px] font-bold"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>#{String(index + 1).padStart(2, "0")}</span>
            <span aria-hidden="true">·</span>
            <span>{opdracht.id}</span>
          </div>
          <h3
            className="mt-1 text-[16.5px] font-black leading-snug tracking-[-0.01em]"
            style={{ color: BLACK }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t, ti) => {
              const tt = BRICK_TONES[ti % BRICK_TONES.length] ?? C.red;
              return (
                <span
                  key={t}
                  className="rounded px-2.5 py-0.5 text-[11px] font-bold"
                  style={{
                    background: C.panel,
                    color: BLACK,
                    border: `1.5px solid ${BLACK}`,
                    boxShadow: `2px 2px 0 ${tt}`,
                  }}
                >
                  {t}
                </span>
              );
            })}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[16px] font-black" style={{ color: BLACK, ...mono }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-[0.08em]"
            style={{ color: C.inkFaint }}
          >
            per uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-2 px-5 py-3"
        style={{ borderTop: `2px solid ${BLACK}`, background: C.sink }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 rounded text-[12px] font-bold ${RING}`}
          style={{ color: tone }}
        >
          <Grid3x3 size={13} aria-hidden="true" /> Waarom deze match
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
            style={{ borderTop: `2px solid ${BLACK}` }}
          >
            <RedenKolom
              titel="In je voordeel"
              tone={C.green}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.orange}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Brick>
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
        className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10.5px] font-black uppercase tracking-[0.08em]"
        style={{
          color: tone === C.yellow ? BLACK : "#fff",
          background: tone,
          border: `1.5px solid ${BLACK}`,
        }}
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
              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{ background: tone, border: `1.5px solid ${BLACK}` }}
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
  const tone = strong ? C.green : C.blue;
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur", c: C.red },
    { l: "Omvang", v: opdracht.uren, s: "per week", c: C.blue },
    { l: "Aanvang", v: opdracht.start, s: "startdatum", c: C.yellow },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel", c: C.green },
  ];
  return (
    <div className="space-y-6">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </Btn>

      <Brick className="overflow-hidden">
        <div className="p-6" style={{ background: `${tone}12` }}>
          <div
            className="flex items-center gap-2 text-[11px] font-bold"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>{opdracht.id}</span>
            <span aria-hidden="true">·</span>
            <span
              className="rounded px-2 py-0.5"
              style={{
                color: tone === C.yellow ? BLACK : "#fff",
                background: tone,
                border: `1.5px solid ${BLACK}`,
              }}
            >
              {strong ? "sterke match" : "goede match"} {opdracht.match}%
            </span>
          </div>
          <h1
            className="mt-3 max-w-2xl text-[26px] font-black leading-[1.1] tracking-[-0.025em] md:text-[31px]"
            style={{ color: BLACK }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13.5px]" style={{ color: C.inkMute }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t, ti) => {
              const tt = BRICK_TONES[ti % BRICK_TONES.length] ?? C.red;
              return (
                <span
                  key={t}
                  className="rounded px-2.5 py-0.5 text-[11px] font-bold"
                  style={{
                    background: C.panel,
                    color: BLACK,
                    border: `1.5px solid ${BLACK}`,
                    boxShadow: `2px 2px 0 ${tt}`,
                  }}
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
          style={{ borderTop: `2px solid ${BLACK}` }}
        >
          {feiten.map((m, i) => (
            <div
              key={m.l}
              className="relative p-4"
              style={{
                borderRight: i < 3 ? `2px solid ${BLACK}` : "none",
                borderTop: i >= 2 ? `2px solid ${BLACK}` : "none",
              }}
            >
              <p
                className="text-[9px] font-black uppercase tracking-[0.1em]"
                style={{ color: m.c }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-black leading-none"
                style={{ color: BLACK, ...mono }}
              >
                {m.v}
              </p>
              <p className="mt-1 text-[10.5px]" style={{ color: C.inkFaint }}>
                {m.s}
              </p>
            </div>
          ))}
        </div>
      </Brick>

      <Brick className="p-6">
        <Kicker tone={C.blue}>
          <ListChecks size={12} aria-hidden="true" /> Navolgbaar — geen verborgen score
        </Kicker>
        <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je geverifieerde profiel. Wat in je voordeel spreekt, en wat goed is om
          vooraf te weten.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p
              className="inline-flex items-center gap-2 rounded px-2 py-0.5 text-[10.5px] font-black uppercase tracking-[0.08em]"
              style={{ color: "#fff", background: C.green, border: `1.5px solid ${BLACK}` }}
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
                  <span
                    className="mt-1 h-3 w-3 shrink-0 rounded-[2px]"
                    style={{ background: C.green, border: `1.5px solid ${BLACK}` }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="inline-flex items-center gap-2 rounded px-2 py-0.5 text-[10.5px] font-black uppercase tracking-[0.08em]"
              style={{ color: "#fff", background: C.orange, border: `1.5px solid ${BLACK}` }}
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
                  <span
                    className="mt-1 h-3 w-3 shrink-0 rounded-[2px]"
                    style={{ background: C.orange, border: `1.5px solid ${BLACK}` }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Brick>
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
        title="Vertrouwensregister"
        sub={`${verified} van ${CREDENTIALS.length} certificaten geverifieerd · ${PROFIEL.trust}.`}
        right={
          <Brick className="px-4 py-2 text-right" shadow={false} bg={C.greenSoft}>
            <p
              className="text-[28px] font-black leading-none tracking-[-0.02em]"
              style={{ color: BLACK, ...mono }}
            >
              {ratio}%
            </p>
            <p
              className="text-[9px] font-black uppercase tracking-[0.12em]"
              style={{ color: C.green }}
            >
              gebouwd
            </p>
          </Brick>
        }
      />

      <Brick className="p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((st) => {
            const t = credTone(st);
            const count = CREDENTIALS.filter((c) => c.status === st).length;
            return (
              <span key={st} className="inline-flex items-center gap-2">
                <span className="text-[16px] font-black" style={{ color: BLACK, ...mono }}>
                  {count}
                </span>
                <StatusTag {...t} />
              </span>
            );
          })}
        </div>
      </Brick>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const t = credTone(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Brick as="article" className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-3 px-5 py-4 text-left ${RING}`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                    style={{ background: t.soft, color: t.base, border: `2px solid ${BLACK}` }}
                    aria-hidden="true"
                  >
                    <t.Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold" style={{ color: BLACK }}>
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
                      style={{ borderTop: `2px solid ${BLACK}`, paddingTop: 12 }}
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
              </Brick>
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
        sub="Op volgorde van urgentie — klik ze op hun plek."
      />
      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.orange : C.blue;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Brick className="flex items-start gap-4 p-5">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-[15px] font-black"
                  style={{
                    background: tone,
                    color: tone === C.yellow ? BLACK : "#fff",
                    border: `2px solid ${BLACK}`,
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
                  <h2 className="mt-2 text-[16px] font-bold leading-snug" style={{ color: BLACK }}>
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
              </Brick>
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
        screen="facturen"
        title="Je facturen"
        sub="Klik een regel om de opbouw te openen."
        right={
          <Btn variant="solid" size="sm" tone={C.red}>
            <Receipt size={13} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: totals.betaald, sub: "2 facturen", tone: C.green, Icon: Check },
          {
            l: "Openstaand",
            v: totals.open,
            sub: "1 factuur · 9 dagen",
            tone: C.orange,
            Icon: Clock,
          },
          {
            l: "Concept",
            v: totals.concept,
            sub: "klaar om te versturen",
            tone: C.blue,
            Icon: FileText,
          },
        ].map((s) => (
          <Brick key={s.l} className="relative overflow-hidden p-4 pt-7">
            <Studs n={3} color={s.tone} />
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-black uppercase tracking-[0.1em]"
                style={{ color: s.tone }}
              >
                {s.l}
              </p>
              <s.Icon size={14} aria-hidden="true" style={{ color: s.tone }} />
            </div>
            <p
              className="mt-1.5 text-[22px] font-black leading-none"
              style={{ color: BLACK, ...mono }}
            >
              {eur0.format(s.v)}
            </p>
            <p className="mt-1 text-[11px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Brick>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Brick className="overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: `2px solid ${BLACK}`, background: C.blueSoft }}
          >
            <Kicker tone={C.blue}>
              <Receipt size={12} aria-hidden="true" /> Facturen
            </Kicker>
            <div className="flex items-center gap-1.5" role="group" aria-label="Facturen sorteren">
              {(["datum", "bedrag"] as const).map((s) => (
                <Btn
                  key={s}
                  size="sm"
                  tone={C.blue}
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
                <tr style={{ borderBottom: `2px solid ${BLACK}` }}>
                  {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.1em] ${i === 3 ? "text-right" : ""}`}
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
                      className={`lego-row cursor-pointer ${RING}`}
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
                        borderTop: `2px solid ${C.lineSoft}`,
                        background: on ? C.yellowSoft : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3 text-[12px] font-bold"
                        style={{ color: BLACK, ...mono }}
                      >
                        {f.nr}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-bold" style={{ color: BLACK }}>
                        {f.klant}
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: C.inkMute, ...mono }}>
                        {f.datum}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-[13px] font-black"
                        style={{ color: BLACK, ...mono }}
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
        </Brick>

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
    <Brick as="article" className="overflow-hidden">
      <div className="p-5" style={{ borderBottom: `2px solid ${BLACK}`, background: t.soft }}>
        <p className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: t.base }}>
          Factuur
        </p>
        <p className="text-[17px] font-black" style={{ color: BLACK, ...mono }}>
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
          <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: t.base }}>
            <t.Icon size={12} aria-hidden="true" /> {t.label}
          </span>
        </div>
        <div className="my-3 h-[2px]" style={{ background: BLACK }} />
        <Row label="Subtotaal" value={eur0.format(subtotal)} isMono />
        <Row label="Btw 21%" value={eur0.format(btw)} isMono />
        <div className="my-3 h-[2px]" style={{ background: BLACK }} />
        <div className="flex items-baseline justify-between">
          <span
            className="text-[12px] font-black uppercase tracking-[0.1em]"
            style={{ color: BLACK }}
          >
            Totaal
          </span>
          <span className="text-[20px] font-black" style={{ color: BLACK, ...mono }}>
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
    </Brick>
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
        style={{ borderColor: C.lineSoft }}
        aria-hidden="true"
      />
      <span
        className="shrink-0 text-right text-[12.5px] font-bold"
        style={{ color: BLACK, ...(isMono ? mono : sans) }}
      >
        {value}
      </span>
    </div>
  );
}
