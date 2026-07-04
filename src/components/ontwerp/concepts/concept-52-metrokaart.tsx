"use client";

// Concept 52 — "Metrokaart" · lijndiagram als navigatie.
// De opdracht-pijplijn (reactie → match → verificatie → contract → factuur → betaald) getekend als
// een metro-/lijndiagram: gekleurde lijnen, stations (cirkel-nodes), overstap-knooppunten
// (interchange-capsule), 45°/90° knikken zoals echte metrokaarten. Stations ZIJN de navigatie:
// klik een station → detail van dat schema. Dashboard = netwerkkaart met meerdere lopende
// opdracht-lijnen; verificatie = een lijn met credential-haltes (geverifieerd = ingevulde node,
// verlopen = waarschuwingsnode). Licht, strak, TfL-heldere geometrie met legenda en tabelcijfers.
// Onderscheidend van reis/tijdlijn (18) en cartografie (21): geabstraheerd lijn-schema, geen
// geografie, geen horizontale tijdlijn.
// Palet: bg #f5f6f8, panel #fff, ink #151a24, lijnen blauw/groen/paars/amber/rood.
// Fonts: --font-lab-space (display) + --font-lab-plex-mono (cijfers/labels).

import { useState } from "react";
import {
  LayoutGrid,
  Map as MapIcon,
  Briefcase,
  ShieldCheck,
  ListChecks,
  Receipt,
  Search,
  Bell,
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Plus,
  Send,
  Loader2,
  Circle,
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

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#f5f6f8",
  panel: "#ffffff",
  panelAlt: "#fafbfc",
  ink: "#151a24",
  inkSoft: "#39404d",
  muted: "#626a78",
  faint: "#98a1af",
  line: "#e5e8ee",
  lineSoft: "#eef0f4",
  blue: "#1f6feb",
  green: "#12915f",
  purple: "#7b52d1",
  amber: "#d98115",
  red: "#d83a4a",
};

const display = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

/* ---------- Pijplijn ---------- */

const STAGES = ["Reactie", "Match", "Verificatie", "Contract", "Factuur", "Betaald"] as const;
const STAGE_X = [180, 320, 460, 600, 720, 840];
const ORIGIN = { x: 60, y: 160 };

// Lijnkleur + spoor-y + huidige stap per opdracht (deterministisch).
const LINES: { color: string; y: number; stage: number }[] = [
  { color: C.blue, y: 90, stage: 5 }, // OPD-2041 — tot Betaald
  { color: C.green, y: 160, stage: 2 }, // OPD-2038 — tot Verificatie
  { color: C.purple, y: 230, stage: 1 }, // OPD-2035 — tot Match
];

type StationState = "done" | "current" | "todo" | "warn";

function stationState(lineStage: number, stageIdx: number): StationState {
  if (stageIdx < lineStage) return "done";
  if (stageIdx === lineStage) return "current";
  return "todo";
}

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: MapIcon,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: Receipt,
  berichten: Bell,
};

type Tone = "green" | "amber" | "red" | "blue";
const TONE: Record<Tone, string> = { green: C.green, amber: C.amber, red: C.red, blue: C.blue };

function credMeta(s: CredStatus): {
  label: string;
  tone: Tone;
  state: StationState;
  Icon: LucideIcon;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", tone: "green", state: "done", Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", tone: "blue", state: "current", Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", tone: "amber", state: "warn", Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", tone: "red", state: "warn", Icon: AlertTriangle };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- 45° lijn-pad ---------- */

// Origin → 45° diagonaal → horizontaal spoor. dy bepaalt de knik-x.
function linePath(lineY: number, endX = 840): string {
  const dy = lineY - ORIGIN.y;
  const kink = STAGE_X[0]! - Math.abs(dy);
  return `M ${ORIGIN.x} ${ORIGIN.y} H ${kink} L ${STAGE_X[0]} ${lineY} H ${endX}`;
}

/* ---------- Station-marker (SVG) ---------- */

