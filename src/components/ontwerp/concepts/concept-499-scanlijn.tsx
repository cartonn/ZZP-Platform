"use client";

// Concept 499 — "Scanlijn" · Verfijnd retro-technisch fosfor-terminal. Amber-fosfor mono op diep
// warm-antraciet, met een subtiele scanline-overlay (repeating-linear-gradient) en een zachte
// vignette. Command-menu (Ctrl/Cmd+K), terminal-prompts en glow-accenten — gepolijst en premium,
// niet kitscherig. Hoog contrast, alles leesbaar. Status nooit alleen via kleur: [OK]/[!]/[X]-tags.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Check,
  ChevronRight,
  Clock,
  Command,
  CornerDownLeft,
  FileText,
  MapPin,
  Minus,
  Plus,
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
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: warm-antraciet fosfor-terminal met amber als hoofdlicht —
const C = {
  bg: "#08070a",
  screen: "#0b0a0d",
  panel: "#100e12",
  panelHi: "#16131a",
  panelSoft: "#0e0c11",
  border: "#2a2333",
  borderHi: "#3d3348",
  grid: "#17131d",

  amber: "#ffb454",
  amberDim: "#b98337",
  green: "#63f39a",
  greenDim: "#2f7d4c",
  cyan: "#5ad6e0",
  cyanDim: "#2f7f86",
  red: "#ff6f63",
  redDim: "#a84940",

  text: "#e9e0cf",
  textDim: "#a99f8c",
  textMute: "#6f6656",
};

const mono = {
  fontFamily:
    "'JetBrains Mono', 'SF Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};
const num = { ...mono, fontVariantNumeric: "tabular-nums" as const };

function glow(color: string, strength = 0.5) {
  return `0 0 6px ${color}${Math.round(strength * 255)
    .toString(16)
    .padStart(2, "0")}`;
}

type Tone = { base: string; label: string; tag: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { base: C.green, label: "Geverifieerd", tag: "OK", Icon: ShieldCheck, alarm: false };
    case "SUBMITTED":
      return { base: C.cyan, label: "In beoordeling", tag: "..", Icon: Clock, alarm: false };
    case "EXPIRING":
      return {
        base: C.amber,
        label: "Verloopt bijna",
        tag: "!",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.red, label: "Afgewezen", tag: "X", Icon: X, alarm: true };
  }
}

// — Terminal-label: kleinkapitaal met promptteken —
function Prompt({ children, tone = C.amber }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.22em]"
      style={{ color: tone, ...mono }}
    >
      <span aria-hidden="true" style={{ color: C.textMute }}>
        &gt;
      </span>
      {children}
    </span>
  );
}

function Cursor({ tone = C.amber }: { tone?: string }) {
  return (
    <span
      aria-hidden="true"
      className="sl-blink ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-[0.12em]"
      style={{ background: tone, boxShadow: glow(tone, 0.6) }}
    />
  );
}

// — Fosfor-status-tag: [OK] / [!] / [X] — nooit alleen kleur —
function StatusTag({ base, tag, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em]"
      style={{
        color: base,
        background: `${base}14`,
        border: `1px solid ${base}44`,
        ...mono,
      }}
    >
      <span aria-hidden="true" style={{ color: base }}>
        [{tag}]
      </span>
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
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
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "solid" | "line" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
}) {
  const pad = size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-4 py-2.5 text-[13px]";
  const style: React.CSSProperties =
    variant === "solid"
      ? { background: `${C.amber}1c`, color: C.amber, border: `1px solid ${C.amber}66` }
      : variant === "line"
        ? { background: "transparent", color: C.text, border: `1px solid ${C.borderHi}` }
        : { background: "transparent", color: C.textDim, border: "1px solid transparent" };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`inline-flex items-center justify-center gap-2 rounded-[4px] font-semibold uppercase tracking-[0.08em] transition-all duration-150 hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb454] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08070a] ${pad} ${className}`}
      style={{ ...style, ...mono }}
    >
      {children}
    </button>
  );
}

