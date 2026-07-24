"use client";

// Concept 456 — "Mycelium" · Organisch vertakkend sporen-netwerk (biofiel 2026).
// Schimmeldraad/mycelium-esthetiek: organische, vertakkende dunne draden (SVG-curves) die
// kaarten/nodes verbinden, sporen-stippen, warm-aards donker palet — mos #3f5c3a, sporen-crème,
// humus #241f18. Connective UI: matching als vertakkend netwerk van draden naar opdrachten.
// Organisch, levend, kalm; dichtheid en leesbaarheid behouden.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Minus,
  Network,
  Plus,
  Search,
  ShieldCheck,
  Sprout,
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
  DOCUMENTEN,
  BERICHTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: warm-aards donker, mos-groen, sporen-crème —
const C = {
  humus: "#241f18",
  humusDeep: "#1a160f",
  panel: "#2c2619",
  panelSoft: "#342d1e",
  raise: "#3a3222",
  ink: "#f0e9d8",
  inkSoft: "#cabfa4",
  inkMute: "#9c8f70",
  inkFaint: "#736852",
  line: "rgba(120,140,96,0.28)",
  lineSoft: "rgba(120,140,96,0.14)",
  moss: "#5c7d4f",
  mossHi: "#82a56f",
  mossDeep: "#3f5c3a",
  mossWash: "rgba(92,125,79,0.16)",
  spore: "#e4d5a8",
  sporeHi: "#f2e6bf",
  thread: "#8a9c6a",
  // status
  ok: "#6f9a58",
  okInk: "#9fc986",
  okWash: "rgba(111,154,88,0.18)",
  warn: "#c99a4a",
  warnInk: "#e2bd78",
  warnWash: "rgba(201,154,74,0.16)",
  info: "#7f8f9a",
  infoInk: "#adbcc6",
  infoWash: "rgba(127,143,154,0.16)",
  bad: "#c07050",
  badInk: "#dda183",
  badWash: "rgba(192,112,80,0.18)",
};

const serif = {
  fontFamily: "'Fraunces', 'Spectral', 'Iowan Old Style', Georgia, 'Times New Roman', serif",
};
const body = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

// Sporen-grond: fijne crème/mos-stippen op warm-aardse humus.
function sporeGround(color: string): React.CSSProperties {
  return {
    backgroundColor: color,
    backgroundImage:
      "radial-gradient(rgba(228,213,168,0.06) 0.7px, transparent 0.8px)," +
      "radial-gradient(rgba(130,165,111,0.05) 0.6px, transparent 0.7px)," +
      "radial-gradient(900px 520px at 88% -6%, rgba(92,125,79,0.12), transparent 62%)",
    backgroundSize: "34px 34px, 21px 21px, 100% 100%",
    backgroundPosition: "0 0, 11px 14px, 0 0",
  };
}

function seeded(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// — Mycelium-draden: vertakkende, licht-krommende draadjes vanuit een wortelpunt —
function Mycelium({
  id,
  tone = C.thread,
  seed = 1,
  branches = 6,
}: {
  id: string;
  tone?: string;
  seed?: number;
  branches?: number;
}) {
  const paths = useMemo(() => {
    return Array.from({ length: branches }).map((_, i) => {
      const y0 = 6 + seeded(seed + i) * 88;
      const x0 = seeded(seed + i * 2 + 1) * 12;
      const y1 = y0 + (seeded(seed + i * 3) - 0.5) * 40;
      const x2 = 40 + seeded(seed + i * 5) * 55;
      const y2 = y1 + (seeded(seed + i * 7) - 0.5) * 30;
      const x3 = 70 + seeded(seed + i * 11) * 28;
      const y3 = y2 + (seeded(seed + i * 13) - 0.5) * 24;
      const tip = seeded(seed + i * 17) * 3.2;
      return { d: `M ${x0} ${y0} C 22 ${y1}, ${x2} ${y2}, ${x3} ${y3}`, x3, y3, tip: 0.8 + tip };
    });
  }, [seed, branches]);
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {paths.map((p, i) => (
        <g key={`${id}-${i}`}>
          <path
            d={p.d}
            fill="none"
            stroke={tone}
            strokeWidth="0.35"
            opacity="0.55"
            strokeLinecap="round"
          />
          <circle cx={p.x3} cy={p.y3} r={p.tip * 0.35} fill={C.spore} opacity="0.6" />
        </g>
      ))}
    </svg>
  );
}

