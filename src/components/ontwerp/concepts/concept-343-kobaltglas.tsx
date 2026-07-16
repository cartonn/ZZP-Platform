"use client";

// Concept 343 — "Kobaltglas" · premium-dark glasmorfisme in diep kobaltblauw.
// Ontwerprichting: doorschijnende, gelaagde glaspanelen (backdrop-blur) met een dunne
// lichtrand bovenaan (refractie/glans), zachte diepte en één heldere ijsblauw-cyaan accent
// op een diep kobalt canvas. Strak, high-tech, betrouwbaar — het soort interface waar
// gevoelige documenten (BIG, VOG, diploma's) veilig voelen.
// Rationale: glas leest als transparantie én vertrouwen; de cyaan accent wijst één ding
// tegelijk aan (de volgende beste actie). Contrast is bewaakt: tekst staat op opake-genoeg
// lagen en gebruikt lichte tinten (#e8edf7 primair, #9fb0cf gedempt) zodat leesbaarheid
// nooit op doorschijnendheid leunt. Statuschips tonen altijd label + icoon, nooit kleur alleen.
// Fonts: --font-lab-sora (koppen, geometrisch) + --font-lab-space (accent) +
// --font-lab-inter (tekst) + --font-lab-mono (cijfers).

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  FileText,
  MessageSquare,
  Search,
  Bell,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Sparkles,
  Command,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  BadgeCheck,
  MapPin,
  Send,
  Plus,
  RotateCcw,
  CircleAlert,
  ShieldAlert,
  Layers,
  X,
  CornerDownLeft,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

/* ---------- Palet (diep kobalt, ijsblauw-cyaan accent) ---------- */

const C = {
  // Canvas-lagen (donker kobalt → indigo)
  base: "#0a1230",
  baseDeep: "#070c22",
  baseUp: "#0f1a44",
  // Glaslagen
  glass: "rgba(255,255,255,0.06)",
  glassStrong: "rgba(255,255,255,0.09)",
  glassSoft: "rgba(255,255,255,0.04)",
  // Solide donkere paneel-bodem (voor tekstcontrast onder glas)
  panel: "#101a3d",
  panelUp: "#152250",
  // Randen / lichtrefractie
  edge: "rgba(255,255,255,0.14)", // heldere bovenrand
  edgeSoft: "rgba(255,255,255,0.08)",
  hair: "rgba(160,180,230,0.16)",
  // Tekst (licht — WCAG-veilig op donker)
  ink: "#e8edf7",
  inkSoft: "#c3cee6",
  sub: "#9fb0cf",
  faint: "#728099",
  // Accent
  cyan: "#5fd0ff",
  cyanDim: "#3aa9e0",
  cyanSoft: "rgba(95,208,255,0.14)",
  cyanEdge: "rgba(95,208,255,0.42)",
  cyanGlow: "rgba(95,208,255,0.30)",
  // Status (helder-fg voor donker glas)
  ok: "#4ade9c",
  okSoft: "rgba(74,222,156,0.15)",
  okEdge: "rgba(74,222,156,0.34)",
  info: "#7db8ff",
  infoSoft: "rgba(125,184,255,0.15)",
  infoEdge: "rgba(125,184,255,0.34)",
  warn: "#f5b74e",
  warnSoft: "rgba(245,183,78,0.15)",
  warnEdge: "rgba(245,183,78,0.34)",
  alert: "#ff7a85",
  alertSoft: "rgba(255,122,133,0.15)",
  alertEdge: "rgba(255,122,133,0.34)",
};

const head = { fontFamily: "var(--font-lab-sora), system-ui, sans-serif" };
const body = { fontFamily: "var(--font-lab-inter), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fd0ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1230]";

// Glaspaneel-stijl: doorschijnend oppervlak, blur, heldere bovenrand voor de refractie-look.
const glassCard: React.CSSProperties = {
  background: C.glass,
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: `1px solid ${C.edgeSoft}`,
  borderTop: `1px solid ${C.edge}`,
  boxShadow: "0 12px 40px -18px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
};

/* ---------- Status → betekenis ---------- */

type Tone = { label: string; fg: string; soft: string; edge: string; Icon: LucideIcon };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.ok, soft: C.okSoft, edge: C.okEdge, Icon: BadgeCheck };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        fg: C.info,
        soft: C.infoSoft,
        edge: C.infoEdge,
        Icon: Clock,
      };
    case "EXPIRING":
      return {
        label: "Verloopt",
        fg: C.warn,
        soft: C.warnSoft,
        edge: C.warnEdge,
        Icon: AlertTriangle,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        fg: C.alert,
        soft: C.alertSoft,
        edge: C.alertEdge,
        Icon: XCircle,
      };
  }
}

function factuurTone(status: string): { fg: string; soft: string; edge: string } {
  if (status === "Betaald") return { fg: C.ok, soft: C.okSoft, edge: C.okEdge };
  if (status === "Openstaand") return { fg: C.warn, soft: C.warnSoft, edge: C.warnEdge };
  return { fg: C.faint, soft: C.glassStrong, edge: C.edgeSoft };
}

