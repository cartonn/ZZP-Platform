"use client";

// Concept 513 — "Commandobrug" · Keyboard-first, de command-palette als het HELE besturingssysteem.
// Een oproepbare ⌘K-palette filtert over álle schermen en acties; overal tonen we sneltoets-hints
// (kbd). Raycast/Linear-gevoel: neutraal-donker canvas, monospace-accent, één signaal-accent
// (elektrisch groen). Alles is via toetsen bereikbaar. Status altijd met label + icoon — nooit enkel
// kleur.

import { useMemo, useState, useEffect, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  ChevronRight,
  Clock,
  Command,
  CornerDownLeft,
  FileText,
  Gauge,
  ListChecks,
  MapPin,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Terminal,
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

// ————————————————————————————— Palet — neutraal-donker + elektrisch signaal-accent —————————————————————————————
const C = {
  bg: "#0d0f12",
  panel: "#14171c",
  panelRaise: "#1a1e24",
  sink: "#0a0c0f",
  line: "#242932",
  lineSoft: "#1c2028",
  lineStrong: "#313843",

  text: "#e8ecf2",
  textSoft: "#aab2bf",
  textMute: "#6f7885",
  textFaint: "#4c5561",

  accent: "#5eead4", // signaal — teal/mint, Raycast-achtig
  accentDeep: "#2dd4bf",
  accentSoft: "rgba(94,234,212,0.12)",

  pos: "#5eead4",
  posSoft: "rgba(94,234,212,0.12)",
  info: "#7dd3fc",
  infoSoft: "rgba(125,211,252,0.12)",
  warn: "#fcd34d",
  warnSoft: "rgba(252,211,77,0.12)",
  neg: "#fda4af",
  negSoft: "rgba(253,164,175,0.12)",
};

const sans: CSSProperties = {
  fontFamily:
    "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const mono: CSSProperties = {
  fontFamily:
    "'SF Mono', 'JetBrains Mono', 'Roboto Mono', ui-monospace, 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums",
};
const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5eead4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0f12]";

// ————————————————————————————— Sneltoets-hint (kbd) —————————————————————————————
function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] px-1 text-[10.5px] font-semibold"
      style={{
        background: C.panelRaise,
        color: C.textSoft,
        border: `1px solid ${C.lineStrong}`,
        boxShadow: "0 1px 0 rgba(0,0,0,0.4)",
        ...mono,
      }}
    >
      {children}
    </kbd>
  );
}

function KbdSeq({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      {keys.map((k, i) => (
        <Kbd key={i}>{k}</Kbd>
      ))}
    </span>
  );
}