// — Terminal-venster met titelbalk (bestandsnaam-stijl) —
function Frame({
  title,
  children,
  className = "",
  as: Tag = "section",
  accent = C.amber,
  right,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
  accent?: string;
  right?: React.ReactNode;
}) {
  return (
    <Tag
      className={`overflow-hidden rounded-[6px] ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        boxShadow: "0 18px 40px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.02) inset",
      }}
    >
      <div
        className="flex items-center gap-2 px-3.5 py-2"
        style={{ borderBottom: `1px solid ${C.border}`, background: C.panelSoft }}
      >
        <span className="flex items-center gap-1.5" aria-hidden="true">
          {[C.red, C.amber, C.green].map((d) => (
            <span
              key={d}
              className="h-2 w-2 rounded-full"
              style={{ background: d, boxShadow: glow(d, 0.5) }}
            />
          ))}
        </span>
        <span
          className="ml-1 truncate text-[11px] tracking-[0.04em]"
          style={{ color: C.textDim, ...mono }}
        >
          <span style={{ color: accent }}>~</span>/{title}
        </span>
        {right && <span className="ml-auto">{right}</span>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </Tag>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 92;
  const h = 26;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 2 - ((d - min) / span) * (h - 4)] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      style={{ filter: `drop-shadow(0 0 3px ${tone}aa)` }}
    >
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2" fill={tone} />
    </svg>
  );
}

function MatchBadge({ value, small = false }: { value: number; small?: boolean }) {
  const strong = value >= 90;
  const tone = strong ? C.green : C.amber;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[4px] font-semibold ${
        small ? "px-2 py-1 text-[13px]" : "px-2.5 py-1.5 text-[16px]"
      }`}
      style={{
        color: tone,
        background: `${tone}12`,
        border: `1px solid ${tone}55`,
        textShadow: glow(tone, 0.5),
        ...num,
      }}
      aria-label={`Match ${value} procent`}
    >
      {value}
      <span className="text-[0.6em]" style={{ color: C.textMute }}>
        %
      </span>
    </span>
  );
}

function SectionHead({
  over,
  children,
  right,
}: {
  over: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <Prompt>{over}</Prompt>
        <h2
          className="mt-1.5 text-[19px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ color: C.text, ...mono }}
        >
          {children}
        </h2>
      </div>
      {right}
    </div>
  );
}

// —————————————————————————————————— Command-menu ——————————————————————————————————
type Cmd = { key: ScreenKey; label: string; hint: string; Icon: LucideIcon };

