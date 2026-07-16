"use client";

// Concept 333 — "Sferisch" · immersieve ruimtelijke relatiegraaf, matching als netwerk (dark spatial).
// Donker en ruimtelijk: matching wordt getoond als een relatie-/netwerkgraaf met diepte —
// gloeiende knopen (ZZP'er ↔ opdracht ↔ certificaat) met verbindingslijnen, parallax-lagen en
// gelaagde translucente panelen met waargenomen z-diepte. Spatial-data-esthetiek 2026. De graaf is
// pure SVG (geen externe libs); knopen zijn selecteerbaar en tonen relaties. Verificatie en
// verklaarbare matching blijven leesbaar via statuschips (label + icoon) en hoog-contrast tekst.
// Fonts: --font-lab-space (koppen) + --font-lab-spline-mono (cijfers) + --font-lab-inter (tekst).

import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Bell,
  ChevronRight,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  BadgeCheck,
  MapPin,
  Send,
  Plus,
  RotateCcw,
  Orbit,
  Radar,
  User,
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

/* ---------- Palet (diep ruimtelijk donker, cyaan/violet gloed) ---------- */

const C = {
  space: "#070b16",
  spaceLo: "#0b1120",
  panel: "rgba(20,28,48,0.66)",
  panelHi: "rgba(30,40,66,0.72)",
  ink: "#eef2fb",
  inkSoft: "#c3cbe0",
  sub: "#8791ad",
  faint: "#5c6685",
  line: "rgba(140,155,200,0.16)",
  lineSoft: "rgba(140,155,200,0.09)",
  cyaan: "#38e1d6",
  cyaanDim: "#1aa79e",
  violet: "#8b7cff",
  violetDim: "#6a5bd6",
  roze: "#ff77c8",
  ok: "#34d99a",
  okSoft: "rgba(52,217,154,0.16)",
  info: "#5aa8ff",
  infoSoft: "rgba(90,168,255,0.16)",
  warn: "#ffb454",
  warnSoft: "rgba(255,180,84,0.16)",
  alert: "#ff6b6b",
  alertSoft: "rgba(255,107,107,0.16)",
};

const head = { fontFamily: "var(--font-lab-space), system-ui, sans-serif" };
const body = { fontFamily: "var(--font-lab-inter), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-spline-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38e1d6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b16]";

/* ---------- Status → betekenis ---------- */

type Tone = { label: string; fg: string; soft: string; Icon: LucideIcon };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.ok, soft: C.okSoft, Icon: BadgeCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.info, soft: C.infoSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", fg: C.warn, soft: C.warnSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.alert, soft: C.alertSoft, Icon: XCircle };
  }
}

function factuurTone(status: string): { fg: string; soft: string } {
  if (status === "Betaald") return { fg: C.ok, soft: C.okSoft };
  if (status === "Openstaand") return { fg: C.warn, soft: C.warnSoft };
  return { fg: C.faint, soft: C.lineSoft };
}

function euros(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: Receipt,
  berichten: Bell,
};

/* ---------- Ruimtelijke achtergrond (parallax-sterrenveld) ---------- */

// Deterministische puntenvelden op verschillende z-lagen — parallax-diepte, geen Math.random.
function starLayer(count: number, seed: number) {
  const pts: { x: number; y: number; r: number }[] = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    const x = (s / 233280) * 100;
    s = (s * 9301 + 49297) % 233280;
    const y = (s / 233280) * 100;
    s = (s * 9301 + 49297) % 233280;
    const r = 0.4 + (s / 233280) * 1.1;
    pts.push({ x, y, r });
  }
  return pts;
}

