"use client";

// Concept 84 — "Draad" · Superhuman/Linear-grade snelheids-inbox (licht).
// Het hele platform als één razendsnelle triage-inbox: smalle draad-lijst links, breed
// lees-paneel rechts. Alles is een "draad" (match, reactie, verificatie, factuur) met een
// ongelezen-stip. Sneltoetsen overal (J/K navigeren, E archiveren, ⌘K commando, Enter openen),
// inbox-zero-werkmodel. De zes schermen zijn mappen/filters in de inbox-metafoor. Snelheid als
// functie: strakke rijen, keyboard-affordances, actieve-rij-highlight, hover-preview.
// Palet: bg #fbfbfd, fg #14131a, accent #6d5efc. Fonts: --font-lab-inter + --font-lab-mono (kbd/meta).

import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Plus,
  MapPin,
  Inbox,
  Command,
  Archive,
  CornerDownLeft,
  Zap,
  Mail,
  FileText,
  Star,
  Circle,
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
  NAV,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#fbfbfd",
  surface: "#ffffff",
  fg: "#14131a",
  muted: "#6b6976",
  faint: "#9a98a6",
  accent: "#6d5efc",
  accentSoft: "#efedff",
  accentLine: "#d9d4ff",
  green: "#0a9d6e",
  amber: "#c2760a",
  red: "#e11d48",
  line: "#ececf1",
  lineSoft: "#f2f1f5",
  rowActive: "#f5f4ff",
};

const body = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

const SHADOW = "0 1px 2px rgba(20,19,26,0.04), 0 8px 28px -18px rgba(20,19,26,0.18)";

/* ---------- Sneltoets-chip ---------- */

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] px-1 text-[10px] font-semibold leading-none"
      style={{
        ...mono,
        color: C.muted,
        background: C.surface,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 0 rgba(20,19,26,0.06)",
      }}
    >
      {children}
    </kbd>
  );
}

function ShortcutHint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: C.muted }}>
      <span className="flex items-center gap-0.5">
        {keys.map((k) => (
          <Kbd key={k}>{k}</Kbd>
        ))}
      </span>
      {label}
    </span>
  );
}

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; bg: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.green, bg: "#e7f6f0", Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.accent, bg: C.accentSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", color: C.amber, bg: "#fdf3e3", Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.red, bg: "#fdeaef", Icon: XCircle };
  }
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...body, color: m.color, background: m.bg }}
    >
      <Icon size={13} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Kleine bouwstenen ---------- */

