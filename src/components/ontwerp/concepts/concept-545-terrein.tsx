"use client";

// Concept 545 — "Terrein" · map-first / geospatiaal. Matching begint bij plaats: opdrachten worden
// geordend naar afstand vanaf de thuisbasis, met een puur in SVG/CSS getekende, stilistische
// regio-plattegrond (geen kaart-library). Klikbare regio's filteren de lijst; afstand + reistijd
// staan overal in beeld. 2026-trends: intent-driven "waar-eerst" layout, spatial data-canvas,
// verklaarbare nabijheid en tactiele hover-cartografie. Deterministisch — geen random/Date.
// Fonts: Space Grotesk (kop/labels) + JetBrains Mono (coördinaten/afstanden).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  MapPin,
  Navigation,
  Compass,
  Coins,
  CalendarDays,
  ShieldCheck,
  Route,
  Plus,
  Layers,
  Locate,
  Timer,
  RefreshCw,
  ServerCrash,
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

// ── Palet — cartografisch: perkament-papier, inkt, mos-accent, water/land tinten ──────
const C = {
  bg: "#eef1ea",
  panel: "#ffffff",
  land: "#f4f6ef",
  water: "#dbe6ea",
  ink: "#1c2419",
  inkSoft: "#586152",
  inkFaint: "#93998b",
  line: "#dfe3d8",
  lineStrong: "#c3cbb7",
  accent: "#3f6f4a", // mos-groen
  accentSoft: "#e4efe4",
  accentDeep: "#2c5236",
  contour: "#c9d3bd",
  route: "#c2601f", // route-oranje
  routeSoft: "#f7e6d5",
  ok: "#3f6f4a",
  warn: "#b0741c",
  bad: "#a63c2e",
  info: "#3a6b8a",
};

const ui = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// ── Geospatiale kaart-data — deterministische coördinaten & nabijheid per plaats ─────
// Thuisbasis = Utrecht (PROFIEL.plaats). Coördinaten zijn stilistisch (0..100 op het SVG-canvas).
type Regio = {
  key: string;
  naam: string;
  x: number;
  y: number;
  afstandKm: number;
  reistijdMin: number;
  // Ruwe cel-vorm (polygon) rond het knooppunt — puur decoratief maar consistent.
  cel: string;
};

const HOME = "Utrecht";

const REGIOS: Regio[] = [
  {
    key: "utrecht",
    naam: "Utrecht",
    x: 44,
    y: 52,
    afstandKm: 0,
    reistijdMin: 0,
    cel: "30,40 52,34 62,48 56,66 36,70 26,56",
  },
  {
    key: "zeist",
    naam: "Zeist",
    x: 63,
    y: 46,
    afstandKm: 11,
    reistijdMin: 12,
    cel: "56,34 74,32 82,46 74,58 60,58 56,46",
  },
  {
    key: "almere",
    naam: "Almere",
    x: 70,
    y: 24,
    afstandKm: 34,
    reistijdMin: 38,
    cel: "58,12 82,10 90,24 82,34 64,32 56,22",
  },
];

function regioVoorPlaats(plaats: string): Regio {
  return REGIOS.find((r) => r.naam === plaats) ?? REGIOS[0]!;
}

// Opdracht verrijkt met geodata, gesorteerd op afstand.
type GeoOpdracht = Opdracht & { afstandKm: number; reistijdMin: number; regioKey: string };

function geoOpdrachten(): GeoOpdracht[] {
  return OPDRACHTEN.map((o) => {
    const r = regioVoorPlaats(o.plaats);
    return { ...o, afstandKm: r.afstandKm, reistijdMin: r.reistijdMin, regioKey: r.key };
  }).sort((a, b) => a.afstandKm - b.afstandKm);
}

function credMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.ok };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.info };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.warn };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.bad };
  }
}

function afstandLabel(km: number): string {
  return km === 0 ? "Thuisbasis" : `${km} km`;
}
function reistijdLabel(min: number): string {
  return min === 0 ? "0 min" : `${min} min`;
}

