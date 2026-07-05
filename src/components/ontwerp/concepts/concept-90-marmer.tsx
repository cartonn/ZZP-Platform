"use client";

// Concept 90 — "Marmer" · klassiek geaderd Carrara-marmer, quiet luxury & erfgoed.
// Licht steen-vlak (#f4f2ee) met deterministische adering (SVG bezier, geen random), klassieke
// serif-KAPITALEN (Fraunces) en één dunne GOUD-hairline (#9a7b3f). Plint-achtige rust: veel witruimte,
// messcherpe data op het steen. Erfgoed-bankgevoel — "dit dossier is in veilige, gewichtige handen".
// Ingetogen goud, symmetrisch, geaderd — nadrukkelijk géén speelse terrazzo.
// Fonts: --font-lab-fraunces (serif display, tracking/kapitalen) + --font-lab-manrope (body).

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
  Landmark,
  Gem,
  ScrollText,
  RotateCw,
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

void NAV;
void DOCUMENTEN;

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#f4f2ee",
  stone: "#fbfaf7",
  stoneAlt: "#efece4",
  ink: "#232019",
  gold: "#9a7b3f",
  goldSoft: "#b89b64",
  muted: "#6b6459",
  faint: "#9a917f",
  warn: "#a9741f",
  alert: "#a23a2e",
  slate: "#4a5a6b",
  line: "rgba(154,123,63,0.30)",
  lineSoft: "rgba(35,32,25,0.09)",
  vein: "rgba(35,32,25,0.10)",
  veinGold: "rgba(154,123,63,0.22)",
};

const serif = { fontFamily: "var(--font-lab-fraunces)" };
const body = { fontFamily: "var(--font-lab-manrope)" };

const SHADOW = "0 1px 0 rgba(255,255,255,0.7) inset, 0 18px 44px -34px rgba(35,32,25,0.5)";
const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a7b3f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f2ee]";

/* ---------- Marmer-adering (deterministisch) ---------- */

