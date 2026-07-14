"use client";

// Concept 319 — "Nachtmarkt" · feestelijk-warm donker met lantaarnlicht.
// Donker houtskool-canvas (#17110c) waar warme lantaarns de aandacht sturen: amber als hoofdaccent,
// magenta en jade als feestelijke steunkleuren. Gloeiende chips, lantaarn-highlights en een
// slinger van lichtjes bovenaan geven de sfeer van een levendige avondmarkt — kleurrijk-speels én
// premium-dark tegelijk. Alles blijft geordend; het licht valt alleen waar het telt.
// Fonts: --font-lab-baloo (display, rond & warm) + --font-lab-geist (tekst) + --font-lab-mono (cijfers).
// Onderscheidend: de warme, feestelijke markt-sfeer i.p.v. koel neon — WCAG-contrast bewaakt.

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
  Lamp,
  Flame,
  Sparkles,
  Star,
  RotateCw,
  Send,
  Filter,
  Store,
  Wallet,
  Bell,
  ChevronRight,
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
void DOCUMENTEN;

/* ---------- Palet & typografie ---------- */

const C = {
  night: "#17110c",
  nightAlt: "#1f160d",
  wood: "#241a10",
  panel: "rgba(36,26,16,0.72)",
  panelSolid: "#211710",
  fg: "#f6ebd9",
  amber: "#ffb454",
  amberSoft: "#ffcd85",
  magenta: "#ff5c9d",
  jade: "#4fd6a0",
  muted: "#c3a983",
  faint: "#8f7452",
  warn: "#ff9d4d",
  alert: "#ff6b5c",
  line: "rgba(255,180,84,0.16)",
  lineSoft: "rgba(255,180,84,0.08)",
};

const display = { fontFamily: "var(--font-lab-baloo)" };
const body = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

const GLOW = "inset 0 0 0 1px rgba(255,180,84,0.06), 0 24px 60px -34px rgba(0,0,0,0.92)";
const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb454] focus-visible:ring-offset-2 focus-visible:ring-offset-[#17110c]";

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.jade, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.amber, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", color: C.warn, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.alert, Icon: XCircle };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Kleine bouwstenen ---------- */

function Kicker({ children, color = C.amber }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.28em]"
      style={{ ...mono, color }}
    >
      <Lamp size={12} strokeWidth={2.4} aria-hidden="true" />
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-2 text-[27px] font-semibold leading-[1.05] tracking-[-0.01em] sm:text-[33px]"
      style={{ ...display, color: C.fg, textShadow: "0 0 34px rgba(255,180,84,0.22)" }}
    >
      {children}
    </h1>
  );
}

function Panel({
  children,
  className = "",
  glow,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
}) {
  return (
    <div
      className={`rounded-2xl backdrop-blur-sm ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: glow ? `${GLOW}, 0 0 40px -18px ${glow}` : GLOW,
      }}
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
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        ...body,
        color: m.color,
        background: "rgba(0,0,0,0.38)",
        border: `1px solid ${m.color}55`,
      }}
    >
      <Icon size={13} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Warme lantaarn-sparkline — gloeiende lichtlijn met zachte area-vulling.
function Spark({ data, color = C.amber }: { data: number[]; color?: string }) {
  const w = 96;
  const h = 30;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const id = color.replace("#", "");
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={`nm-area-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#nm-area-${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color}aa)` }}
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.2" fill={color} />}
    </svg>
  );
}

// Match-uitlezing als gloeiende lantaarn-ring.
function ScoreOrb({ value, size = 48 }: { value: number; size?: number }) {
  const r = size / 2 - 3;
  const circ = 2 * Math.PI * r;
  const strong = value >= 90;
  const color = strong ? C.amber : value >= 85 ? C.jade : C.magenta;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
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
          strokeWidth="2.6"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
          style={{ filter: `drop-shadow(0 0 5px ${color}bb)` }}
        />
      </svg>
      <span
        className="text-[13px] font-semibold tabular-nums"
        style={{ ...mono, color: strong ? C.amber : C.fg }}
      >
        {value}
      </span>
    </span>
  );
}