// — Spore-node: cirkel met uitlopende draadjes, als een groeiknoop —
function SporeNode({
  size = 46,
  tone = C.moss,
  value,
}: {
  size?: number;
  tone?: string;
  value?: number;
}) {
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {Array.from({ length: 7 }).map((_, i) => {
        const ang = (i / 7) * Math.PI * 2;
        const len = size * 0.42;
        const x2 = c + Math.cos(ang) * len;
        const y2 = c + Math.sin(ang) * len;
        const mx = c + Math.cos(ang + 0.5) * len * 0.6;
        const my = c + Math.sin(ang + 0.5) * len * 0.6;
        return (
          <path
            key={i}
            d={`M ${c} ${c} Q ${mx} ${my} ${x2} ${y2}`}
            fill="none"
            stroke={tone}
            strokeWidth="0.9"
            opacity="0.45"
            strokeLinecap="round"
          />
        );
      })}
      <circle cx={c} cy={c} r={size * 0.2} fill={tone} opacity="0.22" />
      <circle cx={c} cy={c} r={size * 0.13} fill="none" stroke={tone} strokeWidth="1.1" />
      {value !== undefined && <circle cx={c} cy={c} r={size * 0.06} fill={C.sporeHi} />}
    </svg>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  ink: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        tone: C.ok,
        ink: C.okInk,
        wash: C.okWash,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: C.info,
        ink: C.infoInk,
        wash: C.infoWash,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.warn,
        ink: C.warnInk,
        wash: C.warnWash,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.bad,
        ink: C.badInk,
        wash: C.badWash,
      };
  }
}

// — Paneel: humus-grond met mos-hairline en zachte, organische ronding —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  living = false,
  seed,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
  living?: boolean;
  seed?: number;
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-[18px] ${className}`}
      style={{
        background: `linear-gradient(165deg, ${C.panel}, ${C.humusDeep})`,
        border: `1px solid ${living ? C.line : C.lineSoft}`,
        boxShadow: living
          ? "0 0 0 1px rgba(120,140,96,0.08), 0 12px 32px rgba(12,10,6,0.5)"
          : "0 8px 24px rgba(12,10,6,0.42)",
        color: C.ink,
      }}
    >
      {seed !== undefined && (
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <Mycelium id={`bg-${seed}`} seed={seed} branches={5} />
        </div>
      )}
      <div className="relative">{children}</div>
    </Tag>
  );
}

function Eyebrow({ children, tone = C.mossHi }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em]"
      style={{ color: tone, ...body }}
    >
      <Network size={12} aria-hidden="true" />
      {children}
    </p>
  );
}

function PrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 hover:brightness-[1.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82a56f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#241f18] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        color: C.humusDeep,
        backgroundImage: `linear-gradient(135deg, ${C.mossHi}, ${C.moss} 55%, ${C.mossDeep})`,
        border: `1px solid ${C.mossDeep}`,
        boxShadow: "0 1px 0 rgba(240,233,216,0.28) inset, 0 3px 9px rgba(20,26,12,0.4)",
        ...body,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  active = false,
  className = "",
  ariaPressed,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  ariaPressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82a56f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#241f18] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.humusDeep : C.inkSoft,
        background: active ? C.spore : C.panelSoft,
        border: `1px solid ${active ? C.sporeHi : C.lineSoft}`,
        ...body,
      }}
    >
      {children}
    </button>
  );
}

function ThreadLine({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 32;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 9) - 4;
    return [x, y] as const;
  });
  // Kromme, organische lijn (Catmull-achtige smoothing).
  let path = `M ${pts[0]![0]} ${pts[0]![1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i]!;
    const p1 = pts[i + 1]!;
    const cx = (p0[0] + p1[0]) / 2;
    path += ` Q ${cx} ${p0[1]} ${cx} ${(p0[1] + p1[1]) / 2} T ${p1[0]} ${p1[1]}`;
  }
  const last = pts[pts.length - 1]!;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`th-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.24" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill={`url(#th-${id})`} />
      <path
        d={path}
        fill="none"
        stroke={tone}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={C.sporeHi} stroke={tone} strokeWidth="1.4" />
    </svg>
  );
}

