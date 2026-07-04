"use client";

// Concept 75 — "Cinema" · cinematisch letterbox / film.
// Bijna-zwart doek met warm ivoor tekst en amber film-accent. Widescreen letterbox-balken
// (cinemascope-banden boven/onder key panels), title-card typografie (grote serif "credits"),
// scene-genummerde secties, subtiele film-grain (SVG feTurbulence) en een "nu speelt"-tijdlijn/
// scrubber. Editorial-cinematisch, dramatisch maar leesbaar. DETERMINISTISCH — geen random.
// Palet: doek #0c0b0a / #14110d, ivoor #f3ede2, muted #9b9284, faint #625b50, amber #e0a458,
// koel-cyaan #7fb5b0 (geverifieerd), rood #d97b6c (waarschuwing).
// Fonts: --font-lab-instrument-serif (title cards/koppen) + --font-lab-geist (body).

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
  Film,
  Play,
  Clapperboard,
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
  screen: "#0c0b0a",
  screenAlt: "#14110d",
  panel: "#151210",
  ivory: "#f3ede2",
  muted: "#9b9284",
  faint: "#625b50",
  amber: "#e0a458",
  cyan: "#7fb5b0",
  red: "#d97b6c",
  line: "rgba(243,237,226,0.1)",
  lineSoft: "rgba(243,237,226,0.05)",
};

const title = { fontFamily: "var(--font-lab-instrument-serif)" };
const body = { fontFamily: "var(--font-lab-geist)" };

const SHADOW = "0 24px 60px -34px rgba(0,0,0,0.95)";

/* ---------- Film-grain (deterministisch, SVG feTurbulence) ---------- */

function FilmGrain() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="c75-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            seed="11"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <radialGradient id="c75-vig" cx="50%" cy="42%" r="72%">
          <stop offset="60%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" filter="url(#c75-grain)" opacity="0.045" />
      <rect width="100%" height="100%" fill="url(#c75-vig)" />
    </svg>
  );
}

