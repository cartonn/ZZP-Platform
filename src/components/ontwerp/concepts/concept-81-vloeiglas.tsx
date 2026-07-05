"use client";

// Concept 81 — "Vloeiglas" · Apple Liquid Glass (iOS 26→27, 2026).
// Lagen als levend, brekend glas: zwevende semi-transparante witte panelen met specular top-randen,
// adaptieve doorschijnendheid (backdrop-blur), refractie/lensing-highlights via deterministische SVG,
// en zachte gekleurde gloed die achter de lagen doorschijnt. Alles drijft boven een zachte lichte
// achtergrond met diepte; geen platte vlakken. Accent #0a84ff, bg #eef1f6, fg #0b1220.
// Fonts: --font-lab-geist (display/body) + --font-lab-geist-mono (mono). Onderscheidend: dit is glas
// dat licht buigt en verschuift, geen radar-scope, geen papier — een levende glaslaag.

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
  Sparkles,
  Droplets,
  Layers,
  RotateCw,
  ChevronRight,
  Wallet,
  Inbox,
  FileText,
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

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#eef1f6",
  bgDeep: "#e3e8f1",
  fg: "#0b1220",
  fgSoft: "#3b4457",
  muted: "#6b7488",
  faint: "#9aa2b4",
  accent: "#0a84ff",
  accentDeep: "#0060df",
  glass: "rgba(255,255,255,0.55)",
  glassStrong: "rgba(255,255,255,0.72)",
  glassSoft: "rgba(255,255,255,0.38)",
  specular: "rgba(255,255,255,0.9)",
  line: "rgba(11,18,32,0.08)",
  lineSoft: "rgba(11,18,32,0.05)",
  warn: "#e8890c",
  warnSoft: "rgba(232,137,12,0.12)",
  danger: "#e5484d",
  ok: "#1a9c58",
};

const display = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

// Zwevend glas: dunne lichte specular top-border, zachte diepteschaduw, backdrop-blur.
const GLASS_SHADOW =
  "0 1px 0 0 rgba(255,255,255,0.6) inset, 0 -1px 0 0 rgba(11,18,32,0.04) inset, 0 24px 48px -28px rgba(15,32,72,0.42), 0 6px 16px -12px rgba(15,32,72,0.28)";

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; bg: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.ok, bg: "rgba(26,156,88,0.12)", Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.accent, bg: "rgba(10,132,255,0.12)", Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", color: C.warn, bg: C.warnSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.danger, bg: "rgba(229,72,77,0.12)", Icon: XCircle };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Deterministische refractie-highlights (geen random) ---------- */
// Vaste lens-blobs die achter/onder de glaslagen doorschijnen. Posities zijn hard-coded fracties.
const LENSES: { x: number; y: number; r: number; hue: string }[] = [
  { x: 16, y: 22, r: 30, hue: "rgba(10,132,255,0.28)" },
  { x: 82, y: 14, r: 24, hue: "rgba(94,196,255,0.24)" },
  { x: 70, y: 78, r: 34, hue: "rgba(160,120,255,0.20)" },
  { x: 30, y: 84, r: 22, hue: "rgba(10,132,255,0.16)" },
];

/* ---------- Kleine bouwstenen ---------- */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em]"
      style={{ ...mono, color: C.accent }}
    >
      <Droplets size={12} strokeWidth={2.4} aria-hidden="true" />
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-2 text-[26px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[32px]"
      style={{ ...display, color: C.fg }}
    >
      {children}
    </h1>
  );
}

// De handtekening: een zwevende glaslaag met specular top-rand, refractie-highlight en gloed.
function Glass({
  children,
  className = "",
  strong = false,
  glow,
}: {
  children: React.ReactNode;
  className?: string;
  strong?: boolean;
  glow?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl backdrop-blur-xl ${className}`}
      style={{
        background: strong ? C.glassStrong : C.glass,
        border: `1px solid ${C.line}`,
        borderTop: `1px solid ${C.specular}`,
        boxShadow: glow ? `${GLASS_SHADOW}, 0 0 40px -12px ${glow}` : GLASS_SHADOW,
      }}
    >
      {/* Specular sheen langs de bovenrand — deterministische lens-veeg */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.95) 30%, rgba(255,255,255,0.95) 70%, transparent)",
        }}
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute -left-1/4 -top-1/3 h-2/3 w-1/2 rotate-12 rounded-full opacity-40 blur-2xl"
        style={{ background: "rgba(255,255,255,0.7)" }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: m.color, background: m.bg, border: `1px solid ${m.color}33` }}
    >
      <Icon size={13} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Vloeiende sparkline met glasachtige gradient-vulling onder de lijn.
function Spark({ data, up }: { data: number[]; up: boolean }) {
  const w = 96;
  const h = 30;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const color = up ? C.accent : C.warn;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 5) - 2.5;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const last = pts[pts.length - 1];
  const gid = `spark81-${up ? "up" : "dn"}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.2" fill={color} />}
    </svg>
  );
}

