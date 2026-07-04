"use client";

// Concept 67 — "Parcours" · smaakvolle, volwassen gamified progressie / vertrouwens-reis.
// De weg naar hoog vertrouwen als een parcours met mijlpalen, voortgangsringen (SVG, deterministisch),
// niveau-badges (brons/zilver/goud) en quest-achtige next-actions met XP-voortgang. Verificatie wordt
// een level-up: elke afgeronde stap verhoogt je vertrouwensscore. Motiverend maar strak en zakelijk —
// géén kinderachtige toon, wel duidelijke progressie-taal (mijlpalen/niveaus/XP).
// Onderscheidend van tijdlijn-/wayfinding-concepten: hier is progressie zelf de dragende metafoor.
// Palet: bg #f4f6fb, ink #1c2437, indigo #6d5cff, emerald #10b981 (behaald), goud #f59e0b.
// Fonts: --font-lab-manrope (display/body) + --font-lab-inter (secundair).

import { useEffect, useState } from "react";
import {
  SCREENS,
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#f4f6fb",
  surface: "#ffffff",
  ink: "#1c2437",
  muted: "#5b6478",
  faint: "#8a92a6",
  line: "#e6e9f5",
  track: "#e9ecf7",
  indigo: "#6d5cff",
  indigoSoft: "#eeecff",
  emerald: "#10b981",
  emeraldSoft: "#e5f7f0",
  gold: "#f59e0b",
  goldSoft: "#fdf1dc",
  danger: "#e2445c",
};

const display = { fontFamily: "var(--font-lab-manrope)" };
const body = { fontFamily: "var(--font-lab-inter)" };

/* ---------- Vertrouwens-model (deterministisch afgeleid uit de mock) ---------- */

const CRED_WEIGHT: Record<CredStatus, number> = {
  VERIFIED: 1,
  EXPIRING: 0.7,
  SUBMITTED: 0.5,
  REJECTED: 0,
};

const TRUST_PCT = Math.round(
  (CREDENTIALS.reduce((s, c) => s + CRED_WEIGHT[c.status], 0) / CREDENTIALS.length) * 100,
);

type Level = { naam: string; kleur: string; zacht: string; drempel: number };
const LEVELS: Level[] = [
  { naam: "Brons", kleur: "#b07a3c", zacht: "#f3e7d6", drempel: 0 },
  { naam: "Zilver", kleur: "#8a93a6", zacht: "#eef1f6", drempel: 55 },
  { naam: "Goud", kleur: C.gold, zacht: C.goldSoft, drempel: 80 },
];

function levelVoor(pct: number): { huidig: Level; index: number } {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) if (pct >= LEVELS[i]!.drempel) index = i;
  return { huidig: LEVELS[index]!, index };
}

const CRED_META: Record<
  CredStatus,
  { label: string; kleur: string; zacht: string; done: boolean }
> = {
  VERIFIED: { label: "Geverifieerd", kleur: C.emerald, zacht: C.emeraldSoft, done: true },
  EXPIRING: { label: "Verloopt bijna", kleur: C.gold, zacht: C.goldSoft, done: false },
  SUBMITTED: { label: "In beoordeling", kleur: C.indigo, zacht: C.indigoSoft, done: false },
  REJECTED: { label: "Afgewezen", kleur: C.danger, zacht: "#fdeaed", done: false },
};

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Voortgangsring (SVG) ---------- */

function Ring({
  pct,
  size = 68,
  stroke = 8,
  color,
  track = C.track,
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - clamped / 100);
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        className="-rotate-90"
      >
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
        />
      </svg>
      {children && (
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </span>
      )}
    </span>
  );
}

/* ---------- Kleine bouwstenen ---------- */

