"use client";

// Concept 21 — "Atlas" · Cartografisch / kaart-first matching.
// Matching wordt ruimtelijk: een gestileerd topografisch kaart-canvas als hoofdmetafoor met
// contourlijnen, water, regiovlakken, locatie-pins (match% in de pin) en reistijd-radiusringen.
// Coördinaat-labels, schaalbalk en een subtiel kompasroosje geven het cartografische register.
// Palet: topografisch beige #f4f1ea, oppervlak #fffdf8, ink #24312e, kaart-teal #167a6b,
// water #3b7ea1, land-lijn #c9bfa8, waarschuwing amber #c08a2e. Hairline contouren.
// Fonts: Inter (UI) + Spline Sans Mono (coördinaten/cijfers).

import { useState } from "react";
import {
  Compass,
  Map as MapIcon,
  MapPin,
  Search,
  Bell,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  ShieldCheck,
  FileText,
  Navigation,
  Layers,
  Route,
  Plus,
  Inbox,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  ink: "#24312e",
  inkSoft: "#4d5a55",
  muted: "#7a857f",
  faint: "#a7b0a8",
  surface: "#fffdf8",
  surfaceSoft: "#f9f6ee",
  beige: "#f4f1ea",
  line: "#e2dccd",
  lineSoft: "#eee9dc",
  teal: "#167a6b",
  tealDeep: "#0f5f53",
  tealSoft: "rgba(22,122,107,0.10)",
  water: "#3b7ea1",
  waterSoft: "rgba(59,126,161,0.12)",
  land: "#c9bfa8",
  landSoft: "rgba(201,191,168,0.28)",
  amber: "#c08a2e",
  amberSoft: "rgba(192,138,46,0.14)",
  rose: "#b5533a",
  roseSoft: "rgba(181,83,58,0.12)",
};

const ui = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-spline-mono)" };

const SHADOW = "0 20px 46px -26px rgba(36,49,46,0.34)";
const SHADOW_SM = "0 10px 24px -16px rgba(36,49,46,0.28)";

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: MapIcon,
  marktplaats: Compass,
  opdracht: MapPin,
  verificatie: ShieldCheck,
  acties: Route,
  facturen: FileText,
  documenten: Layers,
  berichten: Inbox,
};

// Kaart-coördinaten per opdracht (gestileerd, binnen het 0..100 canvas).
const PINS: { x: number; y: number }[] = [
  { x: 62, y: 34 },
  { x: 30, y: 62 },
  { x: 76, y: 68 },
];

function statusStyle(s: CredStatus): { label: string; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.tealDeep, bg: C.tealSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.water, bg: C.waterSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.amber, bg: C.amberSoft };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.rose, bg: C.roseSoft };
  }
}

function Sparkline({ data, color = C.teal }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 88;
  const h = 28;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polygon points={area} fill={color} opacity={0.1} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.9}
      />
    </svg>
  );
}

