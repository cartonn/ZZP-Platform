"use client";

// Concept 201 — "Sneltoets" · keyboard-first command deck in de geest van Superhuman / Linear / Raycast (2026).
// Alles is bereikbaar met het toetsenbord: een permanent zichtbare ⌘K-hint, monospace kbd-chips op elke actie,
// en een echte werkende command-palette-overlay met fuzzy-lijst + J/K-navigatie die de scherm-switch aanstuurt.
// Koele donkere neutrals, één scherp accent, sterke focus-ring-navigatie. Deterministisch, UI Nederlands.
// Fonts: Geist (tekst) + JetBrains Mono (hotkeys/cijfers) + Space Grotesk (display).

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  XCircle,
  Search,
  ShieldCheck,
  Command,
  CornerDownLeft,
  MapPin,
  Coins,
  CalendarDays,
  TriangleAlert,
  ChevronRight,
  BadgeCheck,
  LayoutDashboard,
  Store,
  Briefcase,
  ListChecks,
  Receipt,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — command-deck: diepe inkt, koele neutrals, één elektrisch cyaan-accent ──
const C = {
  bg: "#0b0e14",
  bgSoft: "#0f131c",
  panel: "#141926",
  panelHi: "#1b2130",
  line: "#232a3a",
  lineSoft: "#1a2130",
  ink: "#eaeef6",
  inkSoft: "#9aa6bd",
  inkFaint: "#5f6b83",
  accent: "#4de3d0",
  accentDeep: "#1fb9a6",
  onAccent: "#04231f",
  kbdBg: "#0c1017",
  kbdLine: "#2a3346",
  ok: "#3ddc84",
  okBg: "#10241c",
  wait: "#5aa9ff",
  waitBg: "#12233c",
  warn: "#f5b544",
  warnBg: "#2a2110",
  bad: "#ff6b6b",
  badBg: "#2a1417",
};

const display = { fontFamily: "var(--font-lab-space)" };
const bodyF = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// ── Kbd-chip — monospace toets-hint, overal herbruikt ──
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-flex min-w-[1.35rem] items-center justify-center rounded-[5px] px-1.5 py-0.5 text-[10.5px] font-semibold leading-none"
      style={{
        ...mono,
        background: C.kbdBg,
        color: C.inkSoft,
        boxShadow: `inset 0 0 0 1px ${C.kbdLine}`,
      }}
    >
      {children}
    </kbd>
  );
}

