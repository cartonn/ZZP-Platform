"use client";

// Concept 317 — "Diagonaal" · Dynamisch gebroken-grid met kinetische hoeken.
// Fris licht vlak (#f7f8fb) waarop secties met subtiele skew/clip-path-diagonalen aan
// elkaar geregen worden: schuine scheidingslijnen, parallellogram-accenten en diagonale
// energiebanen — maar de content-blokken zelf blijven strak recht en leesbaar. Eén sterk
// accent (elektrisch violet #5b3df5) op koel wit. 2026-trend: broken grid & schuine secties.
// Fonts: --font-lab-space (kop) + --font-lab-geist (tekst) + --font-lab-mono (cijfers).

import { useEffect, useState } from "react";
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
  Zap,
  SlidersHorizontal,
  FileText,
  Mail,
  RotateCw,
  Send,
  TrendingUp,
} from "lucide-react";
import {
  SCREENS,
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  DOCUMENTEN,
  BERICHTEN,
  NAV,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

void NAV;

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#f7f8fb",
  panel: "#ffffff",
  panelAlt: "#f1f2f8",
  wash: "#efeafe",
  accent: "#5b3df5",
  accentSoft: "#7c63f7",
  accentFaint: "#c9befb",
  ink: "#141527",
  sub: "#4b4e63",
  muted: "#6c7089",
  faint: "#9a9db5",
  warn: "#c2410c",
  warnBg: "#fef1e9",
  alert: "#b91c1c",
  ok: "#0f766e",
  line: "rgba(20,21,39,0.10)",
  lineSoft: "rgba(20,21,39,0.06)",
};

const head = { fontFamily: "var(--font-lab-space)" };
const body = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b3df5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f8fb]";

// Diagonale clip-paden — het handtekening-motief van dit concept.
const CLIP_SLANT_BOTTOM = "polygon(0 0, 100% 0, 100% calc(100% - 22px), 0 100%)";

/* ---------- Handtekening-elementen ---------- */

// Schuin parallellogram-merkteken (skew), het kinetische accent.
function Slant({
  size = 14,
  color = C.accent,
  className = "",
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-block shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: color,
        transform: "skewX(-16deg)",
        borderRadius: 2,
      }}
      aria-hidden="true"
    />
  );
}