function Meter({ value, tone = C.moss }: { value: number; tone?: string }) {
  return (
    <span className="hidden items-center gap-2.5 sm:flex" aria-hidden="true">
      <span
        className="relative h-2 w-24 overflow-hidden rounded-full"
        style={{ background: C.humusDeep, border: `1px solid ${C.lineSoft}` }}
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: `${value}%`,
            backgroundImage: `linear-gradient(90deg, ${C.mossDeep}, ${tone}, ${C.sporeHi})`,
            transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span className="text-[12.5px] font-semibold" style={{ color: C.mossHi, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept456() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...body, color: C.ink, ...sporeGround(C.humus) }}
    >
      <style>{`
        @keyframes myRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .my-rise { animation: myRise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .my-rise { animation: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="my-rise pt-7">
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
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex items-center justify-between gap-4 pt-8">
      <div className="flex items-center gap-3.5">
        <span
          className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl"
          style={{ background: C.humusDeep, border: `1px solid ${C.line}` }}
          aria-hidden="true"
        >
          <SporeNode size={40} tone={C.moss} value={1} />
        </span>
        <div>
          <p className="text-[20px] font-semibold leading-none" style={{ color: C.ink, ...serif }}>
            Mycelium
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute, ...body }}>
            {PROFIEL.plaats} · levend netwerk
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: C.okInk, border: `1px solid ${C.ok}`, background: C.okWash, ...body }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.panelSoft, border: `1px solid ${C.lineSoft}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.moss, color: C.humusDeep, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[14px] font-semibold" style={{ color: C.ink, ...body }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute, ...body }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[13px] font-semibold"
          style={{
            background: C.mossWash,
            border: `1px solid ${C.moss}`,
            color: C.mossHi,
            ...body,
          }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-7">
      <div
        className="flex items-center gap-1 overflow-x-auto rounded-full p-1.5"
        style={{ background: C.panelSoft, border: `1px solid ${C.lineSoft}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82a56f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2c2619] motion-reduce:transition-none"
              style={{
                color: on ? C.humusDeep : C.inkMute,
                backgroundImage: on
                  ? `linear-gradient(135deg, ${C.mossHi}, ${C.moss} 55%, ${C.mossDeep})`
                  : "none",
                ...body,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-7">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel className="p-7 md:p-9" living seed={3}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Eyebrow>Vandaag · levend netwerk</Eyebrow>
              <h1
                className="mt-4 text-[32px] font-semibold leading-[1.06] tracking-[-0.01em] md:text-[44px]"
                style={{ color: C.ink, ...serif }}
              >
                Goedemorgen,
                <br />
                {PROFIEL.naam.split(" ")[0]}.
              </h1>
            </div>
            <SporeNode size={58} tone={C.moss} value={92} />
          </div>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            Jouw praktijk als levend mycelium: elk certificaat een knoop, elke match een draad die
            zich vertakt naar nieuw werk. Alles verbonden, alles voedend — volg de draden van
            vandaag.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <PrimaryButton onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </PrimaryButton>
            <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
          </div>
        </Panel>

        <Panel className="p-7" seed={9}>
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.warnInk}>Vraagt aandacht</Eyebrow>
            <AlertTriangle size={18} aria-hidden="true" style={{ color: C.warn }} />
          </div>
          <h2
            className="mt-4 text-[20px] font-semibold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-6">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="my-4 h-px" style={{ background: C.lineSoft }} />
          <p className="flex items-center gap-2 text-[12px]" style={{ color: C.inkMute, ...num }}>
            <Check size={13} aria-hidden="true" style={{ color: C.ok }} />
            {verified}/{CREDENTIALS.length} knopen geverifieerd · 7 open reacties
          </p>
        </Panel>
      </section>

      <section>
        <div className="mb-4">
          <Eyebrow tone={C.spore}>Groei · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Panel key={k.label} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.inkMute, ...body }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold"
                  style={{
                    color: k.up ? C.okInk : C.warnInk,
                    background: k.up ? C.okWash : C.warnWash,
                    ...num,
                  }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-3 text-[27px] font-semibold leading-none tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <ThreadLine data={k.spark} tone={k.up ? C.moss : C.thread} id={`k456-${i}`} />
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <Eyebrow>Vertakkingen · opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82a56f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#241f18]"
              style={{ color: C.mossHi, ...body }}
            >
              Alle →
            </button>
          </div>
          <Panel seed={14}>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#342d1e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#82a56f] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full"
                      style={{
                        background: i === 0 ? C.mossWash : C.raise,
                        border: `1px solid ${i === 0 ? C.moss : C.lineSoft}`,
                      }}
                    >
                      <span
                        className="text-[12px] font-bold leading-none"
                        style={{ color: i === 0 ? C.mossHi : C.inkMute, ...num }}
                      >
                        {o.match}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink, ...body }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12px]"
                        style={{ color: C.inkMute }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <Meter value={o.match} tone={o.match >= 90 ? C.moss : C.thread} />
                      <ChevronRight
                        size={17}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                        style={{ color: C.inkFaint }}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div>
          <div className="mb-4">
            <Eyebrow tone={C.okInk}>Certificaten · knopen</Eyebrow>
          </div>
          <Panel className="p-5" seed={19}>
            <ul className="space-y-1">
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                      style={{ background: st.wash, border: `1px solid ${st.tone}`, color: st.ink }}
                      aria-hidden="true"
                    >
                      <st.Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span className="block truncate text-[10.5px]" style={{ color: C.inkMute }}>
                        {st.label}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(needle) ||
        o.plaats.toLowerCase().includes(needle) ||
        o.opdrachtgever.toLowerCase().includes(needle),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-7">
      <div>
        <Eyebrow>Marktplaats</Eyebrow>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]"
          style={{ color: C.ink, ...serif }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} vertakkingen beschikbaar
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-5 py-3"
          style={{ background: C.panelSoft, border: `1px solid ${C.lineSoft}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#736852]"
            style={{ color: C.ink, ...body }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GhostButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Beste match" : "Tarief"}
            </GhostButton>
          ))}
          <GhostButton onClick={() => setLoading((v) => !v)} active={loading} ariaPressed={loading}>
            {loading ? "Stop" : "Laden…"}
          </GhostButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="p-6">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded-full" style={{ background: C.raise }} />
                  <div className="h-5 w-2/3 rounded-full" style={{ background: C.panelSoft }} />
                  <div className="h-3 w-1/2 rounded-full" style={{ background: C.raise }} />
                  <div className="h-2 w-full rounded-full" style={{ background: C.raise }} />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Panel className="p-6" living seed={24}>
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: C.humusDeep, border: `1px solid ${C.moss}`, color: C.mossHi }}
              aria-hidden="true"
            >
              <Sprout size={26} />
            </span>
            <p className="mt-5 text-[22px] font-semibold" style={{ color: C.ink, ...serif }}>
              Kale bodem
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.inkSoft }}>
              Nog geen draad bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm en laat het
              netwerk opnieuw groeien.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Panel>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarktKaart({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  const tone = strong ? C.moss : C.thread;
  return (
    <Panel className="p-6" living={strong} seed={index * 8 + 2}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute, border: `1px solid ${C.lineSoft}`, ...num }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[19px] font-semibold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{
                  color: C.inkSoft,
                  background: C.raise,
                  border: `1px solid ${C.lineSoft}`,
                  ...body,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="relative inline-flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.humusDeep, border: `1.5px solid ${tone}` }}
          >
            <span className="absolute inset-0 flex items-center justify-center opacity-80">
              <SporeNode size={58} tone={tone} value={opdracht.match} />
            </span>
            <span className="relative flex flex-col items-center">
              <span
                className="text-[16px] font-bold leading-none"
                style={{ color: strong ? C.mossHi : C.thread, ...num }}
              >
                {opdracht.match}
              </span>
              <span
                className="mt-0.5 text-[7.5px] uppercase tracking-[0.12em]"
                style={{ color: C.inkFaint, ...body }}
              >
                match
              </span>
            </span>
          </span>
          <span
            className="text-[13px] font-bold"
            style={{ color: strong ? C.mossHi : C.thread, ...num }}
          >
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82a56f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2c2619]"
          style={{
            color: strong ? C.mossHi : C.thread,
            border: `1px solid ${C.lineSoft}`,
            ...body,
          }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze draad
        </button>
        <div className="ml-auto">
          <PrimaryButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </PrimaryButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="Voedt de match"
              tone={C.okInk}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Let op"
              tone={C.warnInk}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function RedenBlok({
  titel,
  tone,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div
      className="rounded-[14px] p-4"
      style={{ background: C.raise, border: `1px solid ${C.lineSoft}` }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: tone, ...body }}
      >
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            <Icon
              size={13}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: tone }}
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const toneHi = strong ? C.mossHi : C.thread;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82a56f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#241f18]"
        style={{
          color: C.inkSoft,
          border: `1px solid ${C.lineSoft}`,
          background: C.panelSoft,
          ...body,
        }}
      >
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Panel className="p-7 md:p-9" living seed={31}>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
            style={{ color: C.inkMute, border: `1px solid ${C.lineSoft}`, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
            style={{
              color: C.humusDeep,
              backgroundImage: `linear-gradient(135deg, ${C.mossHi}, ${C.moss})`,
              ...body,
            }}
          >
            <Sprout size={11} aria-hidden="true" /> {strong ? "Sterke match" : "Goede match"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[30px] font-semibold leading-[1.08] tracking-[-0.01em] md:text-[42px]"
          style={{ color: C.ink, ...serif }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <PrimaryButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
          <GhostButton>Bewaren</GhostButton>
        </div>
      </Panel>

      <Panel>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m, i) => (
            <div
              key={m.l}
              className="p-5"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.lineSoft}`,
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...body }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-semibold tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <section>
        <Eyebrow>Verklaarbare matching</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgelezen van je geverifieerde profiel — welke draden voeden deze match en waar de
          aandacht ligt, transparant en zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-6" seed={37}>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{ color: C.okInk, background: C.okWash, border: `1px solid ${C.ok}` }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.okInk, ...body }}
              >
                Voedt de match
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.okInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-6" seed={41}>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                style={{ color: C.warnInk, background: C.warnWash, border: `1px solid ${C.warn}` }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.warnInk, ...body }}
              >
                Let op
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.warnInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <div className="mt-4">
          <span className="text-[12px]" style={{ color: toneHi, ...body }}>
            Match {opdracht.match}% —{" "}
            {strong ? "sterk vertakt naar jouw profiel." : "goed vertakt naar jouw profiel."}
          </span>
        </div>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-6">
      <Panel className="p-7 md:p-9" living seed={47}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie · veilig bewaard</Eyebrow>
            <h1
              className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.01em]"
              style={{ color: C.ink, ...serif }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.mossHi }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} knopen zijn geverifieerd. Eén verloopt binnenkort
              en vraagt om vernieuwing. Documenten blijven versleuteld en privé bewaard.
            </p>
            <div className="mt-4 max-w-xs">
              <Meter value={ratio} tone={C.moss} />
            </div>
          </div>
          <span
            className="relative inline-flex h-24 w-24 items-center justify-center rounded-full"
            style={{ background: C.humusDeep, border: `1.5px solid ${C.moss}` }}
          >
            <span className="absolute inset-0 flex items-center justify-center opacity-90">
              <SporeNode size={90} tone={C.moss} value={ratio} />
            </span>
            <span className="relative flex flex-col items-center">
              <span
                className="text-[26px] font-semibold leading-none"
                style={{ color: C.mossHi, ...num }}
              >
                {ratio}
              </span>
              <span
                className="mt-1 text-[8px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...body }}
              >
                % op orde
              </span>
            </span>
          </span>
        </div>
      </Panel>

      <Panel>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-6 py-3.5 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: C.inkMute, ...body }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {CREDENTIALS.map((c, idx) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <li
                key={c.naam}
                style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#342d1e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#82a56f] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ background: st.wash, border: `1px solid ${st.tone}`, color: st.ink }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink, ...body }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.inkMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                  </span>
                  <span className="hidden sm:flex">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{
                        color: st.ink,
                        background: st.wash,
                        border: `1px solid ${st.tone}`,
                        ...body,
                      }}
                    >
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </span>
                  </span>
                  <span
                    className="hidden justify-self-end transition-transform motion-reduce:transition-none sm:block"
                    style={{
                      color: C.inkFaint,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                    aria-hidden="true"
                  >
                    <Plus size={15} />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-500 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5 sm:pl-[76px]">
                      <div
                        className="rounded-[14px] p-4"
                        style={{ background: C.raise, border: `1px solid ${C.lineSoft}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </PrimaryButton>
                          <GhostButton>Historie</GhostButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <div>
        <div className="mb-4">
          <Eyebrow tone={C.spore}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                  style={{
                    background: C.raise,
                    border: `1px solid ${C.lineSoft}`,
                    color: C.inkSoft,
                  }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold"
                  style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}` }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </Panel>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Acties · op volgorde van urgentie</Eyebrow>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]"
          style={{ color: C.ink, ...serif }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Rustig van boven naar beneden — zo blijft je netwerk gezond, verifieerbaar en betaald.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.moss;
          const ink = warn ? C.warnInk : C.mossHi;
          const wash = warn ? C.warnWash : C.mossWash;
          return (
            <li key={a.titel}>
              <Panel className="p-6" seed={60 + i * 5}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-[15px] font-bold"
                    style={{ background: wash, border: `1.5px solid ${tone}`, color: ink, ...num }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: ink, background: wash, border: `1px solid ${tone}`, ...body }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Sprout size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[19px] font-semibold leading-snug"
                      style={{ color: C.ink, ...serif }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <PrimaryButton>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </PrimaryButton>
                  </div>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): {
  ink: string;
  wash: string;
  tone: string;
  Icon: LucideIcon | null;
} {
  if (status === "Openstaand")
    return { ink: C.warnInk, wash: C.warnWash, tone: C.warn, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.okInk, wash: C.okWash, tone: C.ok, Icon: Check };
  return { ink: C.inkMute, wash: C.raise, tone: C.lineSoft, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen</Eyebrow>
          <h1
            className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.ink, ...serif }}
          >
            Facturen
          </h1>
        </div>
        <PrimaryButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s, i) => (
          <Panel key={s.l} className="p-6" seed={70 + i * 6}>
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, ...body }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.warnWash, color: C.warnInk }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[27px] font-semibold tracking-[-0.01em]"
              style={{ color: s.alarm ? C.warnInk : C.ink, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <Panel>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-6 pb-3 pt-5 sm:grid"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-semibold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.inkMute, ...body }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f, i) => {
            const ft = factuurTone(f.status);
            const acc = f.status === "Openstaand";
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[#342d1e] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-semibold"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-semibold sm:order-2"
                  style={{ color: C.ink, ...body }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11.5px] sm:order-3 sm:inline"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                    style={{
                      color: ft.ink,
                      background: ft.wash,
                      border: `1px solid ${ft.tone}`,
                      ...body,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-bold sm:order-5"
                  style={{ color: acc ? C.warnInk : C.ink, ...num }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-6 py-4"
          style={{ borderTop: `1px solid ${C.lineSoft}` }}
        >
          <span
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: C.inkMute, ...body }}
          >
            <Check size={12} aria-hidden="true" style={{ color: C.ok }} /> Totaal betaald
          </span>
          <span className="text-[20px] font-semibold" style={{ color: C.ink, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
