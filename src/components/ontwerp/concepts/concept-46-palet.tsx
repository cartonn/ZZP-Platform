"use client";

// Concept 46 — "Palet" · Command-first, toetsenbord-gedreven (DONKER, Raycast/Superhuman-energie).
// Een gecentreerd command-palet is de primaire manier om te navigeren: ⌘K-spotlight met een live
// resultatenlijst, toets-hint-chips (↑↓ ⏎ esc), secties (Navigatie / Acties / Opdrachten), en het
// onderliggende scherm dat meebeweegt terwijl je een commando "uitvoert". Diep, rustig donker canvas
// met zachte top-glow en scherpe haarlijnen.
// Palet: bg #0b0d12, panel #14171e, inkt #e6e9f0, muted #8a90a2, violet #7c5cff, teal #35d0ba.
// Fonts: Geist (--font-lab-geist) + Geist Mono (--font-lab-geist-mono).

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Command as CommandIcon,
  Check,
  Clock,
  AlertTriangle,
  X,
  MapPin,
  ChevronRight,
  Send,
  Loader2,
  FileText,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Zap,
  Bell,
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

const C = {
  bg: "#0b0d12",
  panel: "#14171e",
  panelAlt: "#191d26",
  panelHi: "#1f2430",
  ink: "#e6e9f0",
  inkSoft: "#c3c8d4",
  muted: "#8a90a2",
  faint: "#5c6274",
  line: "#242936",
  lineSoft: "#1c212c",
  violet: "#7c5cff",
  violetSoft: "rgba(124,92,255,0.14)",
  violetLine: "rgba(124,92,255,0.4)",
  teal: "#35d0ba",
  tealSoft: "rgba(53,208,186,0.13)",
  amber: "#e0a548",
  amberSoft: "rgba(224,165,72,0.14)",
  redReal: "#ff6b6b",
  redSoft: "rgba(255,107,107,0.13)",
};

const display = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

type Tone = { label: string; fg: string; bg: string; Icon: LucideIcon };

function statusStyle(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.teal, bg: C.tealSoft, Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.violet, bg: C.violetSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.amber, bg: C.amberSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.redReal, bg: C.redSoft, Icon: X };
  }
}

/* ---------- Command-model ---------- */

type CmdKind = "nav" | "actie" | "opdracht";
type Command = {
  id: string;
  kind: CmdKind;
  label: string;
  hint: string;
  Icon: LucideIcon;
  keywords: string;
  run: () => void;
};
const SECTION_LABEL: Record<CmdKind, string> = {
  nav: "Navigatie",
  actie: "Acties",
  opdracht: "Opdrachten",
};