function Title({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      <h1 className="text-[19px] font-semibold tracking-[-0.01em]" style={{ ...body, color: C.fg }}>
        {children}
      </h1>
      {sub && (
        <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function Spark({ data, color = C.accent }: { data: number[]; color?: string }) {
  const w = 88;
  const h = 26;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1]!;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2" fill={color} />
    </svg>
  );
}

function MatchPill({ value }: { value: number }) {
  const strong = value >= 90;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
      style={{
        ...mono,
        color: strong ? C.accent : C.muted,
        background: strong ? C.accentSoft : C.lineSoft,
      }}
    >
      {value}%
    </span>
  );
}

/* ---------- Map-icoon per scherm ---------- */

function screenIcon(key: ScreenKey): typeof Inbox {
  switch (key) {
    case "dashboard":
      return Inbox;
    case "marktplaats":
      return Zap;
    case "opdracht":
      return Mail;
    case "verificatie":
      return ShieldCheck;
    case "acties":
      return Star;
    case "facturen":
      return FileText;
    default:
      return Circle;
  }
}

// Ongelezen-tellingen per map (afgeleid van de mock, deterministisch).
function unreadFor(key: ScreenKey): number {
  switch (key) {
    case "dashboard":
      return BERICHTEN.filter((b) => b.ongelezen).length;
    case "marktplaats":
      return OPDRACHTEN.filter((o) => o.match >= 85).length;
    case "verificatie":
      return CREDENTIALS.filter((c) => c.status !== "VERIFIED").length;
    case "acties":
      return ACTIES.length;
    case "facturen":
      return FACTUREN.filter((f) => f.status === "Openstaand").length;
    default:
      return 0;
  }
}

/* ---------- Hoofdcomponent ---------- */

export function Concept84() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);
  const [palette, setPalette] = useState(false);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  // ⌘K / Ctrl+K opent het commandopalet — de kern-affordance van de inbox.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
      if (e.key === "Escape") setPalette(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="relative flex min-h-[680px] w-full flex-col overflow-hidden antialiased"
      style={{ ...body, color: C.fg, background: C.bg }}
    >
      {/* Topbalk */}
      <header
        className="flex items-center gap-3 px-4 py-2.5"
        style={{ borderBottom: `1px solid ${C.line}`, background: C.surface }}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: C.accent }}
          aria-hidden="true"
        >
          <Inbox size={17} strokeWidth={2.2} color="#fff" />
        </span>
        <span className="text-[15px] font-semibold tracking-tight" style={{ color: C.fg }}>
          Draad
        </span>
        <button
          onClick={() => setPalette(true)}
          className="ml-2 hidden items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] transition-colors hover:bg-[#f2f1f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5efc] sm:flex"
          style={{ color: C.muted, border: `1px solid ${C.line}`, background: C.bg }}
        >
          <Search size={14} strokeWidth={2.2} aria-hidden="true" />
          Zoek of spring naar…
          <span className="ml-8 flex items-center gap-0.5">
            <Kbd>
              <Command size={10} strokeWidth={2.5} aria-hidden="true" />
            </Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
        <div className="ml-auto flex items-center gap-3">
          <span
            className="hidden items-center gap-1.5 text-[11px] font-semibold sm:inline-flex"
            style={{ color: C.green }}
          >
            <ShieldCheck size={13} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold"
            style={{ ...mono, color: "#fff", background: C.accent }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Mappen-rail */}
        <nav
          aria-label="Hoofdnavigatie"
          className="flex shrink-0 flex-row gap-1 overflow-x-auto p-2 md:w-[210px] md:flex-col"
          style={{ borderRight: `1px solid ${C.line}`, background: C.surface }}
        >
          <p
            className="hidden px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] md:block"
            style={{ ...mono, color: C.faint }}
          >
            Mappen
          </p>
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = screenIcon(s.key);
            const n = unreadFor(s.key);
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5efc] md:w-full"
                style={{
                  color: on ? C.accent : C.muted,
                  background: on ? C.accentSoft : "transparent",
                }}
              >
                <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
                <span className="flex-1">{s.label}</span>
                {n > 0 && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
                    style={{
                      ...mono,
                      color: on ? C.accent : C.faint,
                      background: on ? C.surface : C.lineSoft,
                    }}
                  >
                    {n}
                  </span>
                )}
              </button>
            );
          })}

          <div className="mt-auto hidden md:block">
            <div
              className="mx-2 rounded-lg p-3"
              style={{ background: C.bg, border: `1px solid ${C.line}` }}
            >
              <p className="text-[11px] font-semibold" style={{ color: C.fg }}>
                Inbox-zero werkmodel
              </p>
              <div className="mt-2 space-y-1.5">
                <ShortcutHint keys={["J", "K"]} label="navigeren" />
                <ShortcutHint keys={["E"]} label="archiveren" />
                <ShortcutHint keys={["↵"]} label="openen" />
              </div>
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
          {screen === "marktplaats" && (
            <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
          )}
          {screen === "opdracht" && <OpdrachtDetail opdracht={active} onGo={setScreen} />}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties onGo={setScreen} />}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>

      {/* Commandopalet-overlay */}
      {palette && (
        <CommandPalette
          onClose={() => setPalette(false)}
          onGo={(k) => {
            setScreen(k);
            setPalette(false);
          }}
        />
      )}
    </div>
  );
}

/* ---------- Commandopalet ---------- */

