"use client";

// Concept 489 — "Koperdraad" · Koper op houtskool, techno-ambacht. Diep antraciet canvas met warme
// koper/brons-accenten, fijne circuit-/draadtracering die panelen verbindt, metallic gloed op de
// accenten en monospace voor technische labels. De verificatie-/matching-laag als een verbonden
// circuit — warm-technisch en premium, geen koud neon.

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  BadgeCheck,
  CircuitBoard,
  Clock,
  Cpu,
  FileText,
  Hexagon,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
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

// — Palet: houtskool-antraciet met warme koper/brons-gloed —
const C = {
  bg: "#121417",
  bgDeep: "#0d0f11",
  panel: "#191c20",
  panelSoft: "#1f2328",
  raise: "#23272d",
  ink: "#efe9e1",
  inkSoft: "#c3bcb1",
  inkMute: "#8b847a",
  inkFaint: "#5f5a52",
  line: "#2a2e34",
  lineSoft: "#22262b",

  copper: "#cf8a52",
  copperBright: "#e7a869",
  copperDeep: "#a5673a",
  copperSoft: "rgba(207,138,82,0.14)",
  copperLine: "rgba(207,138,82,0.30)",

  brass: "#c9a24a",
  brassSoft: "rgba(201,162,74,0.14)",

  jade: "#5fae86",
  jadeSoft: "rgba(95,174,134,0.14)",

  rust: "#cf6b52",
  rustSoft: "rgba(207,107,82,0.14)",

  steel: "#7fa6c9",
  steelSoft: "rgba(127,166,201,0.14)",
};

const mono = {
  fontFamily: "'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};
const body = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};

type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.jade,
        soft: C.jadeSoft,
        label: "Geverifieerd",
        Icon: BadgeCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return {
        base: C.steel,
        soft: C.steelSoft,
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
      };
    case "EXPIRING":
      return {
        base: C.brass,
        soft: C.brassSoft,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.rust, soft: C.rustSoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

const SCREEN_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: CircuitBoard,
  marktplaats: Search,
  opdracht: Cpu,
  verificatie: ShieldCheck,
  acties: Zap,
  facturen: Wallet,
  documenten: FileText,
  berichten: Activity,
};

// — Circuit-achtergrond: fijne koperdraad-tracering die het canvas verbindt —
function CircuitField() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1200 900"
    >
      <defs>
        <linearGradient id="kd-wire" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.copper} stopOpacity="0.5" />
          <stop offset="1" stopColor={C.copper} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#kd-wire)" strokeWidth="1">
        <path d="M-20 120 H 260 L 320 180 H 560 L 610 130 H 900" />
        <path d="M-20 320 H 180 L 240 260 H 470 L 520 310 H 760 L 820 250 H 1220" />
        <path d="M120 920 V 640 L 190 570 V 380 L 140 330 V 120" />
        <path d="M1040 -20 V 240 L 980 300 V 520 L 1040 580 V 920" />
        <path d="M-20 720 H 300 L 360 660 H 640 L 700 720 H 1220" />
        <path d="M760 920 V 700 L 700 640 V 460" />
      </g>
      <g fill={C.copper}>
        {[
          [260, 120],
          [560, 180],
          [610, 130],
          [180, 320],
          [470, 260],
          [760, 310],
          [190, 570],
          [980, 300],
          [1040, 580],
          [360, 660],
          [700, 720],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="2.4" opacity="0.5" />
        ))}
      </g>
    </svg>
  );
}

// — Metallic knop met koper-gloed —
function Btn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  ariaLabel,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "line";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  type?: "button" | "submit";
}) {
  const pad = size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-4 py-2.5 text-[13px]";
  const style: React.CSSProperties =
    variant === "primary"
      ? {
          background: `linear-gradient(180deg, ${C.copperBright} 0%, ${C.copper} 55%, ${C.copperDeep} 100%)`,
          color: "#1a1206",
          boxShadow: `0 0 0 1px ${C.copperDeep}, 0 6px 20px -8px ${C.copper}`,
        }
      : variant === "line"
        ? { background: "transparent", color: C.copperBright, border: `1px solid ${C.copperLine}` }
        : { background: C.raise, color: C.inkSoft, border: `1px solid ${C.line}` };
  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold tracking-[0.01em] transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7a869] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121417] ${pad} ${className}`}
      style={{ ...style, ...body }}
    >
      {children}
    </button>
  );
}

function Chip({
  children,
  tone = C.copper,
  soft = C.copperSoft,
  Icon,
}: {
  children: React.ReactNode;
  tone?: string;
  soft?: string;
  Icon?: LucideIcon;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
      style={{ color: tone, background: soft, border: `1px solid ${tone}33`, ...mono }}
    >
      {Icon && <Icon size={11} aria-hidden="true" />}
      {children}
    </span>
  );
}

// — Paneel met hoek-nodes (circuit-taal) —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  glow?: boolean;
}) {
  return (
    <Tag
      className={`relative rounded-lg ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: glow
          ? `inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px ${C.copperLine}, 0 18px 40px -26px ${C.copper}`
          : "inset 0 1px 0 rgba(255,255,255,0.03), 0 12px 30px -24px rgba(0,0,0,0.8)",
      }}
    >
      {children}
    </Tag>
  );
}

