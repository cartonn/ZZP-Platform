"use client";

// Concept 71 — "Vertrek" · split-flap / Solari-vertrekbord (kinetisch mechanisch klapbord).
// Zoals een treinstation of luchthaven: een diep antraciet bord waarop opdrachten, statussen en
// getallen als mechanische split-flap-rijen verschijnen. Bij mount "rollen" labels en cijfers
// deterministisch naar hun eindwaarde door de flap-alfabet-cellen te doorlopen (useEffect +
// setInterval met vaste doelstring en per-cel stagger — geen random). Monospace-cijfers.
// Palet: bord #16181d / #1b1d24, ivoor/krijt-wit #f0ead6, amber-accent #f4b740.
// Fonts: --font-lab-geist (body) + --font-lab-geist-mono (bord/cijfers). Deterministisch.

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
  Train,
  ChevronRight,
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
  board: "#16181d",
  boardAlt: "#1b1d24",
  panel: "#1f222a",
  cellTop: "#26282f",
  cellBot: "#171922",
  ivory: "#f0ead6",
  muted: "#9a9788",
  faint: "#6f6d63",
  amber: "#f4b740",
  green: "#7fd18a",
  red: "#e8837a",
  line: "rgba(240,234,214,0.12)",
  lineSoft: "rgba(240,234,214,0.07)",
};

const body = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

const PANEL_SHADOW = "inset 0 0 0 1px rgba(240,234,214,0.05), 0 18px 40px -28px rgba(0,0,0,0.8)";

/* ---------- Split-flap kinetiek (deterministisch, geen random) ---------- */

const FLAP_ALPHABET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:%€/+-,·";

function flapIndex(ch: string): number {
  const i = FLAP_ALPHABET.indexOf(ch.toUpperCase());
  return i < 0 ? 0 : i;
}

