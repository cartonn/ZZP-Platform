"use client";

// Concept 151 — "Fosfor" · groen fosfor-CRT-terminal, command-line-first. Monochroom groen
// (#00ff9c / #14ff72) op bijna-zwart (#0a0f0b), subtiele scanline-overlay + glow, knipperende
// block-cursor via CSS keyframes (NIET random/Date). Alles voelt als een levend terminal-OS: een
// prominent commandopalet (⌘K) met commando's ("match zoeken", "verificatie openen"), prompts,
// ASCII-achtige meters en output-blokken. Onderscheidend van teletekst (kleurige NL-blokken): dit
// is een strikt groene terminal met glow en scanlines. Deterministisch. Monospace-type
// (IBM Plex Mono + Space Grotesk voor koppen). Status nooit kleur-alleen: label + glyph + icoon.

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  Terminal,
  Command,
  CornerDownLeft,
  ChevronRight,
  MapPin,
  Coins,
  CalendarDays,
  FileText,
  Zap,
  Plus,
  Mail,
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

// ── Palet — fosfor-groen op bijna-zwart ──────────────────────────────────────────
const C = {
  bg: "#0a0f0b",
  bgPanel: "#0d150f",
  bgDeep: "#070b08",
  green: "#00ff9c",
  greenBright: "#14ff72",
  greenDim: "#2f9d6f",
  greenFaint: "#1a5c40",
  greenGhost: "rgba(0,255,156,0.08)",
  amber: "#ffcc4d",
  red: "#ff5d6c",
  line: "rgba(0,255,156,0.16)",
  lineSoft: "rgba(0,255,156,0.08)",
};

const mono = { fontFamily: "var(--font-lab-plex-mono)" };
const disp = { fontFamily: "var(--font-lab-space)" };

const glow = { textShadow: `0 0 6px rgba(0,255,156,0.55), 0 0 18px rgba(0,255,156,0.20)` };
const glowSoft = { textShadow: `0 0 4px rgba(0,255,156,0.35)` };

// ── Status-model — glyph + icoon + label, nooit kleur-alleen ──────────────────────
type StatusStyle = {
  label: string;
  Icon: LucideIcon;
  glyph: string;
  color: string;
};
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, glyph: "[OK]", color: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, glyph: "[..]", color: C.greenDim };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, glyph: "[!!]", color: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, glyph: "[XX]", color: C.red };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
      style={{
        ...mono,
        color: m.color,
        border: `1px solid ${m.color}`,
        background: "rgba(0,255,156,0.04)",
      }}
    >
      <span aria-hidden="true" style={{ letterSpacing: 0 }}>
        {m.glyph}
      </span>
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Terminal-block-cursor (CSS keyframes, deterministisch) ────────────────────────
function Cursor() {
  return (
    <span
      aria-hidden="true"
      className="fosfor-cursor ml-0.5 inline-block h-[1.05em] w-[0.55em] translate-y-[0.12em]"
      style={{ background: C.green, boxShadow: `0 0 6px ${C.green}` }}
    />
  );
}

// Prompt-regel — "zzp@fosfor:~$ <cmd>"
function Prompt({
  path = "~",
  cmd,
  cursor = false,
}: {
  path?: string;
  cmd: string;
  cursor?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 text-[12.5px]" style={mono}>
      <span style={{ color: C.greenDim }}>zzp@fosfor</span>
      <span style={{ color: C.greenFaint }}>:{path}$</span>
      <span style={{ color: C.greenBright, ...glowSoft }}>{cmd}</span>
      {cursor && <Cursor />}
    </div>
  );
}

// Panel met terminal-frame + hoekmarkeringen.
function Panel({
  children,
  title,
  className = "",
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <section
      className={`relative ${className}`}
      style={{ background: C.bgPanel, border: `1px solid ${C.line}` }}
    >
      {title && (
        <div
          className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ ...mono, color: C.greenDim, borderBottom: `1px solid ${C.lineSoft}` }}
        >
          <ChevronRight size={12} aria-hidden="true" />
          {title}
        </div>
      )}
      {children}
    </section>
  );
}

