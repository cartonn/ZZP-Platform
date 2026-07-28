"use client";

// Concept 500 — "Zwevend" · Mijlpaal. Spatial/diepte-glasmorfisme 2026: translucente, gefroste
// glaspanelen die zweven op een zacht aurora-verloop. Diepte via blur, gelaagde schaduwen, lichte
// randhighlights en een subtiele pointer-parallax op de achtergrond. Ronde hoeken, vloeiende
// micro-interacties (lift bij hover). Bewust hoog tekstcontrast: donkere inkt op licht glas —
// nooit onleesbaar glas. Status altijd met label + icoon, niet enkel kleur.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
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
  Sparkles,
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

// — Palet: heldere inkt op licht glas, indigo/violet accent, verzadigde status-tinten —
const C = {
  ink: "#1b1f33",
  inkSoft: "#3f4560",
  inkMute: "#6a7090",
  inkFaint: "#9aa0be",

  accent: "#5b5bf0",
  accentDeep: "#4340d6",
  violet: "#8b5cf6",
  sky: "#2ea6e8",
  emerald: "#0ea371",
  amber: "#e08a00",
  rose: "#e6416b",
};

const sans = {
  fontFamily:
    "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const num = { ...sans, fontVariantNumeric: "tabular-nums" as const };

type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.emerald,
        soft: "rgba(14,163,113,0.14)",
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return {
        base: C.sky,
        soft: "rgba(46,166,232,0.14)",
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
      };
    case "EXPIRING":
      return {
        base: C.amber,
        soft: "rgba(224,138,0,0.16)",
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return {
        base: C.rose,
        soft: "rgba(230,65,107,0.14)",
        label: "Afgewezen",
        Icon: X,
        alarm: true,
      };
  }
}