// Eén dwalende ader: zachte cubic-bezier, gestuurd door sinus — geen willekeur.
function veinPath(seed: number, x0: number, w: number, h: number, steps = 6): string {
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const y = (i / steps) * h;
    const x =
      x0 + Math.sin(i * 0.85 + seed * 1.7) * w * 0.11 + Math.cos(i * 1.4 + seed * 0.9) * w * 0.06;
    pts.push([x, y]);
  }
  let d = `M${pts[0]![0].toFixed(1)} ${pts[0]![1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1]!;
    const p1 = pts[i]!;
    const my = (p0[1] + p1[1]) / 2;
    d += ` C${p0[0].toFixed(1)} ${my.toFixed(1)} ${p1[0].toFixed(1)} ${my.toFixed(1)} ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`;
  }
  return d;
}

function MarbleVeins({ className = "" }: { className?: string }) {
  // Symmetrisch verdeelde aders + een enkele goudader; klassiek en ingetogen.
  const veins = [
    { seed: 0.3, x0: 30, w: 60, gold: false },
    { seed: 1.6, x0: 90, w: 70, gold: false },
    { seed: 2.9, x0: 150, w: 60, gold: true },
    { seed: 4.1, x0: 210, w: 70, gold: false },
    { seed: 5.3, x0: 270, w: 60, gold: false },
  ];
  return (
    <svg
      viewBox="0 0 300 200"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      {veins.map((v) => (
        <path
          key={v.seed}
          d={veinPath(v.seed, v.x0, v.w, 200)}
          fill="none"
          stroke={v.gold ? C.veinGold : C.vein}
          strokeWidth={v.gold ? 1.1 : 0.8}
          strokeLinecap="round"
        />
      ))}
      {/* Fijne haarscheurtjes voor steen-textuur */}
      {veins.map((v) => (
        <path
          key={`hair-${v.seed}`}
          d={veinPath(v.seed + 0.6, v.x0 + 14, v.w * 0.5, 200)}
          fill="none"
          stroke={C.lineSoft}
          strokeWidth={0.5}
        />
      ))}
    </svg>
  );
}

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Bekrachtigd", color: C.gold, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In behandeling", color: C.slate, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", color: C.warn, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.alert, Icon: XCircle };
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
      className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.34em]"
      style={{ ...body, color: C.gold }}
    >
      <span className="h-px w-5" style={{ background: C.gold }} aria-hidden="true" />
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-2 text-[26px] uppercase leading-[1.05] tracking-[0.02em] sm:text-[32px]"
      style={{ ...serif, color: C.ink, fontWeight: 500 }}
    >
      {children}
    </h1>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{ background: C.stone, border: `1px solid ${C.line}`, boxShadow: SHADOW }}
    >
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
      style={{
        ...body,
        color: m.color,
        background: `${m.color}12`,
        border: `1px solid ${m.color}44`,
      }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Ingetogen goud-sparkline op het steen.
function Spark({ data, color = C.gold }: { data: number[]; color?: string }) {
  const w = 96;
  const h = 28;
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
      />
      {last && <circle cx={last[0]} cy={last[1]} r="1.9" fill={color} />}
    </svg>
  );
}

// Match-uitlezing: gouden ring om een geëngraveerd cijfer.
function ScoreSeal({ value, size = 48 }: { value: number; size?: number }) {
  const r = size / 2 - 3;
  const circ = 2 * Math.PI * r;
  const strong = value >= 90;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.lineSoft} strokeWidth="2" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strong ? C.gold : C.goldSoft}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span className="text-[13px] font-semibold tabular-nums" style={{ ...serif, color: C.ink }}>
        {value}
      </span>
    </span>
  );
}

/* ---------- Colonnade (het handtekening-element) ---------- */

// Klassieke marmeren colonnade: elke zuil = een match; hoogte codeert het percentage.
function Colonnade({ onSelect, activeId }: { onSelect: (id: string) => void; activeId?: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-md"
      style={{ background: C.stoneAlt, border: `1px solid ${C.line}` }}
    >
      <MarbleVeins className="pointer-events-none absolute inset-0 h-full w-full opacity-70" />
      <div className="relative flex items-end justify-center gap-4 px-5 pb-0 pt-8 sm:gap-8">
        {OPDRACHTEN.map((o) => {
          const on = activeId === o.id;
          const height = 84 + (o.match / 100) * 120; // hoogte ∝ match
          return (
            <button
              key={o.id}
              onClick={() => onSelect(o.id)}
              aria-label={`${o.titel} — match ${o.match}%`}
              aria-pressed={on}
              className={`group flex flex-col items-center ${RING}`}
            >
              <span
                className="mb-2 text-[13px] font-semibold tabular-nums"
                style={{ ...serif, color: on ? C.gold : C.ink }}
              >
                {o.match}%
              </span>
              <span
                className="relative flex w-12 items-start justify-center rounded-t-sm transition-all sm:w-16"
                style={{
                  height,
                  background: on
                    ? "linear-gradient(180deg, #fbfaf7, #efece4)"
                    : "linear-gradient(180deg, #f7f5f0, #e9e5db)",
                  borderTop: `2px solid ${on ? C.gold : C.goldSoft}`,
                  borderLeft: `1px solid ${C.line}`,
                  borderRight: `1px solid ${C.line}`,
                  boxShadow: on ? `0 -8px 24px -14px ${C.gold}` : "none",
                }}
              >
                {/* Cannelures: fijne verticale groeven */}
                <span
                  className="absolute inset-0 rounded-t-sm opacity-60"
                  aria-hidden="true"
                  style={{
                    background:
                      "repeating-linear-gradient(90deg, rgba(35,32,25,0.06) 0, rgba(35,32,25,0.06) 1px, transparent 1px, transparent 7px)",
                  }}
                />
                <span
                  className="mt-2 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...body, color: C.muted }}
                >
                  {o.plaats}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {/* Plint / stylobaat */}
      <div
        className="relative mt-0 h-4 w-full"
        style={{
          background: "linear-gradient(180deg, #e6e1d6, #d9d3c6)",
          borderTop: `1px solid ${C.gold}`,
        }}
        aria-hidden="true"
      />
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept90() {
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
      {/* Subtiele volvlaks-adering, ingetogen */}
      <MarbleVeins className="pointer-events-none absolute inset-0 h-full w-full opacity-40" />

      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk */}
        <aside
          className="shrink-0 md:w-[244px]"
          style={{ borderRight: `1px solid ${C.line}`, background: "rgba(251,250,247,0.72)" }}
        >
          <div className="flex h-full flex-col">
            <div
              className="flex items-center gap-3 p-5"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                style={{ background: C.stone, border: `1px solid ${C.gold}` }}
                aria-hidden="true"
              >
                <Landmark size={19} strokeWidth={1.8} color={C.gold} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[16px] uppercase tracking-[0.14em]"
                  style={{ ...serif, color: C.ink, fontWeight: 500 }}
                >
                  Marmer
                </div>
                <div
                  className="text-[9px] font-semibold uppercase tracking-[0.24em]"
                  style={{ color: C.faint }}
                >
                  ZZP · dossier
                </div>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto p-2.5 md:flex-1 md:flex-col"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className={`relative flex shrink-0 items-center gap-2.5 rounded-md px-3.5 py-2.5 text-left text-[12.5px] font-medium uppercase tracking-[0.06em] transition-colors md:w-full ${RING}`}
                    style={{
                      color: on ? C.ink : C.muted,
                      background: on ? "rgba(154,123,63,0.08)" : "transparent",
                      borderLeft: on ? `2px solid ${C.gold}` : "2px solid transparent",
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </nav>

            <div
              className="hidden items-center gap-3 p-4 md:flex"
              style={{ borderTop: `1px solid ${C.line}`, background: "rgba(239,236,228,0.6)" }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                style={{ ...serif, color: C.stone, background: C.gold }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold" style={{ color: C.ink }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[10px] font-semibold"
                  style={{ color: C.gold }}
                >
                  <ShieldCheck size={11} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5 sm:p-8">
            {screen === "dashboard" && (
              <Dashboard
                onOpen={open}
                onGo={setScreen}
                activeId={activeId}
                onSelect={setActiveId}
              />
            )}
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
  activeId,
  onSelect,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const warn = ACTIES[0];
  const [feed, setFeed] = useState<"loading" | "error" | "ok">("loading");
  useEffect(() => {
    const t = window.setTimeout(() => setFeed("error"), 700);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Dossier geopend</Kicker>
          <Title>Goedemorgen, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-sm px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: C.gold, background: C.stone, border: `1px solid ${C.line}` }}
        >
          <Gem size={13} strokeWidth={2} aria-hidden="true" /> {OPDRACHTEN.length} matches
        </div>
      </header>

      {warn && (
        <div
          className="flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center"
          style={{ border: `1px solid ${C.warn}55`, background: `${C.warn}10`, boxShadow: SHADOW }}
          role="alert"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-md"
            style={{ background: C.stone, border: `1px solid ${C.warn}55` }}
          >
            <AlertTriangle size={18} strokeWidth={2} color={C.warn} aria-hidden="true" />
          </span>
          <p className="text-[13px] leading-snug" style={{ color: C.ink }}>
            <span className="font-semibold">{warn.titel}.</span>{" "}
            <span style={{ color: C.muted }}>{warn.detail}</span>
          </p>
          <button
            onClick={() => onGo("verificatie")}
            className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-sm px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors ${RING}`}
            style={{ color: C.stone, background: C.warn }}
          >
            {warn.cta} <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="flex flex-col justify-between p-4">
            <div className="flex items-start justify-between gap-2">
              <p
                className="text-[10px] font-semibold uppercase leading-tight tracking-[0.1em]"
                style={{ color: C.muted }}
              >
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                style={{ color: k.up ? C.gold : C.warn }}
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
              className="mt-3 text-[24px] tabular-nums leading-none"
              style={{ ...serif, color: C.ink }}
            >
              {k.value}
            </p>
            <div className="mt-2">
              <Spark data={k.spark} color={k.up ? C.gold : C.warn} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.05fr]">
        {/* Colonnade */}
        <Panel className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3
              className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.ink }}
            >
              <Landmark size={16} strokeWidth={1.8} color={C.gold} aria-hidden="true" /> De matches
            </h3>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.faint }}
            >
              hoogte = match
            </span>
          </div>
          <Colonnade activeId={activeId} onSelect={onSelect} />
          <p className="mt-3 text-center text-[11px]" style={{ color: C.muted }}>
            Elke zuil is een match; de hoogte toont de sterkte. Kies een zuil om te openen.
          </p>
        </Panel>

        <div className="space-y-5">
          {/* Beste matches lijst */}
          <Panel>
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <h3
                className="text-[13px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.ink }}
              >
                Matches
              </h3>
              <button
                onClick={() => onGo("marktplaats")}
                className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors ${RING}`}
                style={{ color: C.gold }}
              >
                Alles <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>
            <ul className="p-2">
              {OPDRACHTEN.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => onOpen(o.id)}
                    className={`flex w-full items-center gap-3 rounded-md p-3 text-left transition-colors hover:bg-[rgba(154,123,63,0.06)] focus-visible:ring-inset ${RING}`}
                  >
                    <ScoreSeal value={o.match} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {o.titel}
                      </span>
                      <span className="block truncate text-[11px]" style={{ color: C.muted }}>
                        {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <ArrowUpRight size={15} strokeWidth={2} color={C.faint} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          {/* Live feed — loading + error-state */}
          <Panel className="p-4">
            <h3
              className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.ink }}
            >
              <ScrollText size={14} strokeWidth={2} color={C.gold} aria-hidden="true" /> Register
            </h3>
            {feed === "loading" && (
              <div className="mt-3 space-y-2" role="status" aria-live="polite">
                <span className="sr-only">Register wordt geladen…</span>
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className="block h-3 animate-pulse rounded-sm"
                    style={{ background: "rgba(35,32,25,0.07)", width: i === 0 ? "80%" : "60%" }}
                  />
                ))}
              </div>
            )}
            {feed === "error" && (
              <div
                className="mt-3 flex flex-col gap-2 rounded-md p-3 sm:flex-row sm:items-center"
                style={{ background: `${C.alert}0f`, border: `1px solid ${C.alert}44` }}
                role="alert"
              >
                <XCircle size={16} strokeWidth={2} color={C.alert} aria-hidden="true" />
                <p className="flex-1 text-[12px]" style={{ color: C.ink }}>
                  Register onbereikbaar. Kon de laatste mutaties niet ophalen.
                </p>
                <button
                  onClick={() => setFeed("ok")}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] transition-colors ${RING}`}
                  style={{ color: C.stone, background: C.gold }}
                >
                  <RotateCw size={12} strokeWidth={2.4} aria-hidden="true" /> Opnieuw
                </button>
              </div>
            )}
            {feed === "ok" && (
              <p className="mt-3 flex items-center gap-2 text-[12px]" style={{ color: C.muted }}>
                <Check size={14} strokeWidth={2.4} color={C.gold} aria-hidden="true" /> Register
                bijgewerkt — alle mutaties geladen.
              </p>
            )}
          </Panel>

          {/* Berichten-preview */}
          <Panel className="p-4">
            <h3
              className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.ink }}
            >
              <ScrollText size={14} strokeWidth={2} color={C.gold} aria-hidden="true" />{" "}
              Correspondentie
            </h3>
            <ul className="mt-3 space-y-2.5">
              {BERICHTEN.slice(0, 2).map((b) => (
                <li key={b.van} className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                    style={{
                      ...serif,
                      color: C.gold,
                      background: `${C.gold}12`,
                      border: `1px solid ${C.line}`,
                    }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[12px] font-semibold" style={{ color: C.ink }}>
                        {b.van}
                      </span>
                      {b.ongelezen && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.gold }}
                          aria-label="ongelezen"
                        />
                      )}
                    </span>
                    <span className="block truncate text-[11px]" style={{ color: C.muted }}>
                      {b.preview}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] tabular-nums" style={{ color: C.faint }}>
                    {b.tijd}
                  </span>
                </li>
              ))}
            </ul>
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
        <Kicker>Register</Kicker>
        <Title>Open opdrachten</Title>
      </div>

      <div
        className="flex items-center gap-3 rounded-md px-4 py-3"
        style={{ background: C.stone, border: `1px solid ${C.line}`, boxShadow: SHADOW }}
      >
        <Search size={16} strokeWidth={2} color={C.gold} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a917f]"
          style={{ ...body, color: C.ink }}
        />
        <span
          className="shrink-0 text-[11px] font-semibold tabular-nums"
          style={{ color: C.faint }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Panel className="p-12 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.stoneAlt, border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Landmark size={24} strokeWidth={1.8} color={C.gold} />
          </span>
          <p
            className="mt-4 text-[18px] uppercase tracking-[0.02em]"
            style={{ ...serif, color: C.ink, fontWeight: 500 }}
          >
            Niets gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12px]" style={{ color: C.muted }}>
            Geen match past bij &quot;{q}&quot;. Verruim je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className={`mt-5 rounded-sm px-4 py-2 text-[12.5px] font-semibold uppercase tracking-[0.06em] transition-colors ${RING}`}
            style={{ color: C.stone, background: C.gold }}
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
                  className={`w-full rounded-lg p-4 text-left transition-all hover:-translate-y-0.5 ${RING}`}
                  style={{
                    background: C.stone,
                    border: `1px solid ${on ? C.gold : C.line}`,
                    boxShadow: on ? `0 14px 30px -22px ${C.gold}` : SHADOW,
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    <ScoreSeal value={o.match} size={52} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
                        style={{ color: C.faint }}
                      >
                        <span>{o.id}</span>
                        {on && <span style={{ color: C.gold }}>· gekozen</span>}
                      </div>
                      <p className="truncate text-[15px] font-semibold" style={{ color: C.ink }}>
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={12} strokeWidth={2} aria-hidden="true" /> {o.opdrachtgever} ·{" "}
                        {o.plaats} · {o.tarief}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {o.redenen.plus.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10.5px] font-medium"
                            style={{
                              color: C.gold,
                              background: `${C.gold}10`,
                              border: `1px solid ${C.line}`,
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
              <Panel>
                <div
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: C.gold }}
                  >
                    {sel.id}
                  </span>
                  <Gem size={15} strokeWidth={2} color={C.gold} aria-hidden="true" />
                </div>
                <div className="p-4">
                  <p className="text-[16px] font-semibold leading-snug" style={{ color: C.ink }}>
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
                        className="rounded-md p-2.5"
                        style={{ background: C.stoneAlt }}
                      >
                        <dt
                          className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                          style={{ color: C.faint }}
                        >
                          {m.l}
                        </dt>
                        <dd
                          className="mt-0.5 font-semibold tabular-nums"
                          style={{ ...serif, color: C.ink }}
                        >
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    onClick={() => onOpen(sel.id)}
                    className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-sm px-4 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.06em] transition-colors ${RING}`}
                    style={{ color: C.stone, background: C.gold }}
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
      <Panel className="relative overflow-hidden">
        <MarbleVeins className="pointer-events-none absolute inset-0 h-full w-full opacity-30" />
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
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
                  className="rounded-sm px-2.5 py-0.5 text-[11px] font-medium"
                  style={{
                    color: C.muted,
                    background: C.stoneAlt,
                    border: `1px solid ${C.lineSoft}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <ScoreSeal value={opdracht.match} size={76} />
        </div>
        <div className="relative p-5 pt-0 sm:p-6 sm:pt-0">
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className={`flex w-full items-center justify-center gap-2 rounded-sm px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors disabled:opacity-90 ${RING}`}
            style={{ color: C.stone, background: state === "sent" ? C.ink : C.gold }}
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
              className="text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[18px] tabular-nums" style={{ ...serif, color: C.ink }}>
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
          <Gem size={16} strokeWidth={2} color={C.gold} aria-hidden="true" />
          <h3
            className="text-[15px] font-semibold uppercase tracking-[0.06em]"
            style={{ color: C.ink }}
          >
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.gold }}
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
                    strokeWidth={2.4}
                    color={C.gold}
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
              style={{ color: C.warn }}
            >
              <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" /> Aandachtspunten
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
      </Panel>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const stats = [
    { l: "Bekrachtigd", v: `${verified}/${total}`, color: C.gold, Icon: ShieldCheck },
    { l: "Verloopt", v: "1", color: C.warn, Icon: AlertTriangle },
    { l: "In behandeling", v: "1", color: C.slate, Icon: Clock },
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
                  className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.faint }}
                >
                  {s.l}
                </p>
                <p className="mt-1.5 text-[24px] tabular-nums" style={{ ...serif, color: C.ink }}>
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: `${s.color}14`, border: `1px solid ${s.color}44` }}
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
                style={{ background: `${m.color}12`, border: `1px solid ${m.color}44` }}
              >
                <Icon size={20} strokeWidth={2} color={m.color} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold" style={{ color: C.ink }}>
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
          const color = warn ? C.warn : C.gold;
          return (
            <Panel key={a.titel} className="flex items-stretch overflow-hidden">
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-2"
                style={{ background: `${color}10`, borderRight: `1px solid ${color}33` }}
              >
                <span className="text-[16px] tabular-nums" style={{ ...serif, color }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {warn ? (
                  <AlertTriangle size={15} strokeWidth={2.2} color={color} aria-hidden="true" />
                ) : (
                  <Gem size={15} strokeWidth={2} color={color} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-1 text-[14.5px] font-semibold" style={{ color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`m-3 shrink-0 self-center rounded-sm px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors ${RING}`}
                style={{
                  color: warn ? C.stone : C.ink,
                  background: warn ? C.warn : C.stoneAlt,
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
        className="flex items-center gap-3 rounded-lg p-4"
        style={{ background: `${C.gold}0c`, border: `1px solid ${C.line}` }}
      >
        <Check size={18} strokeWidth={2.2} color={C.gold} aria-hidden="true" />
        <p className="text-[12.5px]" style={{ color: C.muted }}>
          Verder is alles bijgewerkt. Nieuwe mutaties verschijnen hier vanzelf.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusColor: Record<string, string> = {
    Betaald: C.gold,
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
          className={`inline-flex shrink-0 items-center gap-2 rounded-sm px-4 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.06em] transition-colors ${RING}`}
          style={{ color: C.stone, background: C.gold }}
        >
          <Plus size={14} strokeWidth={2.4} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Panel className="p-5">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: C.faint }}
          >
            Ontvangen
          </p>
          <p className="mt-2 text-[22px] tabular-nums" style={{ ...serif, color: C.gold }}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Panel>
        <Panel className="p-5">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: C.faint }}
          >
            Openstaand
          </p>
          <p className="mt-2 text-[22px] tabular-nums" style={{ ...serif, color: C.warn }}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </Panel>
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10px] font-semibold uppercase tracking-[0.1em]"
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
                    style={{ ...serif, color: C.ink }}
                  >
                    {f.nr}
                  </td>
                  <td className="p-4 text-[13px] font-medium" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden p-4 text-[12px] tabular-nums sm:table-cell"
                    style={{ color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-4 text-right text-[13px] tabular-nums"
                    style={{ ...serif, color: C.ink }}
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
                      <span
                        className="text-[11px] font-semibold uppercase tracking-[0.06em]"
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
    </div>
  );
}
