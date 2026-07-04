"use client";

// Concept 74 — "Sterrenbeeld" · sterrenkaart / constellatie.
// Diep nacht-indigo firmament met sterlicht-tekst; matching wordt een sterrenhemel: opdrachten en
// kandidaten zijn sterren (nodes) verbonden met haarlijn-constellatielijnen (SVG) tot een matching-
// graaf. Helderheid en grootte van een ster = match-sterkte. Subtiele, DETERMINISTISCHE fonkeling
// (CSS opacity-puls met vaste delays, geen random). Coördinaat-labels in mono, celestiaal en rustig.
// Palet: firmament #0b1020 / #0e1530, sterlicht #e8ecf8, muted #8a93b8, goud-sterlicht #f0d68a,
// nevel-cyaan #7ec7e0, rood-reus #e08a8a. Fonts: --font-lab-newsreader (kop, serif) +
// --font-lab-geist-mono (coördinaten/cijfers). Onderscheidend: een donker planetarium, geen paneel-UI.

import { useEffect, useMemo, useState } from "react";
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
  Compass,
  Sparkles,
  Telescope,
  Star,
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

/* ---------- Palet & typografie ---------- */

const C = {
  sky: "#0b1020",
  skyAlt: "#0e1530",
  panel: "rgba(20,28,58,0.55)",
  star: "#e8ecf8",
  muted: "#8a93b8",
  faint: "#5b6490",
  gold: "#f0d68a",
  cyan: "#7ec7e0",
  red: "#e08a8a",
  line: "rgba(232,236,248,0.12)",
  lineSoft: "rgba(232,236,248,0.06)",
};

