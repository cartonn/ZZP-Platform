"use client";

// Concept 325 — "Kommando" · Keyboard-first CLI-workspace.
// Powergebruikers die dagelijks gevoelige documenten, verificaties en matches beheren, willen
// snelheid zonder muis: één commando-palet (⌘K) is de spil — typ, filter, spring. Alles voelt
// als een terminal, met zichtbare sneltoetsen en een statusregel die precies toont waar je bent
// en wat er speelt. Minder klikken, meer flow — de complexiteit verdwijnt achter het prompt.
// Fonts: --font-lab-geist-mono (UI) + --font-lab-plex-mono (data-accent).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Command as CommandIcon,
  Search,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  MapPin,
  Coins,
  CalendarDays,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Bell,
  Send,
  RefreshCw,
  LayoutDashboard,
  Store,
  ClipboardList,
  BadgeCheck,
  ListTodo,
  Receipt,
  ChevronRight,
  Zap,
  Circle,
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

/* ---------------------------------------------------------------------------
   Terminal-palet — near-black met één groene accent (#3ee08f). Lichte grijstinten
   op near-black houden ≥ 4.5:1 voor bodytekst. Amber/rood alleen voor status,
   nooit als enige signaal (altijd label + icoon).
--------------------------------------------------------------------------- */
const C = {
  bg: "#0b0e0f",
  panel: "#10151a",
  panelSoft: "#0e1317",
  chip: "#151c22",
  border: "#1d262c",
  borderSoft: "#161d23",
  accent: "#3ee08f",
  accentDim: "#1f5a3d",
  textMain: "#d8e0da",
  textDim: "#93a099",
  textFaint: "#5c6a63",
  warn: "#f5b642",
  err: "#ff6b6b",
  info: "#68b6ff",
};

const MONO = "var(--font-lab-geist-mono), ui-monospace, monospace";
const DATA = "var(--font-lab-plex-mono), var(--font-lab-geist-mono), monospace";

/* ------------------------------ Screen meta ------------------------------ */
type ScreenMeta = { icon: LucideIcon; chord: string; path: string };
const SCREEN_META: Record<ScreenKey, ScreenMeta> = {
  dashboard: { icon: LayoutDashboard, chord: "d", path: "~/dashboard" },
  marktplaats: { icon: Store, chord: "m", path: "~/marktplaats" },
  opdracht: { icon: ClipboardList, chord: "o", path: "~/opdracht" },
  verificatie: { icon: BadgeCheck, chord: "v", path: "~/verificatie" },
  acties: { icon: ListTodo, chord: "a", path: "~/acties" },
  facturen: { icon: Receipt, chord: "f", path: "~/facturen" },
  documenten: { icon: ClipboardList, chord: "x", path: "~/documenten" },
  berichten: { icon: Bell, chord: "b", path: "~/berichten" },
};

/* --------------------------- Credential status --------------------------- */
type CredMeta = { label: string; icon: LucideIcon; color: string; glyph: string };
const CRED_META: Record<CredStatus, CredMeta> = {
  VERIFIED: { label: "Geverifieerd", icon: ShieldCheck, color: C.accent, glyph: "ok" },
  SUBMITTED: { label: "In beoordeling", icon: Clock, color: C.info, glyph: "wait" },
  EXPIRING: { label: "Verloopt binnenkort", icon: AlertTriangle, color: C.warn, glyph: "warn" },
  REJECTED: { label: "Afgewezen", icon: XCircle, color: C.err, glyph: "fail" },
};

/* -------------------------------- Helpers -------------------------------- */
function parseEuro(s: string): number {
  const digits = s.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}
function formatEuro(n: number): string {
  return "€ " + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/* ------------------------------ Kbd chip --------------------------------- */
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-flex min-w-[1.4rem] items-center justify-center rounded px-1.5 py-0.5 text-[10.5px] leading-none"
      style={{
        fontFamily: MONO,
        background: C.chip,
        border: `1px solid ${C.border}`,
        color: C.textDim,
        boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.4)",
      }}
    >
      {children}
    </kbd>
  );
}

/* ------------------------------ Sparkline -------------------------------- */
function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const w = 96;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const stroke = up ? C.accent : C.warn;
  const last = pts[pts.length - 1]!.split(",");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="overflow-visible"
      aria-hidden="true"
      role="img"
    >
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r={1.8} fill={stroke} />
    </svg>
  );
}

