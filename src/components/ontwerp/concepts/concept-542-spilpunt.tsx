"use client";

// Concept 542 — "Spilpunt" · Command-palette-first / keyboard-cockpit.
// Een centraal commandopalet (⌘K) is de primaire navigatie: minimale chrome, alles per toets
// bereikbaar, kbd-chips overal, monospace-signaal en een strak, snel developer-tool-gevoel —
// maar voor zorg-ZZP. 2026-trends: command-first UX, keyboard-native cockpits, ultra-minimale
// chrome met dichte informatiedichtheid. Status altijd met label + icoon — nooit enkel kleur.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Check,
  ChevronRight,
  Clock,
  CornerDownLeft,
  FileText,
  ListChecks,
  MapPin,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Command,
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

// ————————————————————————————— Palet — near-black cockpit + elektrisch lime —————————————————————————————
const C = {
  bg: "#08090b",
  panel: "#0d0f12",
  panelUp: "#12151a",
  line: "#1c2027",
  lineSoft: "#15181d",

  accent: "#b6f14a",
  accentDim: "#8fc430",
  accentSoft: "rgba(182,241,74,0.12)",
  accentGlow: "rgba(182,241,74,0.28)",

  text: "#eef1f4",
  textSoft: "rgba(238,241,244,0.72)",
  textMute: "rgba(238,241,244,0.46)",
  textFaint: "rgba(238,241,244,0.28)",

  pos: "#5fd39a",
  posSoft: "rgba(95,211,154,0.14)",
  info: "#69b7ff",
  infoSoft: "rgba(105,183,255,0.14)",
  warn: "#f2c04b",
  warnSoft: "rgba(242,192,75,0.14)",
  neg: "#ff7a8f",
  negSoft: "rgba(255,122,143,0.14)",
};

const sans: CSSProperties = {
  fontFamily:
    "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const mono: CSSProperties = {
  fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, 'Roboto Mono', Menlo, monospace",
};
const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b6f14a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090b]";

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
        label: "Verloopt binnenkort",
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

const ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: Command,
  marktplaats: Search,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  documenten: FileText,
  facturen: Receipt,
  berichten: ListChecks,
  acties: ListChecks,
};

// ————————————————————————————— Primitives —————————————————————————————
function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      className="inline-flex min-w-[18px] items-center justify-center rounded-[5px] px-1.5 py-0.5 text-[10.5px] font-semibold leading-none"
      style={{
        ...mono,
        background: C.panelUp,
        color: C.textMute,
        border: `1px solid ${C.line}`,
        boxShadow: `0 1px 0 ${C.line}`,
      }}
    >
      {children}
    </kbd>
  );
}

function Panel({
  children,
  className = "",
  as: Tag = "div",
  raised = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "header" | "li";
  raised?: boolean;
}) {
  return (
    <Tag
      className={`rounded-[10px] ${className}`}
      style={{ background: raised ? C.panelUp : C.panel, border: `1px solid ${C.line}` }}
    >
      {children}
    </Tag>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md";
  full?: boolean;
};
function Btn({
  children,
  variant = "solid",
  size = "md",
  full = false,
  className = "",
  ...rest
}: BtnProps) {
  const base =
    "sp-btn inline-flex items-center justify-center gap-1.5 rounded-[7px] font-semibold transition-all";
  const sz = size === "sm" ? "px-3 py-1.5 text-[12.5px]" : "px-3.5 py-2 text-[13px]";
  const styles: Record<string, CSSProperties> = {
    solid: {
      background: C.accent,
      color: "#0a0d05",
      border: `1px solid ${C.accentDim}`,
    },
    outline: {
      background: "transparent",
      color: C.text,
      border: `1px solid ${C.line}`,
    },
    ghost: { background: "transparent", color: C.textSoft, border: "1px solid transparent" },
  };
  return (
    <button
      className={`${base} ${sz} ${full ? "w-full" : ""} ${RING} ${className}`}
      style={styles[variant]}
      {...rest}
    >
      {children}
    </button>
  );
}

function StatusPill({ tone }: { tone: Tone }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[6px] px-2 py-1 text-[11px] font-semibold"
      style={{ background: tone.soft, color: tone.base, border: `1px solid ${tone.base}33` }}
    >
      <tone.Icon size={12} aria-hidden="true" />
      {tone.label}
    </span>
  );
}

function Spark({ data, up }: { data: number[]; up: boolean }) {
  const w = 72;
  const h = 22;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 3) - 1.5;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={up ? C.accent : C.warn}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ————————————————————————————— Command-palet —————————————————————————————
type Cmd = {
  id: string;
  label: string;
  hint: string;
  group: "Navigatie" | "Acties";
  Icon: LucideIcon;
  keys?: string;
  run: () => void;
};

