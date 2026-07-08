"use client";

// Concept 191 — "Glasvezel" · fiber-optic light-routing. Donker koel canvas waarop dunne lichtgevende
// glasvezel-strengen (gebogen SVG-paden met glow) de aandacht routeren tussen datapunten. Node-punten
// waar vezels samenkomen zijn kaarten / KPI's. Eén koel accent (cyaan/teal) loopt als licht door alles
// heen; diepte via lagen, glow en een subtiele puls die langs de vezel loopt (deterministische CSS-
// animatie, geen random/Date). Onderscheidt zich van "knooppunt" (force-graph) en "neonbord": dit is
// verfijnd, donker en licht-als-informatie — vezels léíden het oog, ze schreeuwen niet.
// Status nooit kleur-alleen: label + icoon + vorm. UI Nederlands.
// Fonts: Space Grotesk (display) + Geist (tekst) + Spline Sans Mono (data/cijfers).

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Star,
  FileText,
  TriangleAlert,
  ChevronRight,
  RefreshCw,
  Zap,
  BadgeCheck,
  Radio,
  Waypoints,
  Signal,
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

// ── Palet — koel donker canvas, één cyaan/teal accent dat als licht door alles heen loopt. ──
const C = {
  bg: "#050a10", // diepste basis (nachtblauw-zwart)
  bgDeep: "#03070c",
  panel: "#0a1420", // kaart-oppervlak
  panelHi: "#0f1d2e", // opgetild vlak / hover
  line: "#16293d", // fijne koele rand
  lineSoft: "#0f1e2e",
  // Licht-ladder (cyaan/teal → helder wit-cyaan kern)
  fiber: "#38e6d4", // merk-vezel (teal-cyaan)
  fiberHi: "#8ffff0", // helderste kern van het licht
  fiberDeep: "#0f8f88", // dieper teal
  glow: "rgba(56,230,212,0.55)",
  ink: "#e6f3fb", // primaire tekst (koel wit)
  inkSoft: "#9fb6c9", // secundaire tekst
  inkFaint: "#5f7891", // labels
  onFiber: "#031014", // tekst op licht-vlak
  amberWarn: "#ffcf6b", // alleen als tweede signaalvorm bij waarschuwing (naast icoon+vorm)
  rose: "#ff8fa8", // afgewezen-signaal (naast icoon+vorm)
};

const display = { fontFamily: "var(--font-lab-space)" };
const bodyF = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-spline-mono)" };

// ── Status-model — licht-taal. Onderscheid via icoon + label + vorm (gevuld glow / omlijnd / gestreept /
//    dubbel). Kleur ondersteunt, draagt nooit alleen. ──
type Variant = "beam" | "outline" | "dashed" | "double";
type StatusStyle = {
  label: string;
  Icon: LucideIcon;
  fg: string;
  bg: string;
  border: string;
  variant: Variant;
};
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      // Vol licht — de vezel brandt door
      return {
        label: "Geverifieerd",
        Icon: BadgeCheck,
        fg: C.onFiber,
        bg: C.fiber,
        border: C.fiberHi,
        variant: "beam",
      };
    case "SUBMITTED":
      // Omlijnd, gedempt — licht onderweg, nog niet aangekomen
      return {
        label: "In beoordeling",
        Icon: Clock,
        fg: C.inkSoft,
        bg: "transparent",
        border: C.fiberDeep,
        variant: "outline",
      };
    case "EXPIRING":
      // Gestreept, amber-signaal naast de driehoek — vraagt aandacht
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fg: C.amberWarn,
        bg: "rgba(255,207,107,0.10)",
        border: C.amberWarn,
        variant: "dashed",
      };
    case "REJECTED":
      // Dubbele rand, rose-signaal + kruis — onderbroken lijn
      return {
        label: "Afgewezen",
        Icon: XCircle,
        fg: C.rose,
        bg: "rgba(255,143,168,0.08)",
        border: C.rose,
        variant: "double",
      };
  }
}

function borderFor(m: StatusStyle): React.CSSProperties {
  if (m.variant === "beam") return { border: `1px solid ${m.border}` };
  if (m.variant === "dashed") return { border: `1px dashed ${m.border}` };
  if (m.variant === "double") return { border: `2.5px double ${m.border}` };
  return { border: `1px solid ${m.border}` };
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        ...bodyF,
        background: m.bg,
        color: m.fg,
        ...borderFor(m),
        ...(m.variant === "beam" ? { boxShadow: `0 0 14px -3px ${C.glow}` } : {}),
      }}
    >
      <m.Icon size={12} strokeWidth={2.3} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Glasvezel-streng — gebogen SVG-pad met glow-laag + kern-lijn + een licht-puls die langs de vezel
