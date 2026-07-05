"use client";

// Concept 88 — "Widget" · glanceable widget-home (iOS / Family-metafoor, licht-speels).
// Stapelbare, levende widget-tegels die je in één oogopslag leest: afgeronde-3xl tegels met
// speelse diepte, zachte hover-lift en parallax, en een subtiele widget-stack. Geen strak
// bento-raster — elke tegel is een mini-app met eigen ritme, kleuraccent en één actie.
// De zes schermen zijn "widget-collecties".
// Palet: bg #eef0f4, fg #191b22, accent #ff5a5f.
// Fonts: --font-lab-bricolage (display) + --font-lab-inter (body).

import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Compass,
  FileText,
  ShieldCheck,
  ListChecks,
  Receipt,
  ArrowUpRight,
  ArrowRight,
  Search,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Plus,
  MapPin,
  CalendarClock,
  MessageCircle,
  Wallet,
  Timer,
  Sparkles,
  Star,
  RotateCw,
  Bell,
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
  bg: "#eef0f4",
  fg: "#191b22",
  muted: "#5c5f6b",
  faint: "#8a8d99",
  accent: "#ff5a5f",
  surface: "#ffffff",
  line: "rgba(25,27,34,0.08)",
  lineSoft: "rgba(25,27,34,0.05)",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const body = { fontFamily: "var(--font-lab-inter)" };

type Tint = { solid: string; fg: string; soft: string; ring: string };

const TINT: Record<string, Tint> = {
  coral: { solid: "#ff5a5f", fg: "#d23b40", soft: "#ffe9ea", ring: "rgba(255,90,95,0.28)" },
  indigo: { solid: "#6366f1", fg: "#4f46e5", soft: "#eceaff", ring: "rgba(99,102,241,0.28)" },
  amber: { solid: "#f59e0b", fg: "#a86400", soft: "#fff1d6", ring: "rgba(245,158,11,0.28)" },
  green: { solid: "#10b981", fg: "#0d8a62", soft: "#dcf3ea", ring: "rgba(16,185,129,0.28)" },
  sky: { solid: "#38bdf8", fg: "#0c86bf", soft: "#e0f3fd", ring: "rgba(56,189,248,0.28)" },
  violet: { solid: "#8b5cf6", fg: "#6f45d6", soft: "#efe8ff", ring: "rgba(139,92,246,0.28)" },
};

const TILE = "0 2px 4px rgba(25,27,34,0.04), 0 14px 40px -22px rgba(25,27,34,0.28)";

/* ---------- Icoon per scherm ---------- */

const SCREEN_ICON: Record<ScreenKey, typeof LayoutGrid> = {
  dashboard: LayoutGrid,
  marktplaats: Compass,
  opdracht: FileText,
  verificatie: ShieldCheck,
  documenten: FileText,
  facturen: Receipt,
  berichten: MessageCircle,
  acties: ListChecks,
};

/* ---------- Status → betekenis (label + icoon + tint, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; tint: Tint; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", tint: TINT.green as Tint, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", tint: TINT.indigo as Tint, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", tint: TINT.amber as Tint, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", tint: TINT.coral as Tint, Icon: XCircle };
  }
}

const FACTUUR_TINT: Record<string, Tint> = {
  Betaald: TINT.green as Tint,
  Openstaand: TINT.amber as Tint,
  Concept: TINT.indigo as Tint,
};

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Kleine bouwstenen ---------- */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
      style={{ ...body, color: C.accent }}
    >
      <Sparkles size={12} strokeWidth={2.4} aria-hidden="true" />
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-1.5 text-[27px] leading-[1.05] tracking-[-0.02em] sm:text-[34px]"
      style={{ ...display, color: C.fg, fontWeight: 700 }}
    >
      {children}
    </h1>
  );
}