/* ---------- Toets-chip ---------- */

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] px-1.5 text-[11px] font-medium"
      style={{
        background: C.panelHi,
        border: `1px solid ${C.line}`,
        color: C.inkSoft,
        ...mono,
      }}
    >
      {children}
    </kbd>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept46() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [openId, setOpenId] = useState<string>(OPDRACHTEN[0]!.id);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const active = OPDRACHTEN.find((o) => o.id === openId) ?? OPDRACHTEN[0]!;

  const gotoOpdracht = (id: string) => {
    setOpenId(id);
    setScreen("opdracht");
  };

  // Globale ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const commands: Command[] = useMemo(() => {
    const nav: Command[] = SCREENS.map((s) => ({
      id: `nav-${s.key}`,
      kind: "nav",
      label: `Ga naar ${s.label}`,
      hint: "Scherm",
      Icon: NAV_ICONS[s.key],
      keywords: s.label.toLowerCase() + " " + s.key,
      run: () => {
        setScreen(s.key);
        setPaletteOpen(false);
      },
    }));
    const acts: Command[] = ACTIES.map((a, i) => ({
      id: `actie-${i}`,
      kind: "actie",
      label: a.cta,
      hint: a.titel,
      Icon: a.urgentie === "warning" ? AlertTriangle : Zap,
      keywords: (a.cta + " " + a.titel).toLowerCase(),
      run: () => {
        setScreen("acties");
        setPaletteOpen(false);
      },
    }));
    const opds: Command[] = OPDRACHTEN.map((o) => ({
      id: `opd-${o.id}`,
      kind: "opdracht",
      label: o.titel,
      hint: `${o.opdrachtgever} · ${o.match}% match`,
      Icon: Briefcase,
      keywords: (o.titel + " " + o.opdrachtgever + " " + o.plaats).toLowerCase(),
      run: () => {
        gotoOpdracht(o.id);
        setPaletteOpen(false);
      },
    }));
    return [...nav, ...acts, ...opds];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ background: C.bg, color: C.ink, ...display }}
    >
      {/* Zachte top-glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72"
        style={{
          background:
            "radial-gradient(680px 260px at 50% -60px, rgba(124,92,255,0.20), transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative flex min-h-[680px]">
        {/* Rail-zijbalk */}
        <aside
          className="hidden w-[210px] shrink-0 flex-col p-4 md:flex"
          style={{ borderRight: `1px solid ${C.line}` }}
        >
          <div className="flex items-center gap-2.5 px-1 pb-6 pt-1">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[15px] font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${C.violet}, #5a3ff0)`, ...display }}
            >
              P
            </div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold tracking-tight">Palet</div>
              <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: C.faint }}>
                ZZP Platform
              </div>
            </div>
          </div>

          {/* ⌘K trigger */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="mb-4 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12.5px] transition-colors hover:bg-[#191d26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cff]"
            style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.muted }}
          >
            <Search size={14} aria-hidden="true" />
            <span className="flex-1 text-left">Zoek of typ commando…</span>
            <span className="flex items-center gap-0.5">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>

          <nav className="flex flex-col gap-0.5">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cff]"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? C.violetSoft : "transparent",
                    border: `1px solid ${on ? C.violetLine : "transparent"}`,
                  }}
                >
                  <Icon size={16} aria-hidden="true" style={{ color: on ? C.violet : C.faint }} />
                  <span className="flex-1 font-medium">{s.label}</span>
                </button>
              );
            })}
          </nav>

          <div
            className="mt-auto rounded-xl p-3"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                style={{
                  background: `linear-gradient(135deg, ${C.violet}, ${C.teal})`,
                  ...display,
                }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold">{PROFIEL.naam}</div>
                <div className="flex items-center gap-1 text-[10.5px]" style={{ color: C.teal }}>
                  <Check size={10} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-14 shrink-0 items-center gap-3 px-5 sm:px-7"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <h2 className="text-[15px] font-semibold tracking-tight">
              {SCREENS.find((s) => s.key === screen)?.label}
            </h2>
            <button
              onClick={() => setPaletteOpen(true)}
              className="ml-auto flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] transition-colors hover:bg-[#191d26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cff] md:hidden"
              style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.muted }}
            >
              <CommandIcon size={13} aria-hidden="true" /> K
            </button>
            <div
              className="ml-auto hidden items-center gap-2 text-[11.5px] md:flex"
              style={{ color: C.muted }}
            >
              <span>Druk</span>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
              <span>voor commando&apos;s</span>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div
            className="flex gap-1.5 overflow-x-auto px-4 py-2 md:hidden"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cff]"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? C.violetSoft : "transparent",
                    border: `1px solid ${on ? C.violetLine : C.line}`,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-7">
            {screen === "dashboard" && (
              <Dashboard onOpen={gotoOpdracht} onPalette={() => setPaletteOpen(true)} />
            )}
            {screen === "marktplaats" && <Marktplaats onOpen={gotoOpdracht} />}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>

      {paletteOpen && <Palette commands={commands} onClose={() => setPaletteOpen(false)} />}
    </div>
  );
}

/* ---------- Command-palet ---------- */