// ── Status-model — vorm + icoon dragen mee, nooit kleur alleen ──
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.ok, bg: C.okBg };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.wait, bg: C.waitBg };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.warn, bg: C.warnBg };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.bad, bg: C.badBg };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 1px ${m.fg}44` }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

const SCREEN_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: Receipt,
  berichten: Receipt,
};

// Deterministische hotkey-hints per scherm (G+<letter>-stijl, Linear-navigatie).
const SCREEN_HOTKEY: Partial<Record<ScreenKey, string>> = {
  dashboard: "D",
  marktplaats: "M",
  opdracht: "O",
  verificatie: "V",
  acties: "A",
  facturen: "F",
};

type Cmd = { key: string; label: string; hint: string; Icon: LucideIcon; screen: ScreenKey };
const COMMANDS: Cmd[] = SCREENS.map((s) => ({
  key: s.key,
  label: `Ga naar ${s.label}`,
  hint: `G ${SCREEN_HOTKEY[s.key] ?? ""}`.trim(),
  Icon: SCREEN_ICONS[s.key],
  screen: s.key,
}));

// ── Command-palette-overlay — echte fuzzy-lijst + J/K-navigatie ──
function Palette({ onClose, onGo }: { onClose: () => void; onGo: (s: ScreenKey) => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = COMMANDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    if (sel >= filtered.length) setSel(Math.max(0, filtered.length - 1));
  }, [filtered.length, sel]);

  const run = (i: number) => {
    const cmd = filtered[i];
    if (cmd) {
      onGo(cmd.screen);
      onClose();
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowDown" || (e.key === "j" && e.ctrlKey)) {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp" || (e.key === "k" && e.ctrlKey)) {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(sel);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      style={{ background: "rgba(4,6,11,0.72)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Opdrachtenpalet"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl"
        style={{
          background: C.panel,
          boxShadow: `0 30px 80px -20px #000, inset 0 0 0 1px ${C.line}`,
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKey}
      >
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <Search size={17} style={{ color: C.accent }} aria-hidden="true" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            placeholder="Typ een opdracht of ga naar een scherm…"
            aria-label="Opdracht zoeken"
            className="flex-1 bg-transparent text-[14px] outline-none placeholder:opacity-50"
            style={{ ...bodyF, color: C.ink }}
          />
          <Kbd>esc</Kbd>
        </div>
        <ul className="max-h-[46vh] overflow-y-auto p-2" role="listbox" aria-label="Opdrachten">
          {filtered.length === 0 ? (
            <li
              className="px-3 py-8 text-center text-[13px]"
              style={{ ...bodyF, color: C.inkFaint }}
            >
              Geen opdracht gevonden voor &ldquo;{q}&rdquo;.
            </li>
          ) : (
            filtered.map((c, i) => {
              const on = i === sel;
              return (
                <li key={c.key} role="option" aria-selected={on}>
                  <button
                    onMouseEnter={() => setSel(i)}
                    onClick={() => run(i)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-none"
                    style={{
                      background: on ? C.panelHi : "transparent",
                      boxShadow: on ? `inset 0 0 0 1px ${C.accent}55` : "none",
                    }}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                      style={{
                        background: on ? C.accent : C.kbdBg,
                        color: on ? C.onAccent : C.inkSoft,
                      }}
                      aria-hidden="true"
                    >
                      <c.Icon size={15} strokeWidth={2} />
                    </span>
                    <span
                      className="flex-1 text-[13.5px] font-medium"
                      style={{ ...bodyF, color: C.ink }}
                    >
                      {c.label}
                    </span>
                    <Kbd>{c.hint}</Kbd>
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <div
          className="flex items-center justify-between px-4 py-2.5 text-[10.5px]"
          style={{ ...mono, borderTop: `1px solid ${C.line}`, color: C.inkFaint }}
        >
          <span className="flex items-center gap-2">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigeer <span className="opacity-50">·</span> <Kbd>⏎</Kbd> open
          </span>
          <span className="flex items-center gap-1.5">
            <Command size={11} aria-hidden="true" /> opdrachtenpalet
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Root ──
export function Concept201() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [open, setOpen] = useState(false);
  const active = OPDRACHTEN[0] as Opdracht;

  // ⌘K / Ctrl+K opent het palet; overige toetsen zijn per-scherm gedocumenteerd via kbd-chips.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {open && <Palette onClose={() => setOpen(false)} onGo={setScreen} />}

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col md:flex-row">
        {/* Zij-rail — schermnavigatie met kbd-hint per item */}
        <aside
          className="shrink-0 md:w-60"
          style={{ borderRight: `1px solid ${C.line}`, background: C.bgSoft }}
        >
          <div
            className="flex items-center gap-2.5 px-4 py-4"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: C.accent, color: C.onAccent }}
              aria-hidden="true"
            >
              <Zap size={18} strokeWidth={2.4} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.28em]"
                style={{ ...mono, color: C.accent }}
              >
                Sneltoets
              </div>
              <div
                className="text-[15px] font-semibold tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                Command Deck
              </div>
            </div>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="mx-3 mt-3 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              background: C.panel,
              boxShadow: `inset 0 0 0 1px ${C.line}`,
              ["--tw-ring-color" as string]: C.accent,
            }}
            aria-label="Open opdrachtenpalet"
          >
            <Search size={14} style={{ color: C.inkFaint }} aria-hidden="true" />
            <span className="flex-1 text-[12.5px]" style={{ ...bodyF, color: C.inkFaint }}>
              Zoek of spring…
            </span>
            <span className="flex items-center gap-0.5">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>

          <nav
            className="mt-3 flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              const Icon = SCREEN_ICONS[s.key];
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    background: on ? C.panelHi : "transparent",
                    boxShadow: on ? `inset 0 0 0 1px ${C.accent}44` : "none",
                    ["--tw-ring-color" as string]: C.accent,
                  }}
                >
                  <Icon
                    size={15}
                    strokeWidth={2}
                    style={{ color: on ? C.accent : C.inkFaint }}
                    aria-hidden="true"
                  />
                  <span
                    className="flex-1 text-[13px] font-medium"
                    style={{ ...bodyF, color: on ? C.ink : C.inkSoft }}
                  >
                    {s.label}
                  </span>
                  <span className="hidden md:inline-flex">
                    <Kbd>{SCREEN_HOTKEY[s.key]}</Kbd>
                  </span>
                </button>
              );
            })}
          </nav>

          <div
            className="mt-auto hidden px-4 py-4 md:block"
            style={{ borderTop: `1px solid ${C.line}` }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  ...mono,
                  background: C.panelHi,
                  color: C.accent,
                  boxShadow: `inset 0 0 0 1px ${C.line}`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0 leading-tight">
                <div
                  className="truncate text-[12.5px] font-semibold"
                  style={{ ...bodyF, color: C.ink }}
                >
                  {PROFIEL.naam}
                </div>
                <div className="truncate text-[10.5px]" style={{ ...bodyF, color: C.inkFaint }}>
                  {PROFIEL.plaats}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Hoofdvlak */}
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          {screen === "dashboard" && (
            <Dashboard onOpen={() => setScreen("opdracht")} onPalette={() => setOpen(true)} />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>
    </div>
  );
}