// Cinemascope letterbox-band (boven/onder een key panel).
function Letterbox({ position }: { position: "top" | "bottom" }) {
  return (
    <div
      className="relative h-6 w-full shrink-0 sm:h-8"
      style={{
        background: "#000",
        borderBottom: position === "top" ? `1px solid ${C.lineSoft}` : undefined,
        borderTop: position === "bottom" ? `1px solid ${C.lineSoft}` : undefined,
      }}
      aria-hidden="true"
    >
      {position === "top" && (
        <span
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-[0.3em]"
          style={{ ...body, color: C.faint }}
        >
          2.39:1 · scope
        </span>
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
      return { label: "In beoordeling", color: C.amber, Icon: Clock };
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

function Scene({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.28em]"
      style={{ ...body, color: C.amber }}
    >
      <span
        className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 tabular-nums"
        style={{ background: "rgba(224,164,88,0.12)", border: `1px solid ${C.amber}44` }}
      >
        <Clapperboard size={11} strokeWidth={2} aria-hidden="true" />
        SCÈNE {String(n).padStart(2, "0")}
      </span>
      {children}
    </span>
  );
}

function TitleCard({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-2 text-[32px] leading-[1.02] sm:text-[44px]"
      style={{ ...title, color: C.ivory, letterSpacing: "0.01em" }}
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
      className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[11px] font-medium"
      style={{
        ...body,
        color: m.color,
        background: `${m.color}14`,
        border: `1px solid ${m.color}44`,
      }}
    >
      <Icon size={12.5} strokeWidth={2} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function Spark({ data, color = C.amber }: { data: number[]; color?: string }) {
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
        strokeWidth="1.5"
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
      className={`rounded-sm ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}`, boxShadow: SHADOW }}
    >
      {children}
    </div>
  );
}

// Match als "rating" (filmster-metafoor: reel-getal + amber ster).
function RatingReel({ value, size = 48 }: { value: number; size?: number }) {
  const strong = value >= 90;
  const color = strong ? C.amber : C.cyan;
  return (
    <span
      className="relative flex shrink-0 flex-col items-center justify-center rounded-sm"
      style={{
        width: size,
        height: size,
        background: "rgba(0,0,0,0.4)",
        border: `1px solid ${color}55`,
      }}
      aria-hidden="true"
    >
      <Star size={12} strokeWidth={1.6} color={color} fill={`${color}33`} />
      <span
        className="text-[13px] font-semibold tabular-nums leading-none"
        style={{ ...body, color }}
      >
        {value}
      </span>
    </span>
  );
}

/* ---------- Nu speelt — tijdlijn / scrubber ---------- */

const SCENES = ["Intro", "Match", "Verificatie", "Contract", "Aftiteling"];

function Scrubber() {
  const [pos, setPos] = useState(34);
  const activeScene = Math.min(SCENES.length - 1, Math.floor((pos / 100) * SCENES.length));
  const label = SCENES[activeScene] ?? "Intro";
  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between">
        <span
          className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em]"
          style={{ ...body, color: C.amber }}
        >
          <Play size={12} strokeWidth={2.4} fill={C.amber} aria-hidden="true" /> Nu speelt
        </span>
        <span className="text-[11px] tabular-nums" style={{ ...body, color: C.muted }}>
          {label} · {String(Math.floor((pos / 100) * 42)).padStart(2, "0")}:
          {String(Math.floor(pos) % 60).padStart(2, "0")}
        </span>
      </div>
      <label className="sr-only" htmlFor="c75-scrub">
        Tijdlijn van je aanvraag
      </label>
      <input
        id="c75-scrub"
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0a458]"
        style={{
          background: `linear-gradient(90deg, ${C.amber} 0%, ${C.amber} ${pos}%, rgba(243,237,226,0.12) ${pos}%)`,
          accentColor: C.amber,
        }}
        aria-valuetext={`${label}, ${Math.round(pos)} procent`}
      />
      <div className="mt-2 flex justify-between">
        {SCENES.map((s, i) => (
          <span
            key={s}
            className="text-[9px] uppercase tracking-[0.1em]"
            style={{ ...body, color: i === activeScene ? C.amber : C.faint }}
          >
            {s}
          </span>
        ))}
      </div>
    </Panel>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept75() {
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
        color: C.ivory,
        background: `radial-gradient(120% 90% at 50% -10%, ${C.screenAlt}, ${C.screen} 62%)`,
      }}
    >
      <FilmGrain />
      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk */}
        <aside
          className="shrink-0 md:w-[244px]"
          style={{ borderRight: `1px solid ${C.line}`, background: "rgba(0,0,0,0.4)" }}
        >
          <div className="flex h-full flex-col">
            <div
              className="flex items-center gap-3 p-5"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm"
                style={{ background: "rgba(224,164,88,0.12)", border: `1px solid ${C.amber}55` }}
                aria-hidden="true"
              >
                <Film size={18} strokeWidth={1.8} color={C.amber} />
              </span>
              <div className="leading-tight">
                <div className="text-[22px]" style={{ ...title, color: C.ivory }}>
                  Cinema
                </div>
                <div className="text-[9px] uppercase tracking-[0.22em]" style={{ color: C.faint }}>
                  ZZP · zorg
                </div>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto p-2 md:flex-1 md:flex-col"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s, i) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="relative flex shrink-0 items-center gap-2.5 rounded-sm px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0a458] md:w-full"
                    style={{
                      color: on ? C.ivory : C.muted,
                      background: on ? "rgba(224,164,88,0.1)" : "transparent",
                      borderLeft: `2px solid ${on ? C.amber : "transparent"}`,
                    }}
                  >
                    <span
                      className="text-[10px] tabular-nums"
                      style={{ color: on ? C.amber : C.faint }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s.label}
                  </button>
                );
              })}
            </nav>

            <div
              className="hidden items-center gap-3 p-4 md:flex"
              style={{ borderTop: `1px solid ${C.lineSoft}`, background: "rgba(0,0,0,0.4)" }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-[12px] font-semibold"
                style={{ color: C.screen, background: C.amber }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold" style={{ color: C.ivory }}>
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
  // Title-card reveal: kaart faseert in bij mount.
  const [reveal, setReveal] = useState(false);
  useEffect(() => {
    const t1 = window.setTimeout(() => setReveal(true), 60);
    const t2 = window.setTimeout(() => setLoading(false), 720);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      {/* Title-card met letterbox-banden */}
      <Panel className="overflow-hidden">
        <Letterbox position="top" />
        <div
          className="px-6 py-8 text-center transition-all duration-700 sm:px-10 sm:py-12"
          style={{
            opacity: reveal ? 1 : 0,
            transform: reveal ? "translateY(0)" : "translateY(10px)",
            background:
              "radial-gradient(120% 140% at 50% 0%, rgba(224,164,88,0.06), transparent 60%)",
          }}
        >
          <Scene n={1}>Opening</Scene>
          <TitleCard>Goedeavond, {PROFIEL.naam.split(" ")[0]}</TitleCard>
          <p className="mt-3 text-[13px]" style={{ color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <Letterbox position="bottom" />
      </Panel>

      <Scrubber />

      {warn && (
        <div
          className="flex flex-col gap-3 rounded-sm p-4 sm:flex-row sm:items-center"
          style={{
            border: `1px solid ${C.red}44`,
            background: "rgba(217,123,108,0.08)",
            boxShadow: SHADOW,
          }}
          role="alert"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-sm"
            style={{ background: "rgba(217,123,108,0.14)", border: `1px solid ${C.red}44` }}
          >
            <AlertTriangle size={18} strokeWidth={2} color={C.red} aria-hidden="true" />
          </span>
          <p className="text-[13px] leading-snug" style={{ color: C.ivory }}>
            <span style={{ ...title, fontSize: "18px" }}>{warn.titel}.</span>{" "}
            <span style={{ color: C.muted }}>{warn.detail}</span>
          </p>
          <button
            onClick={() => onGo("verificatie")}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-sm px-4 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0a458]"
            style={{ color: C.screen, background: C.amber }}
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
                style={{ color: k.up ? C.cyan : C.red }}
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
              className="mt-3 text-[27px] tabular-nums leading-none"
              style={{ ...title, color: C.ivory }}
            >
              {k.value}
            </p>
            <div className="mt-2">
              <Spark data={k.spark} color={k.up ? C.amber : C.red} />
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
            <h3
              className="flex items-center gap-2 text-[19px]"
              style={{ ...title, color: C.ivory }}
            >
              <Scene n={2}>Casting</Scene>
            </h3>
            <button
              onClick={() => onGo("marktplaats")}
              className="inline-flex items-center gap-1 rounded-sm px-2.5 py-1 text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0a458]"
              style={{ color: C.cyan }}
            >
              Alles <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3 p-4" role="status" aria-live="polite">
              <span className="sr-only">Rollen worden geladen…</span>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-sm p-3"
                  style={{ background: "rgba(243,237,226,0.03)" }}
                >
                  <span
                    className="h-11 w-11 animate-pulse rounded-sm"
                    style={{ background: "rgba(243,237,226,0.08)" }}
                  />
                  <div className="flex-1 space-y-2">
                    <span
                      className="block h-3 w-2/3 animate-pulse rounded"
                      style={{ background: "rgba(243,237,226,0.08)" }}
                    />
                    <span
                      className="block h-2.5 w-1/2 animate-pulse rounded"
                      style={{ background: "rgba(243,237,226,0.08)" }}
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
                    className="flex w-full items-center gap-3.5 rounded-sm p-3 text-left transition-colors hover:bg-[rgba(243,237,226,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e0a458]"
                  >
                    <RatingReel value={o.match} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14px] font-semibold"
                        style={{ color: C.ivory }}
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

        <div className="space-y-5">
          <Panel>
            <div className="p-4" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
              <h3 className="text-[19px]" style={{ ...title, color: C.ivory }}>
                Certificaten
              </h3>
            </div>
            <div className="p-2">
              {CREDENTIALS.map((c) => {
                const m = credMeta(c.status);
                const Icon = m.Icon;
                return (
                  <div key={c.naam} className="flex items-center gap-2.5 rounded-sm px-2 py-2.5">
                    <Icon size={15} strokeWidth={1.8} color={m.color} aria-hidden="true" />
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px] font-medium"
                      style={{ color: C.ivory }}
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
              <h3 className="text-[19px]" style={{ ...title, color: C.ivory }}>
                Berichten
              </h3>
              <span
                className="rounded-sm px-2 py-0.5 text-[10.5px] font-medium"
                style={{ color: C.amber, background: "rgba(224,164,88,0.12)" }}
              >
                {BERICHTEN.filter((b) => b.ongelezen).length} nieuw
              </span>
            </div>
            <div className="p-2">
              {BERICHTEN.slice(0, 2).map((b) => (
                <div key={b.van} className="flex items-center gap-3 rounded-sm px-2 py-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-[11px] font-semibold"
                    style={{
                      color: C.ivory,
                      background: "rgba(243,237,226,0.05)",
                      border: `1px solid ${C.line}`,
                    }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold" style={{ color: C.ivory }}>
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
        <Scene n={2}>Casting</Scene>
        <TitleCard>Open rollen</TitleCard>
      </div>

      <div
        className="flex items-center gap-3 rounded-sm px-4 py-3"
        style={{ background: C.panel, border: `1px solid ${C.line}`, boxShadow: SHADOW }}
      >
        <Search size={16} strokeWidth={1.8} color={C.cyan} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#625b50]"
          style={{ color: C.ivory }}
        />
        <span className="shrink-0 text-[11.5px] tabular-nums" style={{ color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Panel className="p-12 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-sm"
            style={{ background: "rgba(243,237,226,0.05)", border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Film size={24} strokeWidth={1.6} color={C.cyan} />
          </span>
          <p className="mt-4 text-[22px]" style={{ ...title, color: C.ivory }}>
            Geen scène gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen rol past bij &quot;{q}&quot;. Verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 rounded-sm px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0a458]"
            style={{ color: C.screen, background: C.amber }}
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
                  className="w-full rounded-sm p-4 text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0a458]"
                  style={{
                    background: C.panel,
                    border: `1px solid ${on ? `${C.amber}66` : C.line}`,
                    boxShadow: SHADOW,
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    <RatingReel value={o.match} size={54} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em]"
                        style={{ color: C.faint }}
                      >
                        <span>{o.id}</span>
                        {on && <span style={{ color: C.amber }}>· in beeld</span>}
                      </div>
                      <p className="truncate text-[15px] font-semibold" style={{ color: C.ivory }}>
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
                            className="rounded-sm px-2 py-0.5 text-[10.5px] font-medium"
                            style={{
                              color: C.muted,
                              background: "rgba(243,237,226,0.05)",
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
              <Panel className="overflow-hidden">
                <Letterbox position="top" />
                <div className="p-4">
                  <span
                    className="text-[11px] uppercase tracking-[0.14em]"
                    style={{ color: C.amber }}
                  >
                    {sel.id}
                  </span>
                  <p className="mt-1 text-[20px] leading-snug" style={{ ...title, color: C.ivory }}>
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
                        className="rounded-sm p-2.5"
                        style={{ background: "rgba(243,237,226,0.04)" }}
                      >
                        <dt
                          className="text-[10px] uppercase tracking-[0.08em]"
                          style={{ color: C.faint }}
                        >
                          {m.l}
                        </dt>
                        <dd
                          className="mt-0.5 font-semibold tabular-nums"
                          style={{ color: C.ivory }}
                        >
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    onClick={() => onOpen(sel.id)}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-sm px-4 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0a458]"
                    style={{ color: C.screen, background: C.amber }}
                  >
                    Open opdracht <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                </div>
                <Letterbox position="bottom" />
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
      <Panel className="overflow-hidden">
        <Letterbox position="top" />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <Scene n={3}>Hoofdrol</Scene>
            <TitleCard>{opdracht.titel}</TitleCard>
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
                    background: "rgba(243,237,226,0.05)",
                    border: `1px solid ${C.lineSoft}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <RatingReel value={opdracht.match} size={78} />
        </div>
        <div className="p-5 pt-0 sm:p-6 sm:pt-0">
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="flex w-full items-center justify-center gap-2 rounded-sm px-5 py-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0a458] disabled:opacity-90"
            style={{ color: C.screen, background: state === "sent" ? C.cyan : C.amber }}
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
        <Letterbox position="bottom" />
      </Panel>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Panel key={m.l} className="p-4">
            <p className="text-[10px] uppercase tracking-[0.08em]" style={{ color: C.faint }}>
              {m.l}
            </p>
            <p className="mt-1.5 text-[20px] tabular-nums" style={{ ...title, color: C.ivory }}>
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
          <Clapperboard size={16} strokeWidth={1.8} color={C.amber} aria-hidden="true" />
          <h3 className="text-[20px]" style={{ ...title, color: C.ivory }}>
            Regie-aantekeningen
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.1em]"
              style={{ color: C.cyan }}
            >
              <Check size={13} strokeWidth={3} aria-hidden="true" /> Sterke scènes
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.ivory }}
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
              <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" /> Retakes nodig
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
    { l: "In beoordeling", v: "1", color: C.amber, Icon: Clock },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Scene n={4}>Credits</Scene>
        <TitleCard>Certificaten</TitleCard>
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
                <p className="text-[10.5px] uppercase tracking-[0.08em]" style={{ color: C.faint }}>
                  {s.l}
                </p>
                <p className="mt-1.5 text-[26px] tabular-nums" style={{ ...title, color: C.ivory }}>
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-sm"
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm"
                style={{ background: `${m.color}18`, border: `1px solid ${m.color}55` }}
              >
                <Icon size={20} strokeWidth={1.8} color={m.color} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold" style={{ color: C.ivory }}>
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
        <Scene n={5}>Draaiboek</Scene>
        <TitleCard>Volgende acties</TitleCard>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.red : C.amber;
          return (
            <Panel key={a.titel} className="flex items-stretch overflow-hidden">
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-2"
                style={{ background: `${color}14`, borderRight: `1px solid ${color}33` }}
              >
                <span className="text-[17px] tabular-nums" style={{ ...title, color }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {warn ? (
                  <AlertTriangle size={15} strokeWidth={2.2} color={color} aria-hidden="true" />
                ) : (
                  <Play size={13} strokeWidth={2.2} color={color} fill={color} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10.5px] font-medium uppercase tracking-[0.1em]"
                  style={{ color }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-1 text-[14.5px] font-semibold" style={{ color: C.ivory }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className="m-3 shrink-0 self-center rounded-sm px-4 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0a458]"
                style={{
                  color: warn ? C.screen : C.ivory,
                  background: warn ? C.amber : "rgba(243,237,226,0.05)",
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
        className="flex items-center gap-3 rounded-sm p-4"
        style={{ background: "rgba(127,181,176,0.08)", border: `1px solid ${C.cyan}33` }}
      >
        <Check size={18} strokeWidth={2.2} color={C.cyan} aria-hidden="true" />
        <p className="text-[12.5px]" style={{ color: C.muted }}>
          Verder is alles bijgewerkt. Nieuwe scènes verschijnen hier vanzelf op het draaiboek.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  // Één ERROR-state zichtbaar: de renderpijplijn van de export faalde deterministisch.
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
          <Scene n={6}>Aftiteling</Scene>
          <TitleCard>Facturen</TitleCard>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-sm px-4 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0a458]"
          style={{ color: C.screen, background: C.amber }}
        >
          <Plus size={14} strokeWidth={2.4} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      {!retry && (
        <div
          className="flex flex-col gap-3 rounded-sm p-4 sm:flex-row sm:items-center"
          style={{ background: "rgba(217,123,108,0.08)", border: `1px solid ${C.red}44` }}
          role="alert"
        >
          <XCircle size={18} strokeWidth={2} color={C.red} aria-hidden="true" />
          <p className="text-[12.5px]" style={{ color: C.ivory }}>
            Export naar je boekhouding is afgebroken. De bedragen hieronder kunnen verouderd zijn.
          </p>
          <button
            onClick={() => setRetry(true)}
            className="ml-auto shrink-0 rounded-sm px-3.5 py-1.5 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0a458]"
            style={{ color: C.screen, background: C.red }}
          >
            Opnieuw proberen
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5">
        <Panel className="p-5">
          <p className="text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.faint }}>
            Ontvangen
          </p>
          <p className="mt-2 text-[26px] tabular-nums" style={{ ...title, color: C.cyan }}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Panel>
        <Panel className="p-5">
          <p className="text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.faint }}>
            Openstaand
          </p>
          <p className="mt-2 text-[26px] tabular-nums" style={{ ...title, color: C.red }}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </Panel>
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10.5px] uppercase tracking-[0.08em]"
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
                    className="p-4 text-[12px] font-medium tabular-nums"
                    style={{ color: C.ivory }}
                  >
                    {f.nr}
                  </td>
                  <td className="p-4 text-[13px] font-medium" style={{ color: C.ivory }}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden p-4 text-[12px] tabular-nums sm:table-cell"
                    style={{ color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-4 text-right text-[15px] tabular-nums"
                    style={{ ...title, color: C.ivory }}
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
