"use client";

// Concept 139 — "Knooppunt" · force-directed relatiegraaf. Matching als LEVEND NETWERK: knopen
// (ZZP'er ↔ opdracht ↔ opdrachtgever ↔ credential) verbonden door hairline-edges met gewicht/kleur
// naar match-sterkte. Een centrale profiel-knoop waaiert uit naar opdrachten, opdrachtgevers en
// diploma's; hover licht een knoop + al zijn verbindingen op en edge-labels tonen de match-redenen.
// Verklaarbare matching als échte relatiegraaf — de kern-differentiatie. Onderscheidend van
// Sterrenbeeld (decoratieve constellatie) en Metrokaart (vaste lijnen): hier zijn het knopen/edges
// met match-gewichten. Deterministische, hardgecodeerde posities — geen physics-lib, geen random.
// Rustig licht canvas, ronde nodes met initialen. Fonts: Geist (display) + Geist Mono (data).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Share2,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Briefcase,
  Building2,
  BadgeCheck,
  Zap,
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

// ── Palet — rustig licht canvas, indigo/blauw accent + groen (sterke match) + amber (aandacht) ──
const C = {
  bg: "#f6f7fb",
  canvas: "#fbfcff", // graaf-canvas (iets lichter)
  panel: "#ffffff",
  panelSoft: "#f0f2f9",
  fg: "#141726",
  fgSoft: "#535a71",
  fgFaint: "#8b93a9",
  line: "#e5e8f2",
  lineStrong: "#d3d8e8",
  accent: "#4f46e5", // indigo — profiel / primair
  accentSoft: "#ecebfb",
  blue: "#2563eb", // opdracht
  slate: "#64748b", // opdrachtgever
  green: "#16a34a", // sterke match / geverifieerd
  amber: "#d97706", // aandacht / verloopt
  red: "#dc2626", // afgewezen
  edge: "#c3cadd", // hairline-edge (rust)
  edgeFaint: "#e2e6f1",
};

const display = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

// ── Graaf-model ────────────────────────────────────────────────────────────────
type NodeKind = "profile" | "opdracht" | "client" | "credential";
type GNode = {
  id: string;
  kind: NodeKind;
  label: string;
  sub?: string;
  init: string;
  x: number;
  y: number;
  tone: string;
  Icon: LucideIcon;
};
type GEdge = {
  from: string;
  to: string;
  label: string;
  weight?: number;
  tone: string;
  dashed?: boolean;
};

const KIND_META: Record<NodeKind, { r: number; ring: string; fill: string; label: string }> = {
  profile: { r: 34, ring: C.accent, fill: C.accentSoft, label: "Jij" },
  opdracht: { r: 26, ring: C.blue, fill: "#e6effe", label: "Opdracht" },
  client: { r: 22, ring: C.slate, fill: "#eef1f6", label: "Opdrachtgever" },
  credential: { r: 21, ring: C.green, fill: "#e7f6ec", label: "Credential" },
};

// Edge-toon naar match-sterkte.
function weightTone(w?: number): string {
  if (w === undefined) return C.edge;
  if (w >= 90) return C.green;
  if (w >= 80) return C.blue;
  return C.amber;
}