function Station({
  cx,
  cy,
  color,
  state,
  onClick,
  label,
}: {
  cx: number;
  cy: number;
  color: string;
  state: StationState;
  onClick?: () => void;
  label: string;
}) {
  const stateWord =
    state === "done"
      ? "afgerond"
      : state === "current"
        ? "in behandeling"
        : state === "warn"
          ? "actie vereist"
          : "gepland";

  return (
    <g
      role={onClick ? "button" : "img"}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${label} — ${stateWord}`}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      style={{ cursor: onClick ? "pointer" : "default", outline: "none" }}
      className={onClick ? "mm52-hit focus-visible:[&>circle]:stroke-[3.5]" : undefined}
    >
      {/* Vergroot klikvlak */}
      {onClick && <circle cx={cx} cy={cy} r={16} fill="transparent" />}
      {state === "warn" ? (
        <>
          <circle cx={cx} cy={cy} r={9} fill={C.amber} stroke="#fff" strokeWidth={2.5} />
          <text
            x={cx}
            y={cy + 3.4}
            textAnchor="middle"
            fontSize={11}
            fontWeight={800}
            fill="#fff"
            style={mono}
          >
            !
          </text>
        </>
      ) : state === "done" ? (
        <circle cx={cx} cy={cy} r={8.5} fill={color} stroke="#fff" strokeWidth={2.5} />
      ) : state === "current" ? (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={13}
            fill="none"
            stroke={color}
            strokeWidth={2}
            opacity={0.4}
            className="mm52-pulse"
          />
          <circle cx={cx} cy={cy} r={8.5} fill="#fff" stroke={color} strokeWidth={3.5} />
        </>
      ) : (
        <circle cx={cx} cy={cy} r={7.5} fill="#fff" stroke={color} strokeWidth={3} />
      )}
    </g>
  );
}

/* ---------- Herbruikbare primitieven ---------- */

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}` }}
    >
      {children}
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase tracking-[0.24em]"
      style={{ ...mono, color: C.blue }}
    >
      {children}
    </p>
  );
}

function SectionHead({ kicker, title, note }: { kicker: string; title: string; note?: string }) {
  return (
    <div>
      <Kicker>{kicker}</Kicker>
      <h1
        className="mt-2 text-[24px] font-semibold leading-tight tracking-tight sm:text-[28px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {note && (
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
          {note}
        </p>
      )}
    </div>
  );
}