function Palet({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: Cmd[];
}) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return commands;
    return commands.filter(
      (c) => c.label.toLowerCase().includes(term) || c.hint.toLowerCase().includes(term),
    );
  }, [q, commands]);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    setIdx(0);
  }, [q]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const c = filtered[idx];
      if (c) c.run();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  const groups: Cmd["group"][] = ["Navigatie", "Acties"];

  return (
    <div
      className="sp-overlay fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      style={{ background: "rgba(4,5,7,0.66)", backdropFilter: "blur(3px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Commandopalet"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="sp-pop w-full max-w-[560px] overflow-hidden rounded-[14px]"
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          boxShadow: "0 40px 90px -20px rgba(0,0,0,0.8)",
        }}
        onKeyDown={onKey}
      >
        <div
          className="flex items-center gap-2.5 border-b px-4 py-3.5"
          style={{ borderColor: C.line }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.textMute }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Typ een commando of zoek een scherm…"
            aria-label="Commando zoeken"
            className="w-full bg-transparent text-[14px] outline-none"
            style={{ color: C.text, caretColor: C.accent }}
          />
          <Kbd>esc</Kbd>
        </div>

        <div className="max-h-[46vh] overflow-y-auto py-1.5" role="listbox" aria-label="Commando's">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="text-[13px] font-semibold" style={{ color: C.text }}>
                Geen commando&rsquo;s
              </div>
              <div className="mt-1 text-[12px]" style={{ color: C.textMute }}>
                Niets gevonden voor &ldquo;{q}&rdquo;.
              </div>
            </div>
          ) : (
            groups.map((g) => {
              const items = filtered.filter((c) => c.group === g);
              if (items.length === 0) return null;
              return (
                <div key={g} className="px-1.5 pb-1">
                  <div
                    className="px-2.5 pb-1 pt-2 text-[10.5px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: C.textFaint }}
                  >
                    {g}
                  </div>
                  {items.map((c) => {
                    const globalIdx = filtered.indexOf(c);
                    const on = globalIdx === idx;
                    return (
                      <button
                        key={c.id}
                        role="option"
                        aria-selected={on}
                        onMouseEnter={() => setIdx(globalIdx)}
                        onClick={() => c.run()}
                        className={`flex w-full items-center gap-3 rounded-[8px] px-2.5 py-2 text-left transition-colors ${RING}`}
                        style={{ background: on ? C.accentSoft : "transparent" }}
                      >
                        <span
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-[7px]"
                          style={{
                            background: on ? C.accent : C.panelUp,
                            border: `1px solid ${on ? C.accentDim : C.line}`,
                          }}
                        >
                          <c.Icon
                            size={14}
                            aria-hidden="true"
                            color={on ? "#0a0d05" : C.textSoft}
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div
                            className="truncate text-[13px] font-medium"
                            style={{ color: C.text }}
                          >
                            {c.label}
                          </div>
                          <div className="truncate text-[11px]" style={{ color: C.textMute }}>
                            {c.hint}
                          </div>
                        </div>
                        {c.keys && <Kbd>{c.keys}</Kbd>}
                        {on && (
                          <CornerDownLeft
                            size={14}
                            aria-hidden="true"
                            style={{ color: C.accent }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div
          className="flex items-center gap-4 border-t px-4 py-2.5 text-[11px]"
          style={{ borderColor: C.line, color: C.textMute }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigeren
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↵</Kbd> openen
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5">
            <Command size={11} aria-hidden="true" /> Spilpunt
          </span>
        </div>
      </div>
    </div>
  );
}

// ————————————————————————————— Chrome: rail + topbar —————————————————————————————
function Rail({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <aside
      className="hidden w-[60px] shrink-0 flex-col items-center gap-1 border-r py-3 md:flex"
      style={{ borderColor: C.line, background: C.panel }}
    >
      <span
        className="mb-2 grid h-9 w-9 place-items-center rounded-[9px]"
        style={{ background: C.accent }}
      >
        <Command size={17} color="#0a0d05" aria-hidden="true" />
      </span>
      <nav aria-label="Hoofdnavigatie" className="flex flex-col items-center gap-1">
        {SCREENS.map((s, i) => {
          const Icon = ICONS[s.key];
          const on = screen === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              aria-label={`${s.label} (toets ${i + 1})`}
              title={`${s.label} · ${i + 1}`}
              className={`sp-rail relative grid h-10 w-10 place-items-center rounded-[9px] transition-colors ${RING}`}
              style={{
                background: on ? C.accentSoft : "transparent",
                border: `1px solid ${on ? C.accent + "44" : "transparent"}`,
              }}
            >
              <Icon size={17} aria-hidden="true" style={{ color: on ? C.accent : C.textMute }} />
              <span
                className="absolute -bottom-0.5 -right-0.5 rounded-[4px] px-1 text-[8.5px] font-bold leading-none"
                style={{
                  ...mono,
                  background: C.panelUp,
                  color: C.textFaint,
                  border: `1px solid ${C.line}`,
                }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
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
      aria-label="Hoofdnavigatie (mobiel)"
      className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1 md:hidden"
    >
      {SCREENS.map((s) => {
        const Icon = ICONS[s.key];
        const on = screen === s.key;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-[7px] px-3 py-2 text-[12.5px] font-semibold transition-colors ${RING}`}
            style={{
              background: on ? C.accentSoft : C.panel,
              color: on ? C.accent : C.textMute,
              border: `1px solid ${on ? C.accent + "44" : C.line}`,
            }}
          >
            <Icon size={14} aria-hidden="true" />
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

function TopBar({ title, onOpenPalet }: { title: string; onOpenPalet: () => void }) {
  return (
    <header className="mb-4 flex items-center gap-3 border-b pb-3" style={{ borderColor: C.line }}>
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-[12px] font-medium" style={{ color: C.textFaint, ...mono }}>
          spilpunt/
        </span>
        <h1 className="truncate text-[15px] font-bold" style={{ color: C.text }}>
          {title}
        </h1>
      </div>
      <button
        onClick={onOpenPalet}
        aria-label="Open commandopalet"
        aria-keyshortcuts="Meta+K Control+K"
        className={`ml-auto inline-flex items-center gap-2 rounded-[8px] px-3 py-2 text-[12.5px] transition-colors ${RING}`}
        style={{ background: C.panel, color: C.textSoft, border: `1px solid ${C.line}` }}
      >
        <Search size={14} aria-hidden="true" style={{ color: C.textMute }} />
        <span className="hidden sm:inline">Zoek of spring naar…</span>
        <span className="ml-1 flex items-center gap-1">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>
      <span
        className="hidden items-center gap-1.5 rounded-[7px] px-2.5 py-2 text-[12px] font-semibold sm:inline-flex"
        style={{ background: C.panel, color: C.pos, border: `1px solid ${C.line}` }}
      >
        <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.initialen}
      </span>
    </header>
  );
}

// ————————————————————————————— Scherm: Dashboard —————————————————————————————
function Dashboard({
  onOpen,
  setScreen,
}: {
  onOpen: (id: string) => void;
  setScreen: (s: ScreenKey) => void;
}) {
  const top = OPDRACHTEN[0] as Opdracht;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ color: C.textMute }}>
                {k.label}
              </span>
              <Spark data={k.spark} up={k.up} />
            </div>
            <div className="mt-1.5 flex items-end justify-between">
              <span
                className="text-[21px] font-bold leading-none"
                style={{ ...mono, color: C.text }}
              >
                {k.value}
              </span>
              <span className="text-[11px] font-semibold" style={{ color: k.up ? C.pos : C.warn }}>
                {k.trend}
              </span>
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span
              className="text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.textFaint }}
            >
              Beste match
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[11px] font-bold"
              style={{ ...mono, background: C.accentSoft, color: C.accent }}
            >
              {top.match}%
            </span>
          </div>
          <div className="text-[16px] font-bold" style={{ color: C.text }}>
            {top.titel}
          </div>
          <div
            className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]"
            style={{ color: C.textMute }}
          >
            <span className="inline-flex items-center gap-1">
              <Briefcase size={12} aria-hidden="true" /> {top.opdrachtgever}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} aria-hidden="true" /> {top.plaats}
            </span>
            <span style={{ ...mono, color: C.textSoft }}>{top.tarief}</span>
          </div>
          <div className="mt-3 grid gap-1.5">
            {top.redenen.plus.slice(0, 2).map((r) => (
              <div
                key={r}
                className="flex items-center gap-2 text-[12.5px]"
                style={{ color: C.textSoft }}
              >
                <Check size={13} className="shrink-0" aria-hidden="true" style={{ color: C.pos }} />{" "}
                {r}
              </div>
            ))}
          </div>
          <div className="mt-3.5 flex items-center gap-2">
            <Btn variant="solid" size="sm" onClick={() => onOpen(top.id)}>
              Openen <ArrowRight size={13} aria-hidden="true" />
            </Btn>
            <Btn variant="outline" size="sm" onClick={() => setScreen("marktplaats")}>
              Marktplaats <Kbd>2</Kbd>
            </Btn>
          </div>
        </Panel>

        <Panel className="p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span
              className="text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.textFaint }}
            >
              Acties
            </span>
            <button
              onClick={() => setScreen("acties")}
              className={`inline-flex items-center gap-1 rounded-[6px] px-1.5 text-[11.5px] font-semibold ${RING}`}
              style={{ color: C.accent }}
            >
              alle <Kbd>6</Kbd>
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {ACTIES.map((a) => {
              const warn = a.urgentie === "warning";
              return (
                <div
                  key={a.titel}
                  className="rounded-[8px] p-2.5"
                  style={{
                    background: warn ? C.warnSoft : C.lineSoft,
                    border: `1px solid ${warn ? C.warn + "33" : C.line}`,
                  }}
                >
                  <div className="flex items-start gap-2">
                    {warn ? (
                      <AlertTriangle
                        size={13}
                        className="mt-0.5 shrink-0"
                        aria-hidden="true"
                        style={{ color: C.warn }}
                      />
                    ) : (
                      <ChevronRight
                        size={13}
                        className="mt-0.5 shrink-0"
                        aria-hidden="true"
                        style={{ color: C.info }}
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-semibold" style={{ color: C.text }}>
                        {a.titel}
                      </div>
                      <div
                        className="mt-0.5 text-[11px] leading-snug"
                        style={{ color: C.textMute }}
                      >
                        {a.detail}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ————————————————————————————— Scherm: Marktplaats —————————————————————————————
type DemoState = "normaal" | "laden" | "leeg" | "fout";

function Marktplaats({ onOpen }: { onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [demo, setDemo] = useState<DemoState>("normaal");

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return OPDRACHTEN;
    return OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(term) ||
        o.opdrachtgever.toLowerCase().includes(term) ||
        o.plaats.toLowerCase().includes(term) ||
        o.tags.some((t) => t.toLowerCase().includes(term)),
    );
  }, [q]);

  const empty = demo === "leeg" || (demo === "normaal" && results.length === 0);

  return (
    <div className="flex flex-col gap-3">
      <Panel className="p-3">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div
            className="flex flex-1 items-center gap-2 rounded-[8px] px-3 py-2"
            style={{ background: C.bg, border: `1px solid ${C.line}` }}
          >
            <Search size={15} aria-hidden="true" style={{ color: C.textMute }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="filter opdrachten…"
              aria-label="Filter opdrachten"
              className="w-full bg-transparent text-[13px] outline-none"
              style={{ ...mono, color: C.text, caretColor: C.accent }}
            />
            {q ? (
              <button
                onClick={() => setQ("")}
                aria-label="Filter wissen"
                className={`grid h-5 w-5 place-items-center rounded-[5px] ${RING}`}
                style={{ background: C.panelUp }}
              >
                <X size={12} aria-hidden="true" style={{ color: C.textSoft }} />
              </button>
            ) : (
              <span aria-hidden="true">
                <Kbd>/</Kbd>
              </span>
            )}
          </div>
          <span className="text-[12px]" style={{ ...mono, color: C.textMute }}>
            {demo === "normaal" && !empty ? `${results.length} treffers` : "marktplaats"}
          </span>
        </div>
      </Panel>

      {demo === "fout" ? (
        <Panel className="grid place-items-center p-10 text-center">
          <AlertTriangle size={26} aria-hidden="true" style={{ color: C.neg }} />
          <div className="mt-3 text-[14px] font-bold" style={{ color: C.text }}>
            Laden mislukt
          </div>
          <div className="mt-1 max-w-sm text-[12px]" style={{ color: C.textMute }}>
            De marktplaats kon niet worden opgehaald. Probeer het opnieuw.
          </div>
          <Btn variant="outline" size="sm" className="mt-4" onClick={() => setDemo("normaal")}>
            <RotateCcw size={13} aria-hidden="true" /> Opnieuw
          </Btn>
        </Panel>
      ) : demo === "laden" ? (
        <div className="grid gap-2.5">
          {[0, 1, 2].map((i) => (
            <Panel key={i} className="p-3.5">
              <div className="flex items-center gap-3">
                <div className="sp-skel h-9 w-9 rounded-[8px]" />
                <div className="flex-1 space-y-2">
                  <div className="sp-skel h-3 w-2/3 rounded" />
                  <div className="sp-skel h-2.5 w-1/3 rounded" />
                </div>
                <div className="sp-skel h-7 w-16 rounded-[7px]" />
              </div>
            </Panel>
          ))}
        </div>
      ) : empty ? (
        <Panel className="grid place-items-center p-10 text-center">
          <span
            className="grid h-12 w-12 place-items-center rounded-[10px]"
            style={{ background: C.accentSoft, border: `1px solid ${C.accent}33` }}
          >
            <Search size={20} aria-hidden="true" style={{ color: C.accent }} />
          </span>
          <div className="mt-3 text-[14px] font-bold" style={{ color: C.text }}>
            Geen treffers
          </div>
          <div className="mt-1 max-w-sm text-[12px]" style={{ color: C.textMute }}>
            Niets gevonden voor &ldquo;{q}&rdquo;. Verruim je filter.
          </div>
          <Btn variant="outline" size="sm" className="mt-4" onClick={() => setQ("")}>
            Filter wissen
          </Btn>
        </Panel>
      ) : (
        <div className="grid gap-2.5">
          {results.map((o) => (
            <OpdrachtRij key={o.id} o={o} onOpen={onOpen} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <span
          className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
          style={{ color: C.textFaint }}
        >
          Demo-staat
        </span>
        {(["normaal", "laden", "leeg", "fout"] as DemoState[]).map((d) => (
          <button
            key={d}
            onClick={() => setDemo(d)}
            aria-pressed={demo === d}
            className={`rounded-[6px] px-2.5 py-1 text-[11.5px] font-semibold capitalize transition-colors ${RING}`}
            style={{
              ...mono,
              background: demo === d ? C.accentSoft : C.panel,
              color: demo === d ? C.accent : C.textMute,
              border: `1px solid ${demo === d ? C.accent + "44" : C.line}`,
            }}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

function OpdrachtRij({ o, onOpen }: { o: Opdracht; onOpen: (id: string) => void }) {
  return (
    <Panel as="article" className="sp-row p-3.5">
      <div className="flex items-center gap-3.5">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[9px] text-[13px] font-bold"
          style={{
            ...mono,
            background: C.accentSoft,
            color: C.accent,
            border: `1px solid ${C.accent}33`,
          }}
        >
          {o.match}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[14px] font-bold" style={{ color: C.text }}>
                {o.titel}
              </h3>
              <div
                className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[11.5px]"
                style={{ color: C.textMute }}
              >
                <span className="inline-flex items-center gap-1">
                  <Briefcase size={11} aria-hidden="true" /> {o.opdrachtgever}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={11} aria-hidden="true" /> {o.plaats}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[13px] font-bold" style={{ ...mono, color: C.text }}>
                {o.tarief}
              </div>
              <div className="text-[10.5px]" style={{ color: C.textMute }}>
                {o.uren}
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {o.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-[5px] px-2 py-0.5 text-[10.5px] font-medium"
                  style={{
                    background: C.lineSoft,
                    color: C.textSoft,
                    border: `1px solid ${C.line}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
            <button
              onClick={() => onOpen(o.id)}
              className={`sp-open ml-auto inline-flex items-center gap-1 rounded-[6px] px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${RING}`}
              style={{ background: C.panelUp, color: C.text, border: `1px solid ${C.line}` }}
            >
              Openen <ChevronRight size={12} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ————————————————————————————— Scherm: Opdracht-detail —————————————————————————————
function OpdrachtDetail({ o, onBack }: { o: Opdracht; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={onBack}
        className={`inline-flex w-fit items-center gap-1.5 rounded-[7px] px-2.5 py-1.5 text-[12px] font-semibold ${RING}`}
        style={{ ...mono, background: C.panel, color: C.textSoft, border: `1px solid ${C.line}` }}
      >
        <Kbd>esc</Kbd> terug
      </button>

      <Panel className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold leading-tight" style={{ color: C.text }}>
              {o.titel}
            </h2>
            <div
              className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]"
              style={{ color: C.textMute }}
            >
              <span className="inline-flex items-center gap-1">
                <Briefcase size={12} aria-hidden="true" /> {o.opdrachtgever}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} aria-hidden="true" /> {o.plaats}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={12} aria-hidden="true" /> {o.uren}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[13px] font-bold" style={{ ...mono, color: C.accent }}>
              {o.match}% match
            </div>
            <div className="text-[15px] font-bold" style={{ ...mono, color: C.text }}>
              {o.tarief}
            </div>
            <div className="text-[11px]" style={{ color: C.textMute }}>
              Start {o.start}
            </div>
          </div>
        </div>
        <div className="mt-3.5 flex items-center gap-2">
          <Btn variant="solid" size="sm">
            Reageren <Kbd>↵</Kbd>
          </Btn>
          <Btn variant="outline" size="sm">
            Bewaren
          </Btn>
        </div>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel className="p-4">
          <div className="mb-2.5 flex items-center gap-2">
            <Check size={14} aria-hidden="true" style={{ color: C.pos }} />
            <h3 className="text-[13px] font-bold" style={{ color: C.text }}>
              Waarom dit past
            </h3>
          </div>
          <ul className="flex flex-col gap-1.5">
            {o.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 rounded-[7px] px-2.5 py-2 text-[12.5px]"
                style={{ background: C.posSoft, color: C.textSoft }}
              >
                <Check
                  size={13}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                  style={{ color: C.pos }}
                />{" "}
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-4">
          <div className="mb-2.5 flex items-center gap-2">
            <AlertTriangle size={14} aria-hidden="true" style={{ color: C.warn }} />
            <h3 className="text-[13px] font-bold" style={{ color: C.text }}>
              Let op
            </h3>
          </div>
          <ul className="flex flex-col gap-1.5">
            {o.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 rounded-[7px] px-2.5 py-2 text-[12.5px]"
                style={{ background: C.warnSoft, color: C.textSoft }}
              >
                <AlertTriangle
                  size={13}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                  style={{ color: C.warn }}
                />{" "}
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

// ————————————————————————————— Scherm: Verificatie —————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="flex flex-col gap-3">
      <Panel className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} aria-hidden="true" style={{ color: C.pos }} />
              <h2 className="text-[14px] font-bold" style={{ color: C.text }}>
                Vertrouwensniveau: {PROFIEL.trust}
              </h2>
            </div>
            <p className="mt-1 text-[12px]" style={{ color: C.textMute }}>
              {verified}/{CREDENTIALS.length} certificaten geverifieerd.
            </p>
          </div>
          <div
            className="h-2 w-40 overflow-hidden rounded-full"
            style={{ background: C.bg, border: `1px solid ${C.line}` }}
            role="img"
            aria-label={`${verified} van ${CREDENTIALS.length} geverifieerd`}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${(verified / CREDENTIALS.length) * 100}%`, background: C.accent }}
            />
          </div>
        </div>
      </Panel>

      <div className="grid gap-2.5">
        {CREDENTIALS.map((c) => {
          const tone = credTone(c.status);
          const on = open === c.naam;
          return (
            <Panel key={c.naam} className="overflow-hidden p-0">
              <button
                onClick={() => setOpen(on ? null : c.naam)}
                aria-expanded={on}
                className={`flex w-full items-center gap-3 p-3.5 text-left ${RING}`}
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px]"
                  style={{ background: tone.soft, border: `1px solid ${tone.base}33` }}
                >
                  <tone.Icon size={16} aria-hidden="true" style={{ color: tone.base }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold" style={{ color: C.text }}>
                    {c.naam}
                  </div>
                  <div className="truncate text-[11.5px]" style={{ color: C.textMute }}>
                    {c.detail}
                  </div>
                </div>
                <StatusPill tone={tone} />
                <ChevronRight
                  size={15}
                  aria-hidden="true"
                  className="shrink-0 transition-transform"
                  style={{ color: C.textMute, transform: on ? "rotate(90deg)" : "none" }}
                />
              </button>
              {on && (
                <div className="border-t px-3.5 pb-3.5 pt-3" style={{ borderColor: C.line }}>
                  <p className="text-[12px] leading-relaxed" style={{ color: C.textSoft }}>
                    {tone.alarm
                      ? "Dit certificaat vraagt actie. Werk het bij zodat je vertrouwensniveau hoog blijft en je zichtbaar blijft voor passende opdrachten."
                      : "Dit certificaat is in orde. Je hoeft nu niets te doen; we waarschuwen je ruim voordat het verloopt."}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    {tone.alarm ? (
                      <Btn variant="solid" size="sm">
                        {c.status === "REJECTED" ? "Opnieuw indienen" : "Vernieuwen"}
                        <ArrowRight size={13} aria-hidden="true" />
                      </Btn>
                    ) : (
                      <Btn variant="outline" size="sm">
                        Document bekijken
                      </Btn>
                    )}
                    <Btn variant="ghost" size="sm">
                      Geschiedenis
                    </Btn>
                  </div>
                </div>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

// ————————————————————————————— Scherm: Acties —————————————————————————————
function Acties({ setScreen }: { setScreen: (s: ScreenKey) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <Panel className="p-4">
        <div className="flex items-center gap-2">
          <ListChecks size={16} aria-hidden="true" style={{ color: C.accent }} />
          <h2 className="text-[14px] font-bold" style={{ color: C.text }}>
            Wat vraagt nu je aandacht
          </h2>
        </div>
        <p className="mt-1 text-[12px]" style={{ color: C.textMute }}>
          Op volgorde van urgentie. Eén beslissing per keer.
        </p>
      </Panel>

      <div className="flex flex-col gap-2.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn
            ? { base: C.warn, soft: C.warnSoft, Icon: AlertTriangle }
            : { base: C.info, soft: C.infoSoft, Icon: ChevronRight };
          return (
            <Panel key={a.titel} as="article" className="p-3.5" raised={warn}>
              <div className="flex items-start gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-[9px]"
                  style={{ background: tone.soft, border: `1px solid ${tone.base}33` }}
                >
                  <tone.Icon size={17} aria-hidden="true" style={{ color: tone.base }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-[5px] px-1.5 py-0.5 text-[10px] font-bold uppercase"
                      style={{ ...mono, background: tone.soft, color: tone.base }}
                    >
                      {warn ? "urgent" : `#${i + 1}`}
                    </span>
                    <h3 className="text-[13.5px] font-bold" style={{ color: C.text }}>
                      {a.titel}
                    </h3>
                  </div>
                  <p className="mt-1 text-[12px] leading-snug" style={{ color: C.textMute }}>
                    {a.detail}
                  </p>
                  <div className="mt-2.5">
                    <Btn
                      variant={warn ? "solid" : "outline"}
                      size="sm"
                      onClick={() => setScreen(warn ? "verificatie" : "facturen")}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

// ————————————————————————————— Scherm: Facturen —————————————————————————————
function Facturen() {
  const [sel, setSel] = useState<string>(FACTUREN[0]?.nr ?? "");
  const active = (FACTUREN.find((f) => f.nr === sel) ?? FACTUREN[0]) as (typeof FACTUREN)[number];
  return (
    <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
      <Panel className="overflow-hidden p-0">
        <div className="border-b px-4 py-3" style={{ borderColor: C.line }}>
          <h2 className="text-[13px] font-bold" style={{ color: C.text }}>
            Facturen
          </h2>
          <p className="text-[11.5px]" style={{ color: C.textMute }}>
            {FACTUREN.length} facturen · selecteer voor details
          </p>
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const tone = factuurTone(f.status);
            const on = f.nr === sel;
            return (
              <li key={f.nr}>
                <button
                  onClick={() => setSel(f.nr)}
                  aria-current={on ? "true" : undefined}
                  className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors ${RING}`}
                  style={{ borderColor: C.line, background: on ? C.accentSoft : "transparent" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold" style={{ ...mono, color: C.text }}>
                      {f.nr}
                    </div>
                    <div className="truncate text-[11px]" style={{ color: C.textMute }}>
                      {f.klant} · {f.datum}
                    </div>
                  </div>
                  <div className="text-[13px] font-bold" style={{ ...mono, color: C.text }}>
                    {f.bedrag}
                  </div>
                  <span
                    className="inline-flex items-center gap-1 rounded-[5px] px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{ background: tone.soft, color: tone.base }}
                  >
                    <tone.Icon size={10} aria-hidden="true" /> {tone.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel className="h-fit p-4" raised>
        <div
          className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
          style={{ color: C.textFaint }}
        >
          Factuurdetail
        </div>
        <div className="mt-1 text-[18px] font-bold" style={{ ...mono, color: C.text }}>
          {active.nr}
        </div>
        <div className="mt-3.5 flex flex-col gap-2 text-[12.5px]">
          <Row label="Klant" value={active.klant} />
          <Row label="Datum" value={active.datum} />
          <Row label="Status">
            {(() => {
              const t = factuurTone(active.status);
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
        <div className="my-3.5 h-px" style={{ background: C.line }} />
        <div className="flex items-baseline justify-between">
          <span
            className="text-[11px] font-bold uppercase tracking-[0.12em]"
            style={{ color: C.textMute }}
          >
            Totaal
          </span>
          <span className="text-[20px] font-bold" style={{ ...mono, color: C.text }}>
            {active.bedrag}
          </span>
        </div>
        <div className="mt-3.5 flex gap-2">
          <Btn variant="solid" size="sm" full>
            {active.status === "Concept"
              ? "Versturen"
              : active.status === "Openstaand"
                ? "Herinnering"
                : "Download"}
            <ArrowRight size={13} aria-hidden="true" />
          </Btn>
          <Btn variant="outline" size="sm">
            PDF
          </Btn>
        </div>
      </Panel>
    </div>
  );
}

function Row({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="shrink-0 text-[12px]" style={{ color: C.textMute }}>
        {label}
      </span>
      <span className="text-right text-[12.5px] font-semibold" style={{ color: C.text }}>
        {children ?? value}
      </span>
    </div>
  );
}

// ————————————————————————————— Root —————————————————————————————
export function Concept542() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [selId, setSelId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const [palet, setPalet] = useState(false);
  const active = OPDRACHTEN.find((o) => o.id === selId) ?? (OPDRACHTEN[0] as Opdracht);

  const openOpdracht = useCallback((id: string) => {
    setSelId(id);
    setScreen("opdracht");
  }, []);

  const goto = useCallback((s: ScreenKey) => {
    setScreen(s);
    setPalet(false);
  }, []);

  // Toetsenbord-cockpit: ⌘K / Ctrl+K opent het palet; cijfers 1–6 springen naar een scherm.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalet((p) => !p);
        return;
      }
      if (!palet && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= SCREENS.length) {
          e.preventDefault();
          const target = SCREENS[n - 1];
          if (target) setScreen(target.key);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [palet]);

  const commands: Cmd[] = useMemo(() => {
    const first = OPDRACHTEN[0] as Opdracht;
    const nav: Cmd[] = SCREENS.map((s, i) => ({
      id: `nav-${s.key}`,
      label: `Ga naar ${s.label}`,
      hint: "Navigatie · scherm openen",
      group: "Navigatie",
      Icon: ICONS[s.key],
      keys: String(i + 1),
      run: () => goto(s.key),
    }));
    const acties: Cmd[] = [
      {
        id: "act-marktplaats",
        label: "Zoek nieuwe opdracht",
        hint: "Open de marktplaats en filter",
        group: "Acties",
        Icon: Search,
        run: () => goto("marktplaats"),
      },
      {
        id: "act-vog",
        label: "VOG vernieuwen",
        hint: "Certificaat dat binnenkort verloopt",
        group: "Acties",
        Icon: AlertTriangle,
        run: () => goto("verificatie"),
      },
      {
        id: "act-factuur",
        label: "Herinnering sturen",
        hint: "Openstaande factuur opvolgen",
        group: "Acties",
        Icon: Receipt,
        run: () => goto("facturen"),
      },
      {
        id: "act-top",
        label: `Open beste match — ${first.titel}`,
        hint: `${first.match}% match · ${first.opdrachtgever}`,
        group: "Acties",
        Icon: Briefcase,
        run: () => {
          openOpdracht(first.id);
          setPalet(false);
        },
      },
    ];
    return [...nav, ...acties];
  }, [goto, openOpdracht]);

  const title = SCREENS.find((s) => s.key === screen)?.label ?? "Werkplek";

  return (
    <div
      className="relative flex min-h-[760px] w-full overflow-hidden antialiased"
      style={{ ...sans, color: C.text, background: C.bg }}
    >
      <Rail screen={screen} setScreen={setScreen} />
      <div className="min-w-0 flex-1 p-3 sm:p-4 md:p-6">
        <div className="mx-auto max-w-5xl">
          <TopBar title={title} onOpenPalet={() => setPalet(true)} />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="sp-fade">
            {screen === "dashboard" && <Dashboard onOpen={openOpdracht} setScreen={setScreen} />}
            {screen === "marktplaats" && <Marktplaats onOpen={openOpdracht} />}
            {screen === "opdracht" && (
              <OpdrachtDetail o={active} onBack={() => setScreen("marktplaats")} />
            )}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties setScreen={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </main>
          <footer
            className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3 text-[11px]"
            style={{ borderColor: C.line, color: C.textMute }}
          >
            <span className="inline-flex items-center gap-1.5">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd> commandopalet
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Kbd>1</Kbd>–<Kbd>6</Kbd> spring naar scherm
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5">
              <span style={{ ...mono }}>{PROFIEL.rol}</span>
            </span>
          </footer>
        </div>
      </div>

      <Palet open={palet} onClose={() => setPalet(false)} commands={commands} />

      <style>{`
        .sp-btn:hover { filter: brightness(1.08); }
        .sp-rail:hover { background: ${C.lineSoft}; }
        .sp-row:hover { border-color: ${C.accent}44; }
        .sp-open:hover { background: ${C.accentSoft}; color: ${C.accent}; border-color: ${C.accent}44; }
        .sp-fade { animation: spFade 0.28s ease; }
        @keyframes spFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .sp-overlay { animation: spOverlay 0.16s ease; }
        @keyframes spOverlay { from { opacity: 0; } to { opacity: 1; } }
        .sp-pop { animation: spPop 0.18s cubic-bezier(0.22,0.61,0.36,1); }
        @keyframes spPop { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: none; } }
        .sp-skel { position: relative; overflow: hidden; background: ${C.lineSoft}; }
        .sp-skel::after {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          animation: spShine 1.3s infinite;
        }
        @keyframes spShine { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
        @media (prefers-reduced-motion: reduce) {
          .sp-fade, .sp-overlay, .sp-pop { animation: none; }
          .sp-skel::after { animation: none; }
          * { transition: none !important; }
        }
      `}</style>
    </div>
  );
}