// ── Kaart-primitief — stilistische regio-plattegrond in puur SVG ─────────────────────
function KaartCanvas({
  actief,
  onSelect,
  compact = false,
}: {
  actief: string | null;
  onSelect?: (key: string | null) => void;
  compact?: boolean;
}) {
  const clickable = Boolean(onSelect);
  return (
    <svg
      viewBox="0 0 100 80"
      className="h-full w-full"
      role="img"
      aria-label="Stilistische regiokaart rond de thuisbasis Utrecht"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <pattern id="terr-grid" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M8 0H0V8" fill="none" stroke={C.contour} strokeWidth="0.25" />
        </pattern>
        <radialGradient id="terr-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.accentSoft} stopOpacity="0.9" />
          <stop offset="100%" stopColor={C.accentSoft} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Landbasis + raster */}
      <rect x="0" y="0" width="100" height="80" fill={C.land} />
      <rect x="0" y="0" width="100" height="80" fill="url(#terr-grid)" />

      {/* Water-vlak (stilistisch meer, N.O.) */}
      <path
        d="M56,2 Q78,-2 96,10 Q100,26 88,36 Q70,40 58,28 Q50,14 56,2 Z"
        fill={C.water}
        opacity="0.85"
      />
      {/* Hoogtelijnen / contouren */}
      {[16, 24, 32].map((r) => (
        <circle
          key={r}
          cx={44}
          cy={52}
          r={r}
          fill="none"
          stroke={C.contour}
          strokeWidth="0.4"
          strokeDasharray="1.5 1.8"
        />
      ))}

      {/* Route-lijnen thuisbasis → regio's */}
      {REGIOS.filter((r) => r.key !== "utrecht").map((r) => (
        <line
          key={`route-${r.key}`}
          x1={44}
          y1={52}
          x2={r.x}
          y2={r.y}
          stroke={actief === r.key ? C.route : C.lineStrong}
          strokeWidth={actief === r.key ? 0.9 : 0.5}
          strokeDasharray="1.6 1.4"
          className="terr-route"
        />
      ))}

      {/* Regio-cellen */}
      {REGIOS.map((r) => {
        const on = actief === r.key;
        return (
          <g key={r.key} className={clickable ? "terr-cell cursor-pointer" : "terr-cell"}>
            {clickable && onSelect ? (
              <polygon
                points={r.cel}
                fill={on ? C.accentSoft : "transparent"}
                stroke={on ? C.accent : C.lineStrong}
                strokeWidth={on ? 0.7 : 0.4}
                onClick={() => onSelect(on ? null : r.key)}
                tabIndex={0}
                role="button"
                aria-pressed={on}
                aria-label={`Regio ${r.naam} — ${afstandLabel(r.afstandKm)}, ${reistijdLabel(
                  r.reistijdMin,
                )} reistijd`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(on ? null : r.key);
                  }
                }}
                style={{ transition: "fill 160ms ease, stroke 160ms ease" }}
              />
            ) : (
              <polygon
                points={r.cel}
                fill={on ? C.accentSoft : "transparent"}
                stroke={on ? C.accent : C.lineStrong}
                strokeWidth={on ? 0.7 : 0.4}
              />
            )}
          </g>
        );
      })}

      {/* Knooppunt-markers */}
      {REGIOS.map((r) => {
        const on = actief === r.key;
        const home = r.key === "utrecht";
        return (
          <g key={`pin-${r.key}`} pointerEvents="none">
            {on && <circle cx={r.x} cy={r.y} r="7" fill="url(#terr-glow)" />}
            <circle
              cx={r.x}
              cy={r.y}
              r={home ? 2.4 : 1.9}
              fill={home ? C.accentDeep : on ? C.route : C.panel}
              stroke={home ? C.panel : on ? C.route : C.accent}
              strokeWidth="0.7"
            />
            {home && (
              <circle
                cx={r.x}
                cy={r.y}
                r="3.6"
                fill="none"
                stroke={C.accentDeep}
                strokeWidth="0.4"
                className="terr-ping"
              />
            )}
            {!compact && (
              <text
                x={r.x}
                y={r.y - 3.4}
                textAnchor="middle"
                fontSize="3"
                fontWeight="700"
                fill={on ? C.route : C.ink}
                style={mono}
              >
                {r.naam}
              </text>
            )}
          </g>
        );
      })}

      {/* Kompas */}
      <g transform="translate(90,70)" pointerEvents="none">
        <circle r="5" fill={C.panel} stroke={C.lineStrong} strokeWidth="0.4" />
        <path d="M0,-3.4 L1.1,0 L0,0.6 L-1.1,0 Z" fill={C.route} />
        <path d="M0,3.4 L1.1,0 L0,-0.6 L-1.1,0 Z" fill={C.inkFaint} />
        <text x="0" y="-5.8" textAnchor="middle" fontSize="2.4" fontWeight="700" fill={C.inkSoft}>
          N
        </text>
      </g>
    </svg>
  );
}

