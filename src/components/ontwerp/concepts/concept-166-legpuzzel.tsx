"use client";

// Concept 166 — "Legpuzzel" · matching als in elkaar passende puzzelstukken. Warme, heldere
// paletten (amber + teal + koraal op crème) maar SaaS-strak: subtiele tab/blank-randen via
// inline-SVG puzzelpaden, geen kindercartoon. Metafoor: ZZP-stuk klikt in het opdracht-stuk;
// een ontbrekende eis = een leeg stukje (gestippelde gap). 2026-trends: expressieve display-type
// (Bricolage Grotesque) naast neutrale grotesk (Plus Jakarta) + mono voor data, tactiele
// "klik-op-zijn-plek" micro-interacties, en warme, optimistische maar rustige kleurvlakken.
// Status nooit kleur-alleen: altijd label + icoon + tint. Deterministisch — geen random/Date.

import { useState } from "react";
import {
  Puzzle,
  ShieldCheck,
  Check,
  Clock,
  XCircle,
  TriangleAlert,
  ArrowRight,
  ArrowLeft,
  Search,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Star,
  FileText,
  Sparkles,
  BadgeCheck,
  type LucideIcon,
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

// ── Palet — warm/helder maar strak (amber = ZZP'er, teal = opdracht, koraal = accent) ──────
const C = {
  cream: "#fbf6ec",
  creamDeep: "#f3ebda",
  paper: "#ffffff",
  ink: "#2a2118",
  inkSoft: "#5c5347",
  mut: "#8b7f6d",
  line: "#ece1cd",
  lineStrong: "#dccbab",
  amber: "#f2a516",
  amberBright: "#ffbe3d",
  amberSoft: "#fdf0d4",
  teal: "#0f9a8c",
  tealBright: "#18b7a6",
  tealSoft: "#daf2ee",
  coral: "#e85f38",
  coralSoft: "#fce2d9",
  ok: "#1f9d55",
  okSoft: "#e3f4ea",
  warn: "#c57a12",
  warnSoft: "#fbecd0",
  danger: "#d4342b",
  dangerSoft: "#fbe1df",
  white: "#ffffff",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const sans = { fontFamily: "var(--font-lab-jakarta)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

const SOFT = "0 1px 2px rgba(42,33,24,0.05), 0 8px 24px -14px rgba(42,33,24,0.28)";
const LIFT = "0 2px 4px rgba(42,33,24,0.06), 0 18px 38px -18px rgba(42,33,24,0.36)";
const softShadow = { boxShadow: SOFT };

// ── Puzzelstuk-geometrie — een zijde is flat (0), tab (+1, bult naar buiten) of blank (-1, deuk) ──
const round2 = (x: number) => Math.round(x * 100) / 100;

type Edges = { top: number; right: number; bottom: number; left: number };

// Bouw een puzzelstuk-pad (vierkant met tab/blank-randen). S = zijlengte; k = tab-amplitude.
function piecePath(S: number, e: Edges): string {
  const k = 0.26 * S;
  const p: string[] = ["M 0 0"];

  // Boven: TL → TR (bult naar -y)
  if (e.top === 0) p.push(`L ${round2(S)} 0`);
  else {
    const t = e.top;
    p.push(`L ${round2(0.35 * S)} 0`);
    p.push(
      `C ${round2(0.46 * S)} 0, ${round2(0.35 * S)} ${round2(-k * t)}, ${round2(0.5 * S)} ${round2(-k * t)}`,
    );
    p.push(`C ${round2(0.65 * S)} ${round2(-k * t)}, ${round2(0.54 * S)} 0, ${round2(0.65 * S)} 0`);
    p.push(`L ${round2(S)} 0`);
  }

  // Rechts: TR → BR (bult naar +x)
  if (e.right === 0) p.push(`L ${round2(S)} ${round2(S)}`);
  else {
    const t = e.right;
    p.push(`L ${round2(S)} ${round2(0.35 * S)}`);
    p.push(
      `C ${round2(S)} ${round2(0.46 * S)}, ${round2(S + k * t)} ${round2(0.35 * S)}, ${round2(S + k * t)} ${round2(0.5 * S)}`,
    );
    p.push(
      `C ${round2(S + k * t)} ${round2(0.65 * S)}, ${round2(S)} ${round2(0.54 * S)}, ${round2(S)} ${round2(0.65 * S)}`,
    );
    p.push(`L ${round2(S)} ${round2(S)}`);
  }

  // Onder: BR → BL (bult naar +y)
  if (e.bottom === 0) p.push(`L 0 ${round2(S)}`);
  else {
    const t = e.bottom;
    p.push(`L ${round2(0.65 * S)} ${round2(S)}`);
    p.push(
      `C ${round2(0.54 * S)} ${round2(S)}, ${round2(0.65 * S)} ${round2(S + k * t)}, ${round2(0.5 * S)} ${round2(S + k * t)}`,
    );
    p.push(
      `C ${round2(0.35 * S)} ${round2(S + k * t)}, ${round2(0.46 * S)} ${round2(S)}, ${round2(0.35 * S)} ${round2(S)}`,
    );
    p.push(`L 0 ${round2(S)}`);
  }

  // Links: BL → TL (bult naar -x)
  if (e.left === 0) p.push(`L 0 0`);
  else {
    const t = e.left;
    p.push(`L 0 ${round2(0.65 * S)}`);
    p.push(
      `C 0 ${round2(0.54 * S)}, ${round2(-k * t)} ${round2(0.65 * S)}, ${round2(-k * t)} ${round2(0.5 * S)}`,
    );
    p.push(`C ${round2(-k * t)} ${round2(0.35 * S)}, 0 ${round2(0.46 * S)}, 0 ${round2(0.35 * S)}`);
    p.push(`L 0 0`);
  }

  p.push("Z");
  return p.join(" ");
}

// Een gerenderd puzzelstuk met optionele gecentreerde inhoud (icoon/cijfer).
function PuzzlePiece({
  edges,
  size = 96,
  fill,
  stroke = C.ink,
  strokeWidth = 2.5,
  dashed = false,
  children,
  className = "",
  title,
}: {
  edges: Edges;
  size?: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  dashed?: boolean;
  children?: React.ReactNode;
  className?: string;
  title?: string;
}) {
  const S = 100;
  const pad = 0.3 * S;
  const vb = `${-pad} ${-pad} ${S + 2 * pad} ${S + 2 * pad}`;
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox={vb}
        className="absolute inset-0 h-full w-full overflow-visible"
        aria-hidden="true"
        focusable="false"
      >
        {title ? <title>{title}</title> : null}
        <path
          d={piecePath(S, edges)}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeDasharray={dashed ? "5 5" : undefined}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

// ── Status-model — nooit kleur-alleen (icoon + label + tint) ──────────────────────────────
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string; ring: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, fg: C.ok, bg: C.okSoft, ring: "#bfe6cd" };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        fg: C.inkSoft,
        bg: C.creamDeep,
        ring: C.lineStrong,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fg: C.warn,
        bg: C.warnSoft,
        ring: "#eecf95",
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.danger, bg: C.dangerSoft, ring: "#f0b5b1" };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...sans, background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 1px ${m.ring}` }}
    >
      <m.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Kaart-primitive — rustig, rond, subtiele schaduw.
function Card({
  children,
  className = "",
  interactive = false,
  bg = C.paper,
  style,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  bg?: string;
  style?: React.CSSProperties;
  as?: "div" | "li";
}) {
  const Tag = as;
  return (
    <Tag
      className={`rounded-2xl ${interactive ? "transition-transform duration-200 hover:-translate-y-0.5" : ""} ${className}`}
      style={{ background: bg, boxShadow: `inset 0 0 0 1px ${C.line}, ${SOFT}`, ...style }}
    >
      {children}
    </Tag>
  );
}

// Sectiekop met puzzel-icoon + genummerd stukje.
function SectionHead({
  num,
  Icon,
  children,
  note,
}: {
  num: string;
  Icon: LucideIcon;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-bold tabular-nums"
          style={{ ...mono, background: C.ink, color: C.amberBright }}
        >
          {num}
        </span>
        <h2
          className="flex items-center gap-2 text-[17px] font-extrabold tracking-[-0.01em]"
          style={{ ...display, color: C.ink }}
        >
          <Icon size={17} strokeWidth={2.4} style={{ color: C.teal }} aria-hidden="true" />
          {children}
        </h2>
      </div>
      {note ? (
        <span className="hidden text-[11px] font-medium sm:block" style={{ ...mono, color: C.mut }}>
          {note}
        </span>
      ) : null}
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div
      className="flex items-center gap-1.5 text-[12.5px] font-medium"
      style={{ ...sans, color: C.inkSoft }}
    >
      <Icon size={13} strokeWidth={2.2} style={{ color: C.mut }} aria-hidden="true" />
      <span className="truncate">{value}</span>
    </div>
  );
}

// Match-kleur: hoog = teal (past), midden = amber, laag = neutraal. Cijfer draagt zelf betekenis.
function matchTone(m: number): { bg: string; fg: string; label: string } {
  if (m >= 90) return { bg: C.tealSoft, fg: C.teal, label: "Sluit aan" };
  if (m >= 84) return { bg: C.amberSoft, fg: C.warn, label: "Past grotendeels" };
  return { bg: C.creamDeep, fg: C.inkSoft, label: "Deels passend" };
}

function Bars({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-[2px]"
          style={{
            height: `${Math.max(16, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.amber : C.lineStrong,
          }}
        />
      ))}
    </div>
  );
}