// ASCII-achtige meter: ▓▓▓▓░░░░
function AsciiMeter({ pct, width = 16 }: { pct: number; width?: number }) {
  const filled = Math.round((pct / 100) * width);
  return (
    <span aria-hidden="true" className="text-[13px] tracking-[0.06em]" style={mono}>
      <span style={{ color: C.green, ...glowSoft }}>{"▓".repeat(filled)}</span>
      <span style={{ color: C.greenFaint }}>{"░".repeat(Math.max(0, width - filled))}</span>
    </span>
  );
}

// Sparkline in fosfor-blokjes.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const chars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
  return (
    <span
      aria-hidden="true"
      className="text-[15px] leading-none"
      style={{ ...mono, color: C.green }}
    >
      {data.map((v, i) => {
        const idx =
          max === min ? 4 : Math.min(7, Math.round(((v - min) / (max - min)) * (chars.length - 1)));
        return <span key={i}>{chars[idx]}</span>;
      })}
    </span>
  );
}

function matchGlyph(m: number): string {
  return m >= 90 ? "★" : m >= 85 ? "◆" : "◇";
}

// ── Commandopalet (⌘K) — command-line-first ──────────────────────────────────────
type Cmd = { id: string; label: string; hint: string; target: ScreenKey; Icon: LucideIcon };
const COMMANDS: Cmd[] = [
  {
    id: "match",
    label: "match zoeken",
    hint: "open marktplaats",
    target: "marktplaats",
    Icon: Search,
  },
  {
    id: "verif",
    label: "verificatie openen",
    hint: "certificaten",
    target: "verificatie",
    Icon: ShieldCheck,
  },
  { id: "acties", label: "acties tonen", hint: "next-action", target: "acties", Icon: Zap },
  { id: "opdracht", label: "opdracht openen", hint: "detail", target: "opdracht", Icon: FileText },
  { id: "facturen", label: "facturen tonen", hint: "omzet", target: "facturen", Icon: Coins },
  { id: "berichten", label: "berichten lezen", hint: "inbox", target: "berichten", Icon: Mail },
  {
    id: "dashboard",
    label: "dashboard tonen",
    hint: "overzicht",
    target: "dashboard",
    Icon: Terminal,
  },
];