function euros(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: MessageSquare,
};

/* ---------- Bouwstenen ---------- */

function StatusPill({ status }: { status: CredStatus }) {
  const t = credTone(status);
  const Icon = t.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...body, color: t.fg, background: t.soft, border: `1px solid ${t.edge}` }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {t.label}
    </span>
  );
}

// Zachte gloed-sparkline met area-fill — de "licht door glas"-curve.
function GlowSpark({
  data,
  color = C.cyan,
  height = 96,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const w = 320;
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const id = `kg-${color.replace("#", "")}-${height}`;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 16) - 9;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.34" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-g`} x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="3.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={area} fill={`url(#${id}-f)`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${id}-g)`}
      />
      {last && (
        <>
          <circle cx={last[0]} cy={last[1]} r="9" fill={color} fillOpacity="0.22" />
          <circle cx={last[0]} cy={last[1]} r="4" fill={color} />
        </>
      )}
    </svg>
  );
}

function MiniSpark({ data, color }: { data: number[]; color: string }) {
  const w = 88;
  const h = 26;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 5) - 2.5;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Ring-gauge met cyaan stroke + zachte gloed — de kern van de "kobaltglas"-taal.
function RingGauge({
  value,
  size = 68,
  color = C.cyan,
  label,
}: {
  value: number;
  size?: number;
  color?: string;
  label?: string;
}) {
  const stroke = size >= 90 ? 8 : 6;
  const r = size / 2 - stroke;
  const circ = 2 * Math.PI * r;
  const gid = `rg-${color.replace("#", "")}-${size}`;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <defs>
          <filter id={`${gid}-g`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
          opacity="0.5"
          filter={`url(#${gid}-g)`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span className="flex flex-col items-center leading-none">
        <span
          className="font-bold tabular-nums"
          style={{ ...mono, color: C.ink, fontSize: size >= 90 ? 22 : 15 }}
        >
          {value}
        </span>
        {label && (
          <span
            className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide"
            style={{ color: C.faint }}
          >
            {label}
          </span>
        )}
      </span>
    </span>
  );
}