// Widget-omhulsel: afgeronde-3xl tegel met hover-lift + parallax-groep.
function Widget({
  children,
  tint,
  className = "",
  onClick,
  label,
}: {
  children: React.ReactNode;
  tint?: Tint;
  className?: string;
  onClick?: () => void;
  label?: string;
}) {
  const base =
    "group relative flex flex-col overflow-hidden rounded-[26px] p-5 text-left transition-transform duration-200 will-change-transform";
  const style: React.CSSProperties = {
    background: C.surface,
    boxShadow: TILE,
    border: `1px solid ${C.line}`,
  };
  if (onClick) {
    return (
      <button
        onClick={onClick}
        aria-label={label}
        className={`${base} hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${className}`}
        style={{ ...style, ["--tw-ring-color" as string]: tint?.solid ?? C.accent }}
      >
        {children}
      </button>
    );
  }
  return (
    <div className={`${base} ${className}`} style={style}>
      {children}
    </div>
  );
}

// Widget-icoonbadge met zachte parallax-lift bij hover.
function WidgetIcon({ tint, Icon }: { tint: Tint; Icon: typeof ShieldCheck }) {
  return (
    <span
      className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105"
      style={{ background: tint.soft }}
      aria-hidden="true"
    >
      <Icon size={21} strokeWidth={2.3} color={tint.fg} />
    </span>
  );
}

function StatusPill({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
      style={{ ...body, color: m.tint.fg, background: m.tint.soft }}
    >
      <Icon size={12.5} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function MatchRing({ value, size = 48, tint }: { value: number; size?: number; tint?: Tint }) {
  const stroke = 4;
  const r = size / 2 - stroke;
  const circ = 2 * Math.PI * r;
  const color = tint?.solid ?? C.accent;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.lineSoft}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span className="text-[13px] font-bold tabular-nums" style={{ ...display, color }}>
        {value}
      </span>
    </span>
  );
}

// Speelse mini-spark (afgeronde staafjes).
function BarSpark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data) || 1;
  return (
    <div className="flex items-end gap-1" style={{ height: 34 }} aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="w-1.5 rounded-full transition-all"
          style={{
            height: `${Math.max(12, (v / max) * 100)}%`,
            background: i === data.length - 1 ? color : `${color}55`,
          }}
        />
      ))}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept88() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, color: C.fg, background: C.bg }}
    >
      {/* Deterministische keyframes: zacht zweven + pulserende timerring */}
      <style>{`
        @keyframes widget88-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes widget88-pulse { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }
      `}</style>

      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col">
        {/* Kop met profiel */}
        <header className="flex items-center justify-between gap-4 px-5 pt-6 sm:px-8">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{ background: C.accent }}
              aria-hidden="true"
            >
              <LayoutGrid size={19} strokeWidth={2.4} color="#fff" />
            </span>
            <div className="leading-tight">
              <div className="text-[16px] font-bold" style={{ ...display, color: C.fg }}>
                Widget
              </div>
              <div className="text-[10.5px] font-medium" style={{ color: C.faint }}>
                Alles in één oogopslag
              </div>
            </div>
          </div>
          <div
            className="flex items-center gap-3 rounded-full py-1 pl-1 pr-3.5"
            style={{ background: C.surface, boxShadow: TILE }}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold text-white"
              style={{ background: C.accent }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
            <div className="hidden leading-tight sm:block">
              <div className="text-[12.5px] font-semibold" style={{ color: C.fg }}>
                {PROFIEL.naam}
              </div>
              <div
                className="flex items-center gap-1 text-[10px] font-semibold"
                style={{ color: (TINT.green as Tint).fg }}
              >
                <ShieldCheck size={10} strokeWidth={2.8} aria-hidden="true" /> {PROFIEL.trust}
              </div>
            </div>
          </div>
        </header>

        {/* Navigatie-pillen */}
        <nav
          className="flex flex-row gap-2 overflow-x-auto px-5 py-4 sm:px-8"
          aria-label="Hoofdnavigatie"
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = SCREEN_ICON[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  color: on ? "#fff" : C.muted,
                  background: on ? C.accent : C.surface,
                  boxShadow: on ? "0 8px 20px -8px rgba(255,90,95,0.7)" : TILE,
                  ["--tw-ring-color" as string]: C.accent,
                }}
              >
                <Icon size={15} strokeWidth={2.3} aria-hidden="true" />
                {s.label}
              </button>
            );
          })}
        </nav>

        <main className="flex-1 px-5 pb-8 sm:px-8">
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
    </div>
  );
}