function CommandPalette({ onClose, onGo }: { onClose: () => void; onGo: (k: ScreenKey) => void }) {
  const [q, setQ] = useState("");
  const results = SCREENS.filter((s) => s.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div
      className="absolute inset-0 z-20 flex items-start justify-center px-4 pt-[12vh]"
      style={{ background: "rgba(20,19,26,0.28)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Commandopalet"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl"
        style={{ background: C.surface, boxShadow: "0 24px 64px -24px rgba(20,19,26,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-2.5 px-4 py-3"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <Command size={16} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Spring naar map of typ een commando…"
            aria-label="Commando zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#9a98a6]"
            style={{ color: C.fg }}
          />
          <Kbd>esc</Kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-[12.5px]" style={{ color: C.muted }}>
              Geen commando gevonden voor &quot;{q}&quot;.
            </li>
          ) : (
            results.map((s) => {
              const Icon = screenIcon(s.key);
              return (
                <li key={s.key}>
                  <button
                    onClick={() => onGo(s.key)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-[#f5f4ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5efc]"
                    style={{ color: C.fg }}
                  >
                    <Icon size={16} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
                    <span className="flex-1">Ga naar {s.label}</span>
                    <CornerDownLeft
                      size={13}
                      strokeWidth={2.2}
                      color={C.faint}
                      aria-hidden="true"
                    />
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

/* ---------- Footer met sneltoetsen ---------- */

function ShortcutBar({ extra }: { extra?: React.ReactNode }) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5"
      style={{ borderTop: `1px solid ${C.line}`, background: C.surface }}
    >
      <ShortcutHint keys={["J", "K"]} label="navigeren" />
      <ShortcutHint keys={["↵"]} label="openen" />
      <ShortcutHint keys={["E"]} label="archiveren" />
      {extra}
      <span className="ml-auto flex items-center gap-1.5 text-[11px]" style={{ color: C.faint }}>
        <Command size={12} strokeWidth={2.2} aria-hidden="true" /> K voor commando&apos;s
      </span>
    </div>
  );
}

/* ---------- Dashboard (map: Inbox-overzicht) ---------- */

function Dashboard({
  onOpen,
  onGo,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
}) {
  const warn = ACTIES[0];
  const [feed, setFeed] = useState<"loading" | "error" | "ok">("loading");
  useEffect(() => {
    const t = window.setTimeout(() => setFeed("error"), 700);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: `1px solid ${C.line}`, background: C.surface }}
      >
        <Title sub={`${PROFIEL.rol} · ${PROFIEL.plaats}`}>
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </Title>
        <button
          onClick={() => onGo("marktplaats")}
          className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-semibold text-white transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5efc] sm:flex"
          style={{ background: C.accent }}
        >
          <Zap size={14} strokeWidth={2.4} aria-hidden="true" /> Triage matches
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="mx-auto max-w-4xl space-y-5">
          {warn && (
            <div
              className="flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center"
              style={{ background: "#fdf3e3", border: `1px solid #f3dcae` }}
              role="alert"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-lg"
                style={{ background: "#fff" }}
              >
                <AlertTriangle size={17} strokeWidth={2.2} color={C.amber} aria-hidden="true" />
              </span>
              <p className="text-[13px] leading-snug" style={{ color: C.fg }}>
                <span className="font-semibold">{warn.titel}.</span>{" "}
                <span style={{ color: C.muted }}>{warn.detail}</span>
              </p>
              <button
                onClick={() => onGo("verificatie")}
                className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5efc]"
                style={{ background: C.amber }}
              >
                {warn.cta} <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* KPI-tegels */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {KPIS.map((k) => (
              <div
                key={k.label}
                className="rounded-xl p-3.5"
                style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SHADOW }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-medium leading-tight" style={{ color: C.muted }}>
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                    style={{ ...mono, color: k.up ? C.green : C.amber }}
                  >
                    {k.up ? (
                      <ArrowUpRight size={12} strokeWidth={2.6} aria-hidden="true" />
                    ) : (
                      <ArrowDownRight size={12} strokeWidth={2.6} aria-hidden="true" />
                    )}
                    {k.trend}
                  </span>
                </div>
                <p
                  className="mt-2 text-[22px] font-semibold tabular-nums leading-none"
                  style={{ color: C.fg }}
                >
                  {k.value}
                </p>
                <div className="mt-2">
                  <Spark data={k.spark} color={k.up ? C.accent : C.amber} />
                </div>
              </div>
            ))}
          </div>

          {/* Vandaag — draad-lijst */}
          <div
            className="overflow-hidden rounded-xl"
            style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SHADOW }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <h3 className="text-[13px] font-semibold" style={{ color: C.fg }}>
                Warme draden vandaag
              </h3>
              <button
                onClick={() => onGo("marktplaats")}
                className="inline-flex items-center gap-1 text-[12px] font-semibold transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5efc]"
                style={{ color: C.accent }}
              >
                Alles <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    onClick={() => onOpen(o.id)}
                    className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f5f4ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6d5efc]"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        background: o.match >= 90 ? C.accent : "transparent",
                        border: o.match >= 90 ? "none" : `1.5px solid ${C.faint}`,
                      }}
                      aria-label={o.match >= 90 ? "ongelezen" : "gelezen"}
                    />
                    <MatchPill value={o.match} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13.5px] font-semibold"
                        style={{ color: C.fg }}
                      >
                        {o.titel}
                      </span>
                      <span className="block truncate text-[12px]" style={{ color: C.muted }}>
                        {o.opdrachtgever} · {o.plaats}
                      </span>
                    </span>
                    <span
                      className="hidden shrink-0 text-[11.5px] tabular-nums sm:block"
                      style={{ ...mono, color: C.faint }}
                    >
                      {o.tarief}
                    </span>
                    <ArrowRight
                      size={15}
                      strokeWidth={2.2}
                      color={C.faint}
                      className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Berichten + sensor-feed (loading/error/ok) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div
              className="overflow-hidden rounded-xl"
              style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SHADOW }}
            >
              <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                <h3
                  className="flex items-center gap-2 text-[13px] font-semibold"
                  style={{ color: C.fg }}
                >
                  <Mail size={14} strokeWidth={2.2} color={C.accent} aria-hidden="true" /> Berichten
                </h3>
              </div>
              <ul>
                {BERICHTEN.map((b, i) => (
                  <li
                    key={b.van}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        background: b.ongelezen ? C.accent : "transparent",
                        border: b.ongelezen ? "none" : `1.5px solid ${C.faint}`,
                      }}
                      aria-label={b.ongelezen ? "ongelezen" : "gelezen"}
                    />
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                      style={{ ...mono, color: C.accent, background: C.accentSoft }}
                      aria-hidden="true"
                    >
                      {b.initialen}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className="truncate text-[13px] font-semibold"
                          style={{ color: C.fg }}
                        >
                          {b.van}
                        </span>
                        <span
                          className="shrink-0 text-[11px] tabular-nums"
                          style={{ ...mono, color: C.faint }}
                        >
                          {b.tijd}
                        </span>
                      </span>
                      <span className="block truncate text-[12px]" style={{ color: C.muted }}>
                        {b.preview}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-xl p-4"
              style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SHADOW }}
            >
              <h3
                className="flex items-center gap-2 text-[13px] font-semibold"
                style={{ color: C.fg }}
              >
                <Zap size={14} strokeWidth={2.2} color={C.accent} aria-hidden="true" /> Live matches
              </h3>
              {feed === "loading" && (
                <div className="mt-3 space-y-2" role="status" aria-live="polite">
                  <span className="sr-only">Matches laden…</span>
                  {[0, 1].map((i) => (
                    <span
                      key={i}
                      className="block h-3 animate-pulse rounded"
                      style={{ background: C.lineSoft, width: i === 0 ? "80%" : "55%" }}
                    />
                  ))}
                </div>
              )}
              {feed === "error" && (
                <div
                  className="mt-3 flex flex-col gap-2 rounded-lg p-3 sm:flex-row sm:items-center"
                  style={{ background: "#fdeaef", border: `1px solid #f6c9d5` }}
                  role="alert"
                >
                  <XCircle size={16} strokeWidth={2.2} color={C.red} aria-hidden="true" />
                  <p className="flex-1 text-[12px]" style={{ color: C.fg }}>
                    Kon live matches niet laden.
                  </p>
                  <button
                    onClick={() => setFeed("ok")}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5efc]"
                    style={{ background: C.accent }}
                  >
                    Opnieuw
                  </button>
                </div>
              )}
              {feed === "ok" && (
                <p className="mt-3 flex items-center gap-2 text-[12px]" style={{ color: C.muted }}>
                  <Check size={14} strokeWidth={2.6} color={C.green} aria-hidden="true" /> Verbonden
                  — {OPDRACHTEN.length} matches in beeld.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <ShortcutBar />
    </div>
  );
}