const serif = { fontFamily: "var(--font-lab-newsreader)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

const GLOW = "inset 0 0 0 1px rgba(232,236,248,0.05), 0 20px 50px -30px rgba(0,0,0,0.9)";

/* ---------- Deterministische sterrenhemel ---------- */

type StarDot = { x: number; y: number; r: number; delay: number; dur: number; o: number };

const STARS: StarDot[] = Array.from({ length: 54 }, (_, i) => {
  const h1 = (i * 9301 + 49297) % 233280;
  const h2 = (i * 4831 + 12347) % 233280;
  const h3 = (i * 2179 + 7919) % 233280;
  return {
    x: (h1 / 233280) * 100,
    y: (h2 / 233280) * 100,
    r: 0.4 + ((i * 7) % 5) * 0.26,
    delay: (i % 8) * 0.6,
    dur: 3 + (i % 5),
    o: 0.25 + (h3 / 233280) * 0.6,
  };
});

function StarField() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <defs>
        <radialGradient id="c74-neb-a" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(126,199,224,0.16)" />
          <stop offset="100%" stopColor="rgba(126,199,224,0)" />
        </radialGradient>
        <radialGradient id="c74-neb-b" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(240,214,138,0.12)" />
          <stop offset="100%" stopColor="rgba(240,214,138,0)" />
        </radialGradient>
      </defs>
      <ellipse cx="18" cy="24" rx="34" ry="26" fill="url(#c74-neb-a)" />
      <ellipse cx="86" cy="78" rx="30" ry="24" fill="url(#c74-neb-b)" />
      {STARS.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill={C.star}
          style={{
            opacity: s.o,
            animation: `c74-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </svg>
  );
}

/* ---------- Constellatie-graaf (interactieve matching-visual) ---------- */

type Node = { id: string; x: number; y: number; match: number; label: string };

function Constellation({
  opdrachten,
  onOpen,
}: {
  opdrachten: Opdracht[];
  onOpen: (id: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  // Vaste, deterministische coördinaten rond een centrale "jij"-ster.
  const spots: { x: number; y: number }[] = [
    { x: 24, y: 30 },
    { x: 78, y: 26 },
    { x: 68, y: 74 },
    { x: 22, y: 72 },
    { x: 50, y: 16 },
  ];
  const center = { x: 50, y: 50 };
  const nodes: Node[] = opdrachten.map((o, i) => {
    const p = spots[i % spots.length] ?? center;
    return { id: o.id, x: p.x, y: p.y, match: o.match, label: o.titel };
  });

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ background: "rgba(9,13,32,0.6)", border: `1px solid ${C.line}`, boxShadow: GLOW }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${C.lineSoft}` }}
      >
        <h3 className="flex items-center gap-2 text-[17px]" style={{ ...serif, color: C.star }}>
          <Telescope size={16} strokeWidth={1.8} color={C.gold} aria-hidden="true" /> Constellatie
        </h3>
        <span className="text-[10.5px] tracking-[0.14em]" style={{ ...mono, color: C.faint }}>
          RA 14ʰ · DEC +38°
        </span>
      </div>
      <div className="relative aspect-[16/10] w-full">
        <svg
          viewBox="0 0 100 62"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Matching-constellatie: opdrachten als sterren rond jouw profiel"
        >
          {/* Haarlijn-constellatielijnen van centrum naar elke ster */}
          {nodes.map((n) => {
            const on = hover === n.id;
            return (
              <line
                key={`l-${n.id}`}
                x1={center.x}
                y1={center.y * 0.62}
                x2={n.x}
                y2={n.y * 0.62}
                stroke={on ? C.gold : C.line}
                strokeWidth={on ? 0.5 : 0.25}
                opacity={on ? 0.9 : 0.5}
                style={{ transition: "all 0.25s ease" }}
              />
            );
          })}
          {/* Centrale "jij"-ster */}
          <circle cx={center.x} cy={center.y * 0.62} r={2.4} fill={C.cyan} opacity={0.9} />
          <circle
            cx={center.x}
            cy={center.y * 0.62}
            r={4.4}
            fill="none"
            stroke={C.cyan}
            strokeWidth={0.3}
            opacity={0.4}
          />
          {/* Opdracht-sterren; helderheid/grootte = match */}
          {nodes.map((n) => {
            const on = hover === n.id;
            const rad = 1.4 + (n.match / 100) * 2.4;
            const col = n.match >= 90 ? C.gold : n.match >= 85 ? C.cyan : C.star;
            return (
              <g key={`n-${n.id}`}>
                <circle
                  cx={n.x}
                  cy={n.y * 0.62}
                  r={rad + (on ? 1.4 : 0)}
                  fill={col}
                  opacity={on ? 1 : 0.5 + (n.match / 100) * 0.4}
                  style={{ transition: "all 0.25s ease", cursor: "pointer" }}
                />
                <circle
                  cx={n.x}
                  cy={n.y * 0.62}
                  r={rad + 2.6}
                  fill="none"
                  stroke={col}
                  strokeWidth={0.3}
                  opacity={on ? 0.6 : 0.2}
                  style={{ transition: "all 0.25s ease" }}
                />
                <text
                  x={n.x}
                  y={n.y * 0.62 - rad - 2}
                  textAnchor="middle"
                  style={{ ...mono, fontSize: "2.6px", fill: on ? C.gold : C.faint }}
                >
                  {n.match}%
                </text>
              </g>
            );
          })}
        </svg>
        {/* Onzichtbare hit-knoppen boven de sterren (toegankelijk) */}
        {nodes.map((n) => (
          <button
            key={`b-${n.id}`}
            onMouseEnter={() => setHover(n.id)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(n.id)}
            onBlur={() => setHover(null)}
            onClick={() => onOpen(n.id)}
            aria-label={`${n.label} — ${n.match}% match, open opdracht`}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d68a]"
            style={{ left: `${n.x}%`, top: `${n.y * 0.62 * (62 / 62)}%`, width: 44, height: 44 }}
          />
        ))}
      </div>
      {hover && (
        <div
          className="px-4 py-2.5 text-[12px]"
          style={{ borderTop: `1px solid ${C.lineSoft}`, color: C.muted }}
        >
          <span style={{ color: C.gold }}>{nodes.find((n) => n.id === hover)?.label}</span> ·{" "}
          {nodes.find((n) => n.id === hover)?.match}% verbondenheid
        </div>
      )}
    </div>
  );
}

/* ---------- Status → betekenis (label + icoon + kleur) ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.cyan, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.gold, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", color: C.red, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.red, Icon: XCircle };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Kleine bouwstenen ---------- */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] font-medium uppercase tracking-[0.3em]"
      style={{ ...mono, color: C.cyan }}
    >
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-2 text-[28px] leading-[1.05] sm:text-[36px]"
      style={{ ...serif, color: C.star, letterSpacing: "0.005em" }}
    >
      {children}
    </h1>
  );
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ color: m.color, background: `${m.color}14`, border: `1px solid ${m.color}44` }}
    >
      <Icon size={12.5} strokeWidth={2} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function Spark({ data, color = C.gold }: { data: number[]; color?: string }) {
  const w = 96;
  const h = 30;
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
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2" fill={color} />}
    </svg>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: GLOW,
        backdropFilter: "blur(6px)",
      }}
    >
      {children}
    </div>
  );
}

