"use client";

// Concept 82 — "Japandi" · wabi-sabi / quiet-luxury.
// Gedempte keramiek-tinten (klei, greige, houtskool, salie), een tatami-achtig asymmetrisch raster
// met ruime negatieve ruimte ("ma"), en natuurlijke hand-imperfectie: subtiel-onregelmatige
// hairlines, geen felle kleuren, status via label + vorm (niet via kleur alleen). Rustig, warm,
// natuurlijk. Accent #8a7a5c (klei-brons), bg #f4f1ea (rijstpapier), fg #2b2823 (houtskool).
// Fonts: --font-lab-newsreader (serif display) + --font-lab-manrope (body). Onderscheidend: dit is
// stille luxe met warmte en ambacht — geen synthetisch pastelverloop, geen glas, geen neon.

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
  Leaf,
  Circle,
  Square,
  Triangle,
  RotateCw,
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
  bg: "#f4f1ea",
  bgWarm: "#efe9dd",
  paper: "#faf7f0",
  fg: "#2b2823",
  fgSoft: "#514c42",
  muted: "#8a8375",
  faint: "#b0a998",
  accent: "#8a7a5c",
  accentDeep: "#6f6045",
  clay: "#a98a6a",
  sage: "#7c8770",
  sageDeep: "#5f6a54",
  terracotta: "#b06a4f",
  line: "rgba(43,40,35,0.12)",
  lineSoft: "rgba(43,40,35,0.07)",
};

const serif = { fontFamily: "var(--font-lab-newsreader)" };
const body = { fontFamily: "var(--font-lab-manrope)" };

// Warme, zachte diepteschaduw — als papier op hout, geen glans.
const CARD_SHADOW = "0 1px 2px rgba(43,40,35,0.04), 0 18px 32px -26px rgba(43,40,35,0.35)";

/* ---------- Status → betekenis (label + VORM + kleur, nooit kleur-alleen) ---------- */
// Elke status heeft een eigen icoon-vorm (cirkel/vierkant/driehoek/kruis) zodat status ook zonder
// kleur leesbaar blijft — wabi-sabi: rustige signalen, geen alarmkleuren.

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.sageDeep, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.accent, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", color: C.terracotta, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.terracotta, Icon: XCircle };
  }
}

