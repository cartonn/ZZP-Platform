"use client";

// Concept 91 — "Agenda" · kalender-first / time-blocking.
// Het hele platform door de bril van de beste 2026 agenda-apps (Amie, Cron, Notion Calendar):
// een dag-/weekraster met tijdblokken op een tijdas, een zachte "nu"-lijn, en gekleurde blokken
// per soort werk (dienst, verificatie, factuur, actie). Marktplaats = matches als inplanbare
// blokken; verificatie/acties/facturen = agenda-items met deadlines. Koel, licht, strak, premium.
// Deterministisch: de "nu"-tijd (10:24) en alle blokken zijn hardcoded — nooit Date.now/Math.random.
// Fonts: --font-lab-geist (UI/body) + --font-lab-geist-mono (tijden & cijfers).

import { useState } from "react";
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
  CalendarDays,
  CalendarClock,
  Receipt,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Inbox,
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
  bg: "#f5f7fc",
  surface: "#ffffff",
  surfaceAlt: "#eef2fa",
  ink: "#1a2233",
  accent: "#4f6bed",
  accentSoft: "#8ea0f4",
  muted: "#5a6478",
  faint: "#8b95a8",
  line: "#e3e8f2",
  lineSoft: "#eef1f8",
  now: "#ef5b6b",
  // Categorie-kleuren (koel palet)
  dienst: "#4f6bed",
  verificatie: "#1fa8a0",
  factuur: "#8a6ef0",
  actie: "#e8863c",
  warn: "#c8781f",
  ok: "#1c9d76",
  alert: "#d84c4c",
};

const ui = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f6bed] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f7fc]";
const SHADOW = "0 1px 2px rgba(26,34,51,0.04), 0 8px 24px -18px rgba(26,34,51,0.35)";

const NOW_MIN = 10 * 60 + 24; // 10:24 — vaste "nu"
const DAY_START = 7; // 07:00
const DAY_END = 21; // 21:00
const PX_PER_MIN = 0.85;

/* ---------- Categorie → betekenis ---------- */

type Kind = "dienst" | "verificatie" | "factuur" | "actie";

function kindMeta(k: Kind): { label: string; color: string; Icon: typeof CalendarDays } {
  switch (k) {
    case "dienst":
      return { label: "Dienst", color: C.dienst, Icon: CalendarClock };
    case "verificatie":
      return { label: "Verificatie", color: C.verificatie, Icon: ShieldCheck };
    case "factuur":
      return { label: "Factuur", color: C.factuur, Icon: Receipt };
    case "actie":
      return { label: "Actie", color: C.actie, Icon: AlertTriangle };
  }
}

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };
function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.ok, Icon: BadgeCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.accent, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", color: C.warn, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.alert, Icon: XCircle };
  }
}

function toMin(t: string): number {
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  return (h ?? 0) * 60 + (m ?? 0);
}
function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Deterministische agenda-blokken ---------- */

type Block = {
  start: string;
  end: string;
  titel: string;
  sub: string;
  kind: Kind;
  opd?: string;
};

// Vandaag-blokken, afgeleid van de mock-content maar met vaste tijdvakken.
const TODAY: Block[] = [
  {
    start: "08:00",
    end: "12:00",
    titel: OPDRACHTEN[0]!.titel,
    sub: `${OPDRACHTEN[0]!.opdrachtgever} · ${OPDRACHTEN[0]!.plaats}`,
    kind: "dienst",
    opd: OPDRACHTEN[0]!.id,
  },
  {
    start: "10:00",
    end: "10:30",
    titel: "VOG vernieuwen",
    sub: "Verloopt over 23 dagen",
    kind: "verificatie",
  },
  {
    start: "13:00",
    end: "16:30",
    titel: OPDRACHTEN[1]!.titel,
    sub: `${OPDRACHTEN[1]!.opdrachtgever} · ${OPDRACHTEN[1]!.plaats}`,
    kind: "dienst",
    opd: OPDRACHTEN[1]!.id,
  },
  {
    start: "17:00",
    end: "17:30",
    titel: "Herinnering FAC-2025-118",
    sub: "Openstaand · € 1.350",
    kind: "factuur",
  },
  {
    start: "18:30",
    end: "19:15",
    titel: "Reageer op 3 nieuwe matches",
    sub: "Gem. reactietijd opdrachtgever: 6 u",
    kind: "actie",
  },
];

