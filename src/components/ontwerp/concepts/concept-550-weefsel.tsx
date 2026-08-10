"use client";

// Concept 550 — "Weefsel" · DATA-FABRIC / RELATIE-GRAAF.
// Matching als een web van verbindingen: een in SVG getekend netwerk dat profiel ↔ opdracht ↔
// vereiste bewijzen verbindt — verklaarbare matching als relatiegraaf. Hover/klik op een knoop
// licht zijn verbindingen op. 2026-trends: donkere technische canvas, verklaarbaarheid-first,
// glow-accenten, node-graph UI en dichte-data-met-focus. Geen externe graph-library; puur SVG.

import { useMemo, useState } from "react";
import {
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  ArrowRight,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Zap,
  User,
  FileBadge,
  Briefcase,
  ChevronRight,
  Plus,
  Minus,
  Network,
  RotateCcw,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet: donkere technische canvas, cyaan + violet glow ────────────────────────────────────
const C = {
  bg: "#0a0d14",
  surface: "#111623",
  surfaceSoft: "#18202f",
  ink: "#e9edf6",
  inkSoft: "#98a3ba",
  inkFaint: "#5c667d",
  cyan: "#34d6c6",
  cyanSoft: "rgba(52,214,198,0.14)",
  violet: "#8b7bff",
  violetSoft: "rgba(139,123,255,0.15)",
  green: "#37c07a",
  greenSoft: "rgba(55,192,122,0.15)",
  amber: "#e0a53a",
  amberSoft: "rgba(224,165,58,0.15)",
  red: "#f0685f",
  redSoft: "rgba(240,104,95,0.15)",
  line: "#222c3e",
  lineStrong: "#2e3a50",
};

const sans = { fontFamily: "var(--font-lab-geist), var(--font-lab-inter), system-ui" };
const mono = { fontFamily: "var(--font-lab-mono), monospace" };

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  soft: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.green, soft: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.cyan, soft: C.cyanSoft };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        tone: C.amber,
        soft: C.amberSoft,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red, soft: C.redSoft };
  }
}