// Elke cel klapt tick-voor-tick vooruit door het alfabet tot de doelwaarde; posities starten met een
// vaste stagger zodat het bord van links naar rechts "leest". Volledig deterministisch.
function useSplitFlap(target: string, speed = 42, stagger = 2): string {
  const [display, setDisplay] = useState<string>(() => " ".repeat(target.length));
  useEffect(() => {
    const targetIdx = target.split("").map(flapIndex);
    let cur = target.split("").map(() => 0);
    let tick = 0;
    const id = window.setInterval(() => {
      tick += 1;
      let done = true;
      cur = cur.map((c, p) => {
        const goal = targetIdx[p] ?? 0;
        if (tick < p * stagger) {
          if (c !== goal) done = false;
          return c;
        }
        if (c === goal) return c;
        done = false;
        return (c + 1) % FLAP_ALPHABET.length;
      });
      setDisplay(cur.map((c) => FLAP_ALPHABET[c] ?? " ").join(""));
      if (done) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [target, speed, stagger]);
  return display;
}

function Flap({ ch, tone = C.amber, size = 15 }: { ch: string; tone?: string; size?: number }) {
  return (
    <span
      className="relative inline-flex items-center justify-center overflow-hidden rounded-[3px] tabular-nums"
      style={{
        ...mono,
        width: `${size * 0.68}px`,
        height: `${size * 1.32}px`,
        fontSize: `${size}px`,
        lineHeight: 1,
        color: tone,
        background: `linear-gradient(${C.cellTop}, ${C.cellBot})`,
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.04)",
      }}
      aria-hidden="true"
    >
      <span
        className="pointer-events-none absolute left-0 right-0 top-1/2 h-px -translate-y-1/2"
        style={{ background: "rgba(0,0,0,0.5)" }}
      />
      {ch === " " ? " " : ch}
    </span>
  );
}

function SplitFlap({
  value,
  tone = C.amber,
  size = 15,
  speed,
  className = "",
}: {
  value: string;
  tone?: string;
  size?: number;
  speed?: number;
  className?: string;
}) {
  const disp = useSplitFlap(value, speed);
  return (
    <span className={`inline-flex gap-[2px] ${className}`} aria-label={value} role="text">
      {disp.split("").map((ch, i) => (
        <Flap key={i} ch={ch} tone={tone} size={size} />
      ))}
    </span>
  );
}

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.green, Icon: ShieldCheck };
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

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-[0.34em]"
      style={{ ...mono, color: C.amber }}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
      style={{
        ...mono,
        color: m.color,
        background: "rgba(0,0,0,0.34)",
        border: `1px solid ${m.color}44`,
      }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function Spark({ data, color = C.amber }: { data: number[]; color?: string }) {
  const w = 90;
  const h = 26;
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
  const last = pts[pts.length - 1] ?? ([0, 0] as const);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2" fill={color} />
    </svg>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}`, boxShadow: PANEL_SHADOW }}
    >
      {children}
    </div>
  );
}

// Kleine flap-rij die als "gate"/track-indicator werkt.
function GateTag({ value, tone = C.ivory }: { value: string; tone?: string }) {
  return <SplitFlap value={value} tone={tone} size={12} />;
}

/* ---------- Hoofdcomponent ---------- */

export function Concept71() {
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
        background: `radial-gradient(140% 100% at 50% -10%, ${C.boardAlt}, ${C.board} 70%)`,
      }}
    >
      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk — mechanisch bedieningspaneel */}
        <aside
          className="shrink-0 md:w-[236px]"
          style={{ borderRight: `1px solid ${C.line}`, background: "rgba(0,0,0,0.22)" }}
        >
          <div className="flex h-full flex-col">
            <div
              className="flex items-center gap-3 p-5"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${C.line}` }}
                aria-hidden="true"
              >
                <Train size={18} strokeWidth={2} color={C.amber} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[15px] font-semibold tracking-[0.02em]"
                  style={{ color: C.ivory }}
                >
                  Vertrek
                </div>
                <div
                  className="text-[9px] font-semibold uppercase tracking-[0.24em]"
                  style={{ ...mono, color: C.faint }}
                >
                  Spoor · zorg
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
                    className="relative flex shrink-0 items-center gap-2.5 rounded-md px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4b740] md:w-full"
                    style={{
                      color: on ? C.board : C.muted,
                      background: on ? C.amber : "transparent",
                      ...(on ? mono : {}),
                      fontWeight: on ? 700 : 500,
                    }}
                  >
                    {on && <ChevronRight size={13} strokeWidth={3} aria-hidden="true" />}
                    <span className={on ? "uppercase tracking-[0.06em]" : ""}>{s.label}</span>
                  </button>
                );
              })}
            </nav>

            <div
              className="hidden items-center gap-3 p-4 md:flex"
              style={{ borderTop: `1px solid ${C.lineSoft}`, background: "rgba(0,0,0,0.28)" }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[12px] font-bold"
                style={{ ...mono, color: C.board, background: C.amber }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold" style={{ color: C.ivory }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[10px] font-semibold"
                  style={{ ...mono, color: C.green }}
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

/* ---------- Board-header + rij ---------- */

function BoardHeader({ cols }: { cols: string[] }) {
  return (
    <div
      className="grid items-center gap-3 px-4 py-2.5 text-[9.5px] font-semibold uppercase tracking-[0.16em]"
      style={{
        ...mono,
        color: C.faint,
        gridTemplateColumns: "56px 1fr auto auto",
        borderBottom: `1px solid ${C.lineSoft}`,
      }}
    >
      {cols.map((c, i) => (
        <span key={c} className={i >= 2 ? "text-right" : ""}>
          {c}
        </span>
      ))}
    </div>
  );
}

function DepartRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: (id?: string) => void }) {
  return (
    <button
      onClick={() => onOpen(opdracht.id)}
      className="grid w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[rgba(244,183,64,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f4b740]"
      style={{ gridTemplateColumns: "56px 1fr auto auto", borderTop: `1px solid ${C.lineSoft}` }}
    >
      <SplitFlap
        value={String(opdracht.match)}
        tone={opdracht.match >= 90 ? C.amber : C.ivory}
        size={15}
      />
      <span className="min-w-0">
        <span className="block truncate text-[13.5px] font-semibold" style={{ color: C.ivory }}>
          {opdracht.titel}
        </span>
        <span
          className="mt-0.5 flex items-center gap-1 truncate text-[11px]"
          style={{ ...mono, color: C.muted }}
        >
          <MapPin size={11} strokeWidth={2.2} aria-hidden="true" /> {opdracht.plaats} ·{" "}
          {opdracht.tarief}
        </span>
      </span>
      <span className="hidden sm:inline-flex">
        <GateTag value={opdracht.id.replace("OPD-", "")} tone={C.ivory} />
      </span>
      <ArrowUpRight size={16} strokeWidth={2.2} color={C.faint} aria-hidden="true" />
    </button>
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
    const t = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Vertrekhal</Kicker>
          <h1
            className="mt-2 text-[27px] font-semibold leading-none tracking-[-0.01em] sm:text-[32px]"
            style={{ color: C.ivory }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}
          </h1>
          <p className="mt-2 text-[13px]" style={{ ...mono, color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div
          className="flex items-center gap-3 rounded-md px-3.5 py-2"
          style={{ background: "rgba(0,0,0,0.34)", border: `1px solid ${C.line}` }}
        >
          <span
            className="text-[9px] font-semibold uppercase tracking-[0.2em]"
            style={{ ...mono, color: C.faint }}
          >
            Actuele tijd
          </span>
          <SplitFlap value="07:42" tone={C.amber} size={16} />
        </div>
      </header>

      {warn && (
        <div
          className="flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center"
          style={{
            border: `1px solid ${C.red}44`,
            background: "rgba(232,131,122,0.08)",
            boxShadow: PANEL_SHADOW,
          }}
          role="alert"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-md"
            style={{ background: "rgba(0,0,0,0.34)", border: `1px solid ${C.red}44` }}
          >
            <AlertTriangle size={18} strokeWidth={2.2} color={C.red} aria-hidden="true" />
          </span>
          <p className="text-[13px] leading-snug" style={{ color: C.ivory }}>
            <span className="font-semibold">{warn.titel}.</span>{" "}
            <span style={{ color: C.muted }}>{warn.detail}</span>
          </p>
          <button
            onClick={() => onGo("verificatie")}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-md px-3.5 py-2 text-[11.5px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4b740]"
            style={{ ...mono, color: C.board, background: C.amber }}
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
                className="text-[10px] font-semibold uppercase leading-tight tracking-[0.1em]"
                style={{ ...mono, color: C.muted }}
              >
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold tabular-nums"
                style={{ ...mono, color: k.up ? C.green : C.red }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} strokeWidth={2.6} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} strokeWidth={2.6} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <div className="mt-3">
              <SplitFlap value={k.value} tone={C.ivory} size={17} />
            </div>
            <div className="mt-2">
              <Spark data={k.spark} color={k.up ? C.amber : C.red} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel className="overflow-hidden lg:col-span-2">
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <h3
              className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.ivory }}
            >
              <Train size={14} strokeWidth={2.2} color={C.amber} aria-hidden="true" /> Vertrekstaat
            </h3>
            <button
              onClick={() => onGo("marktplaats")}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4b740]"
              style={{ ...mono, color: C.amber }}
            >
              Alle <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
          <BoardHeader cols={["Match", "Bestemming", "Spoor", ""]} />
          {loading ? (
            <div
              className="divide-y"
              style={{ borderColor: C.lineSoft }}
              role="status"
              aria-live="polite"
            >
              <span className="sr-only">Vertrekstaat wordt geladen…</span>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="grid items-center gap-3 px-4 py-3.5"
                  style={{ gridTemplateColumns: "56px 1fr auto" }}
                >
                  <span
                    className="h-6 w-10 animate-pulse rounded"
                    style={{ background: "rgba(240,234,214,0.08)" }}
                  />
                  <span
                    className="h-3 w-2/3 animate-pulse rounded"
                    style={{ background: "rgba(240,234,214,0.08)" }}
                  />
                  <span
                    className="h-4 w-12 animate-pulse rounded"
                    style={{ background: "rgba(240,234,214,0.08)" }}
                  />
                </div>
              ))}
            </div>
          ) : (
            OPDRACHTEN.map((o) => <DepartRow key={o.id} opdracht={o} onOpen={onOpen} />)
          )}
        </Panel>

        <div className="space-y-5">
          <Panel className="overflow-hidden">
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
              <h3
                className="text-[13px] font-bold uppercase tracking-[0.08em]"
                style={{ ...mono, color: C.ivory }}
              >
                Certificaten
              </h3>
            </div>
            <div className="p-2">
              {CREDENTIALS.map((c) => {
                const m = credMeta(c.status);
                const Icon = m.Icon;
                return (
                  <div key={c.naam} className="flex items-center gap-2.5 rounded px-2 py-2.5">
                    <Icon size={15} strokeWidth={2.2} color={m.color} aria-hidden="true" />
                    <span
                      className="min-w-0 flex-1 truncate text-[12px] font-medium"
                      style={{ color: C.ivory }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="text-[9.5px] font-semibold uppercase tracking-[0.06em]"
                      style={{ ...mono, color: m.color }}
                    >
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <h3
                className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.08em]"
                style={{ ...mono, color: C.ivory }}
              >
                <Inbox size={14} strokeWidth={2} color={C.amber} aria-hidden="true" /> Omroep
              </h3>
              <span
                className="rounded px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.06em]"
                style={{ ...mono, color: C.amber, background: "rgba(244,183,64,0.14)" }}
              >
                {BERICHTEN.filter((b) => b.ongelezen).length} nieuw
              </span>
            </div>
            <div className="p-2">
              {BERICHTEN.slice(0, 2).map((b) => (
                <div key={b.van} className="flex items-center gap-3 rounded px-2 py-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-[10px] font-bold"
                    style={{
                      ...mono,
                      color: C.ivory,
                      background: "rgba(0,0,0,0.34)",
                      border: `1px solid ${C.line}`,
                    }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold" style={{ color: C.ivory }}>
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
        <Kicker>Alle sporen</Kicker>
        <h1
          className="mt-2 text-[26px] font-semibold tracking-[-0.01em]"
          style={{ color: C.ivory }}
        >
          Open opdrachten
        </h1>
      </div>

      <div
        className="flex items-center gap-3 rounded-lg px-4 py-3"
        style={{ background: C.panel, border: `1px solid ${C.line}`, boxShadow: PANEL_SHADOW }}
      >
        <Search size={16} strokeWidth={2.2} color={C.amber} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#6f6d63]"
          style={{ ...mono, color: C.ivory }}
        />
        <span
          className="shrink-0 text-[11px] font-semibold tabular-nums"
          style={{ ...mono, color: C.faint }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Panel className="p-12 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-md"
            style={{ background: "rgba(0,0,0,0.34)", border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Search size={22} strokeWidth={2} color={C.amber} />
          </span>
          <p className="mt-4 text-[18px] font-semibold" style={{ color: C.ivory }}>
            Geen vertrek gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12px]" style={{ ...mono, color: C.muted }}>
            Geen opdracht past bij &quot;{q}&quot;. Verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 rounded-md px-4 py-2 text-[12px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4b740]"
            style={{ ...mono, color: C.board, background: C.amber }}
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
                  className="w-full rounded-lg p-4 text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4b740]"
                  style={{
                    background: C.panel,
                    border: `1px solid ${on ? `${C.amber}88` : C.line}`,
                    boxShadow: PANEL_SHADOW,
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex shrink-0 flex-col items-center gap-1">
                      <SplitFlap
                        value={String(o.match)}
                        tone={o.match >= 90 ? C.amber : C.ivory}
                        size={17}
                      />
                      <span
                        className="text-[8.5px] font-semibold uppercase tracking-[0.12em]"
                        style={{ ...mono, color: C.faint }}
                      >
                        match
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[9.5px] font-semibold uppercase tracking-[0.1em]"
                        style={{ ...mono, color: C.faint }}
                      >
                        <span>{o.id}</span>
                        {on && <span style={{ color: C.amber }}>· geselecteerd</span>}
                      </div>
                      <p
                        className="truncate text-[14.5px] font-semibold"
                        style={{ color: C.ivory }}
                      >
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 truncate text-[11px]"
                        style={{ ...mono, color: C.muted }}
                      >
                        <MapPin size={12} strokeWidth={2.2} aria-hidden="true" /> {o.opdrachtgever}{" "}
                        · {o.plaats} · {o.uren}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {o.redenen.plus.slice(0, 2).map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium"
                            style={{ color: C.green, background: "rgba(127,209,138,0.1)" }}
                          >
                            <Check size={10} strokeWidth={3} aria-hidden="true" /> {r}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.06em]"
                            style={{
                              ...mono,
                              color: C.muted,
                              background: "rgba(0,0,0,0.34)",
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
              <Panel>
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ ...mono, color: C.amber }}
                  >
                    {sel.id}
                  </span>
                  <SplitFlap value={String(sel.match)} tone={C.amber} size={14} />
                </div>
                <div className="p-4">
                  <p className="text-[16px] font-semibold leading-snug" style={{ color: C.ivory }}>
                    {sel.titel}
                  </p>
                  <p className="mt-1 text-[11.5px]" style={{ ...mono, color: C.muted }}>
                    {sel.opdrachtgever} · {sel.plaats}
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-2.5 text-[12px]">
                    {[
                      { l: "Tarief", v: sel.tarief },
                      { l: "Omvang", v: sel.uren },
                      { l: "Start", v: sel.start },
                      { l: "Match", v: `${sel.match}%` },
                    ].map((m) => (
                      <div
                        key={m.l}
                        className="rounded-md p-2.5"
                        style={{ background: "rgba(0,0,0,0.28)" }}
                      >
                        <dt
                          className="text-[9px] font-semibold uppercase tracking-[0.1em]"
                          style={{ ...mono, color: C.faint }}
                        >
                          {m.l}
                        </dt>
                        <dd
                          className="mt-0.5 font-semibold tabular-nums"
                          style={{ ...mono, color: C.ivory }}
                        >
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    onClick={() => onOpen(sel.id)}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4b740]"
                    style={{ ...mono, color: C.board, background: C.amber }}
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
            <h1
              className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.01em]"
              style={{ color: C.ivory }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[12px]" style={{ ...mono, color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded px-2.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.06em]"
                  style={{
                    ...mono,
                    color: C.muted,
                    background: "rgba(0,0,0,0.34)",
                    border: `1px solid ${C.lineSoft}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <SplitFlap
              value={`${opdracht.match}%`}
              tone={opdracht.match >= 90 ? C.amber : C.green}
              size={22}
            />
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.faint }}
            >
              match-score
            </span>
          </div>
        </div>
        <div className="p-5 pt-0 sm:p-6 sm:pt-0">
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="flex w-full items-center justify-center gap-2 rounded-md px-5 py-3 text-[12.5px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4b740] disabled:opacity-90"
            style={{ ...mono, color: C.board, background: state === "sent" ? C.green : C.amber }}
          >
            {state === "idle" && (
              <>
                <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" /> Reageer op opdracht
              </>
            )}
            {state === "sending" && (
              <>
                <RotateCw size={15} strokeWidth={2.6} className="animate-spin" aria-hidden="true" />{" "}
                Versturen…
              </>
            )}
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
              className="text-[9px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.faint }}
            >
              {m.l}
            </p>
            <p
              className="mt-2 text-[15px] font-semibold tabular-nums"
              style={{ ...mono, color: C.ivory }}
            >
              {m.v}
            </p>
          </Panel>
        ))}
      </div>

      <Panel>
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
          <h3
            className="text-[13px] font-bold uppercase tracking-[0.08em]"
            style={{ ...mono, color: C.ivory }}
          >
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.green }}
            >
              <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
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
                    strokeWidth={2.6}
                    color={C.green}
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
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.red }}
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
    { l: "Geverifieerd", v: `${verified}/${total}`, color: C.green, Icon: ShieldCheck },
    { l: "Verloopt bijna", v: "1", color: C.red, Icon: AlertTriangle },
    { l: "In beoordeling", v: "1", color: C.amber, Icon: Clock },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker>Verificatie</Kicker>
        <h1
          className="mt-2 text-[26px] font-semibold tracking-[-0.01em]"
          style={{ color: C.ivory }}
        >
          Certificaten
        </h1>
        <p className="mt-2 text-[12.5px]" style={{ ...mono, color: C.muted }}>
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
                  className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {s.l}
                </p>
                <div className="mt-2">
                  <SplitFlap value={s.v} tone={s.color} size={18} />
                </div>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-md"
                style={{ background: `${s.color}1c`, border: `1px solid ${s.color}44` }}
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
                style={{ background: `${m.color}18`, border: `1px solid ${m.color}44` }}
              >
                <Icon size={20} strokeWidth={2} color={m.color} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold" style={{ color: C.ivory }}>
                  {c.naam}
                </p>
                <p className="text-[11.5px]" style={{ ...mono, color: C.muted }}>
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
        <h1
          className="mt-2 text-[26px] font-semibold tracking-[-0.01em]"
          style={{ color: C.ivory }}
        >
          Volgende acties
        </h1>
        <p className="mt-2 text-[12.5px]" style={{ ...mono, color: C.muted }}>
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
                style={{ background: `${color}16`, borderRight: `1px solid ${color}44` }}
              >
                <SplitFlap value={String(i + 1).padStart(2, "0")} tone={color} size={16} />
                {warn ? (
                  <AlertTriangle size={14} strokeWidth={2.4} color={color} aria-hidden="true" />
                ) : (
                  <ArrowUpRight size={14} strokeWidth={2.4} color={color} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[9.5px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-1 text-[14px] font-semibold" style={{ color: C.ivory }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className="m-3 shrink-0 self-center rounded-md px-4 py-2 text-[11px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4b740]"
                style={{
                  ...mono,
                  color: warn ? C.board : C.ivory,
                  background: warn ? C.amber : "rgba(0,0,0,0.34)",
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
        style={{ background: "rgba(127,209,138,0.09)", border: `1px solid ${C.green}44` }}
      >
        <Check size={18} strokeWidth={2.4} color={C.green} aria-hidden="true" />
        <p className="text-[12px]" style={{ color: C.muted }}>
          Verder is alles bijgewerkt. Nieuwe acties verschijnen hier vanzelf op het bord.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusMeta: Record<string, { color: string; Icon: typeof Check }> = {
    Betaald: { color: C.green, Icon: Check },
    Openstaand: { color: C.red, Icon: Clock },
    Concept: { color: C.faint, Icon: RotateCw },
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
          <h1
            className="mt-2 text-[26px] font-semibold tracking-[-0.01em]"
            style={{ color: C.ivory }}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-md px-4 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4b740]"
          style={{ ...mono, color: C.board, background: C.amber }}
        >
          <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Panel className="p-5">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.faint }}
          >
            Ontvangen
          </p>
          <div className="mt-2.5">
            <SplitFlap value={`€ ${betaald.toLocaleString("nl-NL")}`} tone={C.green} size={19} />
          </div>
        </Panel>
        <Panel className="p-5">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.faint }}
          >
            Openstaand
          </p>
          <div className="mt-2.5">
            <SplitFlap value={`€ ${open.toLocaleString("nl-NL")}`} tone={C.red} size={19} />
          </div>
        </Panel>
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[9.5px] font-semibold uppercase tracking-[0.08em]"
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
              const meta = statusMeta[f.status] ?? { color: C.faint, Icon: Check };
              const Icon = meta.Icon;
              return (
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <td
                    className="p-4 text-[11.5px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.ivory }}
                  >
                    {f.nr}
                  </td>
                  <td className="p-4 text-[13px] font-medium" style={{ color: C.ivory }}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden p-4 text-[11.5px] tabular-nums sm:table-cell"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-4 text-right text-[13px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.ivory }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <Icon size={13} strokeWidth={2.6} color={meta.color} aria-hidden="true" />
                      <span
                        className="text-[10.5px] font-semibold uppercase tracking-[0.06em]"
                        style={{ ...mono, color: meta.color }}
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