//    loopt (deterministische stroke-dash-animatie). Decoratief; aria-hidden. ──
function Fiber({
  d,
  delay = 0,
  duration = 3.4,
  width = 1.4,
  className = "",
}: {
  d: string;
  delay?: number;
  duration?: number;
  width?: number;
  className?: string;
}) {
  return (
    <g className={className} aria-hidden="true">
      {/* zachte glow-onderlaag */}
      <path
        d={d}
        fill="none"
        stroke={C.fiber}
        strokeWidth={width * 4}
        strokeLinecap="round"
        opacity={0.14}
        style={{ filter: "blur(3px)" }}
      />
      {/* kern-vezel */}
      <path
        d={d}
        fill="none"
        stroke={C.fiberDeep}
        strokeWidth={width}
        strokeLinecap="round"
        opacity={0.7}
      />
      {/* licht-puls die langs de vezel reist */}
      <path
        d={d}
        fill="none"
        stroke={C.fiberHi}
        strokeWidth={width * 1.5}
        strokeLinecap="round"
        strokeDasharray="26 320"
        style={{
          animation: `fiberPulse ${duration}s linear ${delay}s infinite`,
          filter: `drop-shadow(0 0 4px ${C.fiber})`,
        }}
      />
    </g>
  );
}

// Node-glyph — knooppunt waar vezels samenkomen.
function Node({
  x,
  y,
  r = 4,
  bright = false,
}: {
  x: number;
  y: number;
  r?: number;
  bright?: boolean;
}) {
  return (
    <g aria-hidden="true">
      <circle
        cx={x}
        cy={y}
        r={r * 2.6}
        fill={C.fiber}
        opacity={0.14}
        style={{ filter: "blur(2px)" }}
      />
      <circle cx={x} cy={y} r={r} fill={bright ? C.fiberHi : C.fiber} />
      <circle cx={x} cy={y} r={r} fill="none" stroke={C.fiberHi} strokeWidth={0.8} opacity={0.8} />
    </g>
  );
}

// Vezel-veld achter een sectie — een web van strengen dat het oog leidt.
function FiberField() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 800 400"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <Fiber d="M -20 60 C 180 40, 320 180, 560 120 S 780 220, 840 200" delay={0} duration={4.2} />
      <Fiber
        d="M -20 220 C 160 260, 300 120, 520 200 S 760 120, 840 150"
        delay={0.8}
        duration={5.1}
      />
      <Fiber
        d="M -20 340 C 200 320, 380 380, 600 300 S 800 260, 840 300"
        delay={1.6}
        duration={4.6}
      />
      <Node x={560} y={120} bright />
      <Node x={520} y={200} />
      <Node x={600} y={300} />
    </svg>
  );
}

// ── Kaart — koel panel met fijne rand; als node kan hij een vezel-glow bij hover tonen. ──
function Card({
  children,
  className = "",
  style,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
}) {
  return (
    <div
      className={`group/card relative overflow-hidden rounded-2xl ${
        interactive
          ? "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-22px_rgba(56,230,212,0.5)]"
          : ""
      } ${className}`}
      style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.line}`, ...style }}
    >
      {interactive && (
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
          style={{ background: `linear-gradient(90deg, transparent, ${C.fiber}, transparent)` }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

// Sectie-kop — licht-glyph + display-titel + dunne vezel-liniaal.
function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{
          background: "rgba(56,230,212,0.10)",
          boxShadow: `inset 0 0 0 1px ${C.fiberDeep}66, 0 0 16px -6px ${C.glow}`,
        }}
        aria-hidden="true"
      >
        <Icon size={17} strokeWidth={1.9} style={{ color: C.fiber }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[19px] font-semibold leading-none tracking-[-0.01em]"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-1 text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
      <span
        className="ml-2 hidden h-px flex-1 sm:block"
        style={{ background: `linear-gradient(90deg, ${C.fiberDeep}88, transparent)` }}
        aria-hidden="true"
      />
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={1.9} style={{ color: C.fiber }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Match-ring — teal-boog op donkere rest, mono-cijfer + glow in het hart.
function MatchRing({ value, size = 54 }: { value: number; size?: number }) {
  const deg = (value / 100) * 360;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${C.fiberHi} 0deg, ${C.fiber} ${deg}deg, ${C.line} ${deg}deg 360deg)`,
        boxShadow: `0 0 18px -6px ${C.glow}`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-[4px] flex flex-col items-center justify-center rounded-full"
        style={{ background: C.panel }}
      >
        <span
          className="text-[15px] font-semibold tabular-nums leading-none"
          style={{ ...mono, color: C.fiberHi }}
        >
          {value}
        </span>
        <span
          className="text-[7px] font-semibold uppercase tracking-[0.14em]"
          style={{ ...mono, color: C.inkFaint }}
        >
          match
        </span>
      </span>
    </span>
  );
}