function SpaceBackdrop() {
  const far = useMemo(() => starLayer(46, 7), []);
  const near = useMemo(() => starLayer(22, 91), []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 80% at 20% 0%, ${C.spaceLo} 0%, ${C.space} 55%), radial-gradient(90% 70% at 90% 100%, rgba(139,124,255,0.14) 0%, transparent 60%)`,
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        {far.map((p, i) => (
          <circle key={`f${i}`} cx={p.x} cy={p.y} r={p.r * 0.16} fill="#9fb0d8" opacity={0.34} />
        ))}
        {near.map((p, i) => (
          <circle key={`n${i}`} cx={p.x} cy={p.y} r={p.r * 0.24} fill={C.cyaan} opacity={0.4} />
        ))}
      </svg>
    </div>
  );
}

/* ---------- Bouwstenen ---------- */

// Translucent paneel met waargenomen z-diepte (glasrand + gloed).
function Panel({
  children,
  className = "",
  glow = false,
  depth = 1,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  depth?: number;
}) {
  return (
    <div
      className={`relative rounded-2xl ${className}`}
      style={{
        background: depth >= 2 ? C.panelHi : C.panel,
        border: `1px solid ${glow ? "rgba(56,225,214,0.35)" : C.line}`,
        boxShadow: glow
          ? `0 24px 60px -24px rgba(56,225,214,0.4), inset 0 1px 0 rgba(255,255,255,0.06)`
          : `0 ${16 * depth}px ${40 * depth}px -${22}px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)`,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: CredStatus }) {
  const t = credTone(status);
  const Icon = t.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...body, color: t.fg, background: t.soft, border: `1px solid ${t.fg}33` }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {t.label}
    </span>
  );
}

function MiniSpark({ data, color }: { data: number[]; color: string }) {
  const w = 76;
  const h = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Gloeiende ring-meter.
function OrbitMeter({
  value,
  size = 74,
  color = C.cyaan,
  label,
}: {
  value: number;
  size?: number;
  color?: string;
  label?: string;
}) {
  const stroke = size >= 90 ? 6 : 5;
  const r = size / 2 - stroke - 2;
  const circ = 2 * Math.PI * r;
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
          stroke="rgba(140,155,200,0.16)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
          style={{ filter: `drop-shadow(0 0 5px ${color})` }}
        />
      </svg>
      <span className="flex flex-col items-center leading-none">
        <span
          className="font-semibold tabular-nums"
          style={{ ...mono, color: C.ink, fontSize: size >= 90 ? 20 : 14 }}
        >
          {value}
        </span>
        {label && (
          <span
            className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide"
            style={{ color: C.faint }}
          >
            {label}
          </span>
        )}
      </span>
    </span>
  );
}

/* ---------- Relatiegraaf (de kern-differentiatie) ---------- */

type GraphNode = {
  id: string;
  kind: "self" | "opdracht" | "cert";
  label: string;
  sub?: string;
  x: number;
  y: number;
  r: number;
  color: string;
  opdrachtId?: string;
};

// Bouwt een ruimtelijke graaf: profiel in het midden, opdrachten in een baan, certificaten daarbuiten.
function buildGraph(): { nodes: GraphNode[]; links: { a: string; b: string; strong: boolean }[] } {
  const cx = 50;
  const cy = 50;
  const nodes: GraphNode[] = [
    {
      id: "self",
      kind: "self",
      label: PROFIEL.naam,
      sub: "ZZP",
      x: cx,
      y: cy,
      r: 8,
      color: C.cyaan,
    },
  ];
  const links: { a: string; b: string; strong: boolean }[] = [];

  OPDRACHTEN.forEach((o, i) => {
    const ang = (-90 + i * (360 / OPDRACHTEN.length)) * (Math.PI / 180);
    const dist = 30;
    const x = cx + Math.cos(ang) * dist;
    const y = cy + Math.sin(ang) * dist * 0.82;
    nodes.push({
      id: `o-${o.id}`,
      kind: "opdracht",
      label: o.titel,
      sub: `${o.match}% match`,
      x,
      y,
      r: 5 + (o.match - 80) * 0.12,
      color: o.match >= 90 ? C.cyaan : C.violet,
      opdrachtId: o.id,
    });
    links.push({ a: "self", b: `o-${o.id}`, strong: o.match >= 90 });
  });

  CREDENTIALS.slice(0, 3).forEach((c, i) => {
    const ang = (30 + i * 62) * (Math.PI / 180);
    const dist = 44;
    const x = cx + Math.cos(ang) * dist;
    const y = cy + Math.sin(ang) * dist * 0.82;
    const t = credTone(c.status);
    nodes.push({
      id: `c-${i}`,
      kind: "cert",
      label: c.naam,
      sub: t.label,
      x: Math.max(8, Math.min(92, x)),
      y: Math.max(10, Math.min(90, y)),
      r: 3.6,
      color: c.status === "VERIFIED" ? C.ok : c.status === "EXPIRING" ? C.warn : C.info,
    });
    links.push({ a: "self", b: `c-${i}`, strong: c.status === "VERIFIED" });
  });

  return { nodes, links };
}

function RelationGraph({
  selected,
  onSelect,
  onOpen,
}: {
  selected: string;
  onSelect: (id: string) => void;
  onOpen: (opdrachtId?: string) => void;
}) {
  const { nodes, links } = useMemo(() => buildGraph(), []);
  const nodeMap = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);
  const sel = nodeMap[selected];

  return (
    <div className="relative w-full" style={{ aspectRatio: "16 / 11" }}>
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Relatiegraaf van je profiel, opdrachten en certificaten"
      >
        <defs>
          <radialGradient id="sf-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C.cyaan} stopOpacity="0.5" />
            <stop offset="100%" stopColor={C.cyaan} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* baan-ringen voor diepte */}
        {[30, 44].map((rr) => (
          <ellipse
            key={rr}
            cx={50}
            cy={50}
            rx={rr}
            ry={rr * 0.82}
            fill="none"
            stroke="rgba(140,155,200,0.12)"
            strokeWidth="0.25"
            strokeDasharray="1.4 1.6"
          />
        ))}

        {/* verbindingen */}
        {links.map((l, i) => {
          const a = nodeMap[l.a];
          const b = nodeMap[l.b];
          if (!a || !b) return null;
          const active = selected === l.a || selected === l.b;
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={
                active ? C.cyaan : l.strong ? "rgba(56,225,214,0.4)" : "rgba(140,155,200,0.2)"
              }
              strokeWidth={active ? 0.7 : l.strong ? 0.45 : 0.3}
              style={active ? { filter: `drop-shadow(0 0 1px ${C.cyaan})` } : undefined}
            />
          );
        })}

        <circle cx={50} cy={50} r={14} fill="url(#sf-core)" />

        {/* knopen */}
        {nodes.map((n) => {
          const on = selected === n.id;
          return (
            <g
              key={n.id}
              transform={`translate(${n.x} ${n.y})`}
              className="cursor-pointer"
              onClick={() => onSelect(n.id)}
              role="button"
              tabIndex={0}
              aria-label={`${n.label}${n.sub ? `, ${n.sub}` : ""}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(n.id);
                }
              }}
              style={{ outline: "none" }}
            >
              {on && (
                <circle r={n.r + 3} fill="none" stroke={n.color} strokeWidth="0.4" opacity="0.7" />
              )}
              <circle
                r={n.r}
                fill={n.color}
                opacity={n.kind === "self" ? 1 : 0.9}
                style={{ filter: `drop-shadow(0 0 ${on ? 3 : 1.5}px ${n.color})` }}
              />
              {n.kind === "self" && <circle r={n.r - 3} fill={C.space} opacity="0.5" />}
            </g>
          );
        })}
      </svg>

      {/* Detailkaart bij selectie — zwevend, extra z-diepte */}
      {sel && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-3 sm:right-auto sm:max-w-[280px]">
          <Panel glow depth={2} className="p-3.5">
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: `${sel.color}22`, color: sel.color }}
                aria-hidden="true"
              >
                {sel.kind === "self" ? (
                  <User size={14} />
                ) : sel.kind === "opdracht" ? (
                  <Briefcase size={14} />
                ) : (
                  <ShieldCheck size={14} />
                )}
              </span>
              <div className="min-w-0">
                <p
                  className="truncate text-[12.5px] font-semibold"
                  style={{ ...head, color: C.ink }}
                >
                  {sel.label}
                </p>
                {sel.sub && (
                  <p className="text-[10.5px]" style={{ ...mono, color: sel.color }}>
                    {sel.sub}
                  </p>
                )}
              </div>
            </div>
            {sel.kind === "opdracht" && (
              <button
                onClick={() => onOpen(sel.opdrachtId)}
                className={`mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold text-[#04121a] transition-transform active:scale-[0.98] ${RING}`}
                style={{ background: C.cyaan }}
              >
                Open opdracht <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
              </button>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}

function PageHead({
  kicker,
  title,
  sub,
  right,
}: {
  kicker: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-1 pt-7">
      <div className="min-w-0">
        <p
          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]"
          style={{ ...mono, color: C.cyaan }}
        >
          <Orbit size={12} aria-hidden="true" /> {kicker}
        </p>
        <h1
          className="mt-2 text-[27px] font-semibold leading-none tracking-tight"
          style={{ ...head, color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2 max-w-xl text-[13px]" style={{ ...body, color: C.sub }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept333() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = window.setTimeout(() => setReady(true), 340);
    return () => window.clearTimeout(t);
  }, [screen]);

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, background: C.space, color: C.ink }}
    >
      <style>{`@keyframes sf-fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes sf-pulse{0%,100%{opacity:.4}50%{opacity:.75}}`}</style>

      <SpaceBackdrop />

      <div className="relative flex min-h-[680px] flex-col lg:flex-row">
        {/* Zij-nav — zwevend translucent paneel */}
        <aside className="shrink-0 px-4 pt-4 lg:w-60 lg:px-4 lg:pb-6 lg:pt-6">
          <Panel depth={2} className="p-3 lg:sticky lg:top-6">
            <div className="flex items-center gap-2.5 px-2 py-2">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[15px] font-semibold text-[#04121a]"
                style={{ ...head, background: `linear-gradient(135deg, ${C.cyaan}, ${C.violet})` }}
                aria-hidden="true"
              >
                Z
              </span>
              <div className="leading-tight">
                <p className="text-[14px] font-semibold tracking-tight" style={head}>
                  Sferisch
                </p>
                <p className="text-[10.5px]" style={{ color: C.faint }}>
                  ZZP-ruimte
                </p>
              </div>
            </div>

            <nav className="mt-3 space-y-1" aria-label="Hoofdnavigatie">
              {SCREENS.map((s) => {
                const Icon = NAV_ICONS[s.key];
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all ${RING}`}
                    style={{
                      color: on ? C.ink : C.sub,
                      background: on ? "rgba(56,225,214,0.12)" : "transparent",
                      border: `1px solid ${on ? "rgba(56,225,214,0.3)" : "transparent"}`,
                      fontWeight: on ? 600 : 500,
                    }}
                  >
                    <Icon size={16} aria-hidden="true" style={{ color: on ? C.cyaan : C.faint }} />
                    {s.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-3 border-t pt-3" style={{ borderColor: C.line }}>
              <div className="flex items-center gap-2.5 px-2 py-1.5">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-[#04121a]"
                  style={{
                    ...mono,
                    background: `linear-gradient(135deg, ${C.cyaan}, ${C.violet})`,
                  }}
                  aria-hidden="true"
                >
                  {PROFIEL.initialen}
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</p>
                  <p
                    className="flex items-center gap-1 text-[10.5px] font-medium"
                    style={{ color: C.ok }}
                  >
                    <ShieldCheck size={10} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
                  </p>
                </div>
              </div>
            </div>
          </Panel>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 pb-8">
          <div
            key={screen}
            className="mx-auto max-w-5xl"
            style={{ animation: "sf-fade 0.34s ease" }}
          >
            {!ready ? (
              <ScreenSkeleton />
            ) : (
              <>
                {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
                {screen === "marktplaats" && <Marktplaats onOpen={open} />}
                {screen === "opdracht" && (
                  <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
                )}
                {screen === "verificatie" && <Verificatie onGo={setScreen} />}
                {screen === "acties" && <Acties onGo={setScreen} />}
                {screen === "facturen" && <Facturen />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Skeleton ---------- */

function ScreenSkeleton() {
  return (
    <div className="px-6 py-7" role="status" aria-live="polite">
      <span className="sr-only">Scherm wordt geladen…</span>
      <div
        className="h-8 w-52 rounded-2xl"
        style={{ background: C.panel, animation: "sf-pulse 1.3s infinite" }}
      />
      <div
        className="mt-6 h-56 rounded-2xl"
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          animation: "sf-pulse 1.3s infinite",
        }}
      />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl"
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              animation: "sf-pulse 1.3s infinite",
            }}
          />
        ))}
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
  const [focus, setFocus] = useState(0);
  const [feed, setFeed] = useState<"error" | "loading" | "ok">("error");
  const [selNode, setSelNode] = useState<string>("self");
  const hero = (KPIS[focus] ?? KPIS[0]) as (typeof KPIS)[number];
  const warn = ACTIES[0];
  const matchAvg = Math.round(OPDRACHTEN.reduce((s, o) => s + o.match, 0) / OPDRACHTEN.length);

  const retry = () => {
    setFeed("loading");
    window.setTimeout(() => setFeed("ok"), 700);
  };

  return (
    <div>
      <PageHead
        kicker="Jouw ruimte"
        title={`Welkom terug, ${PROFIEL.naam.split(" ")[0]}`}
        sub="Je matching als een levend netwerk — knopen zijn je opdrachten en certificaten, lijnen tonen de relatie."
      />

      <div className="space-y-5 px-6 py-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Relatiegraaf */}
          <Panel glow className="overflow-hidden lg:col-span-3">
            <div className="flex items-center justify-between px-4 pt-3.5">
              <p
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.cyaan }}
              >
                <Radar size={13} aria-hidden="true" /> Relatienetwerk
              </p>
              <span className="text-[10.5px]" style={{ color: C.faint }}>
                Selecteer een knoop
              </span>
            </div>
            <RelationGraph selected={selNode} onSelect={setSelNode} onOpen={onOpen} />
          </Panel>

          {/* Match-kern + KPI-kiezer */}
          <div className="space-y-4 lg:col-span-2">
            <Panel depth={2} className="p-5">
              <div className="flex items-center gap-4">
                <OrbitMeter value={matchAvg} size={84} color={C.cyaan} label="match" />
                <div className="min-w-0">
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{ ...mono, color: C.cyaan }}
                  >
                    Gem. match
                  </p>
                  <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
                    Over {OPDRACHTEN.length} actieve opdrachten in je baan.
                  </p>
                </div>
              </div>
            </Panel>

            <Panel className="p-4">
              <p
                className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.cyaan }}
              >
                {hero.label}
              </p>
              <p
                className="mt-1.5 text-[30px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {hero.value}
              </p>
              <div className="mt-3 flex gap-1.5" role="tablist" aria-label="Kies kerncijfer">
                {KPIS.map((k, i) => {
                  const on = i === focus;
                  return (
                    <button
                      key={k.label}
                      role="tab"
                      aria-selected={on}
                      aria-label={k.label}
                      onClick={() => setFocus(i)}
                      className={`h-1.5 flex-1 rounded-full transition-all ${RING}`}
                      style={{ background: on ? C.cyaan : "rgba(140,155,200,0.2)" }}
                    />
                  );
                })}
              </div>
            </Panel>
          </div>
        </div>

        {/* KPI-tegels */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Panel key={k.label} className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium" style={{ color: C.sub }}>
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold tabular-nums"
                  style={{ ...mono, color: k.up ? C.ok : C.warn }}
                >
                  {k.up ? (
                    <ArrowUpRight size={11} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={11} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
              </div>
              <p
                className="mt-1.5 text-[22px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {k.value}
              </p>
              <div className="mt-2.5">
                <MiniSpark data={k.spark} color={k.up ? C.cyaan : C.roze} />
              </div>
            </Panel>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {warn && (
            <Panel glow className="p-5 lg:col-span-2">
              <p
                className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.warn }}
              >
                <AlertTriangle size={13} aria-hidden="true" /> Vraagt aandacht
              </p>
              <h2
                className="mt-2 text-[19px] font-semibold leading-snug"
                style={{ ...head, color: C.ink }}
              >
                {warn.titel}
              </h2>
              <p className="mt-1.5 max-w-md text-[13px]" style={{ color: C.sub }}>
                {warn.detail}
              </p>
              <button
                onClick={() => onGo("verificatie")}
                className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-[#04121a] transition-transform active:scale-[0.98] ${RING}`}
                style={{ background: C.cyaan }}
              >
                {warn.cta} <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </Panel>
          )}

          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <h3
                className="flex items-center gap-1.5 text-[13px] font-semibold"
                style={{ ...head, color: C.ink }}
              >
                <Bell size={15} style={{ color: C.cyaan }} aria-hidden="true" /> Laatste bericht
              </h3>
              <button
                onClick={() => onGo("acties")}
                className={`text-[11px] font-semibold ${RING}`}
                style={{ color: C.cyaan }}
              >
                Alles
              </button>
            </div>
            <div className="mt-4">
              {feed === "error" && (
                <div className="text-center" role="alert">
                  <XCircle
                    size={20}
                    className="mx-auto"
                    style={{ color: C.alert }}
                    aria-hidden="true"
                  />
                  <p className="mt-1.5 text-[12px]" style={{ color: C.sub }}>
                    Kon berichten niet laden.
                  </p>
                  <button
                    onClick={retry}
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold ${RING}`}
                    style={{ border: `1px solid ${C.line}`, color: C.ink }}
                  >
                    <RotateCcw size={12} aria-hidden="true" /> Opnieuw
                  </button>
                </div>
              )}
              {feed === "loading" && (
                <div className="space-y-2" role="status" aria-live="polite">
                  <span className="sr-only">Laden…</span>
                  <span
                    className="block h-3 rounded-full"
                    style={{
                      background: C.lineSoft,
                      width: "60%",
                      animation: "sf-pulse 1.3s infinite",
                    }}
                  />
                  <span
                    className="block h-3 rounded-full"
                    style={{
                      background: C.lineSoft,
                      width: "85%",
                      animation: "sf-pulse 1.3s infinite",
                    }}
                  />
                </div>
              )}
              {feed === "ok" && BERICHTEN[0] && (
                <div>
                  <p className="text-[12.5px] font-semibold" style={{ color: C.ink }}>
                    {BERICHTEN[0].van}
                  </p>
                  <p className="mt-0.5 text-[11.5px]" style={{ color: C.sub }}>
                    {BERICHTEN[0].preview}
                  </p>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Beste matches */}
        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2
              className="flex items-center gap-2 text-[16px] font-semibold"
              style={{ ...head, color: C.ink }}
            >
              <Orbit size={16} style={{ color: C.cyaan }} aria-hidden="true" /> Beste matches
            </h2>
            <button
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-1 text-[12.5px] font-semibold ${RING}`}
              style={{ color: C.cyaan }}
            >
              Alles <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OPDRACHTEN.map((o, i) => (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className={`text-left ${RING} rounded-2xl`}
              >
                <Panel glow={i === 0} className="h-full p-4">
                  <div className="flex items-start justify-between">
                    <OrbitMeter
                      value={o.match}
                      size={52}
                      color={i === 0 ? C.cyaan : C.violet}
                      label="match"
                    />
                    <span
                      className="text-[10px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.faint }}
                    >
                      {o.id}
                    </span>
                  </div>
                  <p
                    className="mt-3 text-[14.5px] font-semibold leading-snug"
                    style={{ ...head, color: C.ink }}
                  >
                    {o.titel}
                  </p>
                  <p
                    className="mt-1 flex items-center gap-1 truncate text-[12px]"
                    style={{ color: C.sub }}
                  >
                    <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className="text-[13px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.cyaan }}
                    >
                      {o.tarief}
                    </span>
                    <span className="text-[11.5px]" style={{ color: C.faint }}>
                      {o.uren}
                    </span>
                  </div>
                </Panel>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({ onOpen }: { onOpen: (id?: string) => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const filtered = useMemo(
    () =>
      OPDRACHTEN.filter(
        (o) =>
          o.titel.toLowerCase().includes(q.toLowerCase()) ||
          o.plaats.toLowerCase().includes(q.toLowerCase()) ||
          o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
      ).sort((a, b) => (sort === "match" ? b.match - a.match : euros(b.tarief) - euros(a.tarief))),
    [q, sort],
  );

  return (
    <div>
      <PageHead
        kicker="Kansen"
        title="Marktplaats"
        sub="Opdrachten in je baan, gerangschikt op de sterkte van de relatie met je profiel."
        right={
          <div
            className="inline-flex items-center gap-0.5 rounded-xl p-0.5"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
            role="tablist"
            aria-label="Sorteren"
          >
            {(["match", "tarief"] as const).map((s) => {
              const on = s === sort;
              return (
                <button
                  key={s}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setSort(s)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${RING}`}
                  style={{
                    background: on ? "rgba(56,225,214,0.14)" : "transparent",
                    color: on ? C.cyaan : C.sub,
                    border: `1px solid ${on ? "rgba(56,225,214,0.3)" : "transparent"}`,
                  }}
                >
                  {s === "match" ? "Match" : "Tarief"}
                </button>
              );
            })}
          </div>
        }
      />
      <div className="px-6 py-5">
        <Panel className="mb-4 flex items-center gap-2.5 px-3.5 py-2.5">
          <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none"
            style={{ color: C.ink }}
          />
        </Panel>

        {filtered.length === 0 ? (
          <Panel className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: "rgba(56,225,214,0.12)" }}
              aria-hidden="true"
            >
              <Search size={20} style={{ color: C.cyaan }} />
            </span>
            <p className="mt-4 text-[15px] font-semibold" style={{ ...head, color: C.ink }}>
              Geen opdrachten in beeld
            </p>
            <p className="mt-1 max-w-xs text-[12.5px]" style={{ color: C.sub }}>
              Niets komt overeen met “{q}”. Verbreed je zoekopdracht.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-4 rounded-xl px-4 py-2 text-[12.5px] font-semibold ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.ink }}
            >
              Zoekopdracht wissen
            </button>
          </Panel>
        ) : (
          <ul className="space-y-3">
            {filtered.map((o, i) => (
              <li key={o.id}>
                <Panel glow={i === 0} className="p-4">
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums"
                        style={{
                          ...mono,
                          background: i === 0 ? "rgba(56,225,214,0.14)" : C.lineSoft,
                          color: i === 0 ? C.cyaan : C.faint,
                        }}
                      >
                        {i + 1}
                      </span>
                      <OrbitMeter
                        value={o.match}
                        size={56}
                        color={i === 0 ? C.cyaan : C.violet}
                        label="match"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="text-[10px] font-semibold tabular-nums"
                          style={{ ...mono, color: C.faint }}
                        >
                          {o.id}
                        </span>
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                            style={{ background: C.lineSoft, color: C.inkSoft }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <p
                        className="mt-1 text-[15px] font-semibold"
                        style={{ ...head, color: C.ink }}
                      >
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 text-[12.5px]"
                        style={{ color: C.sub }}
                      >
                        <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
                        <span
                          className="font-semibold tabular-nums"
                          style={{ ...mono, color: C.cyaan }}
                        >
                          {o.tarief}
                        </span>
                        <span style={{ color: C.sub }}>{o.uren}</span>
                        <span style={{ color: C.sub }}>{o.start}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onOpen(o.id)}
                      className={`inline-flex items-center gap-1.5 self-center rounded-xl px-3.5 py-2 text-[12.5px] font-semibold text-[#04121a] transition-transform active:scale-[0.98] ${RING}`}
                      style={{ background: C.cyaan }}
                    >
                      Bekijk <ArrowRight size={14} strokeWidth={2.6} aria-hidden="true" />
                    </button>
                  </div>
                </Panel>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div>
      <PageHead
        kicker={opdracht.id}
        title={opdracht.titel}
        sub={`${opdracht.opdrachtgever} · ${opdracht.plaats}`}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className={`rounded-xl px-3.5 py-2 text-[12.5px] font-semibold ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.sub }}
            >
              Terug
            </button>
            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold text-[#04121a] transition-transform active:scale-[0.98] disabled:opacity-90 ${RING}`}
              style={{ background: state === "sent" ? C.ok : C.cyaan }}
            >
              {state === "idle" && (
                <>
                  <Send size={15} strokeWidth={2.4} aria-hidden="true" /> Reageer
                </>
              )}
              {state === "sending" && "Versturen…"}
              {state === "sent" && (
                <>
                  <Check size={15} strokeWidth={3} aria-hidden="true" /> Verstuurd
                </>
              )}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 px-6 py-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Tarief", v: opdracht.tarief },
              { l: "Omvang", v: opdracht.uren },
              { l: "Start", v: opdracht.start },
              { l: "Match", v: `${opdracht.match}%` },
            ].map((m) => (
              <Panel key={m.l} className="p-4">
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {m.l}
                </p>
                <p
                  className="mt-1.5 text-[17px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {m.v}
                </p>
              </Panel>
            ))}
          </div>

          <Panel className="p-5">
            <h3 className="text-[16px] font-semibold" style={{ ...head, color: C.ink }}>
              Waarom deze match
            </h3>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
              Transparant onderbouwd op basis van je geverifieerde profiel.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.ok }}
                >
                  <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.plus.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ color: C.inkSoft }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        style={{ background: C.okSoft }}
                      >
                        <Check
                          size={11}
                          strokeWidth={3}
                          style={{ color: C.ok }}
                          aria-hidden="true"
                        />
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.warn }}
                >
                  <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Aandachtspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ color: C.sub }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        style={{ background: C.warnSoft }}
                      >
                        <AlertTriangle
                          size={10}
                          strokeWidth={2.6}
                          style={{ color: C.warn }}
                          aria-hidden="true"
                        />
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel glow depth={2} className="p-5">
            <div className="flex items-center gap-4">
              <OrbitMeter value={opdracht.match} size={72} color={C.cyaan} label="match" />
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.cyaan }}
                >
                  Match-score
                </p>
                <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
                  Sterke koppeling met je profiel — reageer voor het beste resultaat.
                </p>
              </div>
            </div>
          </Panel>
          <Panel className="p-5">
            <p
              className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.cyaan }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> Compliance-eis
            </p>
            <p className="mt-2 text-[12.5px]" style={{ color: C.sub }}>
              Vereiste credentials voor deze opdracht. Je voldoet aan de kern-eisen.
            </p>
            <ul className="mt-3 space-y-2.5">
              {CREDENTIALS.slice(0, 3).map((c) => {
                const t = credTone(c.status);
                const Icon = t.Icon;
                return (
                  <li key={c.naam} className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: t.soft, color: t.fg }}
                    >
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px]"
                      style={{ color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <StatusPill status={c.status} />
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const expiring = CREDENTIALS.find((c) => c.status === "EXPIRING");
  const pct = Math.round((verified / total) * 100);

  return (
    <div>
      <PageHead
        kicker="Vertrouwen"
        title="Verificatie"
        sub="Je vertrouwensniveau — elk geverifieerd bewijsstuk versterkt de knopen in je netwerk."
      />
      <div className="space-y-5 px-6 py-5">
        <Panel glow depth={2} className="flex flex-wrap items-center gap-5 p-6">
          <OrbitMeter value={pct} size={92} color={C.cyaan} label="verified" />
          <div className="min-w-[180px] flex-1">
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.cyaan }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
            </p>
            <p
              className="mt-2 text-[24px] font-semibold tabular-nums"
              style={{ ...mono, color: C.ink }}
            >
              {verified}/{total} geverifieerd
            </p>
            <p className="mt-1 text-[12.5px]" style={{ color: C.sub }}>
              Nog {total - verified} bewijsstuk{total - verified === 1 ? "" : "ken"} te gaan voor
              een volledige score.
            </p>
          </div>
        </Panel>

        {expiring && (
          <Panel className="flex flex-wrap items-center gap-4 p-4">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: C.warnSoft, color: C.warn }}
              aria-hidden="true"
            >
              <AlertTriangle size={20} />
            </span>
            <div className="min-w-[180px] flex-1">
              <p className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
                {expiring.naam} verloopt binnenkort
              </p>
              <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
                {expiring.detail}. Vernieuw op tijd om je vertrouwensniveau te behouden.
              </p>
            </div>
            <button
              onClick={() => onGo("acties")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold text-[#1a1200] transition-transform active:scale-[0.98] ${RING}`}
              style={{ background: C.warn }}
            >
              Vernieuwen <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </Panel>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            const Icon = t.Icon;
            return (
              <Panel key={c.naam} className="flex items-center gap-3.5 p-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: t.soft, color: t.fg }}
                >
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
                    {c.naam}
                  </p>
                  <p className="text-[11.5px]" style={{ color: C.sub }}>
                    {c.detail}
                  </p>
                </div>
                <StatusPill status={c.status} />
              </Panel>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div>
      <PageHead
        kicker="Te doen"
        title="Volgende acties"
        sub="Geordend op urgentie — rond af en houd je netwerk in beweging."
      />
      <div className="space-y-3 px-6 py-5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const fg = warn ? C.warn : C.info;
          const soft = warn ? C.warnSoft : C.infoSoft;
          return (
            <Panel key={a.titel} glow={warn} className="flex flex-wrap items-start gap-4 p-4">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[15px] font-semibold tabular-nums"
                style={{ ...mono, background: soft, color: fg }}
              >
                {i + 1}
              </span>
              <div className="min-w-[180px] flex-1">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: fg }}
                >
                  {warn ? "Waarschuwing" : "Kans"}
                </p>
                <p className="mt-0.5 text-[14px] font-semibold" style={{ ...head, color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
                style={{
                  background: warn ? C.warn : C.cyaan,
                  color: warn ? "#1a1200" : "#04121a",
                }}
              >
                {a.cta} <ChevronRight size={14} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </Panel>
          );
        })}

        <Panel className="flex items-center gap-3 p-4">
          <Orbit size={16} strokeWidth={2.2} style={{ color: C.cyaan }} aria-hidden="true" />
          <p className="text-[12.5px]" style={{ color: C.sub }}>
            Verder is alles in balans. Nieuwe kansen verschijnen hier vanzelf.
          </p>
        </Panel>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );
  const totaal = betaald + open;
  const pct = totaal ? Math.round((betaald / totaal) * 100) : 0;

  return (
    <div>
      <PageHead
        kicker="Omzet"
        title="Facturen"
        sub="Overzicht van wat binnen is en wat nog onderweg is."
        right={
          <button
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold text-[#04121a] transition-transform active:scale-[0.98] ${RING}`}
            style={{ background: C.cyaan }}
          >
            <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />
      <div className="space-y-5 px-6 py-5">
        <Panel glow depth={2} className="flex flex-wrap items-center gap-5 p-5">
          <OrbitMeter value={pct} size={80} color={C.cyaan} label="betaald" />
          <div className="flex flex-1 flex-wrap gap-6">
            <div>
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.ok }}
              >
                Ontvangen
              </p>
              <p
                className="mt-1 text-[24px] font-semibold tabular-nums"
                style={{ ...mono, color: C.ink }}
              >
                € {betaald.toLocaleString("nl-NL")}
              </p>
            </div>
            <div>
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.warn }}
              >
                Openstaand
              </p>
              <p
                className="mt-1 text-[24px] font-semibold tabular-nums"
                style={{ ...mono, color: C.ink }}
              >
                € {open.toLocaleString("nl-NL")}
              </p>
            </div>
          </div>
        </Panel>

        <Panel className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: C.faint, borderBottom: `1px solid ${C.line}` }}
              >
                <th className="px-4 py-3">Nummer</th>
                <th className="px-4 py-3">Klant</th>
                <th className="hidden px-4 py-3 sm:table-cell">Datum</th>
                <th className="px-4 py-3 text-right">Bedrag</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const t = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-4 py-3.5 text-[12px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.sub }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3.5 text-[13px]" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="hidden px-4 py-3.5 text-[12px] tabular-nums sm:table-cell"
                      style={{ ...mono, color: C.faint }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-4 py-3.5 text-right text-[13px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ color: t.fg, background: t.soft }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: t.fg }}
                          aria-hidden="true"
                        />
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