function matchTone(v: number): string {
  return v >= 90 ? C.green : v >= 80 ? C.amber : C.cyan;
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

// ── Graafmodel ────────────────────────────────────────────────────────────────────────────────
type NodeKind = "profiel" | "credential" | "opdracht";
type GNode = {
  id: string;
  kind: NodeKind;
  label: string;
  sub?: string;
  x: number;
  y: number;
  status?: CredStatus;
  match?: number;
};
type GEdge = { a: string; b: string };

const GW = 760;
const GH = 420;

function buildGraph(opdrachten: Opdracht[]): { nodes: GNode[]; edges: GEdge[] } {
  const nodes: GNode[] = [];
  nodes.push({
    id: "profiel",
    kind: "profiel",
    label: PROFIEL.naam,
    sub: PROFIEL.rol,
    x: GW / 2,
    y: GH / 2,
  });

  const credN = CREDENTIALS.length;
  CREDENTIALS.forEach((c, i) => {
    const t = credN === 1 ? 0.5 : i / (credN - 1);
    nodes.push({
      id: `cr-${i}`,
      kind: "credential",
      label: c.naam,
      x: 118,
      y: 60 + t * (GH - 120),
      status: c.status,
    });
  });

  const opN = opdrachten.length;
  opdrachten.forEach((o, i) => {
    const t = opN === 1 ? 0.5 : i / (opN - 1);
    nodes.push({
      id: `op-${o.id}`,
      kind: "opdracht",
      label: o.titel,
      sub: o.opdrachtgever,
      x: GW - 118,
      y: 60 + t * (GH - 120),
      match: o.match,
    });
  });

  const edges: GEdge[] = [];
  CREDENTIALS.forEach((_, i) => edges.push({ a: "profiel", b: `cr-${i}` }));
  opdrachten.forEach((o) => edges.push({ a: "profiel", b: `op-${o.id}` }));
  opdrachten.forEach((o, oi) => {
    edges.push({ a: `op-${o.id}`, b: `cr-${oi % credN}` });
    if (credN > 1) edges.push({ a: `op-${o.id}`, b: `cr-${(oi + 1) % credN}` });
  });

  return { nodes, edges };
}

function nodeTone(n: GNode): string {
  if (n.kind === "profiel") return C.violet;
  if (n.kind === "opdracht") return matchTone(n.match ?? 0);
  return n.status ? statusMeta(n.status).tone : C.cyan;
}

// ── Graaf-verkenner ─────────────────────────────────────────────────────────────────────────
function GraphExplorer({ opdrachten, compact }: { opdrachten: Opdracht[]; compact?: boolean }) {
  const { nodes, edges } = useMemo(() => buildGraph(opdrachten), [opdrachten]);
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>("profiel");
  const focused = hover ?? selected;

  const nodeById = useMemo(() => {
    const m = new Map<string, GNode>();
    nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [nodes]);

  const neighbors = useMemo(() => {
    const m = new Map<string, Set<string>>();
    nodes.forEach((n) => m.set(n.id, new Set()));
    edges.forEach((e) => {
      m.get(e.a)?.add(e.b);
      m.get(e.b)?.add(e.a);
    });
    return m;
  }, [nodes, edges]);

  const isEdgeHot = (e: GEdge) => !focused || e.a === focused || e.b === focused;
  const isNodeHot = (id: string) =>
    !focused || id === focused || (neighbors.get(focused)?.has(id) ?? false);

  const detail = focused ? nodeById.get(focused) : undefined;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
      <div
        className="overflow-hidden rounded-2xl"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <div className="flex items-center justify-between px-4 pt-3">
          <div
            className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide"
            style={{ color: C.inkFaint, ...mono }}
          >
            <Network size={13} style={{ color: C.cyan }} aria-hidden="true" />
            relatie-weefsel
          </div>
          <button
            type="button"
            onClick={() => {
              setSelected("profiel");
              setHover(null);
            }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.inkSoft, "--tw-ring-color": C.cyan } as React.CSSProperties}
          >
            <RotateCcw size={12} aria-hidden="true" />
            Reset
          </button>
        </div>
        <svg
          viewBox={`0 0 ${GW} ${GH}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Relatiegraaf die profiel ${PROFIEL.naam} verbindt met ${opdrachten.length} opdrachten en ${CREDENTIALS.length} bewijsstukken. Selecteer een knoop om verbindingen te belichten.`}
          style={{ maxHeight: compact ? 300 : 440 }}
        >
          {/* Edges */}
          {edges.map((e, i) => {
            const a = nodeById.get(e.a);
            const b = nodeById.get(e.b);
            if (!a || !b) return null;
            const hot = isEdgeHot(e);
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2 - 26;
            return (
              <path
                key={i}
                d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
                fill="none"
                stroke={hot ? C.cyan : C.line}
                strokeWidth={hot ? 1.8 : 1}
                strokeOpacity={hot ? 0.9 : 0.5}
                className={hot ? "wf-edge-hot" : ""}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((n) => {
            const tone = nodeTone(n);
            const hot = isNodeHot(n.id);
            const isFocus = n.id === focused;
            const r = n.kind === "profiel" ? 26 : 15;
            const labelX =
              n.kind === "credential" ? n.x - r - 8 : n.kind === "opdracht" ? n.x + r + 8 : n.x;
            const anchor =
              n.kind === "credential" ? "end" : n.kind === "opdracht" ? "start" : "middle";
            const labelY = n.kind === "profiel" ? n.y + r + 16 : n.y + 4;
            return (
              <g
                key={n.id}
                style={{
                  cursor: "pointer",
                  opacity: hot ? 1 : 0.32,
                  transition: "opacity 0.25s ease",
                }}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setSelected(n.id)}
              >
                {isFocus && (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={r + 7}
                    fill="none"
                    stroke={tone}
                    strokeOpacity={0.4}
                    strokeWidth={2}
                    className="wf-pulse"
                  />
                )}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r}
                  fill={C.surfaceSoft}
                  stroke={tone}
                  strokeWidth={isFocus ? 3 : 2}
                />
                <circle cx={n.x} cy={n.y} r={r - 6} fill={tone} fillOpacity={0.9} />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={anchor}
                  fontSize={n.kind === "profiel" ? 12 : 10.5}
                  fontWeight={isFocus ? 700 : 500}
                  fill={hot ? C.ink : C.inkFaint}
                  style={sans}
                >
                  {n.kind === "profiel"
                    ? PROFIEL.initialen
                    : n.kind === "opdracht"
                      ? (n.id.replace("op-", "") as string)
                      : truncate(n.label, 16)}
                </text>
              </g>
            );
          })}
        </svg>
        {/* Toegankelijke bediening voor toetsenbord */}
        <div className="flex flex-wrap gap-1.5 px-4 pb-4">
          {nodes.map((n) => {
            const on = n.id === selected;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => setSelected(n.id)}
                aria-pressed={on}
                className="rounded-md px-2 py-1 text-[10.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  {
                    background: on ? nodeTone(n) : C.surfaceSoft,
                    color: on ? "#0a0d14" : C.inkSoft,
                    "--tw-ring-color": C.cyan,
                    ...mono,
                  } as React.CSSProperties
                }
              >
                {n.kind === "profiel"
                  ? "profiel"
                  : n.kind === "opdracht"
                    ? n.id.replace("op-", "")
                    : truncate(n.label, 12)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailpaneel */}
      <div
        className="rounded-2xl p-5"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <NodeDetail node={detail} />
      </div>
    </div>
  );
}

function NodeDetail({ node }: { node: GNode | undefined }) {
  if (!node) {
    return (
      <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
        Kies een knoop in het weefsel om de relaties te zien.
      </p>
    );
  }
  if (node.kind === "profiel") {
    const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
    return (
      <div>
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: C.violetSoft }}
          >
            <User size={20} style={{ color: C.violet }} aria-hidden="true" />
          </span>
          <div>
            <div className="text-[15px] font-semibold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[12px]" style={{ color: C.inkSoft }}>
              {PROFIEL.rol}
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-[12.5px]" style={{ color: C.inkSoft }}>
          <div className="flex items-center justify-between">
            <span>Vertrouwen</span>
            <span className="font-semibold" style={{ color: C.green }}>
              {PROFIEL.trust}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Geverifieerd</span>
            <span className="font-semibold" style={{ color: C.ink, ...mono }}>
              {verified}/{CREDENTIALS.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Actieve matches</span>
            <span className="font-semibold" style={{ color: C.ink, ...mono }}>
              {OPDRACHTEN.length}
            </span>
          </div>
        </div>
        <p className="mt-4 text-[12px] leading-relaxed" style={{ color: C.inkFaint }}>
          Het weefsel verbindt je profiel met opdrachten via de bewijsstukken die zij vereisen. Hoe
          sterker de verbinding, hoe beter de match.
        </p>
      </div>
    );
  }
  if (node.kind === "credential") {
    const idx = Number(node.id.replace("cr-", ""));
    const c = CREDENTIALS[idx];
    if (!c) return null;
    const m = statusMeta(c.status);
    return (
      <div>
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: m.soft }}
          >
            <FileBadge size={20} style={{ color: m.tone }} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold" style={{ color: C.ink }}>
              {c.naam}
            </div>
            <div className="truncate text-[12px]" style={{ color: C.inkSoft }}>
              {c.detail}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: m.soft, color: m.tone }}
          >
            <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
            {m.label}
          </span>
        </div>
        <p className="mt-4 text-[12px] leading-relaxed" style={{ color: C.inkFaint }}>
          Dit bewijsstuk verbindt je met opdrachten die het vereisen. Server-side geverifieerd —
          opdrachtgevers zien alleen de status.
        </p>
      </div>
    );
  }
  // opdracht
  const o = OPDRACHTEN.find((x) => `op-${x.id}` === node.id);
  if (!o) return null;
  const tone = matchTone(o.match);
  return (
    <div>
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: C.cyanSoft }}
        >
          <Briefcase size={20} style={{ color: tone }} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold leading-snug" style={{ color: C.ink }}>
            {o.titel}
          </div>
          <div className="truncate text-[12px]" style={{ color: C.inkSoft }}>
            {o.opdrachtgever} · {o.plaats}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-[12.5px]">
        <span style={{ color: C.inkSoft }}>Match</span>
        <span className="font-bold" style={{ color: tone, ...mono }}>
          {o.match}%
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        {o.redenen.plus.slice(0, 3).map((r) => (
          <div
            key={r}
            className="flex items-start gap-1.5 text-[12px]"
            style={{ color: C.inkSoft }}
          >
            <Plus
              size={12}
              strokeWidth={3}
              className="mt-0.5 shrink-0"
              style={{ color: C.green }}
              aria-hidden="true"
            />
            {r}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Hoofdcomponent ──────────────────────────────────────────────────────────────────────────
export function Concept550() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [selectedId, setSelectedId] = useState<string>(OPDRACHTEN[0]?.id ?? "");

  const openOpdracht = (id: string) => {
    setSelectedId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...sans, background: C.bg, color: C.ink }}
    >
      <style>{`
        @keyframes wf-dash { to { stroke-dashoffset: -16; } }
        @keyframes wf-pulse { 0% { opacity: 0.5; transform: scale(1); } 100% { opacity: 0; transform: scale(1.35); } }
        .wf-edge-hot { stroke-dasharray: 4 4; animation: wf-dash 0.9s linear infinite; }
        .wf-pulse { transform-box: fill-box; transform-origin: center; animation: wf-pulse 1.8s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .wf-edge-hot { animation: none; stroke-dasharray: none; }
          .wf-pulse { animation: none; }
        }
      `}</style>

      {/* Kop */}
      <header
        className="flex items-center justify-between gap-3 px-4 py-3 md:px-6"
        style={{ background: C.surface, borderBottom: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: C.cyanSoft, border: `1px solid ${C.cyan}` }}
          >
            <Network size={16} strokeWidth={2.2} style={{ color: C.cyan }} aria-hidden="true" />
          </span>
          <div className="leading-none">
            <div className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em]">
              Weefsel
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]"
                style={{ background: C.cyanSoft, color: C.cyan, ...mono }}
              >
                fabric
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex"
            style={{ background: C.greenSoft, color: C.green }}
          >
            <ShieldCheck size={13} aria-hidden="true" />
            {PROFIEL.trust}
          </span>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold"
            style={{ background: C.violetSoft, color: C.violet }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Nav */}
      <nav
        className="flex items-center gap-1 overflow-x-auto px-3 py-2 md:px-5"
        style={{ background: C.surface, borderBottom: `1px solid ${C.line}` }}
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
              className="shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={
                {
                  background: on ? C.cyanSoft : "transparent",
                  color: on ? C.cyan : C.inkSoft,
                  "--tw-ring-color": C.cyan,
                } as React.CSSProperties
              }
            >
              {s.label}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-7">
        {screen === "dashboard" && <Dashboard onActies={() => setScreen("acties")} />}
        {screen === "marktplaats" && <Marktplaats onOpen={openOpdracht} />}
        {screen === "opdracht" && (
          <OpdrachtDetail id={selectedId} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────────────────────
function Dashboard({ onActies }: { onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[18px] font-semibold tracking-[-0.01em]">Weefsel-overzicht</h1>
        <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
          Zie hoe je profiel, opdrachten en bewijsstukken samenhangen.
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="rounded-xl p-4"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <div className="text-[11px] font-medium" style={{ color: C.inkFaint }}>
              {k.label}
            </div>
            <div className="mt-1 text-[20px] font-semibold tracking-[-0.02em]" style={mono}>
              {k.value}
            </div>
            <div
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold"
              style={{ color: k.up ? C.green : C.amber }}
            >
              {k.up ? (
                <TrendingUp size={12} aria-hidden="true" />
              ) : (
                <TrendingDown size={12} aria-hidden="true" />
              )}
              {k.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Volgende actie */}
      <button
        type="button"
        onClick={onActies}
        className="group flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={
          {
            background: C.surfaceSoft,
            border: `1px solid ${C.lineStrong}`,
            "--tw-ring-color": C.cyan,
          } as React.CSSProperties
        }
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ background: C.cyanSoft }}
        >
          <Zap size={18} style={{ color: C.cyan }} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.inkFaint, ...mono }}
          >
            Volgende beste actie
          </div>
          <div className="truncate text-[13.5px] font-semibold">{primair.titel}</div>
        </div>
        <ArrowRight
          size={17}
          className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
          style={{ color: C.cyan }}
          aria-hidden="true"
        />
      </button>

      <GraphExplorer opdrachten={OPDRACHTEN} />
    </div>
  );
}