// ── Gedeelde primitives ──────────────────────────────────────────────────────────────
function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-xl ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}` }}
    >
      {children}
    </section>
  );
}

function PanelHead({
  children,
  Icon,
  right,
}: {
  children: React.ReactNode;
  Icon?: LucideIcon;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between gap-2 border-b px-4 py-3"
      style={{ borderColor: C.line }}
    >
      <div className="flex min-w-0 items-center gap-2">
        {Icon && <Icon size={15} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />}
        <h2
          className="truncate text-[13.5px] font-semibold tracking-[-0.01em]"
          style={{ color: C.ink }}
        >
          {children}
        </h2>
      </div>
      {right}
    </div>
  );
}

function StatusChip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: `${m.tone}16`, color: m.tone, border: `1px solid ${m.tone}3a` }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function AfstandChip({ km, min }: { km: number; min: number }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums"
      style={{ ...mono, background: C.routeSoft, color: C.route, border: `1px solid ${C.route}33` }}
    >
      <Navigation size={11} strokeWidth={2.4} aria-hidden="true" />
      {afstandLabel(km)}
      <span style={{ color: C.warn }}>·</span>
      <Timer size={11} strokeWidth={2.4} aria-hidden="true" />
      {reistijdLabel(min)}
    </span>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 24 - ((v - min) / span) * 22 - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="h-7 w-full" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={tone}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────────
export function Concept545() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [regio, setRegio] = useState<string | null>(null);
  const opdrachten = useMemo(() => geoOpdrachten(), []);
  const active = opdrachten[0]!;

  return (
    <div
      className="min-h-screen w-full antialiased"
      style={{ ...ui, background: C.bg, color: C.ink }}
    >
      <style>{`
        @keyframes terrPing { 0% { opacity:0.7; transform-origin:center; } 70%,100% { opacity:0; } }
        .terr-ping { animation: terrPing 2.8s ease-out infinite; transform-box: fill-box; transform-origin: center; }
        @keyframes terrDash { to { stroke-dashoffset: -6; } }
        .terr-route { animation: terrDash 2.4s linear infinite; }
        .terr-cell:hover polygon { fill: ${C.accentSoft}; }
        @media (prefers-reduced-motion: reduce) {
          .terr-ping, .terr-route { animation: none !important; }
        }
      `}</style>

      <header
        className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 md:px-6"
        style={{
          background: "rgba(238,241,234,0.9)",
          borderBottom: `1px solid ${C.lineStrong}`,
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ background: C.accentSoft, border: `1px solid ${C.accent}` }}
            aria-hidden="true"
          >
            <Compass size={18} strokeWidth={2} style={{ color: C.accentDeep }} />
          </span>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-[-0.01em]">Terrein</div>
            <div
              className="flex items-center gap-1 text-[10px] font-medium"
              style={{ ...mono, color: C.inkFaint }}
            >
              <Locate size={10} aria-hidden="true" /> Thuisbasis · {HOME}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
            style={{
              background: C.accentSoft,
              color: C.accentDeep,
              border: `1px solid ${C.accent}33`,
            }}
          >
            <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold"
            style={{ background: C.accentDeep, color: "#fff" }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      <nav
        className="flex items-center gap-1 overflow-x-auto px-4 py-2 md:px-6"
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
              className="shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{
                color: on ? "#fff" : C.inkSoft,
                background: on ? C.accent : "transparent",
                outlineColor: C.accent,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </nav>

      <main className="px-4 py-5 md:px-6 md:py-6">
        {screen === "dashboard" && (
          <Dashboard
            opdrachten={opdrachten}
            regio={regio}
            setRegio={setRegio}
            onOpen={() => setScreen("opdracht")}
            onMarkt={() => setScreen("marktplaats")}
            onQueue={() => setScreen("verificatie")}
          />
        )}
        {screen === "marktplaats" && (
          <Marktplaats
            opdrachten={opdrachten}
            regio={regio}
            setRegio={setRegio}
            onOpen={() => setScreen("opdracht")}
          />
        )}
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

// ── Dashboard ────────────────────────────────────────────────────────────────────────
function Dashboard({
  opdrachten,
  regio,
  setRegio,
  onOpen,
  onMarkt,
  onQueue,
}: {
  opdrachten: GeoOpdracht[];
  regio: string | null;
  setRegio: (k: string | null) => void;
  onOpen: () => void;
  onMarkt: () => void;
  onQueue: () => void;
}) {
  const zichtbaar = regio ? opdrachten.filter((o) => o.regioKey === regio) : opdrachten;
  const regioNaam = regio ? REGIOS.find((r) => r.key === regio)?.naam : null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        {/* Kaart-hero */}
        <Panel className="overflow-hidden xl:col-span-3">
          <PanelHead
            Icon={Layers}
            right={
              regio ? (
                <button
                  onClick={() => setRegio(null)}
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={{ background: C.routeSoft, color: C.route, outlineColor: C.route }}
                >
                  {"Alle regio's"}
                </button>
              ) : (
                <span className="text-[11px] font-medium" style={{ color: C.inkFaint }}>
                  Klik een regio om te filteren
                </span>
              )
            }
          >
            Terreinoverzicht
          </PanelHead>
          <div
            className="relative aspect-[5/4] w-full sm:aspect-[16/9]"
            style={{ background: C.land }}
          >
            <KaartCanvas actief={regio} onSelect={setRegio} />
          </div>
          <div className="flex flex-wrap gap-2 border-t px-4 py-3" style={{ borderColor: C.line }}>
            {REGIOS.map((r) => {
              const on = r.key === regio;
              const n = opdrachten.filter((o) => o.regioKey === r.key).length;
              return (
                <button
                  key={r.key}
                  onClick={() => setRegio(on ? null : r.key)}
                  aria-pressed={on}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={{
                    background: on ? C.accent : C.land,
                    color: on ? "#fff" : C.inkSoft,
                    border: `1px solid ${on ? C.accent : C.line}`,
                    outlineColor: C.accent,
                  }}
                >
                  <MapPin size={12} aria-hidden="true" />
                  {r.naam}
                  <span
                    className="rounded-full px-1.5 text-[10px] tabular-nums"
                    style={{
                      background: on ? "rgba(255,255,255,0.25)" : C.panel,
                      color: on ? "#fff" : C.inkFaint,
                    }}
                  >
                    {n}
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>

        {/* Nabije opdrachten, gesorteerd op afstand */}
        <Panel className="xl:col-span-2">
          <PanelHead
            Icon={Route}
            right={
              <button
                onClick={onMarkt}
                className="text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={{ color: C.accent, outlineColor: C.accent }}
              >
                Marktplaats
              </button>
            }
          >
            {regioNaam ? `In de buurt · ${regioNaam}` : "Dichtstbij eerst"}
          </PanelHead>
          {zichtbaar.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <MapPin size={22} style={{ color: C.inkFaint }} aria-hidden="true" />
              <p className="text-[13px] font-semibold">Geen opdrachten in {regioNaam}</p>
              <button
                onClick={() => setRegio(null)}
                className="text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={{ color: C.accent, outlineColor: C.accent }}
              >
                {"Toon alle regio's"}
              </button>
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: C.line }}>
              {zichtbaar.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={onOpen}
                    className="w-full px-4 py-3 text-left transition-colors hover:bg-[#f4f6ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{ outlineColor: C.accent }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13.5px] font-semibold">{o.titel}</span>
                      <span
                        className="shrink-0 text-[13px] font-bold tabular-nums"
                        style={{ ...mono, color: C.accent }}
                      >
                        {o.match}%
                      </span>
                    </div>
                    <div
                      className="mt-1 flex items-center gap-2 text-[11.5px]"
                      style={{ color: C.inkFaint }}
                    >
                      <MapPin size={12} aria-hidden="true" /> {o.plaats}
                    </div>
                    <div className="mt-2">
                      <AfstandChip km={o.afstandKm} min={o.reistijdMin} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* KPI-strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.04em]"
                style={{ color: C.inkFaint }}
              >
                {k.label}
              </span>
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ color: k.up ? C.ok : C.warn }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
            </div>
            <div
              className="mt-1 text-[24px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
              style={mono}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} tone={k.up ? C.accent : C.warn} />
            </div>
          </Panel>
        ))}
      </div>

      {/* Prioriteitsactie */}
      <Panel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${C.warn}18` }}
            aria-hidden="true"
          >
            <AlertTriangle size={17} style={{ color: C.warn }} />
          </span>
          <div>
            <h3 className="text-[14.5px] font-semibold">{ACTIES[0]!.titel}</h3>
            <p className="mt-0.5 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {ACTIES[0]!.detail}
            </p>
          </div>
        </div>
        <button
          onClick={onQueue}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ background: C.accent, outlineColor: C.accent }}
        >
          {ACTIES[0]!.cta} <ArrowRight size={15} aria-hidden="true" />
        </button>
      </Panel>
    </div>
  );
}