// Spark — een lichtstraal-lijn i.p.v. staven: het datasignaal als vezel.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 100;
  const h = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 6) - 3;
    return [x, y] as const;
  });
  const dLine = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1] ?? ([w, h / 2] as const);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-8 w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={dLine}
        fill="none"
        stroke={C.fiber}
        strokeWidth={2.6}
        opacity={0.2}
        style={{ filter: "blur(2px)" }}
      />
      <path
        d={dLine}
        fill="none"
        stroke={C.fiberHi}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r={2.4}
        fill={C.fiberHi}
        style={{ filter: `drop-shadow(0 0 3px ${C.fiber})` }}
      />
    </svg>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept191() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* Deterministische keyframes voor de vezel-puls (scoped via unieke naam) */}
      <style>{`
        @keyframes fiberPulse { 0% { stroke-dashoffset: 346; } 100% { stroke-dashoffset: 0; } }
        @keyframes fiberBreathe { 0%,100% { opacity: .5; } 50% { opacity: .9; } }
      `}</style>

      {/* Koele licht-gloed onder alles */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(120% 60% at 70% -10%, rgba(56,230,212,0.10), transparent 60%), radial-gradient(80% 50% at 10% 110%, rgba(15,143,136,0.10), transparent 60%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Kop — masthead met vezel-veld */}
        <header className="relative overflow-hidden" style={{ background: C.bgDeep }}>
          <div className="absolute inset-0 opacity-70">
            <FiberField />
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${C.fiber}, transparent)` }}
            aria-hidden="true"
          />
          <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
            <div className="flex items-center gap-3.5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: C.fiber, boxShadow: `0 0 26px -4px ${C.fiber}` }}
                aria-hidden="true"
              >
                <Waypoints size={20} strokeWidth={2} style={{ color: C.onFiber }} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.34em]"
                  style={{ ...mono, color: C.fiber }}
                >
                  Glasvezel
                </div>
                <div
                  className="text-[24px] font-semibold leading-none"
                  style={{ ...display, color: C.ink }}
                >
                  Lichtstroom
                </div>
                <div
                  className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  Match · Verificatie · Omzet
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
                style={{
                  ...bodyF,
                  background: "rgba(56,230,212,0.10)",
                  color: C.fiberHi,
                  boxShadow: `inset 0 0 0 1px ${C.fiberDeep}66`,
                }}
              >
                <ShieldCheck size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
                style={{
                  ...mono,
                  background: C.fiber,
                  color: C.onFiber,
                  boxShadow: `0 0 18px -6px ${C.fiber}`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-switcher — licht-pil-tabs */}
          <nav
            className="relative mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 pb-4 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#03070c]"
                  style={
                    on
                      ? {
                          ...bodyF,
                          background: C.fiber,
                          color: C.onFiber,
                          boxShadow: `0 0 18px -6px ${C.fiber}`,
                          ["--tw-ring-color" as string]: C.fiber,
                        }
                      : {
                          ...bodyF,
                          background: "rgba(56,230,212,0.06)",
                          color: C.inkSoft,
                          boxShadow: `inset 0 0 0 1px ${C.line}`,
                          ["--tw-ring-color" as string]: C.fiber,
                        }
                  }
                >
                  {s.label}
                </button>
              );
            })}
          </nav>
        </header>

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

        <footer className="relative mx-auto max-w-6xl px-4 pb-10 md:px-8">
          <div
            className="flex items-center justify-center gap-2 border-t pt-6 text-[11px]"
            style={{ ...mono, borderColor: C.line, color: C.inkFaint }}
          >
            <Signal size={12} aria-hidden="true" /> Licht als informatie — de vezel leidt je naar
            wat telt.
          </div>
        </footer>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-8">
      {/* Hero — vezel-veld dat de aandacht naar de CTA routeert */}
      <Card className="relative">
        <div className="pointer-events-none absolute inset-0 opacity-90" aria-hidden="true">
          <FiberField />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(90% 120% at 100% 0%, rgba(56,230,212,0.12), transparent 55%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-xl p-6 sm:p-9">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{
              ...bodyF,
              background: "rgba(56,230,212,0.10)",
              color: C.fiberHi,
              boxShadow: `inset 0 0 0 1px ${C.fiberDeep}66`,
            }}
          >
            <Radio size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-4 text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[42px]"
            style={{ ...display, color: C.ink }}
          >
            Drie matches lichten op. Je signaal komt helder door.
          </h1>
          <p
            className="mt-3 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Eén streng vraagt aandacht: je VOG verloopt binnenkort. Vernieuw hem en houd de lijn
            naar opdrachtgevers ononderbroken.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050a10]"
              style={{
                ...bodyF,
                background: C.fiber,
                color: C.onFiber,
                boxShadow: `0 0 22px -6px ${C.fiber}`,
                ["--tw-ring-color" as string]: C.fiber,
              }}
            >
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050a10]"
              style={{
                ...bodyF,
                background: C.panelHi,
                color: C.ink,
                boxShadow: `inset 0 0 0 1px ${C.line}`,
                ["--tw-ring-color" as string]: C.fiber,
              }}
            >
              <TriangleAlert
                size={14}
                strokeWidth={2.2}
                style={{ color: C.amberWarn }}
                aria-hidden="true"
              />{" "}
              Los actie op
            </button>
          </div>
        </div>
      </Card>

      {/* KPI-nodes */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...mono,
                  background: k.up ? "rgba(56,230,212,0.14)" : C.panelHi,
                  color: k.up ? C.fiberHi : C.inkSoft,
                  boxShadow: `inset 0 0 0 1px ${k.up ? C.fiberDeep + "55" : C.line}`,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[26px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches */}
        <section className="space-y-4">
          <SectionHead
            title="Aanbevolen matches"
            sub="Op match-percentage gerangschikt"
            Icon={Zap}
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Card key={o.id} interactive>
                <button
                  onClick={onOpen}
                  className="relative flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.fiber }}
                >
                  {/* korte vezel die node → tekst verbindt */}
                  <MatchRing value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[16px] font-semibold"
                          style={{ ...display, color: C.ink }}
                        >
                          {o.titel}
                        </div>
                        <div
                          className="mt-0.5 truncate text-[12.5px]"
                          style={{ ...bodyF, color: C.inkSoft }}
                        >
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </div>
                      </div>
                      <ChevronRight
                        size={18}
                        className="mt-0.5 shrink-0"
                        style={{ color: C.inkFaint }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{ ...bodyF, background: C.panelHi, color: C.inkSoft }}
                        >
                          <Check
                            size={11}
                            strokeWidth={2.6}
                            style={{ color: C.fiber }}
                            aria-hidden="true"
                          />{" "}
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </Card>
            ))}
          </div>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <SectionHead title="Vertrouwen" sub="Certificaat-dekking" Icon={ShieldCheck} />
          <Card className="p-5">
            <div className="flex items-center gap-5">
              <span
                className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${C.fiberHi} 0deg, ${C.fiber} ${dek * 3.6}deg, ${C.line} ${dek * 3.6}deg 360deg)`,
                  boxShadow: `0 0 22px -8px ${C.glow}`,
                }}
                aria-hidden="true"
              >
                <span
                  className="absolute inset-[8px] flex flex-col items-center justify-center rounded-full"
                  style={{ background: C.panel }}
                >
                  <span
                    className="text-[26px] font-semibold tabular-nums leading-none"
                    style={{ ...mono, color: C.fiberHi }}
                  >
                    {dek}
                    <span className="text-[13px]" style={{ color: C.inkFaint }}>
                      %
                    </span>
                  </span>
                </span>
              </span>
              <div>
                <StatusTag status="VERIFIED" />
                <p className="mt-2 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {verified}/{CREDENTIALS.length} certificaten geverifieerd. Opdrachtgevers zien
                  alleen geverifieerde documenten.
                </p>
              </div>
            </div>
          </Card>

          {/* Prioriteit — licht-vlak */}
          <Card
            className="relative"
            style={{ background: C.fiber, boxShadow: `0 0 34px -12px ${C.fiber}` }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(80% 120% at 100% 0%, rgba(255,255,255,0.28), transparent 55%)`,
              }}
              aria-hidden="true"
            />
            <div className="relative p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...mono, background: "rgba(3,16,20,0.16)", color: C.onFiber }}
              >
                <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
              </span>
              <h3
                className="mt-2.5 text-[20px] font-semibold leading-tight tracking-[-0.01em]"
                style={{ ...display, color: C.onFiber }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ ...bodyF, color: "rgba(3,16,20,0.78)" }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#38e6d4]"
                style={{
                  ...bodyF,
                  background: C.onFiber,
                  color: C.fiberHi,
                  ["--tw-ring-color" as string]: C.onFiber,
                }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — met zoek-empty-state, skeleton-loading én foutstrook ─────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(true);

  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 650);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Marktplaats" sub="Open opdrachten" Icon={Search} />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-full px-3.5 py-2"
            style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.line}` }}
          >
            <Search size={15} style={{ color: C.fiber }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[12.5px] outline-none placeholder:opacity-50"
              style={{ ...bodyF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opnieuw laden"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050a10]"
            style={{
              background: C.panel,
              boxShadow: `inset 0 0 0 1px ${C.line}`,
              ["--tw-ring-color" as string]: C.fiber,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.fiber }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Foutstrook — onderbroken vezel (streeprand) + kruis-icoon */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-2xl p-4"
          role="alert"
          style={{ background: "rgba(255,143,168,0.08)", border: `1px dashed ${C.rose}` }}
        >
          <XCircle size={18} strokeWidth={2.2} style={{ color: C.rose }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold" style={{ ...display, color: C.ink }}>
              Sommige matches konden niet worden geladen
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
              De lijn naar de nieuwste opdrachten viel even weg. Probeer opnieuw te laden.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.rose, ["--tw-ring-color" as string]: C.rose }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-12 w-12 shrink-0 animate-pulse rounded-full"
                  style={{ background: C.panelHi }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse rounded"
                    style={{ background: C.panelHi }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              background: "rgba(56,230,212,0.10)",
              boxShadow: `inset 0 0 0 1px ${C.fiberDeep}66`,
            }}
            aria-hidden="true"
          >
            <Search size={28} strokeWidth={1.6} style={{ color: C.fiber }} />
          </span>
          <p className="text-[20px] font-semibold" style={{ ...display, color: C.ink }}>
            Geen signaal gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Niets gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan om de vezel opnieuw op te
            lichten.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050a10]"
            style={{
              ...bodyF,
              background: C.fiber,
              color: C.onFiber,
              ["--tw-ring-color" as string]: C.fiber,
            }}
          >
            Zoekterm wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Card key={o.id} interactive className="flex flex-col">
              <div
                className="h-1 w-full"
                style={{ background: `linear-gradient(90deg, ${C.fiberHi}, ${C.fiberDeep})` }}
                aria-hidden="true"
              />
              <div className="relative flex items-center gap-3 p-4">
                <MatchRing value={o.match} size={48} />
                <div className="min-w-0">
                  <h3
                    className="text-[16px] font-semibold leading-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
              </div>
              <div className="relative px-4 pb-4">
                <dl className="grid grid-cols-2 gap-y-2 text-[12px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                      style={{ ...bodyF, background: C.panelHi, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="relative mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.fiberHi,
                  ["--tw-ring-color" as string]: C.fiber,
                }}
              >
                Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050a10]"
        style={{
          ...bodyF,
          background: C.panel,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.fiber,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Card className="relative">
        <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden="true">
          <FiberField />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(80% 130% at 100% 0%, rgba(56,230,212,0.14), transparent 55%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                ...mono,
                background: "rgba(56,230,212,0.10)",
                color: C.fiberHi,
                boxShadow: `inset 0 0 0 1px ${C.fiberDeep}66`,
              }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[28px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[38px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchRing value={opdracht.match} size={82} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Card key={f.l} interactive className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "rgba(56,230,212,0.10)" }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={1.9} style={{ color: C.fiber }} />
            </span>
            <div
              className="mt-3 text-[17px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(56,230,212,0.16)" }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.6} style={{ color: C.fiber }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" Icon={TriangleAlert} />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.panelHi, boxShadow: `inset 0 0 0 1px ${C.fiberDeep}66` }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} style={{ color: C.amberWarn }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050a10]"
          style={{
            ...bodyF,
            background: C.fiber,
            color: C.onFiber,
            boxShadow: `0 0 24px -6px ${C.fiber}`,
            ["--tw-ring-color" as string]: C.fiber,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050a10]"
          style={{
            ...bodyF,
            background: C.panel,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.line}`,
            ["--tw-ring-color" as string]: C.fiber,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.fiber }} aria-hidden="true" /> Bewaar
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Verificatie" sub="Certificaten &amp; documenten" Icon={ShieldCheck} />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050a10]"
          style={{
            ...bodyF,
            background: C.fiber,
            color: C.onFiber,
            boxShadow: `0 0 20px -6px ${C.fiber}`,
            ["--tw-ring-color" as string]: C.fiber,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Card className="relative">
        <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
          <FiberField />
        </div>
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <span
            className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${C.fiberHi} 0deg, ${C.fiber} ${dek * 3.6}deg, ${C.line} ${dek * 3.6}deg 360deg)`,
              boxShadow: `0 0 26px -8px ${C.glow}`,
            }}
            aria-hidden="true"
          >
            <span
              className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full"
              style={{ background: C.panel }}
            >
              <span
                className="text-[30px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: C.fiberHi }}
              >
                {dek}
                <span className="text-[15px]" style={{ color: C.inkFaint }}>
                  %
                </span>
              </span>
            </span>
          </span>
          <div className="max-w-sm">
            <div className="text-[20px] font-semibold" style={{ ...display, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elke geverifieerde streng versterkt het geheel. Houd je dekking hoog, dan blijft je
              signaal helder voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{
                ...bodyF,
                background: C.fiber,
                color: C.onFiber,
                boxShadow: `0 0 16px -5px ${C.fiber}`,
              }}
            >
              <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Card key={c.naam} interactive className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: m.variant === "beam" ? C.fiber : C.panelHi,
                  ...(m.variant === "beam"
                    ? { boxShadow: `0 0 16px -5px ${C.fiber}` }
                    : borderFor(m)),
                }}
                aria-hidden="true"
              >
                <m.Icon
                  size={20}
                  strokeWidth={2.2}
                  style={{ color: m.variant === "beam" ? C.onFiber : m.fg }}
                />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-semibold"
                  style={{ ...display, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-[#050a10]"
                      style={{
                        ...bodyF,
                        background: C.panelHi,
                        color: C.ink,
                        boxShadow: `inset 0 0 0 1px ${C.line}`,
                        ["--tw-ring-color" as string]: C.fiber,
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
              </div>
            </Card>
          );
        })}
      </div>

      {/* Documenten-strook — verrijking */}
      <section className="space-y-3">
        <SectionHead
          title="Documenten"
          sub="Privé — alleen geverifieerd zichtbaar voor opdrachtgevers"
          Icon={FileText}
        />
        <Card>
          {DOCUMENTEN.map((d, i) => {
            const m = credMeta(d.status);
            return (
              <div
                key={d.naam}
                className="flex items-center gap-3 p-4"
                style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
                  style={{
                    ...mono,
                    background: C.panelHi,
                    color: C.fiber,
                    boxShadow: `inset 0 0 0 1px ${C.line}`,
                  }}
                  aria-hidden="true"
                >
                  {d.type}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[13.5px] font-medium"
                    style={{ ...bodyF, color: C.ink }}
                  >
                    {d.naam}
                  </div>
                  <div className="text-[11px]" style={{ ...mono, color: C.inkFaint }}>
                    {d.grootte} · bijgewerkt {d.bijgewerkt}
                  </div>
                </div>
                <span className="hidden sm:block">
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-semibold"
                    style={{ ...bodyF, color: m.fg === C.onFiber ? C.fiber : m.fg }}
                  >
                    <m.Icon size={12} strokeWidth={2.2} aria-hidden="true" /> {m.label}
                  </span>
                </span>
              </div>
            );
          })}
        </Card>
      </section>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <SectionHead
        title="Volgende beste acties"
        sub="Op urgentie gerangschikt — pak de bovenste eerst"
        Icon={Zap}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card interactive className="flex items-stretch">
                <span
                  className="w-1.5 shrink-0"
                  style={{
                    background: warn ? C.amberWarn : C.fiber,
                    boxShadow: warn ? undefined : `0 0 12px -2px ${C.fiber}`,
                  }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-semibold tabular-nums"
                    style={
                      warn
                        ? {
                            ...mono,
                            background: "rgba(255,207,107,0.14)",
                            color: C.amberWarn,
                            boxShadow: `inset 0 0 0 1px ${C.amberWarn}55`,
                          }
                        : {
                            ...mono,
                            background: C.panelHi,
                            color: C.fiberHi,
                            boxShadow: `inset 0 0 0 1px ${C.line}`,
                          }
                    }
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                        style={
                          warn
                            ? {
                                ...mono,
                                background: "rgba(255,207,107,0.14)",
                                color: C.amberWarn,
                                boxShadow: `inset 0 0 0 1px ${C.amberWarn}55`,
                              }
                            : {
                                ...mono,
                                background: "rgba(56,230,212,0.10)",
                                color: C.fiberHi,
                                boxShadow: `inset 0 0 0 1px ${C.fiberDeep}55`,
                              }
                        }
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Star size={10} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[17px] font-semibold"
                        style={{ ...display, color: C.ink }}
                      >
                        {a.titel}
                      </h3>
                    </div>
                    <p
                      className="mt-1.5 text-[13px] leading-relaxed"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                    <button
                      className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050a10]"
                      style={
                        warn
                          ? {
                              ...bodyF,
                              background: C.amberWarn,
                              color: C.onFiber,
                              ["--tw-ring-color" as string]: C.amberWarn,
                            }
                          : {
                              ...bodyF,
                              background: C.fiber,
                              color: C.onFiber,
                              boxShadow: `0 0 18px -6px ${C.fiber}`,
                              ["--tw-ring-color" as string]: C.fiber,
                            }
                      }
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      {/* Berichten-strook — verrijking */}
      <section className="space-y-3">
        <SectionHead title="Berichten" sub="Recente gesprekken" Icon={Radio} />
        <Card>
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  ...mono,
                  background: "rgba(56,230,212,0.10)",
                  color: C.fiberHi,
                  boxShadow: `inset 0 0 0 1px ${C.fiberDeep}55`,
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[15px] font-semibold"
                    style={{ ...display, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.fiber, boxShadow: `0 0 6px 1px ${C.fiber}` }}
                      aria-label="Ongelezen"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {b.preview}
                </p>
              </div>
              <span
                className="shrink-0 text-[11px] tabular-nums"
                style={{ ...mono, color: C.inkFaint }}
              >
                {b.tijd}
              </span>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; solid: boolean; dashed: boolean } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, solid: true, dashed: false };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, solid: false, dashed: true };
    return { label: "Concept", Icon: FileText, solid: false, dashed: false };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Facturen" sub="Omzet &amp; openstaand" Icon={Coins} />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050a10]"
          style={{
            ...bodyF,
            background: C.fiber,
            color: C.onFiber,
            boxShadow: `0 0 20px -6px ${C.fiber}`,
            ["--tw-ring-color" as string]: C.fiber,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald },
          { l: "Openstaand", v: `${open}` },
          { l: "Te factureren", v: "€ 1.350" },
        ].map((s) => (
          <Card key={s.l} interactive className="p-4">
            <div
              className="h-1 w-10 rounded-full"
              style={{ background: `linear-gradient(90deg, ${C.fiberHi}, ${C.fiberDeep})` }}
              aria-hidden="true"
            />
            <div className="mt-3 text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
              {s.l}
            </div>
            <div
              className="mt-1 text-[26px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {s.v}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.panelHi }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...mono, color: C.inkFaint }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const m = factMeta(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors"
                    style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
                  >
                    <td
                      className="px-4 py-3 text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          ...bodyF,
                          background: m.solid ? C.fiber : "transparent",
                          color: m.solid ? C.onFiber : C.fiberHi,
                          border: m.solid
                            ? `1px solid ${C.fiber}`
                            : m.dashed
                              ? `1px dashed ${C.amberWarn}`
                              : `1px solid ${C.line}`,
                          ...(m.dashed ? { color: C.amberWarn } : {}),
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.fiber }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: "rgba(3,16,20,0.7)" }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...mono, color: C.onFiber }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