// Kaart-primitief
function Panel({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.line}`, ...style }}
    >
      {children}
    </div>
  );
}

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[18px] font-semibold tracking-tight" style={{ ...display, color: C.ink }}>
        {title}
      </h2>
      {sub && (
        <p className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkFaint }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-t-[2px]"
          style={{
            height: `${Math.max(12, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.accent : C.panelHi,
          }}
        />
      ))}
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// ── Dashboard ──
function Dashboard({ onOpen, onPalette }: { onOpen: () => void; onPalette: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-[24px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}
          </h1>
          <p className="mt-1 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Alles met het toetsenbord — druk <Kbd>⌘</Kbd> <Kbd>K</Kbd> om te springen.
          </p>
        </div>
        <button
          onClick={onPalette}
          className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.accent,
            color: C.onAccent,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Command size={14} aria-hidden="true" /> Opdrachtenpalet
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...mono,
                  background: k.up ? C.okBg : C.panelHi,
                  color: k.up ? C.ok : C.inkSoft,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[24px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section>
          <SectionHead title="Aanbevolen matches" sub="Selecteer met J / K, open met ⏎" />
          <div className="space-y-2.5">
            {OPDRACHTEN.map((o, i) => (
              <Panel key={o.id}>
                <button
                  onClick={onOpen}
                  className="group flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.accent }}
                >
                  <span
                    className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg"
                    style={{ background: C.panelHi, boxShadow: `inset 0 0 0 1px ${C.line}` }}
                    aria-hidden="true"
                  >
                    <span
                      className="text-[15px] font-semibold tabular-nums leading-none"
                      style={{ ...mono, color: C.accent }}
                    >
                      {o.match}
                    </span>
                    <span
                      className="text-[7px] font-semibold uppercase tracking-[0.1em]"
                      style={{ ...mono, color: C.inkFaint }}
                    >
                      match
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[15px] font-semibold tracking-tight"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[12.5px]"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]"
                          style={{ ...bodyF, background: C.panelHi, color: C.inkSoft }}
                        >
                          <Check
                            size={11}
                            strokeWidth={2.6}
                            style={{ color: C.ok }}
                            aria-hidden="true"
                          />{" "}
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="hidden sm:inline-flex">
                      <Kbd>{i + 1}</Kbd>
                    </span>
                    <ChevronRight size={17} style={{ color: C.inkFaint }} aria-hidden="true" />
                  </span>
                </button>
              </Panel>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <SectionHead title="Vertrouwen" sub="Certificaat-dekking" />
            <Panel className="p-5">
              <div className="flex items-center gap-4">
                <StatusTag status="VERIFIED" />
                <span
                  className="text-[13px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {verified}/{CREDENTIALS.length}
                </span>
              </div>
              <p
                className="mt-3 text-[12.5px] leading-relaxed"
                style={{ ...bodyF, color: C.inkSoft }}
              >
                Opdrachtgevers zien enkel geverifieerde documenten. Houd je dekking hoog.
              </p>
            </Panel>
          </div>
          <Panel
            className="p-5"
            style={{ boxShadow: `inset 0 0 0 1px ${C.warn}44`, background: C.warnBg }}
          >
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold"
              style={{ ...bodyF, color: C.warn }}
            >
              <TriangleAlert size={13} strokeWidth={2.4} aria-hidden="true" /> Urgent
            </span>
            <h3
              className="mt-2 text-[16px] font-semibold tracking-tight"
              style={{ ...display, color: C.ink }}
            >
              {warn.titel}
            </h3>
            <p
              className="mt-1 text-[12.5px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              {warn.detail}
            </p>
            <button
              className="mt-3 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: C.warn,
                color: "#231803",
                ["--tw-ring-color" as string]: C.warn,
                ["--tw-ring-offset-color" as string]: C.warnBg,
              }}
            >
              {warn.cta} <ArrowRight size={13} aria-hidden="true" />
            </button>
          </Panel>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — met zoek-empty-state ──
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Marktplaats" sub="Open opdrachten" />
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.line}` }}
        >
          <Search size={15} style={{ color: C.accent }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter opdrachten…"
            aria-label="Opdrachten filteren"
            className="w-40 bg-transparent text-[12.5px] outline-none placeholder:opacity-50"
            style={{ ...bodyF, color: C.ink }}
          />
          <Kbd>/</Kbd>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.panelHi, boxShadow: `inset 0 0 0 1px ${C.line}` }}
            aria-hidden="true"
          >
            <Search size={26} strokeWidth={1.6} style={{ color: C.inkFaint }} />
          </span>
          <p
            className="text-[17px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Geen opdracht gevonden
          </p>
          <p className="max-w-xs text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
            Niets voor &ldquo;{q}&rdquo;. Wis het filter en probeer opnieuw.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-lg px-3.5 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...bodyF,
              background: C.accent,
              color: C.onAccent,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            Filter wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Panel key={o.id} className="flex flex-col">
              <div className="flex items-center gap-3 p-4">
                <span
                  className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg"
                  style={{ background: C.panelHi, boxShadow: `inset 0 0 0 1px ${C.line}` }}
                  aria-hidden="true"
                >
                  <span
                    className="text-[14px] font-semibold tabular-nums leading-none"
                    style={{ ...mono, color: C.accent }}
                  >
                    {o.match}
                  </span>
                </span>
                <div className="min-w-0">
                  <h3
                    className="text-[15px] font-semibold leading-tight tracking-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <dl className="grid grid-cols-2 gap-y-2 text-[12px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.accent,
                  ["--tw-ring-color" as string]: C.accent,
                }}
              >
                Open <CornerDownLeft size={13} aria-hidden="true" />
              </button>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ──
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.panel,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.accent,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug <Kbd>esc</Kbd>
      </button>

      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <span
              className="rounded px-2 py-1 text-[11px] font-semibold"
              style={{ ...mono, background: C.panelHi, color: C.accent }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 text-[26px] font-semibold leading-tight tracking-tight"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-1.5 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <span
            className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl"
            style={{ background: C.panelHi, boxShadow: `inset 0 0 0 1px ${C.accent}55` }}
            aria-hidden="true"
          >
            <span
              className="text-[22px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.accent }}
            >
              {opdracht.match}
            </span>
            <span
              className="text-[8px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              match
            </span>
          </span>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((f) => (
          <Panel key={f.l} className="p-4">
            <f.Icon size={15} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
            <div
              className="mt-2 text-[16px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel className="p-5">
          <h3
            className="mb-3 text-[14px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Waarom dit past
          </h3>
          <ul className="space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px] leading-snug"
                style={{ ...bodyF, color: C.ink }}
              >
                <Check
                  size={15}
                  strokeWidth={2.6}
                  style={{ color: C.ok }}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />{" "}
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-5">
          <h3
            className="mb-3 text-[14px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Om te overwegen
          </h3>
          <ul className="space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px] leading-snug"
                style={{ ...bodyF, color: C.ink }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.4}
                  style={{ color: C.warn }}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />{" "}
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <button
        className="flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.accent,
          color: C.onAccent,
          ["--tw-ring-color" as string]: C.accent,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        Reageer op deze opdracht <Kbd>R</Kbd>
      </button>
    </div>
  );
}

// ── Verificatie ──
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <SectionHead title="Verificatie" sub="Certificaten en documenten" />
      <Panel className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold" style={{ ...bodyF, color: C.ink }}>
              Dekking geverifieerd
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
              {verified} van {CREDENTIALS.length} certificaten
            </p>
          </div>
          <span
            className="text-[28px] font-semibold tabular-nums"
            style={{ ...mono, color: C.accent }}
          >
            {dek}%
          </span>
        </div>
        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full"
          style={{ background: C.panelHi }}
          aria-hidden="true"
        >
          <div className="h-full rounded-full" style={{ width: `${dek}%`, background: C.accent }} />
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          return (
            <Panel key={c.naam} className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                style={{ background: m.bg, boxShadow: `inset 0 0 0 1px ${m.fg}44` }}
                aria-hidden="true"
              >
                <m.Icon size={19} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14px] font-semibold tracking-tight"
                  style={{ ...display, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2">
                  <StatusTag status={c.status} />
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties ──
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-5">
      <SectionHead title="Volgende beste acties" sub="Op urgentie — pak de bovenste eerst" />
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Panel className="flex items-stretch overflow-hidden">
                <span
                  className="w-1 shrink-0"
                  style={{ background: warn ? C.warn : C.accent }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-4">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[14px] font-semibold tabular-nums"
                    style={{
                      ...mono,
                      background: warn ? C.warnBg : C.panelHi,
                      color: warn ? C.warn : C.accent,
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={17} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                        style={{
                          ...mono,
                          background: warn ? C.warnBg : C.waitBg,
                          color: warn ? C.warn : C.wait,
                        }}
                      >
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[15px] font-semibold tracking-tight"
                        style={{ ...display, color: C.ink }}
                      >
                        {a.titel}
                      </h3>
                    </div>
                    <p
                      className="mt-1 text-[12.5px] leading-relaxed"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <button
                    className="hidden shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 sm:inline-flex"
                    style={{
                      ...bodyF,
                      background: warn ? C.warn : C.panelHi,
                      color: warn ? "#231803" : C.ink,
                      boxShadow: warn ? "none" : `inset 0 0 0 1px ${C.line}`,
                      ["--tw-ring-color" as string]: C.accent,
                    }}
                  >
                    {a.cta} <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ──
function Facturen() {
  const factMeta = (s: string) => {
    if (s === "Betaald") return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okBg };
    if (s === "Openstaand") return { label: "Openstaand", Icon: Clock, fg: C.warn, bg: C.warnBg };
    return { label: "Concept", Icon: Receipt, fg: C.inkSoft, bg: C.panelHi };
  };
  const betaald = "€ 8.622";
  return (
    <div className="space-y-5">
      <SectionHead title="Facturen" sub="Omzet en openstaand" />
      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.panelHi }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...mono, color: C.inkFaint }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const m = factMeta(f.status);
                return (
                  <tr key={f.nr} style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}>
                    <td
                      className="px-4 py-3 text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold"
                        style={{
                          ...bodyF,
                          background: m.bg,
                          color: m.fg,
                          boxShadow: `inset 0 0 0 1px ${m.fg}44`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[14px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.panelHi }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[15px] font-bold tabular-nums"
                  style={{ ...mono, color: C.accent }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </div>
  );
}
