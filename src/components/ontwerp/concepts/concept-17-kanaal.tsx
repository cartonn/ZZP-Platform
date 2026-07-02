"use client";

// Concept 17 — "Kanaal" · Command-first / toetsenbord & spotlight (DARK, technisch).
// Snelheid als product: een zwevend ⌘K-spotlight-palet is de hoofdnavigatie. Elke actie heeft
// een toetsafkorting, elke lijst is J/K-navigeerbaar met zichtbare toets-hints. Bereik alles in
// twee toetsaanslagen. Monospace-data, key-badges overal, strak en gefocust.
// Palet: canvas #101216, fg #e7e9ee, accent #7c8cff.
// Fonts: Geist (UI) + IBM Plex Mono (keys/data).

import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Command,
  CornerDownLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  MapPin,
  Plus,
  Zap,
  Bell,
  FileText,
  RefreshCw,
  Send,
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
  canvas: "#101216",
  panel: "#15181e",
  panelHi: "#1a1e26",
  line: "#242833",
  lineHi: "#31374533",
  ink: "#e7e9ee",
  inkSoft: "#b6bbc7",
  muted: "#8990a0",
  faint: "#5c6373",
  accent: "#7c8cff",
  accentSoft: "rgba(124,140,255,0.14)",
  accentLine: "rgba(124,140,255,0.4)",
  green: "#4ade80",
  cyan: "#38bdf8",
  amber: "#fbbf24",
  red: "#f87171",
};

const ui = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

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

// Toets-hint per scherm (tweede aanslag na G / na openen palet)
const SCREEN_KEY: Record<ScreenKey, string> = {
  dashboard: "D",
  marktplaats: "M",
  opdracht: "O",
  verificatie: "V",
  acties: "A",
  facturen: "F",
  documenten: "C",
  berichten: "B",
};

type Tone = { label: string; fg: string; bg: string };

function statusStyle(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "GEVERIFIEERD", fg: C.green, bg: "rgba(74,222,128,0.12)" };
    case "SUBMITTED":
      return { label: "IN BEOORDELING", fg: C.cyan, bg: "rgba(56,189,248,0.12)" };
    case "EXPIRING":
      return { label: "VERLOOPT BIJNA", fg: C.amber, bg: "rgba(251,191,36,0.12)" };
    case "REJECTED":
      return { label: "AFGEWEZEN", fg: C.red, bg: "rgba(248,113,113,0.12)" };
  }
}

function Kbd({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "accent";
}) {
  return (
    <kbd
      className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] px-1 text-[10.5px] font-medium leading-none"
      style={{
        ...mono,
        color: tone === "accent" ? C.accent : C.muted,
        background: tone === "accent" ? C.accentSoft : "rgba(255,255,255,0.04)",
        border: `1px solid ${tone === "accent" ? C.accentLine : C.line}`,
      }}
    >
      {children}
    </kbd>
  );
}

/* ---------------- Command palette ---------------- */
type Cmd = {
  id: string;
  label: string;
  hint: string;
  group: "Navigatie" | "Acties" | "Opdrachten";
  icon: LucideIcon;
  keys: string[];
  run: () => void;
};