// ── Graaf-canvas — deterministische posities, hover licht ego-netwerk op ────────
function RelationGraph({
  nodes,
  edges,
  vb,
  hovered,
  onHover,
  height = 460,
}: {
  nodes: GNode[];
  edges: GEdge[];
  vb: string;
  hovered: string | null;
  onHover: (id: string | null) => void;
  height?: number;
}) {
  const nodeById = useMemo(() => {
    const m: Record<string, GNode> = {};
    for (const n of nodes) m[n.id] = n;
    return m;
  }, [nodes]);

  const activeEdge = (e: GEdge) => hovered === null || e.from === hovered || e.to === hovered;
  const activeNode = (id: string) => {
    if (hovered === null) return true;
    if (id === hovered) return true;
    return edges.some(
      (e) => (e.from === hovered && e.to === id) || (e.to === hovered && e.from === id),
    );
  };

  return (
    <svg
      viewBox={vb}
      className="w-full"
      style={{ height, maxHeight: "70vh" }}
      role="img"
      aria-label="Relatiegraaf van jouw profiel, opdrachten, opdrachtgevers en credentials"
    >
      {/* Punt-raster achtergrond */}
      <defs>
        <pattern id="knp-dots" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="1.2" cy="1.2" r="1.2" fill={C.line} />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#knp-dots)" opacity="0.7" />

      {/* Edges */}
      {edges.map((e, i) => {
        const a = nodeById[e.from];
        const b = nodeById[e.to];
        if (!a || !b) return null;
        const on = activeEdge(e);
        const tone = e.tone;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        // Lichte kromming voor leesbaarheid.
        const cx = mx + (a.y - b.y) * 0.08;
        const cy = my + (b.x - a.x) * 0.08;
        const showLabel = hovered !== null && on;
        const w = e.weight;
        const sw = w ? 1.2 + (w - 78) / 10 : 1.3;
        return (
          <g
            key={`${e.from}-${e.to}-${i}`}
            opacity={on ? 1 : 0.18}
            style={{ transition: "opacity .18s" }}
          >
            <path
              d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`}
              fill="none"
              stroke={tone}
              strokeWidth={on ? sw + 0.6 : sw}
              strokeDasharray={e.dashed ? "4 4" : undefined}
              strokeLinecap="round"
            />
            {showLabel && (
              <g>
                <rect
                  x={cx - e.label.length * 3.05 - 8}
                  y={cy - 10}
                  width={e.label.length * 6.1 + 16}
                  height={20}
                  rx={10}
                  fill={C.panel}
                  stroke={tone}
                  strokeWidth={1}
                />
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  style={mono}
                  fontSize="10.5"
                  fontWeight={600}
                  fill={tone}
                >
                  {e.label}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((n) => {
        const meta = KIND_META[n.kind];
        const on = activeNode(n.id);
        const isHover = hovered === n.id;
        return (
          <g
            key={n.id}
            transform={`translate(${n.x} ${n.y})`}
            opacity={on ? 1 : 0.28}
            style={{ transition: "opacity .18s", cursor: "pointer" }}
            onMouseEnter={() => onHover(n.id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(n.id)}
            onBlur={() => onHover(null)}
            tabIndex={0}
            role="button"
            aria-label={`${meta.label}: ${n.label}${n.sub ? `, ${n.sub}` : ""}`}
          >
            {isHover && (
              <circle r={meta.r + 7} fill="none" stroke={n.tone} strokeWidth={1.4} opacity={0.4} />
            )}
            <circle
              r={meta.r}
              fill={n.kind === "profile" ? n.tone : C.panel}
              stroke={n.tone}
              strokeWidth={isHover ? 2.4 : 1.6}
              style={{
                filter: isHover ? "drop-shadow(0 4px 10px rgba(20,23,38,0.16))" : "none",
                transition: "stroke-width .15s",
              }}
            />
            <text
              textAnchor="middle"
              y={n.kind === "profile" ? 5 : 4.5}
              style={display}
              fontSize={n.kind === "profile" ? 14 : 11.5}
              fontWeight={700}
              fill={n.kind === "profile" ? "#fff" : n.tone}
            >
              {n.init}
            </text>
            {/* Label onder node */}
            <text
              textAnchor="middle"
              y={meta.r + 15}
              style={display}
              fontSize="11"
              fontWeight={600}
              fill={C.fg}
            >
              {n.label.length > 22 ? `${n.label.slice(0, 21)}…` : n.label}
            </text>
            {n.sub && (
              <text
                textAnchor="middle"
                y={meta.r + 28}
                style={mono}
                fontSize="9.5"
                fill={C.fgFaint}
              >
                {n.sub}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Status-codering ──────────────────────────────────────────────────────────
function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.blue };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red };
  }
}

// ── Bouwstenen ─────────────────────────────────────────────────────────────────
function Panel({
  children,
  className = "",
  interactive = false,
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  accent?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl ${
        interactive
          ? "transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-14px_rgba(20,23,38,0.28)] motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px rgba(20,23,38,0.04)",
        ...(accent ? { borderLeft: `3px solid ${accent}` } : null),
      }}
    >
      {children}
    </div>
  );
}

function Pill({
  children,
  tone,
  solid = false,
}: {
  children: React.ReactNode;
  tone: string;
  solid?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none"
      style={
        solid
          ? { background: tone, color: "#fff" }
          : { background: `${tone}14`, color: tone, border: `1px solid ${tone}33` }
      }
    >
      {children}
    </span>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.2em]"
      style={{ ...mono, color: C.accent }}
    >
      <Share2 size={12} strokeWidth={2.4} aria-hidden="true" />
      {children}
    </div>
  );
}

function SectionKop({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      {sub && <Kicker>{sub}</Kicker>}
      <h2
        className="mt-1.5 text-[24px] font-semibold leading-none tracking-[-0.02em] sm:text-[28px]"
        style={{ ...display, color: C.fg }}
      >
        {children}
      </h2>
    </div>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 100;
    return `${x},${y}`;
  });
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
      <polyline points={`0,100 ${pts.join(" ")} 100,100`} fill={tone} opacity={0.1} stroke="none" />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={tone}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function MatchMeter({ value }: { value: number }) {
  const tone = value >= 90 ? C.green : value >= 80 ? C.blue : C.amber;
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative h-1.5 w-24 overflow-hidden rounded-full"
        style={{ background: C.panelSoft }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: tone }}
        />
      </div>
      <span className="text-[13px] font-bold tabular-nums" style={{ ...mono, color: tone }}>
        {value}%
      </span>
    </div>
  );
}

// Legenda voor de graaf.
function GraphLegend() {
  const items: { tone: string; label: string; Icon: LucideIcon }[] = [
    { tone: C.accent, label: "Jij", Icon: BadgeCheck },
    { tone: C.blue, label: "Opdracht", Icon: Briefcase },
    { tone: C.slate, label: "Opdrachtgever", Icon: Building2 },
    { tone: C.green, label: "Credential", Icon: ShieldCheck },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {items.map((it) => (
        <span
          key={it.label}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium"
          style={{ color: C.fgSoft }}
        >
          <span
            className="inline-flex h-2.5 w-2.5 rounded-full"
            style={{ background: it.tone }}
            aria-hidden="true"
          />
          {it.label}
        </span>
      ))}
      <span
        className="ml-auto inline-flex items-center gap-3 text-[10.5px] font-semibold"
        style={mono}
      >
        <span className="inline-flex items-center gap-1" style={{ color: C.green }}>
          <span className="h-0.5 w-5 rounded" style={{ background: C.green }} aria-hidden="true" />{" "}
          ≥ 90%
        </span>
        <span className="inline-flex items-center gap-1" style={{ color: C.blue }}>
          <span className="h-0.5 w-5 rounded" style={{ background: C.blue }} aria-hidden="true" /> ≥
          80%
        </span>
        <span className="inline-flex items-center gap-1" style={{ color: C.amber }}>
          <span className="h-0.5 w-5 rounded" style={{ background: C.amber }} aria-hidden="true" />{" "}
          aandacht
        </span>
      </span>
    </div>
  );
}

// ── Root ────────────────────────────────────────────────────────────────────────
export function Concept139() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full antialiased"
      style={{ ...display, background: C.bg, color: C.fg }}
    >
      {/* Kop */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-7 md:px-9">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{ background: C.accent, boxShadow: "0 6px 16px -6px rgba(79,70,229,0.6)" }}
            aria-hidden="true"
          >
            <Share2 size={20} strokeWidth={2.4} color="#fff" />
          </span>
          <div className="leading-none">
            <div className="text-[19px] font-semibold tracking-[-0.02em]" style={{ color: C.fg }}>
              Knooppunt
            </div>
            <div
              className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{ ...mono, color: C.fgFaint }}
            >
              Relatiegraaf · ZZP
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-semibold" style={{ color: C.fg }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ color: C.fgSoft }}>
              {PROFIEL.rol}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-bold"
            style={{ background: C.accent, color: "#fff" }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Nav */}
      <nav
        className="mx-auto mt-6 flex max-w-6xl items-center gap-1 overflow-x-auto px-5 md:px-9"
        aria-label="Schermen"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 rounded-t-lg px-3.5 py-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: on ? C.accent : C.fgSoft, fontWeight: on ? 700 : 500 }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-px left-2 right-2 h-[2.5px] rounded-t-full"
                  style={{ background: C.accent }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-6xl px-5 py-8 md:px-9 md:py-10">
        {screen === "dashboard" && (
          <Dashboard
            onOpen={() => setScreen("opdracht")}
            onActies={() => setScreen("acties")}
            onMarkt={() => setScreen("marktplaats")}
          />
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

// ── Dashboard — het levende netwerk ─────────────────────────────────────────────
function Dashboard({
  onOpen,
  onActies,
  onMarkt,
}: {
  onOpen: () => void;
  onActies: () => void;
  onMarkt: () => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const tones = [C.accent, C.blue, C.green, C.amber];

  const nodes: GNode[] = [
    {
      id: "me",
      kind: "profile",
      label: PROFIEL.naam,
      sub: "Hoog vertrouwen",
      init: PROFIEL.initialen,
      x: 380,
      y: 232,
      tone: C.accent,
      Icon: BadgeCheck,
    },
    {
      id: "o1",
      kind: "opdracht",
      label: "Wijkverpleegkundige",
      sub: "94% match",
      init: "94",
      x: 170,
      y: 118,
      tone: C.blue,
      Icon: Briefcase,
    },
    {
      id: "o2",
      kind: "opdracht",
      label: "Verzorgende IG",
      sub: "88% match",
      init: "88",
      x: 610,
      y: 128,
      tone: C.blue,
      Icon: Briefcase,
    },
    {
      id: "o3",
      kind: "opdracht",
      label: "Begeleider GGZ",
      sub: "81% match",
      init: "81",
      x: 232,
      y: 388,
      tone: C.blue,
      Icon: Briefcase,
    },
    {
      id: "c1",
      kind: "client",
      label: "Thuiszorg De Linde",
      init: "TL",
      x: 96,
      y: 250,
      tone: C.slate,
      Icon: Building2,
    },
    {
      id: "c2",
      kind: "client",
      label: "Zorggroep Almere",
      init: "ZA",
      x: 690,
      y: 300,
      tone: C.slate,
      Icon: Building2,
    },
    {
      id: "c3",
      kind: "client",
      label: "Kwintes",
      init: "KW",
      x: 440,
      y: 420,
      tone: C.slate,
      Icon: Building2,
    },
    {
      id: "big",
      kind: "credential",
      label: "BIG-registratie",
      sub: "geverifieerd",
      init: "BIG",
      x: 448,
      y: 66,
      tone: C.green,
      Icon: ShieldCheck,
    },
    {
      id: "vog",
      kind: "credential",
      label: "VOG (zorg)",
      sub: "verloopt",
      init: "VOG",
      x: 640,
      y: 400,
      tone: C.amber,
      Icon: AlertTriangle,
    },
  ];
  const edges: GEdge[] = [
    { from: "me", to: "o1", label: "reistijd 12 min", weight: 94, tone: C.green },
    { from: "me", to: "o2", label: "past bij agenda", weight: 88, tone: C.blue },
    { from: "me", to: "o3", label: "korte reistijd", weight: 81, tone: C.blue },
    { from: "o1", to: "c1", label: "opdrachtgever", tone: C.edge, dashed: true },
    { from: "o2", to: "c2", label: "opdrachtgever", tone: C.edge, dashed: true },
    { from: "o3", to: "c3", label: "opdrachtgever", tone: C.edge, dashed: true },
    { from: "me", to: "big", label: "BIG geverifieerd", tone: C.green },
    { from: "big", to: "o1", label: "vereist ✓", tone: C.green, dashed: true },
    { from: "me", to: "vog", label: "verloopt in 23 dgn", weight: 78, tone: C.amber },
  ];

  return (
    <div className="space-y-8">
      <section>
        <Kicker>Vandaag · {PROFIEL.plaats}</Kicker>
        <h1
          className="mt-2 text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[40px]"
          style={{ ...display, color: C.fg }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mt-2 max-w-lg text-[14px] leading-relaxed" style={{ color: C.fgSoft }}>
          Jouw netwerk is in beweging. Beweeg over een knoop om de verbindingen en match-redenen op
          te lichten.
        </p>
      </section>

      {/* De graaf */}
      <Panel className="overflow-hidden p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div
            className="inline-flex items-center gap-2 text-[13px] font-semibold"
            style={{ color: C.fg }}
          >
            <Zap size={15} strokeWidth={2.4} style={{ color: C.accent }} aria-hidden="true" />
            Jouw match-netwerk
          </div>
          <button
            onClick={onMarkt}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.accentSoft, color: C.accent }}
          >
            Alle opdrachten <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
        <div className="rounded-xl" style={{ background: C.canvas, border: `1px solid ${C.line}` }}>
          <RelationGraph
            nodes={nodes}
            edges={edges}
            vb="0 0 760 470"
            hovered={hovered}
            onHover={setHovered}
          />
        </div>
        <div className="mt-3">
          <GraphLegend />
        </div>
      </Panel>

      {/* Primaire actie */}
      <Panel
        accent={C.amber}
        className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 items-start gap-3.5">
          <span
            className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${C.amber}16`, color: C.amber }}
            aria-hidden="true"
          >
            <AlertTriangle size={20} strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <span
              className="text-[10.5px] font-bold uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.amber }}
            >
              Vraagt aandacht
            </span>
            <h3
              className="mt-1 text-[18px] font-semibold leading-tight"
              style={{ ...display, color: C.fg }}
            >
              {primair.titel}
            </h3>
            <p className="mt-1 max-w-md text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
              {primair.detail}
            </p>
          </div>
        </div>
        <button
          onClick={onActies}
          className="group inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ background: C.amber }}
        >
          {primair.cta}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </Panel>

      {/* KPI's */}
      <section>
        <SectionKop sub="In cijfers">Prestatie</SectionKop>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Panel key={k.label} interactive className="p-4">
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-medium" style={{ color: C.fgSoft }}>
                    {k.label}
                  </span>
                  <span
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                    style={{ ...mono, color: k.up ? C.green : C.amber }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-2 text-[26px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                  style={{ ...display, color: C.fg }}
                >
                  {k.value}
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      {/* Top matches */}
      <section>
        <SectionKop sub="Sterkste verbindingen">Beste matches</SectionKop>
        <ul className="mt-4 space-y-2.5">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group block w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <Panel interactive className="flex items-center gap-4 p-4">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[14px] font-bold tabular-nums"
                    style={{
                      ...mono,
                      background: C.panel,
                      border: `2px solid ${weightTone(o.match)}`,
                      color: weightTone(o.match),
                    }}
                    aria-hidden="true"
                  >
                    {o.match}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[15px] font-semibold" style={{ color: C.fg }}>
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[12px]" style={{ color: C.fgSoft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                  </div>
                  <MatchMeter value={o.match} />
                  <ArrowRight
                    size={18}
                    className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 sm:block"
                    style={{ color: C.accent }}
                    aria-hidden="true"
                  />
                </Panel>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ── Marktplaats ─────────────────────────────────────────────────────────────────
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
      <SectionKop sub="Open opdrachten">Marktplaats</SectionKop>

      <Panel className="flex items-center gap-3 px-4">
        <Search size={17} style={{ color: C.fgFaint }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-3 text-[14px] outline-none placeholder:opacity-50"
          style={{ color: C.fg }}
        />
        <span
          className="shrink-0 text-[12px] font-bold tabular-nums"
          style={{ ...mono, color: C.fgFaint }}
        >
          {filtered.length}
        </span>
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.panelSoft, color: C.fgFaint }}
            aria-hidden="true"
          >
            <Search size={24} />
          </span>
          <p className="text-[18px] font-semibold" style={{ ...display, color: C.fg }}>
            Geen opdrachten gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.fgSoft }}>
            Niets past bij “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.accent }}
          >
            Zoekopdracht wissen
          </button>
        </Panel>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group block w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <Panel interactive className="p-4">
                  <div className="flex items-start gap-4">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[14px] font-bold tabular-nums"
                      style={{
                        ...mono,
                        border: `2px solid ${weightTone(o.match)}`,
                        color: weightTone(o.match),
                      }}
                      aria-hidden="true"
                    >
                      {o.match}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-[16px] font-semibold" style={{ color: C.fg }}>
                          {o.titel}
                        </h3>
                        <span
                          className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em]"
                          style={{ ...mono, color: C.fgFaint }}
                        >
                          {o.id}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[12.5px]" style={{ color: C.fgSoft }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren}
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <Pill key={t} tone={C.slate}>
                            {t}
                          </Pill>
                        ))}
                      </div>
                    </div>
                    <ArrowRight
                      size={18}
                      className="mt-1 shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                      style={{ color: C.accent }}
                      aria-hidden="true"
                    />
                  </div>
                  {/* Mini-redenen als node-chips */}
                  <div
                    className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3"
                    style={{ borderColor: C.line }}
                  >
                    {o.redenen.plus.slice(0, 2).map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1.5 text-[11.5px]"
                        style={{ color: C.green }}
                      >
                        <Check size={13} strokeWidth={2.6} aria-hidden="true" /> {r}
                      </span>
                    ))}
                    {o.redenen.min.slice(0, 1).map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1.5 text-[11.5px]"
                        style={{ color: C.amber }}
                      >
                        <AlertTriangle size={12} strokeWidth={2.6} aria-hidden="true" /> {r}
                      </span>
                    ))}
                  </div>
                </Panel>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Opdracht-detail — ego-graaf rond de opdracht ────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];

  const nodes: GNode[] = [
    {
      id: "opd",
      kind: "opdracht",
      label: opdracht.titel.split(" — ")[0] || opdracht.titel,
      sub: `${opdracht.match}% match`,
      init: `${opdracht.match}`,
      x: 380,
      y: 200,
      tone: weightTone(opdracht.match),
      Icon: Briefcase,
    },
    {
      id: "me",
      kind: "profile",
      label: PROFIEL.naam,
      sub: PROFIEL.rol.split(" · ")[0],
      init: PROFIEL.initialen,
      x: 130,
      y: 200,
      tone: C.accent,
      Icon: BadgeCheck,
    },
    {
      id: "client",
      kind: "client",
      label: opdracht.opdrachtgever,
      sub: opdracht.plaats,
      init: opdracht.opdrachtgever
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join(""),
      x: 630,
      y: 96,
      tone: C.slate,
      Icon: Building2,
    },
    {
      id: "big",
      kind: "credential",
      label: "BIG-registratie",
      sub: "vereist ✓",
      init: "BIG",
      x: 610,
      y: 300,
      tone: C.green,
      Icon: ShieldCheck,
    },
  ];
  const edges: GEdge[] = [
    {
      from: "me",
      to: "opd",
      label: `${opdracht.match}% match`,
      weight: opdracht.match,
      tone: weightTone(opdracht.match),
    },
    { from: "opd", to: "client", label: "opdrachtgever", tone: C.edge, dashed: true },
    { from: "opd", to: "big", label: "vereist credential", tone: C.green, dashed: true },
    { from: "me", to: "big", label: "geverifieerd", tone: C.green },
  ];

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12.5px] font-semibold transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.fgSoft }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.fgFaint }}
            >
              {opdracht.id}
            </span>
            <Pill tone={weightTone(opdracht.match)} solid>
              {opdracht.match}% match
            </Pill>
          </div>
          <h1
            className="mt-2 text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[34px]"
            style={{ ...display, color: C.fg }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-1 text-[13.5px]" style={{ color: C.fgSoft }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
      </section>

      {/* Ego-graaf */}
      <Panel className="overflow-hidden p-4 sm:p-5">
        <div
          className="mb-2 inline-flex items-center gap-2 text-[13px] font-semibold"
          style={{ color: C.fg }}
        >
          <Share2 size={15} strokeWidth={2.4} style={{ color: C.accent }} aria-hidden="true" />
          Waarom deze match
        </div>
        <div className="rounded-xl" style={{ background: C.canvas, border: `1px solid ${C.line}` }}>
          <RelationGraph
            nodes={nodes}
            edges={edges}
            vb="0 0 760 380"
            height={360}
            hovered={hovered}
            onHover={setHovered}
          />
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((m) => (
          <Panel key={m.l} className="p-4">
            <m.Icon size={16} style={{ color: C.accent }} aria-hidden="true" />
            <div
              className="mt-2 text-[17px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.fg }}
            >
              {m.v}
            </div>
            <div
              className="mt-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.fgFaint }}
            >
              {m.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Panel className="p-5" accent={C.green}>
          <div
            className="inline-flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.12em]"
            style={{ ...mono, color: C.green }}
          >
            <Check size={14} strokeWidth={2.8} aria-hidden="true" /> Wat past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.fg }}
              >
                <Check
                  size={16}
                  strokeWidth={2.6}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-5" accent={C.amber}>
          <div
            className="inline-flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.12em]"
            style={{ ...mono, color: C.amber }}
          >
            <AlertTriangle size={14} strokeWidth={2.8} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.fg }}
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold text-white transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ background: C.accent }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-semibold transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ border: `1px solid ${C.lineStrong}`, color: C.fg }}
        >
          Bewaar voor later
        </button>
      </div>
    </div>
  );
}

