"use client";

// Concept 80 — "Terrazzo" · gespikkeld terrazzo-steen oppervlak.
// Warm kalksteen-crème vlakken met donkerbruine tekst, terracotta accent en speelse
// pastel-confetti-spikkels (salie, oker, klei, hemelblauw). De steen-textuur is een
// DETERMINISTISCHE SVG: spikkelposities/kleuren komen uit een vaste index-formule
// (geen random op render). Zacht, tactiel, premium-speels, Italiaans-modern; data blijft
// messcherp leesbaar op de stenen vlakken. Tegels liften subtiel bij hover.
// Palet: crème #f3efe6, bruin #2a2620, terracotta #e6683c + salie/oker/klei/hemelblauw.
// Fonts: --font-lab-bricolage (display) + --font-lab-inter (body).

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
  Sparkles,
  Inbox,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

/* ---------- Palet & typografie ---------- */

const C = {
  cream: "#f3efe6",
  creamAlt: "#efe9dd",
  stone: "#faf7f0",
  ink: "#2a2620",
  muted: "#7c7264",
  faint: "#a89a86",
  terracotta: "#e6683c",
  terracottaDeep: "#c2481f",
  sage: "#6f8f6b",
  ochre: "#c79320",
  clay: "#b45c3e",
  sky: "#5f8fb8",
  line: "rgba(42,38,32,0.12)",
  lineSoft: "rgba(42,38,32,0.07)",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const body = { fontFamily: "var(--font-lab-inter)" };

const SOFT = "0 1px 2px rgba(42,38,32,0.04), 0 14px 34px -22px rgba(42,38,32,0.35)";

// Confetti-spikkelkleuren van het terrazzo-steen.
const CHIPS = [C.terracotta, C.sage, C.ochre, C.clay, C.sky, "#d98b6a", "#9bb5cf", "#c9b98f"];

/* ---------- Terrazzo-textuur (deterministisch — vaste index-formule) ---------- */

// Pure, deterministische hash op basis van index (geen Math.random / geen Date).
function h(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

type Speckle = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rot: number;
  fill: string;
  op: number;
};

function speckles(count: number, salt: number): Speckle[] {
  const out: Speckle[] = [];
  for (let i = 0; i < count; i++) {
    const chip = CHIPS[Math.floor(h(i, salt) * CHIPS.length) % CHIPS.length] ?? C.terracotta;
    out.push({
      cx: h(i, salt + 1) * 100,
      cy: h(i, salt + 2) * 100,
      rx: 0.5 + h(i, salt + 3) * 1.7,
      ry: 0.5 + h(i, salt + 4) * 1.5,
      rot: h(i, salt + 5) * 180,
      fill: chip,
      op: 0.5 + h(i, salt + 6) * 0.45,
    });
  }
  return out;
}

// Vaste spikkel-sets (buiten render berekend → identiek bij elke render).
const BG_SPECKLES = speckles(120, 3);

function Terrazzo({
  salt,
  count = 26,
  opacity = 1,
}: {
  salt: number;
  count?: number;
  opacity?: number;
}) {
  // useMemo op vaste inputs → stabiel en deterministisch, geen herberekening bij re-render.
  const chips = useMemo(() => speckles(count, salt), [count, salt]);
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ opacity }}
    >
      {chips.map((s, i) => (
        <ellipse
          key={i}
          cx={s.cx}
          cy={s.cy}
          rx={s.rx}
          ry={s.ry}
          fill={s.fill}
          opacity={s.op}
          transform={`rotate(${s.rot} ${s.cx} ${s.cy})`}
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
      return { label: "Geverifieerd", color: C.sage, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.ochre, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", color: C.terracottaDeep, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.clay, Icon: XCircle };
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
      className="text-[10.5px] font-semibold uppercase tracking-[0.24em]"
      style={{ ...body, color: C.terracottaDeep }}
    >
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-1.5 text-[27px] leading-[1.02] tracking-[-0.015em] sm:text-[34px]"
      style={{ ...display, color: C.ink }}
    >
      {children}
    </h1>
  );
}

// Stenen paneel met terrazzo-textuur.
function Tile({
  children,
  className = "",
  salt,
  count = 22,
}: {
  children: React.ReactNode;
  className?: string;
  salt: number;
  count?: number;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ background: C.stone, border: `1px solid ${C.line}`, boxShadow: SOFT }}
    >
      <Terrazzo salt={salt} count={count} opacity={0.5} />
      <div className="relative">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...body, color: "#fff", background: m.color }}
    >
      <Icon size={13} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Sparkline met zachte terracotta-lijn.