// Score als een ster met vaste stralen (helderheid ~ waarde).
function ScoreStar({ value, size = 48 }: { value: number; size?: number }) {
  const strong = value >= 90;
  const color = strong ? C.gold : C.cyan;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle, ${color}33, transparent 68%)` }}
      />
      <Star size={size * 0.9} strokeWidth={1} color={color} fill={`${color}22`} />
      <span className="absolute text-[13px] font-medium tabular-nums" style={{ ...mono, color }}>
        {value}
      </span>
    </span>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept74() {
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
      style={{
        ...mono,
        color: C.star,
        background: `radial-gradient(120% 90% at 50% 0%, ${C.skyAlt}, ${C.sky} 68%)`,
      }}
    >
      <style>{`@keyframes c74-twinkle{0%,100%{opacity:.25}50%{opacity:1}}`}</style>
      <StarField />
      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk */}
        <aside
          className="shrink-0 md:w-[244px]"
          style={{ borderRight: `1px solid ${C.line}`, background: "rgba(7,10,26,0.5)" }}
        >
          <div className="flex h-full flex-col">
            <div
              className="flex items-center gap-3 p-5"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <span
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ background: "rgba(240,214,138,0.1)", border: `1px solid ${C.gold}44` }}
                aria-hidden="true"
              >
                <Sparkles size={18} strokeWidth={1.8} color={C.gold} />
              </span>
              <div className="leading-tight">
                <div className="text-[19px]" style={{ ...serif, color: C.star }}>
                  Sterrenbeeld
                </div>
                <div
                  className="text-[9px] uppercase tracking-[0.22em]"
                  style={{ ...mono, color: C.faint }}
                >
                  ZZP · zorg
                </div>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto p-2 md:flex-1 md:flex-col"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="relative flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d68a] md:w-full"
                    style={{
                      color: on ? C.star : C.muted,
                      background: on ? "rgba(240,214,138,0.08)" : "transparent",
                      border: `1px solid ${on ? `${C.gold}33` : "transparent"}`,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{
                        background: on ? C.gold : C.faint,
                        boxShadow: on ? `0 0 6px ${C.gold}` : "none",
                      }}
                      aria-hidden="true"
                    />
                    {s.label}
                  </button>
                );
              })}
            </nav>

            <div
              className="hidden items-center gap-3 p-4 md:flex"
              style={{ borderTop: `1px solid ${C.lineSoft}`, background: "rgba(7,10,26,0.6)" }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                style={{ color: C.sky, background: C.cyan }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold" style={{ color: C.star }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[10.5px] font-medium"
                  style={{ color: C.cyan }}
                >
                  <ShieldCheck size={11} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
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
  onOpen: (id: string) => void;
  onGo: (k: ScreenKey) => void;
}) {
  const warn = ACTIES[0];
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Firmament</Kicker>
          <Title>Goedeavond, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-2 text-[11.5px] font-medium"
          style={{
            ...mono,
            color: C.cyan,
            background: "rgba(126,199,224,0.08)",
            border: `1px solid ${C.cyan}33`,
          }}
        >
          <Compass size={14} strokeWidth={1.8} aria-hidden="true" /> Heldere nacht
        </div>
      </header>

      {warn && (
        <div
          className="flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
          style={{
            border: `1px solid ${C.red}44`,
            background: "rgba(224,138,138,0.08)",
            boxShadow: GLOW,
          }}
          role="alert"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-full"
            style={{ background: "rgba(224,138,138,0.14)", border: `1px solid ${C.red}44` }}
          >
            <AlertTriangle size={18} strokeWidth={2} color={C.red} aria-hidden="true" />
          </span>
          <p className="text-[13px] leading-snug" style={{ color: C.star }}>
            <span style={{ ...serif, fontSize: "16px" }}>{warn.titel}.</span>{" "}
            <span style={{ color: C.muted }}>{warn.detail}</span>
          </p>
          <button
            onClick={() => onGo("verificatie")}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d68a]"
            style={{ color: C.sky, background: C.gold }}
          >
            {warn.cta} <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="flex flex-col justify-between p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-medium leading-tight" style={{ color: C.muted }}>
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums"
                style={{ ...mono, color: k.up ? C.cyan : C.red }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} strokeWidth={2.4} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} strokeWidth={2.4} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <p
              className="mt-3 text-[26px] tabular-nums leading-none"
              style={{ ...serif, color: C.star }}
            >
              {k.value}
            </p>
            <div className="mt-2">
              <Spark data={k.spark} color={k.up ? C.gold : C.red} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5">
          <Constellation opdrachten={OPDRACHTEN} onOpen={onOpen} />
          <Panel>
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <h3 className="text-[17px]" style={{ ...serif, color: C.star }}>
                Heldere matches
              </h3>
              <button
                onClick={() => onGo("marktplaats")}
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d68a]"
                style={{ color: C.cyan }}
              >
                Alles <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>
            {loading ? (
              <div className="space-y-3 p-4" role="status" aria-live="polite">
                <span className="sr-only">Matches worden geladen…</span>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl p-3"
                    style={{ background: "rgba(232,236,248,0.04)" }}
                  >
                    <span
                      className="h-11 w-11 animate-pulse rounded-full"
                      style={{ background: "rgba(232,236,248,0.08)" }}
                    />
                    <div className="flex-1 space-y-2">
                      <span
                        className="block h-3 w-2/3 animate-pulse rounded"
                        style={{ background: "rgba(232,236,248,0.08)" }}
                      />
                      <span
                        className="block h-2.5 w-1/2 animate-pulse rounded"
                        style={{ background: "rgba(232,236,248,0.08)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="p-2">
                {OPDRACHTEN.map((o) => (
                  <li key={o.id}>
                    <button
                      onClick={() => onOpen(o.id)}
                      className="flex w-full items-center gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-[rgba(232,236,248,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f0d68a]"
                    >
                      <ScoreStar value={o.match} />
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[14px] font-semibold"
                          style={{ color: C.star }}
                        >
                          {o.titel}
                        </span>
                        <span className="block truncate text-[11.5px]" style={{ color: C.muted }}>
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </span>
                      </span>
                      <ArrowUpRight size={16} strokeWidth={2} color={C.faint} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel>
            <div className="p-4" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
              <h3 className="text-[17px]" style={{ ...serif, color: C.star }}>
                Certificaten
              </h3>
            </div>
            <div className="p-2">
              {CREDENTIALS.map((c) => {
                const m = credMeta(c.status);
                const Icon = m.Icon;
                return (
                  <div key={c.naam} className="flex items-center gap-2.5 rounded-md px-2 py-2.5">
                    <Icon size={15} strokeWidth={1.8} color={m.color} aria-hidden="true" />
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px] font-medium"
                      style={{ color: C.star }}
                    >
                      {c.naam}
                    </span>
                    <span className="text-[10.5px] font-medium" style={{ color: m.color }}>
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel>
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <h3 className="text-[17px]" style={{ ...serif, color: C.star }}>
                Berichten
              </h3>
              <span
                className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                style={{ ...mono, color: C.gold, background: "rgba(240,214,138,0.12)" }}
              >
                {BERICHTEN.filter((b) => b.ongelezen).length} nieuw
              </span>
            </div>
            <div className="p-2">
              {BERICHTEN.slice(0, 2).map((b) => (
                <div key={b.van} className="flex items-center gap-3 rounded-md px-2 py-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                    style={{
                      color: C.star,
                      background: "rgba(232,236,248,0.06)",
                      border: `1px solid ${C.line}`,
                    }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold" style={{ color: C.star }}>
                      {b.van}
                    </p>
                    <p className="truncate text-[11px]" style={{ color: C.muted }}>
                      {b.preview}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
  const filtered = useMemo(
    () =>
      OPDRACHTEN.filter(
        (o) =>
          o.titel.toLowerCase().includes(q.toLowerCase()) ||
          o.plaats.toLowerCase().includes(q.toLowerCase()) ||
          o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
      ),
    [q],
  );
  const sel = filtered.find((o) => o.id === activeId) ?? filtered[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Kicker>Marktplaats</Kicker>
        <Title>Open opdrachten</Title>
      </div>

      <div
        className="flex items-center gap-3 rounded-full px-4 py-3"
        style={{ background: C.panel, border: `1px solid ${C.line}`, boxShadow: GLOW }}
      >
        <Search size={16} strokeWidth={1.8} color={C.cyan} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#5b6490]"
          style={{ color: C.star }}
        />
        <span className="shrink-0 text-[11.5px] tabular-nums" style={{ ...mono, color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Panel className="p-12 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "rgba(232,236,248,0.05)", border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Telescope size={24} strokeWidth={1.6} color={C.cyan} />
          </span>
          <p className="mt-4 text-[20px]" style={{ ...serif, color: C.star }}>
            Geen ster in beeld
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen opdracht past bij &quot;{q}&quot;. Verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d68a]"
            style={{ color: C.sky, background: C.gold }}
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
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className="w-full rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d68a]"
                  style={{
                    background: C.panel,
                    border: `1px solid ${on ? `${C.gold}66` : C.line}`,
                    boxShadow: GLOW,
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    <ScoreStar value={o.match} size={52} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[10px] tracking-[0.1em]"
                        style={{ ...mono, color: C.faint }}
                      >
                        <span className="uppercase">{o.id}</span>
                        {on && <span style={{ color: C.gold }}>· gericht</span>}
                      </div>
                      <p className="truncate text-[15px] font-semibold" style={{ color: C.star }}>
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={12} strokeWidth={1.8} aria-hidden="true" /> {o.opdrachtgever}{" "}
                        · {o.plaats} · {o.uren}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                            style={{
                              color: C.muted,
                              background: "rgba(232,236,248,0.05)",
                              border: `1px solid ${C.lineSoft}`,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <ul className="mt-2.5 space-y-1">
                        {o.redenen.plus.slice(0, 2).map((r) => (
                          <li
                            key={r}
                            className="flex items-center gap-1.5 text-[11.5px]"
                            style={{ color: C.cyan }}
                          >
                            <Check size={12} strokeWidth={2.2} aria-hidden="true" /> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <aside className="h-fit lg:sticky lg:top-4">
              <Panel>
                <div
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="text-[11px] tracking-[0.14em]"
                    style={{ ...mono, color: C.cyan }}
                  >
                    {sel.id}
                  </span>
                  <span
                    className="text-[10px] tracking-[0.14em]"
                    style={{ ...mono, color: C.faint }}
                  >
                    MAG {(sel.match / 20).toFixed(1)}
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-[18px] leading-snug" style={{ ...serif, color: C.star }}>
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
                        style={{ background: "rgba(232,236,248,0.04)" }}
                      >
                        <dt
                          className="text-[10px] uppercase tracking-[0.08em]"
                          style={{ ...mono, color: C.faint }}
                        >
                          {m.l}
                        </dt>
                        <dd className="mt-0.5 font-semibold tabular-nums" style={{ color: C.star }}>
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    onClick={() => onOpen(sel.id)}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d68a]"
                    style={{ color: C.sky, background: C.gold }}
                  >
                    Open opdracht <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
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
      <Panel>
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
                    color: C.muted,
                    background: "rgba(232,236,248,0.05)",
                    border: `1px solid ${C.lineSoft}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <ScoreStar value={opdracht.match} size={80} />
        </div>
        <div className="p-5 pt-0 sm:p-6 sm:pt-0">
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d68a] disabled:opacity-90"
            style={{ color: C.sky, background: state === "sent" ? C.cyan : C.gold }}
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
      </Panel>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Panel key={m.l} className="p-4">
            <p
              className="text-[10px] uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.faint }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[19px] tabular-nums" style={{ ...serif, color: C.star }}>
              {m.v}
            </p>
          </Panel>
        ))}
      </div>

      <Panel>
        <div
          className="flex items-center gap-2 p-4"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          <Sparkles size={16} strokeWidth={1.8} color={C.gold} aria-hidden="true" />
          <h3 className="text-[18px]" style={{ ...serif, color: C.star }}>
            Waarom deze constellatie klopt
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.1em]"
              style={{ color: C.cyan }}
            >
              <Check size={13} strokeWidth={3} aria-hidden="true" /> Heldere punten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.star }}
                >
                  <Check
                    size={15}
                    strokeWidth={2.4}
                    color={C.cyan}
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
              className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.1em]"
              style={{ color: C.red }}
            >
              <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" /> Nevelvlekken
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
                    strokeWidth={2.2}
                    color={C.red}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
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
    { l: "Geverifieerd", v: `${verified}/${total}`, color: C.cyan, Icon: ShieldCheck },
    { l: "Verloopt bijna", v: "1", color: C.red, Icon: AlertTriangle },
    { l: "In beoordeling", v: "1", color: C.gold, Icon: Clock },
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
            <Panel key={s.l} className="flex items-center justify-between p-4">
              <div>
                <p
                  className="text-[10.5px] uppercase tracking-[0.08em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {s.l}
                </p>
                <p className="mt-1.5 text-[26px] tabular-nums" style={{ ...serif, color: C.star }}>
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: `${s.color}1c`, border: `1px solid ${s.color}55` }}
              >
                <Icon size={20} strokeWidth={1.8} color={s.color} aria-hidden="true" />
              </span>
            </Panel>
          );
        })}
      </div>

      <Panel>
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{ background: `${m.color}18`, border: `1px solid ${m.color}55` }}
              >
                <Icon size={20} strokeWidth={1.8} color={m.color} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold" style={{ color: C.star }}>
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
          const color = warn ? C.red : C.gold;
          return (
            <Panel key={a.titel} className="flex items-stretch overflow-hidden">
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-2"
                style={{ background: `${color}14`, borderRight: `1px solid ${color}33` }}
              >
                <span className="text-[16px] tabular-nums" style={{ ...mono, color }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {warn ? (
                  <AlertTriangle size={15} strokeWidth={2.2} color={color} aria-hidden="true" />
                ) : (
                  <Star size={15} strokeWidth={1.8} color={color} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10.5px] font-medium uppercase tracking-[0.1em]"
                  style={{ color }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-1 text-[14.5px] font-semibold" style={{ color: C.star }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className="m-3 shrink-0 self-center rounded-full px-4 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d68a]"
                style={{
                  color: warn ? C.sky : C.star,
                  background: warn ? C.gold : "rgba(232,236,248,0.06)",
                  border: warn ? "none" : `1px solid ${C.line}`,
                }}
              >
                {a.cta}
              </button>
            </Panel>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 rounded-2xl p-4"
        style={{ background: "rgba(126,199,224,0.08)", border: `1px solid ${C.cyan}33` }}
      >
        <Check size={18} strokeWidth={2.2} color={C.cyan} aria-hidden="true" />
        <p className="text-[12.5px]" style={{ color: C.muted }}>
          Verder is alles bijgewerkt. Nieuwe acties verschijnen hier vanzelf aan de horizon.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  // Één ERROR-state zichtbaar: de synchronisatie met de boekhouding faalde deterministisch.
  const [retry, setRetry] = useState(false);
  const statusColor: Record<string, string> = {
    Betaald: C.cyan,
    Openstaand: C.red,
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
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d68a]"
          style={{ color: C.sky, background: C.gold }}
        >
          <Plus size={14} strokeWidth={2.4} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      {!retry && (
        <div
          className="flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
          style={{ background: "rgba(224,138,138,0.08)", border: `1px solid ${C.red}44` }}
          role="alert"
        >
          <XCircle size={18} strokeWidth={2} color={C.red} aria-hidden="true" />
          <p className="text-[12.5px]" style={{ color: C.star }}>
            Synchronisatie met je boekhouding is onderbroken. Bedragen kunnen verouderd zijn.
          </p>
          <button
            onClick={() => setRetry(true)}
            className="ml-auto shrink-0 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d68a]"
            style={{ color: C.sky, background: C.red }}
          >
            Opnieuw proberen
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5">
        <Panel className="p-5">
          <p
            className="text-[10.5px] uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.faint }}
          >
            Ontvangen
          </p>
          <p className="mt-2 text-[24px] tabular-nums" style={{ ...serif, color: C.cyan }}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Panel>
        <Panel className="p-5">
          <p
            className="text-[10.5px] uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.faint }}
          >
            Openstaand
          </p>
          <p className="mt-2 text-[24px] tabular-nums" style={{ ...serif, color: C.red }}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </Panel>
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10.5px] uppercase tracking-[0.08em]"
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
                    className="p-4 text-[12px] font-medium tabular-nums"
                    style={{ ...mono, color: C.star }}
                  >
                    {f.nr}
                  </td>
                  <td className="p-4 text-[13px] font-medium" style={{ color: C.star }}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden p-4 text-[12px] tabular-nums sm:table-cell"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-4 text-right text-[14px] tabular-nums"
                    style={{ ...serif, color: C.star }}
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
                      <span className="text-[11.5px] font-medium" style={{ color }}>
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
    </div>
  );
}