/* ---------- Marktplaats (map: Triage — met echte J/K/E-navigatie) ---------- */

function Marktplaats({
  activeId,
  onSelect,
  onOpen,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onOpen: (id?: string) => void;
}) {
  const [archived, setArchived] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const listRef = useRef<HTMLUListElement>(null);

  const visible = OPDRACHTEN.filter(
    (o) =>
      !archived.has(o.id) &&
      (o.titel.toLowerCase().includes(q.toLowerCase()) ||
        o.plaats.toLowerCase().includes(q.toLowerCase()) ||
        o.opdrachtgever.toLowerCase().includes(q.toLowerCase())),
  );
  const idx = Math.max(
    0,
    visible.findIndex((o) => o.id === activeId),
  );
  const sel = visible[idx] ?? visible[0];

  // Superhuman-stijl toetsen: J/K navigeren, E archiveren, Enter openen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const cur = visible.findIndex((o) => o.id === (sel?.id ?? ""));
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = visible[Math.min(visible.length - 1, cur + 1)];
        if (next) onSelect(next.id);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = visible[Math.max(0, cur - 1)];
        if (prev) onSelect(prev.id);
      } else if (e.key === "Enter" && sel) {
        e.preventDefault();
        onOpen(sel.id);
      } else if (e.key.toLowerCase() === "e" && sel) {
        e.preventDefault();
        setArchived((prev) => {
          const nx = new Set(prev);
          nx.add(sel.id);
          return nx;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, sel, onOpen, onSelect]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="flex items-center gap-3 px-5 py-3.5"
        style={{ borderBottom: `1px solid ${C.line}`, background: C.surface }}
      >
        <Title sub={`${visible.length} onbehandeld · triage-modus`}>Marktplaats</Title>
        <div
          className="ml-auto flex items-center gap-2 rounded-lg px-3 py-1.5"
          style={{ border: `1px solid ${C.line}`, background: C.bg }}
        >
          <Search size={14} strokeWidth={2.2} color={C.faint} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter draden…"
            aria-label="Draden filteren"
            className="w-32 bg-transparent text-[12.5px] outline-none placeholder:text-[#9a98a6] sm:w-44"
            style={{ color: C.fg }}
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.accentSoft }}
            aria-hidden="true"
          >
            <Check size={26} strokeWidth={2.4} color={C.accent} />
          </span>
          <p className="mt-4 text-[17px] font-semibold" style={{ color: C.fg }}>
            {archived.size > 0 && q === "" ? "Inbox-zero bereikt" : "Geen draden gevonden"}
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            {archived.size > 0 && q === ""
              ? "Alle matches getrieerd. Nieuwe draden verschijnen hier vanzelf."
              : `Niets past bij "${q}".`}
          </p>
          {(archived.size > 0 || q !== "") && (
            <button
              onClick={() => {
                setArchived(new Set());
                setQ("");
              }}
              className="mt-5 rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5efc]"
              style={{ background: C.accent }}
            >
              Herstel inbox
            </button>
          )}
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr]">
          {/* Draad-lijst */}
          <ul
            ref={listRef}
            className="min-h-0 overflow-y-auto"
            style={{ borderRight: `1px solid ${C.line}`, background: C.surface }}
          >
            {visible.map((o) => {
              const on = sel?.id === o.id;
              return (
                <li key={o.id} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                  <button
                    onClick={() => onSelect(o.id)}
                    aria-current={on ? "true" : undefined}
                    className="relative flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[#f5f4ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6d5efc]"
                    style={{ background: on ? C.rowActive : "transparent" }}
                  >
                    {on && (
                      <span
                        className="absolute left-0 top-0 h-full w-[3px]"
                        style={{ background: C.accent }}
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{
                        background: o.match >= 85 ? C.accent : "transparent",
                        border: o.match >= 85 ? "none" : `1.5px solid ${C.faint}`,
                      }}
                      aria-label={o.match >= 85 ? "ongelezen" : "gelezen"}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className="truncate text-[13px] font-semibold"
                          style={{ color: C.fg }}
                        >
                          {o.opdrachtgever}
                        </span>
                        <MatchPill value={o.match} />
                      </span>
                      <span className="mt-0.5 block truncate text-[13px]" style={{ color: C.fg }}>
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={11} strokeWidth={2.2} aria-hidden="true" /> {o.plaats} ·{" "}
                        {o.tarief}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Lees-paneel */}
          {sel && (
            <div className="hidden min-h-0 flex-col overflow-y-auto lg:flex">
              <div
                className="flex items-center gap-2 px-5 py-3"
                style={{ borderBottom: `1px solid ${C.line}` }}
              >
                <button
                  onClick={() =>
                    setArchived((prev) => {
                      const nx = new Set(prev);
                      nx.add(sel.id);
                      return nx;
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors hover:bg-[#f2f1f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5efc]"
                  style={{ color: C.muted, border: `1px solid ${C.line}` }}
                >
                  <Archive size={13} strokeWidth={2.2} aria-hidden="true" /> Archiveer <Kbd>E</Kbd>
                </button>
                <button
                  onClick={() => onOpen(sel.id)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5efc]"
                  style={{ background: C.accent }}
                >
                  Open opdracht <Kbd>↵</Kbd>
                </button>
              </div>
              <div className="p-5">
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.accent }}
                >
                  {sel.id}
                </span>
                <h2
                  className="mt-1.5 text-[19px] font-semibold leading-snug"
                  style={{ color: C.fg }}
                >
                  {sel.titel}
                </h2>
                <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
                  {sel.opdrachtgever} · {sel.plaats}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {sel.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md px-2 py-0.5 text-[11px] font-medium"
                      style={{ color: C.muted, background: C.lineSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { l: "Tarief", v: sel.tarief },
                    { l: "Omvang", v: sel.uren },
                    { l: "Start", v: sel.start },
                    { l: "Match", v: `${sel.match}%` },
                  ].map((m) => (
                    <div
                      key={m.l}
                      className="rounded-lg p-3"
                      style={{ background: C.bg, border: `1px solid ${C.line}` }}
                    >
                      <dt
                        className="text-[10.5px] font-semibold uppercase tracking-[0.06em]"
                        style={{ ...mono, color: C.faint }}
                      >
                        {m.l}
                      </dt>
                      <dd
                        className="mt-1 text-[14px] font-semibold tabular-nums"
                        style={{ color: C.fg }}
                      >
                        {m.v}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p
                      className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em]"
                      style={{ color: C.green }}
                    >
                      <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {sel.redenen.plus.map((r) => (
                        <li
                          key={r}
                          className="flex items-start gap-2 text-[12.5px]"
                          style={{ color: C.fg }}
                        >
                          <Check
                            size={14}
                            strokeWidth={2.6}
                            color={C.green}
                            className="mt-0.5 shrink-0"
                            aria-hidden="true"
                          />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p
                      className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em]"
                      style={{ color: C.amber }}
                    >
                      <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" />{" "}
                      Aandachtspunten
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {sel.redenen.min.map((r) => (
                        <li
                          key={r}
                          className="flex items-start gap-2 text-[12.5px]"
                          style={{ color: C.muted }}
                        >
                          <AlertTriangle
                            size={14}
                            strokeWidth={2.4}
                            color={C.amber}
                            className="mt-0.5 shrink-0"
                            aria-hidden="true"
                          />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <ShortcutBar
        extra={
          <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: C.muted }}>
            <Archive size={12} strokeWidth={2.2} aria-hidden="true" /> {archived.size} gearchiveerd
          </span>
        }
      />
    </div>
  );
}

/* ---------- Opdracht-detail (open draad) ---------- */

function OpdrachtDetail({ opdracht, onGo }: { opdracht: Opdracht; onGo: (k: ScreenKey) => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="flex items-center gap-3 px-5 py-3"
        style={{ borderBottom: `1px solid ${C.line}`, background: C.surface }}
      >
        <button
          onClick={() => onGo("marktplaats")}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors hover:bg-[#f2f1f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5efc]"
          style={{ color: C.muted, border: `1px solid ${C.line}` }}
        >
          <ArrowRight size={13} strokeWidth={2.2} className="rotate-180" aria-hidden="true" /> Terug
        </button>
        <span className="text-[12px] font-semibold" style={{ ...mono, color: C.accent }}>
          {opdracht.id}
        </span>
        <MatchPill value={opdracht.match} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-start gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[13px] font-semibold"
              style={{ ...mono, color: C.accent, background: C.accentSoft }}
              aria-hidden="true"
            >
              {opdracht.opdrachtgever.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h1
                className="text-[21px] font-semibold leading-tight tracking-[-0.01em]"
                style={{ color: C.fg }}
              >
                {opdracht.titel}
              </h1>
              <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-md px-2 py-0.5 text-[11px] font-medium"
                style={{ color: C.muted, background: C.lineSoft }}
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Tarief", v: opdracht.tarief },
              { l: "Omvang", v: opdracht.uren },
              { l: "Start", v: opdracht.start },
              { l: "Match", v: `${opdracht.match}%` },
            ].map((m) => (
              <div
                key={m.l}
                className="rounded-lg p-3"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.06em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {m.l}
                </p>
                <p className="mt-1 text-[15px] font-semibold tabular-nums" style={{ color: C.fg }}>
                  {m.v}
                </p>
              </div>
            ))}
          </div>

          <div
            className="mt-5 overflow-hidden rounded-xl"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
              <h3 className="text-[13px] font-semibold" style={{ color: C.fg }}>
                Waarom deze match
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="p-4" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                <p
                  className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: C.green }}
                >
                  <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.plus.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ color: C.fg }}
                    >
                      <Check
                        size={15}
                        strokeWidth={2.6}
                        color={C.green}
                        className="mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                <p
                  className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: C.amber }}
                >
                  <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Aandachtspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ color: C.muted }}
                    >
                      <AlertTriangle
                        size={15}
                        strokeWidth={2.4}
                        color={C.amber}
                        className="mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-semibold text-white transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5efc] disabled:opacity-90"
            style={{ background: state === "sent" ? C.green : C.accent }}
          >
            {state === "idle" && (
              <>
                Reageer op opdracht{" "}
                <CornerDownLeft size={15} strokeWidth={2.6} aria-hidden="true" />
              </>
            )}
            {state === "sending" && "Versturen…"}
            {state === "sent" && (
              <>
                <Check size={15} strokeWidth={3} aria-hidden="true" /> Reactie verstuurd
              </>
            )}
          </button>
        </div>
      </div>
      <ShortcutBar />
    </div>
  );
}

/* ---------- Verificatie (map: Verificatie-draden) ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="px-5 py-3.5"
        style={{ borderBottom: `1px solid ${C.line}`, background: C.surface }}
      >
        <Title sub={`${verified}/${total} geverifieerd · privé bewaard`}>Verificatie</Title>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="mx-auto max-w-3xl space-y-5">
          <div
            className="overflow-hidden rounded-xl"
            style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SHADOW }}
          >
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
              <h3 className="text-[13px] font-semibold" style={{ color: C.fg }}>
                Certificaten
              </h3>
            </div>
            <ul>
              {CREDENTIALS.map((c, i) => {
                const m = credMeta(c.status);
                const Icon = m.Icon;
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 px-4 py-3.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: m.bg }}
                    >
                      <Icon size={18} strokeWidth={2.2} color={m.color} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold" style={{ color: C.fg }}>
                        {c.naam}
                      </p>
                      <p className="text-[12px]" style={{ color: C.muted }}>
                        {c.detail}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </li>
                );
              })}
            </ul>
          </div>

          <div
            className="overflow-hidden rounded-xl"
            style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SHADOW }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <FileText size={14} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
              <h3 className="text-[13px] font-semibold" style={{ color: C.fg }}>
                Documenten
              </h3>
            </div>
            <ul>
              {DOCUMENTEN.map((d, i) => {
                const m = credMeta(d.status);
                return (
                  <li
                    key={d.naam}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[9px] font-semibold"
                      style={{ ...mono, color: C.muted, background: C.lineSoft }}
                      aria-hidden="true"
                    >
                      {d.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold" style={{ color: C.fg }}>
                        {d.naam}
                      </p>
                      <p className="text-[11.5px]" style={{ ...mono, color: C.faint }}>
                        {d.grootte} · {d.bijgewerkt}
                      </p>
                    </div>
                    <span className="text-[11.5px] font-semibold" style={{ color: m.color }}>
                      {m.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
      <ShortcutBar />
    </div>
  );
}

/* ---------- Acties (map: Volgende acties) ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="px-5 py-3.5"
        style={{ borderBottom: `1px solid ${C.line}`, background: C.surface }}
      >
        <Title sub="Op volgorde van urgentie — begin bovenaan">Volgende acties</Title>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="mx-auto max-w-2xl space-y-3">
          {ACTIES.map((a, i) => {
            const warn = a.urgentie === "warning";
            const color = warn ? C.amber : C.accent;
            return (
              <div
                key={a.titel}
                className="flex items-start gap-3 rounded-xl p-4"
                style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SHADOW }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: warn ? "#fdf3e3" : C.accentSoft }}
                >
                  {warn ? (
                    <AlertTriangle size={17} strokeWidth={2.2} color={color} aria-hidden="true" />
                  ) : (
                    <Star size={17} strokeWidth={2.2} color={color} aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                      style={{ ...mono, color }}
                    >
                      {warn ? "Waarschuwing" : "Melding"}
                    </span>
                    <span
                      className="text-[10.5px] tabular-nums"
                      style={{ ...mono, color: C.faint }}
                    >
                      #{String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] font-semibold" style={{ color: C.fg }}>
                    {a.titel}
                  </p>
                  <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                  className="shrink-0 self-center rounded-lg px-3.5 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5efc]"
                  style={{
                    color: warn ? "#fff" : C.accent,
                    background: warn ? C.amber : C.accentSoft,
                  }}
                >
                  {a.cta}
                </button>
              </div>
            );
          })}

          <div
            className="flex items-center gap-3 rounded-xl p-4"
            style={{ background: C.accentSoft, border: `1px solid ${C.accentLine}` }}
          >
            <Check size={18} strokeWidth={2.4} color={C.accent} aria-hidden="true" />
            <p className="text-[12.5px]" style={{ color: C.muted }}>
              Verder is je inbox leeg. Nieuwe acties verschijnen hier vanzelf.
            </p>
          </div>
        </div>
      </div>
      <ShortcutBar />
    </div>
  );
}

/* ---------- Facturen (map: Facturen) ---------- */

function Facturen() {
  const statusColor: Record<string, string> = {
    Betaald: C.green,
    Openstaand: C.amber,
    Concept: C.faint,
  };
  const statusBg: Record<string, string> = {
    Betaald: "#e7f6f0",
    Openstaand: "#fdf3e3",
    Concept: C.lineSoft,
  };
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: `1px solid ${C.line}`, background: C.surface }}
      >
        <Title sub={`${FACTUREN.length} facturen · ${NAV.length} modules`}>Facturen</Title>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-semibold text-white transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5efc]"
          style={{ background: C.accent }}
        >
          <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-xl p-4"
              style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SHADOW }}
            >
              <p className="text-[11px] font-medium" style={{ color: C.muted }}>
                Ontvangen
              </p>
              <p
                className="mt-1.5 text-[22px] font-semibold tabular-nums"
                style={{ color: C.green }}
              >
                € {betaald.toLocaleString("nl-NL")}
              </p>
            </div>
            <div
              className="rounded-xl p-4"
              style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SHADOW }}
            >
              <p className="text-[11px] font-medium" style={{ color: C.muted }}>
                Openstaand
              </p>
              <p
                className="mt-1.5 text-[22px] font-semibold tabular-nums"
                style={{ color: C.amber }}
              >
                € {open.toLocaleString("nl-NL")}
              </p>
            </div>
          </div>

          <div
            className="overflow-x-auto rounded-xl"
            style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SHADOW }}
          >
            <table className="w-full text-left">
              <thead>
                <tr
                  className="text-[10.5px] font-semibold uppercase tracking-[0.06em]"
                  style={{ ...mono, color: C.faint, borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <th className="px-4 py-3">Nummer</th>
                  <th className="px-4 py-3">Klant</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Datum</th>
                  <th className="px-4 py-3 text-right">Bedrag</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {FACTUREN.map((f, i) => {
                  const color = statusColor[f.status] ?? C.faint;
                  const bg = statusBg[f.status] ?? C.lineSoft;
                  return (
                    <tr
                      key={f.nr}
                      className="transition-colors hover:bg-[#f5f4ff]"
                      style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                    >
                      <td
                        className="px-4 py-3 text-[12px] font-semibold tabular-nums"
                        style={{ ...mono, color: C.fg }}
                      >
                        {f.nr}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-medium" style={{ color: C.fg }}>
                        {f.klant}
                      </td>
                      <td
                        className="hidden px-4 py-3 text-[12px] tabular-nums sm:table-cell"
                        style={{ ...mono, color: C.muted }}
                      >
                        {f.datum}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-[13px] font-semibold tabular-nums"
                        style={{ ...mono, color: C.fg }}
                      >
                        {f.bedrag}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                            style={{ color, background: bg }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: color }}
                              aria-hidden="true"
                            />
                            {f.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ShortcutBar />
    </div>
  );
}