// Slinger van lichtjes — het handtekening-element van de nachtmarkt.
function Slinger() {
  const bulbs = [C.amber, C.magenta, C.jade, C.amberSoft, C.amber, C.jade, C.magenta, C.amber];
  return (
    <div className="pointer-events-none relative h-8 w-full overflow-hidden" aria-hidden="true">
      <svg viewBox="0 0 400 32" className="h-full w-full" preserveAspectRatio="none">
        <path
          d="M0 6 Q100 26 200 8 T400 6"
          fill="none"
          stroke="rgba(255,180,84,0.25)"
          strokeWidth="1"
        />
      </svg>
      <div className="absolute inset-0 flex items-start justify-between px-6">
        {bulbs.map((c, i) => {
          const dip = i % 2 === 0 ? 10 : 16;
          return (
            <span
              key={i}
              className="block h-2.5 w-2.5 rounded-full"
              style={{
                marginTop: dip,
                background: c,
                boxShadow: `0 0 10px 2px ${c}`,
                animation: `nm-twinkle ${2.4 + (i % 3) * 0.6}s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept319() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  const navIcon: Record<ScreenKey, typeof Store> = {
    dashboard: Store,
    marktplaats: Search,
    opdracht: Sparkles,
    verificatie: ShieldCheck,
    documenten: ShieldCheck,
    facturen: Wallet,
    berichten: Bell,
    acties: Flame,
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{
        ...body,
        color: C.fg,
        background: `radial-gradient(130% 100% at 50% -8%, ${C.nightAlt}, ${C.night} 60%)`,
      }}
    >
      <style>{`
        @keyframes nm-twinkle { 0%,100% { opacity: 0.55; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.05); } }
        @keyframes nm-flicker { 0%,100% { opacity: 0.85; } 45% { opacity: 1; } 60% { opacity: 0.78; } }
        @keyframes nm-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Warme lantaarn-gloed bovenaan */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(60% 40% at 20% 0%, rgba(255,180,84,0.1), transparent 60%), radial-gradient(50% 40% at 85% 5%, rgba(255,92,157,0.08), transparent 60%)",
        }}
      />

      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk */}
        <aside
          className="shrink-0 md:w-[244px]"
          style={{ borderRight: `1px solid ${C.line}`, background: "rgba(0,0,0,0.26)" }}
        >
          <div className="flex h-full flex-col">
            <div className="px-3 pt-2">
              <Slinger />
            </div>
            <div
              className="flex items-center gap-3 px-5 pb-5"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: `1px solid ${C.line}`,
                  boxShadow: `0 0 20px -6px ${C.amber}`,
                }}
                aria-hidden="true"
              >
                <Lamp size={19} strokeWidth={2} color={C.amber} />
              </span>
              <div className="leading-tight">
                <div className="text-[17px] font-semibold" style={{ ...display, color: C.fg }}>
                  Nachtmarkt
                </div>
                <div
                  className="text-[9px] font-semibold uppercase tracking-[0.24em]"
                  style={{ ...mono, color: C.faint }}
                >
                  ZZP · na zonsondergang
                </div>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto p-2 md:flex-1 md:flex-col"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                const Icon = navIcon[s.key];
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className={`relative flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors md:w-full ${RING}`}
                    style={{
                      color: on ? C.fg : C.muted,
                      background: on ? "rgba(255,180,84,0.1)" : "transparent",
                      border: on ? `1px solid ${C.line}` : "1px solid transparent",
                    }}
                  >
                    <Icon
                      size={16}
                      strokeWidth={on ? 2.4 : 2}
                      color={on ? C.amber : C.faint}
                      aria-hidden="true"
                    />
                    <span>{s.label}</span>
                    {on && (
                      <span
                        className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: C.amber, boxShadow: `0 0 8px ${C.amber}` }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            <div
              className="hidden items-center gap-3 p-4 md:flex"
              style={{ borderTop: `1px solid ${C.lineSoft}`, background: "rgba(0,0,0,0.22)" }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                style={{
                  ...mono,
                  color: C.night,
                  background: `linear-gradient(135deg, ${C.amber}, ${C.magenta})`,
                  boxShadow: `0 0 16px -4px ${C.amber}`,
                }}
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
                  style={{ color: C.jade }}
                >
                  <ShieldCheck size={11} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div
            className="flex-1 overflow-y-auto p-5 sm:p-8"
            style={{ animation: "nm-rise 0.4s ease" }}
          >
            {screen === "dashboard" && (
              <Dashboard onOpen={open} onGo={setScreen} onSelect={setActiveId} />
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
  onSelect,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
  onSelect: (id: string) => void;
}) {
  const warn = ACTIES[0];
  const [feed, setFeed] = useState<"loading" | "error" | "ok">("loading");
  useEffect(() => {
    const t = window.setTimeout(() => setFeed("error"), 720);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Kraam geopend</Kicker>
          <Title>Goedenavond, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-semibold"
          style={{
            ...mono,
            color: C.amber,
            background: "rgba(0,0,0,0.32)",
            border: `1px solid ${C.line}`,
          }}
        >
          <Flame size={13} strokeWidth={2.2} aria-hidden="true" /> {OPDRACHTEN.length} kramen open
        </div>
      </header>

      {warn && (
        <div
          className="flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
          style={{
            border: `1px solid ${C.warn}55`,
            background: "rgba(255,157,77,0.09)",
            boxShadow: GLOW,
          }}
          role="alert"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-xl"
            style={{ background: "rgba(0,0,0,0.34)", border: `1px solid ${C.warn}55` }}
          >
            <AlertTriangle size={18} strokeWidth={2.2} color={C.warn} aria-hidden="true" />
          </span>
          <p className="text-[13px] leading-snug" style={{ color: C.fg }}>
            <span className="font-semibold">{warn.titel}.</span>{" "}
            <span style={{ color: C.muted }}>{warn.detail}</span>
          </p>
          <button
            onClick={() => onGo("verificatie")}
            className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 ${RING}`}
            style={{ color: C.night, background: C.warn }}
          >
            {warn.cta} <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="flex flex-col justify-between p-4">
            <div className="flex items-start justify-between gap-2">
              <p
                className="text-[10.5px] font-semibold uppercase leading-tight tracking-[0.06em]"
                style={{ ...mono, color: C.muted }}
              >
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                style={{ ...mono, color: k.up ? C.jade : C.warn }}
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
              className="mt-3 text-[24px] tabular-nums leading-none"
              style={{ ...display, color: C.fg }}
            >
              {k.value}
            </p>
            <div className="mt-2">
              <Spark data={k.spark} color={k.up ? C.amber : C.warn} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-5">
          <Panel glow="rgba(255,180,84,0.4)">
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <h3
                className="flex items-center gap-2 text-[14px] font-semibold"
                style={{ color: C.fg }}
              >
                <Sparkles size={16} strokeWidth={2} color={C.amber} aria-hidden="true" /> Beste
                matches
              </h3>
              <button
                onClick={() => onGo("marktplaats")}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${RING}`}
                style={{ ...mono, color: C.amber }}
              >
                Alle kramen <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
            <ul className="p-2">
              {OPDRACHTEN.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => onOpen(o.id)}
                    className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-[rgba(255,180,84,0.07)] focus-visible:ring-inset ${RING}`}
                  >
                    <ScoreOrb value={o.match} size={52} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14px] font-semibold"
                        style={{ color: C.fg }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={11} strokeWidth={2.2} aria-hidden="true" /> {o.opdrachtgever}{" "}
                        · {o.tarief}
                      </span>
                    </span>
                    <ArrowUpRight size={16} strokeWidth={2.2} color={C.faint} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          {/* Live feed — loading + error-state */}
          <Panel className="p-4">
            <h3
              className="flex items-center gap-2 text-[13px] font-semibold"
              style={{ color: C.fg }}
            >
              <Bell size={14} strokeWidth={2.2} color={C.magenta} aria-hidden="true" /> Vers van de
              markt
            </h3>
            {feed === "loading" && (
              <div className="mt-3 space-y-2" role="status" aria-live="polite">
                <span className="sr-only">Marktnieuws wordt geladen…</span>
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className="block h-3 animate-pulse rounded-full"
                    style={{ background: "rgba(255,180,84,0.12)", width: i === 0 ? "82%" : "58%" }}
                  />
                ))}
              </div>
            )}
            {feed === "error" && (
              <div
                className="mt-3 flex flex-col gap-2 rounded-xl p-3 sm:flex-row sm:items-center"
                style={{ background: "rgba(255,107,92,0.09)", border: `1px solid ${C.alert}55` }}
                role="alert"
              >
                <XCircle size={16} strokeWidth={2.2} color={C.alert} aria-hidden="true" />
                <p className="flex-1 text-[12px]" style={{ color: C.fg }}>
                  De lantaarns flikkerden even — marktnieuws kon niet worden opgehaald.
                </p>
                <button
                  onClick={() => setFeed("ok")}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${RING}`}
                  style={{ color: C.night, background: C.amber }}
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
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                      style={{
                        ...mono,
                        color: C.amber,
                        background: "rgba(255,180,84,0.12)",
                        border: `1px solid ${C.line}`,
                      }}
                      aria-hidden="true"
                    >
                      {b.initialen}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="truncate text-[12px] font-semibold"
                          style={{ color: C.fg }}
                        >
                          {b.van}
                        </span>
                        {b.ongelezen && (
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: C.magenta, boxShadow: `0 0 6px ${C.magenta}` }}
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

        {/* Volgende acties, compact */}
        <Panel className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3
              className="flex items-center gap-2 text-[14px] font-semibold"
              style={{ color: C.fg }}
            >
              <Flame size={16} strokeWidth={2} color={C.magenta} aria-hidden="true" /> Volgende
              acties
            </h3>
            <button
              onClick={() => onGo("acties")}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${RING}`}
              style={{ ...mono, color: C.magenta }}
            >
              Meer <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
          <ul className="space-y-2.5">
            {ACTIES.map((a, i) => {
              const w = a.urgentie === "warning";
              const color = w ? C.warn : C.jade;
              return (
                <li key={a.titel}>
                  <div
                    className="flex items-start gap-3 rounded-xl p-3"
                    style={{ background: "rgba(0,0,0,0.28)", border: `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold tabular-nums"
                      style={{
                        ...mono,
                        color,
                        background: `${color}1c`,
                        border: `1px solid ${color}44`,
                      }}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold" style={{ color: C.fg }}>
                        {a.titel}
                      </p>
                      <p className="mt-0.5 text-[11.5px] leading-snug" style={{ color: C.muted }}>
                        {a.detail}
                      </p>
                      <button
                        onClick={() => onGo(w ? "verificatie" : "marktplaats")}
                        className={`mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold transition-colors ${RING}`}
                        style={{ color }}
                      >
                        {a.cta} <ChevronRight size={13} strokeWidth={2.6} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      {/* Kleine matches-preview met select-interactie */}
      <Panel className="p-4">
        <h3
          className="mb-3 flex items-center gap-2 text-[13px] font-semibold"
          style={{ color: C.fg }}
        >
          <Star size={14} strokeWidth={2.2} color={C.amber} aria-hidden="true" /> Snelkoppelingen
        </h3>
        <div className="flex flex-wrap gap-2">
          {OPDRACHTEN.map((o) => (
            <button
              key={o.id}
              onClick={() => {
                onSelect(o.id);
                onGo("marktplaats");
              }}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] font-medium transition-colors hover:-translate-y-0.5 ${RING}`}
              style={{ color: C.fg, background: "rgba(0,0,0,0.3)", border: `1px solid ${C.line}` }}
            >
              <span className="tabular-nums" style={{ ...mono, color: C.amber }}>
                {o.match}%
              </span>
              {o.plaats}
            </button>
          ))}
        </div>
      </Panel>
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
  const [chip, setChip] = useState<string>("Alle");
  const chips = ["Alle", "BIG", "Avond", "GGZ", "Dagdienst"];
  const filtered = OPDRACHTEN.filter((o) => {
    const matchQ =
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase());
    const matchChip =
      chip === "Alle" || o.tags.some((t) => t.toLowerCase().includes(chip.toLowerCase()));
    return matchQ && matchChip;
  });
  const sel = filtered.find((o) => o.id === activeId) ?? filtered[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Kicker>De markt</Kicker>
        <Title>Open opdrachten</Title>
      </div>

      <div className="space-y-3">
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: C.panelSolid, border: `1px solid ${C.line}`, boxShadow: GLOW }}
        >
          <Search size={16} strokeWidth={2.2} color={C.amber} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#8f7452]"
            style={{ ...body, color: C.fg }}
          />
          <span
            className="shrink-0 text-[11px] font-semibold tabular-nums"
            style={{ ...mono, color: C.faint }}
          >
            {filtered.length}/{OPDRACHTEN.length}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ ...mono, color: C.faint }}
          >
            <Filter size={12} strokeWidth={2.4} aria-hidden="true" /> Filter
          </span>
          {chips.map((c) => {
            const on = c === chip;
            return (
              <button
                key={c}
                onClick={() => setChip(c)}
                aria-pressed={on}
                className={`rounded-full px-3 py-1 text-[11.5px] font-medium transition-colors ${RING}`}
                style={{
                  color: on ? C.night : C.muted,
                  background: on ? C.amber : "rgba(0,0,0,0.3)",
                  border: `1px solid ${on ? C.amber : C.line}`,
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel className="p-12 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "rgba(0,0,0,0.34)", border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Store size={24} strokeWidth={2} color={C.amber} />
          </span>
          <p className="mt-4 text-[18px] font-semibold" style={{ ...display, color: C.fg }}>
            Geen kraam open
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12px]" style={{ color: C.muted }}>
            Geen match past bij deze zoekopdracht. Verruim je zoektocht of wis het filter.
          </p>
          <button
            onClick={() => {
              setQ("");
              setChip("Alle");
            }}
            className={`mt-5 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors ${RING}`}
            style={{ color: C.night, background: C.amber }}
          >
            Filters wissen
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
                  className={`w-full rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 ${RING}`}
                  style={{
                    background: C.panel,
                    border: `1px solid ${on ? `${C.amber}88` : C.line}`,
                    boxShadow: on ? `0 0 32px -8px ${C.amber}` : GLOW,
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    <ScoreOrb value={o.match} size={54} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[10px] font-semibold"
                        style={{ ...mono, color: C.faint }}
                      >
                        <span className="uppercase tracking-[0.12em]">{o.id}</span>
                        {on && <span style={{ color: C.amber }}>· geselecteerd</span>}
                      </div>
                      <p
                        className="truncate text-[15px] font-semibold"
                        style={{ ...display, color: C.fg }}
                      >
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={12} strokeWidth={2.2} aria-hidden="true" /> {o.opdrachtgever}{" "}
                        · {o.plaats} · {o.tarief}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                            style={{
                              color: C.amberSoft,
                              background: "rgba(255,180,84,0.09)",
                              border: `1px solid ${C.line}`,
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
              <Panel glow="rgba(255,180,84,0.35)">
                <div
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{ ...mono, color: C.amber }}
                  >
                    {sel.id}
                  </span>
                  <Lamp size={15} strokeWidth={2.2} color={C.amber} aria-hidden="true" />
                </div>
                <div className="p-4">
                  <p
                    className="text-[16px] font-semibold leading-snug"
                    style={{ ...display, color: C.fg }}
                  >
                    {sel.titel}
                  </p>
                  <p className="mt-1 text-[12px]" style={{ ...body, color: C.muted }}>
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
                        style={{ background: "rgba(0,0,0,0.32)" }}
                      >
                        <dt
                          className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                          style={{ ...mono, color: C.faint }}
                        >
                          {m.l}
                        </dt>
                        <dd
                          className="mt-0.5 font-semibold tabular-nums"
                          style={{ ...mono, color: C.fg }}
                        >
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    onClick={() => onOpen(sel.id)}
                    className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 ${RING}`}
                    style={{ color: C.night, background: C.amber }}
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
      <Panel glow="rgba(255,180,84,0.4)">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <Kicker>{opdracht.id}</Kicker>
            <Title>{opdracht.titel}</Title>
            <p className="mt-2 text-[12.5px]" style={{ ...body, color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  style={{
                    ...body,
                    color: C.muted,
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${C.lineSoft}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <ScoreOrb value={opdracht.match} size={78} />
        </div>
        <div className="p-5 pt-0 sm:p-6 sm:pt-0">
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className={`flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[13px] font-semibold transition-colors disabled:opacity-90 ${RING}`}
            style={{
              color: C.night,
              background: state === "sent" ? C.jade : C.amber,
            }}
          >
            {state === "idle" && (
              <>
                <Send size={15} strokeWidth={2.6} aria-hidden="true" /> Reageer op opdracht
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
              style={{ ...mono, color: C.faint }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[18px] tabular-nums" style={{ ...display, color: C.fg }}>
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
          <Sparkles size={16} strokeWidth={2} color={C.amber} aria-hidden="true" />
          <h3 className="text-[16px] font-semibold" style={{ ...display, color: C.fg }}>
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.jade }}
            >
              <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.fg }}
                >
                  <Check
                    size={15}
                    strokeWidth={2.6}
                    color={C.jade}
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
              style={{ ...mono, color: C.warn }}
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
      </Panel>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const expiring = CREDENTIALS.find((c) => c.status === "EXPIRING");
  const stats = [
    { l: "Geverifieerd", v: `${verified}/${total}`, color: C.jade, Icon: ShieldCheck },
    { l: "Verloopt", v: "1", color: C.warn, Icon: AlertTriangle },
    { l: "In beoordeling", v: "1", color: C.amber, Icon: Clock },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker>Vertrouwen</Kicker>
        <Title>Certificaten</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Je bewijsstukken worden veilig en privé bewaard.
        </p>
      </div>

      {expiring && (
        <div
          className="flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
          style={{
            border: `1px solid ${C.warn}55`,
            background: "rgba(255,157,77,0.09)",
            boxShadow: GLOW,
          }}
          role="alert"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-xl"
            style={{ background: "rgba(0,0,0,0.34)", border: `1px solid ${C.warn}55` }}
          >
            <AlertTriangle size={18} strokeWidth={2.2} color={C.warn} aria-hidden="true" />
          </span>
          <p className="text-[13px] leading-snug" style={{ color: C.fg }}>
            <span className="font-semibold">{expiring.naam} verloopt binnenkort.</span>{" "}
            <span style={{ color: C.muted }}>
              {expiring.detail} — vernieuw op tijd om verifieerbaar te blijven.
            </span>
          </p>
          <button
            className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 ${RING}`}
            style={{ color: C.night, background: C.warn }}
          >
            Vernieuwen <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.Icon;
          return (
            <Panel key={s.l} className="flex items-center justify-between p-4">
              <div>
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {s.l}
                </p>
                <p className="mt-1.5 text-[24px] tabular-nums" style={{ ...display, color: C.fg }}>
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: `${s.color}1c`, border: `1px solid ${s.color}55` }}
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${m.color}18`, border: `1px solid ${m.color}55` }}
              >
                <Icon size={20} strokeWidth={2} color={m.color} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold" style={{ color: C.fg }}>
                  {c.naam}
                </p>
                <p className="text-[11.5px]" style={{ ...body, color: C.muted }}>
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
          const color = warn ? C.warn : C.jade;
          return (
            <Panel key={a.titel} className="flex items-stretch overflow-hidden">
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-2"
                style={{ background: `${color}14`, borderRight: `1px solid ${color}44` }}
              >
                <span className="text-[16px] tabular-nums" style={{ ...mono, color }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {warn ? (
                  <AlertTriangle size={15} strokeWidth={2.4} color={color} aria-hidden="true" />
                ) : (
                  <Lamp size={15} strokeWidth={2.2} color={color} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
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
                className={`m-3 shrink-0 self-center rounded-full px-4 py-2 text-[12px] font-semibold transition-colors ${RING}`}
                style={{
                  color: warn ? C.night : C.fg,
                  background: warn ? C.warn : "rgba(0,0,0,0.3)",
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
        style={{ background: "rgba(79,214,160,0.08)", border: `1px solid ${C.jade}44` }}
      >
        <Check size={18} strokeWidth={2.4} color={C.jade} aria-hidden="true" />
        <p className="text-[12.5px]" style={{ color: C.muted }}>
          Verder is alles bijgewerkt. Nieuwe kansen verschijnen hier vanzelf.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusColor: Record<string, string> = {
    Betaald: C.jade,
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
          <Kicker>Kassa</Kicker>
          <Title>Facturen</Title>
        </div>
        <button
          className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 ${RING}`}
          style={{ color: C.night, background: C.amber }}
        >
          <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Panel className="p-5" glow="rgba(79,214,160,0.3)">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.faint }}
          >
            Ontvangen
          </p>
          <p className="mt-2 text-[22px] tabular-nums" style={{ ...display, color: C.jade }}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Panel>
        <Panel className="p-5" glow="rgba(255,157,77,0.3)">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.faint }}
          >
            Openstaand
          </p>
          <p className="mt-2 text-[22px] tabular-nums" style={{ ...display, color: C.warn }}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </Panel>
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
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
                    className="p-4 text-right text-[13px] tabular-nums"
                    style={{ ...mono, color: C.fg }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                        aria-hidden="true"
                      />
                      <span className="text-[11.5px] font-semibold" style={{ ...body, color }}>
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