// Deterministische edge-varianten voor requirement-stukjes (geen random).
const REQ_EDGES: Edges[] = [
  { top: 0, right: 1, bottom: 0, left: -1 },
  { top: -1, right: 0, bottom: 1, left: 0 },
  { top: 1, right: -1, bottom: 0, left: 1 },
  { top: 0, right: 1, bottom: -1, left: 0 },
];

// ── Root ──────────────────────────────────────────────────────────────────────────────────
export function Concept166() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...sans, background: C.cream, color: C.ink }}
    >
      {/* Kop */}
      <header
        className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 md:px-8"
        style={{ borderColor: C.line, background: C.paper }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: C.ink }}
            aria-hidden="true"
          >
            <Puzzle size={22} strokeWidth={2.4} style={{ color: C.amberBright }} />
          </span>
          <div className="leading-tight">
            <div
              className="text-[18px] font-extrabold tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
            >
              Legpuzzel
            </div>
            <div
              className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.mut }}
            >
              Werk dat klikt
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
            style={{
              ...sans,
              background: C.tealSoft,
              color: C.teal,
              boxShadow: `inset 0 0 0 1px #bfe6df`,
            }}
          >
            <ShieldCheck size={13} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[12px] font-bold"
            style={{
              ...mono,
              background: C.amberSoft,
              color: C.warn,
              boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Scherm-switcher */}
      <nav
        className="flex items-center gap-1.5 overflow-x-auto border-b px-4 py-2.5 md:px-8"
        aria-label="Schermen"
        style={{ borderColor: C.line, background: C.paper }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={
                on
                  ? {
                      ...sans,
                      color: C.paper,
                      background: C.ink,
                      ["--tw-ring-color" as string]: C.ink,
                    }
                  : {
                      ...sans,
                      color: C.inkSoft,
                      background: C.creamDeep,
                      ["--tw-ring-color" as string]: C.ink,
                    }
              }
            >
              <span
                className="mr-1.5 tabular-nums"
                style={{ ...mono, color: on ? C.amberBright : C.mut }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              {s.label}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        {screen === "dashboard" && (
          <Dashboard onOpen={() => setScreen("opdracht")} onActies={() => setScreen("acties")} />
        )}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && (
          <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>
    </div>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-6">
      {/* Hero — de puzzel klikt in elkaar */}
      <Card bg={C.ink} className="overflow-hidden">
        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div className="relative max-w-xl">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ ...sans, background: "rgba(255,190,61,0.16)", color: C.amberBright }}
            >
              <Sparkles size={12} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.rol}
            </span>
            <h1
              className="mt-3 text-[27px] font-extrabold leading-[1.05] tracking-[-0.02em] sm:text-[34px]"
              style={{ ...display, color: C.paper }}
            >
              Drie opdrachten klikken op jouw profiel.
            </h1>
            <p
              className="mt-3 max-w-md text-[14px] font-medium leading-relaxed"
              style={{ color: "#c9bfae" }}
            >
              Jouw vaardigheden en certificaten passen als puzzelstukken op de vraag. Eén stukje
              ontbreekt nog: je VOG verloopt binnenkort.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...sans,
                  background: C.amber,
                  color: C.ink,
                  ["--tw-ring-color" as string]: C.amber,
                  ["--tw-ring-offset-color" as string]: C.ink,
                }}
              >
                Bekijk matches <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...sans,
                  background: "rgba(255,255,255,0.08)",
                  color: C.paper,
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
                  ["--tw-ring-color" as string]: C.paper,
                  ["--tw-ring-offset-color" as string]: C.ink,
                }}
              >
                <TriangleAlert size={15} strokeWidth={2.4} aria-hidden="true" /> Los stukje op
              </button>
            </div>
          </div>

          {/* Interlock-illustratie */}
          <div className="relative hidden justify-center lg:flex" aria-hidden="true">
            <div className="flex items-center">
              <PuzzlePiece
                edges={{ top: 1, right: 1, bottom: -1, left: 0 }}
                size={112}
                fill={C.amber}
                stroke={C.ink}
              >
                <BadgeCheck size={26} strokeWidth={2.4} style={{ color: C.ink }} />
              </PuzzlePiece>
              <PuzzlePiece
                edges={{ top: -1, right: 0, bottom: 1, left: -1 }}
                size={112}
                fill={C.tealBright}
                stroke={C.ink}
                className="-ml-[29px]"
              >
                <Sparkles size={24} strokeWidth={2.4} style={{ color: C.ink }} />
              </PuzzlePiece>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI's */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...mono, color: C.mut }}
              >
                {k.label}
              </span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  ...mono,
                  background: k.up ? C.okSoft : C.warnSoft,
                  color: k.up ? C.ok : C.warn,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[25px] font-extrabold leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Bars data={k.spark} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches */}
        <div className="space-y-4 lg:col-span-2">
          <SectionHead num="A" Icon={Star} note="Op volgorde van passendheid">
            Aanbevolen matches
          </SectionHead>
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => {
              const tone = matchTone(o.match);
              return (
                <Card key={o.id} interactive className="overflow-hidden">
                  <button
                    onClick={onOpen}
                    className="flex w-full items-stretch gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{ ["--tw-ring-color" as string]: C.ink }}
                  >
                    <span className="relative shrink-0" aria-hidden="true">
                      <PuzzlePiece
                        edges={{ top: 0, right: 1, bottom: 0, left: -1 }}
                        size={56}
                        fill={tone.bg}
                        stroke={tone.fg}
                        strokeWidth={2}
                      >
                        <span
                          className="text-[16px] font-extrabold leading-none"
                          style={{ ...display, color: tone.fg }}
                        >
                          {o.match}
                        </span>
                      </PuzzlePiece>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div
                            className="truncate text-[15px] font-extrabold tracking-[-0.01em]"
                            style={{ ...display, color: C.ink }}
                          >
                            {o.titel}
                          </div>
                          <div
                            className="mt-0.5 truncate text-[12.5px] font-medium"
                            style={{ color: C.mut }}
                          >
                            {o.opdrachtgever} · {o.plaats} · {o.tarief}
                          </div>
                        </div>
                        <ArrowRight
                          size={18}
                          className="mt-1 shrink-0"
                          style={{ color: C.mut }}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                          style={{ ...mono, background: tone.bg, color: tone.fg }}
                        >
                          <Puzzle size={10} strokeWidth={2.6} aria-hidden="true" /> {tone.label}
                        </span>
                        {o.redenen.plus.slice(0, 2).map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{ ...sans, background: C.creamDeep, color: C.inkSoft }}
                          >
                            <Check
                              size={11}
                              strokeWidth={3}
                              style={{ color: C.ok }}
                              aria-hidden="true"
                            />{" "}
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Rechterkolom */}
        <div className="space-y-5">
          <SectionHead num="B" Icon={ShieldCheck}>
            Jouw stukjes
          </SectionHead>
          <Card className="p-5">
            <div className="flex items-end justify-between">
              <div
                className="text-[46px] font-extrabold leading-none tracking-[-0.03em]"
                style={{ ...display, color: C.ink }}
              >
                {dek}
                <span className="text-[20px]" style={{ color: C.mut }}>
                  %
                </span>
              </div>
              <StatusTag status="VERIFIED" />
            </div>
            <div className="mt-2 text-[12.5px] font-medium" style={{ color: C.mut }}>
              Profiel compleet · {verified}/{CREDENTIALS.length} stukjes op hun plek
            </div>
            <div
              className="mt-3 h-2.5 w-full overflow-hidden rounded-full"
              style={{ background: C.creamDeep }}
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${dek}%`, background: C.teal }}
              />
            </div>
            {/* Loading-voorbeeld: één stukje wordt nog gezocht (skeleton) */}
            <div
              className="mt-4 flex items-center gap-3 rounded-xl p-3"
              style={{ background: C.cream }}
            >
              <span
                className="h-9 w-9 shrink-0 animate-pulse rounded-lg"
                style={{ background: C.creamDeep }}
                aria-hidden="true"
              />
              <div className="flex-1 space-y-1.5" aria-hidden="true">
                <span
                  className="block h-2.5 w-3/4 animate-pulse rounded-full"
                  style={{ background: C.creamDeep }}
                />
                <span
                  className="block h-2.5 w-1/2 animate-pulse rounded-full"
                  style={{ background: C.creamDeep }}
                />
              </div>
              <span
                className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...mono, color: C.mut }}
              >
                Zoeken…
              </span>
            </div>
          </Card>

          <Card bg={C.ink} className="p-5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10.5px] font-semibold"
              style={{ ...sans, background: "rgba(255,190,61,0.16)", color: C.amberBright }}
            >
              <TriangleAlert size={12} strokeWidth={2.6} aria-hidden="true" /> Ontbrekend stukje
            </span>
            <h3
              className="mt-2.5 text-[16px] font-extrabold leading-tight"
              style={{ ...display, color: C.paper }}
            >
              {warn.titel}
            </h3>
            <p
              className="mt-1.5 text-[12.5px] font-medium leading-relaxed"
              style={{ color: "#c9bfae" }}
            >
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...sans,
                background: C.amber,
                color: C.ink,
                ["--tw-ring-color" as string]: C.amber,
                ["--tw-ring-offset-color" as string]: C.ink,
              }}
            >
              {warn.cta} <ArrowRight size={14} aria-hidden="true" />
            </button>
          </Card>

          {/* Berichten */}
          <Card className="overflow-hidden">
            <div
              className="flex items-center justify-between border-b px-4 py-3"
              style={{ borderColor: C.line }}
            >
              <span
                className="text-[12px] font-bold uppercase tracking-[0.08em]"
                style={{ ...mono, color: C.inkSoft }}
              >
                Berichten
              </span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{ ...mono, background: C.coralSoft, color: C.coral }}
              >
                {BERICHTEN.filter((b) => b.ongelezen).length} nieuw
              </span>
            </div>
            <ul>
              {BERICHTEN.slice(0, 2).map((b, i) => (
                <li
                  key={b.van}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                    style={{ ...mono, background: C.tealSoft, color: C.teal }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] font-semibold" style={{ color: C.ink }}>
                        {b.van}
                      </span>
                      {b.ongelezen && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.coral }}
                          aria-label="ongelezen"
                        />
                      )}
                    </div>
                    <p className="truncate text-[12px] font-medium" style={{ color: C.mut }}>
                      {b.preview}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-[10.5px] font-medium"
                    style={{ ...mono, color: C.mut }}
                  >
                    {b.tijd}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Marktplaats ───────────────────────────────────────────────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead num="02" Icon={Puzzle}>
          Marktplaats
        </SectionHead>
        <Card className="flex items-center gap-2 px-3 py-1.5">
          <Search size={16} style={{ color: C.mut }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek opdracht, plaats…"
            aria-label="Opdrachten zoeken"
            className="w-44 bg-transparent py-1 text-[13px] font-medium outline-none placeholder:opacity-60"
            style={{ ...sans, color: C.ink }}
          />
        </Card>
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <PuzzlePiece
            edges={{ top: -1, right: -1, bottom: -1, left: -1 }}
            size={72}
            fill={C.cream}
            stroke={C.lineStrong}
            strokeWidth={2.5}
            dashed
          >
            <Search size={22} style={{ color: C.mut }} />
          </PuzzlePiece>
          <p className="text-[17px] font-extrabold" style={{ ...display, color: C.ink }}>
            Geen passend stukje
          </p>
          <p className="max-w-xs text-[13px] font-medium" style={{ color: C.mut }}>
            Niets gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan om meer matches te zien.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-xl px-4 py-2 text-[12.5px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...sans,
              background: C.ink,
              color: C.paper,
              ["--tw-ring-color" as string]: C.ink,
            }}
          >
            Zoekterm wissen
          </button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((o) => {
              const tone = matchTone(o.match);
              return (
                <Card key={o.id} interactive className="flex flex-col overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <span className="shrink-0" aria-hidden="true">
                      <PuzzlePiece
                        edges={{ top: 0, right: 1, bottom: 0, left: -1 }}
                        size={52}
                        fill={tone.bg}
                        stroke={tone.fg}
                        strokeWidth={2}
                      >
                        <span
                          className="text-[15px] font-extrabold leading-none"
                          style={{ ...display, color: tone.fg }}
                        >
                          {o.match}
                        </span>
                      </PuzzlePiece>
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-[15px] font-extrabold leading-tight tracking-[-0.01em]"
                        style={{ ...display, color: C.ink }}
                      >
                        {o.titel}
                      </h3>
                      <p className="mt-0.5 text-[12px] font-medium" style={{ color: C.mut }}>
                        {o.opdrachtgever}
                      </p>
                    </div>
                  </div>
                  <div className="border-t px-4 py-3.5" style={{ borderColor: C.line }}>
                    <dl className="grid grid-cols-2 gap-y-2">
                      <Meta Icon={MapPin} value={o.plaats} />
                      <Meta Icon={Coins} value={o.tarief} />
                      <Meta Icon={Clock} value={o.uren} />
                      <Meta Icon={CalendarDays} value={o.start} />
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                          style={{ ...mono, background: C.creamDeep, color: C.inkSoft }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={onOpen}
                    className="mt-auto flex items-center justify-center gap-2 border-t py-3 text-[12.5px] font-bold transition-colors hover:bg-[#f3ebda] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{
                      ...sans,
                      color: C.ink,
                      borderColor: C.line,
                      ["--tw-ring-color" as string]: C.ink,
                    }}
                  >
                    Bekijk opdracht <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </Card>
              );
            })}
          </div>

          {/* Loading-voorbeeld: meer opdrachten worden geladen (skeleton) */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="h-12 w-12 shrink-0 animate-pulse rounded-xl"
                    style={{ background: C.creamDeep }}
                  />
                  <div className="flex-1 space-y-2">
                    <span
                      className="block h-3 w-3/4 animate-pulse rounded-full"
                      style={{ background: C.creamDeep }}
                    />
                    <span
                      className="block h-3 w-1/2 animate-pulse rounded-full"
                      style={{ background: C.creamDeep }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Opdracht-detail — hier is de puzzel-metafoor het sterkst ────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [sel, setSel] = useState<number | null>(0);

  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];

  // Eisen als stukjes: plus = past (klikt), min = ontbrekend/aandacht (gap).
  type Req = { text: string; fit: boolean };
  const reqs: Req[] = [
    ...opdracht.redenen.plus.map((t) => ({ text: t, fit: true })),
    ...opdracht.redenen.min.map((t) => ({ text: t, fit: false })),
  ];
  const selReq = sel !== null ? reqs[sel] : undefined;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-[#f3ebda] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...sans,
          background: C.paper,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.ink,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      {/* Kop met interlock: jouw stuk klikt in het opdracht-stuk */}
      <Card bg={C.ink} className="overflow-hidden">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div className="min-w-0">
            <span
              className="inline-block rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ ...mono, background: "rgba(255,190,61,0.16)", color: C.amberBright }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-xl text-[25px] font-extrabold leading-[1.05] tracking-[-0.02em] sm:text-[32px]"
              style={{ ...display, color: C.paper }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px] font-medium" style={{ color: "#c9bfae" }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>

          {/* Interlock met match% */}
          <div className="flex items-center justify-center gap-0" aria-hidden="true">
            <PuzzlePiece
              edges={{ top: 1, right: 1, bottom: -1, left: 0 }}
              size={96}
              fill={C.amber}
              stroke={C.ink}
            >
              <span
                className="text-[11px] font-bold uppercase tracking-[0.06em]"
                style={{ ...mono, color: C.ink }}
              >
                jij
              </span>
            </PuzzlePiece>
            <PuzzlePiece
              edges={{ top: -1, right: 0, bottom: 1, left: -1 }}
              size={96}
              fill={C.tealBright}
              stroke={C.ink}
              className="-ml-[25px]"
            >
              <div className="text-center leading-none">
                <div className="text-[22px] font-extrabold" style={{ ...display, color: C.ink }}>
                  {opdracht.match}
                </div>
                <div
                  className="text-[9px] font-bold uppercase tracking-[0.08em]"
                  style={{ ...mono, color: C.ink }}
                >
                  match
                </div>
              </div>
            </PuzzlePiece>
          </div>
        </div>
      </Card>

      {/* Feiten */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Card key={f.l} interactive className="p-4">
            <f.Icon size={16} strokeWidth={2.4} style={{ color: C.teal }} aria-hidden="true" />
            <div
              className="mt-2.5 text-[16px] font-extrabold leading-none"
              style={{ ...display, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.mut }}
            >
              {f.l}
            </div>
          </Card>
        ))}
      </div>

      {/* De puzzel: passende stukjes vs. ontbrekend stukje */}
      <SectionHead num="03" Icon={Puzzle} note="Klik op een stukje voor uitleg">
        Passen de stukken?
      </SectionHead>
      <Card className="p-5 sm:p-6">
        <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
          {/* Puzzel-grid */}
          <div className="mx-auto grid grid-cols-2 gap-2.5 sm:mx-0">
            {reqs.map((r, i) => {
              const on = sel === i;
              const fill = r.fit ? (on ? C.teal : C.tealSoft) : C.cream;
              const stroke = r.fit ? C.teal : C.warn;
              return (
                <button
                  key={r.text}
                  onClick={() => setSel(i)}
                  aria-pressed={on}
                  aria-label={`${r.fit ? "Passend stukje" : "Ontbrekend stukje"}: ${r.text}`}
                  className="rounded-xl transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    ["--tw-ring-color" as string]: stroke,
                    ["--tw-ring-offset-color" as string]: C.paper,
                  }}
                >
                  <PuzzlePiece
                    edges={REQ_EDGES[i % REQ_EDGES.length] as Edges}
                    size={72}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={on ? 3 : 2}
                    dashed={!r.fit}
                    title={r.text}
                  >
                    {r.fit ? (
                      <Check
                        size={20}
                        strokeWidth={2.8}
                        style={{ color: on ? C.paper : C.teal }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Plus
                        size={20}
                        strokeWidth={2.8}
                        style={{ color: C.warn }}
                        aria-hidden="true"
                      />
                    )}
                  </PuzzlePiece>
                </button>
              );
            })}
          </div>

          {/* Uitleg van geselecteerd stukje */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={
                  selReq?.fit
                    ? { ...sans, background: C.tealSoft, color: C.teal }
                    : { ...sans, background: C.warnSoft, color: C.warn }
                }
              >
                {selReq?.fit ? (
                  <>
                    <Check size={12} strokeWidth={2.8} aria-hidden="true" /> Dit stukje klikt
                  </>
                ) : (
                  <>
                    <TriangleAlert size={12} strokeWidth={2.6} aria-hidden="true" /> Dit stukje
                    ontbreekt nog
                  </>
                )}
              </span>
              <span className="text-[11px] font-medium" style={{ ...mono, color: C.mut }}>
                {reqs.filter((r) => r.fit).length}/{reqs.length} passend
              </span>
            </div>
            <p
              className="mt-3 text-[16px] font-semibold leading-snug"
              style={{ ...sans, color: C.ink }}
            >
              {selReq ? selReq.text : "Selecteer een stukje."}
            </p>
            <p
              className="mt-2 text-[13px] font-medium leading-relaxed"
              style={{ color: C.inkSoft }}
            >
              {selReq?.fit
                ? "Deze eis sluit aan op je geverifieerde profiel — het stukje valt meteen op zijn plek."
                : "Vul dit stukje aan om de puzzel compleet te maken en je match te verhogen."}
            </p>

            {/* Error-voorbeeld: ontbrekend verplicht stukje blokkeert compleetheid */}
            {selReq && !selReq.fit && (
              <div
                className="mt-4 flex items-start gap-2.5 rounded-xl p-3 text-[12.5px] font-medium"
                role="alert"
                style={{
                  background: C.warnSoft,
                  color: C.warn,
                  boxShadow: `inset 0 0 0 1px #eecf95`,
                }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.4}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span>
                  Zonder dit stukje blijft je match onder {opdracht.match + 4}%. Vul het aan of geef
                  aan dat je het kunt regelen.
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...sans,
            background: C.teal,
            color: C.paper,
            ...softShadow,
            ["--tw-ring-color" as string]: C.teal,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[13px] font-bold transition-colors hover:bg-[#f3ebda] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...sans,
            background: C.paper,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.lineStrong}`,
            ["--tw-ring-color" as string]: C.ink,
          }}
        >
          <Star size={15} strokeWidth={2.4} aria-hidden="true" /> Bewaar
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead num="04" Icon={ShieldCheck}>
          Verificatie &amp; certificaten
        </SectionHead>
        <button
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12.5px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...sans,
            background: C.ink,
            color: C.paper,
            ["--tw-ring-color" as string]: C.ink,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Stukje toevoegen
        </button>
      </div>

      <Card bg={C.ink} className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-5 p-6">
          <div className="flex items-center gap-5">
            <div
              className="text-[50px] font-extrabold leading-none tracking-[-0.03em]"
              style={{ ...display, color: C.amberBright }}
            >
              {dek}
              <span className="text-[22px]" style={{ color: "#c9bfae" }}>
                %
              </span>
            </div>
            <div className="max-w-xs">
              <div className="text-[15px] font-extrabold" style={{ ...display, color: C.paper }}>
                {verified}/{CREDENTIALS.length} stukjes op hun plek
              </div>
              <p
                className="mt-1 text-[12.5px] font-medium leading-snug"
                style={{ color: "#c9bfae" }}
              >
                Opdrachtgevers zien alleen geverifieerde certificaten. Meer passende stukjes = meer
                vertrouwen.
              </p>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold"
            style={{ ...sans, background: "rgba(255,190,61,0.16)", color: C.amberBright }}
          >
            <BadgeCheck size={14} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          const fit = c.status === "VERIFIED";
          return (
            <Card key={c.naam} interactive className="flex items-stretch gap-4 p-4">
              <span className="shrink-0 self-center" aria-hidden="true">
                <PuzzlePiece
                  edges={{ top: 0, right: 1, bottom: 0, left: -1 }}
                  size={54}
                  fill={fit ? C.tealSoft : C.cream}
                  stroke={m.fg}
                  strokeWidth={2}
                  dashed={c.status === "REJECTED"}
                >
                  <m.Icon size={18} strokeWidth={2.6} style={{ color: m.fg }} />
                </PuzzlePiece>
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14.5px] font-extrabold tracking-[-0.01em]"
                  style={{ ...display, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px] font-medium" style={{ color: C.mut }}>
                  {c.detail}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...sans,
                        background: C.amberSoft,
                        color: C.warn,
                        ["--tw-ring-color" as string]: C.warn,
                      }}
                    >
                      {c.status === "EXPIRING"
                        ? "Vernieuwen"
                        : c.status === "REJECTED"
                          ? "Opnieuw indienen"
                          : "Bekijk"}
                    </button>
                  )}
                </div>
                {/* Error-voorbeeld: afgewezen stukje vereist een reden */}
                {c.status === "REJECTED" && (
                  <div
                    className="mt-2.5 flex items-start gap-2 rounded-lg p-2.5 text-[11.5px] font-medium"
                    role="alert"
                    style={{
                      background: C.dangerSoft,
                      color: C.danger,
                      boxShadow: `inset 0 0 0 1px #f0b5b1`,
                    }}
                  >
                    <XCircle
                      size={13}
                      strokeWidth={2.4}
                      className="mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      Reden vereist: het document was onleesbaar. Upload een scherpere scan.
                    </span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties (next-action) ──────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );

  return (
    <div className="space-y-6">
      <div>
        <SectionHead num="05" Icon={Sparkles}>
          Volgende beste stappen
        </SectionHead>
        <p className="mt-2 text-[13px] font-medium" style={{ color: C.mut }}>
          Op volgorde van urgentie — leg het bovenste stukje eerst.
        </p>
      </div>

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card
                interactive
                className="flex items-stretch gap-4 p-5"
                style={warn ? { boxShadow: `inset 0 0 0 1.5px ${C.amber}, ${LIFT}` } : undefined}
              >
                <span className="shrink-0 self-center" aria-hidden="true">
                  <PuzzlePiece
                    edges={{ top: 0, right: 1, bottom: 0, left: -1 }}
                    size={56}
                    fill={warn ? C.amber : C.creamDeep}
                    stroke={warn ? C.warn : C.lineStrong}
                    strokeWidth={2}
                  >
                    {warn ? (
                      <TriangleAlert size={20} strokeWidth={2.6} style={{ color: C.ink }} />
                    ) : (
                      <span
                        className="text-[18px] font-extrabold"
                        style={{ ...display, color: C.inkSoft }}
                      >
                        {i + 1}
                      </span>
                    )}
                  </PuzzlePiece>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
                      style={{
                        ...mono,
                        background: warn ? C.warnSoft : C.tealSoft,
                        color: warn ? C.warn : C.teal,
                      }}
                    >
                      {warn ? (
                        <TriangleAlert size={11} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <Star size={11} strokeWidth={2.6} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Kans"}
                    </span>
                    <h3
                      className="text-[15.5px] font-extrabold tracking-[-0.01em]"
                      style={{ ...display, color: C.ink }}
                    >
                      {a.titel}
                    </h3>
                  </div>
                  <p
                    className="mt-1.5 text-[13px] font-medium leading-relaxed"
                    style={{ color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <button
                    className="mt-3.5 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={
                      warn
                        ? {
                            ...sans,
                            background: C.amber,
                            color: C.ink,
                            ["--tw-ring-color" as string]: C.amber,
                          }
                        : {
                            ...sans,
                            background: C.ink,
                            color: C.paper,
                            ["--tw-ring-color" as string]: C.ink,
                          }
                    }
                  >
                    {a.cta} <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ──────────────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; fg: string; bg: string } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okSoft };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.warn, bg: C.warnSoft };
    return { label: "Concept", Icon: FileText, fg: C.inkSoft, bg: C.creamDeep };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead num="06" Icon={FileText}>
          Facturen
        </SectionHead>
        <button
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12.5px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...sans,
            background: C.teal,
            color: C.paper,
            ["--tw-ring-color" as string]: C.teal,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, bg: C.ink, fg: C.amberBright, sub: "#c9bfae" },
          { l: "Openstaand", v: `${open}`, bg: C.amberSoft, fg: C.warn, sub: C.warn },
          { l: "Te factureren", v: "€ 1.350", bg: C.paper, fg: C.ink, sub: C.mut },
        ].map((s) => (
          <Card key={s.l} interactive bg={s.bg} className="p-4">
            <div
              className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...mono, color: s.sub }}
            >
              {s.l}
            </div>
            <div
              className="mt-2 text-[24px] font-extrabold leading-none tracking-[-0.02em]"
              style={{ ...display, color: s.fg }}
            >
              {s.v}
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <ul>
          {FACTUREN.map((f, i) => {
            const m = factMeta(f.status);
            return (
              <li
                key={f.nr}
                className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#faf5eb]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: m.bg }}
                  aria-hidden="true"
                >
                  <m.Icon size={15} strokeWidth={2.6} style={{ color: m.fg }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[13.5px] font-extrabold tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {f.nr}
                  </div>
                  <div className="text-[12px] font-medium" style={{ color: C.mut }}>
                    {f.klant} · {f.datum}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ ...sans, background: m.bg, color: m.fg }}
                >
                  <m.Icon size={12} strokeWidth={2.6} aria-hidden="true" /> {m.label}
                </span>
                <span
                  className="w-24 text-right text-[15px] font-extrabold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-center justify-between px-4 py-3.5"
          style={{ background: C.ink }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...mono, color: "#c9bfae" }}
          >
            Totaal betaald
          </span>
          <span
            className="text-[17px] font-extrabold tabular-nums"
            style={{ ...display, color: C.amberBright }}
          >
            {betaald}
          </span>
        </div>
      </Card>
    </div>
  );
}
