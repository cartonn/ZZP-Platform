"use client";

// Concept 92 — "Doek" · oneindig freeform canvas / spatial board (tldraw/FigJam/Muse-grade).
// Elk kernscherm is een cluster van "objecten" die vrij op een gestippeld doek lijken te zweven,
// met subtiele slagschaduw en verbindingslijnen tussen gerelateerde items. Een zoom/pan-chrome
// (zoomniveau-indicator + mini-map in de hoek, puur visueel) maakt het ruimtelijk. Licht,
// speels-professioneel. Deterministisch: alle posities en de zoom zijn hardcoded — geen random.
// Fonts: --font-lab-space (Space Grotesk, display) + --font-lab-inter (body/UI).

import { useState } from "react";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Check,
  Plus,
  MapPin,
  Minus,
  Maximize2,
  MousePointer2,
  Sparkles,
  Receipt,
  BadgeCheck,
  MessageSquare,
  Layers,
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
  bg: "#f4f5f8",
  dot: "rgba(28,30,38,0.10)",
  card: "#ffffff",
  cardAlt: "#f7f8fb",
  ink: "#1c1e26",
  accent: "#5b57e0",
  accentSoft: "#a7a3f2",
  teal: "#14a8a0",
  amber: "#e0912f",
  rose: "#e0517a",
  muted: "#5c6070",
  faint: "#9096a6",
  line: "#e6e8f0",
  ok: "#1a9d70",
  warn: "#c8781f",
  alert: "#d84c4c",
  edge: "rgba(91,87,224,0.35)",
};

const display = { fontFamily: "var(--font-lab-space)" };
const body = { fontFamily: "var(--font-lab-inter)" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b57e0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f5f8]";
const CARD_SHADOW = "0 1px 2px rgba(28,30,38,0.05), 0 12px 30px -16px rgba(28,30,38,0.35)";

/* ---------- Status → betekenis ---------- */

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
function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Canvas-primitieven ---------- */

type Node = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number; // benaderd, voor edge-ankers + mini-map
  render: React.ReactNode;
  tone?: string;
};
type Edge = { from: string; to: string; label?: string };

const CANVAS_W = 1180;
const CANVAS_H = 720;

function edgePath(a: Node, b: Node): string {
  const ax = a.x + a.w / 2;
  const ay = a.y + a.h / 2;
  const bx = b.x + b.w / 2;
  const by = b.y + b.h / 2;
  const mx = (ax + bx) / 2;
  return `M${ax} ${ay} C ${mx} ${ay}, ${mx} ${by}, ${bx} ${by}`;
}