// ── Marktplaats: graaf met zoek + leeg/laad/fout ─────────────────────────────────────────────
type FeedState = "data" | "loading" | "error";

function Marktplaats({ onOpen }: { onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [feed, setFeed] = useState<FeedState>("data");

  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[18px] font-semibold tracking-[-0.01em]">Marktplaats-weefsel</h1>
        <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
          Filter opdrachten en zie het netwerk zich hervormen.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <Search size={16} style={{ color: C.inkFaint }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter het weefsel…"
            aria-label="Zoek opdrachten"
            className="w-full bg-transparent text-[13px] outline-none"
            style={{ color: C.ink }}
          />
        </div>
        <div
          className="inline-flex rounded-xl p-1"
          style={{ background: C.surfaceSoft, border: `1px solid ${C.line}` }}
        >
          {(["data", "loading", "error"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFeed(f)}
              aria-pressed={feed === f}
              className="rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={
                {
                  background: feed === f ? C.cyan : "transparent",
                  color: feed === f ? "#0a0d14" : C.inkSoft,
                  "--tw-ring-color": C.cyan,
                  ...mono,
                } as React.CSSProperties
              }
            >
              {f === "data" ? "Data" : f === "loading" ? "Laden" : "Fout"}
            </button>
          ))}
        </div>
      </div>

      {feed === "loading" ? (
        <div
          className="flex items-center justify-center rounded-2xl py-24"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-3">
            <span
              className="h-8 w-8 animate-spin rounded-full border-2 motion-reduce:animate-none"
              style={{ borderColor: C.line, borderTopColor: C.cyan }}
              aria-hidden="true"
            />
            <span className="text-[12px]" style={{ color: C.inkSoft, ...mono }}>
              weefsel laden…
            </span>
          </div>
        </div>
      ) : feed === "error" ? (
        <div
          className="flex flex-col items-center rounded-2xl py-16 text-center"
          style={{ background: C.redSoft, border: `1px solid ${C.line}` }}
          role="alert"
        >
          <XCircle size={26} style={{ color: C.red }} aria-hidden="true" />
          <h2 className="mt-3 text-[14px] font-semibold">Verbinding met het weefsel verbroken</h2>
          <p className="mt-1 text-[12px]" style={{ color: C.inkSoft }}>
            De relaties konden niet worden opgehaald. Probeer het opnieuw.
          </p>
          <button
            type="button"
            onClick={() => setFeed("data")}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={
              {
                background: C.red,
                color: "#0a0d14",
                "--tw-ring-color": C.red,
              } as React.CSSProperties
            }
          >
            <RotateCcw size={14} aria-hidden="true" />
            Opnieuw verbinden
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="flex flex-col items-center rounded-2xl py-16 text-center"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <Network size={26} style={{ color: C.inkFaint }} aria-hidden="true" />
          <h2 className="mt-3 text-[14px] font-semibold">Geen knopen in het weefsel</h2>
          <p className="mt-1 text-[12px]" style={{ color: C.inkSoft }}>
            Geen opdrachten voor “{q}”. Pas je filter aan.
          </p>
        </div>
      ) : (
        <>
          <GraphExplorer opdrachten={filtered} />
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => onOpen(o.id)}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={
                    {
                      background: C.surface,
                      border: `1px solid ${C.line}`,
                      ["--hov" as string]: C.surfaceSoft,
                      "--tw-ring-color": C.cyan,
                    } as React.CSSProperties
                  }
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                    style={{ background: C.cyanSoft, color: matchTone(o.match), ...mono }}
                  >
                    {o.match}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold">{o.titel}</div>
                    <div className="truncate text-[11.5px]" style={{ color: C.inkSoft }}>
                      {o.opdrachtgever} · {o.tarief}
                    </div>
                  </div>
                  <ChevronRight size={15} style={{ color: C.inkFaint }} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ── Opdracht-detail ─────────────────────────────────────────────────────────────────────────
function OpdrachtDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const o = OPDRACHTEN.find((x) => x.id === id) ?? (OPDRACHTEN[0] as Opdracht);
  const [applied, setApplied] = useState(false);
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.inkSoft, "--tw-ring-color": C.cyan } as React.CSSProperties}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" />
        Terug naar marktplaats
      </button>

      <div
        className="rounded-2xl p-5"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div
              className="text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.inkFaint, ...mono }}
            >
              {o.id}
            </div>
            <h1 className="mt-1 text-[20px] font-semibold leading-tight tracking-[-0.01em]">
              {o.titel}
            </h1>
            <div className="mt-1 text-[13px]" style={{ color: C.inkSoft }}>
              {o.opdrachtgever} · {o.plaats}
            </div>
          </div>
          <span
            className="rounded-lg px-3 py-1.5 text-[13px] font-bold"
            style={{ background: C.cyanSoft, color: matchTone(o.match), ...mono }}
          >
            {o.match}% match
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { k: "Tarief", v: o.tarief },
            { k: "Inzet", v: o.uren },
            { k: "Start", v: o.start },
            { k: "Plaats", v: o.plaats },
          ].map((m) => (
            <div key={m.k} className="rounded-lg p-3" style={{ background: C.surfaceSoft }}>
              <div
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: C.inkFaint }}
              >
                {m.k}
              </div>
              <div className="mt-0.5 text-[13px] font-semibold" style={mono}>
                {m.v}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Focus-weefsel voor deze opdracht */}
      <GraphExplorer opdrachten={[o]} compact />

      <div className="grid gap-4 md:grid-cols-2">
        <div
          className="rounded-2xl p-4"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <div
            className="flex items-center gap-1.5 text-[12px] font-bold"
            style={{ color: C.green }}
          >
            <Plus size={14} strokeWidth={3} aria-hidden="true" />
            Sterke verbindingen
          </div>
          <ul className="mt-2 space-y-1.5">
            {o.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-1.5 text-[12.5px]"
                style={{ color: C.inkSoft }}
              >
                <Check
                  size={13}
                  strokeWidth={2.8}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div
          className="rounded-2xl p-4"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <div
            className="flex items-center gap-1.5 text-[12px] font-bold"
            style={{ color: C.amber }}
          >
            <Minus size={14} strokeWidth={3} aria-hidden="true" />
            Zwakke plekken
          </div>
          <ul className="mt-2 space-y-1.5">
            {o.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-1.5 text-[12.5px]"
                style={{ color: C.inkSoft }}
              >
                <AlertTriangle
                  size={13}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setApplied(true)}
        disabled={applied}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13.5px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-70 motion-reduce:hover:translate-y-0"
        style={
          {
            background: applied ? C.green : C.cyan,
            color: "#0a0d14",
            "--tw-ring-color": C.cyan,
          } as React.CSSProperties
        }
      >
        {applied ? (
          <Check size={16} aria-hidden="true" />
        ) : (
          <ArrowUpRight size={16} aria-hidden="true" />
        )}
        {applied ? "Reactie verstuurd" : "Reageer op opdracht"}
      </button>
    </div>
  );
}