function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        color: TONE[tone],
        background: `${TONE[tone]}14`,
        border: `1px solid ${TONE[tone]}33`,
      }}
    >
      {children}
    </span>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept52() {
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
      style={{ ...display, background: C.bg, color: C.ink }}
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .mm52-pulse { transform-box: fill-box; transform-origin: center; animation: mm52pulse 2s ease-in-out infinite; }
        }
        @keyframes mm52pulse { 0%,100% { opacity:0.5; transform: scale(0.85) } 50% { opacity:0; transform: scale(1.25) } }
        .mm52-hit:focus-visible > circle:last-of-type { stroke-width: 4; }
      `}</style>

      <div className="relative flex min-h-[680px]">
        {/* Zijbalk */}
        <aside
          className="hidden w-[220px] shrink-0 flex-col border-r p-4 md:flex"
          style={{ borderColor: C.line }}
        >
          <div className="flex items-center gap-2.5 px-2 pb-6 pt-1">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: C.ink }}
              aria-hidden="true"
            >
              <Circle size={16} className="fill-white text-white" />
            </span>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold tracking-tight">Netwerk</div>
              <div className="text-[10.5px]" style={{ ...mono, color: C.faint }}>
                ZZP · lijnkaart
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1" aria-label="Hoofdnavigatie">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6feb]"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? C.lineSoft : "transparent",
                  }}
                >
                  <Icon size={16} aria-hidden="true" style={{ color: on ? C.blue : C.faint }} />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div
            className="mt-auto flex items-center gap-3 rounded-xl px-3 py-3"
            style={{ background: C.panelAlt, border: `1px solid ${C.line}` }}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold text-white"
              style={{ background: C.blue, ...mono }}
            >
              {PROFIEL.initialen}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</div>
              <div className="flex items-center gap-1 text-[10.5px]" style={{ color: C.green }}>
                <Check size={11} aria-hidden="true" /> {PROFIEL.trust}
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-16 shrink-0 items-center gap-3 border-b px-5 sm:px-7"
            style={{ borderColor: C.line }}
          >
            <h2 className="text-[14px] font-semibold tracking-tight">
              {SCREENS.find((s) => s.key === screen)?.label}
            </h2>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="hidden items-center gap-2.5 rounded-lg border px-3 py-2 text-[12.5px] transition-colors hover:bg-[#fafbfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6feb] sm:flex"
                style={{ borderColor: C.line, color: C.muted }}
                aria-label="Zoeken"
              >
                <Search size={14} aria-hidden="true" /> Zoek station…
              </button>
              <button
                className="relative rounded-lg border p-2.5 transition-colors hover:bg-[#fafbfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6feb]"
                style={{ borderColor: C.line, color: C.inkSoft }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.amber }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div
            className="flex gap-1.5 overflow-x-auto border-b px-4 py-2 md:hidden"
            style={{ borderColor: C.line }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6feb]"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? C.lineSoft : "transparent",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {screen === "dashboard" && <Dashboard onOpen={open} />}
            {screen === "marktplaats" && (
              <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
            )}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Legenda voor markers ---------- */

function MarkerLegend() {
  const items: { state: StationState; label: string }[] = [
    { state: "done", label: "Afgerond" },
    { state: "current", label: "In behandeling" },
    { state: "todo", label: "Gepland" },
    { state: "warn", label: "Actie vereist" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {items.map((it) => (
        <span
          key={it.state}
          className="flex items-center gap-2 text-[11.5px]"
          style={{ color: C.muted }}
        >
          <svg width={20} height={20} viewBox="0 0 20 20" aria-hidden="true">
            <Station cx={10} cy={10} color={C.ink} state={it.state} label={it.label} />
          </svg>
          {it.label}
        </span>
      ))}
    </div>
  );
}

/* ---------- Dashboard — netwerkkaart ---------- */

function Dashboard({ onOpen }: { onOpen: (id?: string) => void }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionHead
        kicker="Netwerkkaart"
        title={`Jouw opdracht-netwerk, ${PROFIEL.naam.split(" ")[0]}`}
        note="Elke opdracht is een lijn van reactie tot betaling. Alle lijnen delen de verificatie-overstap. Klik een station om het schema te openen."
      />

      {/* KPI-strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <p
              className="text-[11px] font-medium uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.muted }}
            >
              {k.label}
            </p>
            <p
              className="mt-1.5 text-[22px] font-semibold tabular-nums leading-none"
              style={{ color: C.ink }}
            >
              {k.value}
            </p>
            <p
              className="mt-1.5 text-[11.5px] font-semibold tabular-nums"
              style={{ color: k.up ? C.green : C.amber }}
            >
              {k.up ? "▲" : "▼"} {k.trend}
            </p>
          </Panel>
        ))}
      </div>

      {/* De metrokaart */}
      <Panel className="overflow-hidden">
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5"
          style={{ borderColor: C.line }}
        >
          <h3 className="text-[13.5px] font-semibold tracking-tight">
            Lijnennetwerk · lopende opdrachten
          </h3>
          <MarkerLegend />
        </div>
        <div className="overflow-x-auto px-4 py-5 sm:px-6">
          <svg
            viewBox="0 0 900 300"
            className="w-full"
            style={{ minWidth: 760 }}
            role="img"
            aria-label="Netwerkkaart met drie opdracht-lijnen en de gedeelde verificatie-overstap"
          >
            {/* Stage-kolomlabels */}
            {STAGES.map((st, i) => (
              <text
                key={st}
                x={STAGE_X[i]}
                y={28}
                textAnchor="middle"
                fontSize={12}
                fontWeight={600}
                fill={C.muted}
                style={display}
              >
                {st}
              </text>
            ))}
            {STAGE_X.map((x) => (
              <line key={x} x1={x} y1={40} x2={x} y2={268} stroke={C.lineSoft} strokeWidth={1} />
            ))}

            {/* Verificatie-overstapcapsule */}
            <rect
              x={STAGE_X[2]! - 12}
              y={LINES[0]!.y - 12}
              width={24}
              height={LINES[2]!.y - LINES[0]!.y + 24}
              rx={12}
              fill="#fff"
              stroke={C.ink}
              strokeWidth={2.5}
            />

            {/* Lijnen */}
            {LINES.map((ln, li) => (
              <path
                key={li}
                d={linePath(ln.y)}
                fill="none"
                stroke={ln.color}
                strokeWidth={5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

            {/* Origin-terminus (Profiel) */}
            <circle cx={ORIGIN.x} cy={ORIGIN.y} r={11} fill="#fff" stroke={C.ink} strokeWidth={3} />
            <text
              x={ORIGIN.x}
              y={ORIGIN.y + 34}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              fill={C.inkSoft}
              style={mono}
            >
              Profiel
            </text>

            {/* Stations per lijn */}
            {LINES.map((ln, li) => {
              const opd = OPDRACHTEN[li];
              return STAGE_X.map((x, si) => (
                <Station
                  key={`${li}-${si}`}
                  cx={x}
                  cy={ln.y}
                  color={ln.color}
                  state={stationState(ln.stage, si)}
                  onClick={() => onOpen(opd?.id)}
                  label={`${opd?.titel ?? "Opdracht"} · ${STAGES[si]}`}
                />
              ));
            })}

            {/* Lijn-eindlabels */}
            {LINES.map((ln, li) => (
              <text
                key={`lbl${li}`}
                x={852}
                y={ln.y + 4}
                fontSize={11}
                fontWeight={600}
                fill={ln.color}
                style={mono}
              >
                {OPDRACHTEN[li]?.id}
              </text>
            ))}
          </svg>
        </div>

        {/* Lijnlegenda */}
        <div
          className="grid grid-cols-1 gap-px border-t sm:grid-cols-3"
          style={{ borderColor: C.line, background: C.line }}
        >
          {OPDRACHTEN.map((o, i) => {
            const ln = LINES[i]!;
            return (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className="flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#fafbfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1f6feb]"
                style={{ background: C.panel }}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: ln.color }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-semibold">{o.titel}</span>
                  <span className="block truncate text-[11px]" style={{ ...mono, color: C.muted }}>
                    Nu bij: {STAGES[ln.stage] ?? "Betaald"} · {o.match}% match
                  </span>
                </span>
                <ArrowRight size={15} style={{ color: C.faint }} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

/* ---------- Mini-lijn voor lijstweergave ---------- */

function MiniLine({ color, stage }: { color: string; stage: number }) {
  const xs = [12, 46, 80, 114, 148, 182];
  return (
    <svg width={194} height={24} viewBox="0 0 194 24" aria-hidden="true" className="shrink-0">
      <line
        x1={12}
        y1={12}
        x2={182}
        y2={12}
        stroke={C.line}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <line
        x1={12}
        y1={12}
        x2={xs[Math.min(stage, 5)]}
        y2={12}
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
      />
      {xs.map((x, i) => {
        const st = stationState(stage, i);
        return st === "done" ? (
          <circle key={i} cx={x} cy={12} r={4.5} fill={color} />
        ) : st === "current" ? (
          <circle key={i} cx={x} cy={12} r={5} fill="#fff" stroke={color} strokeWidth={2.5} />
        ) : (
          <circle key={i} cx={x} cy={12} r={4} fill="#fff" stroke={C.faint} strokeWidth={2} />
        );
      })}
    </svg>
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
      <SectionHead
        kicker="Lijnenoverzicht"
        title="Open opdrachten"
        note="Elke opdracht is een lijn met zijn eigen voortgang. Kies er een om de haltes te bekijken."
      />

      <Panel className="flex items-center gap-3 px-4 py-2.5">
        <Search size={16} aria-hidden="true" style={{ color: C.blue }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#98a1af]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11.5px] tabular-nums" style={{ ...mono, color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="px-6 py-16 text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: C.lineSoft }}
            aria-hidden="true"
          >
            <MapIcon size={20} style={{ color: C.faint }} />
          </div>
          <p className="mt-4 text-[15px] font-semibold" style={display}>
            Geen lijn gevonden
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Er rijdt niets voor &quot;{q}&quot;. Verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6feb]"
            style={{ background: C.blue }}
          >
            Zoekopdracht wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3">
            {filtered.map((o, i) => {
              const ln = LINES[i % LINES.length]!;
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className="w-full rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6feb]"
                  style={{
                    background: C.panel,
                    border: `1px solid ${on ? ln.color : C.line}`,
                    boxShadow: on ? `0 6px 20px -12px ${ln.color}` : "none",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10.5px] tabular-nums"
                      style={{ ...mono, color: C.faint }}
                    >
                      {o.id}
                    </span>
                    <span
                      className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{ color: ln.color, background: `${ln.color}14` }}
                    >
                      {o.match}% match
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[14.5px] font-semibold">{o.titel}</p>
                  <p className="mt-0.5 truncate text-[11.5px]" style={{ ...mono, color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </p>
                  <div className="mt-3">
                    <MiniLine color={ln.color} stage={ln.stage} />
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <Panel className="h-fit p-5 lg:sticky lg:top-4">
              <span
                className="text-[10.5px] uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.faint }}
              >
                Lijnschema · {sel.id}
              </span>
              <p className="mt-1.5 text-[16px] font-semibold leading-snug" style={display}>
                {sel.titel}
              </p>
              <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
                {sel.opdrachtgever} · {sel.plaats}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-[12.5px]">
                {[
                  { l: "Tarief", v: sel.tarief },
                  { l: "Omvang", v: sel.uren },
                  { l: "Start", v: sel.start },
                  { l: "Match", v: `${sel.match}%` },
                ].map((m) => (
                  <div
                    key={m.l}
                    className="rounded-lg px-3 py-2"
                    style={{ background: C.panelAlt, border: `1px solid ${C.line}` }}
                  >
                    <dt
                      className="text-[10px] uppercase tracking-[0.08em]"
                      style={{ ...mono, color: C.muted }}
                    >
                      {m.l}
                    </dt>
                    <dd className="mt-0.5 font-semibold tabular-nums">{m.v}</dd>
                  </div>
                ))}
              </dl>
              <button
                onClick={() => onOpen(sel.id)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[12.5px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6feb]"
                style={{ background: C.blue }}
              >
                Open lijnschema <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail — het volledige lijnschema ---------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const idx = OPDRACHTEN.findIndex((o) => o.id === opdracht.id);
  const ln = LINES[Math.max(0, idx)] ?? LINES[0]!;
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };
  const xs = [70, 210, 350, 490, 630, 770];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Panel className="p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: ln.color }}
                aria-hidden="true"
              />
              <Kicker>{opdracht.id}</Kicker>
            </div>
            <h1
              className="mt-1.5 text-[22px] font-semibold leading-tight tracking-tight"
              style={display}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-1.5 text-[12.5px]" style={{ ...mono, color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md px-2 py-0.5 text-[11px]"
                  style={{
                    background: C.panelAlt,
                    border: `1px solid ${C.line}`,
                    color: C.inkSoft,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6feb]"
            style={{ background: state === "sent" ? C.green : C.blue }}
          >
            {state === "sending" && (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            )}
            {state === "sent" && <Check size={15} aria-hidden="true" />}
            {state === "idle" && <Send size={14} aria-hidden="true" />}
            {state === "idle" ? "Reageer" : state === "sending" ? "Versturen…" : "Verstuurd"}
          </button>
        </div>
      </Panel>

      {/* Het lijnschema van deze opdracht */}
      <Panel className="overflow-hidden">
        <div className="border-b px-5 py-3.5" style={{ borderColor: C.line }}>
          <h3 className="text-[13.5px] font-semibold tracking-tight">
            Lijnschema · van reactie tot betaling
          </h3>
        </div>
        <div className="overflow-x-auto px-4 py-6 sm:px-6">
          <svg
            viewBox="0 0 840 120"
            className="w-full"
            style={{ minWidth: 720 }}
            role="img"
            aria-label={`Voortgang van ${opdracht.titel}: nu bij ${STAGES[ln.stage] ?? "Betaald"}`}
          >
            <line
              x1={xs[0]}
              y1={50}
              x2={xs[5]}
              y2={50}
              stroke={C.line}
              strokeWidth={5}
              strokeLinecap="round"
            />
            <line
              x1={xs[0]}
              y1={50}
              x2={xs[Math.min(ln.stage, 5)]}
              y2={50}
              stroke={ln.color}
              strokeWidth={5}
              strokeLinecap="round"
            />
            {STAGES.map((st, i) => {
              const state2 = stationState(ln.stage, i);
              return (
                <g key={st}>
                  <Station cx={xs[i]!} cy={50} color={ln.color} state={state2} label={st} />
                  <text
                    x={xs[i]}
                    y={82}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={600}
                    fill={state2 === "todo" ? C.faint : C.ink}
                    style={display}
                  >
                    {st}
                  </text>
                  <text
                    x={xs[i]}
                    y={98}
                    textAnchor="middle"
                    fontSize={10}
                    fill={C.muted}
                    style={mono}
                  >
                    {state2 === "done" ? "gereed" : state2 === "current" ? "nu" : "gepland"}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </Panel>

      {/* Kerncijfers + redenen */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Match", v: `${opdracht.match}%` },
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
        ].map((m) => (
          <Panel key={m.l} className="p-4">
            <p
              className="text-[10.5px] font-medium uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.muted }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[17px] font-semibold tabular-nums">{m.v}</p>
          </Panel>
        ))}
      </div>

      <Panel className="p-6">
        <h3 className="text-[14px] font-semibold" style={display}>
          Waarom deze match
        </h3>
        <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.green }}
            >
              <Check size={14} aria-hidden="true" /> Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: C.green }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.amber }}
            >
              <AlertTriangle size={14} aria-hidden="true" /> Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.inkSoft }}
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
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* ---------- Verificatie — credential-lijn met haltes ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const xs = [90, 290, 490, 690];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHead
        kicker="Verificatielijn"
        title="Certificaten"
        note="Elke halte is een certificaat. Ingevulde haltes zijn geverifieerd; een waarschuwingshalte vraagt actie."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="green">
          <Check size={12} aria-hidden="true" /> {verified}/{total} geverifieerd
        </Badge>
        <Badge tone="amber">
          <AlertTriangle size={12} aria-hidden="true" /> 1 verloopt bijna
        </Badge>
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto px-4 py-8 sm:px-6">
          <svg
            viewBox="0 0 780 150"
            className="w-full"
            style={{ minWidth: 700 }}
            role="img"
            aria-label="Verificatielijn met certificaat-haltes"
          >
            <line
              x1={xs[0]}
              y1={60}
              x2={xs[3]}
              y2={60}
              stroke={C.line}
              strokeWidth={5}
              strokeLinecap="round"
            />
            {/* Groen tot de laatste geverifieerde, daarna grijs */}
            <line
              x1={xs[0]}
              y1={60}
              x2={xs[1]}
              y2={60}
              stroke={C.green}
              strokeWidth={5}
              strokeLinecap="round"
            />
            {CREDENTIALS.map((c, i) => {
              const m = credMeta(c.status);
              return (
                <g key={c.naam}>
                  <Station
                    cx={xs[i]!}
                    cy={60}
                    color={TONE[m.tone]}
                    state={m.state}
                    label={c.naam}
                  />
                  <text
                    x={xs[i]}
                    y={92}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={600}
                    fill={C.ink}
                    style={display}
                  >
                    {c.naam.length > 18 ? `${c.naam.slice(0, 17)}…` : c.naam}
                  </text>
                  <text
                    x={xs[i]}
                    y={108}
                    textAnchor="middle"
                    fontSize={10.5}
                    fontWeight={600}
                    fill={TONE[m.tone]}
                    style={mono}
                  >
                    {m.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detailtabel */}
        <div className="border-t" style={{ borderColor: C.line }}>
          {CREDENTIALS.map((c, i) => {
            const m = credMeta(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 px-5 py-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${TONE[m.tone]}14` }}
                >
                  {c.status === "SUBMITTED" ? (
                    <Loader2
                      size={16}
                      className="motion-safe:animate-spin"
                      style={{ color: TONE[m.tone] }}
                      aria-hidden="true"
                    />
                  ) : (
                    <m.Icon size={16} style={{ color: TONE[m.tone] }} aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold">{c.naam}</p>
                  <p className="text-[11.5px]" style={{ ...mono, color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <Badge tone={m.tone}>{m.label}</Badge>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHead
        kicker="Storingsmeldingen"
        title="Volgende acties"
        note="Op volgorde van urgentie — begin bij de bovenste halte."
      />
      <div className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone: Tone = warn ? "amber" : "blue";
          return (
            <Panel key={a.titel} className="flex items-start gap-4 p-5">
              <div className="flex flex-col items-center gap-2">
                <span
                  className="text-[11px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.faint }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${TONE[tone]}14` }}
                >
                  {warn ? (
                    <AlertTriangle size={18} style={{ color: C.amber }} aria-hidden="true" />
                  ) : (
                    <Bell size={18} style={{ color: C.blue }} aria-hidden="true" />
                  )}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <Badge tone={tone}>{warn ? "Waarschuwing" : "Melding"}</Badge>
                <p className="mt-2 text-[14px] font-semibold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-center rounded-lg px-4 py-1.5 text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6feb]"
                style={{
                  color: TONE[tone],
                  background: `${TONE[tone]}14`,
                  border: `1px solid ${TONE[tone]}33`,
                }}
              >
                {a.cta}
              </button>
            </Panel>
          );
        })}
      </div>
      <Panel className="flex items-center gap-4 p-5">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: `${C.green}14` }}
        >
          <Check size={18} style={{ color: C.green }} aria-hidden="true" />
        </span>
        <p className="text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
          Geen storingen op het overige netwerk. Nieuwe meldingen verschijnen hier zodra ze relevant
          worden.
        </p>
      </Panel>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusTone: Record<string, { tone: Tone; Icon: LucideIcon }> = {
    Betaald: { tone: "green", Icon: Check },
    Openstaand: { tone: "amber", Icon: Clock },
    Concept: { tone: "blue", Icon: Receipt },
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
        <SectionHead
          kicker="Eindhalte"
          title="Facturen"
          note="De laatste haltes van elke lijn: verstuurd, openstaand en betaald."
        />
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6feb]"
          style={{ background: C.blue }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Panel className="p-5">
          <p
            className="text-[10.5px] uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.muted }}
          >
            Ontvangen
          </p>
          <p className="mt-1.5 text-[22px] font-semibold tabular-nums" style={{ color: C.green }}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Panel>
        <Panel className="p-5">
          <p
            className="text-[10.5px] uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.muted }}
          >
            Openstaand
          </p>
          <p className="mt-1.5 text-[22px] font-semibold tabular-nums" style={{ color: C.amber }}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.muted, borderBottom: `1px solid ${C.line}` }}
              >
                <th className="px-5 py-3.5">Nummer</th>
                <th className="px-5 py-3.5">Klant</th>
                <th className="hidden px-5 py-3.5 sm:table-cell">Datum</th>
                <th className="px-5 py-3.5 text-right">Bedrag</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const meta = statusTone[f.status] ?? statusTone.Concept!;
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#fafbfc]"
                    style={{ borderTop: `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-5 py-4 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.inkSoft }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-medium">{f.klant}</td>
                    <td
                      className="hidden px-5 py-4 text-[12px] tabular-nums sm:table-cell"
                      style={{ ...mono, color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-5 py-4 text-right text-[13px] font-semibold tabular-nums">
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <Badge tone={meta.tone}>
                          <meta.Icon size={12} aria-hidden="true" /> {f.status}
                        </Badge>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