function LevelBadge({ level, small = false }: { level: Level; small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${
        small ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-[11.5px]"
      }`}
      style={{ background: level.zacht, color: level.kleur }}
    >
      <svg width={small ? 11 : 13} height={small ? 11 : 13} viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M8 1.2l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 12.9 4.3 13l.7-4.3-3.1-3 4.3-.6z"
          fill={level.kleur}
        />
      </svg>
      Niveau {level.naam}
    </span>
  );
}

function Kicker({ children, color = C.indigo }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ ...body, color }}>
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-1.5 text-[26px] font-extrabold leading-[1.05] tracking-tight sm:text-[32px]"
      style={{ ...display, color: C.ink }}
    >
      {children}
    </h1>
  );
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = CRED_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: m.zacht, color: m.kleur }}
    >
      {m.done ? (
        <svg width={12} height={12} viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M3.5 8.5l3 3 6-7"
            fill="none"
            stroke={m.kleur}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <span className="h-2 w-2 rounded-full" style={{ background: m.kleur }} />
      )}
      {m.label}
    </span>
  );
}

function MatchRing({ pct, size = 52 }: { pct: number; size?: number }) {
  const color = pct >= 90 ? C.emerald : pct >= 80 ? C.indigo : C.gold;
  return (
    <Ring pct={pct} size={size} stroke={6} color={color}>
      <span
        className="text-[13px] font-extrabold tabular-nums"
        style={{ ...display, color: C.ink }}
      >
        {pct}
      </span>
    </Ring>
  );
}

/* ---------- Hoofdcomponent ---------- */

const NAV_XP: Record<ScreenKey, string> = {
  dashboard: "Basis",
  marktplaats: "Verken",
  opdracht: "Missie",
  verificatie: "Level-up",
  acties: "Quests",
  facturen: "Beloning",
  documenten: "Kluis",
  berichten: "Contact",
};

export function Concept67() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);
  const { huidig } = levelVoor(TRUST_PCT);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: C.bg, color: C.ink }}
    >
      <div className="flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk */}
        <aside
          className="shrink-0 border-b md:w-[248px] md:border-b-0 md:border-r"
          style={{ borderColor: C.line, background: C.surface }}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2.5 px-5 py-5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: C.indigo }}
                aria-hidden="true"
              >
                <svg width={18} height={18} viewBox="0 0 18 18">
                  <path
                    d="M2 13l4-5 3 3 5-7"
                    fill="none"
                    stroke="#fff"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className="leading-none">
                <div className="text-[16px] font-extrabold tracking-tight" style={display}>
                  Parcours
                </div>
                <div
                  className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: C.faint }}
                >
                  Vertrouwens-reis
                </div>
              </div>
            </div>

            {/* Trust-ring in de nav */}
            <div className="mx-4 mb-4 hidden rounded-2xl p-4 md:block" style={{ background: C.bg }}>
              <div className="flex items-center gap-3">
                <Ring pct={TRUST_PCT} size={58} stroke={7} color={huidig.kleur}>
                  <span
                    className="text-[15px] font-extrabold tabular-nums"
                    style={{ ...display, color: C.ink }}
                  >
                    {TRUST_PCT}
                  </span>
                </Ring>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold" style={{ color: C.muted }}>
                    Vertrouwensscore
                  </div>
                  <div className="mt-1">
                    <LevelBadge level={huidig} small />
                  </div>
                </div>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="group flex shrink-0 items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5cff] md:w-full"
                    style={{
                      color: on ? C.ink : C.muted,
                      background: on ? C.indigoSoft : "transparent",
                    }}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: on ? C.indigo : C.line }}
                        aria-hidden="true"
                      />
                      {s.label}
                    </span>
                    <span
                      className="hidden text-[9.5px] font-bold uppercase tracking-[0.1em] md:inline"
                      style={{ color: on ? C.indigo : C.faint }}
                    >
                      {NAV_XP[s.key]}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div
              className="mt-auto hidden items-center gap-3 border-t px-5 py-4 md:flex"
              style={{ borderColor: C.line }}
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[12.5px] font-bold text-white"
                style={{ ...display, background: C.ink }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold" style={display}>
                  {PROFIEL.naam}
                </div>
                <div className="truncate text-[11px]" style={{ color: C.faint }}>
                  {PROFIEL.plaats}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-5xl p-5 sm:p-7">
            {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} level={huidig} />}
            {screen === "marktplaats" && (
              <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
            )}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie level={huidig} />}
            {screen === "acties" && <Acties />}
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
  level,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
  level: Level;
}) {
  const [sync, setSync] = useState<"error" | "loading" | "ok">("error");
  useEffect(() => {
    if (sync !== "loading") return;
    const t = window.setTimeout(() => setSync("ok"), 900);
    return () => window.clearTimeout(t);
  }, [sync]);

  const kpiColor = (i: number) => [C.indigo, C.emerald, C.gold, C.indigo][i % 4]!;
  const kpiPct = (i: number) => [TRUST_PCT, 70, 82, 45][i % 4]!;

  return (
    <div className="space-y-6">
      <div>
        <Kicker>Jouw parcours</Kicker>
        <Title>Goedendag, {PROFIEL.naam.split(" ")[0]}</Title>
        <p className="mt-2 text-[13.5px]" style={{ color: C.muted }}>
          {PROFIEL.rol}
        </p>
      </div>

      {/* Vertrouwens-hero */}
      <section
        className="grid grid-cols-1 gap-5 rounded-3xl p-6 lg:grid-cols-[auto_1fr]"
        style={{
          background: `linear-gradient(135deg, ${C.ink} 0%, #2a3350 100%)`,
          color: "#fff",
        }}
      >
        <div className="flex items-center gap-5">
          <Ring
            pct={TRUST_PCT}
            size={120}
            stroke={12}
            color={level.kleur}
            track="rgba(255,255,255,0.14)"
          >
            <span className="text-[34px] font-extrabold tabular-nums leading-none" style={display}>
              {TRUST_PCT}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">
              score
            </span>
          </Ring>
          <div>
            <LevelBadge level={level} />
            <p className="mt-3 max-w-[15rem] text-[13px] leading-relaxed opacity-80">
              Je hebt niveau {level.naam.toLowerCase()} bereikt. Nog{" "}
              <span className="font-bold text-white">{100 - TRUST_PCT} punten</span> tot de
              volledige score.
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-60">
            Volgende mijlpaal
          </div>
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-bold">VOG actueel houden</p>
              <span className="text-[11px] font-bold" style={{ color: C.gold }}>
                +20 XP
              </span>
            </div>
            <p className="mt-1 text-[12px] opacity-75">
              Vernieuw je Verklaring Omtrent Gedrag om goud te behouden.
            </p>
            <button
              onClick={() => onGo("verificatie")}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{ background: C.gold, color: "#3a2a05" }}
            >
              Start deze stap →
            </button>
          </div>
        </div>
      </section>

      {/* KPI's met mini-ringen */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <div
            key={k.label}
            className="rounded-2xl border p-4"
            style={{ borderColor: C.line, background: C.surface }}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold leading-tight" style={{ color: C.muted }}>
                {k.label}
              </p>
              <Ring pct={kpiPct(i)} size={34} stroke={4.5} color={kpiColor(i)} />
            </div>
            <p
              className="mt-2 text-[24px] font-extrabold tabular-nums leading-none"
              style={display}
            >
              {k.value}
            </p>
            <p
              className="mt-1.5 text-[11.5px] font-semibold tabular-nums"
              style={{ color: k.up ? C.emerald : C.gold }}
            >
              {k.up ? "▲" : "▼"} {k.trend}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Beste matches + sync-status (loading/error/ok) */}
        <section
          className="rounded-2xl border lg:col-span-2"
          style={{ borderColor: C.line, background: C.surface }}
        >
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ borderColor: C.line }}
          >
            <h3 className="text-[14px] font-bold" style={display}>
              Beste missies voor jou
            </h3>
            <button
              onClick={() => onGo("marktplaats")}
              className="text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5cff]"
              style={{ color: C.indigo }}
            >
              Alles bekijken
            </button>
          </div>

          {sync === "error" && (
            <div
              className="m-4 flex items-center gap-3 rounded-xl p-4"
              style={{ background: "#fdeaed" }}
              role="alert"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ background: "#fff" }}
                aria-hidden="true"
              >
                <svg width={18} height={18} viewBox="0 0 20 20">
                  <path
                    d="M10 2l8 15H2z"
                    fill="none"
                    stroke={C.danger}
                    strokeWidth={1.8}
                    strokeLinejoin="round"
                  />
                  <path d="M10 8v3.5" stroke={C.danger} strokeWidth={1.8} strokeLinecap="round" />
                  <circle cx={10} cy={14} r={1} fill={C.danger} />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-bold" style={{ color: C.ink }}>
                  Missies niet bijgewerkt
                </p>
                <p className="text-[11.5px]" style={{ color: C.muted }}>
                  De laatste synchronisatie is mislukt.
                </p>
              </div>
              <button
                onClick={() => setSync("loading")}
                className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2445c]"
                style={{ background: C.danger }}
              >
                Opnieuw
              </button>
            </div>
          )}

          {sync === "loading" && (
            <div className="space-y-2 p-4" role="status" aria-live="polite">
              <span className="sr-only">Missies worden geladen…</span>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border p-3"
                  style={{ borderColor: C.line }}
                >
                  <span
                    className="h-11 w-11 shrink-0 animate-pulse rounded-full"
                    style={{ background: C.track }}
                  />
                  <div className="flex-1 space-y-2">
                    <span
                      className="block h-3 w-2/3 animate-pulse rounded-full"
                      style={{ background: C.track }}
                    />
                    <span
                      className="block h-2.5 w-1/2 animate-pulse rounded-full"
                      style={{ background: C.track }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {sync === "ok" && (
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                  <button
                    onClick={() => onOpen(o.id)}
                    className="flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-[#f4f6fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6d5cff]"
                  >
                    <MatchRing pct={o.match} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-bold">{o.titel}</span>
                      <span className="block truncate text-[11.5px]" style={{ color: C.muted }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span
                      className="shrink-0 text-[16px]"
                      style={{ color: C.faint }}
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Certificaten-voortgang */}
        <section
          className="rounded-2xl border p-5"
          style={{ borderColor: C.line, background: C.surface }}
        >
          <h3 className="text-[14px] font-bold" style={display}>
            Level-up voortgang
          </h3>
          <p className="mt-1 text-[11.5px]" style={{ color: C.muted }}>
            {CREDENTIALS.filter((c) => c.status === "VERIFIED").length} van {CREDENTIALS.length}{" "}
            certificaten geverifieerd.
          </p>
          <ul className="mt-4 space-y-3">
            {CREDENTIALS.map((c) => {
              const m = CRED_META[c.status];
              return (
                <li key={c.naam} className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ background: m.zacht }}
                    aria-hidden="true"
                  >
                    {m.done ? (
                      <svg width={15} height={15} viewBox="0 0 16 16">
                        <path
                          d="M3.5 8.5l3 3 6-7"
                          fill="none"
                          stroke={m.kleur}
                          strokeWidth={2.4}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.kleur }} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">
                    {c.naam}
                  </span>
                </li>
              );
            })}
          </ul>
          <button
            onClick={() => onGo("verificatie")}
            className="mt-4 w-full rounded-full px-4 py-2.5 text-[12.5px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5cff]"
            style={{ background: C.indigo }}
          >
            Naar verificatie
          </button>
        </section>
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
    <div className="space-y-6">
      <div>
        <Kicker>Verken het parcours</Kicker>
        <Title>Open missies</Title>
      </div>

      <div
        className="flex items-center gap-3 rounded-full border px-4 py-2.5"
        style={{ borderColor: C.line, background: C.surface }}
      >
        <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden="true">
          <circle cx={7} cy={7} r={5} fill="none" stroke={C.faint} strokeWidth={1.8} />
          <path d="M11 11l3 3" stroke={C.faint} strokeWidth={1.8} strokeLinecap="round" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Missies zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#8a92a6]"
          style={{ color: C.ink }}
        />
        <span
          className="shrink-0 text-[11.5px] font-semibold tabular-nums"
          style={{ color: C.faint }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-2xl border p-12 text-center"
          style={{ borderColor: C.line, background: C.surface }}
          role="status"
        >
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.indigoSoft }}
            aria-hidden="true"
          >
            <svg width={26} height={26} viewBox="0 0 24 24">
              <circle cx={10} cy={10} r={7} fill="none" stroke={C.indigo} strokeWidth={2} />
              <path d="M15 15l5 5" stroke={C.indigo} strokeWidth={2} strokeLinecap="round" />
            </svg>
          </span>
          <p className="mt-4 text-[17px] font-extrabold" style={display}>
            Geen missie gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen opdracht past bij &quot;{q}&quot;. Verbreed je zoekopdracht om verder te reizen.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 rounded-full px-4 py-2 text-[12.5px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5cff]"
            style={{ background: C.indigo }}
          >
            Zoekopdracht wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-3">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className="w-full rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-18px_rgba(28,36,55,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5cff]"
                  style={{
                    borderColor: on ? C.indigo : C.line,
                    background: C.surface,
                    boxShadow: on ? "0 10px 30px -18px rgba(109,92,255,0.55)" : undefined,
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    <MatchRing pct={o.match} size={56} />
                    <div className="min-w-0 flex-1">
                      <span
                        className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                        style={{ color: C.faint }}
                      >
                        {o.id}
                      </span>
                      <p className="truncate text-[15px] font-bold">{o.titel}</p>
                      <p className="mt-0.5 truncate text-[11.5px]" style={{ color: C.muted }}>
                        {o.opdrachtgever} · {o.plaats} · {o.uren}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                            style={{ background: C.bg, color: C.muted }}
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
            <aside
              className="h-fit rounded-2xl border p-5 lg:sticky lg:top-4"
              style={{ borderColor: C.line, background: C.surface }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: C.faint }}
                >
                  {sel.id}
                </span>
                <MatchRing pct={sel.match} size={46} />
              </div>
              <p className="mt-3 text-[16px] font-extrabold leading-snug" style={display}>
                {sel.titel}
              </p>
              <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
                {sel.opdrachtgever} · {sel.plaats}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-[12.5px]">
                {[
                  { l: "Tarief", v: sel.tarief },
                  { l: "Omvang", v: sel.uren },
                  { l: "Start", v: sel.start },
                  { l: "Match", v: `${sel.match}%` },
                ].map((m) => (
                  <div key={m.l} className="rounded-xl p-2.5" style={{ background: C.bg }}>
                    <dt
                      className="text-[10px] font-bold uppercase tracking-[0.06em]"
                      style={{ color: C.faint }}
                    >
                      {m.l}
                    </dt>
                    <dd className="mt-0.5 font-extrabold tabular-nums" style={display}>
                      {m.v}
                    </dd>
                  </div>
                ))}
              </dl>
              <button
                onClick={() => onOpen(sel.id)}
                className="mt-4 w-full rounded-full px-4 py-2.5 text-[12.5px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5cff]"
                style={{ background: C.ink }}
              >
                Open missie
              </button>
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
    <div className="space-y-6">
      <section
        className="rounded-2xl border p-6"
        style={{ borderColor: C.line, background: C.surface }}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Kicker>{opdracht.id} · Missie</Kicker>
            <Title>{opdracht.titel}</Title>
            <p className="mt-2 text-[12.5px] font-medium" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{ background: C.bg, color: C.muted }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="shrink-0 self-start">
            <Ring
              pct={opdracht.match}
              size={92}
              stroke={10}
              color={opdracht.match >= 90 ? C.emerald : C.indigo}
            >
              <span
                className="text-[26px] font-extrabold tabular-nums leading-none"
                style={{ ...display, color: C.ink }}
              >
                {opdracht.match}
              </span>
              <span
                className="text-[9px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.faint }}
              >
                match
              </span>
            </Ring>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m) => (
            <div key={m.l} className="rounded-xl p-3.5" style={{ background: C.bg }}>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.06em]"
                style={{ color: C.faint }}
              >
                {m.l}
              </p>
              <p className="mt-1 text-[16px] font-extrabold tabular-nums" style={display}>
                {m.v}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={react}
          disabled={state !== "idle"}
          aria-live="polite"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[13.5px] font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5cff] disabled:translate-y-0 disabled:opacity-90"
          style={{ background: state === "sent" ? C.emerald : C.indigo }}
        >
          {state === "idle" && "Reageer op deze missie · +15 XP"}
          {state === "sending" && "Versturen…"}
          {state === "sent" && "✓ Reactie verstuurd — 15 XP verdiend"}
        </button>
      </section>

      {/* Verklaarbare matching */}
      <section
        className="rounded-2xl border"
        style={{ borderColor: C.line, background: C.surface }}
      >
        <div className="border-b px-5 py-4" style={{ borderColor: C.line }}>
          <h3 className="text-[14px] font-bold" style={display}>
            Waarom deze match
          </h3>
          <p className="mt-0.5 text-[11.5px]" style={{ color: C.muted }}>
            Onderbouwd op basis van je geverifieerde profiel.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
          <div className="p-5 sm:border-r" style={{ borderColor: C.line }}>
            <p
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.emerald }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: C.emerald }} /> Pluspunten
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px] font-medium">
                  <svg
                    width={16}
                    height={16}
                    viewBox="0 0 16 16"
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  >
                    <circle cx={8} cy={8} r={8} fill={C.emeraldSoft} />
                    <path
                      d="M4.5 8.2l2.2 2.2 4.6-5"
                      fill="none"
                      stroke={C.emerald}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t p-5 sm:border-t-0" style={{ borderColor: C.line }}>
            <p
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.gold }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: C.gold }} />{" "}
              Aandachtspunten
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px] font-medium"
                  style={{ color: C.muted }}
                >
                  <svg
                    width={16}
                    height={16}
                    viewBox="0 0 16 16"
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  >
                    <circle cx={8} cy={8} r={8} fill={C.goldSoft} />
                    <path d="M8 4.5v4" stroke={C.gold} strokeWidth={2} strokeLinecap="round" />
                    <circle cx={8} cy={11} r={1} fill={C.gold} />
                  </svg>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie({ level }: { level: Level }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;

  return (
    <div className="space-y-6">
      <div>
        <Kicker>Level-up</Kicker>
        <Title>Vertrouwens-parcours</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Elke geverifieerde stap verhoogt je vertrouwensscore. Volg het pad naar boven.
        </p>
      </div>

      {/* Overzichtskaart met ring */}
      <section
        className="flex flex-col items-center gap-6 rounded-2xl border p-6 sm:flex-row"
        style={{ borderColor: C.line, background: C.surface }}
      >
        <Ring pct={TRUST_PCT} size={112} stroke={12} color={level.kleur}>
          <span
            className="text-[30px] font-extrabold tabular-nums"
            style={{ ...display, color: C.ink }}
          >
            {TRUST_PCT}
          </span>
          <span
            className="text-[9px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: C.faint }}
          >
            score
          </span>
        </Ring>
        <div className="flex-1 text-center sm:text-left">
          <LevelBadge level={level} />
          <p className="mt-3 text-[13.5px]" style={{ color: C.muted }}>
            {verified} van {CREDENTIALS.length} certificaten geverifieerd. Rond de openstaande
            stappen af om je score te verhogen.
          </p>
        </div>
      </section>

      {/* Parcours-pad met mijlpalen */}
      <section
        className="rounded-2xl border p-6"
        style={{ borderColor: C.line, background: C.surface }}
      >
        <h3 className="text-[14px] font-bold" style={display}>
          Mijlpalen
        </h3>
        <ol className="mt-5 space-y-0">
          {CREDENTIALS.map((c, i) => {
            const m = CRED_META[c.status];
            const last = i === CREDENTIALS.length - 1;
            return (
              <li key={c.naam} className="relative flex gap-4 pb-6 last:pb-0">
                {!last && (
                  <span
                    className="absolute left-[17px] top-9 h-full w-0.5"
                    style={{ background: m.done ? C.emerald : C.line }}
                    aria-hidden="true"
                  />
                )}
                <span
                  className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: m.zacht, border: `2px solid ${m.kleur}` }}
                  aria-hidden="true"
                >
                  {m.done ? (
                    <svg width={16} height={16} viewBox="0 0 16 16">
                      <path
                        d="M3.5 8.5l3 3 6-7"
                        fill="none"
                        stroke={m.kleur}
                        strokeWidth={2.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span
                      className="text-[12px] font-extrabold tabular-nums"
                      style={{ ...display, color: m.kleur }}
                    >
                      {i + 1}
                    </span>
                  )}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold">{c.naam}</p>
                    <p className="text-[11.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={c.status} />
                    {!m.done && (
                      <button
                        className="rounded-full px-3 py-1.5 text-[11.5px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5cff]"
                        style={{ background: C.indigoSoft, color: C.indigo }}
                      >
                        Voltooien
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

/* ---------- Acties (quests) ---------- */

function Acties() {
  const xp = (i: number, warn: boolean) => (warn ? 20 : 10 + i * 2);
  return (
    <div className="space-y-6">
      <div>
        <Kicker color={C.gold}>Quests</Kicker>
        <Title>Volgende acties</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Rond quests af om XP te verdienen en je vertrouwensscore te laten stijgen.
        </p>
      </div>

      <div className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const accent = warn ? C.gold : C.indigo;
          const zacht = warn ? C.goldSoft : C.indigoSoft;
          return (
            <div
              key={a.titel}
              className="flex items-stretch overflow-hidden rounded-2xl border"
              style={{ borderColor: C.line, background: C.surface }}
            >
              <div
                className="flex w-16 shrink-0 flex-col items-center justify-center gap-1"
                style={{ background: zacht }}
              >
                <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden="true">
                  {warn ? (
                    <>
                      <path
                        d="M12 3l9 17H3z"
                        fill="none"
                        stroke={accent}
                        strokeWidth={2}
                        strokeLinejoin="round"
                      />
                      <path d="M12 9v5" stroke={accent} strokeWidth={2} strokeLinecap="round" />
                      <circle cx={12} cy={17} r={1.1} fill={accent} />
                    </>
                  ) : (
                    <>
                      <circle cx={12} cy={12} r={9} fill="none" stroke={accent} strokeWidth={2} />
                      <path
                        d="M12 7v5l3 2"
                        fill="none"
                        stroke={accent}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  )}
                </svg>
                <span className="text-[10px] font-extrabold" style={{ color: accent }}>
                  +{xp(i, warn)} XP
                </span>
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: accent }}
                >
                  {warn ? "Prioriteit" : "Aanbevolen"}
                </span>
                <p className="mt-1 text-[14.5px] font-bold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="m-3 shrink-0 self-center rounded-full px-4 py-2 text-[12px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5cff]"
                style={{ background: warn ? C.gold : C.indigo }}
              >
                {a.cta}
              </button>
            </div>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 rounded-2xl p-4"
        style={{ background: C.emeraldSoft }}
      >
        <svg width={22} height={22} viewBox="0 0 16 16" aria-hidden="true">
          <circle cx={8} cy={8} r={8} fill="#fff" />
          <path
            d="M4.5 8.2l2.2 2.2 4.6-5"
            fill="none"
            stroke={C.emerald}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="text-[12.5px] font-medium" style={{ color: C.ink }}>
          Verder is alles bijgewerkt. Nieuwe quests verschijnen automatisch op deze plek.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusMeta: Record<string, { kleur: string; zacht: string }> = {
    Betaald: { kleur: C.emerald, zacht: C.emeraldSoft },
    Openstaand: { kleur: C.gold, zacht: C.goldSoft },
    Concept: { kleur: C.faint, zacht: C.bg },
  };
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const totaal = betaald + open || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker color={C.emerald}>Beloningen</Kicker>
          <Title>Facturen</Title>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5cff]"
          style={{ background: C.ink }}
        >
          + Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div
          className="rounded-2xl border p-5"
          style={{ borderColor: C.line, background: C.surface }}
        >
          <div className="flex items-center justify-between">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.muted }}
            >
              Ontvangen
            </p>
            <Ring
              pct={Math.round((betaald / totaal) * 100)}
              size={34}
              stroke={4.5}
              color={C.emerald}
            />
          </div>
          <p className="mt-2 text-[24px] font-extrabold tabular-nums" style={display}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </div>
        <div
          className="rounded-2xl border p-5"
          style={{ borderColor: C.line, background: C.surface }}
        >
          <div className="flex items-center justify-between">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.muted }}
            >
              Openstaand
            </p>
            <Ring pct={Math.round((open / totaal) * 100)} size={34} stroke={4.5} color={C.gold} />
          </div>
          <p className="mt-2 text-[24px] font-extrabold tabular-nums" style={display}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </div>
        <div
          className="rounded-2xl border p-5"
          style={{ borderColor: C.line, background: C.indigoSoft }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: C.indigo }}
          >
            Totale omzet
          </p>
          <p
            className="mt-2 text-[24px] font-extrabold tabular-nums"
            style={{ ...display, color: C.ink }}
          >
            € {(betaald + open).toLocaleString("nl-NL")}
          </p>
        </div>
      </div>

      <div
        className="overflow-x-auto rounded-2xl border"
        style={{ borderColor: C.line, background: C.surface }}
      >
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
              style={{ color: C.faint }}
            >
              <th className="px-5 py-3.5">Nummer</th>
              <th className="px-5 py-3.5">Klant</th>
              <th className="hidden px-5 py-3.5 sm:table-cell">Datum</th>
              <th className="px-5 py-3.5 text-right">Bedrag</th>
              <th className="px-5 py-3.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const m = statusMeta[f.status] ?? statusMeta.Concept!;
              return (
                <tr
                  key={f.nr}
                  style={{ borderTop: `1px solid ${C.line}` }}
                  className={i % 2 ? "" : ""}
                >
                  <td className="px-5 py-3.5 text-[12px] font-bold tabular-nums">{f.nr}</td>
                  <td className="px-5 py-3.5 text-[13px] font-semibold">{f.klant}</td>
                  <td
                    className="hidden px-5 py-3.5 text-[12px] tabular-nums sm:table-cell"
                    style={{ color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-5 py-3.5 text-right text-[13px] font-extrabold tabular-nums"
                    style={display}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ background: m.zacht, color: m.kleur }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: m.kleur }}
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
  );
}