// Gestileerd topografisch kaart-canvas met contourlijnen, water, regio's, pins en radiusringen.
function TopoMap({
  pins = PINS,
  matches,
  className = "",
  showRings = true,
  height = 260,
}: {
  pins?: { x: number; y: number }[];
  matches: number[];
  className?: string;
  showRings?: boolean;
  height?: number;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: C.beige, height, border: `1px solid ${C.line}`, borderRadius: 18 }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        {/* water-vlak */}
        <path
          d="M0,74 C14,70 22,80 34,78 C50,75 58,86 74,84 C86,82 94,88 100,86 L100,100 L0,100 Z"
          fill={C.water}
          opacity={0.14}
        />
        <path
          d="M0,74 C14,70 22,80 34,78 C50,75 58,86 74,84 C86,82 94,88 100,86"
          fill="none"
          stroke={C.water}
          strokeWidth={0.4}
          opacity={0.4}
        />
        {/* land-regiovlak */}
        <path
          d="M8,20 C24,10 44,16 58,12 C74,8 88,18 96,28 C92,44 96,58 84,66 C66,72 48,64 32,66 C18,68 8,58 6,44 Z"
          fill={C.land}
          opacity={0.22}
        />
        {/* contourlijnen (hairline) */}
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            d={`M${4 + i * 2},${30 + i * 3} C${26 + i},${18 + i * 2} ${48 - i},${24 + i} ${64 + i},${20 + i * 2} C${80 - i},${16 + i} ${90 + i * 0.5},${28 + i} ${94 - i},${38 + i * 2}`}
            fill="none"
            stroke={C.land}
            strokeWidth={0.35}
            opacity={0.5}
          />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <path
            key={`b${i}`}
            d={`M${10 + i * 2},${52 + i * 3} C${28},${44 + i * 2} ${46 + i},${56 + i} ${62},${52 + i * 2} C${78 + i},${48} ${88},${58 + i} ${92 - i},${64 + i}`}
            fill="none"
            stroke={C.teal}
            strokeWidth={0.3}
            opacity={0.22}
          />
        ))}
        {/* reistijd-radiusringen rond de gebruiker */}
        {showRings &&
          [10, 17, 24].map((r) => (
            <circle
              key={r}
              cx={46}
              cy={50}
              r={r}
              fill="none"
              stroke={C.teal}
              strokeWidth={0.35}
              strokeDasharray="1.4 1.4"
              opacity={0.4}
            />
          ))}
        {/* eigen locatie */}
        <circle cx={46} cy={50} r={1.7} fill={C.teal} />
        <circle
          cx={46}
          cy={50}
          r={3.2}
          fill="none"
          stroke={C.teal}
          strokeWidth={0.5}
          opacity={0.6}
        />
      </svg>

      {/* pins met poot + schaduw + match% */}
      {pins.map((p, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <div className="relative flex flex-col items-center">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums text-white"
              style={{
                background: matches[i] >= 90 ? C.teal : matches[i] >= 85 ? C.water : C.amber,
                boxShadow: "0 6px 12px -4px rgba(36,49,46,0.5)",
                ...mono,
              }}
            >
              {matches[i]}
            </div>
            <div
              className="h-2 w-2 -translate-y-1 rotate-45"
              style={{
                background: matches[i] >= 90 ? C.teal : matches[i] >= 85 ? C.water : C.amber,
              }}
              aria-hidden="true"
            />
            <div
              className="h-1 w-3 rounded-full opacity-30"
              style={{ background: C.ink, filter: "blur(1px)" }}
              aria-hidden="true"
            />
          </div>
        </div>
      ))}

      {/* coördinaat-label */}
      <div
        className="absolute left-3 top-3 rounded-md px-2 py-0.5 text-[9.5px] tracking-wide"
        style={{
          ...mono,
          background: "rgba(255,253,248,0.82)",
          color: C.inkSoft,
          border: `1px solid ${C.line}`,
        }}
      >
        52.09° N · 5.12° O
      </div>

      {/* kompasroosje (subtiel) */}
      <div className="absolute right-3 top-3" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 26 26">
          <circle
            cx="13"
            cy="13"
            r="11"
            fill="none"
            stroke={C.faint}
            strokeWidth="0.6"
            opacity="0.7"
          />
          <path d="M13 3 L15.5 13 L13 11 L10.5 13 Z" fill={C.rose} opacity="0.85" />
          <path d="M13 23 L10.5 13 L13 15 L15.5 13 Z" fill={C.faint} opacity="0.7" />
          <text x="13" y="2.4" textAnchor="middle" fontSize="3.2" fill={C.muted} style={mono}>
            N
          </text>
        </svg>
      </div>

      {/* schaalbalk */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5" aria-hidden="true">
        <div className="flex h-1.5 items-end">
          <span style={{ width: 18, height: 6, background: C.ink, opacity: 0.55 }} />
          <span
            style={{
              width: 18,
              height: 6,
              background: "transparent",
              border: `1px solid ${C.ink}`,
              opacity: 0.4,
            }}
          />
        </div>
        <span className="text-[8.5px]" style={{ ...mono, color: C.muted }}>
          5 km
        </span>
      </div>
    </div>
  );
}

function Kicker({ children, color = C.teal }: { children: React.ReactNode; color?: string }) {
  return (
    <p
      className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.22em]"
      style={{ ...mono, color }}
    >
      <Navigation size={11} aria-hidden="true" />
      {children}
    </p>
  );
}

function Panel({
  children,
  className = "",
  soft = false,
}: {
  children: React.ReactNode;
  className?: string;
  soft?: boolean;
}) {
  return (
    <div
      className={`rounded-[18px] ${className}`}
      style={{
        background: soft ? C.surfaceSoft : C.surface,
        boxShadow: SHADOW,
        border: `1px solid ${C.line}`,
      }}
    >
      {children}
    </div>
  );
}