function Spark({ data, color = C.terracotta }: { data: number[]; color?: string }) {
  const w = 96;
  const hgt = 30;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = hgt - ((v - min) / span) * (hgt - 4) - 2;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={hgt} viewBox={`0 0 ${w} ${hgt}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.4" fill={color} />}
    </svg>
  );
}

// Ronde terrazzo-score-schijf.
function ScoreCoin({ value, size = 48 }: { value: number; size?: number }) {
  const strong = value >= 90;
  const color = strong ? C.terracotta : C.sage;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        background: `${color}1c`,
        border: `1.5px solid ${color}`,
      }}
      aria-hidden="true"
    >
      <span className="text-[14px] font-semibold tabular-nums" style={{ ...display, color }}>
        {value}
      </span>
    </span>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept80() {
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
      style={{ ...body, color: C.ink, background: C.cream }}
    >
      {/* Fijne terrazzo-grond over het hele oppervlak */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        style={{ opacity: 0.35 }}
      >
        {BG_SPECKLES.map((s, i) => (
          <ellipse
            key={i}
            cx={s.cx}
            cy={s.cy}
            rx={s.rx * 0.8}
            ry={s.ry * 0.8}
            fill={s.fill}
            opacity={s.op * 0.6}
            transform={`rotate(${s.rot} ${s.cx} ${s.cy})`}
          />
        ))}
      </svg>

      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk */}
        <aside
          className="relative shrink-0 overflow-hidden md:w-[240px]"
          style={{ borderRight: `1px solid ${C.line}`, background: C.creamAlt }}
        >
          <Terrazzo salt={11} count={40} opacity={0.4} />
          <div className="relative flex h-full flex-col">
            <div
              className="flex items-center gap-3 p-5"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: C.terracotta }}
                aria-hidden="true"
              >
                <Sparkles size={18} strokeWidth={2.2} color="#fff" />
              </span>
              <div className="leading-tight">
                <div className="text-[18px]" style={{ ...display, color: C.ink }}>
                  Terrazzo
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
                    className="relative flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6683c] md:w-full"
                    style={{
                      color: on ? C.ink : C.muted,
                      background: on ? C.stone : "transparent",
                      border: on ? `1px solid ${C.line}` : "1px solid transparent",
                      boxShadow: on ? SOFT : "none",
                    }}
                  >
                    {on && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: C.terracotta }}
                        aria-hidden="true"
                      />
                    )}
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </nav>

            <div
              className="hidden items-center gap-3 p-4 md:flex"
              style={{ borderTop: `1px solid ${C.lineSoft}`, background: C.stone }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
                style={{ ...display, color: "#fff", background: C.sage }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold" style={{ color: C.ink }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[10.5px] font-semibold"
                  style={{ color: C.sage }}
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
  const [feed, setFeed] = useState<"ok" | "error">("ok");
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Vandaag</Kicker>
          <Title>Goedemorgen, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-2 text-[13.5px]" style={{ color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-semibold"
          style={{ color: "#fff", background: C.terracotta }}
        >
          <Sparkles size={14} strokeWidth={2.4} aria-hidden="true" /> {OPDRACHTEN.length} nieuwe
          matches
        </div>
      </header>

      {warn && (
        <div
          className="relative flex flex-col gap-3 overflow-hidden rounded-2xl p-4 sm:flex-row sm:items-center"
          style={{ border: `1px solid ${C.terracotta}55`, background: "#fbeee7", boxShadow: SOFT }}
          role="alert"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-xl"
            style={{ background: C.terracotta }}
          >
            <AlertTriangle size={18} strokeWidth={2.4} color="#fff" aria-hidden="true" />
          </span>
          <p className="text-[13px] leading-snug" style={{ color: C.ink }}>
            <span className="font-semibold">{warn.titel}.</span>{" "}
            <span style={{ color: C.muted }}>{warn.detail}</span>
          </p>
          <button
            onClick={() => onGo("verificatie")}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6683c]"
            style={{ background: C.terracottaDeep }}
          >
            {warn.cta} <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, idx) => (
          <Tile
            key={k.label}
            salt={20 + idx}
            count={16}
            className="flex flex-col justify-between p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-semibold leading-tight" style={{ color: C.muted }}>
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                style={{ color: k.up ? C.sage : C.terracottaDeep }}
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
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </p>
            <div className="mt-2">
              <Spark data={k.spark} color={k.up ? C.terracotta : C.ochre} />
            </div>
          </Tile>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Tile salt={31} count={30} className="lg:col-span-2">
          <div
            className="flex items-center justify-between p-4"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <h3 className="text-[17px]" style={{ ...display, color: C.ink }}>
              Beste matches
            </h3>
            <button
              onClick={() => onGo("marktplaats")}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6683c]"
              style={{ color: C.terracottaDeep }}
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
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: C.creamAlt }}
                >
                  <span
                    className="h-11 w-11 animate-pulse rounded-full"
                    style={{ background: "rgba(42,38,32,0.08)" }}
                  />
                  <div className="flex-1 space-y-2">
                    <span
                      className="block h-3 w-2/3 animate-pulse rounded"
                      style={{ background: "rgba(42,38,32,0.08)" }}
                    />
                    <span
                      className="block h-2.5 w-1/2 animate-pulse rounded"
                      style={{ background: "rgba(42,38,32,0.08)" }}
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
                    className="flex w-full items-center gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-[rgba(230,104,60,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e6683c]"
                  >
                    <ScoreCoin value={o.match} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14px] font-semibold"
                        style={{ color: C.ink }}
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
        </Tile>

        <div className="space-y-5">
          <Tile salt={44} count={18}>
            <div className="p-4" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
              <h3 className="text-[17px]" style={{ ...display, color: C.ink }}>
                Certificaten
              </h3>
            </div>
            <div className="p-2">
              {CREDENTIALS.map((c) => {
                const m = credMeta(c.status);
                const Icon = m.Icon;
                return (
                  <div key={c.naam} className="flex items-center gap-2.5 rounded-lg px-2 py-2.5">
                    <Icon size={15} strokeWidth={2.4} color={m.color} aria-hidden="true" />
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px] font-medium"
                      style={{ color: C.ink }}
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
          </Tile>

          {/* Berichten — met error/empty variant */}
          <Tile salt={52} count={16}>
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <h3
                className="flex items-center gap-2 text-[17px]"
                style={{ ...display, color: C.ink }}
              >
                <Inbox size={16} strokeWidth={2} color={C.sage} aria-hidden="true" /> Berichten
              </h3>
              <button
                onClick={() => setFeed(feed === "ok" ? "error" : "ok")}
                aria-label="Berichten verversen"
                className="rounded-full p-1.5 transition-colors hover:bg-[rgba(42,38,32,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6683c]"
                style={{ color: C.muted }}
              >
                <RotateCw size={14} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>
            {feed === "error" ? (
              <div className="flex flex-col items-center gap-2 p-6 text-center" role="alert">
                <XCircle size={22} strokeWidth={2} color={C.clay} aria-hidden="true" />
                <p className="text-[12.5px] font-semibold" style={{ color: C.ink }}>
                  Berichten niet geladen
                </p>
                <button
                  onClick={() => setFeed("ok")}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6683c]"
                  style={{ background: C.terracotta }}
                >
                  <RotateCw size={12} strokeWidth={2.6} aria-hidden="true" /> Opnieuw
                </button>
              </div>
            ) : (
              <div className="p-2">
                {BERICHTEN.slice(0, 2).map((b) => (
                  <div key={b.van} className="flex items-center gap-3 rounded-lg px-2 py-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                      style={{ ...display, color: "#fff", background: C.sky }}
                      aria-hidden="true"
                    >
                      {b.initialen}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold" style={{ color: C.ink }}>
                        {b.van}
                      </p>
                      <p className="truncate text-[11px]" style={{ color: C.muted }}>
                        {b.preview}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Tile>
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

      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{ background: C.stone, border: `1px solid ${C.line}`, boxShadow: SOFT }}
      >
        <Search size={16} strokeWidth={2.2} color={C.terracotta} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#a89a86]"
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
        <Tile salt={60} count={26} className="p-12 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.creamAlt, border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Search size={24} strokeWidth={2} color={C.terracotta} />
          </span>
          <p className="mt-4 text-[20px]" style={{ ...display, color: C.ink }}>
            Niets gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen opdracht past bij &quot;{q}&quot;. Verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 rounded-full px-4 py-2 text-[12.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6683c]"
            style={{ background: C.terracotta }}
          >
            Zoekopdracht wissen
          </button>
        </Tile>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3.5">
            {filtered.map((o, idx) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className="group relative w-full overflow-hidden rounded-2xl p-4 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6683c]"
                  style={{
                    background: C.stone,
                    border: `1.5px solid ${on ? C.terracotta : C.line}`,
                    boxShadow: SOFT,
                  }}
                >
                  <Terrazzo salt={70 + idx} count={20} opacity={0.55} />
                  <div className="relative flex items-start gap-3.5">
                    <ScoreCoin value={o.match} size={52} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[10.5px] font-semibold"
                        style={{ color: C.faint }}
                      >
                        <span className="uppercase tracking-[0.12em]">{o.id}</span>
                        {on && <span style={{ color: C.terracottaDeep }}>· geselecteerd</span>}
                      </div>
                      <p className="truncate text-[15px] font-semibold" style={{ color: C.ink }}>
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
                        {o.redenen.plus.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                            style={{ color: C.sage, background: `${C.sage}18` }}
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
              <Tile salt={80} count={26}>
                <div
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: C.terracottaDeep }}
                  >
                    {sel.id}
                  </span>
                  <ArrowUpRight
                    size={16}
                    strokeWidth={2.2}
                    color={C.terracotta}
                    aria-hidden="true"
                  />
                </div>
                <div className="p-4">
                  <p className="text-[18px] leading-snug" style={{ ...display, color: C.ink }}>
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
                        style={{ background: C.creamAlt }}
                      >
                        <dt
                          className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                          style={{ color: C.faint }}
                        >
                          {m.l}
                        </dt>
                        <dd className="mt-0.5 font-semibold tabular-nums" style={{ color: C.ink }}>
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    onClick={() => onOpen(sel.id)}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[12.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6683c]"
                    style={{ background: C.terracotta }}
                  >
                    Open opdracht <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
                  </button>
                </div>
              </Tile>
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
      <Tile salt={90} count={34}>
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
                    background: C.creamAlt,
                    border: `1px solid ${C.lineSoft}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <span
            className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full"
            style={{
              background: `${opdracht.match >= 90 ? C.terracotta : C.sage}16`,
              border: `2px solid ${opdracht.match >= 90 ? C.terracotta : C.sage}`,
            }}
            aria-hidden="true"
          >
            <span
              className="text-[28px] tabular-nums leading-none"
              style={{ ...display, color: opdracht.match >= 90 ? C.terracotta : C.sage }}
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
            className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[13px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6683c] disabled:opacity-90"
            style={{ background: state === "sent" ? C.sage : C.terracotta }}
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
      </Tile>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, idx) => (
          <Tile key={m.l} salt={100 + idx} count={14} className="p-4">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[19px] tabular-nums" style={{ ...display, color: C.ink }}>
              {m.v}
            </p>
          </Tile>
        ))}
      </div>

      <Tile salt={110} count={28}>
        <div
          className="flex items-center gap-2 p-4"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          <Sparkles size={16} strokeWidth={2} color={C.terracotta} aria-hidden="true" />
          <h3 className="text-[18px]" style={{ ...display, color: C.ink }}>
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.sage }}
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
                    color={C.sage}
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
              style={{ color: C.terracottaDeep }}
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
                    color={C.terracottaDeep}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Tile>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const stats = [
    { l: "Geverifieerd", v: `${verified}/${total}`, color: C.sage, Icon: ShieldCheck },
    { l: "Verloopt bijna", v: "1", color: C.terracottaDeep, Icon: AlertTriangle },
    { l: "In beoordeling", v: "1", color: C.ochre, Icon: Clock },
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
        {stats.map((s, idx) => {
          const Icon = s.Icon;
          return (
            <Tile
              key={s.l}
              salt={120 + idx}
              count={14}
              className="flex items-center justify-between p-4"
            >
              <div>
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: C.faint }}
                >
                  {s.l}
                </p>
                <p className="mt-1.5 text-[26px] tabular-nums" style={{ ...display, color: C.ink }}>
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: `${s.color}1c`, border: `1.5px solid ${s.color}` }}
              >
                <Icon size={20} strokeWidth={2} color={s.color} aria-hidden="true" />
              </span>
            </Tile>
          );
        })}
      </div>

      <Tile salt={130} count={30}>
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
      </Tile>
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
          const color = warn ? C.terracotta : C.sage;
          return (
            <Tile key={a.titel} salt={140 + i} count={18} className="flex items-stretch">
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-2 rounded-l-2xl"
                style={{ background: `${color}16`, borderRight: `1px solid ${color}44` }}
              >
                <span className="text-[18px] tabular-nums" style={{ ...display, color }}>
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
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
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
                className="m-3 shrink-0 self-center rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6683c]"
                style={{
                  color: warn ? "#fff" : C.ink,
                  background: warn ? C.terracotta : C.creamAlt,
                  border: warn ? "none" : `1px solid ${C.line}`,
                }}
              >
                {a.cta}
              </button>
            </Tile>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 rounded-2xl p-4"
        style={{ background: `${C.sage}14`, border: `1px solid ${C.sage}44` }}
      >
        <Check size={18} strokeWidth={2.4} color={C.sage} aria-hidden="true" />
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
    Betaald: C.sage,
    Openstaand: C.terracottaDeep,
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
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6683c]"
          style={{ background: C.terracotta }}
        >
          <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Tile salt={150} count={14} className="p-5">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: C.faint }}
          >
            Ontvangen
          </p>
          <p className="mt-2 text-[24px] tabular-nums" style={{ ...display, color: C.sage }}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Tile>
        <Tile salt={151} count={14} className="p-5">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: C.faint }}
          >
            Openstaand
          </p>
          <p
            className="mt-2 text-[24px] tabular-nums"
            style={{ ...display, color: C.terracottaDeep }}
          >
            € {open.toLocaleString("nl-NL")}
          </p>
        </Tile>
      </div>

      <Tile salt={160} count={30} className="overflow-x-auto">
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
                    style={{ color: C.ink }}
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
                    className="p-4 text-right text-[14px] tabular-nums"
                    style={{ ...display, color: C.ink }}
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
      </Tile>
    </div>
  );
}