// ── Verificatie ─────────────────────────────────────────────────────────────────────────────
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[18px] font-semibold tracking-[-0.01em]">Bewijsstukken</h1>
          <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
            De knopen die je aan opdrachten verbinden.
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
          style={{ background: C.greenSoft, color: C.green }}
        >
          <ShieldCheck size={14} aria-hidden="true" />
          {verified}/{CREDENTIALS.length} geverifieerd
        </span>
      </div>
      <div className="rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
        {CREDENTIALS.map((c, i) => {
          const m = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <div key={c.naam} style={{ borderTop: i ? `1px solid ${C.line}` : undefined }}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : c.naam)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={
                  {
                    ["--hov" as string]: C.surfaceSoft,
                    "--tw-ring-color": C.cyan,
                  } as React.CSSProperties
                }
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: m.soft }}
                >
                  <m.Icon
                    size={16}
                    strokeWidth={2.4}
                    style={{ color: m.tone }}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold">{c.naam}</div>
                  <div className="truncate text-[12px]" style={{ color: C.inkSoft }}>
                    {c.detail}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: m.soft, color: m.tone }}
                >
                  <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
                  {m.label}
                </span>
                <ChevronRight
                  size={16}
                  className="transition-transform"
                  style={{ color: C.inkFaint, transform: isOpen ? "rotate(90deg)" : undefined }}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <p className="px-4 pb-4 pl-16 text-[12.5px]" style={{ color: C.inkSoft }}>
                  Server-side geverifieerd. Dit bewijsstuk verbindt je met alle opdrachten die het
                  vereisen — bij verlopen status verzwakt de verbinding automatisch.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties ─────────────────────────────────────────────────────────────────────────────────