function CmdPalette({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: Cmd[];
}) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = commands.filter(
    (c) =>
      c.label.toLowerCase().includes(q.toLowerCase()) ||
      c.hint.toLowerCase().includes(q.toLowerCase()) ||
      c.group.toLowerCase().includes(q.toLowerCase()),
  );

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    setSel((s) => Math.min(s, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  if (!open) return null;

  const groups = ["Navigatie", "Opdrachten", "Acties"] as const;
  const move = (d: number) => {
    if (filtered.length === 0) return;
    setSel((s) => (s + d + filtered.length) % filtered.length);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || (e.key === "j" && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp" || (e.key === "k" && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[sel];
      if (cmd) {
        cmd.run();
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  let flatIndex = -1;

  return (
    <div
      className="absolute inset-0 z-50 flex items-start justify-center px-4 pt-[8vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Commandopalet"
    >
      <button
        className="absolute inset-0 cursor-default"
        style={{ background: "rgba(6,8,12,0.72)", backdropFilter: "blur(3px)" }}
        aria-label="Palet sluiten"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        className="relative w-full max-w-[560px] overflow-hidden rounded-2xl"
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          boxShadow: `0 30px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px ${C.accentLine}`,
        }}
        onKeyDown={onKey}
      >
        {/* Zoekregel */}
        <div
          className="flex items-center gap-3 border-b px-4 py-3.5"
          style={{ borderColor: C.line }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.accent }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Typ een commando of zoek…"
            aria-label="Commando zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#5c6373]"
            style={{ color: C.ink, ...ui }}
          />
          <Kbd>ESC</Kbd>
        </div>

        {/* Resultaten */}
        <div className="max-h-[340px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ border: `1px solid ${C.line}`, background: C.panelHi }}
                aria-hidden="true"
              >
                <Search size={18} style={{ color: C.faint }} />
              </div>
              <p className="mt-3 text-[13px] font-medium" style={ui}>
                Geen commando gevonden
              </p>
              <p className="mt-1 text-[12px]" style={{ color: C.muted, ...mono }}>
                &quot;{q}&quot; — probeer een ander trefwoord
              </p>
            </div>
          ) : (
            groups.map((g) => {
              const rows = filtered.filter((c) => c.group === g);
              if (rows.length === 0) return null;
              return (
                <div key={g} className="mb-1">
                  <p
                    className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: C.faint, ...mono }}
                  >
                    {g}
                  </p>
                  {rows.map((c) => {
                    flatIndex += 1;
                    const idx = flatIndex;
                    const on = idx === sel;
                    return (
                      <button
                        key={c.id}
                        onMouseEnter={() => setSel(idx)}
                        onClick={() => {
                          c.run();
                          onClose();
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors focus-visible:outline-none"
                        style={{ background: on ? C.accentSoft : "transparent" }}
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            background: on ? "rgba(124,140,255,0.18)" : C.panelHi,
                            border: `1px solid ${on ? C.accentLine : C.line}`,
                          }}
                        >
                          <c.icon
                            size={14}
                            aria-hidden="true"
                            style={{ color: on ? C.accent : C.muted }}
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-[13px] font-medium"
                            style={{ color: on ? C.ink : C.inkSoft }}
                          >
                            {c.label}
                          </p>
                          <p className="truncate text-[11px]" style={{ color: C.muted }}>
                            {c.hint}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {c.keys.map((k) => (
                            <Kbd key={k} tone={on ? "accent" : "default"}>
                              {k}
                            </Kbd>
                          ))}
                          {on && (
                            <span className="ml-1" style={{ color: C.accent }}>
                              <CornerDownLeft size={13} aria-hidden="true" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Voetregel */}
        <div
          className="flex items-center gap-4 border-t px-4 py-2.5 text-[11px]"
          style={{ borderColor: C.line, color: C.muted, ...mono }}
        >
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigeer
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>↵</Kbd> selecteer
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <Kbd>{filtered.length}</Kbd> resultaten
          </span>
        </div>
      </div>
    </div>
  );
}

export function Concept17() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [open, setOpen] = useState(false);
  const active = OPDRACHTEN[0] as Opdracht;

  // Globale sneltoetsen: ⌘K / Ctrl+K opent, G-prefix springt naar scherm.
  const gPrefix = useRef(false);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (typing || open) return;
      if (e.key === "g" || e.key === "G") {
        gPrefix.current = true;
        window.setTimeout(() => (gPrefix.current = false), 800);
        return;
      }
      if (gPrefix.current) {
        const hit = SCREENS.find((s) => SCREEN_KEY[s.key].toLowerCase() === e.key.toLowerCase());
        if (hit) {
          setScreen(hit.key);
          gPrefix.current = false;
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const commands: Cmd[] = [
    ...SCREENS.map((s) => ({
      id: `nav-${s.key}`,
      label: `Ga naar ${s.label}`,
      hint: "Navigatie",
      group: "Navigatie" as const,
      icon: NAV_ICONS[s.key],
      keys: ["G", SCREEN_KEY[s.key]],
      run: () => setScreen(s.key),
    })),
    ...OPDRACHTEN.map((o) => ({
      id: `opd-${o.id}`,
      label: o.titel,
      hint: `${o.opdrachtgever} · ${o.match}% match`,
      group: "Opdrachten" as const,
      icon: Briefcase,
      keys: [o.id.replace("OPD-", "#")],
      run: () => setScreen("opdracht"),
    })),
    {
      id: "act-vog",
      label: "VOG vernieuwen",
      hint: "Verklaring Omtrent Gedrag aanvragen",
      group: "Acties" as const,
      icon: RefreshCw,
      keys: ["R"],
      run: () => setScreen("verificatie"),
    },
    {
      id: "act-fac",
      label: "Nieuwe factuur",
      hint: "Concept aanmaken",
      group: "Acties" as const,
      icon: Plus,
      keys: ["N"],
      run: () => setScreen("facturen"),
    },
    {
      id: "act-reageer",
      label: "Reageer op beste match",
      hint: OPDRACHTEN[0]?.titel ?? "",
      group: "Acties" as const,
      icon: Send,
      keys: ["↵"],
      run: () => setScreen("opdracht"),
    },
  ];

  return (
    <div
      className="relative min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.canvas, color: C.ink }}
    >
      {/* subtiele achtergrondgloed rond het spotlight-anker */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        style={{
          background: `radial-gradient(60% 100% at 50% 0%, ${C.accentSoft}, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative flex min-h-[680px]">
        {/* Compacte icon-rail */}
        <aside
          className="hidden w-[64px] shrink-0 flex-col items-center gap-1.5 border-r py-4 md:flex"
          style={{ borderColor: C.line, background: C.panel }}
        >
          <div
            className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl text-[15px] font-bold"
            style={{ background: C.accent, color: "#0b0d12", ...mono }}
          >
            K
          </div>
          {SCREENS.map((s) => {
            const Icon = NAV_ICONS[s.key];
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                aria-label={`${s.label} · G ${SCREEN_KEY[s.key]}`}
                title={`${s.label} — G ${SCREEN_KEY[s.key]}`}
                className="group relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c8cff]"
                style={{
                  color: on ? C.accent : C.faint,
                  background: on ? C.accentSoft : "transparent",
                  border: `1px solid ${on ? C.accentLine : "transparent"}`,
                }}
              >
                <Icon size={18} aria-hidden="true" />
                <span
                  className="absolute -bottom-0.5 right-0.5 text-[8px] font-semibold"
                  style={{ color: on ? C.accent : C.faint, ...mono }}
                  aria-hidden="true"
                >
                  {SCREEN_KEY[s.key]}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Topbar met spotlight-trigger */}
          <header
            className="flex h-16 shrink-0 items-center gap-3 border-b px-4 sm:px-6"
            style={{ borderColor: C.line }}
          >
            <div className="flex items-center gap-2 text-[12px]" style={mono}>
              <span style={{ color: C.faint }}>kanaal</span>
              <ChevronRight size={13} aria-hidden="true" style={{ color: C.faint }} />
              <span className="font-medium" style={{ color: C.accent }}>
                {screen}
              </span>
            </div>

            {/* De spotlight-trigger — hoofdnavigatie */}
            <button
              onClick={() => setOpen(true)}
              className="group mx-auto flex w-full max-w-[420px] items-center gap-3 rounded-xl px-3.5 py-2 text-[13px] transition-colors hover:border-[#31374a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c8cff]"
              style={{ border: `1px solid ${C.line}`, background: C.panel, color: C.muted }}
              aria-haspopup="dialog"
              aria-label="Commandopalet openen"
            >
              <Search size={15} aria-hidden="true" style={{ color: C.faint }} />
              <span className="flex-1 text-left">Zoek of spring naar…</span>
              <span className="flex items-center gap-1">
                <Kbd tone="accent">
                  <Command size={9} aria-hidden="true" />
                </Kbd>
                <Kbd tone="accent">K</Kbd>
              </span>
            </button>

            <button
              className="relative rounded-lg p-2 transition-colors hover:bg-[#1a1e26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c8cff]"
              style={{ border: `1px solid ${C.line}`, color: C.muted }}
              aria-label="Meldingen"
            >
              <Bell size={15} aria-hidden="true" />
              <span
                className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                style={{ background: C.accent }}
                aria-hidden="true"
              />
            </button>
          </header>

          {/* Mobiele tabs */}
          <div
            className="flex gap-1 overflow-x-auto border-b px-3 py-2 md:hidden"
            style={{ borderColor: C.line }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c8cff]"
                  style={{
                    color: on ? C.accent : C.muted,
                    background: on ? C.accentSoft : "transparent",
                    border: `1px solid ${on ? C.accentLine : "transparent"}`,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            {screen === "dashboard" && (
              <Dashboard onOpen={() => setScreen("opdracht")} onCmd={() => setOpen(true)} />
            )}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>

      <CmdPalette open={open} onClose={() => setOpen(false)} commands={commands} />
    </div>
  );
}

function SectionHead({
  kicker,
  title,
  right,
}: {
  kicker: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p
          className="text-[10.5px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: C.accent, ...mono }}
        >
          {kicker}
        </p>
        <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-tight">{title}</h1>
      </div>
      {right}
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 92;
  const h = 26;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d - min) / span) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

function Dashboard({ onOpen, onCmd }: { onOpen: () => void; onCmd: () => void }) {
  const kpiColors = [C.accent, C.cyan, C.green, C.amber];
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <SectionHead
        kicker={`Vandaag · ${PROFIEL.plaats}`}
        title={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}`}
        right={
          <button
            onClick={onCmd}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:border-[#31374a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c8cff]"
            style={{
              border: `1px solid ${C.accentLine}`,
              background: C.accentSoft,
              color: C.accent,
            }}
          >
            <Zap size={13} aria-hidden="true" /> Snelactie <Kbd tone="accent">⌘K</Kbd>
          </button>
        }
      />

      {/* KPI's */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const col = kpiColors[i % kpiColors.length] ?? C.accent;
          return (
            <Card key={k.label} className="p-4 transition-colors hover:bg-[#1a1e26]">
              <div className="flex items-center justify-between">
                <p className="text-[11px]" style={{ color: C.muted }}>
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums"
                  style={{ color: k.up ? C.green : C.amber, ...mono }}
                >
                  {k.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
              </div>
              <p
                className="mt-2.5 text-[26px] font-semibold tabular-nums leading-none tracking-tight"
                style={mono}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <Sparkline data={k.spark} color={col} />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Matches — J/K navigeerbaar */}
        <div className="lg:col-span-2">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[13.5px] font-semibold">
              <Store size={14} aria-hidden="true" style={{ color: C.accent }} /> Beste matches
            </h2>
            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: C.faint }}>
              navigeer <Kbd>J</Kbd>
              <Kbd>K</Kbd>
            </span>
          </div>
          <MatchList onOpen={onOpen} />
        </div>

        {/* Credentials */}
        <div>
          <h2 className="mb-2.5 flex items-center gap-2 text-[13.5px] font-semibold">
            <ShieldCheck size={14} aria-hidden="true" style={{ color: C.accent }} /> Credentials
          </h2>
          <Card className="p-4">
            <div className="space-y-2.5">
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div key={c.naam} className="rounded-lg p-2.5" style={{ background: C.panelHi }}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12.5px] font-medium leading-snug">{c.naam}</p>
                      <span
                        className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold"
                        style={{ color: st.fg, background: st.bg, ...mono }}
                      >
                        {st.label}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px]" style={{ color: C.muted }}>
                      {c.detail}
                    </p>
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

// Herbruikbare J/K-navigeerbare lijst van opdrachten
function MatchList({ onOpen }: { onOpen: () => void }) {
  const [cur, setCur] = useState(0);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "j" || e.key === "ArrowDown") {
      e.preventDefault();
      setCur((c) => Math.min(OPDRACHTEN.length - 1, c + 1));
    } else if (e.key === "k" || e.key === "ArrowUp") {
      e.preventDefault();
      setCur((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      onOpen();
    }
  };
  return (
    <Card className="overflow-hidden">
      <ul
        role="listbox"
        aria-label="Beste matches"
        tabIndex={0}
        onKeyDown={onKey}
        className="divide-y focus-visible:outline-none"
        style={{ borderColor: C.line }}
      >
        {OPDRACHTEN.map((o, i) => {
          const on = i === cur;
          return (
            <li key={o.id} role="option" aria-selected={on}>
              <button
                onClick={() => {
                  setCur(i);
                  onOpen();
                }}
                onMouseEnter={() => setCur(i)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none"
                style={{ background: on ? C.accentSoft : "transparent" }}
              >
                <span
                  className="w-6 text-center text-[11px] tabular-nums"
                  style={{ color: on ? C.accent : C.faint, ...mono }}
                  aria-hidden="true"
                >
                  {on ? "›" : String(i + 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{o.titel}</p>
                  <p
                    className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px]"
                    style={{ color: C.muted }}
                  >
                    <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                  </p>
                </div>
                <span
                  className="hidden text-[12px] tabular-nums sm:inline"
                  style={{ color: C.inkSoft, ...mono }}
                >
                  {o.tarief.replace(" / uur", "")}
                </span>
                <span
                  className="rounded-md px-2 py-0.5 text-[12px] font-semibold tabular-nums"
                  style={{ color: C.accent, background: C.accentSoft, ...mono }}
                >
                  {o.match}%
                </span>
                {on && <Kbd tone="accent">↵</Kbd>}
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <SectionHead kicker="Marktplaats" title="Open opdrachten" />

      <div
        className="flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors focus-within:border-[#31374a]"
        style={{ border: `1px solid ${C.line}`, background: C.panel }}
      >
        <Search size={15} aria-hidden="true" style={{ color: C.accent }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten filteren"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#5c6373]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ border: `1px solid ${C.line}`, background: C.panelHi }}
            aria-hidden="true"
          >
            <Search size={20} style={{ color: C.faint }} />
          </div>
          <p className="mt-4 text-[14px] font-semibold">Geen opdrachten gevonden</p>
          <p className="mx-auto mt-1.5 max-w-xs text-[12.5px]" style={{ color: C.muted, ...mono }}>
            0 rijen voor &quot;{q}&quot; — pas je filter aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-medium transition-colors hover:bg-[#1a1e26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c8cff]"
            style={{ border: `1px solid ${C.accentLine}`, color: C.accent }}
          >
            Filter wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group rounded-xl p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#31374a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c8cff]"
              style={{ border: `1px solid ${C.line}`, background: C.panel }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] tracking-wide" style={{ color: C.faint, ...mono }}>
                  {o.id}
                </span>
                <span
                  className="rounded-md px-2 py-0.5 text-[11.5px] font-semibold tabular-nums"
                  style={{ color: C.accent, background: C.accentSoft, ...mono }}
                >
                  {o.match}%
                </span>
              </div>
              <p className="mt-2 text-[14.5px] font-semibold leading-snug">{o.titel}</p>
              <p
                className="mt-1.5 flex items-center gap-1.5 text-[12px]"
                style={{ color: C.muted }}
              >
                <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded px-2 py-0.5 text-[10.5px]"
                    style={{
                      color: C.inkSoft,
                      background: C.panelHi,
                      border: `1px solid ${C.line}`,
                      ...mono,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-3.5 flex items-center justify-between border-t pt-3 text-[12.5px]"
                style={{ borderColor: C.line, ...mono }}
              >
                <span className="font-medium tabular-nums" style={{ color: C.ink }}>
                  {o.tarief}
                </span>
                <span className="tabular-nums" style={{ color: C.muted }}>
                  {o.uren}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <SectionHead
        kicker={opdracht.id}
        title={opdracht.titel}
        right={
          <button
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c8cff]"
            style={{ background: C.accent, color: "#0b0d12" }}
          >
            <Send size={14} aria-hidden="true" /> Reageer <Kbd>↵</Kbd>
          </button>
        }
      />
      <p className="flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
        <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
      </p>

      <div
        className="grid grid-cols-2 gap-px overflow-hidden rounded-xl sm:grid-cols-4"
        style={{ background: C.line, border: `1px solid ${C.line}` }}
      >
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div key={m.l} className="p-4" style={{ background: C.panel }}>
            <p
              className="text-[10.5px] uppercase tracking-[0.1em]"
              style={{ color: C.muted, ...mono }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[16px] font-semibold tabular-nums tracking-tight"
              style={mono}
            >
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold">
          <Zap size={15} aria-hidden="true" style={{ color: C.accent }} /> Waarom deze match
        </h3>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je geverifieerde profiel.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.green, ...mono }}
            >
              Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <Check size={15} aria-hidden="true" style={{ color: C.green, marginTop: 1 }} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.amber, ...mono }}
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
                  <Minus size={15} aria-hidden="true" style={{ color: C.amber, marginTop: 1 }} />
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

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <SectionHead kicker="Vertrouwen" title="Verificatie" />

      <Card className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
          style={{ background: C.accentSoft, border: `1px solid ${C.accentLine}` }}
        >
          <ShieldCheck size={26} aria-hidden="true" style={{ color: C.accent }} />
        </div>
        <div className="flex-1">
          <p className="text-[16px] font-semibold">{PROFIEL.trust}</p>
          <p className="text-[12.5px]" style={{ color: C.muted }}>
            <span style={mono}>{verified}</span> van <span style={mono}>{CREDENTIALS.length}</span>{" "}
            credentials geverifieerd · <span style={{ color: C.amber }}>1 vraagt actie</span>
          </p>
        </div>
        <div className="flex items-end gap-1" aria-hidden="true">
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            return (
              <span
                key={c.naam}
                className="w-2 rounded-full"
                style={{ height: c.status === "VERIFIED" ? 30 : 16, background: st.fg }}
              />
            );
          })}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="divide-y" style={{ borderColor: C.line }}>
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            const Icon =
              c.status === "VERIFIED" ? Check : c.status === "SUBMITTED" ? Clock : AlertTriangle;
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#1a1e26]"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: st.bg, border: `1px solid ${st.fg}33` }}
                >
                  <Icon size={16} aria-hidden="true" style={{ color: st.fg }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium">{c.naam}</p>
                  <p className="text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="rounded px-2 py-1 text-[10px] font-semibold"
                  style={{ color: st.fg, background: st.bg, ...mono }}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; bg: string; Icon: LucideIcon }> = {
    warning: { fg: C.amber, bg: "rgba(251,191,36,0.12)", Icon: AlertTriangle },
    info: { fg: C.accent, bg: C.accentSoft, Icon: Zap },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <SectionHead kicker="Aandacht" title="Volgende acties" />
      <div className="space-y-2.5">
        {ACTIES.map((a) => {
          const t = tone[a.urgentie];
          return (
            <Card
              key={a.titel}
              className="flex items-start gap-4 p-4 transition-colors hover:bg-[#1a1e26]"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: t.bg, border: `1px solid ${t.fg}33` }}
              >
                <t.Icon size={17} aria-hidden="true" style={{ color: t.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-[#20242e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c8cff]"
                style={{ border: `1px solid ${C.line}`, color: C.ink }}
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

function Facturen() {
  const statusTone: Record<string, string> = {
    Betaald: C.green,
    Openstaand: C.amber,
    Concept: C.muted,
  };
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <SectionHead
        kicker="Omzet"
        title="Facturen"
        right={
          <button
            className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c8cff]"
            style={{ background: C.accent, color: "#0b0d12" }}
          >
            <Plus size={14} aria-hidden="true" /> Nieuwe factuur <Kbd>N</Kbd>
          </button>
        }
      />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="border-b text-[10.5px] uppercase tracking-[0.12em]"
                style={{ borderColor: C.line, color: C.faint, ...mono }}
              >
                <th className="px-5 py-3 font-medium">Nummer</th>
                <th className="px-5 py-3 font-medium">Klant</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Datum</th>
                <th className="px-5 py-3 text-right font-medium">Bedrag</th>
                <th className="px-5 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => (
                <tr
                  key={f.nr}
                  className="border-b transition-colors last:border-0 hover:bg-[#1a1e26]"
                  style={{ borderColor: C.line }}
                >
                  <td
                    className="px-5 py-3.5 text-[12.5px] tabular-nums"
                    style={{ color: C.inkSoft, ...mono }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-5 py-3.5 text-[13px]">{f.klant}</td>
                  <td
                    className="hidden px-5 py-3.5 text-[12.5px] tabular-nums sm:table-cell"
                    style={{ color: C.muted, ...mono }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-5 py-3.5 text-right text-[13px] font-medium tabular-nums"
                    style={mono}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 text-[11.5px] font-medium"
                      style={{ color: statusTone[f.status] ?? C.muted }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: statusTone[f.status] ?? C.muted }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