function Canvas({ nodes, edges, label }: { nodes: Node[]; edges: Edge[]; label: string }) {
  const [zoom, setZoom] = useState(1);
  const byId = (id: string) => nodes.find((n) => n.id === id);
  const zPct = Math.round(zoom * 100);

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        border: `1px solid ${C.line}`,
        background: C.bg,
        backgroundImage: `radial-gradient(${C.dot} 1.3px, transparent 1.3px)`,
        backgroundSize: "22px 22px",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
      }}
    >
      {/* Scroll-viewport */}
      <div className="relative h-[560px] overflow-auto" role="group" aria-label={label}>
        <div
          className="relative"
          style={{
            width: CANVAS_W * zoom,
            height: CANVAS_H * zoom,
          }}
        >
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${zoom})` }}
          >
            {/* Verbindingslijnen */}
            <svg
              className="pointer-events-none absolute inset-0"
              width={CANVAS_W}
              height={CANVAS_H}
              aria-hidden="true"
            >
              {edges.map((e, i) => {
                const a = byId(e.from);
                const b = byId(e.to);
                if (!a || !b) return null;
                const d = edgePath(a, b);
                return (
                  <g key={i}>
                    <path
                      d={d}
                      fill="none"
                      stroke={C.edge}
                      strokeWidth={1.6}
                      strokeDasharray="1 6"
                      strokeLinecap="round"
                    />
                    {e.label && (
                      <text
                        x={(a.x + a.w / 2 + b.x + b.w / 2) / 2}
                        y={(a.y + a.h / 2 + b.y + b.h / 2) / 2 - 6}
                        textAnchor="middle"
                        style={{ ...body, fill: C.accent, fontSize: 10, fontWeight: 600 }}
                      >
                        {e.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Objecten */}
            {nodes.map((n) => (
              <div key={n.id} className="absolute" style={{ left: n.x, top: n.y, width: n.w }}>
                {n.render}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zoom-chrome (linksonder) */}
      <div
        className="absolute bottom-3 left-3 z-30 flex items-center gap-1 rounded-xl p-1"
        style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: CARD_SHADOW }}
      >
        <button
          type="button"
          aria-label="Uitzoomen"
          onClick={() => setZoom((z) => Math.max(0.6, Math.round((z - 0.1) * 10) / 10))}
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[#f4f5f8] ${RING}`}
          style={{ color: C.muted }}
        >
          <Minus size={14} strokeWidth={2.4} aria-hidden="true" />
        </button>
        <span
          className="w-11 text-center text-[11px] font-semibold tabular-nums"
          style={{ ...display, color: C.ink }}
          aria-live="polite"
        >
          {zPct}%
        </span>
        <button
          type="button"
          aria-label="Inzoomen"
          onClick={() => setZoom((z) => Math.min(1.4, Math.round((z + 0.1) * 10) / 10))}
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[#f4f5f8] ${RING}`}
          style={{ color: C.muted }}
        >
          <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
        </button>
        <span className="mx-0.5 h-5 w-px" style={{ background: C.line }} aria-hidden="true" />
        <button
          type="button"
          aria-label="Passend maken (100%)"
          onClick={() => setZoom(1)}
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[#f4f5f8] ${RING}`}
          style={{ color: C.muted }}
        >
          <Maximize2 size={13} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>

      {/* Mini-map (rechtsboven) */}
      <div
        className="absolute right-3 top-3 z-30 hidden rounded-xl p-2 sm:block"
        style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: CARD_SHADOW }}
        aria-hidden="true"
      >
        <div className="relative" style={{ width: 132, height: 82 }}>
          {nodes.map((n) => (
            <span
              key={n.id}
              className="absolute rounded-[2px]"
              style={{
                left: (n.x / CANVAS_W) * 132,
                top: (n.y / CANVAS_H) * 82,
                width: Math.max((n.w / CANVAS_W) * 132, 6),
                height: Math.max((n.h / CANVAS_H) * 82, 4),
                background: n.tone ?? C.accentSoft,
                opacity: 0.7,
              }}
            />
          ))}
          <span
            className="absolute rounded-[3px]"
            style={{ inset: 0, border: `1px solid ${C.accent}55` }}
          />
        </div>
      </div>

      {/* Cursor-hint (linksboven) */}
      <div
        className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10.5px] font-medium"
        style={{
          ...body,
          background: "rgba(255,255,255,0.85)",
          border: `1px solid ${C.line}`,
          color: C.muted,
        }}
      >
        <MousePointer2 size={12} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
        Doek · sleep om te pannen
      </div>
    </div>
  );
}

/* ---------- Kaart-bouwstenen (objecten op het doek) ---------- */

function ObjCard({
  children,
  tone = C.accent,
  className = "",
}: {
  children: React.ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        boxShadow: CARD_SHADOW,
        borderTop: `3px solid ${tone}`,
      }}
    >
      {children}
    </div>
  );
}

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10.5px] font-semibold"
      style={{ ...body, color, background: `${color}15` }}
    >
      {children}
    </span>
  );
}

function MatchOrb({ value }: { value: number }) {
  const strong = value >= 90;
  const size = 44;
  const r = size / 2 - 3;
  const circ = 2 * Math.PI * r;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.line} strokeWidth="3" />
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
      <span className="text-[12px] font-bold tabular-nums" style={{ ...display, color: C.ink }}>
        {value}
      </span>
    </span>
  );
}

function CredBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <Chip color={m.color}>
      <Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
    </Chip>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept92() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  const screenLabel = SCREENS.find((s) => s.key === screen)?.label ?? "";

  return (
    <div
      className="relative min-h-[680px] w-full antialiased"
      style={{ ...body, color: C.ink, background: C.bg }}
    >
      <div className="mx-auto max-w-6xl space-y-5 p-5 sm:p-7">
        {/* Topbalk */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: C.accent }}
              aria-hidden="true"
            >
              <Layers size={19} strokeWidth={2.2} color="#fff" />
            </span>
            <div>
              <div className="text-[16px] font-bold tracking-[-0.01em]" style={{ ...display }}>
                Doek
              </div>
              <div className="text-[11px] font-medium" style={{ color: C.faint }}>
                {PROFIEL.naam} · {PROFIEL.rol}
              </div>
            </div>
          </div>

          {/* Objecten-tabs (screen switcher) */}
          <nav
            className="flex flex-wrap items-center gap-1.5 rounded-2xl p-1"
            style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: CARD_SHADOW }}
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
                  className={`rounded-xl px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
                  style={{
                    color: on ? "#fff" : C.muted,
                    background: on ? C.accent : "transparent",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </nav>
        </header>

        {/* Het doek */}
        {screen === "dashboard" && (
          <DashboardBoard onOpen={open} onGo={setScreen} label={screenLabel} />
        )}
        {screen === "marktplaats" && (
          <MarktplaatsBoard
            activeId={activeId}
            onSelect={setActiveId}
            onOpen={open}
            label={screenLabel}
          />
        )}
        {screen === "opdracht" && <OpdrachtBoard opdracht={active} label={screenLabel} />}
        {screen === "verificatie" && <VerificatieBoard label={screenLabel} />}
        {screen === "acties" && <ActiesBoard onGo={setScreen} label={screenLabel} />}
        {screen === "facturen" && <FacturenBoard label={screenLabel} />}
      </div>
    </div>
  );
}

/* ---------- Dashboard-doek ---------- */

function DashboardBoard({
  onOpen,
  onGo,
  label,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
  label: string;
}) {
  const nodes: Node[] = [
    {
      id: "hub",
      x: 460,
      y: 300,
      w: 240,
      h: 118,
      tone: C.accent,
      render: (
        <ObjCard tone={C.accent} className="p-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-bold text-white"
              style={{ ...display, background: C.accent }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
            <div>
              <p className="text-[14px] font-bold" style={{ ...display }}>
                {PROFIEL.naam}
              </p>
              <p className="text-[11px]" style={{ color: C.muted }}>
                {PROFIEL.plaats}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <Chip color={C.ok}>
              <ShieldCheck size={11} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
            </Chip>
          </div>
        </ObjCard>
      ),
    },
    // KPI's linksboven
    {
      id: "kpi1",
      x: 60,
      y: 60,
      w: 190,
      h: 96,
      tone: C.teal,
      render: <KpiObj i={0} />,
    },
    {
      id: "kpi2",
      x: 60,
      y: 190,
      w: 190,
      h: 96,
      tone: C.teal,
      render: <KpiObj i={2} />,
    },
    // Matches rechts
    {
      id: "m0",
      x: 800,
      y: 70,
      w: 300,
      h: 132,
      tone: C.accent,
      render: <MatchObj o={OPDRACHTEN[0]!} onOpen={onOpen} />,
    },
    {
      id: "m1",
      x: 820,
      y: 250,
      w: 300,
      h: 132,
      tone: C.accent,
      render: <MatchObj o={OPDRACHTEN[1]!} onOpen={onOpen} />,
    },
    // Actie onder
    {
      id: "actie",
      x: 470,
      y: 500,
      w: 300,
      h: 130,
      tone: C.amber,
      render: (
        <ObjCard tone={C.amber} className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} strokeWidth={2.2} color={C.amber} aria-hidden="true" />
            <span className="text-[13px] font-bold" style={{ ...display }}>
              {ACTIES[0]!.titel}
            </span>
          </div>
          <p className="mt-1.5 text-[11.5px] leading-snug" style={{ color: C.muted }}>
            {ACTIES[0]!.detail}
          </p>
          <button
            type="button"
            onClick={() => onGo("verificatie")}
            className={`mt-2.5 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold text-white transition-colors ${RING}`}
            style={{ background: C.amber }}
          >
            {ACTIES[0]!.cta} <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </ObjCard>
      ),
    },
    // Bericht-postit linksonder
    {
      id: "bericht",
      x: 90,
      y: 470,
      w: 250,
      h: 120,
      tone: C.rose,
      render: (
        <ObjCard tone={C.rose} className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <MessageSquare size={14} strokeWidth={2.2} color={C.rose} aria-hidden="true" />
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.rose }}
            >
              Bericht
            </span>
          </div>
          <p className="text-[12.5px] font-semibold">{BERICHTEN[0]!.van}</p>
          <p className="mt-0.5 text-[11.5px] leading-snug" style={{ color: C.muted }}>
            {BERICHTEN[0]!.preview}
          </p>
        </ObjCard>
      ),
    },
  ];

  const edges: Edge[] = [
    { from: "hub", to: "kpi1" },
    { from: "hub", to: "kpi2" },
    { from: "hub", to: "m0", label: "match" },
    { from: "hub", to: "m1", label: "match" },
    { from: "hub", to: "actie" },
    { from: "hub", to: "bericht" },
  ];

  return <Canvas nodes={nodes} edges={edges} label={`${label} — spatial board`} />;
}

function KpiObj({ i }: { i: number }) {
  const k = KPIS[i]!;
  return (
    <ObjCard tone={C.teal} className="p-3.5">
      <p className="text-[10.5px] font-medium" style={{ color: C.muted }}>
        {k.label}
      </p>
      <p className="mt-1 text-[20px] font-bold tabular-nums" style={{ ...display }}>
        {k.value}
      </p>
      <Chip color={k.up ? C.ok : C.warn}>
        <Sparkles size={10} strokeWidth={2.4} aria-hidden="true" /> {k.trend}
      </Chip>
    </ObjCard>
  );
}

function MatchObj({ o, onOpen }: { o: Opdracht; onOpen: (id: string) => void }) {
  return (
    <ObjCard tone={C.accent} className="p-4">
      <div className="flex items-start gap-3">
        <MatchOrb value={o.match} />
        <div className="min-w-0 flex-1">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: C.faint }}
          >
            {o.id}
          </p>
          <p className="truncate text-[13.5px] font-bold" style={{ ...display }}>
            {o.titel}
          </p>
          <p className="flex items-center gap-1 truncate text-[11px]" style={{ color: C.muted }}>
            <MapPin size={11} strokeWidth={2} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[12px] font-semibold" style={{ color: C.accent }}>
          {o.tarief}
        </span>
        <button
          type="button"
          onClick={() => onOpen(o.id)}
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${RING}`}
          style={{ color: C.accent, background: `${C.accent}12` }}
        >
          Open <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>
    </ObjCard>
  );
}