function CommandMenu({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (k: ScreenKey) => void;
}) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const iconFor: Record<ScreenKey, LucideIcon> = {
    dashboard: Terminal,
    marktplaats: Search,
    opdracht: FileText,
    verificatie: ShieldCheck,
    documenten: FileText,
    facturen: FileText,
    berichten: FileText,
    acties: AlertTriangle,
  };
  const hintFor: Record<string, string> = {
    dashboard: "overzicht en next-actions",
    marktplaats: "opdrachten zoeken",
    opdracht: "opdracht-detail openen",
    verificatie: "certificaten beheren",
    acties: "wat vraagt aandacht",
    facturen: "grootboek en omzet",
  };
  const cmds: Cmd[] = SCREENS.map((s) => ({
    key: s.key,
    label: s.label,
    hint: hintFor[s.key] ?? "",
    Icon: iconFor[s.key],
  }));

  const results = useMemo(() => {
    const n = q.toLowerCase().trim();
    return cmds.filter((c) => c.label.toLowerCase().includes(n) || c.hint.includes(n));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    setIdx((i) => Math.min(i, Math.max(0, results.length - 1)));
  }, [results.length]);

  if (!open) return null;

  const pick = (k?: ScreenKey) => {
    if (!k) return;
    onPick(k);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Commandomenu"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        else if (e.key === "ArrowDown") {
          e.preventDefault();
          setIdx((i) => Math.min(results.length - 1, i + 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setIdx((i) => Math.max(0, i - 1));
        } else if (e.key === "Enter") {
          e.preventDefault();
          pick(results[idx]?.key);
        }
      }}
    >
      <button
        type="button"
        aria-label="Menu sluiten"
        onClick={onClose}
        className="fixed inset-0 cursor-default"
        style={{ background: "rgba(4,3,6,0.72)", backdropFilter: "blur(2px)" }}
      />
      <div
        className="sl-pop relative w-full max-w-lg overflow-hidden rounded-[8px]"
        style={{
          background: C.panel,
          border: `1px solid ${C.borderHi}`,
          boxShadow: `0 30px 80px -20px rgba(0,0,0,0.9), 0 0 0 1px ${C.amber}22`,
        }}
      >
        <div
          className="flex items-center gap-2.5 px-4 py-3"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <span aria-hidden="true" style={{ color: C.amber, ...mono }} className="text-[14px]">
            &gt;
          </span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Typ een commando of scherm…"
            aria-label="Commando zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#6f6656]"
            style={{ color: C.text, ...mono }}
          />
          <kbd
            className="rounded-[4px] px-1.5 py-0.5 text-[10px]"
            style={{ color: C.textMute, border: `1px solid ${C.border}`, ...mono }}
          >
            esc
          </kbd>
        </div>
        {results.length === 0 ? (
          <p className="px-4 py-8 text-center text-[12.5px]" style={{ color: C.textMute, ...mono }}>
            Geen commando gevonden voor “{q}”.
          </p>
        ) : (
          <ul className="max-h-[320px] overflow-y-auto py-1.5">
            {results.map((c, i) => {
              const on = i === idx;
              return (
                <li key={c.key}>
                  <button
                    type="button"
                    onMouseEnter={() => setIdx(i)}
                    onClick={() => pick(c.key)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors focus-visible:outline-none"
                    style={{ background: on ? `${C.amber}14` : "transparent" }}
                  >
                    <c.Icon
                      size={15}
                      aria-hidden="true"
                      style={{ color: on ? C.amber : C.textDim }}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block text-[13px] font-semibold"
                        style={{ color: on ? C.text : C.textDim, ...mono }}
                      >
                        {c.label}
                      </span>
                      <span className="block text-[11px]" style={{ color: C.textMute, ...mono }}>
                        {c.hint}
                      </span>
                    </span>
                    {on && (
                      <CornerDownLeft size={13} aria-hidden="true" style={{ color: C.amber }} />
                    )}
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

// —————————————————————————————————— Root ——————————————————————————————————
export function Concept499() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [cmdOpen, setCmdOpen] = useState(false);
  const active = OPDRACHTEN[0] as Opdracht;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="relative min-h-[760px] w-full overflow-hidden antialiased"
      style={{
        ...mono,
        color: C.text,
        background: C.bg,
        backgroundImage: [
          `radial-gradient(120% 80% at 50% -10%, ${C.amber}0e 0%, rgba(0,0,0,0) 55%)`,
          `radial-gradient(80% 60% at 100% 110%, ${C.cyan}0a 0%, rgba(0,0,0,0) 60%)`,
        ].join(","),
      }}
    >
      {/* Scanline- + vignette-overlay */}
      <div
        aria-hidden="true"
        className="sl-flicker pointer-events-none absolute inset-0 z-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.26) 0px, rgba(0,0,0,0.26) 1px, transparent 1px, transparent 3px)",
          mixBlendMode: "multiply",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <div className="relative z-20 mx-auto max-w-5xl px-4 pb-20 sm:px-6 md:px-8">
        <TopBar onCmd={() => setCmdOpen(true)} />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="sl-fade pt-6">
          {screen === "dashboard" && (
            <Dashboard
              onOpen={() => setScreen("opdracht")}
              onMarkt={() => setScreen("marktplaats")}
              onActies={() => setScreen("acties")}
            />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties onMarkt={() => setScreen("marktplaats")} />}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>

      <CommandMenu open={cmdOpen} onClose={() => setCmdOpen(false)} onPick={setScreen} />

      <style>{`
        @keyframes slBlink { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
        .sl-blink { animation: slBlink 1.05s steps(1) infinite; }
        @keyframes slFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .sl-fade { animation: slFade 0.34s ease both; }
        @keyframes slPop { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .sl-pop { animation: slPop 0.16s ease both; }
        @keyframes slFlicker { 0%,100% { opacity: 1; } 92% { opacity: 1; } 94% { opacity: 0.86; } 96% { opacity: 1; } }
        .sl-flicker { animation: slFlicker 6s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .sl-blink, .sl-fade, .sl-pop, .sl-flicker { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function TopBar({ onCmd }: { onCmd: () => void }) {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex flex-wrap items-center gap-4 pt-6">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-[6px]"
          style={{
            color: C.amber,
            background: `${C.amber}14`,
            border: `1px solid ${C.amber}55`,
            boxShadow: glow(C.amber, 0.35),
          }}
          aria-hidden="true"
        >
          <Terminal size={18} />
        </span>
        <div>
          <p
            className="flex items-center text-[16px] font-semibold leading-none tracking-[0.02em]"
            style={{ color: C.text, ...mono }}
          >
            <span style={{ color: C.amber }}>zzp</span>
            <span style={{ color: C.textMute }}>@</span>
            scanlijn
            <Cursor />
          </p>
          <p className="mt-1.5 text-[10.5px] tracking-[0.14em]" style={{ color: C.textMute }}>
            {PROFIEL.naam} · {PROFIEL.rol}
          </p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span
          className="hidden items-center gap-1.5 rounded-[4px] px-2.5 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: C.green, background: `${C.green}12`, border: `1px solid ${C.green}44` }}
        >
          <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1.5 text-[11px]"
          style={{ color: C.textDim, border: `1px solid ${C.border}` }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          inbox
          <span className="font-semibold" style={{ color: C.amber, ...num }}>
            {ongelezen}
          </span>
        </span>
        <button
          type="button"
          onClick={onCmd}
          aria-label="Commandomenu openen (Ctrl of Cmd + K)"
          className="inline-flex items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-[11px] font-semibold transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb454]"
          style={{ color: C.text, background: C.panel, border: `1px solid ${C.borderHi}`, ...mono }}
        >
          <Command size={12} aria-hidden="true" />
          <span className="hidden sm:inline">K</span>
        </button>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav
      aria-label="Hoofdnavigatie"
      className="mt-5 flex flex-wrap items-center gap-1.5 overflow-x-auto rounded-[6px] p-1.5"
      style={{ background: C.panelSoft, border: `1px solid ${C.border}` }}
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="relative shrink-0 rounded-[4px] px-3 py-1.5 text-[12.5px] font-semibold uppercase tracking-[0.08em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb454]"
            style={{
              color: on ? C.amber : C.textDim,
              background: on ? `${C.amber}16` : "transparent",
              border: `1px solid ${on ? `${C.amber}55` : "transparent"}`,
              textShadow: on ? glow(C.amber, 0.4) : "none",
              ...mono,
            }}
          >
            <span aria-hidden="true" style={{ color: on ? C.amber : C.textMute }}>
              {on ? "› " : "  "}
            </span>
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

// —————————————————————————————————— Dashboard ——————————————————————————————————
function Dashboard({
  onOpen,
  onMarkt,
  onActies,
}: {
  onOpen: () => void;
  onMarkt: () => void;
  onActies: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.7fr_1fr]">
        <div>
          <Prompt>sessie gestart</Prompt>
          <h1
            className="mt-2.5 text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[34px]"
            style={{ color: C.text, ...mono }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.textDim }}>
            <span style={{ color: C.green }}>$</span> Register geverifieerd en op orde. Verse
            opdrachten staan klaar; één document in je dossier vraagt binnenkort aandacht.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Btn variant="solid" onClick={onActies}>
              Volgende actie <ArrowRight size={14} aria-hidden="true" />
            </Btn>
            <Btn variant="line" onClick={onMarkt}>
              Naar marktplaats
            </Btn>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {KPIS.map((k, i) => {
              const tone = i === 3 ? C.amber : C.green;
              return (
                <div
                  key={k.label}
                  className="rounded-[6px] p-3.5"
                  style={{ background: C.panel, border: `1px solid ${C.border}` }}
                >
                  <p
                    className="text-[9.5px] uppercase tracking-[0.12em]"
                    style={{ color: C.textMute }}
                  >
                    {k.label}
                  </p>
                  <p
                    className="mt-1.5 text-[21px] font-semibold leading-none"
                    style={{ color: C.text, textShadow: glow(tone, 0.25), ...num }}
                  >
                    {k.value}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: k.up ? C.green : C.amber, ...num }}
                    >
                      {k.up ? "▲" : "▼"} {k.trend}
                    </span>
                    <Spark data={k.spark} tone={tone} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <Frame title="aandacht.log" accent={C.amber}>
            <div className="flex items-center gap-2" style={{ color: C.amber }}>
              <AlertTriangle size={14} aria-hidden="true" />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em]">
                Termijn nadert
              </span>
            </div>
            <h3
              className="mt-2.5 text-[15px] font-semibold leading-snug"
              style={{ color: C.text, ...mono }}
            >
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.textDim }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" className="mt-4 w-full" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Frame>

          <Frame title="trust.stat" accent={C.green}>
            <div className="flex items-baseline gap-2">
              <span
                className="text-[30px] font-semibold leading-none"
                style={{ color: C.green, textShadow: glow(C.green, 0.4), ...num }}
              >
                {ratio}%
              </span>
              <span className="text-[11.5px]" style={{ color: C.textMute }}>
                dossier op orde
              </span>
            </div>
            <div
              className="mt-3 h-2 w-full overflow-hidden rounded-full"
              style={{ background: C.panelSoft, border: `1px solid ${C.border}` }}
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${ratio}%`,
                  background: C.green,
                  boxShadow: glow(C.green, 0.5),
                  transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </div>
            <p className="mt-2 text-[11.5px]" style={{ color: C.textMute }}>
              {verified}/{CREDENTIALS.length} certificaten geverifieerd.
            </p>
          </Frame>
        </aside>
      </section>

      <Frame title="matches.sh" accent={C.green}>
        <SectionHead
          over="aanbevolen"
          right={
            <button
              type="button"
              onClick={onMarkt}
              className="rounded text-[11.5px] font-semibold uppercase tracking-[0.1em] transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb454]"
              style={{ color: C.amber, ...mono }}
            >
              Volledige lijst →
            </button>
          }
        >
          Opdrachten voor jou
        </SectionHead>
        <ul className="space-y-2">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <OpdrachtRow opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      </Frame>

      <Frame title="register.db" accent={C.cyan}>
        <SectionHead over="certificaten">Vertrouwensregister</SectionHead>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-3 rounded-[5px] px-3 py-2.5"
                style={{ background: C.panelSoft, border: `1px solid ${C.border}` }}
              >
                <t.Icon size={16} aria-hidden="true" style={{ color: t.base }} />
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13px] font-semibold"
                    style={{ color: C.text }}
                  >
                    {c.naam}
                  </span>
                  <span
                    className="block truncate text-[11px]"
                    style={{ color: t.alarm ? t.base : C.textMute }}
                  >
                    {c.detail}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </Frame>
    </div>
  );
}

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-4 rounded-[6px] px-3 py-3 text-left transition-colors hover:bg-[#16131a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ffb454]"
      style={{ border: `1px solid ${C.border}` }}
    >
      <MatchBadge value={opdracht.match} small />
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[14px] font-semibold leading-snug"
          style={{ color: C.text }}
        >
          {opdracht.titel}
        </span>
        <span
          className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px]"
          style={{ color: C.textMute }}
        >
          <MapPin size={11} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats} ·{" "}
          {opdracht.uren}
        </span>
      </span>
      <span className="hidden shrink-0 text-right sm:block">
        <span className="block text-[14px] font-semibold" style={{ color: C.amber, ...num }}>
          {opdracht.tarief.replace(" / uur", "")}
        </span>
        <span className="text-[9.5px] uppercase tracking-[0.12em]" style={{ color: C.textMute }}>
          p/uur
        </span>
      </span>
      <ChevronRight
        size={16}
        aria-hidden="true"
        className="shrink-0 transition-transform group-hover:translate-x-0.5"
        style={{ color: C.textDim }}
      />
    </button>
  );
}

// —————————————————————————————————— Marktplaats ——————————————————————————————————
type Mode = "ok" | "loading" | "error";

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [mode, setMode] = useState<Mode>("ok");

  const filtered = useMemo(() => {
    const n = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-5">
      <div>
        <Prompt>marktplaats --match</Prompt>
        <h1
          className="mt-1.5 text-[25px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ color: C.text, ...mono }}
        >
          Opdrachten die bij je passen
        </h1>
        <p className="mt-1 text-[12.5px]" style={{ color: C.textMute }}>
          <span style={{ color: C.green }}>{filtered.length}</span> van {OPDRACHTEN.length}{" "}
          opdrachten sluiten aan op je profiel.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[6px] px-3.5 py-2.5"
          style={{ background: C.panel, border: `1px solid ${C.border}` }}
        >
          <span aria-hidden="true" style={{ color: C.amber, ...mono }}>
            &gt;
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="grep titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#6f6656]"
            style={{ color: C.text, ...mono }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:brightness-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb454]"
              style={{ color: C.textDim }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <Btn
              key={s}
              size="sm"
              variant={sort === s ? "solid" : "line"}
              onClick={() => setSort(s)}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </Btn>
          ))}
        </div>
      </div>

      {mode === "loading" ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="rounded-[6px] p-5"
              style={{ background: C.panel, border: `1px solid ${C.border}` }}
            >
              <div className="space-y-3">
                <div
                  className="h-4 w-2/3 animate-pulse rounded motion-reduce:animate-none"
                  style={{ background: C.panelHi }}
                />
                <div
                  className="h-3 w-1/2 animate-pulse rounded motion-reduce:animate-none"
                  style={{ background: C.panelHi }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={AlertTriangle}
          tone={C.red}
          titel="De lijst kon niet worden geladen"
          tekst="De opdrachten konden zojuist niet worden opgehaald. Probeer het rustig opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : filtered.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.amber}
          titel="Niets gevonden"
          tekst={`Geen opdracht voor ${q ? `“${q}”` : "je zoekterm"}. Verruim je zoekopdracht.`}
          cta="Zoekterm wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-center gap-5 pt-1">
        {(["loading", "error"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className="rounded text-[10.5px] uppercase tracking-[0.14em] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb454]"
            style={{ color: C.textMute, ...mono }}
          >
            {m === "loading" ? "// laadstaat" : "// foutstaat"}
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
    <div
      className="flex flex-col items-center rounded-[8px] px-6 py-16 text-center"
      style={{ background: C.panel, border: `1px solid ${C.border}` }}
    >
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ color: tone, background: `${tone}12`, border: `1px solid ${tone}44` }}
        aria-hidden="true"
      >
        <Icon size={24} />
      </span>
      <p className="mt-4 text-[18px] font-semibold" style={{ color: C.text, ...mono }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed" style={{ color: C.textDim }}>
        {tekst}
      </p>
      <Btn variant="line" className="mt-5" onClick={onCta}>
        <RotateCcw size={13} aria-hidden="true" /> {cta}
      </Btn>
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
  const tone = strong ? C.green : C.amber;
  return (
    <article
      className="overflow-hidden rounded-[8px]"
      style={{ background: C.panel, border: `1px solid ${C.border}` }}
    >
      <div className="flex items-start gap-4 p-4 sm:p-5">
        <MatchBadge value={opdracht.match} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: tone }}
            >
              {strong ? "Sterke match" : "Goede match"}
            </span>
            <span className="text-[10.5px]" style={{ color: C.textMute, ...num }}>
              #{String(index + 1).padStart(2, "0")} · {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-1.5 text-[17px] font-semibold leading-snug"
            style={{ color: C.text, ...mono }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.textMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-[4px] px-2 py-0.5 text-[11px]"
                style={{
                  background: C.panelSoft,
                  color: C.textDim,
                  border: `1px solid ${C.border}`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[16px] font-semibold" style={{ color: C.amber, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span className="text-[9.5px] uppercase tracking-[0.12em]" style={{ color: C.textMute }}>
            p/uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5"
        style={{ borderTop: `1px solid ${C.border}` }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-[4px] text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb454]"
          style={{ color: C.amber, ...mono }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" onClick={onOpen}>
            Reageren <ArrowRight size={13} aria-hidden="true" />
          </Btn>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 sm:p-5"
            style={{ borderTop: `1px solid ${C.border}`, background: C.panelSoft }}
          >
            <RedenKolom
              titel="In je voordeel"
              tone={C.green}
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
    </article>
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
        style={{ color: tone }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[13px] leading-snug"
            style={{ color: C.textDim }}
          >
            <span aria-hidden="true" style={{ color: tone }}>
              +
            </span>
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————— Opdracht-detail ——————————————————————————————————
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.green : C.amber;
  return (
    <div className="space-y-6">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> cd ../marktplaats
      </Btn>

      <Frame title={`opdracht/${opdracht.id}`} accent={tone}>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px]" style={{ color: C.textMute, ...num }}>
            {opdracht.id}
          </span>
          <span className="h-3 w-px" style={{ background: C.border }} aria-hidden="true" />
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: tone }}
          >
            {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-2.5 max-w-2xl text-[25px] font-semibold leading-[1.15] tracking-[-0.015em] md:text-[30px]"
          style={{ color: C.text, ...mono }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 flex items-center gap-1.5 text-[13.5px]" style={{ color: C.textMute }}>
          <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Btn variant="solid">
            Reageren op opdracht <ArrowRight size={14} aria-hidden="true" />
          </Btn>
          <Btn variant="line">Bewaren</Btn>
        </div>

        <div
          className="mt-5 grid grid-cols-2 gap-4 rounded-[6px] p-4 sm:grid-cols-4"
          style={{ background: C.panelSoft, border: `1px solid ${C.border}` }}
        >
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Aanvang", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m) => (
            <div key={m.l}>
              <p className="text-[9.5px] uppercase tracking-[0.14em]" style={{ color: C.textMute }}>
                {m.l}
              </p>
              <p className="mt-1.5 text-[16px] font-semibold" style={{ color: C.text, ...num }}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Frame>

      <Frame title="motivering.md" accent={C.cyan}>
        <SectionHead over="waarom">Navolgbare match-redenen</SectionHead>
        <p className="mb-5 max-w-xl text-[13px] leading-relaxed" style={{ color: C.textDim }}>
          Afgezet tegen je geverifieerde profiel — open en navolgbaar, zonder verborgen score. Wat
          in je voordeel spreekt, en wat goed is om vooraf te weten.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.green }}
            >
              <Check size={13} aria-hidden="true" /> In je voordeel
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px] leading-snug"
                  style={{ color: C.textDim }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.green }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.amber }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px] leading-snug"
                  style={{ color: C.textDim }}
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
      </Frame>
    </div>
  );
}

// —————————————————————————————————— Verificatie ——————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Frame title="trust/overzicht" accent={C.green}>
          <Prompt tone={C.green}>vertrouwensregister</Prompt>
          <h1
            className="mt-1.5 text-[24px] font-semibold leading-tight tracking-[-0.01em]"
            style={{ color: C.text, ...mono }}
          >
            {PROFIEL.trust}
          </h1>
          <p className="mt-2.5 max-w-lg text-[13px] leading-relaxed" style={{ color: C.textDim }}>
            {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt bijna —
            tijdig vernieuwen houdt je dossier compleet. Documenten worden versleuteld bewaard en
            uitsluitend met jouw toestemming gedeeld.
          </p>
        </Frame>
        <Frame title="trust.stat" accent={C.green}>
          <span
            className="text-[40px] font-semibold leading-none"
            style={{ color: C.green, textShadow: glow(C.green, 0.4), ...num }}
          >
            {ratio}%
          </span>
          <p
            className="mt-1.5 text-[11px] uppercase tracking-[0.14em]"
            style={{ color: C.textMute }}
          >
            dossier op orde
          </p>
          <div
            className="mt-3 h-2 w-full overflow-hidden rounded-full"
            style={{ background: C.panelSoft, border: `1px solid ${C.border}` }}
            aria-hidden="true"
          >
            <span
              className="block h-full rounded-full"
              style={{
                width: `${ratio}%`,
                background: C.green,
                boxShadow: glow(C.green, 0.5),
                transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>
        </Frame>
      </section>

      <Frame title="certificaten.db" accent={C.amber}>
        <ul className="space-y-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            const isOpen = open === c.naam;
            return (
              <li
                key={c.naam}
                className="overflow-hidden rounded-[6px]"
                style={{ background: C.panelSoft, border: `1px solid ${C.border}` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-[#16131a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ffb454]"
                >
                  <t.Icon size={17} aria-hidden="true" style={{ color: t.base }} />
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14px] font-semibold"
                      style={{ color: C.text, ...mono }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[11.5px]"
                      style={{ color: C.textMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="hidden sm:inline-flex">
                    <StatusTag {...t} />
                  </span>
                  <span
                    className="text-[15px] transition-transform motion-reduce:transition-none"
                    style={{ color: C.textDim, transform: isOpen ? "rotate(45deg)" : "none" }}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div
                      className="px-4 pb-4 sm:pl-[54px]"
                      style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}
                    >
                      <span className="mb-2 inline-flex sm:hidden">
                        <StatusTag {...t} />
                      </span>
                      <p
                        className="max-w-xl text-[12.5px] leading-relaxed"
                        style={{ color: C.textDim }}
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
                        <Btn size="sm" variant="ghost">
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
      </Frame>

      <Frame title="dossier/documenten" accent={C.cyan}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const t = credTone(d.status);
            return (
              <div
                key={d.naam}
                className="flex items-center gap-3 rounded-[5px] px-3 py-2.5"
                style={{ background: C.panelSoft, border: `1px solid ${C.border}` }}
              >
                <FileText size={16} aria-hidden="true" style={{ color: C.textDim }} />
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13px] font-semibold"
                    style={{ color: C.text }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.textMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-[10.5px] font-semibold uppercase"
                  style={{
                    color: t.base,
                    background: `${t.base}14`,
                    border: `1px solid ${t.base}44`,
                  }}
                >
                  [{t.tag}]<span className="sr-only">{t.label}</span>
                  <t.Icon size={11} aria-hidden="true" />
                </span>
              </div>
            );
          })}
        </div>
      </Frame>
    </div>
  );
}

// —————————————————————————————————— Acties ——————————————————————————————————
function Acties({ onMarkt }: { onMarkt: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <Prompt tone={C.amber}>acties --sort urgentie</Prompt>
        <h1
          className="mt-1.5 text-[25px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ color: C.text, ...mono }}
        >
          Wat vandaag je aandacht vraagt
        </h1>
        <p className="mt-1 text-[12.5px]" style={{ color: C.textMute }}>
          Op volgorde van urgentie — werk van boven naar beneden.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.cyan;
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel}>
              <div
                className="flex items-start gap-4 rounded-[8px] p-4 sm:p-5"
                style={{
                  background: C.panel,
                  border: `1px solid ${warn ? `${C.amber}44` : C.border}`,
                }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] text-[14px] font-semibold"
                  style={{
                    color: tone,
                    background: `${tone}14`,
                    border: `1px solid ${tone}44`,
                    ...num,
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: tone }}
                  >
                    {warn ? (
                      <AlertTriangle size={12} aria-hidden="true" />
                    ) : (
                      <Clock size={12} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </span>
                  <h2
                    className="mt-1.5 text-[16px] font-semibold leading-snug"
                    style={{ color: C.text, ...mono }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[13px] leading-relaxed"
                    style={{ color: C.textDim }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <Btn
                      variant={warn ? "solid" : "line"}
                      size="sm"
                      onClick={goMarkt ? onMarkt : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurTone(status: string): { base: string; tag: string } {
  if (status === "Betaald") return { base: C.green, tag: "OK" };
  if (status === "Openstaand") return { base: C.amber, tag: "!" };
  if (status === "Concept") return { base: C.cyan, tag: ".." };
  return { base: C.red, tag: "X" };
}

function Facturen() {
  const [sort, setSort] = useState<"datum" | "bedrag">("datum");
  const rows = useMemo(() => {
    if (sort === "datum") return FACTUREN;
    return [...FACTUREN].sort(
      (a, b) =>
        parseInt(b.bedrag.replace(/\D/g, ""), 10) - parseInt(a.bedrag.replace(/\D/g, ""), 10),
    );
  }, [sort]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Prompt tone={C.cyan}>grootboek</Prompt>
          <h1
            className="mt-1.5 text-[25px] font-semibold leading-tight tracking-[-0.01em]"
            style={{ color: C.text, ...mono }}
          >
            Je facturen
          </h1>
        </div>
        <Btn variant="solid">
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </Btn>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", tone: C.green },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.amber },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.cyan },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-[6px] p-4"
            style={{ background: C.panel, border: `1px solid ${C.border}` }}
          >
            <p className="text-[9.5px] uppercase tracking-[0.14em]" style={{ color: C.textMute }}>
              {s.l}
            </p>
            <p
              className="mt-1 text-[22px] font-semibold"
              style={{ color: s.tone, textShadow: glow(s.tone, 0.3), ...num }}
            >
              {s.v}
            </p>
            <p className="mt-0.5 text-[11px]" style={{ color: C.textMute }}>
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Btn key={s} size="sm" variant={sort === s ? "solid" : "line"} onClick={() => setSort(s)}>
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Btn>
        ))}
      </div>

      <Frame title="facturen.csv" accent={C.cyan}>
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 520 }}>
            <caption className="sr-only">Overzicht van facturen</caption>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2.5 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: C.textMute, ...mono }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => {
                const t = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#16131a]"
                    style={{ borderTop: `1px solid ${C.border}` }}
                  >
                    <td className="px-3 py-3 text-[12px]" style={{ color: C.textDim, ...num }}>
                      {f.nr}
                    </td>
                    <td className="px-3 py-3 text-[13px] font-semibold" style={{ color: C.text }}>
                      {f.klant}
                    </td>
                    <td className="px-3 py-3 text-[12px]" style={{ color: C.textMute, ...num }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-3 py-3 text-[13px] font-semibold"
                      style={{ color: C.text, ...num }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em]"
                        style={{
                          color: t.base,
                          background: `${t.base}14`,
                          border: `1px solid ${t.base}44`,
                          ...mono,
                        }}
                      >
                        <span aria-hidden="true">[{t.tag}]</span>
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Frame>
    </div>
  );
}