// ————————————————————————————— Status-taal (label + icoon) —————————————————————————————
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
  if (status === "Betaald") return { base: C.pos, soft: C.posSoft, label: "Betaald", Icon: Check };
  if (status === "Openstaand")
    return { base: C.warn, soft: C.warnSoft, label: "Openstaand", Icon: Clock };
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
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
}) {
  return (
    <Tag
      className={`rounded-[12px] ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}` }}
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
  shortcut,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  full?: boolean;
  shortcut?: string[];
}) {
  const pad = size === "sm" ? "px-3 py-1.5 text-[12.5px]" : "px-4 py-2.5 text-[13px]";
  const base = `inline-flex items-center justify-center gap-2 rounded-[9px] font-semibold tracking-[-0.01em] transition-all duration-150 ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? { background: C.accent, color: "#04201b", border: `1px solid ${C.accentDeep}`, ...sans }
      : variant === "outline"
        ? { background: C.panelRaise, color: C.text, border: `1px solid ${C.lineStrong}`, ...sans }
        : {
            background: "transparent",
            color: C.textSoft,
            border: "1px solid transparent",
            ...sans,
          };
  const hover =
    variant === "solid"
      ? "hover:brightness-110"
      : variant === "outline"
        ? "hover:bg-[#20252d]"
        : "hover:bg-[#1a1e24]";
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
      {shortcut && (
        <span className="ml-1 hidden sm:inline-flex">
          <KbdSeq keys={shortcut} />
        </span>
      )}
    </button>
  );
}

function StatusTag({ base, soft, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[6px] px-2 py-1 text-[11px] font-semibold"
      style={{ color: base, background: soft, border: `1px solid ${base}33`, ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

function MatchBar({ value }: { value: number }) {
  const tone = value >= 90 ? C.pos : C.info;
  return (
    <span className="block" aria-label={`Match ${value} procent`}>
      <span className="flex items-baseline justify-between">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: C.textFaint, ...mono }}
        >
          match
        </span>
        <span className="text-[13px] font-bold leading-none" style={{ color: tone, ...mono }}>
          {value}%
        </span>
      </span>
      <span
        className="mt-1 block h-1.5 w-full overflow-hidden rounded-[2px]"
        style={{ background: C.lineSoft }}
        aria-hidden="true"
      >
        <span
          className="block h-full rounded-[2px]"
          style={{
            width: `${value}%`,
            background: tone,
            transition: "width 0.7s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
    </span>
  );
}

function Kicker({
  children,
  tone = C.textMute,
  Icon,
}: {
  children: ReactNode;
  tone?: string;
  Icon?: LucideIcon;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em]"
      style={{ color: tone, ...mono }}
    >
      {Icon && <Icon size={12} aria-hidden="true" />}
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
      className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b pb-4"
      style={{ borderColor: C.line }}
    >
      <div className="min-w-0">
        <Kicker tone={C.accent} Icon={Terminal}>
          {code}
        </Kicker>
        <h1
          className="mt-1.5 text-[24px] font-semibold leading-tight tracking-[-0.02em] md:text-[28px]"
          style={{ color: C.text }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed" style={{ color: C.textMute }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

const NAV_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: Gauge,
  marktplaats: Search,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: Receipt,
  berichten: Receipt,
};
// Go-sneltoetsen (Linear-stijl: "G" dan letter)
const NAV_KEY: Record<ScreenKey, string> = {
  dashboard: "D",
  marktplaats: "M",
  opdracht: "O",
  verificatie: "V",
  acties: "A",
  facturen: "F",
  documenten: "C",
  berichten: "B",
};

// —————————————————————————————————————— Command-palette ——————————————————————————————————————
type Cmd = {
  id: string;
  label: string;
  hint: string;
  Icon: LucideIcon;
  keys?: string[];
  run: () => void;
};

function Palette({
  open,
  onClose,
  setScreen,
}: {
  open: boolean;
  onClose: () => void;
  setScreen: (s: ScreenKey) => void;
}) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  const commands = useMemo<Cmd[]>(() => {
    const nav: Cmd[] = SCREENS.map((s) => ({
      id: `nav-${s.key}`,
      label: `Ga naar ${s.label}`,
      hint: "Navigatie",
      Icon: NAV_ICON[s.key],
      keys: ["G", NAV_KEY[s.key]],
      run: () => {
        setScreen(s.key);
        onClose();
      },
    }));
    const acts: Cmd[] = [
      {
        id: "act-new-invoice",
        label: "Nieuwe factuur opstellen",
        hint: "Actie",
        Icon: Plus,
        run: () => {
          setScreen("facturen");
          onClose();
        },
      },
      {
        id: "act-renew-vog",
        label: "VOG vernieuwen",
        hint: "Actie",
        Icon: ShieldCheck,
        run: () => {
          setScreen("verificatie");
          onClose();
        },
      },
      {
        id: "act-matches",
        label: "Nieuwe matches bekijken",
        hint: "Actie",
        Icon: Briefcase,
        run: () => {
          setScreen("marktplaats");
          onClose();
        },
      },
    ];
    const opps: Cmd[] = OPDRACHTEN.map((o) => ({
      id: `opp-${o.id}`,
      label: o.titel,
      hint: `Opdracht · ${o.plaats}`,
      Icon: Briefcase,
      run: () => {
        setScreen("opdracht");
        onClose();
      },
    }));
    return [...nav, ...acts, ...opps];
  }, [onClose, setScreen]);

  const filtered = useMemo(() => {
    const n = q.toLowerCase().trim();
    if (!n) return commands;
    return commands.filter(
      (c) => c.label.toLowerCase().includes(n) || c.hint.toLowerCase().includes(n),
    );
  }, [q, commands]);

  useEffect(() => {
    setActive(0);
  }, [q, open]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[active]?.run();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="cb-overlay fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      style={{ background: "rgba(5,7,9,0.72)", backdropFilter: "blur(3px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Commandopalet"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Sluit commandopalet"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        className="cb-pop relative w-full max-w-xl overflow-hidden rounded-[14px]"
        style={{
          background: C.panel,
          border: `1px solid ${C.lineStrong}`,
          boxShadow: "0 40px 90px -20px rgba(0,0,0,0.8)",
        }}
        onKeyDown={onKeyDown}
      >
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <Command size={17} aria-hidden="true" style={{ color: C.accent }} />
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Typ een commando of zoek…"
            aria-label="Zoek een commando"
            className="w-full bg-transparent text-[15px] outline-none"
            style={{ color: C.text, ...sans }}
          />
          <Kbd>esc</Kbd>
        </div>
        <ul className="max-h-[46vh] overflow-y-auto py-2" role="listbox" aria-label="Commando's">
          {filtered.length === 0 ? (
            <li className="px-4 py-10 text-center">
              <Search
                size={22}
                aria-hidden="true"
                style={{ color: C.textFaint }}
                className="mx-auto"
              />
              <p className="mt-3 text-[13.5px] font-semibold" style={{ color: C.text }}>
                Geen commando voor “{q}”
              </p>
              <p className="mt-1 text-[12px]" style={{ color: C.textMute }}>
                Probeer een schermnaam of een actie.
              </p>
            </li>
          ) : (
            filtered.map((c, i) => {
              const on = i === active;
              return (
                <li key={c.id} role="option" aria-selected={on}>
                  <button
                    type="button"
                    onClick={() => c.run()}
                    onMouseMove={() => setActive(i)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left ${RING}`}
                    style={{ background: on ? C.accentSoft : "transparent", borderRadius: 9 }}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px]"
                      style={{
                        background: on ? C.accent + "22" : C.panelRaise,
                        color: on ? C.accent : C.textMute,
                      }}
                      aria-hidden="true"
                    >
                      <c.Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13.5px] font-medium"
                        style={{ color: C.text }}
                      >
                        {c.label}
                      </span>
                      <span
                        className="block truncate text-[11px]"
                        style={{ color: C.textMute, ...mono }}
                      >
                        {c.hint}
                      </span>
                    </span>
                    {c.keys && <KbdSeq keys={c.keys} />}
                    {on && (
                      <CornerDownLeft size={14} aria-hidden="true" style={{ color: C.accent }} />
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <div
          className="flex items-center gap-4 px-4 py-2.5 text-[11px]"
          style={{ borderTop: `1px solid ${C.line}`, color: C.textMute, ...mono }}
        >
          <span className="inline-flex items-center gap-1.5">
            <KbdSeq keys={["↑", "↓"]} /> navigeren
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↵</Kbd> kiezen
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5">
            <Kbd>esc</Kbd> sluiten
          </span>
        </div>
      </div>
    </div>
  );
}

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept513() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const active = OPDRACHTEN[0] as Opdracht;

  // ⌘K / Ctrl+K opent de palette overal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="relative min-h-[760px] w-full antialiased"
      style={{ ...sans, color: C.text, background: C.bg }}
    >
      <div className="mx-auto flex max-w-6xl">
        <Sidebar screen={screen} setScreen={setScreen} onPalette={() => setPaletteOpen(true)} />
        <div className="min-w-0 flex-1">
          <TopBar onPalette={() => setPaletteOpen(true)} />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="cb-fade px-4 pb-20 pt-5 sm:px-6 md:px-8">
            {screen === "dashboard" && (
              <Dashboard
                onOpen={() => setScreen("opdracht")}
                onMarkt={() => setScreen("marktplaats")}
                onActies={() => setScreen("acties")}
                onPalette={() => setPaletteOpen(true)}
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

      <Palette open={paletteOpen} onClose={() => setPaletteOpen(false)} setScreen={setScreen} />

      <style>{`
        @keyframes cbFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .cb-fade { animation: cbFade 0.3s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes cbOverlay { from { opacity: 0; } to { opacity: 1; } }
        .cb-overlay { animation: cbOverlay 0.18s ease both; }
        @keyframes cbPop { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: none; } }
        .cb-pop { animation: cbPop 0.22s cubic-bezier(0.22,1,0.36,1) both; }
        .cb-row { transition: background 0.13s ease; }
        .cb-row:hover { background: ${C.panelRaise}; }
        @media (prefers-reduced-motion: reduce) { .cb-fade, .cb-overlay, .cb-pop { animation: none !important; } .cb-row { transition: none !important; } }
      `}</style>
    </div>
  );
}