/* ---------- Marktplaats-doek ---------- */

function MarktplaatsBoard({
  activeId,
  onSelect,
  onOpen,
  label,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onOpen: (id?: string) => void;
  label: string;
}) {
  const positions = [
    { x: 70, y: 70 },
    { x: 470, y: 300 },
    { x: 820, y: 90 },
  ];
  const nodes: Node[] = [
    {
      id: "jij",
      x: 470,
      y: 60,
      w: 250,
      h: 110,
      tone: C.teal,
      render: (
        <ObjCard tone={C.teal} className="p-4">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: C.teal }}
          >
            Jouw profiel
          </p>
          <p className="mt-1 text-[14px] font-bold" style={{ ...display }}>
            {PROFIEL.rol}
          </p>
          <p className="mt-1 text-[11.5px]" style={{ color: C.muted }}>
            {OPDRACHTEN.length} open matches op het doek — lijnen tonen de sterkte.
          </p>
        </ObjCard>
      ),
    },
    ...OPDRACHTEN.map((o, i) => {
      const on = o.id === activeId;
      const pos = positions[i]!;
      return {
        id: o.id,
        x: pos.x,
        y: pos.y + 170,
        w: 310,
        h: 168,
        tone: C.accent,
        render: (
          <button
            type="button"
            onClick={() => (on ? onOpen(o.id) : onSelect(o.id))}
            aria-pressed={on}
            className={`block w-full text-left ${RING} rounded-2xl`}
          >
            <ObjCard tone={on ? C.accent : C.accentSoft} className="p-4 transition-all">
              <div className="flex items-start gap-3">
                <MatchOrb value={o.match} />
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: C.faint }}
                  >
                    {o.id} {on && <span style={{ color: C.accent }}>· gekozen</span>}
                  </p>
                  <p className="truncate text-[14px] font-bold" style={{ ...display }}>
                    {o.titel}
                  </p>
                  <p
                    className="flex items-center gap-1 truncate text-[11px]"
                    style={{ color: C.muted }}
                  >
                    <MapPin size={11} strokeWidth={2} aria-hidden="true" /> {o.opdrachtgever} ·{" "}
                    {o.plaats}
                  </p>
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {o.redenen.plus.slice(0, 2).map((t) => (
                  <Chip key={t} color={C.ok}>
                    <Check size={10} strokeWidth={3} aria-hidden="true" /> {t}
                  </Chip>
                ))}
              </div>
              <p
                className="mt-2 text-[11.5px] font-semibold"
                style={{ color: on ? C.accent : C.muted }}
              >
                {on ? "Tik nogmaals om te openen →" : "Tik om te kiezen"}
              </p>
            </ObjCard>
          </button>
        ),
      } as Node;
    }),
  ];

  const edges: Edge[] = OPDRACHTEN.map((o) => ({
    from: "jij",
    to: o.id,
    label: `${o.match}%`,
  }));

  return <Canvas nodes={nodes} edges={edges} label={`${label} — matches`} />;
}

