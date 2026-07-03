"use client";

// Concept 47 — "Ruimte" · Spatial depth / visionOS-grade vibrancy (DONKER).
// Gelaagde translucente glaspanelen zweven op geordende z-dieptes boven een diepe, dimensionale
// achtergrond. Diepte ontstaat door schaal + blur + gelaagde schaduwen: ambient orbs ver weg,
// content in het midden, een command-card die naar de kijker toe komt bij hover. Vibrancy: content
// tint zijn eigen glas; zachte speculaire lichtrand. Legibiliteit staat altijd voorop — de glans
// verbergt nooit de data. Duidelijk onderscheidend van het lichte glasmorfisme-concept: dit is
// DONKER, ruimtelijk, gelaagd, met echte diepte-ordening.
// Palet: ruimte-bg #0e1220→#141a2e, glas rgba(255,255,255,0.06), hairline rgba(255,255,255,0.12),
// ink #eef1f8, muted #9aa3bd, sky #64d2ff, violet #a78bfa.
// Fonts: Geist (--font-lab-geist) + Geist Mono (--font-lab-geist-mono).

import { useState } from "react";
import {
  LayoutDashboard,
  Compass,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Bell,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  MapPin,
  Plus,
  FileText,
  Send,
  Loader2,
  Sparkles,
  Layers,
  Orbit,
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
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  bg0: "#0e1220",
  bg1: "#141a2e",
  ink: "#eef1f8",
  inkSoft: "#c5cbe0",
  muted: "#9aa3bd",
  faint: "#6c7590",
  sky: "#64d2ff",
  skyDeep: "#3aa8e0",
  violet: "#a78bfa",
  violetDeep: "#8b6ff0",
  green: "#4ade80",
  greenDeep: "#34c76a",
  amber: "#fbbf5c",
  amberDeep: "#e9a23c",
  rose: "#fb7d9a",
  roseDeep: "#f2607f",
  hairline: "rgba(255,255,255,0.12)",
  hairlineSoft: "rgba(255,255,255,0.07)",
  glass: "rgba(255,255,255,0.06)",
  glassHi: "rgba(255,255,255,0.09)",
  glassLo: "rgba(255,255,255,0.035)",
};

const display = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

// Gelaagde glas-oppervlakken op geordende z-dieptes. Elke laag heeft een eigen combinatie van
// blur, opaciteit en schaduw zodat de hiërarchie ruimtelijk voelt.
const PANE_BG = {
  background: `linear-gradient(160deg, ${C.glassHi}, ${C.glassLo})`,
  border: `1px solid ${C.hairline}`,
  boxShadow:
    "0 24px 60px -30px rgba(0,0,0,0.7), 0 2px 8px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.10)",
};
const PANE_SOFT = {
  background: `linear-gradient(160deg, ${C.glass}, ${C.glassLo})`,
  border: `1px solid ${C.hairlineSoft}`,
  boxShadow: "0 16px 40px -28px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.07)",
};
// Voorgrond-command-card: komt het dichtst bij de kijker.
const PANE_FRONT = {
  background: `linear-gradient(155deg, rgba(255,255,255,0.12), rgba(255,255,255,0.045))`,
  border: `1px solid rgba(255,255,255,0.18)`,
  boxShadow:
    "0 40px 90px -36px rgba(0,0,0,0.85), 0 8px 24px -10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.22)",
};

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Compass,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

function statusStyle(s: CredStatus): {
  label: string;
  fg: string;
  glow: string;
  Icon: LucideIcon;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.green, glow: "rgba(74,222,128,0.16)", Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.sky, glow: "rgba(100,210,255,0.16)", Icon: Clock };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        fg: C.amber,
        glow: "rgba(251,191,92,0.18)",
        Icon: AlertTriangle,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        fg: C.rose,
        glow: "rgba(251,125,154,0.18)",
        Icon: AlertTriangle,
      };
  }
}

/* ---------- Ruimtelijke bouwstenen ---------- */