// ── Verificatie — credential-subgraaf ───────────────────────────────────────────
function Verificatie() {
  const [hovered, setHovered] = useState<string | null>(null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);

  const credPos = [
    { x: 150, y: 90 },
    { x: 610, y: 96 },
    { x: 130, y: 300 },
    { x: 620, y: 300 },
  ];
  const nodes: GNode[] = [
    {
      id: "me",
      kind: "profile",
      label: PROFIEL.naam,
      sub: PROFIEL.trust,
      init: PROFIEL.initialen,
      x: 380,
      y: 195,
      tone: C.accent,
      Icon: BadgeCheck,
    },
    ...CREDENTIALS.map((c, i) => {
      const st = statusMeta(c.status);
      const p = credPos[i] || { x: 380, y: 360 };
      return {
        id: `cr${i}`,
        kind: "credential" as const,
        label: c.naam,
        sub: st.label,
        init: c.naam
          .split(/[\s-]/)
          .map((w) => w[0])
          .slice(0, 3)
          .join("")
          .toUpperCase(),
        x: p.x,
        y: p.y,
        tone: st.tone,
        Icon: st.Icon,
      };
    }),
  ];
  const edges: GEdge[] = CREDENTIALS.map((c, i) => {
    const st = statusMeta(c.status);
    return { from: "me", to: `cr${i}`, label: st.label, tone: st.tone } as GEdge;
  });

  return (
    <div className="space-y-6">
      <SectionKop sub="Vertrouwen">Verificatie</SectionKop>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr,1fr]">
        <Panel className="overflow-hidden p-4 sm:p-5">
          <div
            className="mb-2 inline-flex items-center gap-2 text-[13px] font-semibold"
            style={{ color: C.fg }}
          >
            <ShieldCheck
              size={15}
              strokeWidth={2.4}
              style={{ color: C.accent }}
              aria-hidden="true"
            />
            Jouw credential-netwerk
          </div>
          <div
            className="rounded-xl"
            style={{ background: C.canvas, border: `1px solid ${C.line}` }}
          >
            <RelationGraph
              nodes={nodes}
              edges={edges}
              vb="0 0 760 400"
              height={360}
              hovered={hovered}
              onHover={setHovered}
            />
          </div>
        </Panel>

        <Panel accent={C.accent} className="flex flex-col justify-center gap-4 p-6">
          <div className="flex items-center gap-4">
            <div
              className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
              style={{ background: `conic-gradient(${C.green} ${pct}%, ${C.panelSoft} 0)` }}
              aria-hidden="true"
            >
              <span className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-white">
                <span
                  className="text-[19px] font-bold tabular-nums leading-none"
                  style={{ ...mono, color: C.fg }}
                >
                  {pct}%
                </span>
                <span
                  className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: C.green }}
                >
                  gedekt
                </span>
              </span>
            </div>
            <div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
                style={{ background: `${C.green}14`, color: C.green }}
              >
                <ShieldCheck size={14} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: C.fgSoft }}>
                {verified} van {CREDENTIALS.length} credentials geverifieerd. Elke geverifieerde
                knoop versterkt je positie in het netwerk.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <ul className="space-y-2.5">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Panel className="flex items-center gap-4 p-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `${st.tone}14`,
                    border: `1px solid ${st.tone}33`,
                    color: st.tone,
                  }}
                  aria-hidden="true"
                >
                  <st.Icon size={18} strokeWidth={2.4} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold leading-tight" style={{ color: C.fg }}>
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: C.fgSoft }}>
                    {c.detail}
                  </div>
                </div>
                <Pill tone={st.tone}>
                  <st.Icon size={12} strokeWidth={2.8} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                </Pill>
              </Panel>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Acties ────────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <SectionKop sub="De volgende beste stap">Volgende acties</SectionKop>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.accent;
          return (
            <li key={a.titel}>
              <Panel
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                accent={warn ? C.amber : undefined}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-bold tabular-nums"
                  style={{
                    ...mono,
                    background: `${tone}14`,
                    color: tone,
                    border: `1px solid ${tone}33`,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle
                        size={14}
                        strokeWidth={2.6}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Zap size={14} strokeWidth={2.6} style={{ color: tone }} aria-hidden="true" />
                    )}
                    <h3 className="text-[16px] font-semibold leading-tight" style={{ color: C.fg }}>
                      {a.titel}
                    </h3>
                    <span className="sr-only">{warn ? "Urgent" : "Informatief"}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.fgSoft }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-full px-5 py-2.5 text-[12.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:self-center"
                  style={{ background: tone }}
                >
                  {a.cta}
                </button>
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ──────────────────────────────────────────────────────────────────
function Facturen() {
  const total = "€ 8.622";
  const badge = (status: string): string => {
    if (status === "Betaald") return C.green;
    if (status === "Openstaand") return C.amber;
    if (status === "Concept") return C.fgFaint;
    return C.blue;
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionKop sub="Omzet">Facturen</SectionKop>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ background: C.accent }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.lineStrong}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10.5px] font-bold uppercase tracking-[0.1em] ${i === 4 ? "text-right" : ""}`}
                  style={{ ...mono, color: C.fgFaint }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const tone = badge(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-black/[0.015]"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.fgSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[14px]" style={{ color: C.fg }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.fgSoft }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <Pill tone={tone}>
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: tone }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </Pill>
                  </td>
                  <td
                    className="px-4 py-3.5 text-right text-[15px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.fg }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${C.lineStrong}` }}>
              <td
                colSpan={4}
                className="px-4 py-4 text-[10.5px] font-bold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.fgFaint }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[18px] font-bold tabular-nums"
                style={{ ...mono, color: C.green }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </Panel>
    </div>
  );
}