// Weekstrip: vaste dagen, met een telling van items per dag (deterministisch).
const WEEK = [
  { dag: "ma", datum: 30, items: 2 },
  { dag: "di", datum: 1, items: 3 },
  { dag: "wo", datum: 2, items: 1 },
  { dag: "do", datum: 3, items: 4 },
  { dag: "vr", datum: 4, items: 2 },
  { dag: "za", datum: 5, items: 0 },
  { dag: "zo", datum: 6, items: 0 },
];
const TODAY_INDEX = 3; // "do 3"

/* ---------- Kleine bouwstenen ---------- */

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SHADOW }}
    >
      {children}
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]"
      style={{ ...mono, color: C.accent }}
    >
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-1.5 text-[24px] font-semibold leading-tight tracking-[-0.02em] sm:text-[28px]"
      style={{ ...ui, color: C.ink }}
    >
      {children}
    </h1>
  );
}

function CredBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...ui, color: m.color, background: `${m.color}15` }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function Spark({ data, color }: { data: number[]; color: string }) {
  const w = 88;
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
  const last = pts[pts.length - 1]!;
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

function MatchRing({ value, size = 44 }: { value: number; size?: number }) {
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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.lineSoft} strokeWidth="3" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strong ? C.accent : C.accentSoft}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span className="text-[12px] font-semibold tabular-nums" style={{ ...mono, color: C.ink }}>
        {value}
      </span>
    </span>
  );
}

/* ---------- Handtekening-element: dag-tijdraster ---------- */