const REGIOS = ["Utrecht", "Almere", "Zeist", "’t Gooi", "Amersfoort"];

export function Concept21() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;
  const matches = OPDRACHTEN.map((o) => o.match);

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{
        ...ui,
        color: C.ink,
        background:
          "radial-gradient(900px 500px at 6% -8%, rgba(22,122,107,0.08), transparent 60%), radial-gradient(800px 480px at 96% 6%, rgba(59,126,161,0.08), transparent 58%), " +
          C.beige,
      }}
    >
      <div className="flex min-h-[680px]">
        {/* Sidebar — cartografisch legenda-paneel */}
        <aside className="hidden w-[248px] shrink-0 flex-col px-4 py-6 lg:flex">
          <div className="flex items-center gap-3 px-2 pb-7">
            <div
              className="flex h-11 w-11 items-center justify-center text-white"
              style={{ background: C.teal, borderRadius: 14, boxShadow: SHADOW_SM }}
            >
              <Compass size={20} aria-hidden="true" />
            </div>
            <div>
              <div className="text-[15.5px] font-semibold leading-tight" style={ui}>
                ZZP Atlas
              </div>
              <div className="text-[10.5px]" style={{ ...mono, color: C.muted }}>
                kaart-first matching
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    color: on ? C.ink : C.inkSoft,
                    background: on ? C.surface : "transparent",
                    boxShadow: on ? SHADOW_SM : "none",
                    border: `1px solid ${on ? C.line : "transparent"}`,
                  }}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-[9px]"
                    style={{ background: on ? C.tealSoft : C.lineSoft }}
                  >
                    <Icon size={15} aria-hidden="true" style={{ color: on ? C.teal : C.muted }} />
                  </span>
                  {s.label}
                </button>
              );
            })}
          </nav>

          {/* Legenda */}
          <div className="mt-7 px-2">
            <p
              className="pb-2.5 text-[9.5px] font-semibold uppercase tracking-[0.2em]"
              style={{ ...mono, color: C.faint }}
            >
              Legenda
            </p>
            <div className="space-y-2 text-[11px]" style={{ color: C.muted }}>
              {[
                { c: C.teal, l: "Match ≥ 90%" },
                { c: C.water, l: "Match 85–89%" },
                { c: C.amber, l: "Match < 85%" },
              ].map((x) => (
                <div key={x.l} className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: x.c }}
                    aria-hidden="true"
                  />
                  {x.l}
                </div>
              ))}
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-4 rounded-full"
                  style={{ background: C.waterSoft }}
                  aria-hidden="true"
                />
                Reistijd-radius
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <div
              className="flex items-center gap-3 rounded-[14px] px-3.5 py-3"
              style={{ background: C.surface, boxShadow: SHADOW_SM, border: `1px solid ${C.line}` }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center text-[12px] font-semibold text-white"
                style={{ background: C.water, borderRadius: 12 }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</div>
                <div className="truncate text-[10.5px]" style={{ ...mono, color: C.muted }}>
                  {PROFIEL.plaats}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[72px] shrink-0 items-center gap-3 px-6 lg:px-9">
            <div className="flex items-center gap-2 text-[12px]" style={{ color: C.muted }}>
              <MapPin size={14} aria-hidden="true" style={{ color: C.teal }} />
              <span style={mono}>{PROFIEL.plaats}</span>
              <ChevronRight size={13} aria-hidden="true" style={{ color: C.faint }} />
              <span className="font-semibold" style={{ color: C.ink }}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="flex items-center gap-2.5 rounded-[12px] px-4 py-2.5 text-[12.5px] transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: C.surface,
                  color: C.muted,
                  boxShadow: SHADOW_SM,
                  border: `1px solid ${C.line}`,
                }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span className="hidden sm:inline">Zoek op de kaart…</span>
              </button>
              <button
                className="relative rounded-[12px] p-2.5 transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: C.surface,
                  color: C.muted,
                  boxShadow: SHADOW_SM,
                  border: `1px solid ${C.line}`,
                }}
                aria-label="Meldingen"
              >
                <Bell size={16} aria-hidden="true" />
                <span
                  className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full"
                  style={{ background: C.rose }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div className="flex gap-2 overflow-x-auto px-4 pb-2 lg:hidden">
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  className="shrink-0 rounded-[10px] px-3.5 py-2 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? C.teal : C.muted,
                    background: on ? C.surface : "transparent",
                    boxShadow: on ? SHADOW_SM : "none",
                    border: `1px solid ${on ? C.line : "transparent"}`,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-7 lg:px-9 lg:py-8">
            {screen === "dashboard" && (
              <Dashboard onOpen={() => setScreen("opdracht")} matches={matches} />
            )}
            {screen === "marktplaats" && (
              <Marktplaats onOpen={() => setScreen("opdracht")} matches={matches} />
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

function Dashboard({ onOpen, matches }: { onOpen: () => void; matches: number[] }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div>
        <Kicker>Peiling · vandaag</Kicker>
        <h1 className="mt-3 text-[32px] font-semibold leading-[1.06] tracking-tight" style={ui}>
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
        </h1>
        <p className="mt-2 max-w-lg text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Drie opdrachten liggen binnen je reisradius. We hebben ze op de kaart uitgezet en op
          verklaarbaarheid gesorteerd — één certificaat vraagt om aandacht.
        </p>
      </div>

      {/* KPI's */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <p className="text-[11.5px]" style={{ color: C.muted }}>
              {k.label}
            </p>
            <p
              className="mt-2 text-[26px] font-semibold leading-none tracking-tight"
              style={{ ...mono, color: C.ink }}
            >
              {k.value}
            </p>
            <div className="mt-3.5 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium tabular-nums"
                style={{
                  color: k.up ? C.tealDeep : C.amber,
                  background: k.up ? C.tealSoft : C.amberSoft,
                  ...mono,
                }}
              >
                {k.up ? (
                  <ArrowUpRight size={11} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={11} aria-hidden="true" />
                )}
                {k.trend}
              </span>
              <Sparkline data={k.spark} color={k.up ? C.teal : C.amber} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Mini-map + matches */}
        <div className="space-y-5 lg:col-span-2">
          <Panel className="overflow-hidden p-0">
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold" style={ui}>
                <MapIcon size={15} aria-hidden="true" style={{ color: C.teal }} /> Matches op de
                kaart
              </h2>
              <span className="text-[10.5px]" style={{ ...mono, color: C.muted }}>
                straal 24 min
              </span>
            </div>
            <div className="px-3 pb-3">
              <TopoMap matches={matches} height={220} />
            </div>
            <div className="flex flex-col gap-1 px-2.5 pb-2.5">
              {OPDRACHTEN.map((o, i) => (
                <button
                  key={o.id}
                  onClick={onOpen}
                  className="flex w-full items-center gap-3.5 rounded-[13px] px-3.5 py-3 text-left transition-colors hover:bg-[#f9f6ee] focus-visible:outline-none focus-visible:ring-2"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums text-white"
                    style={{
                      background: matches[i] >= 90 ? C.teal : matches[i] >= 85 ? C.water : C.amber,
                      ...mono,
                    }}
                  >
                    {o.match}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold">{o.titel}</p>
                    <p className="mt-0.5 truncate text-[11.5px]" style={{ color: C.muted }}>
                      {o.opdrachtgever} · {o.plaats}
                    </p>
                  </div>
                  <span
                    className="hidden text-[11.5px] tabular-nums sm:block"
                    style={{ color: C.inkSoft, ...mono }}
                  >
                    {o.tarief.replace(" / uur", "")}
                  </span>
                  <ChevronRight size={15} aria-hidden="true" style={{ color: C.faint }} />
                </button>
              ))}
            </div>
          </Panel>

          {/* Berichten */}
          <div>
            <div className="mb-3 flex items-baseline justify-between px-1">
              <h2 className="text-[15px] font-semibold" style={ui}>
                Recente berichten
              </h2>
              <span className="text-[11px]" style={{ ...mono, color: C.teal }}>
                {BERICHTEN.filter((b) => b.ongelezen).length} ongelezen
              </span>
            </div>
            <Panel className="p-2">
              <div className="flex flex-col gap-0.5">
                {BERICHTEN.map((b) => (
                  <div
                    key={b.van}
                    className="flex items-center gap-3 rounded-[13px] px-3 py-2.5 transition-colors hover:bg-[#f9f6ee]"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] text-[10.5px] font-semibold text-white"
                      style={{ background: b.ongelezen ? C.teal : C.faint }}
                    >
                      {b.initialen}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[12.5px] font-semibold">{b.van}</p>
                        {b.ongelezen && (
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: C.rose }}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                        {b.preview}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-[10.5px] tabular-nums"
                      style={{ ...mono, color: C.faint }}
                    >
                      {b.tijd}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        {/* Rechterkolom */}
        <div className="space-y-5">
          <div>
            <h2 className="mb-3 px-1 text-[15px] font-semibold" style={ui}>
              Jouw certificaten
            </h2>
            <Panel className="p-4">
              <div className="space-y-3.5">
                {CREDENTIALS.map((c) => {
                  const st = statusStyle(c.status);
                  return (
                    <div key={c.naam} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px]"
                        style={{ background: st.bg }}
                        aria-hidden="true"
                      >
                        <span className="h-2 w-2 rounded-full" style={{ background: st.fg }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold">{c.naam}</p>
                        <p className="truncate text-[11px]" style={{ color: C.muted }}>
                          {c.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>

          <Panel className="overflow-hidden p-0">
            <div className="px-4 py-3.5" style={{ background: C.teal }}>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80"
                style={mono}
              >
                Volgende beste stap
              </p>
              <p className="mt-1.5 text-[15px] font-semibold leading-snug text-white" style={ui}>
                {primair.titel}
              </p>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-[12px] leading-relaxed" style={{ color: C.inkSoft }}>
                {primair.detail}
              </p>
              <button
                className="mt-3 w-full rounded-[11px] px-4 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
                style={{ background: C.teal }}
              >
                {primair.cta}
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Marktplaats({ onOpen, matches }: { onOpen: () => void; matches: number[] }) {
  const [q, setQ] = useState("");
  const [regio, setRegio] = useState<string | null>(null);
  const filtered = OPDRACHTEN.filter((o) => {
    const inQ =
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase());
    const inRegio = !regio || o.plaats === regio;
    return inQ && inRegio;
  });
  const shownMatches = filtered.map((o) => matches[OPDRACHTEN.indexOf(o)]);
  const shownPins = filtered.map((_, i) => PINS[i] ?? PINS[0]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Kicker color={C.water}>Marktplaats · kaart + lijst</Kicker>
        <h1 className="mt-3 text-[27px] font-semibold leading-tight tracking-tight" style={ui}>
          Open opdrachten in de regio
        </h1>
      </div>

      <div
        className="flex items-center gap-3 rounded-[13px] px-4 py-3"
        style={{ background: C.surface, boxShadow: SHADOW_SM, border: `1px solid ${C.line}` }}
      >
        <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a7b0a8]"
          style={{ color: C.ink }}
        />
      </div>

      {/* Regio-filter-chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setRegio(null)}
          className="rounded-full px-3 py-1.5 text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{
            background: regio === null ? C.teal : C.surface,
            color: regio === null ? "#fff" : C.inkSoft,
            border: `1px solid ${regio === null ? C.teal : C.line}`,
          }}
        >
          Alle regio’s
        </button>
        {REGIOS.map((r) => {
          const on = regio === r;
          return (
            <button
              key={r}
              onClick={() => setRegio(on ? null : r)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{
                background: on ? C.tealSoft : C.surface,
                color: on ? C.tealDeep : C.inkSoft,
                border: `1px solid ${on ? C.teal : C.line}`,
              }}
            >
              <MapPin size={11} aria-hidden="true" /> {r}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_1fr]">
        {/* Kaart */}
        <Panel className="order-2 overflow-hidden p-3 lg:sticky lg:top-4 lg:order-1 lg:self-start">
          <TopoMap
            matches={shownMatches.length ? shownMatches : matches}
            pins={shownPins.length ? shownPins : PINS}
            height={380}
            showRings
          />
          <div
            className="mt-3 flex items-center justify-between px-1 text-[11px]"
            style={{ color: C.muted }}
          >
            <span className="flex items-center gap-1.5" style={mono}>
              <Layers size={12} aria-hidden="true" /> {filtered.length} pins zichtbaar
            </span>
            <span style={mono}>schaal 1:50k</span>
          </div>
        </Panel>

        {/* Lijst */}
        <div className="order-1 space-y-4 lg:order-2">
          {filtered.length === 0 ? (
            <Panel className="flex flex-col items-center px-6 py-14 text-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: C.waterSoft }}
              >
                <Compass size={24} aria-hidden="true" style={{ color: C.water }} />
              </div>
              <p className="mt-4 text-[16px] font-semibold" style={ui}>
                Geen opdrachten op deze kaart
              </p>
              <p className="mt-1.5 max-w-sm text-[12px]" style={{ color: C.muted }}>
                Verruim je zoekwoorden of kies een andere regio. We zetten nieuwe opdrachten
                automatisch op de kaart zodra ze binnenkomen.
              </p>
              <button
                onClick={() => {
                  setQ("");
                  setRegio(null);
                }}
                className="mt-4 rounded-[10px] px-4 py-2 text-[12px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2"
                style={{ background: C.teal }}
              >
                Kaart herstellen
              </button>
            </Panel>
          ) : (
            filtered.map((o, i) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="group block w-full rounded-[16px] p-4 text-left transition-all hover:-translate-y-[2px] focus-visible:outline-none focus-visible:ring-2"
                style={{ background: C.surface, boxShadow: SHADOW, border: `1px solid ${C.line}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] tracking-wide" style={{ ...mono, color: C.faint }}>
                      {o.id}
                    </span>
                    <p className="mt-1 text-[16px] font-semibold leading-snug" style={ui}>
                      {o.titel}
                    </p>
                  </div>
                  <span
                    className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[12px] text-[13px] font-semibold tabular-nums text-white"
                    style={{
                      background:
                        shownMatches[i] >= 90 ? C.teal : shownMatches[i] >= 85 ? C.water : C.amber,
                      ...mono,
                    }}
                  >
                    {o.match}
                    <span className="text-[7.5px] font-medium opacity-80">MATCH</span>
                  </span>
                </div>
                <p
                  className="mt-1.5 flex items-center gap-1.5 text-[12px]"
                  style={{ color: C.muted }}
                >
                  <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-1 text-[10px] font-medium"
                      style={{ background: C.lineSoft, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div
                  className="mt-3.5 flex items-center justify-between border-t pt-3.5 text-[12px]"
                  style={{ borderColor: C.line }}
                >
                  <span className="font-semibold tabular-nums" style={{ ...mono, color: C.teal }}>
                    {o.tarief}
                  </span>
                  <span className="tabular-nums" style={{ ...mono, color: C.muted }}>
                    {o.uren}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Kicker>{opdracht.id}</Kicker>
          <h1 className="mt-3 text-[27px] font-semibold leading-tight tracking-tight" style={ui}>
            {opdracht.titel}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="shrink-0 rounded-[12px] px-6 py-3 text-[13px] font-semibold text-white transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.teal, boxShadow: SHADOW_SM }}
        >
          Reageer op opdracht
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Panel className="overflow-hidden p-3">
          <TopoMap matches={[opdracht.match]} pins={[PINS[0]]} height={260} />
          <div
            className="mt-2.5 flex items-center gap-2 px-1 text-[11px]"
            style={{ ...mono, color: C.muted }}
          >
            <Route size={12} aria-hidden="true" style={{ color: C.teal }} /> reistijd ≈ 12 min · 6,4
            km
          </div>
        </Panel>

        <div className="grid grid-cols-2 gap-3.5 self-start">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m) => (
            <Panel key={m.l} className="p-4">
              <p className="text-[10.5px]" style={{ color: C.muted }}>
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[16px] font-semibold tabular-nums tracking-tight"
                style={{ ...mono, color: C.ink }}
              >
                {m.v}
              </p>
            </Panel>
          ))}
        </div>
      </div>

      <Panel className="p-5">
        <h3 className="text-[16px] font-semibold" style={ui}>
          Waarom deze match
        </h3>
        <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je profiel en je reisradius.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-[14px] p-4" style={{ background: C.tealSoft }}>
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.tealDeep }}
            >
              Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[12.5px]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.teal }}
                    aria-hidden="true"
                  >
                    <Check size={12} className="text-white" />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[14px] p-4" style={{ background: C.amberSoft }}>
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.amber }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[12.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(192,138,46,0.22)" }}
                    aria-hidden="true"
                  >
                    <Minus size={12} style={{ color: C.amber }} />
                  </span>
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

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker>Vertrouwen</Kicker>
        <h1 className="mt-3 text-[27px] font-semibold leading-tight tracking-tight" style={ui}>
          Verificatie
        </h1>
      </div>

      <Panel className="flex items-center gap-5 p-5">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px]"
          style={{ background: C.tealSoft }}
        >
          <ShieldCheck size={26} aria-hidden="true" style={{ color: C.tealDeep }} />
        </div>
        <div>
          <p className="text-[20px] font-semibold" style={ui}>
            {PROFIEL.trust}
          </p>
          <p className="mt-0.5 text-[12px]" style={{ color: C.inkSoft }}>
            <span style={mono}>{verified}</span> van <span style={mono}>{CREDENTIALS.length}</span>{" "}
            certificaten geverifieerd · <span style={mono}>1</span> vraagt om actie. Alles
            versleuteld bewaard.
          </p>
        </div>
      </Panel>

      <Panel className="p-2">
        <div className="flex flex-col gap-0.5">
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 rounded-[13px] px-3.5 py-3.5 transition-colors hover:bg-[#f9f6ee]"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
                  style={{ background: st.bg }}
                >
                  {c.status === "VERIFIED" ? (
                    <Check size={17} aria-hidden="true" style={{ color: st.fg }} />
                  ) : c.status === "SUBMITTED" ? (
                    <Clock size={17} aria-hidden="true" style={{ color: st.fg }} />
                  ) : (
                    <AlertTriangle size={17} aria-hidden="true" style={{ color: st.fg }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold">{c.naam}</p>
                  <p className="text-[11.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold"
                  style={{ color: st.fg, background: st.bg }}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>

      <div>
        <h2 className="mb-3 px-1 text-[15px] font-semibold" style={ui}>
          Veilig bewaarde documenten
        </h2>
        <Panel className="p-2">
          <div className="flex flex-col gap-0.5">
            {DOCUMENTEN.map((d) => {
              const st = statusStyle(d.status);
              return (
                <div
                  key={d.naam}
                  className="flex items-center gap-3.5 rounded-[13px] px-3.5 py-3 transition-colors hover:bg-[#f9f6ee]"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                    style={{ background: C.lineSoft }}
                    aria-hidden="true"
                  >
                    <FileText size={16} style={{ color: C.muted }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold">{d.naam}</p>
                    <p className="truncate text-[10.5px]" style={{ ...mono, color: C.muted }}>
                      {d.type} · {d.grootte} · {d.bijgewerkt}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                    style={{ color: st.fg, background: st.bg }}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; bg: string; Icon: LucideIcon }> = {
    warning: { fg: C.amber, bg: C.amberSoft, Icon: AlertTriangle },
    info: { fg: C.teal, bg: C.tealSoft, Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Kicker>Route · aandacht</Kicker>
        <h1 className="mt-3 text-[27px] font-semibold leading-tight tracking-tight" style={ui}>
          Volgende acties
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkSoft }}>
          Eén etappe tegelijk. Wij houden de rest van de route bij.
        </p>
      </div>
      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <Panel key={a.titel} className="flex items-start gap-4 p-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]"
                style={{ background: t.bg }}
              >
                <t.Icon size={19} aria-hidden="true" style={{ color: t.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] tabular-nums" style={{ ...mono, color: C.faint }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[14px] font-semibold" style={ui}>
                    {a.titel}
                  </p>
                </div>
                <p className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-[10px] px-4 py-2 text-[12px] font-semibold transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
                style={{ background: C.tealSoft, color: C.tealDeep }}
              >
                {a.cta}
              </button>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string }> = {
    Betaald: { fg: C.tealDeep, bg: C.tealSoft },
    Openstaand: { fg: C.amber, bg: C.amberSoft },
    Concept: { fg: C.muted, bg: C.lineSoft },
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Omzet</Kicker>
          <h1 className="mt-3 text-[27px] font-semibold leading-tight tracking-tight" style={ui}>
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-[12px] px-5 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.teal, boxShadow: SHADOW_SM }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10px] uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.muted }}
              >
                <th className="px-5 py-3 font-semibold">Nummer</th>
                <th className="px-5 py-3 font-semibold">Klant</th>
                <th className="px-5 py-3 font-semibold">Datum</th>
                <th className="px-5 py-3 text-right font-semibold">Bedrag</th>
                <th className="px-5 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = statusTone[f.status] ?? { fg: C.muted, bg: C.lineSoft };
                return (
                  <tr
                    key={f.nr}
                    className="border-t transition-colors hover:bg-[#f9f6ee]"
                    style={{ borderColor: C.lineSoft }}
                  >
                    <td className="px-5 py-3.5 text-[12px]" style={{ ...mono, color: C.inkSoft }}>
                      {f.nr}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-medium">{f.klant}</td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ ...mono, color: C.muted }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
                        style={{ color: t.fg, background: t.bg }}
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
        </div>
      </Panel>
    </div>
  );
}