function Acties() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[18px] font-semibold tracking-[-0.01em]">Acties</h1>
        <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
          Versterk de verbindingen in je weefsel.
        </p>
      </div>
      <ul className="space-y-2.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const isOpen = open === i;
          return (
            <li
              key={a.titel}
              className="overflow-hidden rounded-2xl"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{ "--tw-ring-color": C.cyan } as React.CSSProperties}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: warn ? C.amberSoft : C.cyanSoft }}
                >
                  {warn ? (
                    <AlertTriangle size={16} style={{ color: C.amber }} aria-hidden="true" />
                  ) : (
                    <Zap size={16} style={{ color: C.cyan }} aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold">{a.titel}</div>
                  {!isOpen && (
                    <div className="truncate text-[12px]" style={{ color: C.inkSoft }}>
                      {a.detail}
                    </div>
                  )}
                </div>
                <ChevronRight
                  size={16}
                  className="transition-transform"
                  style={{ color: C.inkFaint, transform: isOpen ? "rotate(90deg)" : undefined }}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pl-[60px]">
                  <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
                    {a.detail}
                  </p>
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0"
                    style={
                      {
                        background: warn ? C.amber : C.cyan,
                        color: "#0a0d14",
                        "--tw-ring-color": C.cyan,
                      } as React.CSSProperties
                    }
                  >
                    {a.cta}
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────────────────
function Facturen() {
  const toneFor = (s: string) =>
    s === "Betaald" ? C.green : s === "Openstaand" ? C.amber : C.inkFaint;
  const softFor = (s: string) =>
    s === "Betaald" ? C.greenSoft : s === "Openstaand" ? C.amberSoft : C.surfaceSoft;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[18px] font-semibold tracking-[-0.01em]">Facturen</h1>
        <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
          {FACTUREN.filter((f) => f.status === "Openstaand").length} openstaand.
        </p>
      </div>
      <div
        className="overflow-hidden rounded-2xl"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        {FACTUREN.map((f, i) => (
          <div
            key={f.nr}
            className="flex items-center gap-3 p-4"
            style={{ borderTop: i ? `1px solid ${C.line}` : undefined }}
          >
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold" style={mono}>
                {f.nr}
              </div>
              <div className="truncate text-[12px]" style={{ color: C.inkSoft }}>
                {f.klant} · {f.datum}
              </div>
            </div>
            <div className="text-[13.5px] font-bold tabular-nums" style={mono}>
              {f.bedrag}
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: softFor(f.status), color: toneFor(f.status) }}
            >
              {f.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