/* ---------- Dashboard — widget-collectie ---------- */

function Dashboard({
  onOpen,
  onGo,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
}) {
  const warn = ACTIES.find((a) => a.urgentie === "warning");
  const omzet = KPIS.find((k) => k.label.startsWith("Omzet"));
  const topMatches = OPDRACHTEN.filter((o) => o.match >= 85).length;
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen);
  const eerste = OPDRACHTEN[0];
  const bericht = ongelezen[0];
  const vog = CREDENTIALS.find((c) => c.status === "EXPIRING");
  const vogDagen = 23; // uit "Verloopt over 23 dagen" — vast, deterministisch
  const vogFrac = 1 - vogDagen / 90;

  const [feed, setFeed] = useState<"loading" | "error" | "ok">("loading");
  useEffect(() => {
    const t = window.setTimeout(() => setFeed("error"), 650);
    return () => window.clearTimeout(t);
  }, []);

  const green = TINT.green as Tint;
  const indigo = TINT.indigo as Tint;
  const amber = TINT.amber as Tint;
  const sky = TINT.sky as Tint;
  const coral = TINT.coral as Tint;
  const violet = TINT.violet as Tint;

  return (
    <div className="space-y-4">
      <div>
        <Kicker>Vandaag</Kicker>
        <Title>Hoi {PROFIEL.naam.split(" ")[0]}, dit vraagt aandacht</Title>
      </div>

      {warn && (
        <div
          className="flex flex-col gap-3 rounded-[22px] p-4 sm:flex-row sm:items-center"
          style={{ background: amber.soft, border: `1px solid ${amber.solid}33` }}
          role="alert"
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-xl"
            style={{ background: "#fff" }}
          >
            <AlertTriangle size={17} strokeWidth={2.4} color={amber.fg} aria-hidden="true" />
          </span>
          <p className="text-[13.5px] leading-snug" style={{ color: C.fg }}>
            <span className="font-semibold">{warn.titel}.</span>{" "}
            <span style={{ color: C.muted }}>{warn.detail}</span>
          </p>
          <button
            onClick={() => onGo("verificatie")}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: amber.solid, ["--tw-ring-color" as string]: amber.solid }}
          >
            {warn.cta} <ArrowRight size={13} strokeWidth={2.8} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Volgende dienst — grote held-widget */}
        {eerste && (
          <Widget
            tint={coral}
            onClick={() => onOpen(eerste.id)}
            label={`Volgende dienst: ${eerste.titel}`}
            className="sm:col-span-2"
          >
            <div
              className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-60"
              style={{ background: coral.soft }}
              aria-hidden="true"
            />
            <div className="relative flex items-start justify-between">
              <WidgetIcon tint={coral} Icon={CalendarClock} />
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: coral.soft, color: coral.fg }}
              >
                Volgende dienst
              </span>
            </div>
            <div className="relative mt-4">
              <p
                className="text-[19px] font-bold leading-tight"
                style={{ ...display, color: C.fg }}
              >
                {eerste.titel}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
                <MapPin size={13} strokeWidth={2.3} aria-hidden="true" /> {eerste.opdrachtgever} ·{" "}
                {eerste.plaats}
              </p>
            </div>
            <div className="relative mt-4 flex items-center gap-3">
              <span
                className="rounded-xl px-3 py-1.5 text-[12.5px] font-semibold tabular-nums"
                style={{ background: C.bg, color: C.fg }}
              >
                {eerste.start}
              </span>
              <span
                className="rounded-xl px-3 py-1.5 text-[12.5px] font-semibold tabular-nums"
                style={{ background: C.bg, color: C.fg }}
              >
                {eerste.tarief}
              </span>
              <span
                className="ml-auto inline-flex items-center gap-1 text-[12.5px] font-semibold transition-transform group-hover:translate-x-0.5"
                style={{ color: coral.fg }}
              >
                Openen <ArrowRight size={14} strokeWidth={2.8} aria-hidden="true" />
              </span>
            </div>
          </Widget>
        )}

        {/* Matches-teller */}
        <Widget tint={indigo} onClick={() => onGo("marktplaats")} label="Nieuwe matches bekijken">
          <div className="flex items-start justify-between">
            <WidgetIcon tint={indigo} Icon={Star} />
            <ArrowUpRight
              size={18}
              strokeWidth={2.3}
              color={C.faint}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </div>
          <p
            className="mt-4 text-[40px] font-bold tabular-nums leading-none"
            style={{ ...display, color: C.fg }}
          >
            {topMatches}
          </p>
          <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
            matches boven 85%
          </p>
          <span
            className="mt-3 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
            style={{ background: indigo.soft, color: indigo.fg }}
          >
            Reageer vandaag
          </span>
        </Widget>

        {/* VOG-timer met pulserende ring */}
        {vog && (
          <Widget tint={amber} onClick={() => onGo("verificatie")} label="VOG vernieuwen">
            <div className="flex items-start justify-between">
              <WidgetIcon tint={amber} Icon={Timer} />
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: amber.soft, color: amber.fg }}
              >
                Verloopt
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span
                className="relative inline-flex h-14 w-14 items-center justify-center"
                aria-hidden="true"
              >
                <svg width="56" height="56" className="absolute inset-0 -rotate-90">
                  <circle cx="28" cy="28" r="24" fill="none" stroke={C.lineSoft} strokeWidth="5" />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke={amber.solid}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 24}
                    strokeDashoffset={2 * Math.PI * 24 * (1 - vogFrac)}
                    style={{ animation: "widget88-pulse 2.4s ease-in-out infinite" }}
                  />
                </svg>
                <span
                  className="text-[15px] font-bold tabular-nums"
                  style={{ ...display, color: amber.fg }}
                >
                  {vogDagen}
                </span>
              </span>
              <div>
                <p className="text-[14px] font-bold" style={{ color: C.fg }}>
                  VOG (zorg)
                </p>
                <p className="text-[12px]" style={{ color: C.muted }}>
                  nog {vogDagen} dagen geldig
                </p>
              </div>
            </div>
            <span
              className="mt-3 inline-flex w-fit items-center gap-1 text-[12.5px] font-semibold transition-transform group-hover:translate-x-0.5"
              style={{ color: amber.fg }}
            >
              Vernieuwen <ArrowRight size={13} strokeWidth={2.8} aria-hidden="true" />
            </span>
          </Widget>
        )}

        {/* Omzet-widget */}
        <Widget tint={green} onClick={() => onGo("facturen")} label="Facturen bekijken">
          <div className="flex items-start justify-between">
            <WidgetIcon tint={green} Icon={Wallet} />
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
              style={{ background: green.soft, color: green.fg }}
            >
              {omzet?.trend ?? "+12%"}
            </span>
          </div>
          <p
            className="mt-4 text-[30px] font-bold tabular-nums leading-none tracking-[-0.01em]"
            style={{ ...display, color: C.fg }}
          >
            {omzet?.value ?? "€ 8.240"}
          </p>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            omzet deze maand
          </p>
          <div className="mt-3">
            <BarSpark data={omzet?.spark ?? [5, 6, 7, 8]} color={green.solid} />
          </div>
        </Widget>

        {/* Ongelezen berichten */}
        <Widget tint={sky} onClick={() => onGo("acties")} label="Berichten openen">
          <div className="flex items-start justify-between">
            <WidgetIcon tint={sky} Icon={MessageCircle} />
            <span
              className="flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums text-white"
              style={{ background: sky.solid }}
              aria-label={`${ongelezen.length} ongelezen`}
            >
              {ongelezen.length}
            </span>
          </div>
          {bericht ? (
            <div className="mt-4">
              <p className="text-[13.5px] font-bold" style={{ color: C.fg }}>
                {bericht.van}
              </p>
              <p
                className="mt-1 line-clamp-2 text-[12.5px] leading-snug"
                style={{ color: C.muted }}
              >
                {bericht.preview}
              </p>
              <p className="mt-2 text-[11px] font-semibold tabular-nums" style={{ color: sky.fg }}>
                {bericht.tijd}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-[13px]" style={{ color: C.muted }}>
              Geen ongelezen berichten.
            </p>
          )}
        </Widget>

        {/* Widget-stack: recente activiteit die uitwaaiert bij hover */}
        <Widget tint={violet} className="group sm:col-span-2">
          <div className="flex items-start justify-between">
            <WidgetIcon tint={violet} Icon={Bell} />
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.faint }}
            >
              Activiteit
            </span>
          </div>
          <div className="relative mt-4 h-[92px]">
            {BERICHTEN.map((b, i) => (
              <div
                key={b.van}
                className="absolute left-0 right-0 flex items-center gap-3 rounded-2xl border p-3 transition-all duration-300"
                style={{
                  background: C.surface,
                  borderColor: C.line,
                  boxShadow: TILE,
                  top: i * 10,
                  transform: `scale(${1 - i * 0.04})`,
                  zIndex: BERICHTEN.length - i,
                }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ background: violet.soft, color: violet.fg }}
                  aria-hidden="true"
                >
                  {b.initialen}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold" style={{ color: C.fg }}>
                    {b.van}
                  </p>
                  <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                    {b.preview}
                  </p>
                </div>
                {b.ongelezen && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: C.accent }}
                    aria-label="ongelezen"
                  />
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11.5px]" style={{ color: C.faint }}>
            Beweeg over de stapel om alles te zien.
          </p>
        </Widget>

        {/* Cashflow-signaal: loading / error / ok */}
        <Widget tint={indigo}>
          <div className="flex items-center gap-2">
            <WidgetIcon tint={indigo} Icon={Sparkles} />
            <h3 className="text-[14px] font-bold" style={{ color: C.fg }}>
              Signaal
            </h3>
          </div>
          {feed === "loading" && (
            <div className="mt-4 space-y-2" role="status" aria-live="polite">
              <span className="sr-only">Signaal wordt geladen…</span>
              {[0, 1].map((i) => (
                <span
                  key={i}
                  className="block h-3 animate-pulse rounded-full"
                  style={{ background: C.lineSoft, width: i === 0 ? "80%" : "55%" }}
                />
              ))}
            </div>
          )}
          {feed === "error" && (
            <div className="mt-4 rounded-2xl p-3" style={{ background: coral.soft }} role="alert">
              <p
                className="flex items-center gap-2 text-[12.5px] font-medium"
                style={{ color: coral.fg }}
              >
                <XCircle size={15} strokeWidth={2.5} aria-hidden="true" /> Feed niet geladen.
              </p>
              <button
                onClick={() => setFeed("ok")}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: coral.solid, ["--tw-ring-color" as string]: coral.solid }}
              >
                <RotateCw size={12} strokeWidth={2.8} aria-hidden="true" /> Opnieuw
              </button>
            </div>
          )}
          {feed === "ok" && (
            <p className="mt-4 flex items-center gap-2 text-[12.5px]" style={{ color: C.muted }}>
              <Check size={14} strokeWidth={2.8} color={green.solid} aria-hidden="true" /> Alles
              bijgewerkt.
            </p>
          )}
        </Widget>
      </div>
    </div>
  );
}

