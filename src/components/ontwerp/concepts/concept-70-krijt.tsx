"use client";

// Concept 70 — "Krijt" · schoolbord / chalkboard.
// Diep leisteen-groen-zwart bord met krijt-textuur (subtiele stof/ruis), krijt-witte en pastel-krijt
// handgeschreven-aandoende koppen (serif-italic + lichte transform), met-de-hand-getekende
// krijt-diagrammen/pijlen/onderstrepingen (SVG met licht onregelmatige, vaste paden) en gewiste
// vegen als subtiele achtergrond. Warm en menselijk-onderwijzend, de data crisp en leesbaar.
// Onderscheidend van E-ink (papierwit) en Terminal (phosphor): dit is een groen schoolbord met krijt.
// Palet: bord #1f2b26 / #223029, krijt-wit #eef1e8, muted #a7b3a6, accent #f2d06b + #e8877a + #8ec5b6.
// Fonts: --font-lab-newsreader (kop, italic) + --font-lab-space (body). Deterministisch — geen random.

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
  Inbox,
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
  board: "#1f2b26",
  boardAlt: "#223029",
  panel: "#26332d",
  chalk: "#eef1e8",
  muted: "#a7b3a6",
  faint: "#7f8d80",
  yellow: "#f2d06b",
  pink: "#e8877a",
  teal: "#8ec5b6",
  line: "rgba(238,241,232,0.16)",
  lineSoft: "rgba(238,241,232,0.09)",
};

const chalkHand = { fontFamily: "var(--font-lab-newsreader)", fontStyle: "italic" as const };
const body = { fontFamily: "var(--font-lab-space)" };

// Zachte krijt-stof randglow op een paneel.
const DUST = "inset 0 0 0 1px rgba(238,241,232,0.05), 0 10px 30px -20px rgba(0,0,0,0.6)";

/* ---------- Krijt-textuur (deterministisch, geen random) ---------- */

// Subtiele stof/ruis + gewiste vegen als vaste achtergrondlaag over het hele bord.
function ChalkTexture() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="krijt-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed="7"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <radialGradient id="krijt-veeg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(238,241,232,0.05)" />
          <stop offset="100%" stopColor="rgba(238,241,232,0)" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" filter="url(#krijt-noise)" opacity="0.05" />
      <ellipse
        cx="78%"
        cy="16%"
        rx="220"
        ry="70"
        fill="url(#krijt-veeg)"
        transform="rotate(-8 0 0)"
      />
      <ellipse
        cx="20%"
        cy="72%"
        rx="260"
        ry="80"
        fill="url(#krijt-veeg)"
        transform="rotate(6 0 0)"
      />
    </svg>
  );
}