// ── Marktplaats — kaart + filterbare lijst met loading/empty/error ────────────────────
type Laadstatus = "gereed" | "laden" | "fout";

function Marktplaats({
  opdrachten,
  regio,
  setRegio,
  onOpen,
}: {
  opdrachten: GeoOpdracht[];
  regio: string | null;
  setRegio: (k: string | null) => void;
  onOpen: () => void;
}) {
  const [q, setQ] = useState("");
  const [maxAfstand, setMaxAfstand] = useState(40);
  const [laad, setLaad] = useState<Laadstatus>("gereed");

  const filtered = useMemo(() => {
    return opdrachten.filter((o) => {
      const inRegio = !regio || o.regioKey === regio;
      const binnenAfstand = o.afstandKm <= maxAfstand;
      const t = q.toLowerCase();
      const zoek =
        !t ||
        o.titel.toLowerCase().includes(t) ||
        o.plaats.toLowerCase().includes(t) ||
        o.opdrachtgever.toLowerCase().includes(t);
      return inRegio && binnenAfstand && zoek;
    });
  }, [opdrachten, regio, maxAfstand, q]);

  const regioNaam = regio ? REGIOS.find((r) => r.key === regio)?.naam : null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Kaart-paneel */}
        <Panel className="overflow-hidden lg:sticky lg:top-24 lg:self-start">
          <PanelHead Icon={Compass}>Kaartfilter</PanelHead>
          <div className="relative aspect-square w-full" style={{ background: C.land }}>
            <KaartCanvas actief={regio} onSelect={setRegio} compact />
          </div>
          <div className="space-y-3 border-t px-4 py-3" style={{ borderColor: C.line }}>
            <label className="block">
              <span
                className="flex items-center justify-between text-[11.5px] font-semibold"
                style={{ color: C.inkSoft }}
              >
                <span>Maximale reisafstand</span>
                <span className="tabular-nums" style={{ ...mono, color: C.route }}>
                  {maxAfstand} km
                </span>
              </span>
              <input
                type="range"
                min={0}
                max={40}
                step={1}
                value={maxAfstand}
                onChange={(e) => setMaxAfstand(Number(e.target.value))}
                aria-label="Maximale reisafstand in kilometer"
                className="mt-2 w-full accent-[#3f6f4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={{ outlineColor: C.accent }}
              />
            </label>
            {regio && (
              <button
                onClick={() => setRegio(null)}
                className="w-full rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={{ background: C.routeSoft, color: C.route, outlineColor: C.route }}
              >
                Regiofilter wissen · {regioNaam}
              </button>
            )}
          </div>
        </Panel>

        {/* Lijst */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[16px] font-semibold tracking-[-0.01em]">Opdrachten dichtbij</h2>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: C.panel, border: `1px solid ${C.line}` }}
              >
                <Search size={15} style={{ color: C.inkFaint }} aria-hidden="true" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Zoek op titel of plaats…"
                  aria-label="Opdrachten zoeken"
                  className="w-40 bg-transparent text-[13px] outline-none placeholder:opacity-60"
                  style={{ color: C.ink }}
                />
              </div>
            </div>
          </div>

          {/* Demo-status-schakelaar voor laad-/foutstaten */}
          <div className="flex items-center gap-1.5" role="group" aria-label="Weergavestatus">
            {(["gereed", "laden", "fout"] as Laadstatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setLaad(s)}
                aria-pressed={laad === s}
                className="rounded-full px-3 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={{
                  background: laad === s ? C.ink : C.panel,
                  color: laad === s ? "#fff" : C.inkSoft,
                  border: `1px solid ${laad === s ? C.ink : C.line}`,
                  outlineColor: C.accent,
                }}
              >
                {s === "gereed" ? "Resultaten" : s === "laden" ? "Laden" : "Fout"}
              </button>
            ))}
          </div>

          {laad === "laden" ? (
            <div className="space-y-3" aria-busy="true" aria-live="polite">
              {[0, 1, 2].map((i) => (
                <Panel key={i} className="p-4">
                  <div
                    className="flex items-center gap-2 text-[12px] font-semibold"
                    style={{ color: C.inkFaint }}
                  >
                    <RefreshCw
                      size={14}
                      className="terr-route"
                      style={{ animation: "spin 1s linear infinite" }}
                      aria-hidden="true"
                    />
                    Terrein in kaart brengen…
                  </div>
                  <div className="mt-3 h-3 w-2/3 rounded" style={{ background: C.line }} />
                  <div className="mt-2 h-3 w-1/3 rounded" style={{ background: C.line }} />
                </Panel>
              ))}
              <style>{`@keyframes spin { to { transform: rotate(360deg); } } @media (prefers-reduced-motion: reduce) { .terr-route { animation: none !important; } }`}</style>
            </div>
          ) : laad === "fout" ? (
            <Panel className="flex flex-col items-center gap-3 p-12 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: `${C.bad}14`, color: C.bad }}
                aria-hidden="true"
              >
                <ServerCrash size={24} />
              </span>
              <p className="text-[14px] font-semibold">Kaartgegevens niet geladen</p>
              <p className="max-w-xs text-[12.5px]" style={{ color: C.inkSoft }}>
                We konden de terreinlaag niet ophalen. Controleer je verbinding en probeer opnieuw.
              </p>
              <button
                onClick={() => setLaad("gereed")}
                className="mt-1 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={{ background: C.accent, outlineColor: C.accent }}
              >
                <RefreshCw size={14} aria-hidden="true" /> Opnieuw laden
              </button>
            </Panel>
          ) : filtered.length === 0 ? (
            <Panel className="flex flex-col items-center gap-3 p-12 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: C.land, color: C.inkFaint }}
                aria-hidden="true"
              >
                <Search size={22} />
              </span>
              <p className="text-[14px] font-semibold">Geen opdrachten binnen bereik</p>
              <p className="max-w-xs text-[12.5px]" style={{ color: C.inkSoft }}>
                {q ? `Geen resultaat voor “${q}”.` : "Geen opdrachten binnen deze reisafstand."}{" "}
                Verruim je afstand of wis de filters.
              </p>
              <button
                onClick={() => {
                  setQ("");
                  setMaxAfstand(40);
                  setRegio(null);
                }}
                className="mt-1 rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={{ background: C.accent, outlineColor: C.accent }}
              >
                Filters wissen
              </button>
            </Panel>
          ) : (
            <ul className="space-y-3">
              {filtered.map((o) => (
                <li key={o.id}>
                  <Panel className="p-4 transition-shadow hover:shadow-[0_2px_16px_rgba(28,36,25,0.08)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.01em]">
                          {o.titel}
                        </h3>
                        <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
                          {o.opdrachtgever} · {o.plaats}
                        </p>
                      </div>
                      <span
                        className="shrink-0 rounded-lg px-2.5 py-1 text-[13px] font-bold tabular-nums"
                        style={{ ...mono, background: C.accentSoft, color: C.accentDeep }}
                      >
                        {o.match}%
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <AfstandChip km={o.afstandKm} min={o.reistijdMin} />
                      {o.tags.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                          style={{
                            background: C.land,
                            color: C.inkSoft,
                            border: `1px solid ${C.line}`,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <div
                      className="mt-3 flex items-center justify-between gap-3 border-t pt-3"
                      style={{ borderColor: C.line }}
                    >
                      <span
                        className="text-[13px] font-semibold tabular-nums"
                        style={{ color: C.ink }}
                      >
                        {o.tarief}
                      </span>
                      <button
                        onClick={onOpen}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-semibold text-white transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                        style={{ background: C.accent, outlineColor: C.accent }}
                      >
                        Route bekijken <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </Panel>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Opdracht-detail met route/reis-paneel ─────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: GeoOpdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12.5px] font-semibold transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{ color: C.inkSoft, outlineColor: C.accent }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Panel className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  {opdracht.id}
                </span>
                <h1 className="mt-1 text-[24px] font-semibold leading-tight tracking-[-0.02em] sm:text-[27px]">
                  {opdracht.titel}
                </h1>
                <p className="mt-1 text-[13px]" style={{ color: C.inkSoft }}>
                  {opdracht.opdrachtgever} · {opdracht.plaats}
                </p>
              </div>
              <div
                className="rounded-xl px-4 py-3 text-center"
                style={{ background: C.accentSoft }}
              >
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: C.accentDeep }}
                >
                  Match
                </div>
                <div
                  className="text-[28px] font-bold tabular-nums leading-none"
                  style={{ ...mono, color: C.accentDeep }}
                >
                  {opdracht.match}%
                </div>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {feiten.map((f) => (
                <div
                  key={f.l}
                  className="rounded-lg p-3"
                  style={{ background: C.land, border: `1px solid ${C.line}` }}
                >
                  <f.Icon size={14} style={{ color: C.accent }} aria-hidden="true" />
                  <dd
                    className="mt-2 text-[14px] font-semibold tabular-nums leading-none"
                    style={mono}
                  >
                    {f.v}
                  </dd>
                  <dt
                    className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                    style={{ color: C.inkFaint }}
                  >
                    {f.l}
                  </dt>
                </div>
              ))}
            </dl>
          </Panel>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Panel>
              <PanelHead Icon={Check}>Waarom passend</PanelHead>
              <ul className="space-y-2.5 p-4">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2.5 text-[13px] leading-snug"
                    style={{ color: C.inkSoft }}
                  >
                    <Check
                      size={15}
                      strokeWidth={2.6}
                      className="mt-0.5 shrink-0"
                      style={{ color: C.ok }}
                      aria-hidden="true"
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel>
              <PanelHead Icon={AlertTriangle}>Aandachtspunten</PanelHead>
              <ul className="space-y-2.5 p-4">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2.5 text-[13px] leading-snug"
                    style={{ color: C.inkSoft }}
                  >
                    <AlertTriangle
                      size={14}
                      strokeWidth={2.6}
                      className="mt-0.5 shrink-0"
                      style={{ color: C.warn }}
                      aria-hidden="true"
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 text-[13.5px] font-semibold text-white transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{ background: C.accent, outlineColor: C.accent }}
            >
              Reageren op opdracht <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{
                background: C.panel,
                color: C.ink,
                border: `1px solid ${C.lineStrong}`,
                outlineColor: C.accent,
              }}
            >
              Bewaren
            </button>
          </div>
        </div>

        {/* Reis-paneel */}
        <Panel className="overflow-hidden lg:sticky lg:top-24 lg:self-start">
          <PanelHead Icon={Route}>Route &amp; reistijd</PanelHead>
          <div className="relative aspect-square w-full" style={{ background: C.land }}>
            <KaartCanvas actief={opdracht.regioKey} compact />
          </div>
          <div className="space-y-3 border-t p-4" style={{ borderColor: C.line }}>
            <div className="flex items-center justify-between">
              <span
                className="flex items-center gap-2 text-[12px] font-semibold"
                style={{ color: C.inkSoft }}
              >
                <Navigation size={14} style={{ color: C.route }} aria-hidden="true" /> Afstand
              </span>
              <span
                className="text-[14px] font-bold tabular-nums"
                style={{ ...mono, color: C.ink }}
              >
                {afstandLabel(opdracht.afstandKm)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span
                className="flex items-center gap-2 text-[12px] font-semibold"
                style={{ color: C.inkSoft }}
              >
                <Timer size={14} style={{ color: C.route }} aria-hidden="true" /> Reistijd (auto)
              </span>
              <span
                className="text-[14px] font-bold tabular-nums"
                style={{ ...mono, color: C.ink }}
              >
                {reistijdLabel(opdracht.reistijdMin)}
              </span>
            </div>
            <div
              className="flex items-center justify-between border-t pt-3"
              style={{ borderColor: C.line }}
            >
              <span
                className="flex items-center gap-2 text-[12px] font-semibold"
                style={{ color: C.inkSoft }}
              >
                <Locate size={14} style={{ color: C.accent }} aria-hidden="true" /> Vanaf
              </span>
              <span className="text-[13px] font-semibold" style={{ color: C.ink }}>
                {HOME}
              </span>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ── Verificatie ────────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} style={{ color: C.accent }} aria-hidden="true" />
          <h2 className="text-[16px] font-semibold tracking-[-0.01em]">
            Verificatie &amp; certificaten
          </h2>
        </div>
        <span
          className="rounded-full px-3 py-1.5 text-[12px] font-semibold tabular-nums"
          style={{ background: C.accentSoft, color: C.accentDeep }}
        >
          {pct}% geverifieerd
        </span>
      </div>
      <Panel>
        <PanelHead Icon={ShieldCheck}>Jouw dossier</PanelHead>
        <ul className="divide-y" style={{ borderColor: C.line }}>
          {CREDENTIALS.map((c) => {
            const actionable = c.status !== "VERIFIED";
            return (
              <li
                key={c.naam}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
              >
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold">{c.naam}</div>
                  <div className="text-[11.5px]" style={{ color: C.inkFaint }}>
                    {c.detail}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip status={c.status} />
                  <button
                    disabled={!actionable}
                    className="rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      background: actionable ? C.accent : C.land,
                      color: actionable ? "#fff" : C.inkFaint,
                      border: `1px solid ${actionable ? C.accent : C.line}`,
                      outlineColor: C.accent,
                    }}
                  >
                    {actionable ? "Behandelen" : "Afgehandeld"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

// ── Acties ───────────────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Navigation size={18} style={{ color: C.accent }} aria-hidden="true" />
        <h2 className="text-[16px] font-semibold tracking-[-0.01em]">Volgende beste acties</h2>
      </div>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const tone = a.urgentie === "warning" ? C.warn : C.info;
          return (
            <li key={a.titel}>
              <Panel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-bold tabular-nums"
                  style={{
                    ...mono,
                    background: C.land,
                    color: C.accent,
                    border: `1px solid ${C.line}`,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em]"
                      style={{
                        background: `${tone}18`,
                        color: tone,
                        border: `1px solid ${tone}3a`,
                      }}
                    >
                      {a.urgentie === "warning" ? (
                        <AlertTriangle size={11} aria-hidden="true" />
                      ) : (
                        <Compass size={11} aria-hidden="true" />
                      )}
                      {a.urgentie === "warning" ? "Urgent" : "Kans"}
                    </span>
                    <h3 className="text-[14.5px] font-semibold">{a.titel}</h3>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 sm:self-center"
                  style={{ background: C.accent, outlineColor: C.accent }}
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

// ── Facturen ───────────────────────────────────────────────────────────────────────
function Facturen() {
  const tone = (s: string): string =>
    s === "Betaald" ? C.ok : s === "Openstaand" ? C.warn : C.inkFaint;
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Coins size={18} style={{ color: C.accent }} aria-hidden="true" />
          <h2 className="text-[16px] font-semibold tracking-[-0.01em]">Facturen</h2>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ background: C.accent, outlineColor: C.accent }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: "€ 8.622", t: C.ok },
          { l: "Openstaand", v: `${open}`, t: C.warn },
          {
            l: "Concept",
            v: `${FACTUREN.filter((f) => f.status === "Concept").length}`,
            t: C.inkFaint,
          },
        ].map((s) => (
          <Panel key={s.l} className="p-4">
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.04em]"
              style={{ color: C.inkFaint }}
            >
              {s.l}
            </span>
            <div
              className="mt-1 text-[22px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: s.t }}
            >
              {s.v}
            </div>
          </Panel>
        ))}
      </div>
      <Panel>
        <PanelHead Icon={Coins}>Overzicht</PanelHead>
        <ul className="divide-y" style={{ borderColor: C.line }}>
          {FACTUREN.map((f) => (
            <li
              key={f.nr}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5"
            >
              <div className="min-w-0">
                <span
                  className="text-[11.5px] font-bold tabular-nums"
                  style={{ ...mono, color: C.inkSoft }}
                >
                  {f.nr}
                </span>
                <span className="ml-2 text-[13px] font-medium">{f.klant}</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    background: `${tone(f.status)}16`,
                    color: tone(f.status),
                    border: `1px solid ${tone(f.status)}3a`,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: tone(f.status) }}
                    aria-hidden="true"
                  />
                  {f.status}
                </span>
                <span
                  className="w-12 text-right text-[11px] tabular-nums"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  {f.datum}
                </span>
                <span
                  className="w-20 text-right text-[14px] font-semibold tabular-nums"
                  style={mono}
                >
                  {f.bedrag}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