// Verticale glas-staafjes (reactie-ritme).
function GlassBars({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data) || 1;
  return (
    <div className="flex items-end gap-1.5" style={{ height: 42 }} aria-hidden="true">
      {data.map((v, i) => {
        const on = i === data.length - 1;
        return (
          <span
            key={i}
            className="w-2.5 rounded-t-sm"
            style={{
              height: `${Math.max(12, (v / max) * 100)}%`,
              background: on ? color : "rgba(255,255,255,0.14)",
              boxShadow: on ? `0 0 12px ${C.cyanGlow}` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

function PageHead({
  kicker,
  title,
  sub,
  right,
}: {
  kicker: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-2 pt-6">
      <div className="min-w-0">
        <p
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.22em]"
          style={{ ...mono, color: C.cyan }}
        >
          {kicker}
        </p>
        <h1
          className="mt-1.5 text-[27px] font-bold leading-none tracking-tight"
          style={{ ...head, color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2 text-[13px]" style={{ color: C.sub }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

function CyanButton({
  children,
  onClick,
  disabled,
  ariaLive,
  solid = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLive?: "polite" | "off";
  solid?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-live={ariaLive}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-transform active:scale-[0.98] disabled:opacity-90 ${RING}`}
      style={
        solid
          ? { background: C.cyan, color: C.baseDeep, boxShadow: `0 8px 24px -10px ${C.cyanGlow}` }
          : {
              background: C.cyanSoft,
              color: C.cyan,
              border: `1px solid ${C.cyanEdge}`,
              backdropFilter: "blur(8px)",
            }
      }
    >
      {children}
    </button>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept343() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const [cmdOpen, setCmdOpen] = useState(false);
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  const go = (k: ScreenKey) => {
    setScreen(k);
    setCmdOpen(false);
  };

  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = window.setTimeout(() => setReady(true), 360);
    return () => window.clearTimeout(t);
  }, [screen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{
        ...body,
        color: C.ink,
        background: `radial-gradient(1200px 640px at 78% -8%, ${C.baseUp} 0%, ${C.base} 46%, ${C.baseDeep} 100%)`,
      }}
    >
      <style>{`@keyframes kg-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes kg-pulse{0%,100%{opacity:.4}50%{opacity:.75}}
      @keyframes kg-pop{from{opacity:0;transform:translateY(-6px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
      @keyframes kg-drift{0%,100%{transform:translate(0,0)}50%{transform:translate(14px,-10px)}}`}</style>

      {/* Achtergrond-refractielijnen (decoratief glas) */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.5]"
        aria-hidden="true"
        style={{ animation: "kg-drift 18s ease-in-out infinite" }}
      >
        <defs>
          <linearGradient id="kg-refract" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={C.cyan} stopOpacity="0.10" />
            <stop offset="100%" stopColor={C.cyan} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="-60" y1="120" x2="620" y2="-60" stroke="url(#kg-refract)" strokeWidth="80" />
        <line x1="55%" y1="-40" x2="120%" y2="380" stroke="url(#kg-refract)" strokeWidth="120" />
      </svg>

      {/* Top-nav (glas) */}
      <header
        className="relative border-b"
        style={{
          borderColor: C.edgeSoft,
          background: "rgba(10,18,48,0.62)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="flex h-14 items-center gap-3 px-5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[14px] font-bold"
            style={{
              ...head,
              color: C.baseDeep,
              background: `linear-gradient(140deg, ${C.cyan}, ${C.cyanDim})`,
              boxShadow: `0 6px 18px -6px ${C.cyanGlow}`,
            }}
            aria-hidden="true"
          >
            Z
          </div>
          <span className="text-[15px] font-bold tracking-tight" style={head}>
            Kobalt
          </span>
          <span
            className="ml-1 hidden rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline"
            style={{
              ...mono,
              background: C.cyanSoft,
              color: C.cyan,
              border: `1px solid ${C.cyanEdge}`,
            }}
          >
            ZZP
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setCmdOpen(true)}
              className={`hidden items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors hover:bg-white/[0.06] sm:inline-flex ${RING}`}
              style={{ border: `1px solid ${C.edgeSoft}`, color: C.sub }}
            >
              <Search size={13} aria-hidden="true" />
              Zoeken
              <span
                className="ml-1 flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold"
                style={{ ...mono, background: C.glassStrong, color: C.faint }}
              >
                <Command size={9} aria-hidden="true" />K
              </span>
            </button>
            <button
              onClick={() => setCmdOpen(true)}
              aria-label="Zoeken"
              className={`rounded-lg p-2 transition-colors hover:bg-white/[0.06] sm:hidden ${RING}`}
              style={{ border: `1px solid ${C.edgeSoft}`, color: C.sub }}
            >
              <Search size={15} aria-hidden="true" />
            </button>
            <button
              aria-label="Meldingen"
              className={`relative rounded-lg p-2 transition-colors hover:bg-white/[0.06] ${RING}`}
              style={{ border: `1px solid ${C.edgeSoft}`, color: C.sub }}
            >
              <Bell size={15} aria-hidden="true" />
              <span
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
                style={{ background: C.cyan, boxShadow: `0 0 8px ${C.cyan}` }}
                aria-hidden="true"
              />
            </button>
            <div className="ml-1 flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  ...mono,
                  background: C.glassStrong,
                  color: C.cyan,
                  border: `1px solid ${C.cyanEdge}`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-[12.5px] font-semibold" style={{ color: C.ink }}>
                  {PROFIEL.naam}
                </p>
                <p
                  className="flex items-center gap-1 text-[10.5px] font-semibold"
                  style={{ color: C.ok }}
                >
                  <ShieldCheck size={11} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scherm-tabs */}
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const Icon = NAV_ICONS[s.key];
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] transition-colors ${RING}`}
                style={{
                  color: on ? C.ink : C.sub,
                  background: on ? C.cyanSoft : "transparent",
                  border: `1px solid ${on ? C.cyanEdge : "transparent"}`,
                  fontWeight: on ? 700 : 500,
                }}
              >
                <Icon size={15} aria-hidden="true" style={{ color: on ? C.cyan : C.faint }} />
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Content */}
      <div
        key={screen}
        className="relative mx-auto max-w-6xl"
        style={{ animation: "kg-fade 0.34s ease" }}
      >
        {!ready ? (
          <ScreenSkeleton />
        ) : (
          <>
            {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
            {screen === "marktplaats" && <Marktplaats onOpen={open} />}
            {screen === "opdracht" && (
              <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
            )}
            {screen === "verificatie" && <Verificatie onGo={setScreen} />}
            {screen === "acties" && <Acties onGo={setScreen} />}
            {screen === "facturen" && <Facturen />}
            {screen === "documenten" && <Verificatie onGo={setScreen} />}
            {screen === "berichten" && <Acties onGo={setScreen} />}
          </>
        )}
      </div>

      {/* Command-menu (Cmd/Ctrl-K) */}
      {cmdOpen && <CommandMenu onGo={go} onClose={() => setCmdOpen(false)} />}
    </div>
  );
}

/* ---------- Command-menu ---------- */

function CommandMenu({ onGo, onClose }: { onGo: (k: ScreenKey) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const results = SCREENS.filter((s) => s.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div
      className="absolute inset-0 z-30 flex items-start justify-center px-4 pt-[10vh]"
      style={{ background: "rgba(5,9,22,0.62)", backdropFilter: "blur(4px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Snelmenu"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl"
        style={{ ...glassCard, background: "rgba(16,26,61,0.92)", animation: "kg-pop 0.18s ease" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-2.5 border-b px-4 py-3"
          style={{ borderColor: C.edgeSoft }}
        >
          <Search size={16} style={{ color: C.cyan }} aria-hidden="true" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ga naar scherm of zoek een actie…"
            aria-label="Snelmenu zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#728099]"
            style={{ color: C.ink }}
          />
          <button
            onClick={onClose}
            aria-label="Sluiten"
            className={`rounded-md p-1 transition-colors hover:bg-white/[0.08] ${RING}`}
            style={{ color: C.faint }}
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
        <div className="max-h-[280px] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-[12.5px]" style={{ color: C.sub }}>
              Niets gevonden voor “{q}”.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {results.map((s) => {
                const Icon = NAV_ICONS[s.key];
                return (
                  <li key={s.key}>
                    <button
                      onClick={() => onGo(s.key)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06] ${RING}`}
                    >
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ background: C.glassStrong, border: `1px solid ${C.edgeSoft}` }}
                      >
                        <Icon size={15} style={{ color: C.cyan }} aria-hidden="true" />
                      </span>
                      <span className="flex-1 text-[13px] font-semibold" style={{ color: C.ink }}>
                        {s.label}
                      </span>
                      <CornerDownLeft size={13} style={{ color: C.faint }} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div
          className="flex items-center justify-between border-t px-4 py-2 text-[10.5px]"
          style={{ ...mono, borderColor: C.edgeSoft, color: C.faint }}
        >
          <span>Kobaltglas · snelmenu</span>
          <span className="flex items-center gap-1">
            <Command size={10} aria-hidden="true" />K om te sluiten
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Skeleton ---------- */

function ScreenSkeleton() {
  const block: React.CSSProperties = {
    background: C.glass,
    border: `1px solid ${C.edgeSoft}`,
    animation: "kg-pulse 1.4s infinite",
  };
  return (
    <div className="px-6 py-6" role="status" aria-live="polite">
      <span className="sr-only">Scherm wordt geladen…</span>
      <div className="h-7 w-52 rounded-lg" style={block} />
      <div className="mt-6 h-44 rounded-3xl" style={block} />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl" style={block} />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 rounded-2xl" style={block} />
        ))}
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({
  onOpen,
  onGo,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
}) {
  const [focus, setFocus] = useState(0);
  const [feed, setFeed] = useState<"error" | "loading" | "ok">("error");
  const hero = (KPIS[focus] ?? KPIS[0]) as (typeof KPIS)[number];
  const nextAction = ACTIES[0];
  const matchAvg = Math.round(OPDRACHTEN.reduce((s, o) => s + o.match, 0) / OPDRACHTEN.length);

  const retry = () => {
    setFeed("loading");
    window.setTimeout(() => setFeed("ok"), 720);
  };

  return (
    <div>
      <PageHead
        kicker="Overzicht"
        title={`Helder zicht, ${PROFIEL.naam.split(" ")[0]}`}
        sub="Je praktijk in één oogopslag — cijfers, vertrouwen en de volgende beste actie."
      />

      <div className="space-y-5 px-6 py-5">
        {/* Hero-paneel (glas over kobalt) */}
        <div
          className="relative overflow-hidden rounded-3xl"
          style={{ ...glassCard, background: "rgba(16,26,61,0.55)" }}
        >
          <span
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full"
            style={{ background: C.cyanGlow, filter: "blur(60px)" }}
            aria-hidden="true"
          />
          <div className="relative flex flex-wrap items-start justify-between gap-4 p-6">
            <div className="min-w-0">
              <p
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ ...mono, color: C.cyan }}
              >
                <Sparkles size={13} aria-hidden="true" /> {hero.label}
              </p>
              <p
                className="mt-2 text-[46px] font-bold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {hero.value}
              </p>
              <p className="mt-2 flex items-center gap-2 text-[12.5px]" style={{ color: C.sub }}>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
                  style={{
                    background: hero.up ? C.okSoft : C.warnSoft,
                    color: hero.up ? C.ok : C.warn,
                    border: `1px solid ${hero.up ? C.okEdge : C.warnEdge}`,
                  }}
                >
                  {hero.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} aria-hidden="true" />
                  )}
                  {hero.trend}
                </span>
                t.o.v. vorige periode
              </p>
            </div>
            <RingGauge value={matchAvg} size={92} label="match" />
          </div>
          <div className="relative px-3 pb-3">
            <GlowSpark data={hero.spark} height={92} />
          </div>
          {/* KPI-kiezer */}
          <div
            className="relative flex gap-1 overflow-x-auto border-t p-2"
            style={{ borderColor: C.edgeSoft }}
            role="tablist"
            aria-label="Kies kerncijfer"
          >
            {KPIS.map((k, i) => {
              const on = i === focus;
              return (
                <button
                  key={k.label}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setFocus(i)}
                  className={`flex flex-1 shrink-0 flex-col items-start gap-1 rounded-xl px-3 py-2 text-left transition-colors ${RING}`}
                  style={{
                    background: on ? C.cyanSoft : "transparent",
                    border: `1px solid ${on ? C.cyanEdge : "transparent"}`,
                  }}
                >
                  <span
                    className="text-[10.5px] font-semibold"
                    style={{ color: on ? C.cyan : C.sub }}
                  >
                    {k.label}
                  </span>
                  <span
                    className="text-[15px] font-bold tabular-nums"
                    style={{ ...mono, color: on ? C.ink : C.inkSoft }}
                  >
                    {k.value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* KPI-tegels */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k) => (
            <div key={k.label} className="rounded-2xl p-4" style={glassCard}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium" style={{ color: C.sub }}>
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[10.5px] font-bold tabular-nums"
                  style={{ ...mono, color: k.up ? C.ok : C.warn }}
                >
                  {k.up ? (
                    <ArrowUpRight size={11} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={11} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
              </div>
              <p
                className="mt-1.5 text-[22px] font-bold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {k.value}
              </p>
              <div className="mt-2.5">
                <MiniSpark data={k.spark} color={k.up ? C.cyan : C.warn} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Volgende actie */}
          {nextAction && (
            <div
              className="relative overflow-hidden rounded-2xl p-5 lg:col-span-2"
              style={{ ...glassCard, background: "rgba(21,34,80,0.5)" }}
              role="alert"
            >
              <span
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full"
                style={{ background: C.cyanGlow, filter: "blur(44px)" }}
                aria-hidden="true"
              />
              <p
                className="relative flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.cyan }}
              >
                <Sparkles size={13} aria-hidden="true" /> Volgende beste actie
              </p>
              <h2
                className="relative mt-2 text-[19px] font-bold leading-snug"
                style={{ ...head, color: C.ink }}
              >
                {nextAction.titel}
              </h2>
              <p className="relative mt-1.5 max-w-md text-[13px]" style={{ color: C.sub }}>
                {nextAction.detail}
              </p>
              <div className="relative mt-4">
                <CyanButton solid onClick={() => onGo("verificatie")}>
                  {nextAction.cta} <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
                </CyanButton>
              </div>
            </div>
          )}

          {/* Reactie-ritme + bericht met error→loading→ok */}
          <div className="rounded-2xl p-5" style={glassCard}>
            <div className="flex items-center justify-between">
              <h3
                className="flex items-center gap-1.5 text-[13px] font-bold"
                style={{ ...head, color: C.ink }}
              >
                <Layers size={15} style={{ color: C.cyan }} aria-hidden="true" /> Reactie-ritme
              </h3>
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ ...mono, color: C.cyan }}
              >
                7 dagen
              </span>
            </div>
            <div className="mt-3">
              <GlassBars data={KPIS[1]?.spark ?? [3, 4, 4, 5, 6, 5, 7]} color={C.cyan} />
            </div>
            <div className="mt-4 border-t pt-3" style={{ borderColor: C.edgeSoft }}>
              <p
                className="mb-2 text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: C.faint }}
              >
                Nieuwste bericht
              </p>
              {feed === "error" && (
                <div className="text-center" role="alert">
                  <CircleAlert
                    size={20}
                    className="mx-auto"
                    style={{ color: C.alert }}
                    aria-hidden="true"
                  />
                  <p className="mt-1.5 text-[12px]" style={{ color: C.sub }}>
                    Kon berichten niet laden.
                  </p>
                  <button
                    onClick={retry}
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-white/[0.06] ${RING}`}
                    style={{ border: `1px solid ${C.edgeSoft}`, color: C.ink }}
                  >
                    <RotateCcw size={12} aria-hidden="true" /> Opnieuw
                  </button>
                </div>
              )}
              {feed === "loading" && (
                <div className="space-y-2" role="status" aria-live="polite">
                  <span className="sr-only">Laden…</span>
                  <span
                    className="block h-3 rounded-full"
                    style={{
                      background: C.glassStrong,
                      width: "60%",
                      animation: "kg-pulse 1.4s infinite",
                    }}
                  />
                  <span
                    className="block h-3 rounded-full"
                    style={{
                      background: C.glassStrong,
                      width: "85%",
                      animation: "kg-pulse 1.4s infinite",
                    }}
                  />
                </div>
              )}
              {feed === "ok" && (
                <div>
                  <p className="text-[12.5px] font-semibold" style={{ color: C.ink }}>
                    {BERICHTEN[0]?.van}
                  </p>
                  <p className="mt-0.5 text-[11.5px]" style={{ color: C.sub }}>
                    {BERICHTEN[0]?.preview}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Beste matches */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2
              className="flex items-center gap-2 text-[16px] font-bold"
              style={{ ...head, color: C.ink }}
            >
              <TrendingUp size={17} style={{ color: C.cyan }} aria-hidden="true" /> Top-matches
            </h2>
            <button
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12.5px] font-bold ${RING}`}
              style={{ color: C.cyan }}
            >
              Alles <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className={`rounded-2xl p-4 text-left transition-colors hover:bg-white/[0.05] ${RING}`}
                style={glassCard}
              >
                <div className="flex items-start justify-between">
                  <RingGauge value={o.match} size={56} label="match" />
                  <span
                    className="text-[10px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.faint }}
                  >
                    {o.id}
                  </span>
                </div>
                <p
                  className="mt-3 text-[14.5px] font-bold leading-snug"
                  style={{ ...head, color: C.ink }}
                >
                  {o.titel}
                </p>
                <p
                  className="mt-1 flex items-center gap-1 truncate text-[12px]"
                  style={{ color: C.sub }}
                >
                  <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span
                    className="text-[13px] font-bold tabular-nums"
                    style={{ ...mono, color: C.cyan }}
                  >
                    {o.tarief}
                  </span>
                  <span className="text-[11.5px]" style={{ color: C.faint }}>
                    {o.uren}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({ onOpen }: { onOpen: (id?: string) => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  ).sort((a, b) => (sort === "match" ? b.match - a.match : euros(b.tarief) - euros(a.tarief)));

  return (
    <div>
      <PageHead
        kicker="Kansen"
        title="Marktplaats"
        sub="Opdrachten gerangschikt op je match — de sterkste kansen bovenaan, transparant onderbouwd."
        right={
          <div
            className="inline-flex items-center gap-0.5 rounded-xl p-0.5"
            style={{ background: C.glassStrong, border: `1px solid ${C.edgeSoft}` }}
            role="tablist"
            aria-label="Sorteren"
          >
            {(["match", "tarief"] as const).map((s) => {
              const on = s === sort;
              return (
                <button
                  key={s}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setSort(s)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition-colors ${RING}`}
                  style={{
                    background: on ? C.cyanSoft : "transparent",
                    color: on ? C.cyan : C.sub,
                    border: `1px solid ${on ? C.cyanEdge : "transparent"}`,
                  }}
                >
                  {s === "match" ? "Match" : "Tarief"}
                </button>
              );
            })}
          </div>
        }
      />
      <div className="px-6 py-5">
        <div className="mb-4 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5" style={glassCard}>
          <Search size={16} aria-hidden="true" style={{ color: C.cyan }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#728099]"
            style={{ color: C.ink }}
          />
        </div>

        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center"
            style={{ border: `1px dashed ${C.hair}`, background: C.glassSoft }}
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: C.glassStrong, border: `1px solid ${C.edgeSoft}` }}
              aria-hidden="true"
            >
              <Search size={20} style={{ color: C.cyan }} />
            </span>
            <p className="mt-4 text-[15px] font-bold" style={{ ...head, color: C.ink }}>
              Geen opdrachten gevonden
            </p>
            <p className="mt-1 max-w-xs text-[12.5px]" style={{ color: C.sub }}>
              Niets komt overeen met “{q}”. Verbreed je zoekopdracht en probeer opnieuw.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-4 rounded-xl px-4 py-2 text-[12.5px] font-bold transition-colors hover:bg-white/[0.06] ${RING}`}
              style={{ border: `1px solid ${C.edgeSoft}`, color: C.ink }}
            >
              Zoekopdracht wissen
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((o, i) => (
              <li key={o.id} className="rounded-2xl p-4" style={glassCard}>
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold tabular-nums"
                      style={{
                        ...mono,
                        background: i === 0 ? C.cyanSoft : C.glassStrong,
                        color: i === 0 ? C.cyan : C.faint,
                        border: `1px solid ${i === 0 ? C.cyanEdge : C.edgeSoft}`,
                      }}
                    >
                      {i + 1}
                    </span>
                    <RingGauge value={o.match} size={58} label="match" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-[10px] font-semibold tabular-nums"
                        style={{ ...mono, color: C.faint }}
                      >
                        {o.id}
                      </span>
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                          style={{
                            background: C.glassStrong,
                            color: C.inkSoft,
                            border: `1px solid ${C.edgeSoft}`,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1 text-[15px] font-bold" style={{ ...head, color: C.ink }}>
                      {o.titel}
                    </p>
                    <p
                      className="mt-0.5 flex items-center gap-1 text-[12.5px]"
                      style={{ color: C.sub }}
                    >
                      <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
                      <span className="font-bold tabular-nums" style={{ ...mono, color: C.cyan }}>
                        {o.tarief}
                      </span>
                      <span style={{ color: C.sub }}>{o.uren}</span>
                      <span style={{ color: C.sub }}>{o.start}</span>
                    </div>
                  </div>
                  <div className="self-center">
                    <CyanButton solid onClick={() => onOpen(o.id)}>
                      Bekijk <ArrowRight size={14} strokeWidth={2.6} aria-hidden="true" />
                    </CyanButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div>
      <PageHead
        kicker={opdracht.id}
        title={opdracht.titel}
        sub={`${opdracht.opdrachtgever} · ${opdracht.plaats}`}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[12.5px] font-bold transition-colors hover:bg-white/[0.06] ${RING}`}
              style={{ border: `1px solid ${C.edgeSoft}`, color: C.sub }}
            >
              <ArrowLeft size={14} aria-hidden="true" /> Terug
            </button>
            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-transform active:scale-[0.98] disabled:opacity-90 ${RING}`}
              style={{
                background: state === "sent" ? C.okSoft : C.cyan,
                color: state === "sent" ? C.ok : C.baseDeep,
                border: state === "sent" ? `1px solid ${C.okEdge}` : "none",
                boxShadow: state === "sent" ? "none" : `0 8px 24px -10px ${C.cyanGlow}`,
              }}
            >
              {state === "idle" && (
                <>
                  <Send size={15} strokeWidth={2.4} aria-hidden="true" /> Reageer nu
                </>
              )}
              {state === "sending" && "Versturen…"}
              {state === "sent" && (
                <>
                  <Check size={15} strokeWidth={3} aria-hidden="true" /> Verstuurd
                </>
              )}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 px-6 py-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Kerncijfers */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Tarief", v: opdracht.tarief },
              { l: "Omvang", v: opdracht.uren },
              { l: "Start", v: opdracht.start },
              { l: "Match", v: `${opdracht.match}%` },
            ].map((m) => (
              <div key={m.l} className="rounded-2xl p-4" style={glassCard}>
                <p
                  className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {m.l}
                </p>
                <p
                  className="mt-1.5 text-[17px] font-bold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {m.v}
                </p>
              </div>
            ))}
          </div>

          {/* Verklaarbare match */}
          <div className="rounded-2xl p-5" style={glassCard}>
            <h3 className="text-[16px] font-bold" style={{ ...head, color: C.ink }}>
              Waarom deze match
            </h3>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
              Transparant onderbouwd op basis van je geverifieerde profiel.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.ok }}
                >
                  <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.plus.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ color: C.inkSoft }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        style={{ background: C.okSoft, border: `1px solid ${C.okEdge}` }}
                      >
                        <Check
                          size={10}
                          strokeWidth={3}
                          style={{ color: C.ok }}
                          aria-hidden="true"
                        />
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.warn }}
                >
                  <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Aandachtspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ color: C.sub }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        style={{ background: C.warnSoft, border: `1px solid ${C.warnEdge}` }}
                      >
                        <AlertTriangle
                          size={9}
                          strokeWidth={2.6}
                          style={{ color: C.warn }}
                          aria-hidden="true"
                        />
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div
            className="relative overflow-hidden rounded-2xl p-5"
            style={{ ...glassCard, background: "rgba(21,34,80,0.5)" }}
          >
            <span
              className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full"
              style={{ background: C.cyanGlow, filter: "blur(40px)" }}
              aria-hidden="true"
            />
            <div className="relative flex items-center gap-4">
              <RingGauge value={opdracht.match} size={72} label="match" />
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.cyan }}
                >
                  Match-score
                </p>
                <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
                  Sterke koppeling met je profiel — reageer nu voor de beste kans.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl p-5" style={glassCard}>
            <p
              className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.cyan }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> Compliance-eis
            </p>
            <p className="mt-2 text-[12.5px]" style={{ color: C.sub }}>
              Vereiste credentials voor deze opdracht. Je voldoet aan de kern-eisen.
            </p>
            <ul className="mt-3 space-y-2.5">
              {CREDENTIALS.slice(0, 3).map((c) => {
                const t = credTone(c.status);
                const Icon = t.Icon;
                return (
                  <li key={c.naam} className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: t.soft, border: `1px solid ${t.edge}` }}
                    >
                      <Icon size={15} style={{ color: t.fg }} aria-hidden="true" />
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px]"
                      style={{ color: C.inkSoft }}
                    >
                      {c.naam}
                    </span>
                    <StatusPill status={c.status} />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const expiring = CREDENTIALS.find((c) => c.status === "EXPIRING");
  const pct = Math.round((verified / total) * 100);

  return (
    <div>
      <PageHead
        kicker="Vertrouwen"
        title="Verificatie"
        sub="Je vertrouwensniveau — elk geverifieerd bewijsstuk maakt je zichtbaarder en gevraagder."
      />
      <div className="space-y-5 px-6 py-5">
        {/* Vertrouwens-meter */}
        <div
          className="relative flex flex-wrap items-center gap-5 overflow-hidden rounded-3xl p-6"
          style={{ ...glassCard, background: "rgba(16,26,61,0.55)" }}
        >
          <span
            className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full"
            style={{ background: C.cyanGlow, filter: "blur(56px)" }}
            aria-hidden="true"
          />
          <RingGauge value={pct} size={92} label="verified" />
          <div className="relative min-w-[180px] flex-1">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.cyan }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
            </p>
            <p
              className="mt-2 text-[24px] font-bold tabular-nums"
              style={{ ...mono, color: C.ink }}
            >
              {verified}/{total} geverifieerd
            </p>
            <p className="mt-1 text-[12.5px]" style={{ color: C.sub }}>
              Nog {total - verified} bewijsstuk{total - verified === 1 ? "" : "ken"} te gaan voor
              een volledig profiel.
            </p>
          </div>
        </div>

        {/* Verloop-waarschuwing + herstelactie */}
        {expiring && (
          <div
            className="flex flex-wrap items-center gap-4 rounded-2xl p-4"
            style={{ ...glassCard, background: C.warnSoft, borderColor: C.warnEdge }}
            role="alert"
          >
            <ShieldAlert
              size={20}
              style={{ color: C.warn }}
              className="shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-[180px] flex-1">
              <p className="text-[13.5px] font-bold" style={{ color: C.ink }}>
                {expiring.naam} verloopt binnenkort
              </p>
              <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
                {expiring.detail}. Vernieuw op tijd om je vertrouwensniveau te behouden.
              </p>
            </div>
            <button
              onClick={() => onGo("acties")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-bold transition-transform active:scale-[0.98] ${RING}`}
              style={{ background: C.warn, color: C.baseDeep }}
            >
              Vernieuwen <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Credential-lijst */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            const Icon = t.Icon;
            return (
              <div
                key={c.naam}
                className="flex items-center gap-3.5 rounded-2xl p-4"
                style={glassCard}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: t.soft, border: `1px solid ${t.edge}` }}
                >
                  <Icon size={20} style={{ color: t.fg }} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold" style={{ color: C.ink }}>
                    {c.naam}
                  </p>
                  <p className="text-[11.5px]" style={{ color: C.sub }}>
                    {c.detail}
                  </p>
                </div>
                <StatusPill status={c.status} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div>
      <PageHead
        kicker="Volgende stappen"
        title="Acties"
        sub="Je actielijst op volgorde van urgentie — werk ze weg en houd je profiel scherp."
      />
      <div className="space-y-3 px-6 py-5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const fg = warn ? C.warn : C.cyan;
          const soft = warn ? C.warnSoft : C.cyanSoft;
          const edge = warn ? C.warnEdge : C.cyanEdge;
          return (
            <div
              key={a.titel}
              className="flex flex-wrap items-start gap-4 rounded-2xl p-4"
              style={{ ...glassCard, borderColor: warn ? C.warnEdge : C.edgeSoft }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold tabular-nums"
                style={{ ...mono, background: soft, color: fg, border: `1px solid ${edge}` }}
              >
                {i + 1}
              </span>
              <div className="min-w-[180px] flex-1">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: fg }}
                >
                  {warn ? "Waarschuwing" : "Kans"}
                </p>
                <p className="mt-0.5 text-[14px] font-bold" style={{ ...head, color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`inline-flex items-center gap-1.5 self-center rounded-xl px-3.5 py-2.5 text-[12.5px] font-bold transition-transform active:scale-[0.98] ${RING}`}
                style={
                  warn
                    ? { background: C.warn, color: C.baseDeep }
                    : {
                        background: C.cyan,
                        color: C.baseDeep,
                        boxShadow: `0 8px 24px -12px ${C.cyanGlow}`,
                      }
                }
              >
                {a.cta} <ChevronRight size={14} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          );
        })}

        <div
          className="flex items-center gap-3 rounded-2xl p-4"
          style={{ ...glassCard, background: C.cyanSoft, borderColor: C.cyanEdge }}
        >
          <Sparkles size={16} strokeWidth={2.4} style={{ color: C.cyan }} aria-hidden="true" />
          <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
            Verder is alles op orde. Nieuwe kansen verschijnen hier vanzelf.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );
  const totaal = betaald + open;
  const pct = totaal ? Math.round((betaald / totaal) * 100) : 0;

  return (
    <div>
      <PageHead
        kicker="Omzet"
        title="Facturen"
        sub="Je omzet in beeld — hoeveel er binnen is en wat nog onderweg is."
        right={
          <CyanButton solid>
            <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
          </CyanButton>
        }
      />
      <div className="space-y-5 px-6 py-5">
        <div
          className="relative flex flex-wrap items-center gap-5 overflow-hidden rounded-3xl p-5"
          style={{ ...glassCard, background: "rgba(16,26,61,0.55)" }}
        >
          <span
            className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full"
            style={{ background: C.cyanGlow, filter: "blur(52px)" }}
            aria-hidden="true"
          />
          <RingGauge value={pct} size={80} label="betaald" />
          <div className="relative flex flex-1 flex-wrap gap-6">
            <div>
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.ok }}
              >
                Ontvangen
              </p>
              <p
                className="mt-1 text-[24px] font-bold tabular-nums"
                style={{ ...mono, color: C.ink }}
              >
                € {betaald.toLocaleString("nl-NL")}
              </p>
            </div>
            <div>
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.warn }}
              >
                Openstaand
              </p>
              <p
                className="mt-1 text-[24px] font-bold tabular-nums"
                style={{ ...mono, color: C.ink }}
              >
                € {open.toLocaleString("nl-NL")}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl" style={glassCard}>
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
                style={{ background: C.glassStrong, color: C.faint }}
              >
                <th className="px-4 py-3">Nummer</th>
                <th className="px-4 py-3">Klant</th>
                <th className="hidden px-4 py-3 sm:table-cell">Datum</th>
                <th className="px-4 py-3 text-right">Bedrag</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const t = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.edgeSoft}` }}
                  >
                    <td
                      className="px-4 py-3.5 text-[12px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.sub }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3.5 text-[13px]" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="hidden px-4 py-3.5 text-[12px] tabular-nums sm:table-cell"
                      style={{ ...mono, color: C.faint }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-4 py-3.5 text-right text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ color: t.fg, background: t.soft, border: `1px solid ${t.edge}` }}
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
      </div>
    </div>
  );
}