// Diagonale accentband die tussen secties "beweegt".
function DiagBar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none flex items-center gap-1.5 ${className}`}
      aria-hidden="true"
    >
      <Slant size={10} color={C.accent} />
      <Slant size={10} color={C.accentSoft} />
      <Slant size={10} color={C.accentFaint} />
    </div>
  );
}

function Panel({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section";
}) {
  return (
    <Tag
      className={`relative rounded-[14px] ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: "0 18px 40px -34px rgba(20,21,39,0.4)",
      }}
    >
      {children}
    </Tag>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em]"
      style={{ ...body, color: C.accent }}
    >
      <Slant size={9} />
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-2 text-[27px] font-bold leading-[1.02] tracking-[-0.01em] sm:text-[34px]"
      style={{ ...head, color: C.ink }}
    >
      {children}
    </h1>
  );
}

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; bg: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.ok, bg: "#e6f4f1", Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In behandeling", color: C.accent, bg: C.wash, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", color: C.warn, bg: C.warnBg, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.alert, bg: "#fdecec", Icon: XCircle };
  }
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em]"
      style={{ ...body, color: m.color, background: m.bg, border: `1px solid ${m.color}33` }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Sparkline met diagonale vulling ---------- */

function Spark({ data, color = C.accent }: { data: number[]; color?: string }) {
  const w = 104;
  const h = 30;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 6) - 3;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const last = pts[pts.length - 1];
  const gid = `spk-${color.replace("#", "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.24" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.1" fill={color} />}
    </svg>
  );
}

// Match-score als schuine "wig"-meter.
function ScoreWedge({ value, size = 46 }: { value: number; size?: number }) {
  const strong = value >= 90;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-[9px]"
      style={{
        width: size,
        height: size,
        background: C.wash,
        border: `1px solid ${C.accentFaint}`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-x-0 bottom-0"
        style={{
          height: `${value}%`,
          background: strong
            ? `linear-gradient(180deg, ${C.accentSoft}, ${C.accent})`
            : `linear-gradient(180deg, ${C.accentFaint}, ${C.accentSoft})`,
          clipPath: "polygon(0 18%, 100% 0, 100% 100%, 0 100%)",
          opacity: 0.9,
        }}
      />
      <span
        className="relative text-[13px] font-bold tabular-nums"
        style={{ ...mono, color: strong ? "#ffffff" : C.ink }}
      >
        {value}
      </span>
    </span>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept317() {
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
      style={{ ...body, color: C.ink, background: C.bg }}
    >
      {/* diagonale energiebanen op de achtergrond */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage: `repeating-linear-gradient(-24deg, ${C.lineSoft} 0 1px, transparent 1px 64px)`,
          opacity: 0.7,
        }}
      />
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full"
        aria-hidden="true"
        style={{ background: C.wash, filter: "blur(60px)", opacity: 0.7 }}
      />

      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk */}
        <aside
          className="relative shrink-0 md:w-[236px]"
          style={{ borderRight: `1px solid ${C.line}`, background: "rgba(255,255,255,0.72)" }}
        >
          <div className="flex h-full flex-col">
            <div
              className="flex items-center gap-3 p-5"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <span
                className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[11px]"
                style={{ background: C.ink }}
                aria-hidden="true"
              >
                <span
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(120deg, ${C.accent}, ${C.accentSoft})`,
                    clipPath: "polygon(0 0, 62% 0, 38% 100%, 0 100%)",
                  }}
                />
                <Zap size={18} strokeWidth={2.4} color="#ffffff" className="relative" />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[16px] font-bold tracking-[-0.01em]"
                  style={{ ...head, color: C.ink }}
                >
                  Diagonaal
                </div>
                <div
                  className="text-[9px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: C.faint }}
                >
                  ZZP · flow
                </div>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto p-3 md:flex-1 md:flex-col"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className={`relative flex shrink-0 items-center gap-2.5 overflow-hidden rounded-[9px] px-3.5 py-2.5 text-left text-[12.5px] font-semibold transition-all md:w-full ${RING}`}
                    style={{
                      color: on ? C.panel : C.sub,
                      background: on ? C.accent : "transparent",
                    }}
                  >
                    {on && (
                      <span
                        className="absolute inset-y-0 right-0 w-8"
                        style={{
                          background: `linear-gradient(120deg, transparent, ${C.accentSoft})`,
                          clipPath: "polygon(40% 0, 100% 0, 100% 100%, 0 100%)",
                        }}
                        aria-hidden="true"
                      />
                    )}
                    <Slant size={8} color={on ? "#ffffff" : C.accentFaint} className="relative" />
                    <span className="relative">{s.label}</span>
                  </button>
                );
              })}
            </nav>

            <div
              className="hidden items-center gap-3 p-4 md:flex"
              style={{ borderTop: `1px solid ${C.line}`, background: "rgba(241,242,248,0.6)" }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-[12px] font-bold"
                style={{ ...head, color: C.panel, background: C.ink }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold" style={{ color: C.ink }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[10px] font-bold"
                  style={{ color: C.accent }}
                >
                  <ShieldCheck size={11} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5 sm:p-8">
            {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
            {screen === "marktplaats" && (
              <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
            )}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties onGo={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

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
    const t = window.setTimeout(() => setFeed("error"), 720);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      {/* Diagonale hero-band */}
      <section
        className="relative overflow-hidden rounded-[16px] p-6 sm:p-7"
        style={{ background: C.ink, clipPath: CLIP_SLANT_BOTTOM }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage: `repeating-linear-gradient(-24deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 40px)`,
          }}
        />
        <div
          className="pointer-events-none absolute -right-10 top-0 h-full w-1/2"
          aria-hidden="true"
          style={{
            background: `linear-gradient(120deg, transparent, ${C.accent})`,
            clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 100%)",
            opacity: 0.9,
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-[#c9befb]">
              <Slant size={9} color="#ffffff" /> Overzicht
            </span>
            <h1
              className="mt-2 text-[27px] font-bold leading-[1.02] tracking-[-0.01em] text-white sm:text-[34px]"
              style={head}
            >
              Goedemorgen, {PROFIEL.naam.split(" ")[0]}
            </h1>
            <p className="mt-2 text-[13px] text-[#b9bcd4]">
              {PROFIEL.rol} · {PROFIEL.plaats}
            </p>
          </div>
          <div
            className="inline-flex items-center gap-2 self-start rounded-[9px] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white sm:self-auto"
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <TrendingUp size={13} strokeWidth={2.4} aria-hidden="true" /> {OPDRACHTEN.length} nieuwe
            matches
          </div>
        </div>
      </section>

      {warn && (
        <div
          className="flex flex-col gap-3 overflow-hidden rounded-[13px] p-4 sm:flex-row sm:items-center"
          style={{ border: `1px solid ${C.warn}44`, background: C.warnBg }}
          role="alert"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-[10px]"
            style={{ background: "#fff", border: `1px solid ${C.warn}44` }}
          >
            <AlertTriangle size={18} strokeWidth={2.2} color={C.warn} aria-hidden="true" />
          </span>
          <p className="text-[13px] leading-snug" style={{ color: C.ink }}>
            <span className="font-bold">{warn.titel}.</span>{" "}
            <span style={{ color: C.muted }}>{warn.detail}</span>
          </p>
          <button
            type="button"
            onClick={() => onGo("verificatie")}
            className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-[9px] px-3.5 py-2 text-[12px] font-bold text-white transition-transform hover:-translate-y-0.5 ${RING}`}
            style={{ background: C.warn }}
          >
            {warn.cta} <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* KPI's met diagonale accenthoek */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="relative overflow-hidden p-4">
            <span
              className="pointer-events-none absolute right-0 top-0 h-9 w-9"
              aria-hidden="true"
              style={{
                background: k.up ? C.wash : C.warnBg,
                clipPath: "polygon(100% 0, 0 0, 100% 100%)",
              }}
            />
            <div className="flex items-start justify-between gap-2">
              <p
                className="text-[10px] font-bold uppercase leading-tight tracking-[0.08em]"
                style={{ color: C.muted }}
              >
                {k.label}
              </p>
            </div>
            <p
              className="mt-3 text-[24px] font-bold tabular-nums leading-none"
              style={{ ...head, color: C.ink }}
            >
              {k.value}
            </p>
            <div className="mt-2 flex items-end justify-between">
              <Spark data={k.spark} color={k.up ? C.accent : C.warn} />
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                style={{ ...mono, color: k.up ? C.ok : C.warn }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} strokeWidth={2.6} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} strokeWidth={2.6} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Matches */}
        <Panel className="overflow-hidden">
          <div
            className="flex items-center justify-between p-5"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <h3
              className="flex items-center gap-2 text-[15px] font-bold"
              style={{ ...head, color: C.ink }}
            >
              <DiagBar /> Beste matches
            </h3>
            <button
              type="button"
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-1 rounded-[7px] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] transition-colors hover:bg-[#efeafe] ${RING}`}
              style={{ color: C.accent }}
            >
              Marktplaats <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
          <ul className="p-2.5">
            {OPDRACHTEN.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => onOpen(o.id)}
                  className={`group flex w-full items-center gap-3.5 rounded-[11px] p-3 text-left transition-colors hover:bg-[#f1f2f8] ${RING}`}
                >
                  <ScoreWedge value={o.match} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold" style={{ color: C.ink }}>
                      {o.titel}
                    </span>
                    <span
                      className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                      style={{ color: C.muted }}
                    >
                      <MapPin size={12} strokeWidth={2} aria-hidden="true" /> {o.opdrachtgever} ·{" "}
                      {o.plaats} · <span style={mono}>{o.tarief}</span>
                    </span>
                  </span>
                  <ArrowUpRight
                    size={16}
                    strokeWidth={2.2}
                    color={C.faint}
                    className="shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-5">
          {/* Volgende acties */}
          <Panel className="p-5">
            <h3
              className="flex items-center gap-2 text-[14px] font-bold"
              style={{ ...head, color: C.ink }}
            >
              <Zap size={16} strokeWidth={2.4} color={C.accent} aria-hidden="true" /> Nu oppakken
            </h3>
            <ul className="mt-3 space-y-2.5">
              {ACTIES.slice(0, 2).map((a) => {
                const w = a.urgentie === "warning";
                return (
                  <li
                    key={a.titel}
                    className="relative overflow-hidden rounded-[11px] p-3 pl-4"
                    style={{ background: w ? C.warnBg : C.panelAlt }}
                  >
                    <span
                      className="absolute inset-y-0 left-0 w-1"
                      style={{ background: w ? C.warn : C.accent, transform: "skewX(-12deg)" }}
                      aria-hidden="true"
                    />
                    <p className="text-[12.5px] font-bold" style={{ color: C.ink }}>
                      {a.titel}
                    </p>
                    <p className="mt-0.5 text-[11.5px] leading-snug" style={{ color: C.muted }}>
                      {a.detail}
                    </p>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => onGo("acties")}
              className={`mt-3 inline-flex items-center gap-1 text-[11.5px] font-bold uppercase tracking-[0.06em] ${RING}`}
              style={{ color: C.accent }}
            >
              Alle acties <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </Panel>

          {/* Live feed — loading + error-state */}
          <Panel className="p-5">
            <h3
              className="flex items-center gap-2 text-[13px] font-bold"
              style={{ ...head, color: C.ink }}
            >
              <Send size={14} strokeWidth={2.2} color={C.accent} aria-hidden="true" /> Activiteit
            </h3>
            {feed === "loading" && (
              <div className="mt-3 space-y-2" role="status" aria-live="polite">
                <span className="sr-only">Activiteit wordt geladen…</span>
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className="block h-3 animate-pulse rounded-[4px]"
                    style={{ background: C.lineSoft, width: i === 0 ? "82%" : "58%" }}
                  />
                ))}
              </div>
            )}
            {feed === "error" && (
              <div
                className="mt-3 flex flex-col gap-2 rounded-[10px] p-3 sm:flex-row sm:items-center"
                style={{ background: "#fdecec", border: `1px solid ${C.alert}33` }}
                role="alert"
              >
                <XCircle size={16} strokeWidth={2.2} color={C.alert} aria-hidden="true" />
                <p className="flex-1 text-[12px]" style={{ color: C.ink }}>
                  Feed onbereikbaar. Kon de laatste activiteit niet laden.
                </p>
                <button
                  type="button"
                  onClick={() => setFeed("ok")}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[11.5px] font-bold text-white transition-colors ${RING}`}
                  style={{ background: C.accent }}
                >
                  <RotateCw size={12} strokeWidth={2.6} aria-hidden="true" /> Opnieuw
                </button>
              </div>
            )}
            {feed === "ok" && (
              <ul className="mt-3 space-y-2.5">
                {BERICHTEN.slice(0, 2).map((b) => (
                  <li key={b.van} className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[10px] font-bold"
                      style={{ ...head, color: C.accent, background: C.wash }}
                      aria-hidden="true"
                    >
                      {b.initialen}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[12px] font-bold" style={{ color: C.ink }}>
                          {b.van}
                        </span>
                        {b.ongelezen && (
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: C.accent }}
                            aria-label="ongelezen"
                          />
                        )}
                      </span>
                      <span className="block truncate text-[11px]" style={{ color: C.muted }}>
                        {b.preview}
                      </span>
                    </span>
                    <span
                      className="shrink-0 text-[10px] tabular-nums"
                      style={{ ...mono, color: C.faint }}
                    >
                      {b.tijd}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

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
  const sel = filtered.find((o) => o.id === activeId) ?? filtered[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Kicker>Marktplaats</Kicker>
        <Title>Open opdrachten</Title>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-3 rounded-[11px] px-4 py-3"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <Search size={16} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a9db5]"
            style={{ ...body, color: C.ink }}
          />
          <span
            className="shrink-0 text-[11px] font-bold tabular-nums"
            style={{ ...mono, color: C.faint }}
          >
            {filtered.length}/{OPDRACHTEN.length}
          </span>
        </div>
        <button
          type="button"
          className={`inline-flex items-center justify-center gap-2 rounded-[11px] px-4 py-3 text-[12.5px] font-bold transition-colors ${RING}`}
          style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.sub }}
        >
          <SlidersHorizontal size={15} strokeWidth={2.2} aria-hidden="true" /> Filters
        </button>
      </div>

      {filtered.length === 0 ? (
        <Panel className="p-12 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-[12px]"
            style={{ background: C.wash, border: `1px solid ${C.accentFaint}` }}
            aria-hidden="true"
          >
            <Search size={24} strokeWidth={2} color={C.accent} />
          </span>
          <p className="mt-4 text-[19px] font-bold" style={{ ...head, color: C.ink }}>
            Niets gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12px]" style={{ color: C.muted }}>
            Geen match past bij &quot;{q}&quot;. Verruim je zoekopdracht.
          </p>
          <button
            type="button"
            onClick={() => setQ("")}
            className={`mt-5 rounded-[9px] px-4 py-2 text-[12.5px] font-bold text-white transition-colors ${RING}`}
            style={{ background: C.accent }}
          >
            Zoekopdracht wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3.5">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className={`relative w-full overflow-hidden rounded-[13px] p-4 text-left transition-all hover:-translate-y-0.5 ${RING}`}
                  style={{
                    background: C.panel,
                    border: `1px solid ${on ? C.accent : C.line}`,
                    boxShadow: on
                      ? `0 16px 34px -24px ${C.accent}`
                      : "0 12px 30px -28px rgba(20,21,39,0.4)",
                  }}
                >
                  {on && (
                    <span
                      className="absolute inset-y-0 left-0 w-1.5"
                      style={{
                        background: C.accent,
                        transform: "skewX(-12deg)",
                        transformOrigin: "top",
                      }}
                      aria-hidden="true"
                    />
                  )}
                  <div className="flex items-start gap-3.5">
                    <ScoreWedge value={o.match} size={52} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em]"
                        style={{ ...mono, color: C.faint }}
                      >
                        <span>{o.id}</span>
                        {on && <span style={{ color: C.accent }}>· geselecteerd</span>}
                      </div>
                      <p
                        className="truncate text-[15px] font-bold"
                        style={{ ...head, color: C.ink }}
                      >
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={12} strokeWidth={2} aria-hidden="true" /> {o.opdrachtgever} ·{" "}
                        {o.plaats} · <span style={mono}>{o.tarief}</span>
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[10.5px] font-semibold"
                            style={{
                              color: C.sub,
                              background: C.panelAlt,
                              border: `1px solid ${C.lineSoft}`,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <aside className="h-fit lg:sticky lg:top-4">
              <Panel className="overflow-hidden">
                <div
                  className="relative overflow-hidden p-5"
                  style={{ background: C.ink, clipPath: CLIP_SLANT_BOTTOM }}
                >
                  <div
                    className="pointer-events-none absolute -right-8 top-0 h-full w-1/2"
                    aria-hidden="true"
                    style={{
                      background: `linear-gradient(120deg, transparent, ${C.accent})`,
                      clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 100%)",
                      opacity: 0.85,
                    }}
                  />
                  <div className="relative">
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#c9befb]"
                      style={mono}
                    >
                      {sel.id}
                    </span>
                    <p className="mt-1 text-[16px] font-bold leading-snug text-white" style={head}>
                      {sel.titel}
                    </p>
                    <p className="mt-1 text-[12px] text-[#b9bcd4]">
                      {sel.opdrachtgever} · {sel.plaats}
                    </p>
                  </div>
                </div>
                <div className="p-5 pt-2">
                  <dl className="grid grid-cols-2 gap-2.5 text-[12.5px]">
                    {[
                      { l: "Tarief", v: sel.tarief },
                      { l: "Omvang", v: sel.uren },
                      { l: "Start", v: sel.start },
                      { l: "Match", v: `${sel.match}%` },
                    ].map((m) => (
                      <div
                        key={m.l}
                        className="rounded-[9px] p-2.5"
                        style={{ background: C.panelAlt }}
                      >
                        <dt
                          className="text-[10px] font-bold uppercase tracking-[0.08em]"
                          style={{ color: C.faint }}
                        >
                          {m.l}
                        </dt>
                        <dd
                          className="mt-0.5 font-bold tabular-nums"
                          style={{ ...mono, color: C.ink }}
                        >
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    type="button"
                    onClick={() => onOpen(sel.id)}
                    className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-[10px] px-4 py-2.5 text-[12.5px] font-bold text-white transition-transform hover:-translate-y-0.5 ${RING}`}
                    style={{ background: C.accent }}
                  >
                    Open opdracht <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
                  </button>
                </div>
              </Panel>
            </aside>
          )}
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
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section
        className="relative overflow-hidden rounded-[16px] p-6 sm:p-7"
        style={{ background: C.ink, clipPath: CLIP_SLANT_BOTTOM }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage: `repeating-linear-gradient(-24deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 40px)`,
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#c9befb]"
              style={mono}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-2 text-[24px] font-bold leading-[1.05] tracking-[-0.01em] text-white sm:text-[30px]"
              style={head}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[12.5px] text-[#b9bcd4]">
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-[6px] px-2.5 py-0.5 text-[11px] font-semibold text-white"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <ScoreWedge value={opdracht.match} size={72} />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Panel key={m.l} className="relative overflow-hidden p-4">
            <span
              className="pointer-events-none absolute right-0 top-0 h-8 w-8"
              aria-hidden="true"
              style={{ background: C.wash, clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
            />
            <p
              className="text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[18px] font-bold tabular-nums"
              style={{ ...mono, color: C.ink }}
            >
              {m.v}
            </p>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <div
          className="flex items-center gap-2 p-5"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          <DiagBar />
          <h3 className="text-[15px] font-bold" style={{ ...head, color: C.ink }}>
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.ok }}
            >
              <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.ink }}
                >
                  <Check
                    size={15}
                    strokeWidth={2.6}
                    color={C.ok}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.warn }}
            >
              <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.muted }}
                >
                  <AlertTriangle
                    size={15}
                    strokeWidth={2.4}
                    color={C.warn}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="p-5" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
          <button
            type="button"
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className={`flex w-full items-center justify-center gap-2 rounded-[11px] px-5 py-3 text-[13px] font-bold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-90 ${RING}`}
            style={{ background: state === "sent" ? C.ok : C.accent }}
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
        </div>
      </Panel>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const stats = [
    { l: "Geverifieerd", v: `${verified}/${total}`, color: C.ok, Icon: ShieldCheck },
    { l: "Verloopt", v: "1", color: C.warn, Icon: AlertTriangle },
    { l: "In behandeling", v: "1", color: C.accent, Icon: Clock },
  ];
  const expiring = CREDENTIALS.find((c) => c.status === "EXPIRING");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker>Verificatie</Kicker>
        <Title>Certificaten</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Je bewijsstukken worden veilig en privé bewaard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.Icon;
          return (
            <Panel
              key={s.l}
              className="relative flex items-center justify-between overflow-hidden p-4"
            >
              <span
                className="pointer-events-none absolute right-0 top-0 h-9 w-9"
                aria-hidden="true"
                style={{ background: `${s.color}12`, clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
              />
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.08em]"
                  style={{ color: C.faint }}
                >
                  {s.l}
                </p>
                <p
                  className="mt-1.5 text-[24px] font-bold tabular-nums"
                  style={{ ...head, color: C.ink }}
                >
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-[11px]"
                style={{ background: `${s.color}14`, border: `1px solid ${s.color}33` }}
              >
                <Icon size={20} strokeWidth={2.2} color={s.color} aria-hidden="true" />
              </span>
            </Panel>
          );
        })}
      </div>

      {expiring && (
        <div
          className="flex items-center gap-3 rounded-[13px] p-4"
          style={{ background: C.warnBg, border: `1px solid ${C.warn}44` }}
          role="alert"
        >
          <AlertTriangle
            size={18}
            strokeWidth={2.2}
            color={C.warn}
            className="shrink-0"
            aria-hidden="true"
          />
          <p className="text-[12.5px]" style={{ color: C.ink }}>
            <span className="font-bold">{expiring.naam}</span> — {expiring.detail}. Vernieuw op tijd
            om verifieerbaar te blijven.
          </p>
        </div>
      )}

      <Panel className="overflow-hidden">
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          const Icon = m.Icon;
          return (
            <div
              key={c.naam}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px]"
                style={{ background: m.bg, border: `1px solid ${m.color}33` }}
              >
                <Icon size={20} strokeWidth={2.2} color={m.color} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold" style={{ color: C.ink }}>
                  {c.naam}
                </p>
                <p className="text-[11.5px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          );
        })}
      </Panel>

      {/* Documenten */}
      <Panel className="overflow-hidden">
        <div
          className="flex items-center gap-2 p-4"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          <FileText size={16} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
          <h3 className="text-[14px] font-bold" style={{ ...head, color: C.ink }}>
            Documenten
          </h3>
        </div>
        <ul>
          {DOCUMENTEN.map((d, i) => {
            const m = credMeta(d.status);
            return (
              <li
                key={d.naam}
                className="flex items-center gap-3 p-3.5"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-[9px] font-bold"
                  style={{ ...mono, background: C.panelAlt, color: C.sub }}
                  aria-hidden="true"
                >
                  {d.type}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold" style={{ color: C.ink }}>
                    {d.naam}
                  </p>
                  <p className="text-[11px]" style={{ ...mono, color: C.faint }}>
                    {d.grootte} · {d.bijgewerkt}
                  </p>
                </div>
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-bold"
                  style={{ color: m.color }}
                >
                  <m.Icon size={13} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Kicker>Prioriteiten</Kicker>
        <Title>Volgende acties</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.warn : C.accent;
          return (
            <Panel key={a.titel} className="flex items-stretch overflow-hidden">
              <div
                className="relative flex w-16 shrink-0 flex-col items-center justify-center gap-2 overflow-hidden"
                style={{ background: warn ? C.warnBg : C.wash }}
              >
                <span
                  className="absolute inset-y-0 right-0 w-2"
                  style={{ background: color, transform: "skewX(-14deg)" }}
                  aria-hidden="true"
                />
                <span className="text-[16px] font-bold tabular-nums" style={{ ...mono, color }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {warn ? (
                  <AlertTriangle size={15} strokeWidth={2.4} color={color} aria-hidden="true" />
                ) : (
                  <Zap size={15} strokeWidth={2.4} color={color} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10.5px] font-bold uppercase tracking-[0.11em]"
                  style={{ color }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-1 text-[14.5px] font-bold" style={{ color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`m-3 shrink-0 self-center rounded-[9px] px-4 py-2 text-[12px] font-bold transition-transform hover:-translate-y-0.5 ${RING}`}
                style={{
                  color: warn ? "#fff" : C.accent,
                  background: warn ? C.warn : C.wash,
                  border: warn ? "none" : `1px solid ${C.accentFaint}`,
                }}
              >
                {a.cta}
              </button>
            </Panel>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 rounded-[13px] p-4"
        style={{ background: C.wash, border: `1px solid ${C.accentFaint}` }}
      >
        <Check size={18} strokeWidth={2.4} color={C.accent} aria-hidden="true" />
        <p className="text-[12.5px]" style={{ color: C.sub }}>
          Verder is alles bijgewerkt. Nieuwe meldingen verschijnen hier vanzelf.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusColor: Record<string, string> = {
    Betaald: C.ok,
    Openstaand: C.warn,
    Concept: C.faint,
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Financiën</Kicker>
          <Title>Facturen</Title>
        </div>
        <button
          type="button"
          className={`inline-flex shrink-0 items-center gap-2 rounded-[10px] px-4 py-2.5 text-[12.5px] font-bold text-white transition-transform hover:-translate-y-0.5 ${RING}`}
          style={{ background: C.accent }}
        >
          <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Panel className="relative overflow-hidden p-5">
          <span
            className="pointer-events-none absolute right-0 top-0 h-10 w-10"
            aria-hidden="true"
            style={{ background: "#e6f4f1", clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
          />
          <p
            className="text-[10px] font-bold uppercase tracking-[0.11em]"
            style={{ color: C.faint }}
          >
            Ontvangen
          </p>
          <p className="mt-2 text-[22px] font-bold tabular-nums" style={{ ...mono, color: C.ok }}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Panel>
        <Panel className="relative overflow-hidden p-5">
          <span
            className="pointer-events-none absolute right-0 top-0 h-10 w-10"
            aria-hidden="true"
            style={{ background: C.warnBg, clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
          />
          <p
            className="text-[10px] font-bold uppercase tracking-[0.11em]"
            style={{ color: C.faint }}
          >
            Openstaand
          </p>
          <p className="mt-2 text-[22px] font-bold tabular-nums" style={{ ...mono, color: C.warn }}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </Panel>
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <th className="p-4">Nummer</th>
              <th className="p-4">Klant</th>
              <th className="hidden p-4 sm:table-cell">Datum</th>
              <th className="p-4 text-right">Bedrag</th>
              <th className="p-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const color = statusColor[f.status] ?? C.faint;
              return (
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <td
                    className="p-4 text-[12px] font-bold tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.nr}
                  </td>
                  <td className="p-4 text-[13px] font-semibold" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden p-4 text-[12px] tabular-nums sm:table-cell"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-4 text-right text-[13px] font-bold tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <Slant size={8} color={color} />
                      <span
                        className="text-[11px] font-bold uppercase tracking-[0.06em]"
                        style={{ color }}
                      >
                        {f.status}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      <div
        className="flex items-center gap-3 rounded-[13px] p-4"
        style={{ background: C.panelAlt, border: `1px solid ${C.lineSoft}` }}
      >
        <Mail size={16} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
        <p className="text-[12px]" style={{ color: C.muted }}>
          Tip: verstuur automatisch een herinnering bij facturen die langer dan 14 dagen openstaan.
        </p>
      </div>
    </div>
  );
}