function CommandPalette({
  open,
  onClose,
  onRun,
}: {
  open: boolean;
  onClose: () => void;
  onRun: (t: ScreenKey) => void;
}) {
  const [q, setQ] = useState("");
  if (!open) return null;
  const filtered = COMMANDS.filter(
    (c) => c.label.includes(q.toLowerCase()) || c.hint.includes(q.toLowerCase()),
  );
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      style={{ background: "rgba(5,8,6,0.72)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Commandopalet"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg"
        style={{
          background: C.bgDeep,
          border: `1px solid ${C.green}`,
          boxShadow: `0 0 40px rgba(0,255,156,0.18)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-2 px-3 py-3"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <span style={{ color: C.greenDim, ...mono }} className="text-[13px]">
            &gt;
          </span>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="typ een commando…"
            aria-label="Commando zoeken"
            className="flex-1 bg-transparent text-[13.5px] outline-none placeholder:opacity-50"
            style={{ ...mono, color: C.greenBright }}
          />
          <span
            className="px-1.5 py-0.5 text-[10px]"
            style={{ ...mono, color: C.greenDim, border: `1px solid ${C.line}` }}
          >
            ESC
          </span>
        </div>
        {filtered.length === 0 ? (
          <div
            className="px-4 py-8 text-center text-[12.5px]"
            style={{ ...mono, color: C.greenDim }}
          >
            geen commando gevonden voor &quot;{q}&quot;
          </div>
        ) : (
          <ul className="max-h-[46vh] overflow-y-auto py-1">
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => {
                    onRun(c.target);
                    onClose();
                  }}
                  className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[rgba(0,255,156,0.08)] focus-visible:bg-[rgba(0,255,156,0.10)] focus-visible:outline-none"
                >
                  <c.Icon size={15} style={{ color: C.greenDim }} aria-hidden="true" />
                  <span className="flex-1 text-[13px]" style={{ ...mono, color: C.green }}>
                    {c.label}
                  </span>
                  <span className="text-[11px]" style={{ ...mono, color: C.greenFaint }}>
                    {c.hint}
                  </span>
                  <CornerDownLeft
                    size={13}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: C.greenDim }}
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept151() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [palette, setPalette] = useState(false);
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...mono, background: C.bg, color: C.green }}
    >
      {/* CRT-scanline + vignet-overlay (decoratief, tekstvrij) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.20) 0 1px, transparent 1px 3px)",
          mixBlendMode: "multiply",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-40"
        style={{
          background: "radial-gradient(120% 90% at 50% 0%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {/* Deterministische keyframes voor cursor + subtiele scanline-drift */}
      <style>{`
        @keyframes fosforBlink { 0%,49% { opacity: 1 } 50%,100% { opacity: 0 } }
        .fosfor-cursor { animation: fosforBlink 1.06s steps(1) infinite; }
      `}</style>

      {/* Terminal-titelbalk */}
      <header
        className="sticky top-0 z-30 flex flex-wrap items-center gap-3 px-4 py-2.5 md:px-6"
        style={{ background: C.bgDeep, borderBottom: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: C.red }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: C.amber }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: C.green }} />
          </span>
          <Terminal size={15} style={{ color: C.green }} aria-hidden="true" />
          <span
            className="text-[12.5px] font-semibold tracking-[0.04em]"
            style={{ ...disp, color: C.green, ...glowSoft }}
          >
            zzp-os · fosfor
          </span>
        </div>

        <button
          onClick={() => setPalette(true)}
          className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 text-[12px] transition-colors hover:bg-[rgba(0,255,156,0.08)] focus-visible:outline-none focus-visible:ring-1"
          style={{
            color: C.greenDim,
            border: `1px solid ${C.line}`,
            ["--tw-ring-color" as string]: C.green,
          }}
          aria-haspopup="dialog"
        >
          <Command size={13} aria-hidden="true" /> commandopalet
          <span
            className="ml-1 px-1.5 py-0.5 text-[10px]"
            style={{ border: `1px solid ${C.line}`, color: C.greenFaint }}
          >
            ⌘K
          </span>
        </button>

        <span
          className="hidden items-center gap-1.5 px-2.5 py-1.5 text-[11px] sm:inline-flex"
          style={{ color: C.green, border: `1px solid ${C.line}` }}
        >
          <ShieldCheck size={12} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
        </span>
      </header>

      {/* Scherm-tabs als terminal-command-knoppen */}
      <nav
        className="flex items-center gap-1 overflow-x-auto px-4 py-2 md:px-6"
        aria-label="Schermen"
        style={{ borderBottom: `1px solid ${C.lineSoft}`, background: C.bgDeep }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-1"
              style={{
                color: on ? C.bg : C.greenDim,
                background: on ? C.green : "transparent",
                border: `1px solid ${on ? C.green : C.line}`,
                ...(on ? glowSoft : {}),
                ["--tw-ring-color" as string]: C.green,
              }}
            >
              <span aria-hidden="true" style={{ opacity: 0.7 }}>
                {String(i + 1).padStart(2, "0")}:
              </span>{" "}
              {s.label}
            </button>
          );
        })}
        <button
          onClick={() => setScreen("berichten")}
          aria-current={screen === "berichten" ? "page" : undefined}
          className="shrink-0 px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-1"
          style={{
            color: screen === "berichten" ? C.bg : C.greenDim,
            background: screen === "berichten" ? C.green : "transparent",
            border: `1px solid ${screen === "berichten" ? C.green : C.line}`,
            ["--tw-ring-color" as string]: C.green,
          }}
        >
          <span aria-hidden="true" style={{ opacity: 0.7 }}>
            07:
          </span>{" "}
          Berichten
        </button>
      </nav>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        {screen === "dashboard" && (
          <Dashboard
            onOpen={() => setScreen("opdracht")}
            onActies={() => setScreen("acties")}
            onPalette={() => setPalette(true)}
          />
        )}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && (
          <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
        {screen === "berichten" && <Berichten />}
      </main>

      <CommandPalette open={palette} onClose={() => setPalette(false)} onRun={setScreen} />
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({
  onOpen,
  onActies,
  onPalette,
}: {
  onOpen: () => void;
  onActies: () => void;
  onPalette: () => void;
}) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Prompt cmd="dashboard --status" cursor />
        <div className="pl-1 text-[12px]" style={{ color: C.greenDim }}>
          sessie: {PROFIEL.naam} · {PROFIEL.rol}
        </div>
      </div>

      {/* Hero-output */}
      <Panel className="overflow-hidden">
        <div className="p-5 sm:p-7">
          <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: C.greenDim }}>
            &gt; bulletin
          </div>
          <h1
            className="mt-2 max-w-2xl text-[24px] font-semibold leading-[1.15] tracking-[-0.01em] sm:text-[30px]"
            style={{ ...disp, color: C.greenBright, ...glow }}
          >
            Drie matches boven 85%. Eén taak vraagt actie.
          </h1>
          <p className="mt-3 max-w-lg text-[13px] leading-relaxed" style={{ color: C.greenDim }}>
            Je VOG verloopt binnenkort — handel het af en blijf verifieerbaar. Alles draait; het
            systeem wacht op je commando.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 px-4 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[rgba(0,255,156,0.10)] focus-visible:outline-none focus-visible:ring-1"
              style={{
                color: C.bg,
                background: C.green,
                border: `1px solid ${C.green}`,
                ["--tw-ring-color" as string]: C.green,
              }}
            >
              matches openen <ArrowRight size={14} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 px-4 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[rgba(0,255,156,0.08)] focus-visible:outline-none focus-visible:ring-1"
              style={{
                color: C.green,
                border: `1px solid ${C.line}`,
                ["--tw-ring-color" as string]: C.green,
              }}
            >
              <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" /> los actie op
            </button>
            <button
              onClick={onPalette}
              className="inline-flex items-center gap-2 px-4 py-2 text-[12.5px] transition-colors hover:bg-[rgba(0,255,156,0.08)] focus-visible:outline-none focus-visible:ring-1"
              style={{
                color: C.greenDim,
                border: `1px solid ${C.line}`,
                ["--tw-ring-color" as string]: C.green,
              }}
            >
              <Command size={13} aria-hidden="true" /> ⌘K
            </button>
          </div>
        </div>
      </Panel>

      {/* KPI-grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel
            key={k.label}
            className="p-4 transition-colors hover:border-[rgba(0,255,156,0.32)]"
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[10.5px] uppercase tracking-[0.1em]"
                style={{ color: C.greenDim }}
              >
                {k.label}
              </span>
              <span
                className="px-1.5 py-0.5 text-[10px]"
                style={{ color: k.up ? C.green : C.amber, border: `1px solid ${C.line}` }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[24px] font-semibold leading-none tracking-[-0.02em]"
              style={{ ...disp, color: C.greenBright, ...glowSoft }}
            >
              {k.value}
            </div>
            <div className="mt-2.5">
              <Spark data={k.spark} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Matches-lijst */}
        <div className="space-y-3 lg:col-span-2">
          <Panel title="aanbevolen matches">
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    onClick={onOpen}
                    className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-[rgba(0,255,156,0.06)] focus-visible:bg-[rgba(0,255,156,0.08)] focus-visible:outline-none"
                  >
                    <span
                      className="flex w-14 shrink-0 flex-col items-center justify-center py-1"
                      style={{ border: `1px solid ${C.line}` }}
                      aria-hidden="true"
                    >
                      <span
                        className="text-[16px] font-semibold leading-none"
                        style={{ ...disp, color: C.greenBright, ...glowSoft }}
                      >
                        {o.match}
                      </span>
                      <span
                        className="mt-0.5 text-[9px] uppercase tracking-[0.08em]"
                        style={{ color: C.greenDim }}
                      >
                        {matchGlyph(o.match)} match
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[14px] font-semibold"
                        style={{ ...disp, color: C.green }}
                      >
                        {o.titel}
                      </div>
                      <div className="mt-0.5 truncate text-[11.5px]" style={{ color: C.greenDim }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {o.redenen.plus.slice(0, 2).map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10.5px]"
                            style={{ color: C.greenDim, border: `1px solid ${C.lineSoft}` }}
                          >
                            <Check size={10} strokeWidth={3} aria-hidden="true" /> {r}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ArrowRight
                      size={15}
                      className="shrink-0"
                      style={{ color: C.greenDim }}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* Status-kolom */}
        <div className="space-y-4">
          <Panel title="dekking certificaten" className="p-4">
            <div className="flex items-end justify-between">
              <div
                className="text-[40px] font-semibold leading-none tracking-[-0.02em]"
                style={{ ...disp, color: C.greenBright, ...glow }}
              >
                {dek}
                <span className="text-[18px]">%</span>
              </div>
              <StatusTag status="VERIFIED" />
            </div>
            <div className="mt-3">
              <AsciiMeter pct={dek} />
            </div>
            <div className="mt-2 text-[11.5px]" style={{ color: C.greenDim }}>
              {verified}/{CREDENTIALS.length} geverifieerd — opdrachtgevers zien alleen
              geverifieerd.
            </div>
          </Panel>

          <Panel title="prioriteit" className="p-4">
            <div
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em]"
              style={{ color: C.amber }}
            >
              <AlertTriangle size={12} strokeWidth={2.4} aria-hidden="true" /> urgent
            </div>
            <h3
              className="mt-2 text-[15px] font-semibold leading-tight"
              style={{ ...disp, color: C.green }}
            >
              {warn.titel}
            </h3>
            <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: C.greenDim }}>
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[rgba(0,255,156,0.10)] focus-visible:outline-none focus-visible:ring-1"
              style={{ color: C.bg, background: C.amber, ["--tw-ring-color" as string]: C.amber }}
            >
              {warn.cta} <ArrowRight size={13} aria-hidden="true" />
            </button>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ── Marktplaats ──────────────────────────────────────────────────────────────────
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
      <Prompt cmd={`match zoeken ${q ? `--q="${q}"` : "--open"}`} cursor />
      <Panel className="flex items-center gap-2 px-3 py-2">
        <Search size={15} style={{ color: C.greenDim }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="filter op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="flex-1 bg-transparent py-1 text-[12.5px] outline-none placeholder:opacity-50"
          style={{ ...mono, color: C.greenBright }}
        />
        <span className="text-[11px]" style={{ color: C.greenFaint }}>
          {filtered.length} resultaten
        </span>
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <Search size={26} style={{ color: C.greenFaint }} aria-hidden="true" />
          <p className="text-[16px] font-semibold" style={{ ...disp, color: C.green }}>
            geen resultaat
          </p>
          <p className="max-w-xs text-[12.5px]" style={{ color: C.greenDim }}>
            niets gevonden voor &quot;{q}&quot;. pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[rgba(0,255,156,0.10)] focus-visible:outline-none focus-visible:ring-1"
            style={{ color: C.bg, background: C.green, ["--tw-ring-color" as string]: C.green }}
          >
            zoekterm wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Panel
              key={o.id}
              className="flex flex-col transition-colors hover:border-[rgba(0,255,156,0.32)]"
            >
              <div className="flex items-start justify-between gap-2 p-4">
                <div className="min-w-0">
                  <div className="text-[11px]" style={{ color: C.greenFaint }}>
                    {o.id}
                  </div>
                  <h3
                    className="mt-1 text-[14.5px] font-semibold leading-tight"
                    style={{ ...disp, color: C.green }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-1 text-[11.5px]" style={{ color: C.greenDim }}>
                    {o.opdrachtgever}
                  </p>
                </div>
                <span
                  className="flex shrink-0 flex-col items-center px-2 py-1"
                  style={{ border: `1px solid ${C.line}` }}
                  aria-hidden="true"
                >
                  <span
                    className="text-[16px] font-semibold leading-none"
                    style={{ ...disp, color: C.greenBright, ...glowSoft }}
                  >
                    {o.match}
                  </span>
                  <span className="text-[8px] uppercase" style={{ color: C.greenDim }}>
                    match
                  </span>
                </span>
              </div>
              <div className="px-4 pb-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                <dl className="grid grid-cols-2 gap-y-1.5 pt-3 text-[11.5px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="px-1.5 py-0.5 text-[10px] uppercase tracking-[0.04em]"
                      style={{ color: C.greenDim, border: `1px solid ${C.lineSoft}` }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors hover:bg-[rgba(0,255,156,0.10)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset"
                style={{
                  color: C.green,
                  borderTop: `1px solid ${C.line}`,
                  ["--tw-ring-color" as string]: C.green,
                }}
              >
                open opdracht <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.greenDim }}>
      <Icon size={12} strokeWidth={2.2} style={{ color: C.greenFaint }} aria-hidden="true" />
      <span className="truncate">{value}</span>
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] transition-colors hover:bg-[rgba(0,255,156,0.08)] focus-visible:outline-none focus-visible:ring-1"
        style={{
          color: C.greenDim,
          border: `1px solid ${C.line}`,
          ["--tw-ring-color" as string]: C.green,
        }}
      >
        <ArrowRight size={13} className="rotate-180" aria-hidden="true" /> terug
      </button>

      <Prompt cmd={`opdracht openen ${opdracht.id}`} cursor />

      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-5 p-5 sm:p-7">
          <div className="min-w-0">
            <span
              className="inline-block px-2 py-0.5 text-[11px]"
              style={{ color: C.greenDim, border: `1px solid ${C.line}` }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[24px] font-semibold leading-[1.1] tracking-[-0.01em] sm:text-[30px]"
              style={{ ...disp, color: C.greenBright, ...glow }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13px]" style={{ color: C.greenDim }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div
            className="flex flex-col items-center px-4"
            style={{ borderLeft: `1px solid ${C.line}` }}
          >
            <span
              className="text-[44px] font-semibold leading-none"
              style={{ ...disp, color: C.greenBright, ...glow }}
            >
              {opdracht.match}
            </span>
            <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: C.greenDim }}>
              {matchGlyph(opdracht.match)} % match
            </span>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((f) => (
          <Panel key={f.l} className="p-4">
            <f.Icon size={15} strokeWidth={2.2} style={{ color: C.greenDim }} aria-hidden="true" />
            <div
              className="mt-2 text-[15px] font-semibold leading-none"
              style={{ ...disp, color: C.green }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10px] uppercase tracking-[0.1em]"
              style={{ color: C.greenDim }}
            >
              {f.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Panel title="waarom dit past">
          <ul className="space-y-2.5 p-4">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px] leading-snug"
                style={{ color: C.green }}
              >
                <Check
                  size={14}
                  strokeWidth={3}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.greenBright }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="om te overwegen">
          <ul className="space-y-2.5 p-4">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px] leading-snug"
                style={{ color: C.greenDim }}
              >
                <AlertTriangle
                  size={13}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.06em] transition-colors hover:bg-[rgba(0,255,156,0.10)] focus-visible:outline-none focus-visible:ring-1"
          style={{
            color: C.bg,
            background: C.green,
            ...glowSoft,
            ["--tw-ring-color" as string]: C.green,
          }}
        >
          reageer op deze opdracht <CornerDownLeft size={15} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.06em] transition-colors hover:bg-[rgba(0,255,156,0.08)] focus-visible:outline-none focus-visible:ring-1"
          style={{
            color: C.green,
            border: `1px solid ${C.line}`,
            ["--tw-ring-color" as string]: C.green,
          }}
        >
          bewaar
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <Prompt cmd="verificatie openen --certificaten" cursor />

      <Panel className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div
              className="text-[44px] font-semibold leading-none tracking-[-0.02em]"
              style={{ ...disp, color: C.greenBright, ...glow }}
            >
              {dek}
              <span className="text-[20px]">%</span>
            </div>
            <div className="max-w-xs">
              <div className="text-[14px] font-semibold" style={{ ...disp, color: C.green }}>
                {verified}/{CREDENTIALS.length} geverifieerd
              </div>
              <p className="mt-1 text-[12px] leading-snug" style={{ color: C.greenDim }}>
                Opdrachtgevers zien alleen geverifieerde certificaten. Hogere dekking = meer
                vertrouwen.
              </p>
              <div className="mt-2">
                <AsciiMeter pct={dek} width={20} />
              </div>
            </div>
          </div>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 text-[12px] font-semibold transition-colors hover:bg-[rgba(0,255,156,0.10)] focus-visible:outline-none focus-visible:ring-1"
            style={{ color: C.bg, background: C.green, ["--tw-ring-color" as string]: C.green }}
          >
            <Plus size={13} aria-hidden="true" /> toevoegen
          </button>
        </div>
      </Panel>

      <Panel title="certificaten">
        <ul>
          {CREDENTIALS.map((c, i) => {
            const m = credMeta(c.status);
            const actionable = c.status !== "VERIFIED";
            return (
              <li
                key={c.naam}
                className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[rgba(0,255,156,0.05)]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span className="text-[13px]" style={{ color: m.color }} aria-hidden="true">
                  {m.glyph}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[14px] font-semibold"
                    style={{ ...disp, color: C.green }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[11.5px]" style={{ color: C.greenDim }}>
                    {c.detail}
                  </div>
                </div>
                <StatusTag status={c.status} />
                {actionable && (
                  <button
                    className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] transition-colors hover:bg-[rgba(0,255,156,0.10)] focus-visible:outline-none focus-visible:ring-1"
                    style={{
                      color: C.green,
                      border: `1px solid ${C.line}`,
                      ["--tw-ring-color" as string]: C.green,
                    }}
                  >
                    {c.status === "EXPIRING"
                      ? "vernieuwen"
                      : c.status === "REJECTED"
                        ? "opnieuw"
                        : "bekijk"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

// ── Acties ──────────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-5">
      <Prompt cmd="acties tonen --sort=urgentie" cursor />
      <p className="pl-1 text-[12px]" style={{ color: C.greenDim }}>
        op volgorde van urgentie — pak de bovenste eerst.
      </p>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Panel className="flex items-stretch overflow-hidden">
                <span
                  className="flex w-14 shrink-0 items-center justify-center text-[22px] font-semibold"
                  style={{
                    ...disp,
                    color: warn ? C.amber : C.green,
                    borderRight: `1px solid ${C.lineSoft}`,
                    ...glowSoft,
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.06em]"
                      style={{
                        color: warn ? C.amber : C.greenDim,
                        border: `1px solid ${warn ? C.amber : C.line}`,
                      }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} strokeWidth={3} aria-hidden="true" />
                      ) : (
                        <Zap size={10} strokeWidth={3} aria-hidden="true" />
                      )}
                      {warn ? "urgent" : "kans"}
                    </span>
                    <h3 className="text-[14.5px] font-semibold" style={{ ...disp, color: C.green }}>
                      {a.titel}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.greenDim }}>
                    {a.detail}
                  </p>
                  <button
                    className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[rgba(0,255,156,0.10)] focus-visible:outline-none focus-visible:ring-1"
                    style={
                      warn
                        ? {
                            color: C.bg,
                            background: C.amber,
                            ["--tw-ring-color" as string]: C.amber,
                          }
                        : {
                            color: C.bg,
                            background: C.green,
                            ["--tw-ring-color" as string]: C.green,
                          }
                    }
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

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; glyph: string; color: string } => {
    if (status === "Betaald")
      return { label: "Betaald", Icon: Check, glyph: "[OK]", color: C.green };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, glyph: "[..]", color: C.amber };
    return { label: "Concept", Icon: FileText, glyph: "[--]", color: C.greenDim };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Prompt cmd="facturen tonen --overzicht" cursor />
        <button
          className="inline-flex items-center gap-2 px-3 py-2 text-[12px] font-semibold transition-colors hover:bg-[rgba(0,255,156,0.10)] focus-visible:outline-none focus-visible:ring-1"
          style={{ color: C.bg, background: C.green, ["--tw-ring-color" as string]: C.green }}
        >
          <Plus size={13} aria-hidden="true" /> nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, hi: true },
          { l: "Openstaand", v: `${open}`, hi: false },
          { l: "Te factureren", v: "€ 1.350", hi: false },
        ].map((s) => (
          <Panel key={s.l} className="p-4">
            <div className="text-[10px] uppercase tracking-[0.1em]" style={{ color: C.greenDim }}>
              {s.l}
            </div>
            <div
              className="mt-2 text-[22px] font-semibold leading-none tracking-[-0.02em]"
              style={{ ...disp, color: s.hi ? C.greenBright : C.green, ...(s.hi ? glowSoft : {}) }}
            >
              {s.v}
            </div>
          </Panel>
        ))}
      </div>

      <Panel title="factuurregister">
        <ul>
          {FACTUREN.map((f, i) => {
            const m = factMeta(f.status);
            return (
              <li
                key={f.nr}
                className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-[rgba(0,255,156,0.05)]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span className="text-[12px]" style={{ color: m.color }} aria-hidden="true">
                  {m.glyph}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold" style={{ ...disp, color: C.green }}>
                    {f.nr}
                  </div>
                  <div className="text-[11.5px]" style={{ color: C.greenDim }}>
                    {f.klant} · {f.datum}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] uppercase tracking-[0.06em]"
                  style={{ color: m.color, border: `1px solid ${m.color}` }}
                >
                  <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                </span>
                <span
                  className="w-24 text-right text-[14px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.greenBright }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: `1px solid ${C.line}`, background: C.bgDeep }}
        >
          <span className="text-[11px] uppercase tracking-[0.1em]" style={{ color: C.greenDim }}>
            totaal betaald
          </span>
          <span
            className="text-[16px] font-semibold tabular-nums"
            style={{ ...disp, color: C.greenBright, ...glowSoft }}
          >
            {betaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}

// ── Berichten ────────────────────────────────────────────────────────────────────
function Berichten() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Prompt cmd="berichten lezen --inbox" cursor />
        <span className="text-[11.5px]" style={{ color: C.greenDim }}>
          {ongelezen} ongelezen
        </span>
      </div>
      <Panel title="inbox">
        <ul>
          {BERICHTEN.map((b, i) => (
            <li
              key={b.van}
              className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-[rgba(0,255,156,0.05)]"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center text-[11px] font-semibold"
                style={{ color: C.green, border: `1px solid ${C.line}` }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[13.5px] font-semibold"
                    style={{ ...disp, color: C.green }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.06em]"
                      style={{ color: C.amber, border: `1px solid ${C.amber}` }}
                    >
                      nieuw
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12px]" style={{ color: C.greenDim }}>
                  {b.preview}
                </p>
              </div>
              <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.greenFaint }}>
                {b.tijd}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