// Met-de-hand-getekende onderstreping: één vaste, licht-onregelmatige krijtstreek.
function ChalkUnderline({ color = C.yellow, w = 180 }: { color?: string; w?: number }) {
  return (
    <svg width={w} height="10" viewBox="0 0 180 10" aria-hidden="true" className="mt-1 max-w-full">
      <path
        d="M2 6 C 30 3, 54 8, 82 5 S 132 3, 160 6 S 172 5, 178 4"
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

// Met-de-hand-getekende ovaal-cirkel rond een cijfer (score-markering).
function ChalkRing({ color = C.yellow }: { color?: string }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        d="M24 4 C 38 3, 45 13, 44 24 C 45 36, 36 45, 24 44 C 11 45, 3 35, 4 24 C 3 12, 12 4, 24 4"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

// Met-de-hand-getekende pijl (krijt).
function ChalkArrow({ color = C.chalk }: { color?: string }) {
  return (
    <svg width="26" height="14" viewBox="0 0 26 14" aria-hidden="true">
      <path
        d="M2 7 C 8 6, 15 8, 22 7"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M17 3 L23 7 L17 11"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.teal, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.yellow, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", color: C.pink, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.pink, Icon: XCircle };
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
      className="text-[10.5px] font-semibold uppercase tracking-[0.26em]"
      style={{ ...body, color: C.teal }}
    >
      {children}
    </span>
  );
}

function Title({
  children,
  underline = C.yellow,
}: {
  children: React.ReactNode;
  underline?: string;
}) {
  return (
    <div className="mt-1.5">
      <h1
        className="text-[27px] leading-[1.05] tracking-[0.005em] sm:text-[35px]"
        style={{
          ...chalkHand,
          color: C.chalk,
          transform: "rotate(-0.6deg)",
          transformOrigin: "left",
        }}
      >
        {children}
      </h1>
      <ChalkUnderline color={underline} />
    </div>
  );
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold"
      style={{
        ...body,
        color: m.color,
        background: "rgba(0,0,0,0.25)",
        border: `1px dashed ${m.color}66`,
      }}
    >
      <Icon size={13} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Krijt-sparkline: krijterige (licht-onregelmatige) lijn.
function Spark({ data, color = C.yellow }: { data: number[]; color?: string }) {
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
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <circle cx={pts[pts.length - 1]![0]} cy={pts[pts.length - 1]![1]} r="2.4" fill={color} />
    </svg>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}`, boxShadow: DUST }}
    >
      {children}
    </div>
  );
}

// Score-schijf met met-de-hand-getekende krijtring.
function ScoreCoin({ value, size = 48 }: { value: number; size?: number }) {
  const strong = value >= 90;
  const color = strong ? C.yellow : C.teal;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <ChalkRing color={color} />
      <span className="text-[14px] font-semibold tabular-nums" style={{ ...body, color }}>
        {value}
      </span>
    </span>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept70() {
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
        ...body,
        color: C.chalk,
        background: `radial-gradient(130% 100% at 50% 0%, ${C.boardAlt}, ${C.board} 70%)`,
      }}
    >
      <ChalkTexture />
      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk — krijtbord-lijst met houten lijst-rand rechts */}
        <aside
          className="shrink-0 md:w-[240px]"
          style={{ borderRight: `1px solid ${C.line}`, background: "rgba(0,0,0,0.14)" }}
        >
          <div className="flex h-full flex-col">
            <div
              className="flex items-center gap-3 p-5"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "rgba(0,0,0,0.28)", border: `1px dashed ${C.line}` }}
                aria-hidden="true"
              >
                <span className="text-[17px]" style={{ ...chalkHand, color: C.yellow }}>
                  K
                </span>
              </span>
              <div className="leading-tight">
                <div className="text-[18px]" style={{ ...chalkHand, color: C.chalk }}>
                  Krijt
                </div>
                <div
                  className="text-[9.5px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: C.faint }}
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
                    className="relative flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-[13.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d06b] md:w-full"
                    style={{
                      color: on ? C.chalk : C.muted,
                      background: on ? "rgba(0,0,0,0.24)" : "transparent",
                    }}
                  >
                    {on && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: C.yellow }}
                        aria-hidden="true"
                      />
                    )}
                    <span style={on ? { ...chalkHand, fontSize: "15px" } : undefined}>
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div
              className="hidden items-center gap-3 p-4 md:flex"
              style={{ borderTop: `1px solid ${C.lineSoft}`, background: "rgba(0,0,0,0.16)" }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
                style={{ color: C.board, background: C.teal }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold" style={{ color: C.chalk }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[10.5px] font-semibold"
                  style={{ color: C.teal }}
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
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Op het bord</Kicker>
          <Title>Goedemorgen, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-2 text-[13.5px]" style={{ color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-[12px] font-semibold"
          style={{ color: C.teal, background: "rgba(0,0,0,0.2)", border: `1px dashed ${C.line}` }}
        >
          <Star size={14} strokeWidth={2.2} aria-hidden="true" /> Les van vandaag
        </div>
      </header>

      {warn && (
        <div
          className="flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center"
          style={{
            border: `1px dashed ${C.pink}66`,
            background: "rgba(232,135,122,0.1)",
            boxShadow: DUST,
          }}
          role="alert"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-lg"
            style={{ background: "rgba(0,0,0,0.28)", border: `1px dashed ${C.pink}66` }}
          >
            <AlertTriangle size={18} strokeWidth={2.2} color={C.pink} aria-hidden="true" />
          </span>
          <p className="text-[13px] leading-snug" style={{ color: C.chalk }}>
            <span style={{ ...chalkHand, fontSize: "15px" }}>{warn.titel}.</span>{" "}
            <span style={{ color: C.muted }}>{warn.detail}</span>
          </p>
          <button
            onClick={() => onGo("verificatie")}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d06b]"
            style={{ color: C.board, background: C.yellow }}
          >
            {warn.cta} <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="flex flex-col justify-between p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-semibold leading-tight" style={{ color: C.muted }}>
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                style={{ color: k.up ? C.teal : C.pink }}
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
              className="mt-3 text-[26px] tabular-nums leading-none"
              style={{ ...chalkHand, color: C.chalk }}
            >
              {k.value}
            </p>
            <div className="mt-2">
              <Spark data={k.spark} color={k.up ? C.yellow : C.pink} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div
            className="flex items-center justify-between p-4"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <h3 className="text-[17px]" style={{ ...chalkHand, color: C.chalk }}>
              Beste matches
            </h3>
            <button
              onClick={() => onGo("marktplaats")}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d06b]"
              style={{ color: C.teal }}
            >
              Alles <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3 p-4" role="status" aria-live="polite">
              <span className="sr-only">Matches worden geladen…</span>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg p-3"
                  style={{ background: "rgba(0,0,0,0.2)" }}
                >
                  <span
                    className="h-11 w-11 animate-pulse rounded-full"
                    style={{ background: "rgba(238,241,232,0.08)" }}
                  />
                  <div className="flex-1 space-y-2">
                    <span
                      className="block h-3 w-2/3 animate-pulse rounded"
                      style={{ background: "rgba(238,241,232,0.08)" }}
                    />
                    <span
                      className="block h-2.5 w-1/2 animate-pulse rounded"
                      style={{ background: "rgba(238,241,232,0.08)" }}
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
                    className="flex w-full items-center gap-3.5 rounded-lg p-3 text-left transition-colors hover:bg-[rgba(0,0,0,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f2d06b]"
                  >
                    <ScoreCoin value={o.match} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14px] font-semibold"
                        style={{ color: C.chalk }}
                      >
                        {o.titel}
                      </span>
                      <span className="block truncate text-[11.5px]" style={{ color: C.muted }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <ArrowUpRight size={16} strokeWidth={2.2} color={C.faint} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-5">
          <Panel>
            <div className="p-4" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
              <h3 className="text-[17px]" style={{ ...chalkHand, color: C.chalk }}>
                Certificaten
              </h3>
            </div>
            <div className="p-2">
              {CREDENTIALS.map((c) => {
                const m = credMeta(c.status);
                const Icon = m.Icon;
                return (
                  <div key={c.naam} className="flex items-center gap-2.5 rounded-md px-2 py-2.5">
                    <Icon size={15} strokeWidth={2.2} color={m.color} aria-hidden="true" />
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px] font-medium"
                      style={{ color: C.chalk }}
                    >
                      {c.naam}
                    </span>
                    <span className="text-[10.5px] font-semibold" style={{ color: m.color }}>
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
              <h3
                className="flex items-center gap-2 text-[17px]"
                style={{ ...chalkHand, color: C.chalk }}
              >
                <Inbox size={16} strokeWidth={2} color={C.teal} aria-hidden="true" /> Berichten
              </h3>
              <span
                className="rounded-md px-2 py-0.5 text-[10.5px] font-semibold"
                style={{ color: C.yellow, background: "rgba(242,208,107,0.14)" }}
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
                      color: C.chalk,
                      background: "rgba(0,0,0,0.24)",
                      border: `1px dashed ${C.line}`,
                    }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold" style={{ color: C.chalk }}>
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
        <Title underline={C.teal}>Open opdrachten</Title>
      </div>

      <div
        className="flex items-center gap-3 rounded-lg px-4 py-3"
        style={{ background: C.panel, border: `1px solid ${C.line}`, boxShadow: DUST }}
      >
        <Search size={16} strokeWidth={2.2} color={C.teal} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#7f8d80]"
          style={{ color: C.chalk }}
        />
        <span
          className="shrink-0 text-[11.5px] font-semibold tabular-nums"
          style={{ color: C.faint }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Panel className="p-12 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "rgba(0,0,0,0.24)", border: `1px dashed ${C.line}` }}
            aria-hidden="true"
          >
            <Search size={24} strokeWidth={2} color={C.teal} />
          </span>
          <p className="mt-4 text-[20px]" style={{ ...chalkHand, color: C.chalk }}>
            Niets gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen opdracht past bij &quot;{q}&quot;. Verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 rounded-lg px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d06b]"
            style={{ color: C.board, background: C.yellow }}
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
                  className="w-full rounded-xl p-4 text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d06b]"
                  style={{
                    background: C.panel,
                    border: `1px ${on ? "dashed" : "solid"} ${on ? `${C.yellow}88` : C.line}`,
                    boxShadow: DUST,
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    <ScoreCoin value={o.match} size={52} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[10.5px] font-semibold"
                        style={{ color: C.faint }}
                      >
                        <span className="uppercase tracking-[0.12em]">{o.id}</span>
                        {on && <span style={{ color: C.yellow }}>· geselecteerd</span>}
                      </div>
                      <p className="truncate text-[15px] font-semibold" style={{ color: C.chalk }}>
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={12} strokeWidth={2.2} aria-hidden="true" /> {o.opdrachtgever}{" "}
                        · {o.plaats} · {o.uren}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-md px-2 py-0.5 text-[10.5px] font-medium"
                            style={{
                              color: C.muted,
                              background: "rgba(0,0,0,0.24)",
                              border: `1px dashed ${C.lineSoft}`,
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
              <Panel>
                <div
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: C.teal }}
                  >
                    {sel.id}
                  </span>
                  <ChalkArrow color={C.yellow} />
                </div>
                <div className="p-4">
                  <p className="text-[18px] leading-snug" style={{ ...chalkHand, color: C.chalk }}>
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
                        className="rounded-lg p-2.5"
                        style={{ background: "rgba(0,0,0,0.22)" }}
                      >
                        <dt
                          className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                          style={{ color: C.faint }}
                        >
                          {m.l}
                        </dt>
                        <dd
                          className="mt-0.5 font-semibold tabular-nums"
                          style={{ color: C.chalk }}
                        >
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    onClick={() => onOpen(sel.id)}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d06b]"
                    style={{ color: C.board, background: C.yellow }}
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
                  className="rounded-md px-2.5 py-0.5 text-[11px] font-medium"
                  style={{
                    color: C.muted,
                    background: "rgba(0,0,0,0.24)",
                    border: `1px dashed ${C.lineSoft}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <span
            className="relative flex h-20 w-20 shrink-0 flex-col items-center justify-center"
            aria-hidden="true"
          >
            <ChalkRing color={opdracht.match >= 90 ? C.yellow : C.teal} />
            <span
              className="text-[28px] tabular-nums leading-none"
              style={{ ...chalkHand, color: opdracht.match >= 90 ? C.yellow : C.teal }}
            >
              {opdracht.match}
            </span>
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.muted }}
            >
              match
            </span>
          </span>
        </div>
        <div className="p-5 pt-0 sm:p-6 sm:pt-0">
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d06b] disabled:opacity-90"
            style={{ color: C.board, background: state === "sent" ? C.teal : C.yellow }}
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

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Panel key={m.l} className="p-4">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[19px] tabular-nums" style={{ ...chalkHand, color: C.chalk }}>
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
          <ChalkArrow color={C.yellow} />
          <h3 className="text-[18px]" style={{ ...chalkHand, color: C.chalk }}>
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.teal }}
            >
              <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.chalk }}
                >
                  <Check
                    size={15}
                    strokeWidth={2.6}
                    color={C.teal}
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
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.pink }}
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
                    color={C.pink}
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
    { l: "Geverifieerd", v: `${verified}/${total}`, color: C.teal, Icon: ShieldCheck },
    { l: "Verloopt bijna", v: "1", color: C.pink, Icon: AlertTriangle },
    { l: "In beoordeling", v: "1", color: C.yellow, Icon: Clock },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker>Verificatie</Kicker>
        <Title underline={C.teal}>Certificaten</Title>
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
                  className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: C.faint }}
                >
                  {s.l}
                </p>
                <p
                  className="mt-1.5 text-[26px] tabular-nums"
                  style={{ ...chalkHand, color: C.chalk }}
                >
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: `${s.color}1c`, border: `1px dashed ${s.color}55` }}
              >
                <Icon size={20} strokeWidth={2} color={s.color} aria-hidden="true" />
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${m.color}18`, border: `1px dashed ${m.color}55` }}
              >
                <Icon size={20} strokeWidth={2} color={m.color} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold" style={{ color: C.chalk }}>
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
          const color = warn ? C.pink : C.yellow;
          return (
            <Panel key={a.titel} className="flex items-stretch overflow-hidden">
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-2"
                style={{ background: `${color}16`, borderRight: `1px dashed ${color}44` }}
              >
                <span className="text-[18px] tabular-nums" style={{ ...chalkHand, color }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {warn ? (
                  <AlertTriangle size={15} strokeWidth={2.4} color={color} aria-hidden="true" />
                ) : (
                  <Star size={15} strokeWidth={2.2} color={color} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-1 text-[14.5px] font-semibold" style={{ color: C.chalk }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className="m-3 shrink-0 self-center rounded-lg px-4 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d06b]"
                style={{
                  color: warn ? C.board : C.chalk,
                  background: warn ? C.yellow : "rgba(0,0,0,0.24)",
                  border: warn ? "none" : `1px dashed ${C.line}`,
                }}
              >
                {a.cta}
              </button>
            </Panel>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 rounded-xl p-4"
        style={{ background: "rgba(142,197,182,0.1)", border: `1px dashed ${C.teal}44` }}
      >
        <Check size={18} strokeWidth={2.4} color={C.teal} aria-hidden="true" />
        <p className="text-[12.5px]" style={{ color: C.muted }}>
          Verder is alles bijgewerkt. Nieuwe acties verschijnen hier vanzelf.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusColor: Record<string, string> = {
    Betaald: C.teal,
    Openstaand: C.pink,
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
          className="inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d06b]"
          style={{ color: C.board, background: C.yellow }}
        >
          <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Panel className="p-5">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: C.faint }}
          >
            Ontvangen
          </p>
          <p className="mt-2 text-[24px] tabular-nums" style={{ ...chalkHand, color: C.teal }}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Panel>
        <Panel className="p-5">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: C.faint }}
          >
            Openstaand
          </p>
          <p className="mt-2 text-[24px] tabular-nums" style={{ ...chalkHand, color: C.pink }}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </Panel>
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
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
                    className="p-4 text-[12px] font-semibold tabular-nums"
                    style={{ color: C.chalk }}
                  >
                    {f.nr}
                  </td>
                  <td className="p-4 text-[13px] font-medium" style={{ color: C.chalk }}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden p-4 text-[12px] tabular-nums sm:table-cell"
                    style={{ color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-4 text-right text-[14px] tabular-nums"
                    style={{ ...chalkHand, color: C.chalk }}
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
      </Panel>
    </div>
  );
}