function Palette({ commands, onClose }: { commands: Command[]; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.keywords.includes(q) ||
        c.hint.toLowerCase().includes(q),
    );
  }, [query, commands]);

  // Groepeer per sectie, in vaste volgorde, behoud globale index voor toets-navigatie.
  const groups = useMemo(() => {
    const order: CmdKind[] = ["nav", "actie", "opdracht"];
    let idx = 0;
    return order
      .map((kind) => {
        const items = filtered
          .filter((c) => c.kind === kind)
          .map((c) => ({ cmd: c, index: idx++ }));
        return { kind, items };
      })
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  useEffect(() => {
    setSelected((s) => Math.min(s, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  const runAt = (i: number) => {
    const cmd = filtered[i];
    if (cmd) cmd.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => (filtered.length ? (s + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => (filtered.length ? (s - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runAt(selected);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll geselecteerde in beeld
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selected}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [selected]);

  return (
    <div
      className="absolute inset-0 z-50 flex items-start justify-center px-4 pt-[8vh] sm:pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command-palet"
    >
      <button
        className="absolute inset-0 focus-visible:outline-none"
        style={{ background: "rgba(6,7,11,0.66)", backdropFilter: "blur(3px)" }}
        onClick={onClose}
        aria-label="Sluiten"
        tabIndex={-1}
      />

      <div
        className="relative w-full max-w-[600px] overflow-hidden rounded-2xl"
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          boxShadow:
            "0 30px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,92,255,0.12), 0 -1px 40px rgba(124,92,255,0.1) inset",
        }}
      >
        {/* Input */}
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <Search size={18} aria-hidden="true" style={{ color: C.violet }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Typ een commando of zoek…"
            aria-label="Command-invoer"
            aria-expanded="true"
            role="combobox"
            aria-controls="palette-list"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-[#5c6274]"
            style={{ color: C.ink }}
          />
          <button
            onClick={onClose}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors hover:bg-[#191d26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cff]"
            style={{ color: C.muted, ...mono }}
            aria-label="Palet sluiten"
          >
            esc
          </button>
        </div>

        {/* Resultaten */}
        <div
          ref={listRef}
          id="palette-list"
          role="listbox"
          className="max-h-[340px] overflow-y-auto py-2"
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: C.violetSoft }}
                aria-hidden="true"
              >
                <Search size={18} style={{ color: C.violet }} />
              </div>
              <p className="mt-3 text-[14px] font-semibold">Geen commando gevonden</p>
              <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
                Niets voor &quot;{query}&quot;. Probeer een ander trefwoord.
              </p>
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.kind} className="px-2 pb-1.5">
                <p
                  className="px-2 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: C.faint }}
                >
                  {SECTION_LABEL[g.kind]}
                </p>
                {g.items.map(({ cmd, index }) => {
                  const on = index === selected;
                  return (
                    <button
                      key={cmd.id}
                      data-index={index}
                      role="option"
                      aria-selected={on}
                      onClick={cmd.run}
                      onMouseMove={() => setSelected(index)}
                      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors focus-visible:outline-none"
                      style={{ background: on ? C.violetSoft : "transparent" }}
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          background: on ? "rgba(124,92,255,0.2)" : C.panelHi,
                          border: `1px solid ${on ? C.violetLine : C.line}`,
                        }}
                        aria-hidden="true"
                      >
                        <cmd.Icon size={15} style={{ color: on ? C.violet : C.muted }} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[13.5px] font-medium"
                          style={{ color: C.ink }}
                        >
                          {cmd.label}
                        </span>
                        <span className="block truncate text-[11.5px]" style={{ color: C.muted }}>
                          {cmd.hint}
                        </span>
                      </span>
                      {on && (
                        <span
                          className="flex items-center gap-1 text-[11px]"
                          style={{ color: C.violet }}
                        >
                          <CornerDownLeft size={13} aria-hidden="true" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer met toets-hints */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ borderTop: `1px solid ${C.line}`, background: C.panelAlt }}
        >
          <div className="flex items-center gap-3 text-[11px]" style={{ color: C.muted }}>
            <span className="flex items-center gap-1.5">
              <Kbd>
                <ArrowUp size={10} />
              </Kbd>
              <Kbd>
                <ArrowDown size={10} />
              </Kbd>
              navigeer
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>
                <CornerDownLeft size={10} />
              </Kbd>
              kies
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>esc</Kbd>
              sluit
            </span>
          </div>
          <span className="text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
            {filtered.length} resultaten
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Sparkline ---------- */

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 100;
  const h = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------- Card ---------- */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}` }}
    >
      {children}
    </div>
  );
}

function SectionHead({ kicker, title, note }: { kicker: string; title: string; note?: string }) {
  return (
    <div>
      <p
        className="text-[10.5px] font-semibold uppercase tracking-[0.22em]"
        style={{ color: C.violet }}
      >
        {kicker}
      </p>
      <h1 className="mt-2 text-[26px] font-semibold tracking-tight sm:text-[30px]">{title}</h1>
      {note && (
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
          {note}
        </p>
      )}
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({ onOpen, onPalette }: { onOpen: (id: string) => void; onPalette: () => void }) {
  const colors = [C.violet, C.teal, C.amber, C.violet];
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kicker={`Overzicht · ${PROFIEL.plaats}`}
          title={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}`}
          note="Alles begint bij het toetsenbord. Druk ⌘K om te navigeren, reageren of factureren — zonder je muis."
        />
        <button
          onClick={onPalette}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-[12.5px] font-medium transition-colors hover:bg-[#1f2430] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cff]"
          style={{ background: C.panel, border: `1px solid ${C.violetLine}`, color: C.ink }}
        >
          <CommandIcon size={14} aria-hidden="true" style={{ color: C.violet }} /> Open
          command-palet
        </button>
      </div>

      {/* KPI's */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Card key={k.label} className="p-4 transition-colors hover:border-[#2d3342]">
            <div className="flex items-center justify-between">
              <p className="text-[11px]" style={{ color: C.muted }}>
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                style={{ color: k.up ? C.teal : C.amber }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums tracking-tight">{k.value}</p>
            <div className="mt-2">
              <Sparkline data={k.spark} color={colors[i % colors.length] ?? C.violet} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold tracking-tight">Beste matches</h2>
            <span className="text-[11.5px]" style={{ color: C.muted }}>
              Verklaarbaar gesorteerd
            </span>
          </div>
          <Card>
            {OPDRACHTEN.map((o, i) => (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#191d26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7c5cff]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold tabular-nums"
                  style={{ background: C.violetSoft, color: C.violet, ...mono }}
                >
                  {o.match}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium">{o.titel}</p>
                  <p
                    className="mt-0.5 flex items-center gap-1 truncate text-[12px]"
                    style={{ color: C.muted }}
                  >
                    <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                  </p>
                </div>
                <span
                  className="hidden text-[12.5px] font-medium tabular-nums sm:inline"
                  style={{ color: C.inkSoft }}
                >
                  {o.tarief.replace(" / uur", "")}
                </span>
                <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
              </button>
            ))}
          </Card>
        </div>

        {/* Certificaten */}
        <div>
          <h2 className="mb-3 text-[14px] font-semibold tracking-tight">Certificaten</h2>
          <Card className="p-4">
            <div className="space-y-3.5">
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div key={c.naam} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: st.bg }}
                      aria-hidden="true"
                    >
                      <st.Icon size={13} style={{ color: st.fg }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium">{c.naam}</p>
                      <p className="truncate text-[11px]" style={{ color: C.muted }}>
                        {c.detail}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold" style={{ color: st.fg }}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({ onOpen }: { onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <SectionHead
        kicker="Marktplaats"
        title="Open opdrachten"
        note="Filter live terwijl je typt. Kies met ⏎ of klik om een opdracht te openen."
      />

      <Card className="flex items-center gap-3 px-4 py-2.5 focus-within:border-[#7c5cff]">
        <Search size={16} aria-hidden="true" style={{ color: C.violet }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#5c6274]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Card>

      {filtered.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: C.violetSoft }}
            aria-hidden="true"
          >
            <Search size={20} style={{ color: C.violet }} />
          </div>
          <p className="mt-4 text-[15px] font-semibold">Geen opdrachten gevonden</p>
          <p className="mx-auto mt-1 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Niets voor &quot;{q}&quot;. Verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cff]"
            style={{ background: C.violet }}
          >
            Zoekopdracht wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={() => onOpen(o.id)}
              className="group text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none"
            >
              <Card className="h-full p-5 transition-colors group-hover:border-[#7c5cff] group-focus-visible:ring-2 group-focus-visible:ring-[#7c5cff]">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[10.5px] tabular-nums" style={{ color: C.faint, ...mono }}>
                    {o.id}
                  </span>
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[12px] font-semibold tabular-nums"
                    style={{ background: C.violetSoft, color: C.violet, ...mono }}
                  >
                    {o.match}
                  </span>
                </div>
                <p className="mt-2 text-[15px] font-semibold leading-snug">{o.titel}</p>
                <p
                  className="mt-1 flex items-center gap-1.5 text-[12px]"
                  style={{ color: C.muted }}
                >
                  <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md px-2.5 py-0.5 text-[10.5px]"
                      style={{
                        color: C.inkSoft,
                        background: C.panelHi,
                        border: `1px solid ${C.line}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div
                  className="mt-4 flex items-center justify-between border-t pt-3.5 text-[12.5px]"
                  style={{ borderColor: C.lineSoft }}
                >
                  <span className="font-semibold tabular-nums" style={{ color: C.teal }}>
                    {o.tarief}
                  </span>
                  <span className="tabular-nums" style={{ color: C.muted }}>
                    {o.uren}
                  </span>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 900);
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: C.violet }}
            >
              {opdracht.id}
            </p>
            <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-tight">
              {opdracht.titel}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cff] disabled:opacity-90"
            style={{ background: state === "sent" ? C.teal : C.violet }}
          >
            {state === "sending" && (
              <Loader2 size={15} aria-hidden="true" className="animate-spin" />
            )}
            {state === "sent" && <Check size={15} aria-hidden="true" />}
            {state === "idle" && <Send size={14} aria-hidden="true" />}
            {state === "idle"
              ? "Reageer op opdracht"
              : state === "sending"
                ? "Versturen…"
                : "Reactie verstuurd"}
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, c: C.teal },
          { l: "Omvang", v: opdracht.uren, c: C.ink },
          { l: "Start", v: opdracht.start, c: C.ink },
          { l: "Match", v: `${opdracht.match}%`, c: C.violet },
        ].map((m) => (
          <Card key={m.l} className="p-4">
            <p
              className="text-[10.5px] font-medium uppercase tracking-[0.12em]"
              style={{ color: C.muted }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[16px] font-semibold tabular-nums tracking-tight"
              style={{ color: m.c }}
            >
              {m.v}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="text-[14.5px] font-semibold">Waarom deze match</h3>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je geverifieerde profiel.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.teal }}
            >
              Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.tealSoft }}
                    aria-hidden="true"
                  >
                    <Check size={12} style={{ color: C.teal }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.amber }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.amberSoft }}
                    aria-hidden="true"
                  >
                    <AlertTriangle size={11} style={{ color: C.amber }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const attention = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHead
        kicker="Vertrouwen"
        title="Verificatie"
        note="Elk certificaat onafhankelijk gecontroleerd — dat geeft opdrachtgevers zekerheid."
      />

      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: C.tealSoft, border: `1px solid ${C.line}` }}
        >
          <ShieldCheck size={30} aria-hidden="true" style={{ color: C.teal }} />
        </div>
        <div className="flex-1">
          <p className="text-[18px] font-semibold">{PROFIEL.trust}</p>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
            <span className="font-semibold tabular-nums">{verified}</span> van{" "}
            <span className="font-semibold tabular-nums">{total}</span> geverifieerd ·{" "}
            <span style={{ color: C.amber }}>{attention} vraagt actie</span>
          </p>
          <div
            className="mt-3 flex h-2.5 overflow-hidden rounded-full"
            style={{ background: C.panelHi }}
          >
            {CREDENTIALS.map((c) => {
              const st = statusStyle(c.status);
              return (
                <div
                  key={c.naam}
                  className="h-full"
                  style={{
                    width: `${100 / total}%`,
                    background: st.fg,
                    opacity: c.status === "VERIFIED" ? 1 : 0.55,
                  }}
                  aria-hidden="true"
                />
              );
            })}
          </div>
        </div>
      </Card>

      <Card>
        {CREDENTIALS.map((c, i) => {
          const st = statusStyle(c.status);
          return (
            <div
              key={c.naam}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#191d26]"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: st.bg }}
              >
                {c.status === "SUBMITTED" ? (
                  <Loader2
                    size={17}
                    aria-hidden="true"
                    className="motion-safe:animate-spin"
                    style={{ color: st.fg }}
                  />
                ) : (
                  <st.Icon size={17} aria-hidden="true" style={{ color: st.fg }} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium">{c.naam}</p>
                <p className="text-[12px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
                style={{ color: st.fg, background: st.bg }}
              >
                <st.Icon size={11} aria-hidden="true" /> {st.label}
              </span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties() {
  const tone: Record<"warning" | "info", Tone> = {
    warning: { fg: C.amber, bg: C.amberSoft, Icon: AlertTriangle, label: "Urgent" },
    info: { fg: C.violet, bg: C.violetSoft, Icon: Zap, label: "Ter info" },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHead
        kicker="Aandacht"
        title="Volgende acties"
        note="Wat nu telt — op volgorde van urgentie. Elke actie is ook een ⌘K-commando."
      />
      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <Card
              key={a.titel}
              className="flex items-start gap-4 p-5 transition-colors hover:border-[#2d3342]"
            >
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className="text-[10px] font-semibold tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: t.bg }}
                >
                  <t.Icon size={19} aria-hidden="true" style={{ color: t.fg }} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: t.fg, background: t.bg }}
                >
                  {t.label}
                </span>
                <p className="mt-1.5 text-[13.5px] font-semibold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-center rounded-lg px-4 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cff]"
                style={{ color: t.fg, background: t.bg, border: `1px solid ${t.fg}33` }}
              >
                {a.cta}
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusTone: Record<string, Tone> = {
    Betaald: { fg: C.teal, bg: C.tealSoft, Icon: Check, label: "Betaald" },
    Openstaand: { fg: C.amber, bg: C.amberSoft, Icon: Clock, label: "Openstaand" },
    Concept: { fg: C.muted, bg: C.panelHi, Icon: FileText, label: "Concept" },
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kicker="Omzet"
          title="Facturen"
          note="Overzicht van wat binnen is en wat nog komt."
        />
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cff]"
          style={{ background: C.violet }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.muted, borderBottom: `1px solid ${C.line}` }}
              >
                <th className="px-5 py-3.5">Nummer</th>
                <th className="px-5 py-3.5">Klant</th>
                <th className="hidden px-5 py-3.5 sm:table-cell">Datum</th>
                <th className="px-5 py-3.5 text-right">Bedrag</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = statusTone[f.status] ?? statusTone.Concept!;
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#191d26]"
                    style={{ borderTop: `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-5 py-4 text-[12.5px] tabular-nums"
                      style={{ color: C.muted, ...mono }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-medium">{f.klant}</td>
                    <td
                      className="hidden px-5 py-4 text-[12.5px] tabular-nums sm:table-cell"
                      style={{ color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-5 py-4 text-right text-[13px] font-semibold tabular-nums">
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ color: t.fg, background: t.bg }}
                      >
                        <t.Icon size={11} aria-hidden="true" /> {t.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