/* -------------------------------- Panel ---------------------------------- */
function Panel({
  title,
  meta,
  children,
  className,
}: {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg ${className ?? ""}`}
      style={{ background: C.panel, border: `1px solid ${C.border}` }}
    >
      <header
        className="flex items-center justify-between gap-2 px-3.5 py-2"
        style={{ borderBottom: `1px solid ${C.borderSoft}` }}
      >
        <span className="truncate text-[12px]" style={{ fontFamily: MONO, color: C.accent }}>
          {title}
        </span>
        {meta ? (
          <span className="shrink-0 text-[11px]" style={{ fontFamily: MONO, color: C.textFaint }}>
            {meta}
          </span>
        ) : null}
      </header>
      <div className="p-3.5">{children}</div>
    </section>
  );
}

/* --------------------------- Credential badge ---------------------------- */
function CredBadge({ status }: { status: CredStatus }) {
  const m = CRED_META[status];
  const Icon = m.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px]"
      style={{
        fontFamily: MONO,
        color: m.color,
        background: `${m.color}14`,
        border: `1px solid ${m.color}33`,
      }}
    >
      <Icon size={12} aria-hidden="true" />
      <span>{m.label}</span>
    </span>
  );
}

/* ---------------------------- Skeleton block ----------------------------- */
function Skeleton({ h = 60 }: { h?: number }) {
  return (
    <div
      className="animate-pulse rounded"
      style={{ height: h, background: C.borderSoft, border: `1px solid ${C.border}` }}
      aria-hidden="true"
    />
  );
}

/* ========================================================================= */
/*                               Command type                                */
/* ========================================================================= */
type Command = {
  id: string;
  label: string;
  group: "Navigatie" | "Acties";
  hint?: string;
  keywords: string;
  icon: LucideIcon;
  run: () => void;
};

/* ========================================================================= */
/*                                Component                                  */
/* ========================================================================= */
export function Concept325() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [selectedOpdracht, setSelectedOpdracht] = useState<string>(OPDRACHTEN[0]!.id);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingG, setPendingG] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(OPDRACHTEN[0]!.id);
  const [log, setLog] = useState<string[]>(["sessie gestart · kommando gereed"]);

  const pushLog = useCallback((msg: string) => {
    setLog((prev) => [msg, ...prev].slice(0, 6));
  }, []);

  const go = useCallback(
    (s: ScreenKey) => {
      setScreen(s);
      setPaletteOpen(false);
      pushLog(`cd ${SCREEN_META[s].path}`);
    },
    [pushLog],
  );

  const openOpdracht = useCallback(
    (id: string) => {
      setSelectedOpdracht(id);
      setScreen("opdracht");
      setPaletteOpen(false);
      pushLog(`open opdracht ${id}`);
    },
    [pushLog],
  );

  /* Skeleton bij scherm-wissel (deterministisch, korte tick). */
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 260);
    return () => clearTimeout(t);
  }, [screen]);

  /* Globale keyboard-listener — met opruimen in de return (geen leak). */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const typing = el?.tagName === "INPUT" || el?.tagName === "TEXTAREA";
      const k = e.key.toLowerCase();

      if ((e.metaKey || e.ctrlKey) && k === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (paletteOpen) return;
      if (typing) return;

      if (e.key === "/") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (k === "g") {
        setPendingG(true);
        return;
      }
      if (pendingG) {
        const entry = (Object.keys(SCREEN_META) as ScreenKey[]).find(
          (s) => SCREEN_META[s].chord === k && SCREENS.some((sc) => sc.key === s),
        );
        if (entry) go(entry);
        setPendingG(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, pendingG, go]);

  /* Reset chord-indicator na korte tijd. */
  useEffect(() => {
    if (!pendingG) return;
    const t = setTimeout(() => setPendingG(false), 1200);
    return () => clearTimeout(t);
  }, [pendingG]);

  /* Commando-lijst. */
  const commands = useMemo<Command[]>(() => {
    const nav: Command[] = SCREENS.map((s) => ({
      id: `nav-${s.key}`,
      label: `Ga naar ${s.label}`,
      group: "Navigatie",
      hint: `g ${SCREEN_META[s.key].chord}`,
      keywords: `${s.label} ${s.key} ga navigeer`,
      icon: SCREEN_META[s.key].icon,
      run: () => go(s.key),
    }));
    const actions: Command[] = [
      {
        id: "act-vog",
        label: "VOG vernieuwen",
        group: "Acties",
        keywords: "vog verklaring gedrag verificatie vernieuw certificaat",
        icon: RefreshCw,
        run: () => {
          setScreen("verificatie");
          setPaletteOpen(false);
          pushLog("run vog:vernieuw → aanvraag klaargezet");
        },
      },
      {
        id: "act-herinnering",
        label: "Herinnering sturen · FAC-2025-118",
        group: "Acties",
        keywords: "factuur herinnering openstaand betaling stuur mail",
        icon: Send,
        run: () => {
          setScreen("facturen");
          setPaletteOpen(false);
          pushLog("run factuur:herinner FAC-2025-118 → verstuurd");
        },
      },
      {
        id: "act-match",
        label: "Bekijk nieuwe matches",
        group: "Acties",
        keywords: "match marktplaats opdracht reageer nieuw",
        icon: Zap,
        run: () => go("marktplaats"),
      },
      {
        id: "act-open-opd",
        label: `Open ${OPDRACHTEN[0]!.titel}`,
        group: "Acties",
        keywords: `opdracht ${OPDRACHTEN[0]!.titel} ${OPDRACHTEN[0]!.opdrachtgever} detail`,
        icon: ClipboardList,
        run: () => openOpdracht(OPDRACHTEN[0]!.id),
      },
    ];
    return [...nav, ...actions];
  }, [go, openOpdracht, pushLog]);

  const currentOpdracht: Opdracht =
    OPDRACHTEN.find((o) => o.id === selectedOpdracht) ?? OPDRACHTEN[0]!;

  const factuurTotalen = useMemo(() => {
    let betaald = 0;
    let openstaand = 0;
    let concept = 0;
    for (const f of FACTUREN) {
      const n = parseEuro(f.bedrag);
      if (f.status === "Betaald") betaald += n;
      else if (f.status === "Openstaand") openstaand += n;
      else concept += n;
    }
    return { betaald, openstaand, concept };
  }, []);

  const warnCount = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;

  /* ----------------------------------------------------------------------- */
  return (
    <div
      className="flex min-h-[720px] w-full flex-col"
      style={{ background: C.bg, color: C.textMain, fontFamily: MONO }}
    >
      {/* ---------------------------- Top bar ---------------------------- */}
      <header
        className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4"
        style={{ borderBottom: `1px solid ${C.border}`, background: C.panelSoft }}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
            style={{ background: C.chip, border: `1px solid ${C.border}`, color: C.accent }}
            aria-hidden="true"
          >
            <CommandIcon size={15} />
          </span>
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="text-[13px]" style={{ color: C.textMain }}>
              kommando
            </span>
            <span className="hidden text-[11px] sm:inline" style={{ color: C.textFaint }}>
              zzp-workspace · {SCREEN_META[screen].path}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingG ? (
            <span
              className="hidden items-center gap-1 rounded px-2 py-1 text-[11px] sm:inline-flex"
              style={{ background: C.chip, border: `1px solid ${C.accentDim}`, color: C.accent }}
            >
              g&hellip; wacht op toets
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="inline-flex items-center gap-2 rounded px-2.5 py-1.5 text-[12px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              background: C.chip,
              border: `1px solid ${C.border}`,
              color: C.textDim,
              outlineColor: C.accent,
            }}
            aria-haspopup="dialog"
            aria-expanded={paletteOpen}
          >
            <Search size={13} aria-hidden="true" />
            <span className="hidden sm:inline">Commando&rsquo;s</span>
            <Kbd>⌘K</Kbd>
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        {/* --------------------------- Sidebar --------------------------- */}
        <nav
          className="shrink-0 md:w-56 md:border-r"
          style={{ borderColor: C.border, background: C.panelSoft }}
          aria-label="Schermen"
        >
          {/* Profiel */}
          <div
            className="flex items-center gap-2.5 px-3 py-3"
            style={{ borderBottom: `1px solid ${C.borderSoft}` }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded text-[12px]"
              style={{ background: C.chip, border: `1px solid ${C.border}`, color: C.accent }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[12px]" style={{ color: C.textMain }}>
                {PROFIEL.naam}
              </div>
              <div className="truncate text-[10.5px]" style={{ color: C.textFaint }}>
                {PROFIEL.rol}
              </div>
            </div>
          </div>

          {/* Scherm-lijst */}
          <ul className="flex gap-1 overflow-x-auto p-2 md:flex-col md:overflow-visible">
            {SCREENS.map((s) => {
              const active = s.key === screen;
              const Icon = SCREEN_META[s.key].icon;
              return (
                <li key={s.key} className="shrink-0 md:shrink">
                  <button
                    type="button"
                    onClick={() => go(s.key)}
                    aria-current={active ? "page" : undefined}
                    className="flex w-full items-center justify-between gap-2 rounded px-2.5 py-1.5 text-left text-[12px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
                    style={{
                      background: active ? C.chip : "transparent",
                      border: `1px solid ${active ? C.accentDim : "transparent"}`,
                      color: active ? C.textMain : C.textDim,
                      outlineColor: C.accent,
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={14} style={{ color: active ? C.accent : C.textFaint }} />
                      {s.label}
                    </span>
                    <span className="hidden md:inline">
                      <Kbd>g {SCREEN_META[s.key].chord}</Kbd>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="hidden px-3 pb-3 pt-1 md:block">
            <div
              className="rounded p-2.5 text-[10.5px] leading-relaxed"
              style={{
                background: C.panel,
                border: `1px solid ${C.borderSoft}`,
                color: C.textFaint,
              }}
            >
              <div className="mb-1.5 flex items-center gap-1.5" style={{ color: C.textDim }}>
                <Zap size={12} style={{ color: C.accent }} /> Sneltoetsen
              </div>
              <div className="flex flex-col gap-1">
                <span className="flex items-center justify-between">
                  <span>Palet</span> <Kbd>⌘K</Kbd>
                </span>
                <span className="flex items-center justify-between">
                  <span>Zoeken</span> <Kbd>/</Kbd>
                </span>
                <span className="flex items-center justify-between">
                  <span>Spring</span> <Kbd>g d</Kbd>
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* ---------------------------- Main ----------------------------- */}
        <main className="min-w-0 flex-1 p-3 sm:p-4">
          {loading ? (
            <div className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
              <div className="text-[12px]" style={{ color: C.textFaint }}>
                <span style={{ color: C.accent }}>$</span> laden {SCREEN_META[screen].path}
                <span className="animate-pulse">_</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Skeleton h={72} />
                <Skeleton h={72} />
                <Skeleton h={72} />
                <Skeleton h={72} />
              </div>
              <Skeleton h={140} />
            </div>
          ) : (
            <>
              {screen === "dashboard" && <DashboardScreen warnCount={warnCount} onGo={go} />}
              {screen === "marktplaats" && (
                <MarktplaatsScreen
                  expanded={expanded}
                  setExpanded={setExpanded}
                  onOpen={openOpdracht}
                />
              )}
              {screen === "opdracht" && <OpdrachtScreen opdracht={currentOpdracht} onGo={go} />}
              {screen === "verificatie" && <VerificatieScreen onLog={pushLog} />}
              {screen === "acties" && <ActiesScreen onLog={pushLog} />}
              {screen === "facturen" && <FacturenScreen totalen={factuurTotalen} onLog={pushLog} />}
            </>
          )}
        </main>
      </div>

      {/* ------------------------- Status line ------------------------- */}
      <footer
        className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1.5 text-[10.5px] sm:px-4"
        style={{
          borderTop: `1px solid ${C.border}`,
          background: C.panelSoft,
          fontFamily: DATA,
          color: C.textFaint,
        }}
      >
        <span className="flex items-center gap-1.5" style={{ color: C.accent }}>
          <Circle size={7} fill={C.accent} stroke="none" aria-hidden="true" />
          main
        </span>
        <span>{SCREEN_META[screen].path}</span>
        <span>NORMAAL</span>
        <span>
          {CREDENTIALS.length} credentials
          {warnCount > 0 ? ` · ${warnCount} waarschuwing` : ""}
        </span>
        {/* Foutregel (stderr) — status met label + icoon, niet enkel kleur */}
        <span className="flex items-center gap-1.5" style={{ color: C.warn }}>
          <AlertTriangle size={11} aria-hidden="true" />
          stderr: verificatie-service reageert traag
        </span>
        <span className="ml-auto flex items-center gap-2">
          <span style={{ color: C.accent }}>exit 0</span>
          <span className="hidden truncate sm:inline" style={{ maxWidth: 260 }}>
            {log[0]}
          </span>
        </span>
      </footer>

      {/* ------------------------ Command palette ------------------------ */}
      {paletteOpen && <CommandPalette commands={commands} onClose={() => setPaletteOpen(false)} />}
    </div>
  );
}

/* ========================================================================= */
/*                             Command palette                               */
/* ========================================================================= */
function CommandPalette({ commands, onClose }: { commands: Command[]; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.keywords.toLowerCase().includes(q),
    );
  }, [query, commands]);

  useEffect(() => {
    setSel(0);
  }, [query]);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-idx="${sel}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((v) => Math.min(v + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((v) => Math.max(v - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[sel];
      if (cmd) cmd.run();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[8vh] sm:pt-[12vh]"
      style={{ background: "rgba(3,6,7,0.72)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Commando-palet"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        className="w-full max-w-xl overflow-hidden rounded-lg"
        style={{
          background: C.panel,
          border: `1px solid ${C.border}`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Prompt */}
        <div
          className="flex items-center gap-2.5 px-3.5 py-3"
          style={{ borderBottom: `1px solid ${C.borderSoft}` }}
        >
          <span style={{ color: C.accent, fontFamily: MONO }} aria-hidden="true">
            &rsaquo;
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Typ een commando of zoek een scherm&hellip;"
            aria-label="Commando zoeken"
            role="combobox"
            aria-expanded="true"
            aria-controls="kommando-list"
            className="w-full bg-transparent text-[13px] outline-none placeholder:opacity-60"
            style={{ color: C.textMain, fontFamily: MONO }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Palet sluiten"
            className="rounded p-1 focus-visible:outline focus-visible:outline-2"
            style={{ color: C.textFaint, outlineColor: C.accent }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Resultaten */}
        <ul
          ref={listRef}
          id="kommando-list"
          role="listbox"
          aria-label="Commando-resultaten"
          className="max-h-[52vh] overflow-y-auto py-1.5"
        >
          {filtered.length === 0 ? (
            <li
              className="flex flex-col items-center gap-1 px-4 py-8 text-center text-[12px]"
              style={{ color: C.textFaint }}
            >
              <XCircle size={18} aria-hidden="true" />
              <span>Geen commando gevonden voor &ldquo;{query}&rdquo;</span>
              <span className="text-[11px]">pas je zoekopdracht aan</span>
            </li>
          ) : (
            filtered.map((cmd, i) => {
              const active = i === sel;
              const Icon = cmd.icon;
              const first = i === 0 || filtered[i - 1]!.group !== cmd.group;
              return (
                <li key={cmd.id}>
                  {first ? (
                    <div
                      className="px-3.5 pb-1 pt-2 text-[10px] uppercase tracking-wider"
                      style={{ color: C.textFaint }}
                    >
                      {cmd.group}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    data-idx={i}
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setSel(i)}
                    onClick={() => cmd.run()}
                    className="flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-[12.5px] focus-visible:outline-none"
                    style={{
                      background: active ? C.chip : "transparent",
                      borderLeft: `2px solid ${active ? C.accent : "transparent"}`,
                      color: active ? C.textMain : C.textDim,
                    }}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Icon size={14} style={{ color: active ? C.accent : C.textFaint }} />
                      <span className="truncate">{cmd.label}</span>
                    </span>
                    {cmd.hint ? (
                      <span className="shrink-0">
                        <Kbd>{cmd.hint}</Kbd>
                      </span>
                    ) : (
                      <ChevronRight size={13} style={{ color: C.textFaint }} aria-hidden="true" />
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>

        {/* Voetbalk */}
        <div
          className="flex items-center justify-between gap-2 px-3.5 py-2 text-[10.5px]"
          style={{ borderTop: `1px solid ${C.borderSoft}`, color: C.textFaint }}
        >
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Kbd>
                <ArrowUp size={9} />
              </Kbd>
              <Kbd>
                <ArrowDown size={9} />
              </Kbd>
              navigeer
            </span>
            <span className="flex items-center gap-1">
              <Kbd>
                <CornerDownLeft size={9} />
              </Kbd>
              kies
            </span>
          </span>
          <span className="flex items-center gap-1">
            <Kbd>esc</Kbd> sluit · {filtered.length} resultaten
          </span>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/*                                 Screens                                   */
/* ========================================================================= */
function DashboardScreen({ warnCount, onGo }: { warnCount: number; onGo: (s: ScreenKey) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[12px]" style={{ color: C.textFaint }}>
        <span style={{ color: C.accent }}>$</span> stat --overzicht
      </div>

      {/* KPI-tegels */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => {
          const Trend = k.up ? TrendingUp : TrendingDown;
          return (
            <div
              key={k.label}
              className="rounded-lg p-3.5"
              style={{ background: C.panel, border: `1px solid ${C.border}` }}
            >
              <div className="mb-1 text-[11px]" style={{ color: C.textDim }}>
                {k.label}
              </div>
              <div className="flex items-end justify-between gap-2">
                <span
                  className="text-[22px] leading-none"
                  style={{ color: C.textMain, fontFamily: DATA }}
                >
                  {k.value}
                </span>
                <Sparkline data={k.spark} up={k.up} />
              </div>
              <div
                className="mt-2 inline-flex items-center gap-1 text-[11px]"
                style={{ color: k.up ? C.accent : C.warn }}
              >
                <Trend size={12} aria-hidden="true" />
                <span>{k.trend}</span>
                <span style={{ color: C.textFaint }}>t.o.v. vorige</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Volgende acties */}
        <Panel
          title="[ volgende-acties ]"
          meta={`${ACTIES.length} items`}
          className="lg:col-span-2"
        >
          <ul className="flex flex-col gap-2">
            {ACTIES.map((a) => {
              const warn = a.urgentie === "warning";
              const Icon = warn ? AlertTriangle : Circle;
              return (
                <li
                  key={a.titel}
                  className="flex items-start gap-3 rounded px-2.5 py-2"
                  style={{ background: C.panelSoft, border: `1px solid ${C.borderSoft}` }}
                >
                  <Icon
                    size={14}
                    className="mt-0.5 shrink-0"
                    style={{ color: warn ? C.warn : C.info }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className="flex items-center gap-2 text-[12.5px]"
                      style={{ color: C.textMain }}
                    >
                      {a.titel}
                      <span
                        className="rounded px-1.5 py-0.5 text-[9.5px] uppercase tracking-wide"
                        style={{
                          color: warn ? C.warn : C.info,
                          background: warn ? `${C.warn}14` : `${C.info}14`,
                          border: `1px solid ${warn ? C.warn : C.info}33`,
                        }}
                      >
                        {warn ? "urgent" : "info"}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px]" style={{ color: C.textDim }}>
                      {a.detail}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onGo("acties")}
                    className="shrink-0 rounded px-2 py-1 text-[11px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
                    style={{
                      color: C.accent,
                      border: `1px solid ${C.accentDim}`,
                      outlineColor: C.accent,
                    }}
                  >
                    {a.cta}
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>

        {/* Vertrouwen */}
        <Panel title="~/vertrouwen" meta="profiel">
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                background: `${C.accent}14`,
                border: `1px solid ${C.accent}55`,
                color: C.accent,
              }}
              aria-hidden="true"
            >
              <ShieldCheck size={22} />
            </span>
            <div>
              <div className="text-[15px]" style={{ color: C.accent }}>
                {PROFIEL.trust}
              </div>
              <div className="text-[11px]" style={{ color: C.textDim }}>
                {PROFIEL.naam} · {PROFIEL.plaats}
              </div>
            </div>
            <div
              className="w-full rounded px-2.5 py-2 text-left text-[11px]"
              style={{
                background: C.panelSoft,
                border: `1px solid ${C.borderSoft}`,
                color: C.textDim,
              }}
            >
              {warnCount > 0 ? (
                <span className="flex items-center gap-1.5" style={{ color: C.warn }}>
                  <AlertTriangle size={12} aria-hidden="true" />
                  {warnCount} certificaat vraagt aandacht
                </span>
              ) : (
                <span className="flex items-center gap-1.5" style={{ color: C.accent }}>
                  <Check size={12} aria-hidden="true" /> Alles up-to-date
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onGo("verificatie")}
              className="inline-flex items-center gap-1.5 text-[11px] focus-visible:outline focus-visible:outline-2"
              style={{ color: C.accent, outlineColor: C.accent }}
            >
              Open verificatie <ArrowRight size={12} />
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------ Marktplaats ------------------------------ */
function MarktplaatsScreen({
  expanded,
  setExpanded,
  onOpen,
}: {
  expanded: string | null;
  setExpanded: (v: string | null) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex flex-wrap items-center justify-between gap-2 text-[12px]"
        style={{ color: C.textFaint }}
      >
        <span>
          <span style={{ color: C.accent }}>$</span> grep matches --min 80
        </span>
        <span>{OPDRACHTEN.length} resultaten · gesorteerd op match</span>
      </div>

      <Panel title="[ marktplaats ]" meta="druk enter om te openen">
        <ul className="flex flex-col divide-y" style={{ borderColor: C.borderSoft }}>
          {OPDRACHTEN.map((o) => {
            const open = expanded === o.id;
            return (
              <li key={o.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start gap-3">
                  <MatchDot value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px]" style={{ color: C.textMain }}>
                        {o.titel}
                      </span>
                      <span className="text-[10.5px]" style={{ color: C.textFaint }}>
                        {o.id}
                      </span>
                    </div>
                    <div
                      className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]"
                      style={{ color: C.textDim }}
                    >
                      <span className="flex items-center gap-1">
                        <Store size={11} /> {o.opdrachtgever}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {o.plaats}
                      </span>
                      <span className="flex items-center gap-1" style={{ color: C.accent }}>
                        <Coins size={11} /> {o.tarief}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {o.uren}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded px-1.5 py-0.5 text-[10px]"
                          style={{
                            background: C.chip,
                            border: `1px solid ${C.border}`,
                            color: C.textDim,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpen(o.id)}
                      className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
                      style={{
                        color: C.accent,
                        border: `1px solid ${C.accentDim}`,
                        background: C.chip,
                        outlineColor: C.accent,
                      }}
                    >
                      open <ArrowRight size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : o.id)}
                      aria-expanded={open}
                      className="text-[10.5px] focus-visible:outline focus-visible:outline-2"
                      style={{ color: C.textDim, outlineColor: C.accent }}
                    >
                      {open ? "verberg redenen" : "waarom deze match?"}
                    </button>
                  </div>
                </div>

                {open ? (
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <ReasonList type="plus" items={o.redenen.plus} />
                    <ReasonList type="min" items={o.redenen.min} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

function MatchDot({ value }: { value: number }) {
  const strong = value >= 90;
  return (
    <span
      className="flex h-10 w-12 shrink-0 flex-col items-center justify-center rounded"
      style={{
        background: C.panelSoft,
        border: `1px solid ${strong ? C.accentDim : C.border}`,
        color: strong ? C.accent : C.textDim,
        fontFamily: DATA,
      }}
      aria-label={`Match ${value} procent`}
    >
      <span className="text-[15px] leading-none">{value}</span>
      <span className="text-[8.5px]" style={{ color: C.textFaint }}>
        match
      </span>
    </span>
  );
}

function ReasonList({ type, items }: { type: "plus" | "min"; items: string[] }) {
  const isPlus = type === "plus";
  const Icon = isPlus ? Plus : Minus;
  const color = isPlus ? C.accent : C.warn;
  return (
    <div
      className="rounded px-2.5 py-2"
      style={{ background: C.panelSoft, border: `1px solid ${C.borderSoft}` }}
    >
      <div
        className="mb-1 flex items-center gap-1.5 text-[10.5px] uppercase tracking-wide"
        style={{ color }}
      >
        <Icon size={11} aria-hidden="true" />
        {isPlus ? "pluspunten" : "aandachtspunten"}
      </div>
      <ul className="flex flex-col gap-1">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-1.5 text-[11px]" style={{ color: C.textDim }}>
            <span style={{ color }} aria-hidden="true">
              ›
            </span>
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------ Opdracht -------------------------------- */
function OpdrachtScreen({ opdracht, onGo }: { opdracht: Opdracht; onGo: (s: ScreenKey) => void }) {
  const rows: { label: string; value: string; icon: LucideIcon }[] = [
    { label: "opdrachtgever", value: opdracht.opdrachtgever, icon: Store },
    { label: "plaats", value: opdracht.plaats, icon: MapPin },
    { label: "tarief", value: opdracht.tarief, icon: Coins },
    { label: "inzet", value: opdracht.uren, icon: Clock },
    { label: "start", value: opdracht.start, icon: CalendarDays },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[12px]" style={{ color: C.textFaint }}>
        <span style={{ color: C.accent }}>$</span> cat opdracht/{opdracht.id}
      </div>

      <Panel
        title={`~/opdracht/${opdracht.id}`}
        meta={<span style={{ color: C.accent }}>match {opdracht.match}%</span>}
      >
        <h2 className="text-[16px]" style={{ color: C.textMain }}>
          {opdracht.titel}
        </h2>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="rounded px-1.5 py-0.5 text-[10px]"
              style={{ background: C.chip, border: `1px solid ${C.border}`, color: C.textDim }}
            >
              {t}
            </span>
          ))}
        </div>

        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {rows.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.label}
                className="flex items-center justify-between gap-3 border-b py-1.5"
                style={{ borderColor: C.borderSoft }}
              >
                <dt
                  className="flex items-center gap-1.5 text-[11px]"
                  style={{ color: C.textFaint }}
                >
                  <Icon size={12} /> {r.label}
                </dt>
                <dd className="text-[12.5px]" style={{ color: C.textMain, fontFamily: DATA }}>
                  {r.value}
                </dd>
              </div>
            );
          })}
        </dl>
      </Panel>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="[ waarom-deze-match ]">
          <div className="flex flex-col gap-2">
            <ReasonList type="plus" items={opdracht.redenen.plus} />
            <ReasonList type="min" items={opdracht.redenen.min} />
          </div>
        </Panel>

        <Panel title="[ compliance-check ]" meta="server-side waarheid">
          <ul className="flex flex-col gap-2">
            <li
              className="flex items-center justify-between gap-2 rounded px-2.5 py-2"
              style={{ background: C.panelSoft, border: `1px solid ${C.borderSoft}` }}
            >
              <span className="flex items-center gap-2 text-[12px]" style={{ color: C.textMain }}>
                <ShieldCheck size={13} style={{ color: C.accent }} /> BIG-registratie vereist
              </span>
              <CredBadge status="VERIFIED" />
            </li>
            <li
              className="flex items-center justify-between gap-2 rounded px-2.5 py-2"
              style={{ background: C.panelSoft, border: `1px solid ${C.borderSoft}` }}
            >
              <span className="flex items-center gap-2 text-[12px]" style={{ color: C.textMain }}>
                <AlertTriangle size={13} style={{ color: C.warn }} /> VOG (zorg) vereist
              </span>
              <CredBadge status="EXPIRING" />
            </li>
            <li
              className="flex items-start gap-2 rounded px-2.5 py-2 text-[11px]"
              style={{ background: `${C.warn}0e`, border: `1px solid ${C.warn}33`, color: C.warn }}
            >
              <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                Je VOG verloopt binnenkort. Vernieuw deze om zonder onderbreking op deze opdracht te
                kunnen reageren.
              </span>
            </li>
          </ul>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => onGo("acties")}
              className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
              style={{ background: C.accent, color: "#06180f", outlineColor: C.accent }}
            >
              Reageer op opdracht <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={() => onGo("marktplaats")}
              className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
              style={{ color: C.textDim, border: `1px solid ${C.border}`, outlineColor: C.accent }}
            >
              Terug
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ----------------------------- Verificatie ------------------------------ */
function VerificatieScreen({ onLog }: { onLog: (m: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[12px]" style={{ color: C.textFaint }}>
        <span style={{ color: C.accent }}>$</span> ls credentials/ --status
      </div>

      <Panel title="[ verificatie ]" meta={`${CREDENTIALS.length} credentials`}>
        <ul className="flex flex-col gap-2">
          {CREDENTIALS.map((c) => {
            const recover = c.status === "EXPIRING" || c.status === "REJECTED";
            return (
              <li
                key={c.naam}
                className="flex flex-wrap items-center justify-between gap-2 rounded px-3 py-2.5"
                style={{ background: C.panelSoft, border: `1px solid ${C.borderSoft}` }}
              >
                <div className="min-w-0">
                  <div className="text-[13px]" style={{ color: C.textMain }}>
                    {c.naam}
                  </div>
                  <div className="text-[11px]" style={{ color: C.textDim }}>
                    {c.detail}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CredBadge status={c.status} />
                  {recover ? (
                    <button
                      type="button"
                      onClick={() => onLog(`run credential:herstel ${c.naam}`)}
                      className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
                      style={{
                        color: C.warn,
                        border: `1px solid ${C.warn}55`,
                        outlineColor: C.accent,
                      }}
                    >
                      <RefreshCw size={11} /> herstel
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        <div
          className="mt-3 flex items-start gap-2 rounded px-3 py-2.5 text-[11.5px]"
          style={{ background: `${C.warn}0e`, border: `1px solid ${C.warn}33`, color: C.warn }}
        >
          <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            VOG (zorg) verloopt over 23 dagen. Start de vernieuwing nu, zo blijf je verifieerbaar en
            zichtbaar voor opdrachtgevers.
          </span>
        </div>
      </Panel>
    </div>
  );
}

/* -------------------------------- Acties -------------------------------- */
function ActiesScreen({ onLog }: { onLog: (m: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[12px]" style={{ color: C.textFaint }}>
        <span style={{ color: C.accent }}>$</span> queue --volgende-beste-actie
      </div>

      <Panel title="[ acties ]" meta={`${ACTIES.length} in wachtrij`}>
        <ol className="flex flex-col gap-2.5">
          {ACTIES.map((a, i) => {
            const warn = a.urgentie === "warning";
            const Icon = warn ? AlertTriangle : Circle;
            return (
              <li
                key={a.titel}
                className="flex flex-wrap items-start gap-3 rounded px-3 py-2.5"
                style={{
                  background: C.panelSoft,
                  border: `1px solid ${warn ? `${C.warn}44` : C.borderSoft}`,
                }}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px]"
                  style={{
                    background: C.chip,
                    border: `1px solid ${C.border}`,
                    color: C.textFaint,
                    fontFamily: DATA,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon size={13} style={{ color: warn ? C.warn : C.info }} aria-hidden="true" />
                    <span className="text-[13px]" style={{ color: C.textMain }}>
                      {a.titel}
                    </span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[9.5px] uppercase tracking-wide"
                      style={{
                        color: warn ? C.warn : C.info,
                        background: warn ? `${C.warn}14` : `${C.info}14`,
                        border: `1px solid ${warn ? C.warn : C.info}33`,
                      }}
                    >
                      {warn ? "urgent" : "info"}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11.5px]" style={{ color: C.textDim }}>
                    {a.detail}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onLog(`run actie:${a.cta}`)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded px-3 py-1.5 text-[11.5px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
                  style={
                    warn
                      ? { background: C.warn, color: "#1a1204", outlineColor: C.accent }
                      : {
                          color: C.accent,
                          border: `1px solid ${C.accentDim}`,
                          outlineColor: C.accent,
                        }
                  }
                >
                  {a.cta} <ArrowRight size={12} />
                </button>
              </li>
            );
          })}
        </ol>
      </Panel>
    </div>
  );
}

/* ------------------------------- Facturen ------------------------------- */
function FacturenScreen({
  totalen,
  onLog,
}: {
  totalen: { betaald: number; openstaand: number; concept: number };
  onLog: (m: string) => void;
}) {
  const statusMeta: Record<string, { color: string; icon: LucideIcon }> = {
    Betaald: { color: C.accent, icon: Check },
    Openstaand: { color: C.warn, icon: Clock },
    Concept: { color: C.textDim, icon: Circle },
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[12px]" style={{ color: C.textFaint }}>
        <span style={{ color: C.accent }}>$</span> sum facturen --by-status
      </div>

      {/* Totalen */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TotalCard
          label="Betaald"
          value={formatEuro(totalen.betaald)}
          color={C.accent}
          icon={Check}
        />
        <TotalCard
          label="Openstaand"
          value={formatEuro(totalen.openstaand)}
          color={C.warn}
          icon={Clock}
        />
        <TotalCard
          label="Concept"
          value={formatEuro(totalen.concept)}
          color={C.textDim}
          icon={Circle}
        />
      </div>

      <Panel title="[ facturen ]" meta={`${FACTUREN.length} regels`}>
        <div className="overflow-x-auto">
          <table
            className="w-full min-w-[520px] text-left text-[12px]"
            style={{ fontFamily: DATA }}
          >
            <thead>
              <tr style={{ color: C.textFaint }}>
                <th className="pb-2 pr-3 font-normal">nr</th>
                <th className="pb-2 pr-3 font-normal">klant</th>
                <th className="pb-2 pr-3 font-normal">datum</th>
                <th className="pb-2 pr-3 text-right font-normal">bedrag</th>
                <th className="pb-2 font-normal">status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const m = statusMeta[f.status] ?? { color: C.textDim, icon: Circle };
                const Icon = m.icon;
                return (
                  <tr key={f.nr} style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                    <td className="py-2 pr-3" style={{ color: C.textMain }}>
                      {f.nr}
                    </td>
                    <td className="py-2 pr-3" style={{ color: C.textDim }}>
                      {f.klant}
                    </td>
                    <td className="py-2 pr-3" style={{ color: C.textFaint }}>
                      {f.datum}
                    </td>
                    <td className="py-2 pr-3 text-right" style={{ color: C.textMain }}>
                      {f.bedrag}
                    </td>
                    <td className="py-2">
                      <span className="inline-flex items-center gap-1.5" style={{ color: m.color }}>
                        <Icon size={12} aria-hidden="true" />
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-[11px]" style={{ color: C.textFaint }}>
            openstaand vraagt actie
          </span>
          <button
            type="button"
            onClick={() => onLog("run factuur:herinner openstaand")}
            className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
            style={{ color: C.warn, border: `1px solid ${C.warn}55`, outlineColor: C.accent }}
          >
            <Send size={12} /> Herinnering sturen
          </button>
        </div>
      </Panel>
    </div>
  );
}

function TotalCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: LucideIcon;
}) {
  return (
    <div
      className="rounded-lg p-3.5"
      style={{ background: C.panel, border: `1px solid ${C.border}` }}
    >
      <div className="flex items-center gap-1.5 text-[11px]" style={{ color: C.textDim }}>
        <Icon size={12} style={{ color }} aria-hidden="true" />
        {label}
      </div>
      <div
        className="mt-1 text-[20px] leading-none"
        style={{ color: C.textMain, fontFamily: DATA }}
      >
        {value}
      </div>
    </div>
  );
}
