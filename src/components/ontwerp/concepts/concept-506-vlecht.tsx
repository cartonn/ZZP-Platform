"use client";

// Concept 506 — "Vlecht" · Levend, motion-gedreven dashboard. Data als stroom: animerende
// connective threads (SVG-lijnen) verbinden gerelateerde datapunten, nodes pulseren zacht en
// cijfers tickeren rustig omhoog bij binnenkomst. Subtiel en performant — nooit storend, en met
// volledige eerbied voor prefers-reduced-motion. Status altijd met label + icoon, niet enkel kleur.

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Waypoints,
  X,
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

// — Palet: middernacht-teal met gloeiende cyaan/violet stroomdraden —
const C = {
  bg: "#061218",
  panel: "rgba(17,38,46,0.72)",
  panelUp: "rgba(23,48,58,0.86)",
  line: "rgba(90,214,201,0.18)",
  lineSoft: "rgba(90,214,201,0.1)",

  ink: "#e9f6f5",
  inkSoft: "#b6d0cf",
  inkMute: "#82a2a2",
  inkFaint: "#5c7a7c",

  cyan: "#34d6c9",
  cyanDeep: "#18b5aa",
  violet: "#8b7cf0",
  teal: "#2fb6c9",
  emerald: "#37d69a",
  amber: "#eab54a",
  rose: "#f0728a",
};

const sans = {
  fontFamily:
    "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const num = { ...sans, fontVariantNumeric: "tabular-nums" as const };

type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.emerald,
        soft: "rgba(55,214,154,0.14)",
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return {
        base: C.teal,
        soft: "rgba(47,182,201,0.14)",
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
      };
    case "EXPIRING":
      return {
        base: C.amber,
        soft: "rgba(234,181,74,0.16)",
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return {
        base: C.rose,
        soft: "rgba(240,114,138,0.16)",
        label: "Afgewezen",
        Icon: X,
        alarm: true,
      };
  }
}

// — prefers-reduced-motion detector —
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