/* ---------- Opdracht-doek ---------- */

function OpdrachtBoard({ opdracht, label }: { opdracht: Opdracht; label: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };

  const nodes: Node[] = [
    {
      id: "hoofd",
      x: 420,
      y: 250,
      w: 340,
      h: 200,
      tone: C.accent,
      render: (
        <ObjCard tone={C.accent} className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: C.faint }}
              >
                {opdracht.id}
              </p>
              <p className="text-[16px] font-bold leading-tight" style={{ ...display }}>
                {opdracht.titel}
              </p>
              <p className="mt-1 text-[11.5px]" style={{ color: C.muted }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
            </div>
            <MatchOrb value={opdracht.match} />
          </div>
          <button
            type="button"
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors disabled:opacity-90 ${RING}`}
            style={{ background: state === "sent" ? C.ok : C.accent }}
          >
            {state === "idle" && (
              <>
                <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" /> Reageer op opdracht
              </>
            )}
            {state === "sending" && "Versturen…"}
            {state === "sent" && (
              <>
                <Check size={14} strokeWidth={3} aria-hidden="true" /> Reactie verstuurd
              </>
            )}
          </button>
        </ObjCard>
      ),
    },
    {
      id: "feiten",
      x: 90,
      y: 90,
      w: 250,
      h: 150,
      tone: C.teal,
      render: (
        <ObjCard tone={C.teal} className="p-4">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: C.teal }}
          >
            Feiten
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-2">
            {[
              { l: "Tarief", v: opdracht.tarief },
              { l: "Omvang", v: opdracht.uren },
              { l: "Start", v: opdracht.start },
              { l: "Match", v: `${opdracht.match}%` },
            ].map((m) => (
              <div key={m.l} className="rounded-lg p-2" style={{ background: C.cardAlt }}>
                <dt
                  className="text-[9.5px] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: C.faint }}
                >
                  {m.l}
                </dt>
                <dd className="text-[12.5px] font-bold tabular-nums" style={{ ...display }}>
                  {m.v}
                </dd>
              </div>
            ))}
          </dl>
        </ObjCard>
      ),
    },
    {
      id: "plus",
      x: 860,
      y: 90,
      w: 260,
      h: 170,
      tone: C.ok,
      render: (
        <ObjCard tone={C.ok} className="p-4">
          <p
            className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: C.ok }}
          >
            <Check size={12} strokeWidth={3} aria-hidden="true" /> Pluspunten
          </p>
          <ul className="mt-2 space-y-1.5">
            {opdracht.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[12px]">
                <Check
                  size={13}
                  strokeWidth={2.6}
                  color={C.ok}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />{" "}
                {r}
              </li>
            ))}
          </ul>
        </ObjCard>
      ),
    },
    {
      id: "min",
      x: 860,
      y: 420,
      w: 260,
      h: 140,
      tone: C.amber,
      render: (
        <ObjCard tone={C.amber} className="p-4">
          <p
            className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: C.warn }}
          >
            <AlertTriangle size={12} strokeWidth={2.4} aria-hidden="true" /> Aandachtspunten
          </p>
          <ul className="mt-2 space-y-1.5">
            {opdracht.redenen.min.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[12px]" style={{ color: C.muted }}>
                <AlertTriangle
                  size={13}
                  strokeWidth={2.2}
                  color={C.warn}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />{" "}
                {r}
              </li>
            ))}
          </ul>
        </ObjCard>
      ),
    },
    {
      id: "tags",
      x: 120,
      y: 460,
      w: 240,
      h: 100,
      tone: C.rose,
      render: (
        <ObjCard tone={C.rose} className="p-4">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: C.rose }}
          >
            Kenmerken
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-lg px-2 py-0.5 text-[11px] font-medium"
                style={{ color: C.muted, background: C.cardAlt }}
              >
                {t}
              </span>
            ))}
          </div>
        </ObjCard>
      ),
    },
  ];

  const edges: Edge[] = [
    { from: "hoofd", to: "feiten" },
    { from: "hoofd", to: "plus" },
    { from: "hoofd", to: "min" },
    { from: "hoofd", to: "tags" },
  ];

  return <Canvas nodes={nodes} edges={edges} label={`${label} — detail`} />;
}

/* ---------- Verificatie-doek ---------- */

function VerificatieBoard({ label }: { label: string }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const positions = [
    { x: 80, y: 90 },
    { x: 830, y: 80 },
    { x: 110, y: 400 },
    { x: 820, y: 400 },
  ];
  const nodes: Node[] = [
    {
      id: "trust",
      x: 460,
      y: 250,
      w: 260,
      h: 130,
      tone: C.ok,
      render: (
        <ObjCard tone={C.ok} className="p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} strokeWidth={2.2} color={C.ok} aria-hidden="true" />
            <span className="text-[14px] font-bold" style={{ ...display }}>
              Vertrouwensniveau
            </span>
          </div>
          <p
            className="mt-2 text-[24px] font-bold tabular-nums"
            style={{ ...display, color: C.ok }}
          >
            {verified}/{CREDENTIALS.length}
          </p>
          <p className="text-[11.5px]" style={{ color: C.muted }}>
            bewijsstukken geverifieerd · veilig & privé bewaard
          </p>
        </ObjCard>
      ),
    },
    ...CREDENTIALS.map((c, i) => {
      const m = credMeta(c.status);
      const Icon = m.Icon;
      const pos = positions[i]!;
      return {
        id: `cred-${i}`,
        x: pos.x,
        y: pos.y,
        w: 250,
        h: 118,
        tone: m.color,
        render: (
          <ObjCard tone={m.color} className="p-4">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: `${m.color}15` }}
                aria-hidden="true"
              >
                <Icon size={17} strokeWidth={2.2} color={m.color} />
              </span>
              <p className="text-[13px] font-bold leading-tight" style={{ ...display }}>
                {c.naam}
              </p>
            </div>
            <p className="mt-2 text-[11.5px]" style={{ color: C.muted }}>
              {c.detail}
            </p>
            <div className="mt-2">
              <CredBadge status={c.status} />
            </div>
          </ObjCard>
        ),
      } as Node;
    }),
  ];

  const edges: Edge[] = CREDENTIALS.map((_, i) => ({ from: "trust", to: `cred-${i}` }));

  return <Canvas nodes={nodes} edges={edges} label={`${label} — certificaten`} />;
}

/* ---------- Acties-doek ---------- */

function ActiesBoard({ onGo, label }: { onGo: (k: ScreenKey) => void; label: string }) {
  const positions = [
    { x: 90, y: 90 },
    { x: 470, y: 300 },
    { x: 830, y: 110 },
  ];
  const nodes: Node[] = [
    {
      id: "focus",
      x: 470,
      y: 60,
      w: 240,
      h: 96,
      tone: C.accent,
      render: (
        <ObjCard tone={C.accent} className="p-4">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: C.accent }}
          >
            Focus vandaag
          </p>
          <p className="mt-1 text-[14px] font-bold" style={{ ...display }}>
            {ACTIES.length} openstaande acties
          </p>
          <p className="mt-1 text-[11.5px]" style={{ color: C.muted }}>
            Begin bij de waarschuwing — die weegt het zwaarst.
          </p>
        </ObjCard>
      ),
    },
    ...ACTIES.map((a, i) => {
      const warn = a.urgentie === "warning";
      const color = warn ? C.warn : C.accent;
      const pos = positions[i]!;
      return {
        id: `actie-${i}`,
        x: pos.x,
        y: pos.y + 160,
        w: 290,
        h: 150,
        tone: color,
        render: (
          <ObjCard tone={color} className="p-4">
            <div className="flex items-center gap-2">
              {warn ? (
                <AlertTriangle size={15} strokeWidth={2.2} color={color} aria-hidden="true" />
              ) : (
                <Sparkles size={15} strokeWidth={2.2} color={color} aria-hidden="true" />
              )}
              <span
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ color }}
              >
                {warn ? "Waarschuwing" : "Melding"}
              </span>
            </div>
            <p className="mt-1.5 text-[13.5px] font-bold" style={{ ...display }}>
              {a.titel}
            </p>
            <p className="mt-0.5 text-[11.5px] leading-snug" style={{ color: C.muted }}>
              {a.detail}
            </p>
            <button
              type="button"
              onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
              className={`mt-2.5 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-colors ${RING}`}
              style={{
                color: warn ? "#fff" : C.accent,
                background: warn ? C.warn : `${C.accent}12`,
              }}
            >
              {a.cta} <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </ObjCard>
        ),
      } as Node;
    }),
  ];

  const edges: Edge[] = ACTIES.map((_, i) => ({ from: "focus", to: `actie-${i}` }));

  return <Canvas nodes={nodes} edges={edges} label={`${label} — prioriteiten`} />;
}

/* ---------- Facturen-doek ---------- */

function FacturenBoard({ label }: { label: string }) {
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

  const positions = [
    { x: 80, y: 70 },
    { x: 430, y: 70 },
    { x: 780, y: 70 },
    { x: 260, y: 380 },
  ];

  const nodes: Node[] = [
    {
      id: "totaal",
      x: 620,
      y: 400,
      w: 280,
      h: 120,
      tone: C.accent,
      render: (
        <ObjCard tone={C.accent} className="p-4">
          <p
            className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: C.accent }}
          >
            <Receipt size={13} strokeWidth={2.2} aria-hidden="true" /> Totalen
          </p>
          <div className="mt-2 flex items-end gap-6">
            <div>
              <p className="text-[10px] font-semibold" style={{ color: C.faint }}>
                Ontvangen
              </p>
              <p className="text-[18px] font-bold tabular-nums" style={{ ...display, color: C.ok }}>
                € {betaald.toLocaleString("nl-NL")}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold" style={{ color: C.faint }}>
                Openstaand
              </p>
              <p
                className="text-[18px] font-bold tabular-nums"
                style={{ ...display, color: C.warn }}
              >
                € {open.toLocaleString("nl-NL")}
              </p>
            </div>
          </div>
        </ObjCard>
      ),
    },
    ...FACTUREN.map((f, i) => {
      const color = statusColor[f.status] ?? C.faint;
      const pos = positions[i]!;
      return {
        id: `fac-${i}`,
        x: pos.x,
        y: pos.y,
        w: 250,
        h: 120,
        tone: color,
        render: (
          <ObjCard tone={color} className="p-4">
            {/* Bon-achtige kaart */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold tabular-nums" style={{ ...display }}>
                {f.nr}
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: color }}
                  aria-hidden="true"
                />
                <span className="text-[11px] font-semibold" style={{ color }}>
                  {f.status}
                </span>
              </span>
            </div>
            <p className="mt-2 text-[12.5px] font-medium">{f.klant}</p>
            <div className="mt-1 flex items-end justify-between">
              <span className="text-[10.5px] tabular-nums" style={{ color: C.faint }}>
                {f.datum}
              </span>
              <span className="text-[16px] font-bold tabular-nums" style={{ ...display }}>
                {f.bedrag}
              </span>
            </div>
          </ObjCard>
        ),
      } as Node;
    }),
  ];

  const edges: Edge[] = FACTUREN.map((_, i) => ({ from: "totaal", to: `fac-${i}` }));

  return <Canvas nodes={nodes} edges={edges} label={`${label} — financiën`} />;
}