/* ---------- Marktplaats — opdracht-widgets ---------- */

function Marktplaats({
  activeId,
  onSelect,
  onOpen,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onOpen: (id?: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const tints = [TINT.coral, TINT.indigo, TINT.violet, TINT.sky] as Tint[];

  return (
    <div className="space-y-4">
      <div>
        <Kicker>Marktplaats</Kicker>
        <Title>Open opdrachten</Title>
      </div>

      <div
        className="flex items-center gap-3 rounded-full px-4 py-3"
        style={{ background: C.surface, boxShadow: TILE }}
      >
        <Search size={17} strokeWidth={2.3} color={C.accent} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#8a8d99]"
          style={{ color: C.fg }}
        />
        <span
          className="shrink-0 text-[12px] font-semibold tabular-nums"
          style={{ color: C.faint }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Widget className="items-center py-12 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: (TINT.coral as Tint).soft }}
            aria-hidden="true"
          >
            <Compass size={24} strokeWidth={2} color={C.accent} />
          </span>
          <p className="mt-4 w-full text-[18px] font-bold" style={{ ...display, color: C.fg }}>
            Geen opdrachten gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.muted }}>
            Geen opdracht past bij &quot;{q}&quot;. Pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 rounded-full px-5 py-2 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.accent, ["--tw-ring-color" as string]: C.accent }}
          >
            Zoekopdracht wissen
          </button>
        </Widget>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o, i) => {
            const tint = tints[i % tints.length] as Tint;
            const on = o.id === activeId;
            return (
              <Widget
                key={o.id}
                tint={tint}
                onClick={() => onSelect(o.id)}
                label={`${o.titel} — match ${o.match}%`}
                className={on ? "ring-2 ring-offset-2" : ""}
              >
                <div className="flex items-start justify-between">
                  <MatchRing value={o.match} tint={tint} />
                  <span
                    className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold tabular-nums"
                    style={{ background: tint.soft, color: tint.fg }}
                  >
                    {o.id}
                  </span>
                </div>
                <p
                  className="mt-3 text-[15.5px] font-bold leading-tight"
                  style={{ ...display, color: C.fg }}
                >
                  {o.titel}
                </p>
                <p
                  className="mt-1 flex items-center gap-1 text-[12.5px]"
                  style={{ color: C.muted }}
                >
                  <MapPin size={12.5} strokeWidth={2.3} aria-hidden="true" /> {o.opdrachtgever} ·{" "}
                  {o.plaats}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.redenen.plus.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        background: (TINT.green as Tint).soft,
                        color: (TINT.green as Tint).fg,
                      }}
                    >
                      <Check size={11} strokeWidth={3} aria-hidden="true" /> {t}
                    </span>
                  ))}
                </div>
                <div
                  className="mt-4 flex items-center justify-between border-t pt-3"
                  style={{ borderColor: C.line }}
                >
                  <span className="text-[13px] font-bold tabular-nums" style={{ color: C.fg }}>
                    {o.tarief}
                  </span>
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(o.id);
                    }}
                    className="inline-flex items-center gap-1 text-[12.5px] font-semibold transition-transform group-hover:translate-x-0.5"
                    style={{ color: tint.fg }}
                  >
                    Open <ArrowRight size={13} strokeWidth={2.8} aria-hidden="true" />
                  </span>
                </div>
              </Widget>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht, onGo }: { opdracht: Opdracht; onGo: (k: ScreenKey) => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const coral = TINT.coral as Tint;
  const green = TINT.green as Tint;
  const amber = TINT.amber as Tint;
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 800);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => onGo("marktplaats")}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          color: C.accent,
          background: C.surface,
          boxShadow: TILE,
          ["--tw-ring-color" as string]: C.accent,
        }}
      >
        <ArrowRight size={13} strokeWidth={2.8} className="rotate-180" aria-hidden="true" /> Terug
      </button>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Widget tint={coral}>
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-60"
            style={{ background: coral.soft }}
            aria-hidden="true"
          />
          <div className="relative flex items-start justify-between">
            <div>
              <Kicker>{opdracht.id}</Kicker>
              <Title>{opdracht.titel}</Title>
              <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
            </div>
            <MatchRing value={opdracht.match} size={64} tint={coral} />
          </div>
          <div className="relative mt-4 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
                style={{ background: C.bg, color: C.muted }}
              >
                {t}
              </span>
            ))}
          </div>
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="relative mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-[13.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:translate-y-0 disabled:opacity-90"
            style={{
              background: state === "sent" ? green.solid : coral.solid,
              ["--tw-ring-color" as string]: coral.solid,
            }}
          >
            {state === "idle" && (
              <>
                <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" /> Reageer op opdracht
              </>
            )}
            {state === "sending" && "Versturen…"}
            {state === "sent" && (
              <>
                <Check size={15} strokeWidth={3} aria-hidden="true" /> Reactie verstuurd
              </>
            )}
          </button>
        </Widget>

        <div className="grid grid-cols-2 gap-4">
          {[
            { l: "Tarief", v: opdracht.tarief, tint: green },
            { l: "Omvang", v: opdracht.uren, tint: TINT.indigo as Tint },
            { l: "Start", v: opdracht.start, tint: TINT.sky as Tint },
            { l: "Match", v: `${opdracht.match}%`, tint: coral },
          ].map((m) => (
            <Widget key={m.l} tint={m.tint} className="p-4">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: C.faint }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[19px] font-bold tabular-nums"
                style={{ ...display, color: C.fg }}
              >
                {m.v}
              </p>
            </Widget>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Widget tint={green}>
          <p
            className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: green.fg }}
          >
            <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
          </p>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ color: C.fg }}
              >
                <span
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                  style={{ background: green.soft }}
                >
                  <Check size={11} strokeWidth={3} color={green.fg} aria-hidden="true" />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Widget>
        <Widget tint={amber}>
          <p
            className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: amber.fg }}
          >
            <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Aandachtspunten
          </p>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13.5px]"
                style={{ color: C.muted }}
              >
                <span
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                  style={{ background: amber.soft }}
                >
                  <AlertTriangle size={11} strokeWidth={2.8} color={amber.fg} aria-hidden="true" />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Widget>
      </div>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const green = TINT.green as Tint;
  const amber = TINT.amber as Tint;
  const indigo = TINT.indigo as Tint;
  const stats = [
    { l: "Geverifieerd", v: `${verified}/${total}`, tint: green, Icon: ShieldCheck },
    { l: "Verloopt binnenkort", v: "1", tint: amber, Icon: AlertTriangle },
    { l: "In beoordeling", v: "1", tint: indigo, Icon: Clock },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Kicker>Verificatie</Kicker>
        <Title>Certificaten &amp; documenten</Title>
        <p className="mt-2 text-[13.5px]" style={{ color: C.muted }}>
          Je bewijsstukken worden veilig en privé bewaard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.Icon;
          return (
            <Widget key={s.l} tint={s.tint} className="flex-row items-center justify-between">
              <div>
                <p className="text-[11.5px] font-semibold" style={{ color: C.muted }}>
                  {s.l}
                </p>
                <p
                  className="mt-1.5 text-[26px] font-bold tabular-nums"
                  style={{ ...display, color: C.fg }}
                >
                  {s.v}
                </p>
              </div>
              <WidgetIcon tint={s.tint} Icon={Icon} />
            </Widget>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const Icon = m.Icon;
          return (
            <Widget key={c.naam} tint={m.tint} className="flex-row items-center gap-4">
              <WidgetIcon tint={m.tint} Icon={Icon} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold" style={{ color: C.fg }}>
                  {c.naam}
                </p>
                <p className="text-[12px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
                <div className="mt-2">
                  <StatusPill status={c.status} />
                </div>
              </div>
            </Widget>
          );
        })}
      </div>

      <Widget>
        <div className="flex items-center gap-2">
          <WidgetIcon tint={indigo} Icon={FileText} />
          <h3 className="text-[15px] font-bold" style={{ ...display, color: C.fg }}>
            Bestanden
          </h3>
        </div>
        <ul className="mt-3 divide-y" style={{ borderColor: C.line }}>
          {DOCUMENTEN.map((d) => {
            const m = credMeta(d.status);
            return (
              <li key={d.naam} className="flex items-center gap-3 py-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[9.5px] font-bold"
                  style={{ background: C.bg, color: C.muted }}
                  aria-hidden="true"
                >
                  {d.type}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold" style={{ color: C.fg }}>
                    {d.naam}
                  </p>
                  <p className="text-[11.5px] tabular-nums" style={{ color: C.faint }}>
                    {d.grootte} · {d.bijgewerkt}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ color: m.tint.fg, background: m.tint.soft }}
                >
                  {m.label}
                </span>
              </li>
            );
          })}
        </ul>
      </Widget>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Kicker>Prioriteiten</Kicker>
        <Title>Volgende acties</Title>
        <p className="mt-2 text-[13.5px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tint = (warn ? TINT.amber : TINT.indigo) as Tint;
          return (
            <Widget key={a.titel} tint={tint} className={i === 0 ? "sm:col-span-2" : ""}>
              <div className="flex items-start justify-between">
                <WidgetIcon tint={tint} Icon={warn ? AlertTriangle : Bell} />
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: tint.soft, color: tint.fg }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
              </div>
              <p
                className="mt-4 text-[15.5px] font-bold leading-tight"
                style={{ ...display, color: C.fg }}
              >
                {a.titel}
              </p>
              <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
                {a.detail}
              </p>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  color: warn ? "#fff" : tint.fg,
                  background: warn ? tint.solid : tint.soft,
                  ["--tw-ring-color" as string]: tint.solid,
                }}
              >
                {a.cta} <ArrowRight size={13} strokeWidth={2.8} aria-hidden="true" />
              </button>
            </Widget>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 rounded-[22px] p-4"
        style={{
          background: (TINT.green as Tint).soft,
          border: `1px solid ${(TINT.green as Tint).solid}22`,
        }}
      >
        <Check size={18} strokeWidth={2.6} color={(TINT.green as Tint).solid} aria-hidden="true" />
        <p className="text-[13px]" style={{ color: C.muted }}>
          Verder is alles bijgewerkt. Nieuwe acties verschijnen hier vanzelf.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const green = TINT.green as Tint;
  const amber = TINT.amber as Tint;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Financiën</Kicker>
          <Title>Facturen</Title>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: C.accent,
            boxShadow: "0 8px 20px -8px rgba(255,90,95,0.7)",
            ["--tw-ring-color" as string]: C.accent,
          }}
        >
          <Plus size={15} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Widget tint={green}>
          <div className="flex items-start justify-between">
            <WidgetIcon tint={green} Icon={Wallet} />
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: green.soft, color: green.fg }}
            >
              Ontvangen
            </span>
          </div>
          <p
            className="mt-4 text-[30px] font-bold tabular-nums leading-none"
            style={{ ...display, color: C.fg }}
          >
            € {betaald.toLocaleString("nl-NL")}
          </p>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            deze periode binnengekomen
          </p>
        </Widget>
        <Widget tint={amber}>
          <div className="flex items-start justify-between">
            <WidgetIcon tint={amber} Icon={Clock} />
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: amber.soft, color: amber.fg }}
            >
              Openstaand
            </span>
          </div>
          <p
            className="mt-4 text-[30px] font-bold tabular-nums leading-none"
            style={{ ...display, color: C.fg }}
          >
            € {open.toLocaleString("nl-NL")}
          </p>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            wacht nog op betaling
          </p>
        </Widget>
      </div>

      <Widget>
        <h3 className="text-[15px] font-bold" style={{ ...display, color: C.fg }}>
          Alle facturen
        </h3>
        <ul className="mt-3 divide-y" style={{ borderColor: C.line }}>
          {FACTUREN.map((f) => {
            const tint = FACTUUR_TINT[f.status] ?? (TINT.indigo as Tint);
            return (
              <li key={f.nr} className="flex items-center gap-3 py-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: tint.soft }}
                  aria-hidden="true"
                >
                  <Receipt size={17} strokeWidth={2.2} color={tint.fg} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold" style={{ color: C.fg }}>
                    {f.klant}
                  </p>
                  <p className="text-[11.5px] tabular-nums" style={{ color: C.faint }}>
                    {f.nr} · {f.datum}
                  </p>
                </div>
                <span
                  className="text-[14px] font-bold tabular-nums"
                  style={{ ...display, color: C.fg }}
                >
                  {f.bedrag}
                </span>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
                  style={{ color: tint.fg, background: tint.soft }}
                >
                  {f.status}
                </span>
              </li>
            );
          })}
        </ul>
      </Widget>

      <p className="px-1 text-[11.5px]" style={{ color: C.faint }}>
        {NAV.length} onderdelen in je werkruimte · bedragen incl. btw waar van toepassing.
      </p>
    </div>
  );
}