// — Zacht tickerend cijfer: telt bij binnenkomst op naar de doelwaarde, met NL-groepering —
function Tick({
  value,
  className = "",
  style,
}: {
  value: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduced = useReducedMotion();
  const parsed = useMemo(() => {
    const m = value.match(/^(\D*)([\d.,]+)(.*)$/);
    if (!m || !m[2]) return null;
    const target = parseInt(m[2].replace(/[^\d]/g, ""), 10);
    if (!Number.isFinite(target)) return null;
    return { prefix: m[1] ?? "", suffix: m[3] ?? "", target };
  }, [value]);
  const [display, setDisplay] = useState(() => (parsed ? parsed.target : 0));

  useEffect(() => {
    if (!parsed) return;
    if (reduced) {
      setDisplay(parsed.target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 900;
    const tickFrame = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(parsed.target * eased));
      if (p < 1) raf = requestAnimationFrame(tickFrame);
    };
    setDisplay(0);
    raf = requestAnimationFrame(tickFrame);
    return () => cancelAnimationFrame(raf);
  }, [parsed, reduced]);

  if (!parsed) {
    return (
      <span className={className} style={{ ...num, ...style }}>
        {value}
      </span>
    );
  }
  return (
    <span className={className} style={{ ...num, ...style }}>
      {parsed.prefix}
      {display.toLocaleString("nl-NL")}
      {parsed.suffix}
    </span>
  );
}

// — Gloeiend paneel met glasachtige rand —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  tone = "panel",
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  tone?: "panel" | "up";
  interactive?: boolean;
}) {
  const bg = tone === "up" ? C.panelUp : C.panel;
  return (
    <Tag
      className={`rounded-[18px] ${interactive ? "vl-lift" : ""} ${className}`}
      style={{
        background: bg,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${C.line}`,
        boxShadow:
          tone === "up"
            ? "0 24px 60px -30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(90,214,201,0.08)"
            : "0 18px 44px -28px rgba(0,0,0,0.6), inset 0 1px 0 rgba(90,214,201,0.05)",
      }}
    >
      {children}
    </Tag>
  );
}

function Btn({
  children,
  onClick,
  variant = "solid",
  size = "md",
  className = "",
  ariaLabel,
  ariaExpanded,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
}) {
  const pad = size === "sm" ? "px-4 py-1.5 text-[12.5px]" : "px-5 py-2.5 text-[13.5px]";
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34d6c9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061218]";
  if (variant === "solid") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        aria-expanded={ariaExpanded}
        className={`${base} ${pad} hover:-translate-y-0.5 hover:brightness-110 ${className}`}
        style={{
          background: `linear-gradient(135deg, ${C.cyan}, ${C.teal})`,
          color: "#04231f",
          boxShadow: "0 12px 28px -12px rgba(52,214,201,0.7), inset 0 1px 0 rgba(255,255,255,0.28)",
          ...sans,
        }}
      >
        {children}
      </button>
    );
  }
  const style: React.CSSProperties =
    variant === "outline"
      ? { background: "rgba(52,214,201,0.06)", color: C.ink, border: `1px solid ${C.line}` }
      : { background: "transparent", color: C.inkMute, border: "1px solid transparent" };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`${base} ${pad} hover:-translate-y-0.5 hover:text-[#e9f6f5] ${className}`}
      style={{ ...style, ...sans }}
    >
      {children}
    </button>
  );
}

function StatusPill({ base, soft, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
      style={{ color: base, background: soft, border: `1px solid ${base}44` }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// — Node met pulserende halo, kern-punt en match-getal —
function MatchNode({ value, size = 56 }: { value: number; size?: number }) {
  const strong = value >= 90;
  const tone = strong ? C.emerald : C.cyan;
  const r = (size - 6) / 2;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - value / 100);
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`Match ${value} procent`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(90,214,201,0.16)" strokeWidth="3" />
        <circle
          className="vl-node-halo"
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="3"
          opacity="0.4"
        />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-semibold leading-none"
          style={{ color: tone, fontSize: size * 0.31, ...num }}
        >
          {value}
        </span>
        <span
          className="mt-0.5 uppercase tracking-[0.12em]"
          style={{ color: C.inkFaint, fontSize: size * 0.13 }}
        >
          match
        </span>
      </span>
    </span>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 92;
  const h = 28;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 2 - ((d - min) / span) * (h - 4)] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  const gid = useMemo(() => `vl-spark-${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.34" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle className="vl-tip" cx={last[0]} cy={last[1]} r="2.4" fill={tone} />
    </svg>
  );
}

// — De signatuur: een datastroom-constellatie met stromende threads + pulserende nodes —
function FlowConstellation() {
  const nodes = [
    { x: 70, y: 66, tone: C.cyan, label: "Match", v: "92%" },
    { x: 236, y: 150, tone: C.violet, label: "Reacties", v: "7" },
    { x: 404, y: 58, tone: C.emerald, label: "Omzet", v: "€ 8.240" },
    { x: 566, y: 154, tone: C.amber, label: "Te fact.", v: "€ 1.350" },
  ] as const;
  const threads: { d: string; tone: string; dur: string; delay: string; faint?: boolean }[] = [
    { d: "M70 66 C 150 66, 156 150, 236 150", tone: C.cyan, dur: "3.2s", delay: "0s" },
    { d: "M236 150 C 316 150, 324 58, 404 58", tone: C.violet, dur: "3.6s", delay: "0.4s" },
    { d: "M404 58 C 484 58, 486 154, 566 154", tone: C.emerald, dur: "3.4s", delay: "0.8s" },
    { d: "M70 66 C 220 20, 300 20, 404 58", tone: C.teal, dur: "5s", delay: "0.2s", faint: true },
    {
      d: "M236 150 C 380 200, 460 200, 566 154",
      tone: C.amber,
      dur: "5.4s",
      delay: "0.6s",
      faint: true,
    },
  ];
  return (
    <svg
      viewBox="0 0 636 220"
      className="h-auto w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Datastroom: match 92 procent, 7 open reacties, omzet 8.240 euro, 1.350 euro te factureren."
    >
      {threads.map((t, i) => (
        <path
          key={i}
          d={t.d}
          fill="none"
          stroke={t.tone}
          strokeWidth={t.faint ? 1 : 1.6}
          strokeLinecap="round"
          opacity={t.faint ? 0.28 : 0.6}
          className="vl-thread"
          style={{ animationDuration: t.dur, animationDelay: t.delay }}
        />
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle
            className="vl-pulse"
            cx={n.x}
            cy={n.y}
            r="10"
            fill="none"
            stroke={n.tone}
            strokeWidth="1.4"
            style={{ animationDelay: `${i * 0.5}s` }}
          />
          <circle cx={n.x} cy={n.y} r="6" fill={n.tone} opacity="0.9" />
          <circle cx={n.x} cy={n.y} r="2.5" fill="#04231f" />
          <text
            x={n.x}
            y={n.y - 18}
            textAnchor="middle"
            fill={C.inkMute}
            style={{ ...sans, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            {n.label}
          </text>
          <text
            x={n.x}
            y={n.y + 30}
            textAnchor="middle"
            fill={C.ink}
            style={{ ...num, fontSize: 15, fontWeight: 600 }}
          >
            {n.v}
          </text>
        </g>
      ))}
    </svg>
  );
}

// — Achtergrond-threadveld: rustige stromende lijnen over de gehele backdrop —
function ThreadField() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      viewBox="0 0 1200 800"
    >
      {[
        { d: "M-40 120 C 300 60, 500 260, 900 180 S 1300 120, 1300 220", tone: C.cyan, dur: "9s" },
        {
          d: "M-40 420 C 260 520, 620 340, 900 460 S 1280 520, 1300 440",
          tone: C.violet,
          dur: "11s",
        },
        {
          d: "M-40 660 C 320 600, 560 740, 940 640 S 1280 700, 1300 640",
          tone: C.teal,
          dur: "13s",
        },
      ].map((t, i) => (
        <path
          key={i}
          d={t.d}
          fill="none"
          stroke={t.tone}
          strokeWidth="1.2"
          opacity="0.14"
          className="vl-thread"
          style={{ animationDuration: t.dur }}
        />
      ))}
    </svg>
  );
}

function Eyebrow({ children, tone = C.cyan }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]"
      style={{ color: tone }}
    >
      {children}
    </span>
  );
}

function SectionHead({
  over,
  children,
  right,
}: {
  over: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <Eyebrow>
          <Activity size={12} aria-hidden="true" /> {over}
        </Eyebrow>
        <h2
          className="mt-1.5 text-[21px] font-semibold leading-tight tracking-[-0.015em]"
          style={{ color: C.ink }}
        >
          {children}
        </h2>
      </div>
      {right}
    </div>
  );
}

// —————————————————————————————————— Root ——————————————————————————————————
export function Concept506() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full overflow-hidden antialiased"
      style={{
        ...sans,
        color: C.ink,
        background: `radial-gradient(120% 90% at 80% -10%, #0c2530 0%, ${C.bg} 55%, #030a0e 100%)`,
      }}
    >
      <ThreadField />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span
          className="absolute h-[40vw] w-[40vw] rounded-full"
          style={{
            top: "-14%",
            right: "-6%",
            background: "radial-gradient(circle, rgba(52,214,201,0.16), rgba(52,214,201,0) 70%)",
            filter: "blur(20px)",
          }}
        />
        <span
          className="absolute h-[34vw] w-[34vw] rounded-full"
          style={{
            bottom: "-16%",
            left: "-8%",
            background: "radial-gradient(circle, rgba(139,124,240,0.14), rgba(139,124,240,0) 70%)",
            filter: "blur(22px)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-20 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="vl-fade pt-6">
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
        .vl-lift { transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease, border-color 0.25s ease; }
        .vl-lift:hover { transform: translateY(-3px); border-color: rgba(90,214,201,0.5); box-shadow: 0 30px 68px -28px rgba(0,0,0,0.7), 0 0 0 1px rgba(52,214,201,0.16); }
        @keyframes vlFlow { to { stroke-dashoffset: -240; } }
        .vl-thread { stroke-dasharray: 5 13; animation: vlFlow 3.4s linear infinite; }
        @keyframes vlPulse { 0% { transform: scale(0.7); opacity: 0.7; } 70% { transform: scale(1.8); opacity: 0; } 100% { transform: scale(1.8); opacity: 0; } }
        .vl-pulse { transform-box: fill-box; transform-origin: center; animation: vlPulse 2.8s ease-out infinite; }
        @keyframes vlHalo { 0%,100% { opacity: 0.15; } 50% { opacity: 0.5; } }
        .vl-node-halo { animation: vlHalo 2.6s ease-in-out infinite; }
        @keyframes vlTip { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        .vl-tip { animation: vlTip 2.2s ease-in-out infinite; }
        @keyframes vlFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .vl-fade { animation: vlFade 0.42s cubic-bezier(0.22,1,0.36,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .vl-lift, .vl-fade, .vl-thread, .vl-pulse, .vl-node-halo, .vl-tip { animation: none !important; transition: none !important; }
          .vl-lift:hover { transform: none; }
          .vl-thread { stroke-dasharray: none; }
          .vl-pulse { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex flex-wrap items-center gap-4 pt-6">
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-[15px]"
          style={{
            background: `linear-gradient(135deg, ${C.cyan}, ${C.violet})`,
            color: "#04231f",
            boxShadow:
              "0 12px 26px -10px rgba(52,214,201,0.7), inset 0 1px 0 rgba(255,255,255,0.3)",
          }}
          aria-hidden="true"
        >
          <Waypoints size={20} />
        </span>
        <div>
          <p
            className="text-[18px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            Vlecht
          </p>
          <p className="mt-1.5 text-[11.5px]" style={{ color: C.inkMute }}>
            {PROFIEL.naam} · {PROFIEL.rol}
          </p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold sm:inline-flex"
          style={{
            color: C.emerald,
            background: "rgba(55,214,154,0.12)",
            border: `1px solid ${C.emerald}44`,
          }}
        >
          <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="relative flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.inkSoft }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9.5px] font-bold"
              style={{ background: C.rose, color: "#1a0710" }}
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-[12.5px] font-semibold"
          style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.ink }}
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
    <nav aria-label="Hoofdnavigatie" className="mt-5">
      <div
        className="flex flex-wrap items-center gap-1 overflow-x-auto rounded-full p-1.5"
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34d6c9]"
              style={
                on
                  ? {
                      color: "#04231f",
                      background: `linear-gradient(135deg, ${C.cyan}, ${C.teal})`,
                      boxShadow: "0 8px 20px -8px rgba(52,214,201,0.7)",
                    }
                  : { color: C.inkMute }
              }
            >
              {s.label}
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
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.7fr_1fr]">
        <div>
          <Eyebrow>
            <Activity size={12} aria-hidden="true" /> Datastroom · live
          </Eyebrow>
          <h1
            className="mt-2 text-[30px] font-semibold leading-[1.08] tracking-[-0.02em] md:text-[38px]"
            style={{ color: C.ink }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Je gegevens stromen binnen. Verse opdrachten sluiten aan op je profiel en één document
            vraagt binnenkort om aandacht.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Btn variant="solid" onClick={onActies}>
              Volgende actie <ArrowRight size={14} aria-hidden="true" />
            </Btn>
            <Btn variant="outline" onClick={onMarkt}>
              Naar marktplaats
            </Btn>
          </div>

          <Panel className="mt-6 p-4 sm:p-5">
            <div className="mb-1 flex items-center justify-between">
              <Eyebrow tone={C.inkMute}>Verbonden datapunten</Eyebrow>
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold"
                style={{ color: C.cyan }}
              >
                <span
                  className="vl-tip inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: C.cyan }}
                />
                stromend
              </span>
            </div>
            <FlowConstellation />
          </Panel>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {KPIS.map((k, i) => {
              const tone = i === 3 ? C.amber : i === 1 ? C.violet : i === 2 ? C.emerald : C.cyan;
              return (
                <Panel key={k.label} interactive className="p-4">
                  <p
                    className="text-[10.5px] uppercase tracking-[0.1em]"
                    style={{ color: C.inkMute }}
                  >
                    {k.label}
                  </p>
                  <Tick
                    value={k.value}
                    className="mt-1.5 block text-[22px] font-semibold leading-none"
                    style={{ color: C.ink }}
                  />
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <span
                      className="text-[11.5px] font-semibold"
                      style={{ color: k.up ? C.emerald : C.amber, ...num }}
                    >
                      {k.up ? "▲" : "▼"} {k.trend}
                    </span>
                    <Spark data={k.spark} tone={tone} />
                  </div>
                </Panel>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <Panel interactive tone="up" className="p-5">
            <div className="flex items-center gap-2" style={{ color: C.amber }}>
              <AlertTriangle size={15} aria-hidden="true" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
                Termijn nadert
              </span>
            </div>
            <h3 className="mt-2.5 text-[16px] font-semibold leading-snug" style={{ color: C.ink }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" className="mt-4 w-full" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Panel>

          <Panel interactive className="p-5">
            <Eyebrow tone={C.emerald}>
              <ShieldCheck size={12} aria-hidden="true" /> Vertrouwen
            </Eyebrow>
            <div className="mt-2 flex items-baseline gap-2">
              <Tick
                value={`${ratio}%`}
                className="text-[34px] font-semibold leading-none"
                style={{ color: C.ink }}
              />
              <span className="text-[12.5px]" style={{ color: C.inkMute }}>
                dossier op orde
              </span>
            </div>
            <div
              className="mt-3 h-2 w-full overflow-hidden rounded-full"
              style={{ background: "rgba(90,214,201,0.14)" }}
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${ratio}%`,
                  background: `linear-gradient(90deg, ${C.emerald}, ${C.cyan})`,
                  transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </div>
            <p className="mt-2 text-[12px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd.
            </p>
          </Panel>
        </aside>
      </section>

      <section>
        <SectionHead
          over="Aanbevolen"
          right={
            <button
              type="button"
              onClick={onMarkt}
              className="rounded-full text-[12.5px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34d6c9]"
              style={{ color: C.cyan }}
            >
              Volledige lijst →
            </button>
          }
        >
          Opdrachten voor jou
        </SectionHead>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <OpdrachtRow opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionHead over="Register">Je certificaten</SectionHead>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            return (
              <Panel key={c.naam} interactive className="flex items-center gap-3 p-3.5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px]"
                  style={{ background: t.soft, color: t.base, border: `1px solid ${t.base}33` }}
                  aria-hidden="true"
                >
                  <t.Icon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[14px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {c.naam}
                  </span>
                  <span
                    className="block truncate text-[11.5px]"
                    style={{ color: t.alarm ? t.base : C.inkMute }}
                  >
                    {c.detail}
                  </span>
                </span>
              </Panel>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  return (
    <Panel interactive as="article">
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#34d6c9]"
      >
        <MatchNode value={opdracht.match} size={52} />
        <span className="min-w-0 flex-1">
          <span
            className="block truncate text-[15.5px] font-semibold leading-snug"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </span>
          <span
            className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px]"
            style={{ color: C.inkMute }}
          >
            <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats} ·{" "}
            {opdracht.uren}
          </span>
        </span>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[15px] font-semibold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span className="text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.inkFaint }}>
            per uur
          </span>
        </span>
        <ChevronRight
          size={18}
          aria-hidden="true"
          className="shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: C.cyan }}
        />
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
        <Eyebrow>
          <Activity size={12} aria-hidden="true" /> Marktplaats
        </Eyebrow>
        <h1
          className="mt-1.5 text-[27px] font-semibold leading-tight tracking-[-0.015em]"
          style={{ color: C.ink }}
        >
          Opdrachten die bij je passen
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: C.inkMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten sluiten aan op je profiel.
        </p>
      </div>

      <Panel className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-2.5"
          style={{ background: "rgba(6,18,24,0.6)", border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.cyan }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#5c7a7c]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[rgba(52,214,201,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34d6c9]"
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
              variant={sort === s ? "solid" : "ghost"}
              onClick={() => setSort(s)}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </Btn>
          ))}
        </div>
      </Panel>

      {mode === "loading" ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="p-5">
                <div className="space-y-3">
                  <div
                    className="h-4 w-2/3 animate-pulse rounded-full motion-reduce:animate-none"
                    style={{ background: "rgba(90,214,201,0.12)" }}
                  />
                  <div
                    className="h-3 w-1/2 animate-pulse rounded-full motion-reduce:animate-none"
                    style={{ background: "rgba(90,214,201,0.12)" }}
                  />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={AlertTriangle}
          tone={C.rose}
          titel="De lijst kon niet worden geladen"
          tekst="De opdrachten konden zojuist niet worden opgehaald. Probeer het rustig opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : filtered.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.cyan}
          titel="Niets gevonden"
          tekst={`Er is geen opdracht voor ${q ? `“${q}”` : "je zoekterm"}. Verruim je zoekopdracht.`}
          cta="Zoekterm wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-center gap-5 pt-1">
        {(["loading", "error"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className="rounded-full text-[11px] uppercase tracking-[0.12em] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34d6c9]"
            style={{ color: C.inkFaint }}
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
  titel,
  tekst,
  cta,
  onCta,
  tone,
}: {
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
  tone: string;
}) {
  return (
    <Panel tone="up" className="flex flex-col items-center px-6 py-16 text-center">
      <span
        className="flex h-16 w-16 items-center justify-center rounded-[22px]"
        style={{ color: tone, background: `${tone}22`, border: `1px solid ${tone}33` }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-4 text-[20px] font-semibold" style={{ color: C.ink }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
        {tekst}
      </p>
      <Btn variant="outline" className="mt-5" onClick={onCta}>
        <RotateCcw size={13} aria-hidden="true" /> {cta}
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
  const tone = strong ? C.emerald : C.cyan;
  return (
    <Panel interactive as="article">
      <div className="flex items-start gap-4 p-5">
        <MatchNode value={opdracht.match} size={62} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: tone }}
            >
              {strong ? "Sterke match" : "Goede match"}
            </span>
            <span className="text-[11px]" style={{ color: C.inkFaint, ...num }}>
              #{String(index + 1).padStart(2, "0")} · {opdracht.id}
            </span>
          </div>
          <h3 className="mt-1.5 text-[18px] font-semibold leading-snug" style={{ color: C.ink }}>
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[13px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
                style={{
                  background: "rgba(52,214,201,0.08)",
                  color: C.inkSoft,
                  border: `1px solid ${C.line}`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[17px] font-semibold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span className="text-[10.5px] uppercase tracking-[0.1em]" style={{ color: C.inkFaint }}>
            per uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-3 px-5 py-3"
        style={{ borderTop: `1px solid ${C.lineSoft}`, background: "rgba(6,18,24,0.34)" }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full text-[12.5px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34d6c9]"
          style={{ color: C.cyan }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" onClick={onOpen}>
            Reageren <ArrowRight size={13} aria-hidden="true" />
          </Btn>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2"
            style={{ borderTop: `1px solid ${C.lineSoft}` }}
          >
            <RedenKolom
              titel="In je voordeel"
              tone={C.emerald}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.amber}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function RedenKolom({
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
    <div>
      <p
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: tone }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[13.5px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
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
  const tone = strong ? C.emerald : C.cyan;
  return (
    <div className="space-y-5">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </Btn>

      <Panel tone="up" className="p-6">
        <div className="flex flex-wrap items-start gap-5">
          <MatchNode value={opdracht.match} size={78} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11.5px]" style={{ color: C.inkMute, ...num }}>
                {opdracht.id}
              </span>
              <span className="h-3 w-px" style={{ background: C.line }} aria-hidden="true" />
              <span
                className="text-[11.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: tone }}
              >
                {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
              </span>
            </div>
            <h1
              className="mt-2.5 max-w-2xl text-[27px] font-semibold leading-[1.14] tracking-[-0.02em] md:text-[33px]"
              style={{ color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-[14px]" style={{ color: C.inkMute }}>
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Btn variant="solid">
            Reageren op opdracht <ArrowRight size={14} aria-hidden="true" />
          </Btn>
          <Btn variant="outline">Bewaren</Btn>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Aanvang", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m) => (
            <div
              key={m.l}
              className="rounded-[14px] p-3.5"
              style={{ background: "rgba(6,18,24,0.5)", border: `1px solid ${C.line}` }}
            >
              <p className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.inkMute }}>
                {m.l}
              </p>
              <p className="mt-1.5 text-[18px] font-semibold" style={{ color: C.ink, ...num }}>
                {m.v}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="rounded-full px-3 py-1 text-[12px] font-medium"
              style={{
                background: "rgba(139,124,240,0.1)",
                color: C.inkSoft,
                border: `1px solid ${C.violet}44`,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </Panel>

      <Panel className="p-6">
        <SectionHead over="Motivering">Waarom deze match bij je past</SectionHead>
        <p className="mb-5 max-w-xl text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je geverifieerde profiel — open en navolgbaar, zonder verborgen score. Wat
          in je voordeel spreekt, en wat goed is om vooraf te weten.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.emerald }}
            >
              <Check size={13} aria-hidden="true" /> In je voordeel
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.emerald }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.amber }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amber }}
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

// —————————————————————————————————— Verificatie ——————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel className="p-6">
          <Eyebrow tone={C.emerald}>
            <ShieldCheck size={12} aria-hidden="true" /> Vertrouwensregister
          </Eyebrow>
          <h1
            className="mt-1.5 text-[26px] font-semibold leading-tight tracking-[-0.015em]"
            style={{ color: C.ink }}
          >
            {PROFIEL.trust}
          </h1>
          <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
            bijna — tijdig vernieuwen houdt je dossier compleet. Al je documenten worden versleuteld
            bewaard en uitsluitend met jouw toestemming gedeeld.
          </p>
        </Panel>
        <Panel tone="up" className="flex flex-col justify-center p-6">
          <Tick
            value={`${ratio}%`}
            className="text-[42px] font-semibold leading-none"
            style={{ color: C.ink }}
          />
          <p
            className="mt-1.5 text-[11.5px] uppercase tracking-[0.12em]"
            style={{ color: C.inkMute }}
          >
            dossier op orde
          </p>
          <div
            className="mt-3 h-2 w-full overflow-hidden rounded-full"
            style={{ background: "rgba(90,214,201,0.14)" }}
            aria-hidden="true"
          >
            <span
              className="block h-full rounded-full"
              style={{
                width: `${ratio}%`,
                background: `linear-gradient(90deg, ${C.emerald}, ${C.cyan})`,
                transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>
        </Panel>
      </section>

      <section>
        <SectionHead over="Certificaten">Documentregister</SectionHead>
        <ul className="space-y-3">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam}>
                <Panel interactive>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3.5 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#34d6c9]"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px]"
                      style={{ background: t.soft, color: t.base, border: `1px solid ${t.base}33` }}
                      aria-hidden="true"
                    >
                      <t.Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[15px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12px]"
                        style={{ color: C.inkMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                    <span className="hidden sm:inline-flex">
                      <StatusPill {...t} />
                    </span>
                    <span
                      className="text-[16px] transition-transform motion-reduce:transition-none"
                      style={{ color: C.cyan, transform: isOpen ? "rotate(45deg)" : "none" }}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-300 motion-reduce:transition-none"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div
                        className="px-4 pb-4 sm:pl-[70px]"
                        style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 14 }}
                      >
                        <span className="mb-2 inline-flex sm:hidden">
                          <StatusPill {...t} />
                        </span>
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Het document wordt versleuteld bewaard en uitsluitend na jouw
                          toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Btn size="sm" variant="solid">
                            {c.status === "EXPIRING"
                              ? "Vernieuwen"
                              : c.status === "REJECTED"
                                ? "Opnieuw indienen"
                                : "Bekijken"}
                          </Btn>
                          <Btn size="sm" variant="outline">
                            Historie
                          </Btn>
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <SectionHead over="Dossier">Documentenkast</SectionHead>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const t = credTone(d.status);
            return (
              <Panel key={d.naam} interactive className="flex items-center gap-3 p-3.5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px]"
                  style={{
                    background: "rgba(6,18,24,0.5)",
                    color: C.cyan,
                    border: `1px solid ${C.line}`,
                  }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13.5px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[11px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <StatusPill {...t} />
              </Panel>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// —————————————————————————————————— Acties ——————————————————————————————————
function Acties({ onMarkt }: { onMarkt: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <Eyebrow>
          <Activity size={12} aria-hidden="true" /> Agenda
        </Eyebrow>
        <h1
          className="mt-1.5 text-[27px] font-semibold leading-tight tracking-[-0.015em]"
          style={{ color: C.ink }}
        >
          Wat vandaag je aandacht vraagt
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: C.inkMute }}>
          Op volgorde van urgentie — werk van boven naar beneden.
        </p>
      </div>

      <ol className="relative space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.teal;
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel}>
              <Panel
                interactive
                tone={warn ? "up" : "panel"}
                className="flex items-start gap-4 p-5"
              >
                <span
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold"
                  style={{
                    background: `${tone}22`,
                    color: tone,
                    border: `1px solid ${tone}44`,
                    ...num,
                  }}
                  aria-hidden="true"
                >
                  {warn && (
                    <span
                      className="vl-pulse absolute inset-0 rounded-full"
                      style={{ border: `1px solid ${tone}` }}
                    />
                  )}
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: tone }}
                  >
                    {warn ? (
                      <AlertTriangle size={12} aria-hidden="true" />
                    ) : (
                      <Clock size={12} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </span>
                  <h2
                    className="mt-1.5 text-[17px] font-semibold leading-snug"
                    style={{ color: C.ink }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[13.5px] leading-relaxed"
                    style={{ color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <Btn
                      variant={warn ? "solid" : "outline"}
                      size="sm"
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
  if (status === "Betaald") return { base: C.emerald, soft: "rgba(55,214,154,0.14)" };
  if (status === "Openstaand") return { base: C.amber, soft: "rgba(234,181,74,0.16)" };
  if (status === "Concept") return { base: C.teal, soft: "rgba(47,182,201,0.14)" };
  return { base: C.rose, soft: "rgba(240,114,138,0.16)" };
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
          <Eyebrow>
            <Activity size={12} aria-hidden="true" /> Grootboek
          </Eyebrow>
          <h1
            className="mt-1.5 text-[27px] font-semibold leading-tight tracking-[-0.015em]"
            style={{ color: C.ink }}
          >
            Je facturen
          </h1>
        </div>
        <Btn variant="solid">
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </Btn>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", tone: C.emerald },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.amber },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.teal },
        ].map((s) => (
          <Panel key={s.l} interactive className="p-4">
            <p className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.inkMute }}>
              {s.l}
            </p>
            <Tick
              value={s.v}
              className="mt-1 block text-[24px] font-semibold"
              style={{ color: s.tone }}
            />
            <p className="mt-0.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </div>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Btn
            key={s}
            size="sm"
            variant={sort === s ? "solid" : "outline"}
            onClick={() => setSort(s)}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Btn>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 540 }}>
            <caption className="sr-only">Overzicht van facturen</caption>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: C.inkMute }}
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
                    className="transition-colors hover:bg-[rgba(52,214,201,0.05)]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.inkSoft, ...num }}>
                      {f.nr}
                    </td>
                    <td className="px-5 py-3.5 text-[14px] font-semibold" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.inkMute, ...num }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[14px] font-semibold"
                      style={{ color: C.ink, ...num }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
                        style={{
                          color: t.base,
                          background: t.soft,
                          border: `1px solid ${t.base}44`,
                        }}
                      >
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