// — Gefrost glaspaneel met randhighlight en zachte diepteschaduw —
function Glass({
  children,
  className = "",
  level = 1,
  as: Tag = "div",
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  level?: 0 | 1 | 2;
  as?: "div" | "section" | "article" | "aside" | "li";
  interactive?: boolean;
}) {
  const bg =
    level === 2
      ? "rgba(255,255,255,0.72)"
      : level === 1
        ? "rgba(255,255,255,0.58)"
        : "rgba(255,255,255,0.42)";
  const shadow =
    level === 2
      ? "0 24px 60px -24px rgba(35,40,90,0.42), 0 2px 8px -2px rgba(35,40,90,0.16)"
      : "0 18px 44px -22px rgba(35,40,90,0.34), 0 1px 4px -1px rgba(35,40,90,0.12)";
  return (
    <Tag
      className={`rounded-[22px] ${interactive ? "zw-lift" : ""} ${className}`}
      style={{
        background: bg,
        backdropFilter: "blur(26px) saturate(1.5)",
        WebkitBackdropFilter: "blur(26px) saturate(1.5)",
        border: "1px solid rgba(255,255,255,0.7)",
        boxShadow: `${shadow}, inset 0 1px 0 rgba(255,255,255,0.85)`,
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
  variant?: "solid" | "glass" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
}) {
  const pad = size === "sm" ? "px-3.5 py-1.5 text-[12.5px]" : "px-5 py-2.5 text-[13.5px]";
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b5bf0] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";
  if (variant === "solid") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        aria-expanded={ariaExpanded}
        className={`${base} ${pad} hover:-translate-y-0.5 hover:brightness-110 ${className}`}
        style={{
          background: `linear-gradient(135deg, ${C.accent}, ${C.violet})`,
          color: "#fff",
          boxShadow: "0 10px 26px -10px rgba(91,91,240,0.7), inset 0 1px 0 rgba(255,255,255,0.4)",
          ...sans,
        }}
      >
        {children}
      </button>
    );
  }
  const style: React.CSSProperties =
    variant === "glass"
      ? {
          background: "rgba(255,255,255,0.55)",
          color: C.ink,
          border: "1px solid rgba(255,255,255,0.8)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 6px 18px -10px rgba(35,40,90,0.35)",
        }
      : { background: "transparent", color: C.inkSoft, border: "1px solid transparent" };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`${base} ${pad} hover:-translate-y-0.5 ${className}`}
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
      style={{ color: base, background: soft, border: `1px solid ${base}33` }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// — Circulaire match-ring: premium, spatial-gevoel —
function MatchRing({ value, size = 56 }: { value: number; size?: number }) {
  const strong = value >= 90;
  const tone = strong ? C.emerald : C.accent;
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
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(35,40,90,0.1)" strokeWidth="4" />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-semibold leading-none"
          style={{ color: tone, fontSize: size * 0.3, ...num }}
        >
          {value}
        </span>
        <span
          className="mt-0.5 uppercase tracking-[0.1em]"
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
  const gid = useMemo(() => `zw-spark-${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.32" />
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
      <circle cx={last[0]} cy={last[1]} r="2.2" fill={tone} />
    </svg>
  );
}

function Eyebrow({ children, tone = C.accent }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: tone }}>
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
        <Eyebrow>{over}</Eyebrow>
        <h2
          className="mt-1 text-[20px] font-semibold leading-tight tracking-[-0.015em]"
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
export function Concept500() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [px, setPx] = useState({ x: 0, y: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const active = OPDRACHTEN[0] as Opdracht;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setPx({ x: nx, y: ny }));
    };
    el.addEventListener("pointermove", onMove);
    return () => {
      el.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative min-h-[760px] w-full overflow-hidden antialiased"
      style={{
        ...sans,
        color: C.ink,
        background: "linear-gradient(160deg, #eef1fb 0%, #f4eefb 42%, #fdf0f2 72%, #eef8fb 100%)",
      }}
    >
      {/* Zwevende aurora-blobs met pointer-parallax */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span
          className="absolute h-[46vw] w-[46vw] rounded-full"
          style={{
            top: "-14%",
            left: "-8%",
            background: "radial-gradient(circle, rgba(139,92,246,0.42), rgba(139,92,246,0) 70%)",
            filter: "blur(18px)",
            transform: `translate(${px.x * 34}px, ${px.y * 34}px)`,
            transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
        <span
          className="absolute h-[42vw] w-[42vw] rounded-full"
          style={{
            top: "-6%",
            right: "-10%",
            background: "radial-gradient(circle, rgba(46,166,232,0.4), rgba(46,166,232,0) 70%)",
            filter: "blur(20px)",
            transform: `translate(${px.x * -30}px, ${px.y * 26}px)`,
            transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
        <span
          className="absolute h-[40vw] w-[40vw] rounded-full"
          style={{
            bottom: "-16%",
            left: "22%",
            background: "radial-gradient(circle, rgba(230,65,107,0.28), rgba(230,65,107,0) 70%)",
            filter: "blur(22px)",
            transform: `translate(${px.x * 22}px, ${px.y * -22}px)`,
            transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-20 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="zw-fade pt-6">
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
        .zw-lift { transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease; }
        .zw-lift:hover { transform: translateY(-3px); box-shadow: 0 30px 70px -24px rgba(35,40,90,0.42), inset 0 1px 0 rgba(255,255,255,0.85); }
        @keyframes zwFade { from { opacity: 0; transform: translateY(10px) scale(0.995); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .zw-fade { animation: zwFade 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .zw-lift, .zw-fade { animation: none !important; transition: none !important; }
          .zw-lift:hover { transform: none; }
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
          className="flex h-11 w-11 items-center justify-center rounded-[16px]"
          style={{
            background: `linear-gradient(135deg, ${C.accent}, ${C.violet})`,
            color: "#fff",
            boxShadow: "0 12px 26px -10px rgba(91,91,240,0.7), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
          aria-hidden="true"
        >
          <Sparkles size={20} />
        </span>
        <div>
          <p
            className="text-[17px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            Zwevend
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
            background: "rgba(14,163,113,0.12)",
            border: "1px solid rgba(14,163,113,0.28)",
          }}
        >
          <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="relative flex h-10 w-10 items-center justify-center rounded-full"
          style={{
            background: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(255,255,255,0.8)",
            color: C.inkSoft,
          }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9.5px] font-bold text-white"
              style={{ background: C.rose }}
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-[12.5px] font-semibold"
          style={{
            background: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(255,255,255,0.8)",
            color: C.ink,
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
    <nav aria-label="Hoofdnavigatie" className="mt-5">
      <div
        className="flex flex-wrap items-center gap-1 overflow-x-auto rounded-full p-1.5"
        style={{
          background: "rgba(255,255,255,0.5)",
          border: "1px solid rgba(255,255,255,0.75)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          boxShadow: "0 10px 30px -18px rgba(35,40,90,0.35), inset 0 1px 0 rgba(255,255,255,0.85)",
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
              className="relative shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b5bf0]"
              style={
                on
                  ? {
                      color: "#fff",
                      background: `linear-gradient(135deg, ${C.accent}, ${C.violet})`,
                      boxShadow: "0 8px 20px -8px rgba(91,91,240,0.7)",
                    }
                  : { color: C.inkSoft }
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
          <Eyebrow>Overzicht</Eyebrow>
          <h1
            className="mt-2 text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[38px]"
            style={{ color: C.ink }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Je register is geverifieerd en op orde. Er staan verse opdrachten klaar die aansluiten
            bij je profiel, en één document vraagt binnenkort om aandacht.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Btn variant="solid" onClick={onActies}>
              Volgende actie <ArrowRight size={14} aria-hidden="true" />
            </Btn>
            <Btn variant="glass" onClick={onMarkt}>
              Naar marktplaats
            </Btn>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {KPIS.map((k, i) => {
              const tone = i === 3 ? C.amber : C.accent;
              return (
                <Glass key={k.label} interactive className="p-4">
                  <p
                    className="text-[10.5px] uppercase tracking-[0.1em]"
                    style={{ color: C.inkMute }}
                  >
                    {k.label}
                  </p>
                  <p
                    className="mt-1.5 text-[22px] font-semibold leading-none"
                    style={{ color: C.ink, ...num }}
                  >
                    {k.value}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <span
                      className="text-[11.5px] font-semibold"
                      style={{ color: k.up ? C.emerald : C.amber, ...num }}
                    >
                      {k.up ? "▲" : "▼"} {k.trend}
                    </span>
                    <Spark data={k.spark} tone={tone} />
                  </div>
                </Glass>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <Glass interactive level={2} className="p-5">
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
          </Glass>

          <Glass interactive className="p-5">
            <Eyebrow tone={C.emerald}>Vertrouwen</Eyebrow>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[34px] font-semibold leading-none"
                style={{ color: C.ink, ...num }}
              >
                {ratio}%
              </span>
              <span className="text-[12.5px]" style={{ color: C.inkMute }}>
                dossier op orde
              </span>
            </div>
            <div
              className="mt-3 h-2 w-full overflow-hidden rounded-full"
              style={{ background: "rgba(35,40,90,0.1)" }}
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${ratio}%`,
                  background: `linear-gradient(90deg, ${C.emerald}, ${C.sky})`,
                  transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </div>
            <p className="mt-2 text-[12px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd.
            </p>
          </Glass>
        </aside>
      </section>

      <section>
        <SectionHead
          over="Aanbevolen"
          right={
            <button
              type="button"
              onClick={onMarkt}
              className="rounded-full text-[12.5px] font-semibold transition-colors hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b5bf0]"
              style={{ color: C.accent }}
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
              <Glass key={c.naam} interactive className="flex items-center gap-3 p-3.5">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]"
                  style={{ background: t.soft, color: t.base }}
                  aria-hidden="true"
                >
                  <t.Icon size={17} />
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
              </Glass>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  return (
    <Glass interactive as="article" className="overflow-hidden">
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5b5bf0]"
      >
        <MatchRing value={opdracht.match} size={52} />
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
          style={{ color: C.inkFaint }}
        />
      </button>
    </Glass>
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
        <Eyebrow>Marktplaats</Eyebrow>
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

      <Glass className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-2.5"
          style={{
            background: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(255,255,255,0.8)",
          }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#9aa0be]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[rgba(35,40,90,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b5bf0]"
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
      </Glass>

      {mode === "loading" ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Glass className="p-5">
                <div className="space-y-3">
                  <div
                    className="h-4 w-2/3 animate-pulse rounded-full motion-reduce:animate-none"
                    style={{ background: "rgba(35,40,90,0.1)" }}
                  />
                  <div
                    className="h-3 w-1/2 animate-pulse rounded-full motion-reduce:animate-none"
                    style={{ background: "rgba(35,40,90,0.1)" }}
                  />
                </div>
              </Glass>
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
          tone={C.accent}
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
            className="rounded-full text-[11px] uppercase tracking-[0.12em] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b5bf0]"
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
    <Glass level={2} className="flex flex-col items-center px-6 py-16 text-center">
      <span
        className="flex h-16 w-16 items-center justify-center rounded-[22px]"
        style={{ color: tone, background: `${tone}1f` }}
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
      <Btn variant="glass" className="mt-5" onClick={onCta}>
        <RotateCcw size={13} aria-hidden="true" /> {cta}
      </Btn>
    </Glass>
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
  const tone = strong ? C.emerald : C.accent;
  return (
    <Glass interactive as="article" level={1} className="overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        <MatchRing value={opdracht.match} size={62} />
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
                  background: "rgba(255,255,255,0.6)",
                  color: C.inkSoft,
                  border: "1px solid rgba(255,255,255,0.85)",
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
        style={{
          borderTop: "1px solid rgba(255,255,255,0.6)",
          background: "rgba(255,255,255,0.28)",
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full text-[12.5px] font-semibold transition-colors hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b5bf0]"
          style={{ color: C.accent }}
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
            style={{
              borderTop: "1px solid rgba(255,255,255,0.6)",
              background: "rgba(255,255,255,0.32)",
            }}
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
    </Glass>
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
  const tone = strong ? C.emerald : C.accent;
  return (
    <div className="space-y-5">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </Btn>

      <Glass level={2} className="overflow-hidden p-6">
        <div className="flex flex-wrap items-start gap-5">
          <MatchRing value={opdracht.match} size={76} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11.5px]" style={{ color: C.inkMute, ...num }}>
                {opdracht.id}
              </span>
              <span
                className="h-3 w-px"
                style={{ background: "rgba(35,40,90,0.2)" }}
                aria-hidden="true"
              />
              <span
                className="text-[11.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: tone }}
              >
                {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
              </span>
            </div>
            <h1
              className="mt-2.5 max-w-2xl text-[27px] font-semibold leading-[1.15] tracking-[-0.02em] md:text-[33px]"
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
          <Btn variant="glass">Bewaren</Btn>
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
              className="rounded-[16px] p-3.5"
              style={{
                background: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.8)",
              }}
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
      </Glass>

      <Glass className="p-6">
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
      </Glass>
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
        <Glass className="p-6">
          <Eyebrow tone={C.emerald}>Vertrouwensregister</Eyebrow>
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
        </Glass>
        <Glass level={2} className="flex flex-col justify-center p-6">
          <span className="text-[42px] font-semibold leading-none" style={{ color: C.ink, ...num }}>
            {ratio}%
          </span>
          <p
            className="mt-1.5 text-[11.5px] uppercase tracking-[0.12em]"
            style={{ color: C.inkMute }}
          >
            dossier op orde
          </p>
          <div
            className="mt-3 h-2 w-full overflow-hidden rounded-full"
            style={{ background: "rgba(35,40,90,0.1)" }}
            aria-hidden="true"
          >
            <span
              className="block h-full rounded-full"
              style={{
                width: `${ratio}%`,
                background: `linear-gradient(90deg, ${C.emerald}, ${C.sky})`,
                transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>
        </Glass>
      </section>

      <section>
        <SectionHead over="Certificaten">Documentregister</SectionHead>
        <ul className="space-y-3">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam}>
                <Glass interactive className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3.5 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5b5bf0]"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px]"
                      style={{ background: t.soft, color: t.base }}
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
                      style={{ color: C.inkFaint, transform: isOpen ? "rotate(45deg)" : "none" }}
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
                        style={{ borderTop: "1px solid rgba(255,255,255,0.6)", paddingTop: 14 }}
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
                          <Btn size="sm" variant="glass">
                            Historie
                          </Btn>
                        </div>
                      </div>
                    </div>
                  </div>
                </Glass>
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
              <Glass key={d.naam} interactive className="flex items-center gap-3 p-3.5">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]"
                  style={{ background: "rgba(255,255,255,0.6)", color: C.inkSoft }}
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
              </Glass>
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
        <Eyebrow>Agenda</Eyebrow>
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

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.sky;
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel}>
              <Glass interactive level={warn ? 2 : 1} className="flex items-start gap-4 p-5">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] text-[15px] font-semibold"
                  style={{ background: `${tone}1f`, color: tone, ...num }}
                  aria-hidden="true"
                >
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
                      variant={warn ? "solid" : "glass"}
                      size="sm"
                      onClick={goMarkt ? onMarkt : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
              </Glass>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurTone(status: string): { base: string; soft: string } {
  if (status === "Betaald") return { base: C.emerald, soft: "rgba(14,163,113,0.14)" };
  if (status === "Openstaand") return { base: C.amber, soft: "rgba(224,138,0,0.16)" };
  if (status === "Concept") return { base: C.sky, soft: "rgba(46,166,232,0.14)" };
  return { base: C.rose, soft: "rgba(230,65,107,0.14)" };
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
          <Eyebrow>Grootboek</Eyebrow>
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
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.sky },
        ].map((s) => (
          <Glass key={s.l} interactive className="p-4">
            <p className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: C.inkMute }}>
              {s.l}
            </p>
            <p className="mt-1 text-[24px] font-semibold" style={{ color: s.tone, ...num }}>
              {s.v}
            </p>
            <p className="mt-0.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Glass>
        ))}
      </div>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Btn
            key={s}
            size="sm"
            variant={sort === s ? "solid" : "glass"}
            onClick={() => setSort(s)}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Btn>
        ))}
      </div>

      <Glass className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 540 }}>
            <caption className="sr-only">Overzicht van facturen</caption>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.6)" }}>
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
                    className="transition-colors hover:bg-[rgba(255,255,255,0.4)]"
                    style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.5)" }}
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
                          border: `1px solid ${t.base}33`,
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
      </Glass>
    </div>
  );
}