// —————————————————————————————————————— Sidebar ——————————————————————————————————————
function Sidebar({
  screen,
  setScreen,
  onPalette,
}: {
  screen: ScreenKey;
  setScreen: (s: ScreenKey) => void;
  onPalette: () => void;
}) {
  return (
    <aside
      className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col md:flex"
      style={{ background: C.panel, borderRight: `1px solid ${C.line}` }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-5"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-[9px]"
          style={{ background: C.accent, color: "#04201b" }}
          aria-hidden="true"
        >
          <Command size={17} />
        </span>
        <span>
          <span
            className="block text-[14px] font-bold leading-none tracking-[-0.01em]"
            style={{ color: C.text }}
          >
            Commandobrug
          </span>
          <span
            className="mt-1 block text-[10px] uppercase tracking-[0.14em]"
            style={{ color: C.textFaint, ...mono }}
          >
            keyboard-first
          </span>
        </span>
      </div>

      <div className="px-3 pt-4">
        <button
          type="button"
          onClick={onPalette}
          className={`flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-left ${RING}`}
          style={{ background: C.sink, border: `1px solid ${C.lineStrong}`, color: C.textMute }}
        >
          <Search size={14} aria-hidden="true" />
          <span className="flex-1 text-[12.5px]">Commando…</span>
          <KbdSeq keys={["⌘", "K"]} />
        </button>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1 overflow-y-auto px-3 py-4">
        <p
          className="px-2 pb-2 text-[9.5px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: C.textFaint, ...mono }}
        >
          Ga naar · G
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
                  className={`group flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[13px] font-medium transition-colors ${RING}`}
                  style={on ? { background: C.accentSoft, color: C.text } : { color: C.textSoft }}
                >
                  <Icon
                    size={15}
                    aria-hidden="true"
                    style={{ color: on ? C.accent : C.textMute }}
                  />
                  <span className="flex-1">{s.label}</span>
                  <span
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden="true"
                  >
                    <KbdSeq keys={["G", NAV_KEY[s.key]]} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        className="flex items-center gap-2.5 px-4 py-4"
        style={{ borderTop: `1px solid ${C.line}` }}
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
          style={{ background: C.accentSoft, color: C.accent, ...mono }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-semibold" style={{ color: C.text }}>
            {PROFIEL.naam}
          </span>
          <span className="flex items-center gap-1 text-[10px]" style={{ color: C.pos }}>
            <ShieldCheck size={10} aria-hidden="true" /> {PROFIEL.trust}
          </span>
        </span>
      </div>
    </aside>
  );
}

function TopBar({ onPalette }: { onPalette: () => void }) {
  return (
    <header
      className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 sm:px-6 md:px-8"
      style={{
        background: `${C.bg}f0`,
        borderBottom: `1px solid ${C.line}`,
        backdropFilter: "blur(8px)",
      }}
    >
      <button
        type="button"
        onClick={onPalette}
        className={`flex flex-1 items-center gap-2 rounded-[9px] px-3 py-2 text-left ${RING}`}
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <Search size={14} aria-hidden="true" style={{ color: C.textFaint }} />
        <span className="text-[12.5px]" style={{ color: C.textFaint }}>
          Zoek of voer een commando uit…
        </span>
        <span className="ml-auto">
          <KbdSeq keys={["⌘", "K"]} />
        </span>
      </button>
      <span
        className="hidden items-center gap-1.5 text-[11px] sm:inline-flex"
        style={{ color: C.textMute, ...mono }}
      >
        <Kbd>?</Kbd> sneltoetsen
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
      className="flex gap-1 overflow-x-auto px-4 py-2 md:hidden"
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
            className={`shrink-0 rounded-[7px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
            style={
              on
                ? { background: C.accent, color: "#04201b" }
                : { color: C.textSoft, background: C.sink }
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
  onPalette,
}: {
  onOpen: () => void;
  onMarkt: () => void;
  onActies: () => void;
  onPalette: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <ScreenHead
        code="~/dashboard"
        title={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}.`}
        sub="Alles is bereikbaar via het toetsenbord. Druk ⌘K om te beginnen."
        right={
          <Btn variant="outline" size="sm" onClick={onPalette} shortcut={["⌘", "K"]}>
            <Command size={13} aria-hidden="true" /> Commando
          </Btn>
        }
      />

      {/* Command-hint bar */}
      <Panel className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: C.textMute }}>
          <KbdSeq keys={["G", "M"]} /> marktplaats
        </span>
        <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: C.textMute }}>
          <KbdSeq keys={["G", "V"]} /> verificatie
        </span>
        <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: C.textMute }}>
          <KbdSeq keys={["G", "F"]} /> facturen
        </span>
        <span
          className="ml-auto inline-flex items-center gap-2 text-[12px]"
          style={{ color: C.accent }}
        >
          <KbdSeq keys={["⌘", "K"]} /> alle commando&apos;s
        </span>
      </Panel>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => {
          const tone = k.up ? C.pos : C.warn;
          return (
            <Panel key={k.label} className="p-4">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.textMute, ...mono }}
              >
                {k.label}
              </p>
              <p
                className="mt-2 text-[26px] font-bold leading-none tracking-[-0.02em]"
                style={{ color: C.text, ...mono }}
              >
                {k.value}
              </p>
              <p className="mt-2 text-[11.5px] font-bold" style={{ color: tone, ...mono }}>
                {k.up ? "▲" : "▼"} {k.trend}
              </p>
            </Panel>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Panel className="overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <Kicker tone={C.accent} Icon={Briefcase}>
              Aanbevolen matches
            </Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className={`inline-flex items-center gap-1.5 rounded-[6px] text-[11.5px] font-semibold ${RING}`}
              style={{ color: C.accent }}
            >
              Markt <KbdSeq keys={["G", "M"]} />
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={onOpen}
                  className={`cb-row flex w-full items-center gap-3 px-4 py-3 text-left ${RING}`}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <span className="w-24 shrink-0">
                    <MatchBar value={o.match} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14px] font-semibold"
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
                  </span>
                  <ChevronRight size={16} aria-hidden="true" style={{ color: C.textFaint }} />
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-4">
          <Panel className="p-5">
            <Kicker tone={C.pos} Icon={ShieldCheck}>
              Vertrouwenssaldo
            </Kicker>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[34px] font-bold leading-none tracking-[-0.02em]"
                style={{ color: C.text, ...mono }}
              >
                {ratio}%
              </span>
              <span className="text-[12px]" style={{ color: C.textMute }}>
                dossier op orde
              </span>
            </div>
            <div className="mt-3 flex gap-1" aria-hidden="true">
              {CREDENTIALS.map((c) => {
                const t = credTone(c.status);
                return (
                  <span
                    key={c.naam}
                    className="h-1.5 flex-1 rounded-[2px]"
                    style={{ background: c.status === "VERIFIED" ? C.pos : t.base + "55" }}
                  />
                );
              })}
            </div>
            <p className="mt-2.5 text-[11.5px]" style={{ color: C.textMute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd.
            </p>
          </Panel>

          <Panel className="p-5" as="article">
            <Kicker tone={C.warn} Icon={AlertTriangle}>
              Termijn nadert
            </Kicker>
            <h3 className="mt-2 text-[15px] font-semibold leading-snug" style={{ color: C.text }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.textSoft }}>
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
type Mode = "ok" | "loading";

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<Mode>("ok");
  const rows = useMemo(() => {
    const n = q.toLowerCase().trim();
    return OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    ).sort((a, b) => b.match - a.match);
  }, [q]);

  return (
    <div className="space-y-5">
      <ScreenHead
        code="~/marktplaats"
        title="Opdrachten die bij je passen"
        sub={`${rows.length} van ${OPDRACHTEN.length} opdrachten sluiten aan op je geverifieerde profiel.`}
      />

      <Panel className="flex items-center gap-2.5 p-2.5">
        <div
          className="flex flex-1 items-center gap-2 rounded-[8px] px-3 py-2"
          style={{ background: C.sink, border: `1px solid ${C.line}` }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.textFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten filteren"
            className="w-full bg-transparent text-[13px] outline-none"
            style={{ color: C.text }}
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Filter wissen"
              className={`flex h-5 w-5 items-center justify-center rounded-[5px] ${RING}`}
              style={{ color: C.textMute }}
            >
              <X size={13} aria-hidden="true" />
            </button>
          ) : (
            <Kbd>/</Kbd>
          )}
        </div>
        <Btn
          variant="outline"
          size="sm"
          onClick={() => setMode(mode === "loading" ? "ok" : "loading")}
        >
          {mode === "loading" ? "Lijst" : "Laadstaat"}
        </Btn>
      </Panel>

      {mode === "loading" ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="space-y-3 p-5">
                <div
                  className="h-4 w-2/3 animate-pulse rounded-[4px] motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
                <div
                  className="h-3 w-1/2 animate-pulse rounded-[4px] motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
              </Panel>
            </li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <Panel className="flex flex-col items-center px-6 py-16 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-[12px]"
            style={{ color: C.accent, background: C.accentSoft, border: `1px solid ${C.accent}33` }}
            aria-hidden="true"
          >
            <Search size={24} />
          </span>
          <p className="mt-4 text-[18px] font-semibold" style={{ color: C.text }}>
            Geen resultaat
          </p>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed" style={{ color: C.textSoft }}>
            Geen opdracht voor {q ? `“${q}”` : "je filter"}. Verruim je zoekopdracht.
          </p>
          <Btn variant="outline" className="mt-5" onClick={() => setQ("")}>
            <RotateCcw size={13} aria-hidden="true" /> Filter wissen
          </Btn>
        </Panel>
      ) : (
        <ul className="space-y-3">
          {rows.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
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
    <Panel as="article" className="overflow-hidden">
      <div className="flex items-start gap-4 p-4">
        <span className="w-28 shrink-0 pt-0.5">
          <MatchBar value={opdracht.match} />
          <span
            className="mt-2 inline-block rounded-[5px] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
            style={{
              color: strong ? C.pos : C.info,
              background: (strong ? C.pos : C.info) + "16",
              ...mono,
            }}
          >
            {strong ? "sterk" : "goed"}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 text-[10.5px]"
            style={{ color: C.textFaint, ...mono }}
          >
            <span>#{String(index + 1).padStart(2, "0")}</span>
            <span aria-hidden="true">·</span>
            <span>{opdracht.id}</span>
          </div>
          <h3
            className="mt-1 text-[16.5px] font-semibold leading-snug tracking-[-0.01em]"
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
                className="rounded-[5px] px-2 py-0.5 text-[11px] font-medium"
                style={{ background: C.sink, color: C.textSoft, border: `1px solid ${C.line}` }}
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
          <span className="text-[9.5px] uppercase tracking-[0.1em]" style={{ color: C.textFaint }}>
            per uur
          </span>
        </span>
      </div>
      <div
        className="flex flex-wrap items-center gap-2 px-4 py-2.5"
        style={{ borderTop: `1px solid ${C.lineSoft}`, background: C.sink }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 rounded-[6px] text-[12px] font-semibold ${RING}`}
          style={{ color: C.accent }}
        >
          {open ? <X size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" onClick={onOpen}>
            Openen <KbdSeq keys={["↵"]} />
          </Btn>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2"
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
            style={{ color: C.textSoft }}
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
  const tone = strong ? C.pos : C.info;
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur" },
    { l: "Omvang", v: opdracht.uren, s: "per week" },
    { l: "Aanvang", v: opdracht.start, s: "startdatum" },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel" },
  ];
  return (
    <div className="space-y-5">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={13} aria-hidden="true" /> Terug <Kbd>esc</Kbd>
      </Btn>

      <Panel className="overflow-hidden">
        <div className="p-6">
          <div
            className="flex items-center gap-2 text-[11px]"
            style={{ color: C.textFaint, ...mono }}
          >
            <span>{opdracht.id}</span>
            <span aria-hidden="true">·</span>
            <span className="font-bold uppercase tracking-[0.1em]" style={{ color: tone }}>
              {strong ? "sterke match" : "goede match"} {opdracht.match}%
            </span>
          </div>
          <h1
            className="mt-2 max-w-2xl text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] md:text-[30px]"
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
                className="rounded-[5px] px-2 py-0.5 text-[11px] font-medium"
                style={{ background: C.sink, color: C.textSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Btn variant="solid" shortcut={["R"]}>
              Reageren <ArrowRight size={14} aria-hidden="true" />
            </Btn>
            <Btn variant="outline" shortcut={["S"]}>
              Bewaren
            </Btn>
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
                style={{ color: C.textMute, ...mono }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-bold leading-none"
                style={{ color: C.text, ...mono }}
              >
                {m.v}
              </p>
              <p className="mt-1 text-[10.5px]" style={{ color: C.textFaint }}>
                {m.s}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-6">
        <Kicker tone={C.accent} Icon={ListChecks}>
          Motivering — navolgbaar, zonder verborgen score
        </Kicker>
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <RedenKolom
            titel="In je voordeel"
            tone={C.pos}
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
        code="~/verificatie"
        title="Vertrouwensregister"
        sub={`${verified} van ${CREDENTIALS.length} certificaten geverifieerd · ${PROFIEL.trust}.`}
        right={
          <div className="text-right">
            <p
              className="text-[30px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.text, ...mono }}
            >
              {ratio}%
            </p>
            <p
              className="text-[10px] uppercase tracking-[0.14em]"
              style={{ color: C.textMute, ...mono }}
            >
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
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${RING}`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]"
                    style={{ background: t.soft, color: t.base }}
                    aria-hidden="true"
                  >
                    <t.Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14px] font-semibold"
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
                      className="px-4 pb-4 sm:pl-16"
                      style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 12 }}
                    >
                      <span className="mb-2 inline-flex sm:hidden">
                        <StatusTag {...t} />
                      </span>
                      <p
                        className="max-w-xl text-[12.5px] leading-relaxed"
                        style={{ color: C.textSoft }}
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
    <div className="space-y-5">
      <ScreenHead
        code="~/acties"
        title="Wat vandaag je aandacht vraagt"
        sub="Op volgorde van urgentie — werk van boven naar beneden."
      />
      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.info;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Panel className="flex items-start gap-4 p-5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] text-[15px] font-bold"
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
                  <Kicker tone={tone} Icon={warn ? AlertTriangle : Clock}>
                    {warn ? "Urgent" : "Aanbevolen"}
                  </Kicker>
                  <h2
                    className="mt-1.5 text-[16px] font-semibold leading-snug"
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
  const [sel, setSel] = useState<string>(FACTUREN[0]?.nr ?? "");
  const totals = useMemo(() => {
    const sum = (status: string) =>
      FACTUREN.filter((f) => f.status === status).reduce((a, f) => a + parseEUR(f.bedrag), 0);
    return { betaald: sum("Betaald"), open: sum("Openstaand") };
  }, []);
  const selected = FACTUREN.find((f) => f.nr === sel) ?? FACTUREN[0];

  return (
    <div className="space-y-5">
      <ScreenHead
        code="~/facturen"
        title="Je facturen"
        sub="Selecteer een regel voor de details."
        right={
          <Btn variant="solid" size="sm" shortcut={["N"]}>
            <Plus size={13} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Panel className="p-4">
          <Kicker tone={C.pos} Icon={Check}>
            Betaald
          </Kicker>
          <p className="mt-2 text-[22px] font-bold leading-none" style={{ color: C.pos, ...mono }}>
            {eur0.format(totals.betaald)}
          </p>
        </Panel>
        <Panel className="p-4">
          <Kicker tone={C.warn} Icon={Clock}>
            Openstaand
          </Kicker>
          <p className="mt-2 text-[22px] font-bold leading-none" style={{ color: C.warn, ...mono }}>
            {eur0.format(totals.open)}
          </p>
        </Panel>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 440 }}>
              <caption className="sr-only">Overzicht van facturen</caption>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                  {["Nummer", "Klant", "Bedrag", "Status"].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`px-4 py-2.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] ${i === 2 ? "text-right" : ""}`}
                      style={{ color: C.textMute, ...mono }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FACTUREN.map((f) => {
                  const t = factuurTone(f.status);
                  const on = f.nr === sel;
                  return (
                    <tr
                      key={f.nr}
                      className={`cb-row cursor-pointer ${RING}`}
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
                        background: on ? C.accentSoft : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3 text-[12px]"
                        style={{ color: on ? C.accent : C.textSoft, ...mono }}
                      >
                        {f.nr}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: C.text }}>
                        {f.klant}
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

        {selected && (
          <Panel as="article" className="p-5">
            <Kicker tone={C.accent} Icon={Receipt}>
              Factuur
            </Kicker>
            <p className="mt-2 text-[20px] font-bold" style={{ color: C.text, ...mono }}>
              {selected.nr}
            </p>
            <div className="mt-4 space-y-2.5 text-[12.5px]">
              <Row label="Klant" value={selected.klant} />
              <Row label="Datum" value={selected.datum} mono />
              <Row label="Status">
                {(() => {
                  const t = factuurTone(selected.status);
                  return (
                    <span
                      className="inline-flex items-center gap-1.5 font-semibold"
                      style={{ color: t.base }}
                    >
                      <t.Icon size={12} aria-hidden="true" /> {t.label}
                    </span>
                  );
                })()}
              </Row>
            </div>
            <div className="my-4 h-px" style={{ background: C.line }} />
            <div className="flex items-baseline justify-between">
              <span
                className="text-[12px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.textMute, ...mono }}
              >
                Totaal
              </span>
              <span className="text-[20px] font-bold" style={{ color: C.text, ...mono }}>
                {selected.bedrag}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              <Btn variant="solid" size="sm" full>
                {selected.status === "Concept"
                  ? "Versturen"
                  : selected.status === "Openstaand"
                    ? "Herinnering"
                    : "Download"}
                <ArrowRight size={13} aria-hidden="true" />
              </Btn>
              <Btn variant="outline" size="sm">
                PDF
              </Btn>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  children,
  mono: isMono = false,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="shrink-0 text-[12px]" style={{ color: C.textMute }}>
        {label}
      </span>
      <span
        className="text-right text-[12.5px] font-semibold"
        style={{ color: C.text, ...(isMono ? mono : sans) }}
      >
        {children ?? value}
      </span>
    </div>
  );
}