// Match-score als glazen ring met blauwe voortgang.
function ScoreRing({ value, size = 48 }: { value: number; size?: number }) {
  const r = size / 2 - 3;
  const circ = 2 * Math.PI * r;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.line} strokeWidth="3" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.accent}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span className="text-[13px] font-semibold tabular-nums" style={{ ...display, color: C.fg }}>
        {value}
      </span>
    </span>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept81() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const [mounted, setMounted] = useState(false);
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 20);
    return () => window.clearTimeout(t);
  }, []);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{
        ...display,
        color: C.fg,
        background: `radial-gradient(130% 100% at 50% -20%, ${C.bg}, ${C.bgDeep} 70%)`,
      }}
    >
      {/* Deterministische mount- en drift-animaties */}
      <style>{`
        @keyframes glass81-rise { from { opacity: 0; transform: translateY(10px) scale(0.99); } to { opacity: 1; transform: none; } }
        @keyframes glass81-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes glass81-drift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(6px,-10px) scale(1.06); } }
      `}</style>

      {/* Achtergrond: zwevende gekleurde lens-blobs die door het glas heen schijnen */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {LENSES.map((l, i) => (
          <span
            key={i}
            className="absolute rounded-full blur-3xl"
            style={{
              left: `${l.x}%`,
              top: `${l.y}%`,
              width: `${l.r}rem`,
              height: `${l.r}rem`,
              background: l.hue,
              transform: "translate(-50%,-50%)",
              animation: `glass81-drift ${11 + i * 2}s ease-in-out ${i * 0.7}s infinite`,
            }}
          />
        ))}
      </div>

      <div
        className="relative flex min-h-[680px] flex-col md:flex-row"
        style={{
          opacity: mounted ? 1 : 0,
          animation: mounted ? "glass81-rise 0.5s ease-out both" : undefined,
        }}
      >
        {/* Zijbalk als eigen glaslaag */}
        <aside className="shrink-0 p-3 md:w-[248px]">
          <Glass strong className="flex h-full flex-col p-3">
            <div className="flex items-center gap-3 px-2 py-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  background: `linear-gradient(160deg, ${C.accent}, ${C.accentDeep})`,
                  boxShadow: "0 8px 20px -8px rgba(10,132,255,0.7)",
                }}
                aria-hidden="true"
              >
                <Layers size={19} strokeWidth={2.2} color="#fff" />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[16px] font-semibold tracking-[-0.01em]"
                  style={{ color: C.fg }}
                >
                  Vloeiglas
                </div>
                <div
                  className="text-[9px] font-semibold uppercase tracking-[0.2em]"
                  style={{ ...mono, color: C.faint }}
                >
                  ZZP · zorg
                </div>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto py-2 md:flex-1 md:flex-col"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="group relative flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a84ff] md:w-full"
                    style={{
                      color: on ? C.accentDeep : C.fgSoft,
                      background: on ? "rgba(10,132,255,0.12)" : "transparent",
                      border: `1px solid ${on ? "rgba(10,132,255,0.22)" : "transparent"}`,
                      boxShadow: on ? "0 1px 0 rgba(255,255,255,0.7) inset" : undefined,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full transition-all"
                      style={{
                        background: on ? C.accent : "transparent",
                        boxShadow: on ? `0 0 8px ${C.accent}` : undefined,
                      }}
                      aria-hidden="true"
                    />
                    <span>{s.label}</span>
                    {on && (
                      <ChevronRight
                        size={14}
                        strokeWidth={2.4}
                        className="ml-auto"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            <div
              className="mt-2 hidden items-center gap-3 rounded-xl p-3 md:flex"
              style={{ background: C.glassSoft, border: `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                style={{ background: `linear-gradient(160deg, ${C.accent}, ${C.accentDeep})` }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold" style={{ color: C.fg }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[10px] font-semibold"
                  style={{ color: C.ok }}
                >
                  <ShieldCheck size={11} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </Glass>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-7">
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
    const t = window.setTimeout(() => setFeed("error"), 700);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Overzicht</Kicker>
          <Title>Goedemorgen, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold backdrop-blur-xl"
          style={{ color: C.accentDeep, background: C.glass, border: `1px solid ${C.line}` }}
        >
          <Sparkles size={14} strokeWidth={2.2} aria-hidden="true" /> {OPDRACHTEN.length} nieuwe
          matches
        </div>
      </header>

      {warn && (
        <Glass glow="rgba(232,137,12,0.4)" className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center" role="alert">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-2xl"
              style={{ background: C.warnSoft, border: `1px solid ${C.warn}44` }}
            >
              <AlertTriangle size={19} strokeWidth={2.2} color={C.warn} aria-hidden="true" />
            </span>
            <p className="text-[13px] leading-snug" style={{ color: C.fgSoft }}>
              <span className="font-semibold" style={{ color: C.fg }}>
                {warn.titel}.
              </span>{" "}
              {warn.detail}
            </p>
            <button
              onClick={() => onGo("verificatie")}
              className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a84ff]"
              style={{ background: C.warn, boxShadow: "0 8px 20px -10px rgba(232,137,12,0.8)" }}
            >
              {warn.cta} <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
        </Glass>
      )}

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Glass key={k.label} className="p-4">
            <div
              className="flex h-full flex-col justify-between"
              style={{ animation: `glass81-float ${9 + i}s ease-in-out ${i * 0.5}s infinite` }}
            >
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10.5px] font-semibold uppercase leading-tight tracking-[0.06em]"
                  style={{ ...mono, color: C.muted }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
                  style={{
                    color: k.up ? C.ok : C.warn,
                    background: k.up ? "rgba(26,156,88,0.12)" : C.warnSoft,
                  }}
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
                className="mt-3 text-[24px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                style={{ color: C.fg }}
              >
                {k.value}
              </p>
              <div className="mt-2">
                <Spark data={k.spark} up={k.up} />
              </div>
            </div>
          </Glass>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.25fr_1fr]">
        {/* Beste matches */}
        <Glass strong>
          <div
            className="flex items-center justify-between p-4"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <h3 className="text-[14px] font-semibold" style={{ color: C.fg }}>
              Beste matches
            </h3>
            <button
              onClick={() => onGo("marktplaats")}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-[rgba(10,132,255,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a84ff]"
              style={{ color: C.accent }}
            >
              Alles <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
          <ul className="p-2">
            {OPDRACHTEN.map((o) => (
              <li key={o.id}>
                <button
                  onClick={() => onOpen(o.id)}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-[rgba(10,132,255,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0a84ff]"
                >
                  <ScoreRing value={o.match} />
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[13.5px] font-semibold"
                      style={{ color: C.fg }}
                    >
                      {o.titel}
                    </span>
                    <span className="block truncate text-[11.5px]" style={{ color: C.muted }}>
                      {o.plaats} · {o.tarief}
                    </span>
                  </span>
                  <ArrowUpRight size={16} strokeWidth={2.2} color={C.faint} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </Glass>

        <div className="space-y-5">
          {/* Berichten-preview */}
          <Glass>
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <h3
                className="flex items-center gap-2 text-[14px] font-semibold"
                style={{ color: C.fg }}
              >
                <Inbox size={15} strokeWidth={2.2} color={C.accent} aria-hidden="true" /> Berichten
              </h3>
              <span
                className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                style={{ color: C.accentDeep, background: "rgba(10,132,255,0.12)" }}
              >
                {BERICHTEN.filter((b) => b.ongelezen).length} ongelezen
              </span>
            </div>
            <ul className="p-2">
              {BERICHTEN.slice(0, 3).map((b) => (
                <li key={b.van} className="flex items-center gap-3 rounded-xl p-2.5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                    style={{ color: C.accentDeep, background: "rgba(10,132,255,0.12)" }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="truncate text-[12.5px] font-semibold"
                        style={{ color: C.fg }}
                      >
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
                    <span className="block truncate text-[11.5px]" style={{ color: C.muted }}>
                      {b.preview}
                    </span>
                  </span>
                  <span
                    className="shrink-0 text-[10.5px] tabular-nums"
                    style={{ ...mono, color: C.faint }}
                  >
                    {b.tijd}
                  </span>
                </li>
              ))}
            </ul>
          </Glass>

          {/* Live-feed — loading + error + ok */}
          <Glass className="p-4">
            <h3
              className="flex items-center gap-2 text-[13px] font-semibold"
              style={{ color: C.fg }}
            >
              <Droplets size={14} strokeWidth={2.2} color={C.accent} aria-hidden="true" /> Live
              activiteit
            </h3>
            {feed === "loading" && (
              <div className="mt-3 space-y-2" role="status" aria-live="polite">
                <span className="sr-only">Activiteit wordt geladen…</span>
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className="block h-3 animate-pulse rounded-full"
                    style={{ background: "rgba(11,18,32,0.08)", width: i === 0 ? "80%" : "58%" }}
                  />
                ))}
              </div>
            )}
            {feed === "error" && (
              <div
                className="mt-3 flex flex-col gap-2 rounded-xl p-3 sm:flex-row sm:items-center"
                style={{ background: "rgba(229,72,77,0.08)", border: `1px solid ${C.danger}33` }}
                role="alert"
              >
                <XCircle size={16} strokeWidth={2.2} color={C.danger} aria-hidden="true" />
                <p className="flex-1 text-[12px]" style={{ color: C.fgSoft }}>
                  Kon de live-feed niet laden.
                </p>
                <button
                  onClick={() => setFeed("ok")}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a84ff]"
                  style={{ background: C.accent }}
                >
                  <RotateCw size={12} strokeWidth={2.6} aria-hidden="true" /> Opnieuw
                </button>
              </div>
            )}
            {feed === "ok" && (
              <p className="mt-3 flex items-center gap-2 text-[12px]" style={{ color: C.muted }}>
                <Check size={14} strokeWidth={2.6} color={C.ok} aria-hidden="true" /> Alles is
                bijgewerkt — geen nieuwe meldingen.
              </p>
            )}
          </Glass>
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

      <Glass strong className="flex items-center gap-3 px-4 py-3">
        <Search size={16} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9aa2b4]"
          style={{ color: C.fg }}
        />
        <span
          className="shrink-0 text-[11px] font-semibold tabular-nums"
          style={{ ...mono, color: C.faint }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Glass>

      {filtered.length === 0 ? (
        <Glass className="p-12 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "rgba(10,132,255,0.1)", border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Search size={24} strokeWidth={2} color={C.accent} />
          </span>
          <p className="mt-4 text-[18px] font-semibold" style={{ color: C.fg }}>
            Geen resultaten
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12px]" style={{ color: C.muted }}>
            Geen opdracht past bij &quot;{q}&quot;. Pas je zoekopdracht aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 rounded-full px-5 py-2 text-[12.5px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a84ff]"
            style={{ background: C.accent }}
          >
            Zoekopdracht wissen
          </button>
        </Glass>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3.5">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className="w-full text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a84ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef1f6]"
                >
                  <Glass strong={on} glow={on ? "rgba(10,132,255,0.4)" : undefined} className="p-4">
                    <div className="flex items-start gap-3.5">
                      <ScoreRing value={o.match} size={52} />
                      <div className="min-w-0 flex-1">
                        <div
                          className="flex items-center gap-2 text-[10px] font-semibold"
                          style={{ ...mono, color: C.faint }}
                        >
                          <span className="uppercase tracking-[0.1em]">{o.id}</span>
                          {on && <span style={{ color: C.accent }}>· geselecteerd</span>}
                        </div>
                        <p className="truncate text-[15px] font-semibold" style={{ color: C.fg }}>
                          {o.titel}
                        </p>
                        <p
                          className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                          style={{ color: C.muted }}
                        >
                          <MapPin size={12} strokeWidth={2.2} aria-hidden="true" />{" "}
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {o.redenen.plus.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                              style={{
                                color: C.ok,
                                background: "rgba(26,156,88,0.1)",
                                border: `1px solid ${C.ok}22`,
                              }}
                            >
                              <Check size={10} strokeWidth={3} aria-hidden="true" /> {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Glass>
                </button>
              );
            })}
          </div>

          {sel && (
            <aside className="h-fit lg:sticky lg:top-4">
              <Glass strong>
                <div
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                    style={{ ...mono, color: C.accent }}
                  >
                    {sel.id}
                  </span>
                  <ScoreRing value={sel.match} size={40} />
                </div>
                <div className="p-4">
                  <p className="text-[16px] font-semibold leading-snug" style={{ color: C.fg }}>
                    {sel.titel}
                  </p>
                  <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
                    {sel.opdrachtgever} · {sel.plaats}
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-2.5 text-[12.5px]">
                    {[
                      { l: "Tarief", v: sel.tarief },
                      { l: "Omvang", v: sel.uren },
                      { l: "Start", v: sel.start },
                      { l: "Match", v: `${sel.match}%` },
                    ].map((m) => (
                      <div
                        key={m.l}
                        className="rounded-xl p-2.5"
                        style={{ background: C.glassSoft, border: `1px solid ${C.lineSoft}` }}
                      >
                        <dt
                          className="text-[10px] font-semibold uppercase tracking-[0.06em]"
                          style={{ ...mono, color: C.faint }}
                        >
                          {m.l}
                        </dt>
                        <dd className="mt-0.5 font-semibold tabular-nums" style={{ color: C.fg }}>
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    onClick={() => onOpen(sel.id)}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[12.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a84ff]"
                    style={{
                      background: `linear-gradient(160deg, ${C.accent}, ${C.accentDeep})`,
                      boxShadow: "0 10px 24px -10px rgba(10,132,255,0.8)",
                    }}
                  >
                    Open opdracht <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
                  </button>
                </div>
              </Glass>
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
    <div className="mx-auto max-w-4xl space-y-5">
      <Glass strong glow="rgba(10,132,255,0.3)">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <Kicker>{opdracht.id}</Kicker>
            <Title>{opdracht.titel}</Title>
            <p className="mt-2 text-[12.5px]" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  style={{
                    color: C.fgSoft,
                    background: C.glassSoft,
                    border: `1px solid ${C.line}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <ScoreRing value={opdracht.match} size={76} />
        </div>
        <div className="p-5 pt-0 sm:p-6 sm:pt-0">
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a84ff] disabled:translate-y-0"
            style={{
              background:
                state === "sent" ? C.ok : `linear-gradient(160deg, ${C.accent}, ${C.accentDeep})`,
              boxShadow: "0 12px 28px -12px rgba(10,132,255,0.8)",
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
        </div>
      </Glass>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Glass key={m.l} className="p-4">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.06em]"
              style={{ ...mono, color: C.faint }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[18px] font-semibold tabular-nums" style={{ color: C.fg }}>
              {m.v}
            </p>
          </Glass>
        ))}
      </div>

      <Glass strong>
        <div
          className="flex items-center gap-2 p-4"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          <Sparkles size={16} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
          <h3 className="text-[16px] font-semibold" style={{ color: C.fg }}>
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-5">
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.ok }}
            >
              <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.fgSoft }}
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
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
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
      </Glass>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const stats = [
    { l: "Geverifieerd", v: `${verified}/${total}`, color: C.ok, Icon: ShieldCheck },
    { l: "Verloopt bijna", v: "1", color: C.warn, Icon: AlertTriangle },
    { l: "In beoordeling", v: "1", color: C.accent, Icon: Clock },
  ];

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
            <Glass key={s.l} className="flex items-center justify-between p-4">
              <div>
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.06em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {s.l}
                </p>
                <p
                  className="mt-1.5 text-[24px] font-semibold tabular-nums"
                  style={{ color: C.fg }}
                >
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ background: `${s.color}18`, border: `1px solid ${s.color}33` }}
              >
                <Icon size={20} strokeWidth={2} color={s.color} aria-hidden="true" />
              </span>
            </Glass>
          );
        })}
      </div>

      <Glass strong>
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: m.bg, border: `1px solid ${m.color}33` }}
              >
                <Icon size={20} strokeWidth={2} color={m.color} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold" style={{ color: C.fg }}>
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
      </Glass>

      {/* Documenten — privacy-context als extra glaslaag */}
      <Glass>
        <div
          className="flex items-center gap-2 p-4"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          <FileText size={15} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
          <h3 className="text-[14px] font-semibold" style={{ color: C.fg }}>
            Documenten
          </h3>
          <span className="ml-auto text-[11px] font-medium" style={{ color: C.muted }}>
            Privé opgeslagen
          </span>
        </div>
        <ul className="divide-y" style={{ borderColor: C.lineSoft }}>
          {DOCUMENTEN.map((d) => {
            const m = credMeta(d.status);
            return (
              <li key={d.naam} className="flex items-center gap-3 p-3.5">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[9px] font-bold"
                  style={{ ...mono, color: C.accentDeep, background: "rgba(10,132,255,0.1)" }}
                  aria-hidden="true"
                >
                  {d.type}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[12.5px] font-medium"
                    style={{ color: C.fg }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[11px]" style={{ ...mono, color: C.faint }}>
                    {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] font-semibold" style={{ color: m.color }}>
                  {m.label}
                </span>
              </li>
            );
          })}
        </ul>
      </Glass>
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
            <Glass
              key={a.titel}
              glow={warn ? "rgba(232,137,12,0.35)" : undefined}
              className="flex items-stretch"
            >
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-2"
                style={{ background: `${color}12`, borderRight: `1px solid ${color}22` }}
              >
                <span className="text-[16px] font-semibold tabular-nums" style={{ color }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {warn ? (
                  <AlertTriangle size={15} strokeWidth={2.4} color={color} aria-hidden="true" />
                ) : (
                  <Sparkles size={15} strokeWidth={2.2} color={color} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{ ...mono, color }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-1 text-[14.5px] font-semibold" style={{ color: C.fg }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className="m-3 shrink-0 self-center rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a84ff]"
                style={{
                  color: warn ? "#fff" : C.accentDeep,
                  background: warn ? C.warn : "rgba(10,132,255,0.12)",
                  border: warn ? "none" : `1px solid rgba(10,132,255,0.22)`,
                }}
              >
                {a.cta}
              </button>
            </Glass>
          );
        })}
      </div>

      <Glass className="flex items-center gap-3 p-4">
        <Check size={18} strokeWidth={2.4} color={C.ok} aria-hidden="true" />
        <p className="text-[12.5px]" style={{ color: C.muted }}>
          Verder is alles bijgewerkt. Nieuwe acties verschijnen hier vanzelf.
        </p>
      </Glass>
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
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a84ff]"
          style={{
            background: `linear-gradient(160deg, ${C.accent}, ${C.accentDeep})`,
            boxShadow: "0 10px 24px -10px rgba(10,132,255,0.8)",
          }}
        >
          <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Glass className="p-5">
          <p
            className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
            style={{ ...mono, color: C.faint }}
          >
            <Wallet size={13} strokeWidth={2.2} aria-hidden="true" /> Ontvangen
          </p>
          <p className="mt-2 text-[22px] font-semibold tabular-nums" style={{ color: C.ok }}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Glass>
        <Glass className="p-5">
          <p
            className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
            style={{ ...mono, color: C.faint }}
          >
            <Clock size={13} strokeWidth={2.2} aria-hidden="true" /> Openstaand
          </p>
          <p className="mt-2 text-[22px] font-semibold tabular-nums" style={{ color: C.warn }}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </Glass>
      </div>

      <Glass strong className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10.5px] font-semibold uppercase tracking-[0.06em]"
              style={{ ...mono, color: C.faint, borderBottom: `1px solid ${C.lineSoft}` }}
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
                    className="p-4 text-[12px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.fg }}
                  >
                    {f.nr}
                  </td>
                  <td className="p-4 text-[13px] font-medium" style={{ color: C.fg }}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden p-4 text-[12px] tabular-nums sm:table-cell"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-4 text-right text-[13px] font-semibold tabular-nums"
                    style={{ color: C.fg }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: color }}
                        aria-hidden="true"
                      />
                      <span className="text-[11.5px] font-semibold" style={{ color }}>
                        {f.status}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Glass>
    </div>
  );
}