// Glaspaneel met keuze uit drie z-dieptes. `lift` geeft een hover-tilt naar de kijker toe.
function Pane({
  children,
  className = "",
  depth = "mid",
  lift = false,
  tint,
}: {
  children: React.ReactNode;
  className?: string;
  depth?: "front" | "mid" | "back";
  lift?: boolean;
  tint?: string;
}) {
  const base = depth === "front" ? PANE_FRONT : depth === "back" ? PANE_SOFT : PANE_BG;
  return (
    <div
      className={`relative overflow-hidden rounded-3xl backdrop-blur-2xl ${
        lift ? "transition-transform duration-300 will-change-transform hover:-translate-y-1.5" : ""
      } ${className}`}
      style={base}
    >
      {tint && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(120% 80% at 12% -20%, ${tint}, transparent 60%)`,
          }}
          aria-hidden="true"
        />
      )}
      {/* speculaire lichtrand bovenaan */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
        }}
        aria-hidden="true"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function Kicker({ children, color = C.sky }: { children: React.ReactNode; color?: string }) {
  return (
    <p
      className="text-[10.5px] font-semibold uppercase tracking-[0.28em]"
      style={{ color, ...mono }}
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
        className="mt-3 text-[27px] font-semibold leading-tight tracking-tight sm:text-[31px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {note && (
        <p
          className="mt-2.5 max-w-2xl text-[13.5px] leading-relaxed"
          style={{ color: C.muted, ...display }}
        >
          {note}
        </p>
      )}
    </div>
  );
}

// Sparkline met zachte glow — de lijn tint zijn eigen ruimte.
function Sparkline({ data, color = C.sky }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 108;
  const h = 32;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 6) - 3;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const gid = `rk${color.replace("#", "")}`;
  const last = pts[pts.length - 1] as readonly [number, number];
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.34} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r={2.4}
        fill={color}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}

// Match-ring als een gloeiende orbit.
function MatchRing({ value, size = 44 }: { value: number; size?: number }) {
  const r = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  const gid = `ro${value}-${size}`;
  const c = size / 2;
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={C.sky} />
            <stop offset="100%" stopColor={C.violet} />
          </linearGradient>
        </defs>
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={3} />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          style={{ filter: "drop-shadow(0 0 5px rgba(100,210,255,0.55))" }}
        />
      </svg>
      <span
        className="absolute text-[11px] font-semibold tabular-nums"
        style={{ color: C.ink, ...mono }}
      >
        {value}
      </span>
    </span>
  );
}

// Zwevende ambient orb, ver weg op de achtergrond (z-diepte).
function Orb({ className, color, size }: { className: string; color: string; size: number }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${color}, transparent 70%)`,
        filter: "blur(60px)",
        opacity: 0.55,
      }}
      aria-hidden="true"
    />
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept47() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]!.id);
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id: string) => {
    setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{
        ...display,
        color: C.ink,
        background: `radial-gradient(140% 100% at 20% -10%, ${C.bg1}, ${C.bg0} 60%)`,
      }}
    >
      {/* Ambient dieptelaag — orbs ver op de achtergrond */}
      <Orb className="-left-20 -top-24" color="rgba(100,210,255,0.5)" size={360} />
      <Orb className="right-[-60px] top-1/3" color="rgba(167,139,250,0.42)" size={420} />
      <Orb className="bottom-[-80px] left-1/3" color="rgba(74,222,128,0.22)" size={340} />
      {/* fijne sterrenstof / grid, subtiel */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 70% 60%, rgba(255,255,255,0.4), transparent), radial-gradient(1px 1px at 45% 80%, rgba(255,255,255,0.35), transparent), radial-gradient(1px 1px at 85% 20%, rgba(255,255,255,0.4), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="relative flex min-h-[680px]">
        {/* Zijbalk — zwevend glas */}
        <aside className="hidden w-[236px] shrink-0 flex-col p-4 md:flex">
          <div className="flex items-center gap-3 px-2 pb-7 pt-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-2xl text-[14px] font-bold"
              style={{
                background: `linear-gradient(150deg, ${C.sky}, ${C.violet})`,
                color: "#0b0f1c",
                boxShadow: "0 12px 28px -8px rgba(100,210,255,0.6)",
                ...display,
              }}
            >
              <Orbit size={17} strokeWidth={2.4} />
            </div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold tracking-tight">Ruimte</div>
              <div className="text-[10.5px]" style={{ color: C.faint }}>
                ZZP Platform
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64d2ff]"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on
                      ? "linear-gradient(150deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05))"
                      : "transparent",
                    border: `1px solid ${on ? "rgba(255,255,255,0.16)" : "transparent"}`,
                    boxShadow: on
                      ? "0 14px 30px -18px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.14)"
                      : "none",
                  }}
                >
                  <Icon size={17} aria-hidden="true" style={{ color: on ? C.sky : C.faint }} />
                  <span className="flex-1 font-medium">{s.label}</span>
                  {on && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        background: C.sky,
                        boxShadow: `0 0 8px ${C.sky}`,
                      }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <Pane depth="front" className="p-3.5" tint="rgba(100,210,255,0.14)">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold"
                  style={{
                    background: `linear-gradient(150deg, ${C.sky}, ${C.violet})`,
                    color: "#0b0f1c",
                    ...display,
                  }}
                >
                  {PROFIEL.initialen}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</div>
                  <div className="flex items-center gap-1 text-[11px]" style={{ color: C.green }}>
                    <ShieldCheck size={10} aria-hidden="true" /> {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </Pane>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center gap-3 px-5 sm:px-7">
            <div className="flex items-center gap-2">
              <Layers size={15} aria-hidden="true" style={{ color: C.violet }} />
              <h2 className="truncate text-[15px] font-semibold tracking-tight">
                {SCREENS.find((s) => s.key === screen)?.label}
              </h2>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="hidden items-center gap-2.5 rounded-full px-3.5 py-2 text-[12.5px] backdrop-blur-xl transition-all hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64d2ff] sm:flex"
                style={{
                  border: `1px solid ${C.hairline}`,
                  color: C.muted,
                  background: C.glass,
                }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoek in de ruimte…</span>
              </button>
              <button
                className="relative rounded-full p-2.5 backdrop-blur-xl transition-all hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64d2ff]"
                style={{
                  border: `1px solid ${C.hairline}`,
                  color: C.inkSoft,
                  background: C.glass,
                }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.sky, boxShadow: `0 0 6px ${C.sky}` }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div className="flex gap-1.5 overflow-x-auto px-4 pb-1 md:hidden">
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64d2ff]"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? "rgba(255,255,255,0.10)" : "transparent",
                    border: `1px solid ${on ? C.hairline : "transparent"}`,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {screen === "dashboard" && <Dashboard onOpen={open} />}
            {screen === "marktplaats" && <Marktplaats onOpen={open} activeId={activeId} />}
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

/* ---------- Dashboard ---------- */

function Dashboard({ onOpen }: { onOpen: (id: string) => void }) {
  const kpiColors = [C.sky, C.violet, C.green, C.amber];
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Voorgrond command-card — komt naar de kijker toe */}
      <Pane depth="front" className="p-7" tint="rgba(167,139,250,0.18)">
        <div
          className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full"
          style={{
            background: `radial-gradient(circle, ${C.sky}, transparent 66%)`,
            filter: "blur(46px)",
            opacity: 0.4,
          }}
          aria-hidden="true"
        />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Zap size={14} aria-hidden="true" style={{ color: C.sky }} />
            <Kicker>Vandaag · {PROFIEL.plaats}</Kicker>
          </div>
          <h1 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-tight">
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-2.5 max-w-lg text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Drie nieuwe matches boven de 80 procent zweven binnen bereik en je vertrouwensniveau is
            hoog. Eén certificaat vraagt binnenkort aandacht.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5 text-[12px]">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium backdrop-blur-xl"
              style={{
                color: C.green,
                background: "rgba(74,222,128,0.12)",
                border: "1px solid rgba(74,222,128,0.28)",
              }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> 2 certificaten geverifieerd
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium backdrop-blur-xl"
              style={{
                color: C.amber,
                background: "rgba(251,191,92,0.12)",
                border: "1px solid rgba(251,191,92,0.28)",
              }}
            >
              <Clock size={13} aria-hidden="true" /> VOG verloopt over 23 dagen
            </span>
          </div>
        </div>
      </Pane>

      {/* KPI's */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const col = kpiColors[i % kpiColors.length] ?? C.sky;
          return (
            <Pane key={k.label} className="p-4" lift tint={`${col}22`}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium" style={{ color: C.muted }}>
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.green : C.amber, ...mono }}
                >
                  {k.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
              </div>
              <p
                className="mt-2.5 text-[25px] font-semibold tabular-nums leading-none tracking-tight"
                style={mono}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <Sparkline data={k.spark} color={col} />
              </div>
            </Pane>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[14px] font-semibold tracking-tight">
                <Sparkles size={15} aria-hidden="true" style={{ color: C.sky }} /> Beste matches
              </h2>
              <span className="text-[11.5px]" style={{ color: C.muted }}>
                Verklaarbaar gesorteerd
              </span>
            </div>
            <Pane>
              <div>
                {OPDRACHTEN.map((o, i) => (
                  <button
                    key={o.id}
                    onClick={() => onOpen(o.id)}
                    className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#64d2ff]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairlineSoft}` }}
                  >
                    <MatchRing value={o.match} size={42} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium">{o.titel}</p>
                      <p
                        className="mt-0.5 flex items-center gap-1.5 truncate text-[12px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <span
                      className="hidden text-[12.5px] font-medium tabular-nums sm:inline"
                      style={{ color: C.inkSoft, ...mono }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
                  </button>
                ))}
              </div>
            </Pane>
          </div>

          {/* Berichten */}
          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-[14px] font-semibold tracking-tight">Berichten</h2>
              <span className="text-[11.5px]" style={{ color: C.muted }}>
                {ongelezen} ongelezen
              </span>
            </div>
            <Pane depth="back">
              {BERICHTEN.map((b, i) => (
                <div
                  key={b.van}
                  className="flex items-center gap-3.5 px-4 py-3.5"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairlineSoft}` }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                    style={{
                      background: b.ongelezen
                        ? `linear-gradient(150deg, ${C.sky}, ${C.violet})`
                        : "rgba(255,255,255,0.06)",
                      color: b.ongelezen ? "#0b0f1c" : C.muted,
                      ...display,
                    }}
                  >
                    {b.initialen}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-semibold">{b.van}</p>
                      {b.ongelezen && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.sky, boxShadow: `0 0 6px ${C.sky}` }}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <p className="truncate text-[12px]" style={{ color: C.muted }}>
                      {b.preview}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-[11px] tabular-nums"
                    style={{ color: C.faint, ...mono }}
                  >
                    {b.tijd}
                  </span>
                </div>
              ))}
            </Pane>
          </div>
        </div>

        {/* Zijkolom */}
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-[14px] font-semibold tracking-tight">
              <ShieldCheck size={15} aria-hidden="true" style={{ color: C.green }} /> Certificaten
            </h2>
            <Pane className="p-4">
              <div className="space-y-3.5">
                {CREDENTIALS.map((c) => {
                  const st = statusStyle(c.status);
                  return (
                    <div key={c.naam} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={{
                          background: st.glow,
                          border: `1px solid ${st.fg}44`,
                        }}
                        aria-hidden="true"
                      >
                        <st.Icon size={13} style={{ color: st.fg }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-semibold">{c.naam}</p>
                        <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                          {c.detail}
                        </p>
                      </div>
                      <span
                        className="shrink-0 text-[10.5px] font-semibold"
                        style={{ color: st.fg }}
                      >
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Pane>
          </div>

          {/* Aanbevolen actie — gloeiende voorgrond-card */}
          <Pane depth="front" className="p-5" tint="rgba(100,210,255,0.22)">
            <div
              className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full"
              style={{
                background: `radial-gradient(circle, ${C.violet}, transparent 66%)`,
                filter: "blur(28px)",
                opacity: 0.6,
              }}
              aria-hidden="true"
            />
            <div className="relative">
              <Kicker color={C.violet}>Aanbevolen nu</Kicker>
              <p className="mt-2 text-[18px] font-semibold leading-snug">{ACTIES[0]?.titel}</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                {ACTIES[0]?.detail}
              </p>
              <button
                className="mt-4 w-full rounded-full py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64d2ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1220]"
                style={{
                  background: `linear-gradient(150deg, ${C.sky}, ${C.violet})`,
                  color: "#0b0f1c",
                  boxShadow: "0 16px 32px -14px rgba(100,210,255,0.6)",
                }}
              >
                {ACTIES[0]?.cta}
              </button>
            </div>
          </Pane>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({ onOpen, activeId }: { onOpen: (id: string) => void; activeId: string }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <SectionHead
        kicker="Marktplaats"
        title="Open opdrachten"
        note="Elke opdracht zweeft op zijn eigen z-diepte — kom dichterbij om te verkennen."
      />

      <Pane className="flex items-center gap-3 px-4 py-2.5">
        <Search size={16} aria-hidden="true" style={{ color: C.sky }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#6c7590]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Pane>

      {filtered.length === 0 ? (
        <Pane className="px-6 py-16 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: "rgba(100,210,255,0.1)",
              border: "1px solid rgba(100,210,255,0.28)",
            }}
            aria-hidden="true"
          >
            <Search size={22} style={{ color: C.sky }} />
          </div>
          <p className="mt-4 text-[15px] font-semibold">Niets gevonden in de ruimte</p>
          <p className="mx-auto mt-1.5 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen resultaten voor &quot;{q}&quot;. Verbreed je zoekopdracht of pas je beschikbaarheid
            aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64d2ff]"
            style={{
              background: `linear-gradient(150deg, ${C.sky}, ${C.violet})`,
              color: "#0b0f1c",
            }}
          >
            Zoekopdracht wissen
          </button>
        </Pane>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o) => {
            const isActive = o.id === activeId;
            return (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className="group text-left focus-visible:outline-none"
                aria-label={`Open ${o.titel}`}
              >
                <Pane
                  className="h-full p-5"
                  lift
                  depth={isActive ? "front" : "mid"}
                  tint={isActive ? "rgba(167,139,250,0.2)" : undefined}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="text-[10.5px] tracking-wide"
                      style={{ color: C.faint, ...mono }}
                    >
                      {o.id}
                    </span>
                    <MatchRing value={o.match} />
                  </div>
                  <p className="mt-2 text-[15.5px] font-semibold leading-snug">{o.titel}</p>
                  <p
                    className="mt-1.5 flex items-center gap-1.5 text-[12px]"
                    style={{ color: C.muted }}
                  >
                    <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full px-2.5 py-0.5 text-[10.5px] backdrop-blur-xl"
                        style={{
                          color: C.inkSoft,
                          background: "rgba(255,255,255,0.05)",
                          border: `1px solid ${C.hairlineSoft}`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div
                    className="mt-4 flex items-center justify-between border-t pt-3.5 text-[12.5px]"
                    style={{ borderColor: C.hairlineSoft }}
                  >
                    <span className="font-semibold tabular-nums" style={{ color: C.sky, ...mono }}>
                      {o.tarief}
                    </span>
                    <span className="tabular-nums" style={{ color: C.muted, ...mono }}>
                      {o.uren}
                    </span>
                  </div>
                </Pane>
              </button>
            );
          })}
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
    window.setTimeout(() => setState("sent"), 900);
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Pane depth="front" className="p-7" tint="rgba(100,210,255,0.2)">
        <div
          className="pointer-events-none absolute -right-12 -top-14 h-48 w-48 rounded-full"
          style={{
            background: `radial-gradient(circle, ${C.violet}, transparent 66%)`,
            filter: "blur(38px)",
            opacity: 0.5,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Kicker>{opdracht.id}</Kicker>
            <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight">
              {opdracht.titel}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-[13px]" style={{ color: C.inkSoft }}>
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64d2ff] disabled:opacity-90"
            style={{
              background:
                state === "sent"
                  ? `linear-gradient(150deg, ${C.green}, ${C.greenDeep})`
                  : `linear-gradient(150deg, ${C.sky}, ${C.violet})`,
              color: "#0b0f1c",
              boxShadow: "0 16px 34px -14px rgba(100,210,255,0.6)",
            }}
          >
            {state === "sending" && (
              <Loader2 size={15} aria-hidden="true" className="animate-spin" />
            )}
            {state === "sent" && <Check size={15} aria-hidden="true" />}
            {state === "idle" && <Send size={14} aria-hidden="true" />}
            {state === "idle"
              ? "Reageer op opdracht"
              : state === "sending"
                ? "Versturen…"
                : "Reactie verstuurd"}
          </button>
        </div>
      </Pane>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, c: C.sky },
          { l: "Omvang", v: opdracht.uren, c: C.violet },
          { l: "Start", v: opdracht.start, c: C.ink },
          { l: "Match", v: `${opdracht.match}%`, c: C.green },
        ].map((m) => (
          <Pane key={m.l} className="p-4" lift>
            <p
              className="text-[10.5px] font-medium uppercase tracking-[0.12em]"
              style={{ color: C.muted }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[16px] font-semibold tabular-nums tracking-tight"
              style={{ color: m.c, ...mono }}
            >
              {m.v}
            </p>
          </Pane>
        ))}
      </div>

      <Pane className="p-6">
        <h3 className="flex items-center gap-2 text-[14.5px] font-semibold">
          <Sparkles size={15} aria-hidden="true" style={{ color: C.sky }} /> Waarom deze match
        </h3>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je geverifieerde profiel.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.green }}
            >
              Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(74,222,128,0.16)" }}
                    aria-hidden="true"
                  >
                    <Check size={12} style={{ color: C.green }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.amber }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(251,191,92,0.16)" }}
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
      </Pane>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const attention = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHead
        kicker="Vertrouwen"
        title="Verificatie"
        note="Elk certificaat onafhankelijk gecontroleerd — dat geeft opdrachtgevers vertrouwen."
      />

      <Pane depth="front" className="p-6" tint="rgba(74,222,128,0.16)">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: "rgba(74,222,128,0.12)",
              border: "1px solid rgba(74,222,128,0.3)",
              boxShadow: "0 0 30px -6px rgba(74,222,128,0.4)",
            }}
          >
            <ShieldCheck size={30} aria-hidden="true" style={{ color: C.green }} />
          </div>
          <div className="flex-1">
            <p className="text-[18px] font-semibold">{PROFIEL.trust}</p>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
              <span className="font-semibold tabular-nums">{verified}</span> van{" "}
              <span className="font-semibold tabular-nums">{total}</span> certificaten geverifieerd
              · <span style={{ color: C.amber }}>{attention} vraagt actie</span>
            </p>
            <div
              className="mt-3 flex h-2.5 overflow-hidden rounded-full"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div
                    key={c.naam}
                    className="h-full"
                    style={{
                      width: `${100 / total}%`,
                      background: st.fg,
                      opacity: c.status === "VERIFIED" ? 1 : 0.55,
                      boxShadow: `0 0 8px ${st.fg}`,
                    }}
                    aria-hidden="true"
                  />
                );
              })}
            </div>
          </div>
        </div>
      </Pane>

      <Pane>
        {CREDENTIALS.map((c, i) => {
          const st = statusStyle(c.status);
          return (
            <div
              key={c.naam}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.04]"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairlineSoft}` }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: st.glow, border: `1px solid ${st.fg}33` }}
              >
                {c.status === "SUBMITTED" ? (
                  <Loader2
                    size={17}
                    aria-hidden="true"
                    className="motion-safe:animate-spin"
                    style={{ color: st.fg }}
                  />
                ) : (
                  <st.Icon size={17} aria-hidden="true" style={{ color: st.fg }} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium">{c.naam}</p>
                <p className="text-[12px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
                style={{ color: st.fg, background: st.glow, border: `1px solid ${st.fg}33` }}
              >
                <st.Icon size={11} aria-hidden="true" /> {st.label}
              </span>
            </div>
          );
        })}
      </Pane>

      {/* Documenten */}
      <div>
        <h2 className="mb-3 text-[14px] font-semibold tracking-tight">Documenten</h2>
        <Pane depth="back">
          {DOCUMENTEN.map((d, i) => {
            const st = statusStyle(d.status);
            return (
              <div
                key={d.naam}
                className="flex items-center gap-3.5 px-4 py-3.5"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairlineSoft}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                  aria-hidden="true"
                >
                  <FileText size={15} style={{ color: C.violet }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold">{d.naam}</p>
                  <p className="truncate text-[11px]" style={{ color: C.muted, ...mono }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </p>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                  style={{ color: st.fg, background: st.glow }}
                >
                  <st.Icon size={10} aria-hidden="true" /> {st.label}
                </span>
              </div>
            );
          })}
        </Pane>
      </div>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties() {
  const tone: Record<
    "warning" | "info",
    { fg: string; glow: string; Icon: LucideIcon; label: string }
  > = {
    warning: { fg: C.amber, glow: "rgba(251,191,92,0.16)", Icon: AlertTriangle, label: "Urgent" },
    info: { fg: C.sky, glow: "rgba(100,210,255,0.16)", Icon: Bell, label: "Ter info" },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHead
        kicker="Aandacht"
        title="Volgende acties"
        note="Wat nu telt — op volgorde van urgentie, met een heldere blik vooruit."
      />
      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <Pane key={a.titel} className="flex items-start gap-4 p-5" lift tint={`${t.fg}18`}>
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className="text-[10px] font-semibold tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: t.glow, border: `1px solid ${t.fg}33` }}
                >
                  <t.Icon size={19} aria-hidden="true" style={{ color: t.fg }} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: t.fg, background: t.glow }}
                >
                  <t.Icon size={9} aria-hidden="true" /> {t.label}
                </span>
                <p className="mt-1.5 text-[13.5px] font-semibold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-center rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64d2ff]"
                style={{ color: t.fg, background: t.glow, border: `1px solid ${t.fg}33` }}
              >
                {a.cta}
              </button>
            </Pane>
          );
        })}
      </div>
      <Pane depth="back" className="flex items-center gap-4 p-5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: "rgba(74,222,128,0.14)" }}
        >
          <Check size={18} aria-hidden="true" style={{ color: C.green }} />
        </div>
        <p className="text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Alles bekeken? Mooi. Nieuwe acties verschijnen hier zodra ze relevant worden — je hoeft
          niets zelf te bewaken.
        </p>
      </Pane>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusTone: Record<string, { fg: string; glow: string; Icon: LucideIcon; label: string }> =
    {
      Betaald: { fg: C.green, glow: "rgba(74,222,128,0.14)", Icon: Check, label: "Betaald" },
      Openstaand: { fg: C.amber, glow: "rgba(251,191,92,0.14)", Icon: Clock, label: "Openstaand" },
      Concept: { fg: C.muted, glow: "rgba(255,255,255,0.06)", Icon: FileText, label: "Concept" },
    };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kicker="Omzet"
          title="Facturen"
          note="Een helder overzicht van wat binnen is en wat nog onderweg is."
        />
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64d2ff]"
          style={{
            background: `linear-gradient(150deg, ${C.sky}, ${C.violet})`,
            color: "#0b0f1c",
            boxShadow: "0 14px 30px -14px rgba(100,210,255,0.55)",
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Pane>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.muted, borderBottom: `1px solid ${C.hairline}` }}
              >
                <th className="px-5 py-3.5 font-semibold">Nummer</th>
                <th className="px-5 py-3.5 font-semibold">Klant</th>
                <th className="hidden px-5 py-3.5 font-semibold sm:table-cell">Datum</th>
                <th className="px-5 py-3.5 text-right font-semibold">Bedrag</th>
                <th className="px-5 py-3.5 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = statusTone[f.status] ?? statusTone.Concept!;
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-white/[0.04]"
                    style={{ borderTop: `1px solid ${C.hairlineSoft}` }}
                  >
                    <td
                      className="px-5 py-4 text-[12.5px] tabular-nums"
                      style={{ color: C.inkSoft, ...mono }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-medium">{f.klant}</td>
                    <td
                      className="hidden px-5 py-4 text-[12.5px] tabular-nums sm:table-cell"
                      style={{ color: C.muted, ...mono }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[13px] font-semibold tabular-nums"
                      style={mono}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ color: t.fg, background: t.glow, border: `1px solid ${t.fg}2a` }}
                      >
                        <t.Icon size={11} aria-hidden="true" /> {t.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Pane>
    </div>
  );
}