function DayGrid({
  blocks,
  onOpen,
  activeId,
  showNow = true,
}: {
  blocks: Block[];
  onOpen?: (id: string) => void;
  activeId?: string;
  showNow?: boolean;
}) {
  const hours: number[] = [];
  for (let h = DAY_START; h <= DAY_END; h++) hours.push(h);
  const totalMin = (DAY_END - DAY_START) * 60;
  const gridH = totalMin * PX_PER_MIN;
  const nowTop = (NOW_MIN - DAY_START * 60) * PX_PER_MIN;

  return (
    <div className="flex" style={{ ...ui }}>
      {/* Tijd-as */}
      <div className="w-12 shrink-0 sm:w-14" style={{ ...mono }}>
        <div className="relative" style={{ height: gridH }}>
          {hours.map((h) => (
            <div
              key={h}
              className="absolute right-2 -translate-y-1/2 text-[10.5px] tabular-nums"
              style={{ top: (h - DAY_START) * 60 * PX_PER_MIN, color: C.faint }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>
      </div>

      {/* Rasterkolom */}
      <div className="relative flex-1" style={{ height: gridH }}>
        {/* Uurlijnen */}
        {hours.map((h) => (
          <div
            key={h}
            className="absolute inset-x-0"
            style={{
              top: (h - DAY_START) * 60 * PX_PER_MIN,
              borderTop: `1px solid ${C.lineSoft}`,
            }}
            aria-hidden="true"
          />
        ))}

        {/* Nu-lijn */}
        {showNow && (
          <div
            className="absolute inset-x-0 z-20 flex items-center"
            style={{ top: nowTop }}
            aria-label="Huidige tijd 10:24"
          >
            <span
              className="-ml-1 flex h-3 w-3 items-center justify-center rounded-full"
              style={{ background: C.now }}
              aria-hidden="true"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.surface }} />
            </span>
            <span className="h-px flex-1" style={{ background: C.now }} aria-hidden="true" />
            <span
              className="rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold tabular-nums"
              style={{ ...mono, color: C.surface, background: C.now }}
            >
              10:24
            </span>
          </div>
        )}

        {/* Blokken */}
        {blocks.map((b, i) => {
          const top = (toMin(b.start) - DAY_START * 60) * PX_PER_MIN;
          const height = (toMin(b.end) - toMin(b.start)) * PX_PER_MIN;
          const m = kindMeta(b.kind);
          const Icon = m.Icon;
          const on = !!b.opd && b.opd === activeId;
          const short = height < 46;
          const clickable = !!b.opd && !!onOpen;
          const content = (
            <span className="flex h-full flex-col gap-0.5 overflow-hidden text-left">
              <span className="flex items-center gap-1.5">
                <Icon size={12} strokeWidth={2.4} color={m.color} aria-hidden="true" />
                <span
                  className="truncate text-[12px] font-semibold leading-tight"
                  style={{ color: C.ink }}
                >
                  {b.titel}
                </span>
              </span>
              {!short && (
                <>
                  <span className="truncate text-[11px]" style={{ color: C.muted }}>
                    {b.sub}
                  </span>
                  <span
                    className="mt-auto text-[10px] tabular-nums"
                    style={{ ...mono, color: m.color }}
                  >
                    {b.start}–{b.end} · {m.label}
                  </span>
                </>
              )}
            </span>
          );
          const style: React.CSSProperties = {
            top: top + 2,
            height: Math.max(height - 4, 22),
            left: 6,
            right: 6,
            background: `${m.color}0f`,
            borderLeft: `3px solid ${m.color}`,
            border: `1px solid ${m.color}33`,
            borderLeftWidth: 3,
          };
          if (clickable) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => onOpen!(b.opd!)}
                aria-pressed={on}
                className={`absolute z-10 overflow-hidden rounded-lg px-2.5 py-1.5 transition-all hover:brightness-[0.98] ${RING}`}
                style={{ ...style, boxShadow: on ? `0 0 0 2px ${m.color}` : "none" }}
              >
                {content}
              </button>
            );
          }
          return (
            <div
              key={i}
              className="absolute z-10 overflow-hidden rounded-lg px-2.5 py-1.5"
              style={style}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept91() {
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
      style={{ ...ui, color: C.ink, background: C.bg }}
    >
      <div className="flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk */}
        <aside
          className="shrink-0 md:w-[236px]"
          style={{ borderRight: `1px solid ${C.line}`, background: C.surface }}
        >
          <div className="flex h-full flex-col">
            <div
              className="flex items-center gap-2.5 p-5"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: C.accent }}
                aria-hidden="true"
              >
                <CalendarDays size={18} strokeWidth={2.2} color="#fff" />
              </span>
              <div className="leading-tight">
                <div className="text-[15px] font-semibold tracking-[-0.01em]">Agenda</div>
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: C.faint }}
                >
                  ZZP · planning
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
                    type="button"
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors md:w-full ${RING}`}
                    style={{
                      color: on ? C.accent : C.muted,
                      background: on ? `${C.accent}12` : "transparent",
                    }}
                  >
                    <CircleDot
                      size={7}
                      strokeWidth={4}
                      color={on ? C.accent : C.faint}
                      aria-hidden="true"
                    />
                    {s.label}
                  </button>
                );
              })}
            </nav>

            {/* Mini-agenda-legenda */}
            <div className="hidden px-4 pb-2 md:block">
              <p
                className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.faint }}
              >
                Legenda
              </p>
              <ul className="space-y-1.5">
                {(["dienst", "verificatie", "factuur", "actie"] as Kind[]).map((k) => {
                  const m = kindMeta(k);
                  return (
                    <li key={k} className="flex items-center gap-2 text-[11px]">
                      <span
                        className="h-2.5 w-2.5 rounded-[3px]"
                        style={{ background: m.color }}
                        aria-hidden="true"
                      />
                      <span style={{ color: C.muted }}>{m.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div
              className="hidden items-center gap-3 p-4 md:flex"
              style={{ borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                style={{ color: "#fff", background: C.accent }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold">{PROFIEL.naam}</div>
                <div
                  className="flex items-center gap-1 text-[10px] font-semibold"
                  style={{ color: C.ok }}
                >
                  <ShieldCheck size={11} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5 sm:p-7">
            {screen === "dashboard" && (
              <Dashboard onOpen={open} onGo={setScreen} activeId={activeId} />
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

/* ---------- Weekstrip ---------- */

function WeekStrip() {
  const [sel, setSel] = useState(TODAY_INDEX);
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Vorige week"
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-[#eef2fa] ${RING}`}
        style={{ border: `1px solid ${C.line}`, color: C.muted }}
      >
        <ChevronLeft size={16} strokeWidth={2.2} aria-hidden="true" />
      </button>
      <div className="grid flex-1 grid-cols-7 gap-1.5">
        {WEEK.map((d, i) => {
          const on = i === sel;
          const today = i === TODAY_INDEX;
          return (
            <button
              key={d.dag}
              type="button"
              onClick={() => setSel(i)}
              aria-current={today ? "date" : undefined}
              aria-pressed={on}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 transition-colors ${RING}`}
              style={{
                background: on ? C.accent : C.surface,
                border: `1px solid ${on ? C.accent : C.line}`,
              }}
            >
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: on ? "rgba(255,255,255,0.85)" : C.faint }}
              >
                {d.dag}
              </span>
              <span
                className="text-[15px] font-semibold tabular-nums"
                style={{ ...mono, color: on ? "#fff" : C.ink }}
              >
                {d.datum}
              </span>
              <span className="flex h-1.5 items-center gap-0.5" aria-hidden="true">
                {d.items > 0 ? (
                  Array.from({ length: Math.min(d.items, 3) }).map((_, k) => (
                    <span
                      key={k}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: on ? "rgba(255,255,255,0.8)" : C.accentSoft }}
                    />
                  ))
                ) : (
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: "transparent" }}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        aria-label="Volgende week"
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-[#eef2fa] ${RING}`}
        style={{ border: `1px solid ${C.line}`, color: C.muted }}
      >
        <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({
  onOpen,
  onGo,
  activeId,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
  activeId: string;
}) {
  const next = TODAY.find((b) => toMin(b.end) > NOW_MIN);
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Donderdag 3 juli</Kicker>
          <Title>Goedemorgen, {PROFIEL.naam.split(" ")[0]}</Title>
        </div>
        <div
          className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-[12px] font-medium"
          style={{ background: C.surface, border: `1px solid ${C.line}`, color: C.muted }}
        >
          <CalendarClock size={14} strokeWidth={2} color={C.accent} aria-hidden="true" />
          {next ? (
            <>
              Nu volgend: <span className="font-semibold text-[#1a2233]">{next.titel}</span>
            </>
          ) : (
            "Geen items meer vandaag"
          )}
        </div>
      </header>

      <WeekStrip />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-medium leading-tight" style={{ color: C.muted }}>
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                style={{ ...mono, color: k.up ? C.ok : C.warn }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} strokeWidth={2.4} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} strokeWidth={2.4} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <p className="mt-2 text-[22px] font-semibold tabular-nums leading-none">{k.value}</p>
            <div className="mt-2">
              <Spark data={k.spark} color={k.up ? C.accent : C.warn} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        {/* Vandaag — dagraster */}
        <Panel className="overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <h3 className="flex items-center gap-2 text-[14px] font-semibold">
              <CalendarDays size={16} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
              Vandaag
            </h3>
            <span className="text-[11px] font-medium" style={{ ...mono, color: C.faint }}>
              {TODAY.length} items
            </span>
          </div>
          <div className="max-h-[420px] overflow-y-auto px-3 py-3">
            <DayGrid blocks={TODAY} onOpen={onOpen} activeId={activeId} />
          </div>
        </Panel>

        <div className="space-y-5">
          {/* Aankomend / berichten */}
          <Panel className="p-4">
            <h3 className="flex items-center gap-2 text-[13px] font-semibold">
              <Inbox size={15} strokeWidth={2.2} color={C.accent} aria-hidden="true" /> Postvak
            </h3>
            <ul className="mt-3 space-y-2.5">
              {BERICHTEN.slice(0, 3).map((b) => (
                <li key={b.van} className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                    style={{ color: C.accent, background: `${C.accent}15` }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[12px] font-semibold">{b.van}</span>
                      {b.ongelezen && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.accent }}
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
          </Panel>

          {/* Volgende beste actie */}
          <Panel className="p-4">
            <div
              className="flex flex-col gap-3 rounded-xl p-3.5"
              style={{ background: `${C.actie}12`, border: `1px solid ${C.actie}33` }}
              role="alert"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} strokeWidth={2.2} color={C.actie} aria-hidden="true" />
                <span className="text-[13px] font-semibold">{ACTIES[0]!.titel}</span>
              </div>
              <p className="text-[12px]" style={{ color: C.muted }}>
                {ACTIES[0]!.detail}
              </p>
              <button
                type="button"
                onClick={() => onGo("verificatie")}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold text-white transition-colors ${RING}`}
                style={{ background: C.actie }}
              >
                {ACTIES[0]!.cta} <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats — matches als inplanbare blokken ---------- */

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
  // Voorbeeld-inplanning van de geselecteerde match op het raster.
  const planBlocks: Block[] = sel
    ? [
        {
          start: "09:00",
          end: "13:00",
          titel: sel.titel,
          sub: `${sel.opdrachtgever} · ${sel.plaats}`,
          kind: "dienst",
          opd: sel.id,
        },
      ]
    : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Kicker>Marktplaats</Kicker>
        <Title>Matches inplannen</Title>
      </div>

      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: SHADOW }}
      >
        <Search size={16} strokeWidth={2} color={C.accent} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#8b95a8]"
          style={{ color: C.ink }}
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
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: C.surfaceAlt }}
            aria-hidden="true"
          >
            <CalendarDays size={24} strokeWidth={1.8} color={C.accent} />
          </span>
          <p className="mt-4 text-[17px] font-semibold">Niets gevonden</p>
          <p className="mx-auto mt-1.5 max-w-xs text-[12px]" style={{ color: C.muted }}>
            Geen match past bij &quot;{q}&quot;. Verruim je zoekopdracht.
          </p>
          <button
            type="button"
            onClick={() => setQ("")}
            className={`mt-5 rounded-xl px-4 py-2 text-[12.5px] font-semibold text-white transition-colors ${RING}`}
            style={{ background: C.accent }}
          >
            Zoekopdracht wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_1fr]">
          <div className="space-y-3">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className={`w-full rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 ${RING}`}
                  style={{
                    background: C.surface,
                    border: `1px solid ${on ? C.accent : C.line}`,
                    boxShadow: on ? `0 14px 30px -22px ${C.accent}` : SHADOW,
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    <MatchRing value={o.match} size={50} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                        style={{ ...mono, color: C.faint }}
                      >
                        <span>{o.id}</span>
                        {on && <span style={{ color: C.accent }}>· gekozen</span>}
                      </div>
                      <p className="truncate text-[15px] font-semibold">{o.titel}</p>
                      <p
                        className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={12} strokeWidth={2} aria-hidden="true" /> {o.opdrachtgever} ·{" "}
                        {o.plaats}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium tabular-nums"
                          style={{ ...mono, color: C.accent, background: `${C.accent}12` }}
                        >
                          <Clock size={11} strokeWidth={2.2} aria-hidden="true" /> {o.uren}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium"
                          style={{ color: C.muted, background: C.surfaceAlt }}
                        >
                          {o.tarief}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <aside className="h-fit lg:sticky lg:top-2">
              <Panel className="overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <span className="text-[12px] font-semibold" style={{ color: C.ink }}>
                    Voorbeeld-planning
                  </span>
                  <span className="text-[11px]" style={{ ...mono, color: C.faint }}>
                    do 3 juli
                  </span>
                </div>
                <div className="max-h-[300px] overflow-y-auto px-3 py-3">
                  <DayGrid blocks={planBlocks} showNow={false} />
                </div>
                <div className="p-4" style={{ borderTop: `1px solid ${C.line}` }}>
                  <button
                    type="button"
                    onClick={() => onOpen(sel.id)}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors ${RING}`}
                    style={{ background: C.accent }}
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
  const slots: Block[] = [
    {
      start: "08:00",
      end: "12:00",
      titel: opdracht.titel,
      sub: `${opdracht.plaats} · ochtend`,
      kind: "dienst",
      opd: opdracht.id,
    },
    {
      start: "13:00",
      end: "16:00",
      titel: opdracht.titel,
      sub: `${opdracht.plaats} · middag`,
      kind: "dienst",
      opd: opdracht.id,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Panel className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
                  className="rounded-lg px-2.5 py-0.5 text-[11px] font-medium"
                  style={{ color: C.muted, background: C.surfaceAlt }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <MatchRing value={opdracht.match} size={64} />
        </div>
        <button
          type="button"
          onClick={react}
          disabled={state !== "idle"}
          aria-live="polite"
          className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold text-white transition-colors disabled:opacity-90 ${RING}`}
          style={{ background: state === "sent" ? C.ok : C.accent }}
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
      </Panel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Panel key={m.l} className="p-4">
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[17px] font-semibold tabular-nums" style={{ ...mono }}>
              {m.v}
            </p>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Panel className="overflow-hidden">
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <CalendarClock size={15} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
            <h3 className="text-[14px] font-semibold">Tijdvakken</h3>
          </div>
          <div className="max-h-[360px] overflow-y-auto px-3 py-3">
            <DayGrid blocks={slots} showNow={false} />
          </div>
        </Panel>

        <Panel>
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <BadgeCheck size={15} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
            <h3 className="text-[14px] font-semibold">Waarom deze match</h3>
          </div>
          <div className="p-4">
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.ok }}
            >
              <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
            </p>
            <ul className="mt-2.5 space-y-2">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <Check
                    size={15}
                    strokeWidth={2.4}
                    color={C.ok}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
            <p
              className="mt-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.warn }}
            >
              <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" /> Aandachtspunten
            </p>
            <ul className="mt-2.5 space-y-2">
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
        </Panel>
      </div>
    </div>
  );
}

/* ---------- Verificatie — credentials als agenda-items met deadlines ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker>Verificatie</Kicker>
        <Title>Certificaten & deadlines</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          {verified} van {total} geverifieerd. Je bewijsstukken worden veilig en privé bewaard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { l: "Geverifieerd", v: `${verified}/${total}`, color: C.ok, Icon: BadgeCheck },
          { l: "Verloopt binnenkort", v: "1", color: C.warn, Icon: AlertTriangle },
          { l: "In beoordeling", v: "1", color: C.accent, Icon: Clock },
        ].map((s) => {
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
                <p className="mt-1.5 text-[24px] font-semibold tabular-nums" style={{ ...mono }}>
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: `${s.color}15` }}
              >
                <Icon size={20} strokeWidth={2} color={s.color} aria-hidden="true" />
              </span>
            </Panel>
          );
        })}
      </div>

      <Panel>
        <ul>
          {CREDENTIALS.map((c, i) => {
            const m = credMeta(c.status);
            const Icon = m.Icon;
            const deadline = c.status === "EXPIRING";
            return (
              <li
                key={c.naam}
                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${m.color}15`, borderLeft: `3px solid ${m.color}` }}
                >
                  <Icon size={20} strokeWidth={2} color={m.color} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">{c.naam}</p>
                  <p
                    className="flex items-center gap-1.5 text-[11.5px]"
                    style={{ color: deadline ? C.warn : C.muted }}
                  >
                    {deadline && <CalendarClock size={12} strokeWidth={2.2} aria-hidden="true" />}
                    {c.detail}
                  </p>
                </div>
                <CredBadge status={c.status} />
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

/* ---------- Acties — als agenda-items op tijd ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Kicker>Acties</Kicker>
        <Title>Vandaag te doen</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — ingepland als items in je dag.
        </p>
      </div>

      <div className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.warn : C.accent;
          const tijd = ["10:00", "17:00", "18:30"][i] ?? "—";
          return (
            <Panel key={a.titel} className="flex items-stretch overflow-hidden">
              <div
                className="flex w-16 shrink-0 flex-col items-center justify-center gap-1"
                style={{ background: `${color}0f`, borderRight: `1px solid ${color}25` }}
              >
                <span className="text-[13px] font-semibold tabular-nums" style={{ ...mono, color }}>
                  {tijd}
                </span>
                {warn ? (
                  <AlertTriangle size={14} strokeWidth={2.2} color={color} aria-hidden="true" />
                ) : (
                  <CircleDot size={12} strokeWidth={3} color={color} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color }}
                >
                  {warn ? "Waarschuwing" : "Herinnering"}
                </span>
                <p className="mt-1 text-[14.5px] font-semibold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`m-3 shrink-0 self-center rounded-xl px-4 py-2 text-[12px] font-semibold transition-colors ${RING}`}
                style={{
                  color: warn ? "#fff" : C.accent,
                  background: warn ? C.warn : `${C.accent}12`,
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
        style={{ background: `${C.ok}0f`, border: `1px solid ${C.ok}33` }}
      >
        <Check size={18} strokeWidth={2.2} color={C.ok} aria-hidden="true" />
        <p className="text-[12.5px]" style={{ color: C.muted }}>
          Verder is je agenda leeg vandaag. Nieuwe items verschijnen hier vanzelf.
        </p>
      </div>
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
          type="button"
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors ${RING}`}
          style={{ background: C.accent }}
        >
          <Plus size={14} strokeWidth={2.4} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Panel className="p-5">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: C.faint }}
          >
            Ontvangen
          </p>
          <p
            className="mt-2 text-[22px] font-semibold tabular-nums"
            style={{ ...mono, color: C.ok }}
          >
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
          <p
            className="mt-2 text-[22px] font-semibold tabular-nums"
            style={{ ...mono, color: C.warn }}
          >
            € {open.toLocaleString("nl-NL")}
          </p>
        </Panel>
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.faint, borderBottom: `1px solid ${C.line}` }}
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
                  <td className="p-4 text-[12px] font-semibold tabular-nums" style={{ ...mono }}>
                    {f.nr}
                  </td>
                  <td className="p-4 text-[13px] font-medium">{f.klant}</td>
                  <td
                    className="hidden p-4 text-[12px] tabular-nums sm:table-cell"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-4 text-right text-[13px] font-semibold tabular-nums"
                    style={{ ...mono }}
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
                      <span className="text-[11px] font-semibold" style={{ color }}>
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