function Node({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const map: Record<string, string> = {
    tl: "-left-[3px] -top-[3px]",
    tr: "-right-[3px] -top-[3px]",
    bl: "-bottom-[3px] -left-[3px]",
    br: "-bottom-[3px] -right-[3px]",
  };
  return (
    <span
      aria-hidden="true"
      className={`absolute h-1.5 w-1.5 rounded-full ${map[pos]}`}
      style={{ background: C.copper, boxShadow: `0 0 6px ${C.copper}` }}
    />
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 96;
  const h = 30;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 3 - ((d - min) / span) * (h - 6)] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="1.2" fill={tone} opacity="0.4" />
      ))}
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.4" fill={C.bg} stroke={tone} strokeWidth="1.6" />
    </svg>
  );
}

function Meter({ value, tone }: { value: number; tone: string }) {
  const size = 52;
  const r = (size - 7) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.line} strokeWidth="3.5" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 3px ${tone})` }}
        />
      </svg>
      <span className="absolute text-[12px] font-bold" style={{ color: C.ink, ...mono }}>
        {value}
      </span>
    </span>
  );
}

function SectionHead({ children, Icon }: { children: React.ReactNode; Icon: LucideIcon }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon size={13} aria-hidden="true" style={{ color: C.copper }} />
      <h2
        className="text-[11px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: C.inkMute, ...mono }}
      >
        {children}
      </h2>
      <span className="h-px flex-1" style={{ background: C.line }} />
    </div>
  );
}

export function Concept489() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full overflow-hidden antialiased"
      style={{ ...body, color: C.ink, background: C.bg }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage: [
            `radial-gradient(52% 40% at 82% 2%, ${C.copperSoft} 0%, rgba(0,0,0,0) 70%)`,
            `radial-gradient(48% 38% at 4% 96%, rgba(201,162,74,0.08) 0%, rgba(0,0,0,0) 70%)`,
          ].join(","),
        }}
      />
      <CircuitField />

      <div className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="kd-fade pt-6">
          {screen === "dashboard" && (
            <Dashboard
              onOpen={() => setScreen("opdracht")}
              onMarkt={() => setScreen("marktplaats")}
              onActies={() => setScreen("acties")}
            />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties onMarkt={() => setScreen("marktplaats")} />}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>

      <style>{`
        @keyframes kdFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .kd-fade { animation: kdFade 0.34s ease both; }
        @media (prefers-reduced-motion: reduce) { .kd-fade { animation: none !important; } }
      `}</style>
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex items-center justify-between gap-4 py-5">
      <div className="flex items-center gap-3">
        <span
          className="relative flex h-10 w-10 items-center justify-center rounded-md"
          style={{
            background: `linear-gradient(180deg, ${C.copperBright}, ${C.copperDeep})`,
            color: "#1a1206",
            boxShadow: `0 0 18px -4px ${C.copper}`,
          }}
          aria-hidden="true"
        >
          <Hexagon size={19} strokeWidth={2.2} />
        </span>
        <div>
          <p
            className="text-[15px] font-bold leading-none tracking-[0.02em]"
            style={{ color: C.ink }}
          >
            Koperdraad
          </p>
          <p className="mt-1.5 text-[10.5px] leading-none" style={{ color: C.inkMute, ...mono }}>
            zzp-netwerk · verbonden
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 rounded px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] sm:inline-flex"
          style={{
            color: C.jade,
            background: C.jadeSoft,
            border: `1px solid ${C.jade}33`,
            ...mono,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md"
          style={{ background: C.raise, border: `1px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Activity size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.copper, color: "#1a1206", ...mono }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-md text-[11px] font-bold"
          style={{
            background: C.copperSoft,
            color: C.copperBright,
            border: `1px solid ${C.copperLine}`,
            ...mono,
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
    <nav aria-label="Hoofdnavigatie" className="border-y" style={{ borderColor: C.line }}>
      <div className="flex items-stretch gap-1 overflow-x-auto py-2">
        {SCREENS.map((s) => {
          const on = s.key === screen;
          const Icon = SCREEN_ICON[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative inline-flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7a869]"
              style={{
                color: on ? C.ink : C.inkMute,
                background: on ? C.panelSoft : "transparent",
                border: `1px solid ${on ? C.copperLine : "transparent"}`,
                ...mono,
              }}
            >
              <Icon size={14} aria-hidden="true" style={{ color: on ? C.copper : C.inkFaint }} />
              {s.label}
              {on && (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-[9px] left-3 right-3 h-[2px] rounded-full"
                  style={{ background: C.copper, boxShadow: `0 0 6px ${C.copper}` }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// —————————————————————————————————— Dashboard ——————————————————————————————————
function Dashboard({
  onOpen,
  onMarkt,
  onActies,
}: {
  onOpen: () => void;
  onMarkt: () => void;
  onActies: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="overflow-hidden p-6 md:p-7" glow>
          <Node pos="tl" />
          <Node pos="br" />
          <div className="flex items-center gap-2">
            <Chip Icon={Zap} tone={C.copperBright}>
              Systeem actief
            </Chip>
            <span className="text-[10.5px]" style={{ color: C.inkFaint, ...mono }}>
              {PROFIEL.plaats.toLowerCase()} · online
            </span>
          </div>
          <h1
            className="mt-4 text-[26px] font-bold leading-[1.1] tracking-[-0.01em] md:text-[32px]"
            style={{ color: C.ink }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-2.5 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Je profiel is verbonden en verifieerbaar. Er staan verse matches klaar en één schakel in
            je verificatie vraagt aandacht.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Btn variant="primary" onClick={onActies}>
              <Zap size={14} aria-hidden="true" /> Volgende actie
            </Btn>
            <Btn variant="line" onClick={onMarkt}>
              Naar marktplaats <ArrowRight size={14} aria-hidden="true" />
            </Btn>
          </div>
        </Panel>

        <Panel className="flex flex-col p-5" glow>
          <Node pos="tr" />
          <div className="flex items-center justify-between">
            <Chip Icon={AlertTriangle} tone={C.brass} soft={C.brassSoft}>
              Vraagt aandacht
            </Chip>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-md"
              style={{ background: C.brassSoft, color: C.brass }}
              aria-hidden="true"
            >
              <AlertTriangle size={15} />
            </span>
          </div>
          <h2 className="mt-3 text-[16px] font-bold leading-snug" style={{ color: C.ink }}>
            {primair.titel}
          </h2>
          <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <Btn variant="primary" className="mt-4 w-full" onClick={onActies}>
            {primair.cta} <ArrowRight size={14} aria-hidden="true" />
          </Btn>
          <p
            className="mt-3 flex items-center gap-2 border-t pt-3 text-[11px]"
            style={{ color: C.inkMute, borderColor: C.line, ...mono }}
          >
            <ShieldCheck size={13} aria-hidden="true" style={{ color: C.jade }} />
            {verified}/{CREDENTIALS.length} schakels geverifieerd · {ratio}%
          </p>
        </Panel>
      </section>

      <section>
        <SectionHead Icon={Activity}>Telemetrie · deze maand</SectionHead>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Panel key={k.label} className="p-4">
              <div className="flex items-start justify-between">
                <span
                  className="text-[10.5px] uppercase tracking-[0.1em]"
                  style={{ color: C.inkMute, ...mono }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold"
                  style={{ color: k.up ? C.jade : C.brass, ...mono }}
                >
                  {k.up ? (
                    <TrendingUp size={11} aria-hidden="true" />
                  ) : (
                    <TrendingDown size={11} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
              </div>
              <p
                className="mt-2 text-[24px] font-bold leading-none tracking-[-0.01em]"
                style={{ color: C.ink, ...mono }}
              >
                {k.value}
              </p>
              <div className="mt-2.5">
                <Spark data={k.spark} tone={k.up ? C.copper : C.brass} />
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <SectionHead Icon={CircuitBoard}>Matches op het netwerk</SectionHead>
            <button
              type="button"
              onClick={onMarkt}
              className="ml-3 shrink-0 rounded text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7a869]"
              style={{ color: C.copperBright, ...mono }}
            >
              alle →
            </button>
          </div>
          <ul className="space-y-2.5">
            {OPDRACHTEN.map((o) => (
              <li key={o.id}>
                <OpdrachtRow opdracht={o} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <SectionHead Icon={ShieldCheck}>Verificatie-circuit</SectionHead>
          <Panel className="p-2">
            <ul>
              {CREDENTIALS.map((c, i) => {
                const t = credTone(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 px-2 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                      style={{ background: t.soft, color: t.base, border: `1px solid ${t.base}33` }}
                      aria-hidden="true"
                    >
                      <t.Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="block truncate text-[10.5px]"
                        style={{ color: t.alarm ? t.base : C.inkMute, ...mono }}
                      >
                        {t.label}
                      </span>
                    </span>
                    {t.alarm && (
                      <AlertTriangle size={14} aria-hidden="true" style={{ color: t.base }} />
                    )}
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

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const tone = opdracht.match >= 90 ? C.jade : C.copper;
  return (
    <Panel as="article" className="overflow-hidden">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-4 p-3.5 text-left transition-colors hover:bg-[#1f2328] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e7a869]"
      >
        <Meter value={opdracht.match} tone={tone} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-bold" style={{ color: C.ink }}>
            {opdracht.titel}
          </span>
          <span
            className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
            style={{ color: C.inkMute }}
          >
            <MapPin size={11} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </span>
          <span
            className="mt-1 flex items-center gap-1.5 text-[11px]"
            style={{ color: C.jade, ...mono }}
          >
            <BadgeCheck size={12} aria-hidden="true" /> {opdracht.redenen.plus[0]}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="text-[13px] font-bold" style={{ color: C.ink, ...mono }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <ArrowRight size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
        </span>
      </button>
    </Panel>
  );
}

// —————————————————————————————————— Marktplaats ——————————————————————————————————
type Mode = "ok" | "loading" | "error";

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [mode, setMode] = useState<Mode>("ok");

  const filtered = useMemo(() => {
    const n = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-5">
      <div>
        <SectionHead Icon={Search}>Marktplaats</SectionHead>
        <h1
          className="text-[24px] font-bold leading-tight tracking-[-0.01em]"
          style={{ color: C.ink }}
        >
          Opdrachten op jouw circuit
        </h1>
        <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute, ...mono }}>
          {filtered.length}/{OPDRACHTEN.length} verbonden matches
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-md px-3.5 py-2.5"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#5f5a52]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[#23272d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7a869]"
              style={{ color: C.inkMute }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <Btn
              key={s}
              size="sm"
              variant={sort === s ? "primary" : "line"}
              onClick={() => setSort(s)}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Beste match" : "Tarief"}
            </Btn>
          ))}
        </div>
      </div>

      {mode === "loading" ? (
        <ul className="space-y-2.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="p-4">
                <div className="flex items-center gap-4">
                  <div
                    className="h-13 w-13 shrink-0 animate-pulse rounded-full motion-reduce:animate-none"
                    style={{ background: C.raise, width: 52, height: 52 }}
                  />
                  <div className="flex-1 space-y-2.5">
                    <div
                      className="h-3.5 w-2/3 animate-pulse rounded motion-reduce:animate-none"
                      style={{ background: C.raise }}
                    />
                    <div
                      className="h-3 w-1/2 animate-pulse rounded motion-reduce:animate-none"
                      style={{ background: C.raise }}
                    />
                  </div>
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={AlertTriangle}
          tone={C.rust}
          soft={C.rustSoft}
          titel="Verbinding verbroken"
          tekst="De opdrachten konden niet worden opgehaald. Controleer de verbinding en probeer opnieuw."
          cta="Opnieuw verbinden"
          onCta={() => setMode("ok")}
        />
      ) : filtered.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.copper}
          soft={C.copperSoft}
          titel="Geen match gevonden"
          tekst={`Geen opdracht voor ${q ? `“${q}”` : "je zoekterm"}. Pas je filter aan of wis de zoekterm.`}
          cta="Zoekterm wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-center gap-4 pt-1">
        {(["loading", "error"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className="rounded text-[10.5px] uppercase tracking-[0.08em] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7a869]"
            style={{ color: C.inkFaint, ...mono }}
          >
            {m === "loading" ? "laadstaat" : "foutstaat"}
          </button>
        ))}
      </div>
    </div>
  );
}

function StateBlock({
  Icon,
  tone,
  soft,
  titel,
  tekst,
  cta,
  onCta,
}: {
  Icon: LucideIcon;
  tone: string;
  soft: string;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <Panel className="flex flex-col items-center px-6 py-14 text-center">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-lg"
        style={{ background: soft, color: tone, border: `1px solid ${tone}33` }}
        aria-hidden="true"
      >
        <Icon size={24} />
      </span>
      <p className="mt-4 text-[17px] font-bold" style={{ color: C.ink }}>
        {titel}
      </p>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
        {tekst}
      </p>
      <Btn variant="line" className="mt-5" onClick={onCta}>
        <RefreshCw size={13} aria-hidden="true" /> {cta}
      </Btn>
    </Panel>
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
  const tone = strong ? C.jade : C.copper;
  const soft = strong ? C.jadeSoft : C.copperSoft;
  return (
    <Panel as="article" className="p-4">
      <div className="flex items-start gap-4">
        <Meter value={opdracht.match} tone={tone} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Chip Icon={strong ? Zap : Activity} tone={tone} soft={soft}>
              {strong ? "Sterke match" : "Goede match"}
            </Chip>
            <span className="text-[10.5px]" style={{ color: C.inkFaint, ...mono }}>
              #{String(index + 1).padStart(2, "0")} · {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[15.5px] font-bold leading-snug" style={{ color: C.ink }}>
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded px-2 py-0.5 text-[10.5px]"
                style={{
                  background: C.raise,
                  color: C.inkSoft,
                  border: `1px solid ${C.line}`,
                  ...mono,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="shrink-0 text-[14px] font-bold" style={{ color: C.ink, ...mono }}>
          {opdracht.tarief.replace(" / uur", "")}
        </span>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7a869]"
          style={{
            color: C.copperBright,
            background: C.copperSoft,
            border: `1px solid ${C.copperLine}`,
          }}
        >
          {open ? (
            <X size={12} aria-hidden="true" />
          ) : (
            <CircuitBoard size={12} aria-hidden="true" />
          )}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn variant="primary" onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </Btn>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="Verbindingen in je voordeel"
              tone={C.jade}
              soft={C.jadeSoft}
              Icon={BadgeCheck}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Let op deze schakels"
              tone={C.brass}
              soft={C.brassSoft}
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
  soft,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  soft: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div className="rounded-md p-3.5" style={{ background: soft, border: `1px solid ${tone}22` }}>
      <p
        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: tone, ...mono }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            <span
              className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
              style={{ background: tone }}
              aria-hidden="true"
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————— Opdracht-detail ——————————————————————————————————
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.jade : C.copper;
  return (
    <div className="space-y-5">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </Btn>

      <Panel className="overflow-hidden p-6 md:p-7" glow>
        <Node pos="tl" />
        <Node pos="br" />
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded px-2 py-0.5 text-[10.5px] font-semibold"
            style={{
              background: C.raise,
              color: C.inkSoft,
              border: `1px solid ${C.line}`,
              ...mono,
            }}
          >
            {opdracht.id}
          </span>
          <Chip Icon={Zap} tone={tone} soft={strong ? C.jadeSoft : C.copperSoft}>
            {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
          </Chip>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[24px] font-bold leading-[1.12] tracking-[-0.01em] md:text-[30px]"
          style={{ color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 flex items-center gap-1.5 text-[13px]" style={{ color: C.inkMute }}>
          <MapPin size={13} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Btn variant="primary">
            <Zap size={14} aria-hidden="true" /> Reageer op opdracht
          </Btn>
          <Btn variant="line">Bewaren</Btn>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, Icon: Wallet },
          { l: "Omvang", v: opdracht.uren, Icon: Clock },
          { l: "Start", v: opdracht.start, Icon: Activity },
          { l: "Match", v: `${opdracht.match}%`, Icon: Cpu },
        ].map((m) => (
          <Panel key={m.l} className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-md"
              style={{
                background: C.copperSoft,
                color: C.copper,
                border: `1px solid ${C.copperLine}`,
              }}
              aria-hidden="true"
            >
              <m.Icon size={14} />
            </span>
            <p
              className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.inkMute, ...mono }}
            >
              {m.l}
            </p>
            <p
              className="mt-1 text-[17px] font-bold tracking-[-0.01em]"
              style={{ color: C.ink, ...mono }}
            >
              {m.v}
            </p>
          </Panel>
        ))}
      </div>

      <section>
        <SectionHead Icon={CircuitBoard}>Verklaarbare match</SectionHead>
        <p className="mb-4 max-w-xl text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je geverifieerde profiel — transparant, zonder verborgen score. Wat in je
          voordeel spreekt én wat je moet weten.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Panel className="p-5">
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.jade, ...mono }}
            >
              <BadgeCheck size={14} aria-hidden="true" /> In jouw voordeel
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: C.jade, boxShadow: `0 0 5px ${C.jade}` }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-5">
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.brass, ...mono }}
            >
              <AlertTriangle size={14} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-3.5 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: C.brass, boxShadow: `0 0 5px ${C.brass}` }}
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </section>
    </div>
  );
}

// —————————————————————————————————— Verificatie ——————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <Panel className="overflow-hidden p-6 md:p-7" glow>
        <Node pos="tl" />
        <Node pos="tr" />
        <Node pos="bl" />
        <Node pos="br" />
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Chip Icon={ShieldCheck} tone={C.jade} soft={C.jadeSoft}>
              Vertrouwensniveau
            </Chip>
            <h1
              className="mt-2.5 text-[24px] font-bold leading-tight tracking-[-0.01em]"
              style={{ color: C.ink }}
            >
              {PROFIEL.trust}
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
              {verified} van de {CREDENTIALS.length} schakels zijn geverifieerd. Eén verloopt bijna
              — op tijd vernieuwen houdt het circuit gesloten. Je documenten blijven versleuteld en
              privé.
            </p>
          </div>
          <Meter value={ratio} tone={C.copper} />
        </div>
        <div
          className="mt-5 h-2 w-full overflow-hidden rounded-full"
          style={{ background: C.raise }}
          aria-hidden="true"
        >
          <span
            className="block h-full rounded-full"
            style={{
              width: `${ratio}%`,
              background: `linear-gradient(90deg, ${C.copperDeep}, ${C.copperBright})`,
              boxShadow: `0 0 8px ${C.copper}`,
              transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        </div>
      </Panel>

      <div>
        <SectionHead Icon={BadgeCheck}>Certificaten</SectionHead>
        <Panel className="overflow-hidden">
          <ul>
            {CREDENTIALS.map((c, i) => {
              const t = credTone(c.status);
              const isOpen = open === c.naam;
              return (
                <li
                  key={c.naam}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#1f2328] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e7a869]"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                      style={{ background: t.soft, color: t.base, border: `1px solid ${t.base}33` }}
                      aria-hidden="true"
                    >
                      <t.Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13.5px] font-bold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11px]"
                        style={{ color: C.inkMute, ...mono }}
                      >
                        {c.detail}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="hidden sm:inline-flex">
                        <Chip tone={t.base} soft={t.soft} Icon={t.Icon}>
                          {t.label}
                          {t.alarm && <span className="sr-only"> (let op)</span>}
                        </Chip>
                      </span>
                      <ArrowRight
                        size={15}
                        aria-hidden="true"
                        className="transition-transform motion-reduce:transition-none"
                        style={{ color: C.inkFaint, transform: isOpen ? "rotate(90deg)" : "none" }}
                      />
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-300 motion-reduce:transition-none"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div className="px-4 pb-4 sm:pl-[72px]">
                        <div
                          className="rounded-md p-4"
                          style={{ background: C.panelSoft, border: `1px solid ${C.line}` }}
                        >
                          <p
                            className="max-w-xl text-[12.5px] leading-relaxed"
                            style={{ color: C.inkSoft }}
                          >
                            {c.detail}. Het document wordt versleuteld bewaard en alleen na jouw
                            toestemming gedeeld met een opdrachtgever.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Btn size="sm" variant="primary">
                              {c.status === "EXPIRING"
                                ? "Vernieuwen"
                                : c.status === "REJECTED"
                                  ? "Opnieuw indienen"
                                  : "Bekijken"}
                            </Btn>
                            <Btn size="sm" variant="line">
                              Historie
                            </Btn>
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
      </div>

      <div>
        <SectionHead Icon={FileText}>Documentenkast</SectionHead>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const t = credTone(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3 p-3.5">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                  style={{ background: C.raise, color: C.inkSoft, border: `1px solid ${C.line}` }}
                  aria-hidden="true"
                >
                  <FileText size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[12.5px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[10px]" style={{ color: C.inkMute, ...mono }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <Chip tone={t.base} soft={t.soft} Icon={t.Icon}>
                  {t.label}
                </Chip>
              </Panel>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// —————————————————————————————————— Acties ——————————————————————————————————
function Acties({ onMarkt }: { onMarkt: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <SectionHead Icon={Zap}>Acties · op urgentie</SectionHead>
        <h1
          className="text-[24px] font-bold leading-tight tracking-[-0.01em]"
          style={{ color: C.ink }}
        >
          Wat je circuit nu nodig heeft
        </h1>
        <p className="mt-1 max-w-md text-[13px]" style={{ color: C.inkSoft }}>
          Van boven naar beneden afwerken — één schakel tegelijk.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.brass : C.copper;
          const soft = warn ? C.brassSoft : C.copperSoft;
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel}>
              <Panel className="p-4">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-md text-[14px] font-bold"
                    style={{
                      background: soft,
                      color: tone,
                      border: `1px solid ${tone}33`,
                      ...mono,
                    }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <Chip Icon={warn ? AlertTriangle : Zap} tone={tone} soft={soft}>
                      {warn ? "Urgent" : "Aanbevolen"}
                    </Chip>
                    <h2
                      className="mt-2 text-[15.5px] font-bold leading-snug"
                      style={{ color: C.ink }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <Btn
                      variant={warn ? "primary" : "line"}
                      onClick={goMarkt ? onMarkt : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
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

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurTone(status: string): { base: string; soft: string } {
  if (status === "Betaald") return { base: C.jade, soft: C.jadeSoft };
  if (status === "Openstaand") return { base: C.brass, soft: C.brassSoft };
  if (status === "Concept") return { base: C.steel, soft: C.steelSoft };
  return { base: C.copper, soft: C.copperSoft };
}

function Facturen() {
  const [sort, setSort] = useState<"datum" | "bedrag">("datum");
  const rows = useMemo(() => {
    if (sort === "datum") return FACTUREN;
    return [...FACTUREN].sort(
      (a, b) =>
        parseInt(b.bedrag.replace(/\D/g, ""), 10) - parseInt(a.bedrag.replace(/\D/g, ""), 10),
    );
  }, [sort]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionHead Icon={Wallet}>Facturen</SectionHead>
          <h1
            className="text-[24px] font-bold leading-tight tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            Facturenstroom
          </h1>
        </div>
        <Btn variant="primary">
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </Btn>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            l: "Betaald",
            v: "€ 5.552",
            sub: "2 facturen",
            tone: C.jade,
            soft: C.jadeSoft,
            Icon: BadgeCheck,
          },
          {
            l: "Openstaand",
            v: "€ 1.350",
            sub: "1 factuur · 9 dagen",
            tone: C.brass,
            soft: C.brassSoft,
            Icon: Clock,
          },
          {
            l: "Concept",
            v: "€ 880",
            sub: "klaar om te versturen",
            tone: C.steel,
            soft: C.steelSoft,
            Icon: FileText,
          },
        ].map((s) => (
          <Panel key={s.l} className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-md"
                style={{ background: s.soft, color: s.tone, border: `1px solid ${s.tone}33` }}
                aria-hidden="true"
              >
                <s.Icon size={15} />
              </span>
              <Chip tone={s.tone} soft={s.soft}>
                {s.l}
              </Chip>
            </div>
            <p
              className="mt-3 text-[22px] font-bold tracking-[-0.01em]"
              style={{ color: C.ink, ...mono }}
            >
              {s.v}
            </p>
            <p className="mt-0.5 text-[11px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Btn
            key={s}
            size="sm"
            variant={sort === s ? "primary" : "line"}
            onClick={() => setSort(s)}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Btn>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <table className="w-full text-left">
          <caption className="sr-only">Overzicht van facturen</caption>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.inkMute, ...mono }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((f, i) => {
              const t = factuurTone(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[#1f2328]"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <td className="px-4 py-3 text-[12px]" style={{ color: C.inkSoft, ...mono }}>
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: C.inkMute, ...mono }}>
                    {f.datum}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold" style={{ color: C.ink, ...mono }}>
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3">
                    <Chip tone={t.base} soft={t.soft}>
                      {f.status}
                    </Chip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