function shapeFor(s: CredStatus) {
  switch (s) {
    case "VERIFIED":
      return Circle;
    case "SUBMITTED":
      return Square;
    case "EXPIRING":
      return Triangle;
    case "REJECTED":
      return XCircle;
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Hand-imperfecte hairline (deterministisch onregelmatig, geen random) ---------- */
// Een dunne inktlijn met vaste, licht-golvende knikpunten — imiteert een met de hand getrokken lijn.
function InkLine({ className = "" }: { className?: string }) {
  // Vaste amplitudes per index (deterministisch): geen random, geen Date.
  const wobble = [0.6, -0.4, 0.3, -0.5, 0.4, -0.3, 0.5];
  const pts = wobble.map((w, i) => {
    const x = (i / (wobble.length - 1)) * 100;
    const y = 2 + w;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(2)}`;
  });
  return (
    <svg
      viewBox="0 0 100 4"
      preserveAspectRatio="none"
      className={`h-1 w-full ${className}`}
      aria-hidden="true"
    >
      <path
        d={pts.join(" ")}
        fill="none"
        stroke={C.accent}
        strokeWidth="0.5"
        strokeOpacity="0.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------- Kleine bouwstenen ---------- */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em]"
      style={{ ...body, color: C.accent }}
    >
      <Leaf size={12} strokeWidth={2} aria-hidden="true" />
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-3 text-[28px] font-normal leading-[1.08] tracking-[-0.01em] sm:text-[36px]"
      style={{ ...serif, color: C.fg }}
    >
      {children}
    </h1>
  );
}

function Card({
  children,
  className = "",
  tone = "paper",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "paper" | "warm";
}) {
  return (
    <div
      className={`rounded-[14px] ${className}`}
      style={{
        background: tone === "warm" ? C.bgWarm : C.paper,
        border: `1px solid ${C.line}`,
        boxShadow: CARD_SHADOW,
      }}
    >
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Shape = shapeFor(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        ...body,
        color: m.color,
        background: `${m.color}12`,
        border: `1px solid ${m.color}30`,
      }}
    >
      <Shape size={11} strokeWidth={2.4} fill="currentColor" aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Ingetogen sparkline — inktlijn zonder glans.
function Spark({ data, up }: { data: number[]; up: boolean }) {
  const w = 96;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const color = up ? C.sageDeep : C.terracotta;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 5) - 2.5;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.85"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2" fill={color} />}
    </svg>
  );
}

// Match-score als ingetogen keramiek-ring.
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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.line} strokeWidth="2.5" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.accent}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span className="text-[13px] font-semibold tabular-nums" style={{ ...serif, color: C.fg }}>
        {value}
      </span>
    </span>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept82() {
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
        ...body,
        color: C.fg,
        background: C.bg,
      }}
    >
      <style>{`
        @keyframes jap82-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>

      {/* Zacht papier-textuur: fijne, warme lijnen als geweven tatami — deterministisch */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        aria-hidden="true"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent 0 22px, rgba(43,40,35,0.018) 22px 23px), repeating-linear-gradient(90deg, transparent 0 22px, rgba(43,40,35,0.018) 22px 23px)",
        }}
      />

      <div
        className="relative flex min-h-[680px] flex-col md:flex-row"
        style={{
          animation: mounted ? "jap82-rise 0.5s ease-out both" : undefined,
          opacity: mounted ? 1 : 0,
        }}
      >
        {/* Zijbalk — smalle kolom met veel lucht */}
        <aside
          className="shrink-0 md:w-[244px]"
          style={{ borderRight: `1px solid ${C.line}`, background: C.bgWarm }}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 p-6">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ background: C.accent }}
                aria-hidden="true"
              >
                <Leaf size={18} strokeWidth={2} color={C.paper} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[17px] font-normal tracking-[0.01em]"
                  style={{ ...serif, color: C.fg }}
                >
                  Japandi
                </div>
                <div
                  className="text-[9px] font-semibold uppercase tracking-[0.24em]"
                  style={{ color: C.faint }}
                >
                  ZZP · zorg
                </div>
              </div>
            </div>
            <InkLine className="px-6" />

            <nav
              className="flex flex-row gap-1 overflow-x-auto p-3 md:flex-1 md:flex-col md:p-4"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="group relative flex shrink-0 items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-[13.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a7a5c] md:w-full"
                    style={{
                      color: on ? C.fg : C.muted,
                      background: on ? C.paper : "transparent",
                      border: `1px solid ${on ? C.line : "transparent"}`,
                    }}
                  >
                    <span
                      className="h-4 w-0.5 shrink-0 rounded-full transition-all"
                      style={{ background: on ? C.accent : "transparent" }}
                      aria-hidden="true"
                    />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4">
              <div
                className="flex items-center gap-3 rounded-xl p-3"
                style={{ background: C.paper, border: `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                  style={{ ...serif, color: C.paper, background: C.accentDeep }}
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
                    style={{ color: C.sageDeep }}
                  >
                    <ShieldCheck size={11} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5 sm:p-9">
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

/* ---------- Dashboard (tatami-achtig asymmetrisch raster) ---------- */

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
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Overzicht</Kicker>
          <Title>Goedemorgen, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-3 text-[13.5px]" style={{ color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold"
          style={{ color: C.accentDeep, background: C.bgWarm, border: `1px solid ${C.line}` }}
        >
          <Leaf size={13} strokeWidth={2.2} aria-hidden="true" /> {OPDRACHTEN.length} nieuwe matches
        </div>
      </header>

      {warn && (
        <div role="alert">
          <Card tone="warm" className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-full"
              style={{ background: `${C.terracotta}18`, border: `1px solid ${C.terracotta}40` }}
            >
              <Triangle size={17} strokeWidth={2} color={C.terracotta} aria-hidden="true" />
            </span>
            <p className="text-[13.5px] leading-relaxed" style={{ color: C.fgSoft }}>
              <span className="font-semibold" style={{ color: C.fg }}>
                {warn.titel}.
              </span>{" "}
              {warn.detail}
            </p>
            <button
              onClick={() => onGo("verificatie")}
              className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a7a5c]"
              style={{ color: C.paper, background: C.terracotta }}
            >
              {warn.cta} <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="flex flex-col justify-between p-5">
            <div className="flex items-start justify-between gap-2">
              <p
                className="text-[10.5px] font-semibold uppercase leading-tight tracking-[0.12em]"
                style={{ color: C.muted }}
              >
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                style={{ color: k.up ? C.sageDeep : C.terracotta }}
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
              className="mt-4 text-[26px] font-normal tabular-nums leading-none"
              style={{ ...serif, color: C.fg }}
            >
              {k.value}
            </p>
            <div className="mt-2.5">
              <Spark data={k.spark} up={k.up} />
            </div>
          </Card>
        ))}
      </div>

      {/* Asymmetrisch raster: brede matches-kolom + smalle nevenkolom met lucht ertussen */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <div
            className="flex items-center justify-between p-5"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <h3 className="text-[16px] font-normal" style={{ ...serif, color: C.fg }}>
              Beste matches
            </h3>
            <button
              onClick={() => onGo("marktplaats")}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors hover:bg-[rgba(138,122,92,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a7a5c]"
              style={{ color: C.accent }}
            >
              Alles <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                <button
                  onClick={() => onOpen(o.id)}
                  className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-[rgba(138,122,92,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8a7a5c]"
                >
                  <ScoreRing value={o.match} />
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14px] font-semibold"
                      style={{ color: C.fg }}
                    >
                      {o.titel}
                    </span>
                    <span className="block truncate text-[11.5px]" style={{ color: C.muted }}>
                      {o.plaats} · {o.tarief}
                    </span>
                  </span>
                  <ArrowUpRight size={16} strokeWidth={2} color={C.faint} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div
              className="flex items-center justify-between p-5"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <h3
                className="flex items-center gap-2 text-[16px] font-normal"
                style={{ ...serif, color: C.fg }}
              >
                Berichten
              </h3>
              <span
                className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                style={{ color: C.accentDeep, background: `${C.accent}18` }}
              >
                {BERICHTEN.filter((b) => b.ongelezen).length} ongelezen
              </span>
            </div>
            <ul>
              {BERICHTEN.slice(0, 3).map((b, i) => (
                <li
                  key={b.van}
                  className="flex items-center gap-3 p-4"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                    style={{ ...serif, color: C.accentDeep, background: `${C.accent}18` }}
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
                  <span className="shrink-0 text-[10.5px] tabular-nums" style={{ color: C.faint }}>
                    {b.tijd}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Live-feed — loading + error + ok */}
          <Card className="p-5">
            <h3
              className="flex items-center gap-2 text-[14px] font-semibold"
              style={{ color: C.fg }}
            >
              <Leaf size={14} strokeWidth={2.2} color={C.accent} aria-hidden="true" /> Recente
              activiteit
            </h3>
            {feed === "loading" && (
              <div className="mt-3 space-y-2" role="status" aria-live="polite">
                <span className="sr-only">Activiteit wordt geladen…</span>
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className="block h-3 animate-pulse rounded-full"
                    style={{ background: "rgba(43,40,35,0.07)", width: i === 0 ? "80%" : "58%" }}
                  />
                ))}
              </div>
            )}
            {feed === "error" && (
              <div
                className="mt-3 flex flex-col gap-2 rounded-xl p-3 sm:flex-row sm:items-center"
                style={{ background: `${C.terracotta}12`, border: `1px solid ${C.terracotta}30` }}
                role="alert"
              >
                <XCircle size={16} strokeWidth={2} color={C.terracotta} aria-hidden="true" />
                <p className="flex-1 text-[12px]" style={{ color: C.fgSoft }}>
                  Kon de activiteit niet laden.
                </p>
                <button
                  onClick={() => setFeed("ok")}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a7a5c]"
                  style={{ color: C.paper, background: C.accent }}
                >
                  <RotateCw size={12} strokeWidth={2.4} aria-hidden="true" /> Opnieuw
                </button>
              </div>
            )}
            {feed === "ok" && (
              <p className="mt-3 flex items-center gap-2 text-[12px]" style={{ color: C.muted }}>
                <Check size={14} strokeWidth={2.4} color={C.sageDeep} aria-hidden="true" /> Alles is
                bijgewerkt — geen nieuwe meldingen.
              </p>
            )}
          </Card>
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
    <div className="mx-auto max-w-5xl space-y-7">
      <div>
        <Kicker>Marktplaats</Kicker>
        <Title>Open opdrachten</Title>
      </div>

      <Card className="flex items-center gap-3 px-4 py-3">
        <Search size={16} strokeWidth={2} color={C.accent} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#b0a998]"
          style={{ color: C.fg }}
        />
        <span
          className="shrink-0 text-[11px] font-semibold tabular-nums"
          style={{ color: C.faint }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-14 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: `${C.accent}14`, border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Search size={24} strokeWidth={1.8} color={C.accent} />
          </span>
          <p className="mt-4 text-[20px] font-normal" style={{ ...serif, color: C.fg }}>
            Geen resultaten
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen opdracht past bij &quot;{q}&quot;. Pas je zoekopdracht aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-6 rounded-full px-5 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a7a5c]"
            style={{ color: C.paper, background: C.accent }}
          >
            Zoekopdracht wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className="w-full rounded-[14px] p-5 text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a7a5c]"
                  style={{
                    background: C.paper,
                    border: `1px solid ${on ? C.accent : C.line}`,
                    boxShadow: on ? "0 14px 30px -20px rgba(138,122,92,0.6)" : CARD_SHADOW,
                  }}
                >
                  <div className="flex items-start gap-4">
                    <ScoreRing value={o.match} size={52} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[10px] font-semibold"
                        style={{ color: C.faint }}
                      >
                        <span className="uppercase tracking-[0.14em]">{o.id}</span>
                        {on && <span style={{ color: C.accent }}>· geselecteerd</span>}
                      </div>
                      <p className="truncate text-[15.5px] font-semibold" style={{ color: C.fg }}>
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={12} strokeWidth={2} aria-hidden="true" /> {o.opdrachtgever} ·{" "}
                        {o.plaats} · {o.tarief}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {o.redenen.plus.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                            style={{
                              color: C.sageDeep,
                              background: `${C.sage}1c`,
                              border: `1px solid ${C.sage}30`,
                            }}
                          >
                            <Check size={10} strokeWidth={3} aria-hidden="true" /> {t}
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
              <Card className="overflow-hidden">
                <div
                  className="flex items-center justify-between p-5"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: C.accent }}
                  >
                    {sel.id}
                  </span>
                  <ScoreRing value={sel.match} size={40} />
                </div>
                <div className="p-5">
                  <p
                    className="text-[18px] font-normal leading-snug"
                    style={{ ...serif, color: C.fg }}
                  >
                    {sel.titel}
                  </p>
                  <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
                    {sel.opdrachtgever} · {sel.plaats}
                  </p>
                  <dl className="mt-5 grid grid-cols-2 gap-3 text-[12.5px]">
                    {[
                      { l: "Tarief", v: sel.tarief },
                      { l: "Omvang", v: sel.uren },
                      { l: "Start", v: sel.start },
                      { l: "Match", v: `${sel.match}%` },
                    ].map((m) => (
                      <div
                        key={m.l}
                        className="rounded-xl p-3"
                        style={{ background: C.bgWarm, border: `1px solid ${C.lineSoft}` }}
                      >
                        <dt
                          className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                          style={{ color: C.faint }}
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
                    className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a7a5c]"
                    style={{ color: C.paper, background: C.accent }}
                  >
                    Open opdracht <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                </div>
              </Card>
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
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-7">
          <div>
            <Kicker>{opdracht.id}</Kicker>
            <Title>{opdracht.titel}</Title>
            <p className="mt-3 text-[12.5px]" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  style={{ color: C.fgSoft, background: C.bgWarm, border: `1px solid ${C.line}` }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <ScoreRing value={opdracht.match} size={76} />
        </div>
        <div className="p-6 pt-0 sm:p-7 sm:pt-0">
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a7a5c]"
            style={{ color: C.paper, background: state === "sent" ? C.sageDeep : C.accent }}
          >
            {state === "idle" && (
              <>
                <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" /> Reageer op opdracht
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
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Card key={m.l} className="p-5">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[19px] font-normal tabular-nums"
              style={{ ...serif, color: C.fg }}
            >
              {m.v}
            </p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div
          className="flex items-center gap-2 p-5"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          <Leaf size={16} strokeWidth={2} color={C.accent} aria-hidden="true" />
          <h3 className="text-[17px] font-normal" style={{ ...serif, color: C.fg }}>
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-6">
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.sageDeep }}
            >
              <Circle size={11} strokeWidth={2.4} fill="currentColor" aria-hidden="true" />{" "}
              Pluspunten
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.fgSoft }}
                >
                  <Check
                    size={15}
                    strokeWidth={2.6}
                    color={C.sageDeep}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.terracotta }}
            >
              <Triangle size={11} strokeWidth={2.4} aria-hidden="true" /> Aandachtspunten
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.muted }}
                >
                  <AlertTriangle
                    size={15}
                    strokeWidth={2.2}
                    color={C.terracotta}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
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
  const stats = [
    { l: "Geverifieerd", v: `${verified}/${total}`, color: C.sageDeep, Icon: ShieldCheck },
    { l: "Verloopt bijna", v: "1", color: C.terracotta, Icon: AlertTriangle },
    { l: "In beoordeling", v: "1", color: C.accent, Icon: Clock },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div>
        <Kicker>Verificatie</Kicker>
        <Title>Certificaten</Title>
        <p className="mt-3 text-[13.5px]" style={{ color: C.muted }}>
          Je bewijsstukken worden veilig en privé bewaard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.Icon;
          return (
            <Card key={s.l} className="flex items-center justify-between p-5">
              <div>
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.faint }}
                >
                  {s.l}
                </p>
                <p
                  className="mt-1.5 text-[26px] font-normal tabular-nums"
                  style={{ ...serif, color: C.fg }}
                >
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: `${s.color}16`, border: `1px solid ${s.color}33` }}
              >
                <Icon size={20} strokeWidth={1.8} color={s.color} aria-hidden="true" />
              </span>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          const Shape = shapeFor(c.status);
          return (
            <div
              key={c.naam}
              className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:gap-4"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{ background: `${m.color}14`, border: `1px solid ${m.color}30` }}
              >
                <Shape size={18} strokeWidth={2} color={m.color} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-semibold" style={{ color: C.fg }}>
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
      </Card>

      {/* Documenten */}
      <Card className="overflow-hidden">
        <div
          className="flex items-center gap-2 p-5"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          <FileText size={15} strokeWidth={2} color={C.accent} aria-hidden="true" />
          <h3 className="text-[15px] font-normal" style={{ ...serif, color: C.fg }}>
            Documenten
          </h3>
          <span className="ml-auto text-[11px] font-medium" style={{ color: C.muted }}>
            Privé opgeslagen
          </span>
        </div>
        <ul>
          {DOCUMENTEN.map((d, i) => {
            const m = credMeta(d.status);
            return (
              <li
                key={d.naam}
                className="flex items-center gap-3 p-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold"
                  style={{ color: C.accentDeep, background: `${C.accent}16` }}
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
                  <span className="block text-[11px]" style={{ color: C.faint }}>
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
      </Card>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <Kicker>Prioriteiten</Kicker>
        <Title>Volgende acties</Title>
        <p className="mt-3 text-[13.5px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.terracotta : C.accent;
          return (
            <Card key={a.titel} className="flex items-stretch overflow-hidden">
              <div
                className="flex w-16 shrink-0 flex-col items-center justify-center gap-2"
                style={{ background: `${color}0f`, borderRight: `1px solid ${color}22` }}
              >
                <span className="text-[17px] font-normal tabular-nums" style={{ ...serif, color }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {warn ? (
                  <Triangle size={14} strokeWidth={2.2} color={color} aria-hidden="true" />
                ) : (
                  <Circle
                    size={12}
                    strokeWidth={2.2}
                    fill="currentColor"
                    color={color}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 p-5">
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-1 text-[15px] font-semibold" style={{ color: C.fg }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className="m-3 shrink-0 self-center rounded-full px-4 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a7a5c]"
                style={{
                  color: warn ? C.paper : C.accentDeep,
                  background: warn ? C.terracotta : `${C.accent}16`,
                  border: warn ? "none" : `1px solid ${C.accent}33`,
                }}
              >
                {a.cta}
              </button>
            </Card>
          );
        })}
      </div>

      <Card tone="warm" className="flex items-center gap-3 p-5">
        <Circle
          size={16}
          strokeWidth={2.2}
          fill={C.sageDeep}
          color={C.sageDeep}
          aria-hidden="true"
        />
        <p className="text-[12.5px]" style={{ color: C.muted }}>
          Verder is alles bijgewerkt. Nieuwe acties verschijnen hier vanzelf.
        </p>
      </Card>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusColor: Record<string, string> = {
    Betaald: C.sageDeep,
    Openstaand: C.terracotta,
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
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Financiën</Kicker>
          <Title>Facturen</Title>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a7a5c]"
          style={{ color: C.paper, background: C.accent }}
        >
          <Plus size={14} strokeWidth={2.4} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: C.faint }}
          >
            Ontvangen
          </p>
          <p
            className="mt-2 text-[24px] font-normal tabular-nums"
            style={{ ...serif, color: C.sageDeep }}
          >
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Card>
        <Card className="p-6">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: C.faint }}
          >
            Openstaand
          </p>
          <p
            className="mt-2 text-[24px] font-normal tabular-nums"
            style={{ ...serif, color: C.terracotta }}
          >
            € {open.toLocaleString("nl-NL")}
          </p>
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <th className="p-5">Nummer</th>
              <th className="p-5">Klant</th>
              <th className="hidden p-5 sm:table-cell">Datum</th>
              <th className="p-5 text-right">Bedrag</th>
              <th className="p-5 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const color = statusColor[f.status] ?? C.faint;
              return (
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <td
                    className="p-5 text-[12px] font-semibold tabular-nums"
                    style={{ color: C.fg }}
                  >
                    {f.nr}
                  </td>
                  <td className="p-5 text-[13px] font-medium" style={{ color: C.fg }}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden p-5 text-[12px] tabular-nums sm:table-cell"
                    style={{ color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-5 text-right text-[13px] font-semibold tabular-nums"
                    style={{ color: C.fg }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="p-5">
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
      </Card>
    </div>
  );
}
