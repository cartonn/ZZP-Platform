"use client";

// Concept 331 — "Nevel" · atmosferische mesh-gradient, sfeer als hiërarchie (light).
// Zachte, functionele aurora-/mesh-gradients als kleurige waas ACHTER heldere, bijna-witte
// glaskaarten. Licht, luchtig, kalm — de gradient stuurt de aandacht: het belangrijkste paneel
// krijgt de warmste gloed, rustige informatie ligt op koel-neutrale nevel. Eén koele
// indigo→cyaan→roze mesh, veel witruimte, subtiele blur-lagen en fijne haarlijnen. Verificatie
// en verklaarbare matching blijven leesbaar met statuschips (label + icoon). Geen drukte, geen
// decoratie zonder functie.
// Fonts: --font-lab-geist (koppen) + --font-lab-inter (tekst) + --font-lab-mono (cijfers).

import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Bell,
  ChevronRight,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  BadgeCheck,
  MapPin,
  Send,
  Plus,
  RotateCcw,
  Sparkles,
  Command,
  Wind,
  Filter,
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

/* ---------- Palet (bijna-wit glas op koele mesh-nevel) ---------- */

const C = {
  canvas: "#f5f6fb",
  glass: "rgba(255,255,255,0.72)",
  glassSolid: "#ffffff",
  glassAlt: "rgba(255,255,255,0.55)",
  ink: "#171a2b",
  inkSoft: "#3a3f57",
  sub: "#5b6180",
  faint: "#9096b3",
  line: "rgba(23,26,43,0.08)",
  lineSoft: "rgba(23,26,43,0.05)",
  indigo: "#5457e6",
  indigoSoft: "rgba(84,87,230,0.10)",
  cyaan: "#0ea5c4",
  cyaanSoft: "rgba(14,165,196,0.10)",
  roze: "#d9569b",
  rozeSoft: "rgba(217,86,155,0.10)",
  ok: "#0f9d58",
  okSoft: "rgba(15,157,88,0.12)",
  info: "#2b6fe0",
  infoSoft: "rgba(43,111,224,0.12)",
  warn: "#b26a00",
  warnSoft: "rgba(178,106,0,0.13)",
  alert: "#d13b3b",
  alertSoft: "rgba(209,59,59,0.12)",
};

const head = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };
const body = { fontFamily: "var(--font-lab-inter), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5457e6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f6fb]";

/* ---------- Status → betekenis ---------- */

type Tone = { label: string; fg: string; soft: string; Icon: LucideIcon };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.ok, soft: C.okSoft, Icon: BadgeCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.info, soft: C.infoSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", fg: C.warn, soft: C.warnSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.alert, soft: C.alertSoft, Icon: XCircle };
  }
}

function factuurTone(status: string): { fg: string; soft: string } {
  if (status === "Betaald") return { fg: C.ok, soft: C.okSoft };
  if (status === "Openstaand") return { fg: C.warn, soft: C.warnSoft };
  return { fg: C.faint, soft: C.lineSoft };
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
  documenten: Receipt,
  berichten: Bell,
};

/* ---------- Achtergrond-nevel (mesh/aurora) ---------- */

// Zachte mesh-gradient: drie kleurige blobs door blur tot één rustige waas gemengd.
// warmth stuurt de hiërarchie — hoger = warmere roze/indigo focus.
function MeshBackdrop({ warmth = 0.5 }: { warmth?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute -left-[10%] -top-[20%] h-[55%] w-[55%] rounded-full"
        style={{
          background: `radial-gradient(circle, ${C.indigo} 0%, transparent 70%)`,
          opacity: 0.16 + warmth * 0.1,
          filter: "blur(70px)",
        }}
      />
      <div
        className="absolute right-[-8%] top-[6%] h-[48%] w-[48%] rounded-full"
        style={{
          background: `radial-gradient(circle, ${C.cyaan} 0%, transparent 70%)`,
          opacity: 0.14,
          filter: "blur(72px)",
        }}
      />
      <div
        className="absolute bottom-[-18%] left-[24%] h-[52%] w-[52%] rounded-full"
        style={{
          background: `radial-gradient(circle, ${C.roze} 0%, transparent 70%)`,
          opacity: 0.1 + warmth * 0.14,
          filter: "blur(80px)",
        }}
      />
    </div>
  );
}

/* ---------- Bouwstenen ---------- */

function Glass({
  children,
  className = "",
  focus = false,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  focus?: boolean;
  as?: "div" | "section";
}) {
  const Tag = as;
  return (
    <Tag
      className={`relative rounded-3xl ${className}`}
      style={{
        background: focus ? "rgba(255,255,255,0.82)" : C.glass,
        border: `1px solid ${focus ? "rgba(84,87,230,0.22)" : C.line}`,
        boxShadow: focus
          ? "0 22px 60px -30px rgba(84,87,230,0.5), inset 0 1px 0 rgba(255,255,255,0.7)"
          : "0 12px 40px -28px rgba(23,26,43,0.35), inset 0 1px 0 rgba(255,255,255,0.6)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
    >
      {children}
    </Tag>
  );
}

function StatusPill({ status, subtle = false }: { status: CredStatus; subtle?: boolean }) {
  const t = credTone(status);
  const Icon = t.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        ...body,
        color: t.fg,
        background: subtle ? "transparent" : t.soft,
        border: subtle ? `1px solid ${t.soft}` : "none",
      }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {t.label}
    </span>
  );
}

function AreaSpark({
  data,
  color,
  height = 88,
}: {
  data: number[];
  color: string;
  height?: number;
}) {
  const w = 320;
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const id = `nv-${color.replace(/[^\w]/g, "")}-${height}`;
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
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="3.6" fill={color} />}
    </svg>
  );
}

function MiniSpark({ data, color }: { data: number[]; color: string }) {
  const w = 76;
  const h = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 4) - 2;
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

// Zachte gloed-meter: percentage als lichtboog met kleurige aura.
function GlowMeter({
  value,
  size = 76,
  color = C.indigo,
  label,
}: {
  value: number;
  size?: number;
  color?: string;
  label?: string;
}) {
  const stroke = size >= 90 ? 7 : 5.5;
  const r = size / 2 - stroke;
  const circ = 2 * Math.PI * r;
  const id = `glow-${color.replace(/[^\w]/g, "")}-${size}`;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={C.roze} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(23,26,43,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
          style={{ filter: `drop-shadow(0 0 5px ${color}80)` }}
        />
      </svg>
      <span className="flex flex-col items-center leading-none">
        <span
          className="font-semibold tabular-nums"
          style={{ ...mono, color: C.ink, fontSize: size >= 90 ? 21 : 15 }}
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
    <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-1 pt-7">
      <div className="min-w-0">
        <p
          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]"
          style={{ ...mono, color: C.indigo }}
        >
          <Wind size={12} aria-hidden="true" /> {kicker}
        </p>
        <h1
          className="mt-2 text-[28px] font-semibold leading-none tracking-tight"
          style={{ ...head, color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2 max-w-xl text-[13px]" style={{ ...body, color: C.sub }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept331() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const [palette, setPalette] = useState(false);
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = window.setTimeout(() => setReady(true), 320);
    return () => window.clearTimeout(t);
  }, [screen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
      if (e.key === "Escape") setPalette(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const warmth = screen === "dashboard" ? 0.7 : screen === "verificatie" ? 0.5 : 0.35;

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, background: C.canvas, color: C.ink }}
    >
      <style>{`@keyframes nv-fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes nv-pulse{0%,100%{opacity:.45}50%{opacity:.8}}
      @keyframes nv-drift{0%{transform:translate(0,0)}50%{transform:translate(2%,-2%)}100%{transform:translate(0,0)}}`}</style>

      <MeshBackdrop warmth={warmth} />

      <div className="relative flex min-h-[680px] flex-col lg:flex-row">
        {/* Zij-nav — zwevend glas */}
        <aside className="shrink-0 px-4 pt-4 lg:w-64 lg:px-5 lg:pb-6 lg:pt-6">
          <Glass className="p-3 lg:sticky lg:top-6">
            <div className="flex items-center gap-2.5 px-2 py-2">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-2xl text-[15px] font-semibold text-white"
                style={{
                  ...head,
                  background: `linear-gradient(135deg, ${C.indigo}, ${C.roze})`,
                }}
                aria-hidden="true"
              >
                Z
              </span>
              <div className="leading-tight">
                <p className="text-[14px] font-semibold tracking-tight" style={head}>
                  Nevel
                </p>
                <p className="text-[10.5px]" style={{ color: C.faint }}>
                  ZZP-werkruimte
                </p>
              </div>
            </div>

            <button
              onClick={() => setPalette(true)}
              className={`mt-2 flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-[12.5px] transition-colors hover:bg-white/70 ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.sub }}
            >
              <Search size={14} aria-hidden="true" />
              <span className="flex-1">Zoeken…</span>
              <kbd
                className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ ...mono, background: C.indigoSoft, color: C.indigo }}
              >
                ⌘K
              </kbd>
            </button>

            <nav className="mt-3 space-y-1" aria-label="Hoofdnavigatie">
              {SCREENS.map((s) => {
                const Icon = NAV_ICONS[s.key];
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] transition-all ${RING}`}
                    style={{
                      color: on ? C.ink : C.sub,
                      background: on
                        ? "linear-gradient(120deg, rgba(84,87,230,0.16), rgba(217,86,155,0.12))"
                        : "transparent",
                      fontWeight: on ? 600 : 500,
                      border: `1px solid ${on ? "rgba(84,87,230,0.22)" : "transparent"}`,
                    }}
                  >
                    <Icon size={16} aria-hidden="true" style={{ color: on ? C.indigo : C.faint }} />
                    {s.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-3 border-t pt-3" style={{ borderColor: C.line }}>
              <div className="flex items-center gap-2.5 px-2 py-1.5">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{
                    ...mono,
                    background: `linear-gradient(135deg, ${C.cyaan}, ${C.indigo})`,
                  }}
                  aria-hidden="true"
                >
                  {PROFIEL.initialen}
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</p>
                  <p
                    className="flex items-center gap-1 text-[10.5px] font-medium"
                    style={{ color: C.ok }}
                  >
                    <ShieldCheck size={10} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
                  </p>
                </div>
              </div>
            </div>
          </Glass>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 pb-8">
          <div
            key={screen}
            className="mx-auto max-w-5xl"
            style={{ animation: "nv-fade 0.34s ease" }}
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
              </>
            )}
          </div>
        </main>
      </div>

      {palette && <CommandPalette onClose={() => setPalette(false)} onGo={setScreen} />}
    </div>
  );
}

/* ---------- Command-palette ---------- */

function CommandPalette({ onClose, onGo }: { onClose: () => void; onGo: (k: ScreenKey) => void }) {
  const [q, setQ] = useState("");
  const items = SCREENS.filter((s) => s.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div
      className="absolute inset-0 z-30 flex items-start justify-center px-4 pt-24"
      style={{ background: "rgba(23,26,43,0.28)", backdropFilter: "blur(4px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Snelzoeken"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-3xl"
        style={{
          background: "rgba(255,255,255,0.9)",
          border: `1px solid ${C.line}`,
          boxShadow: "0 30px 80px -30px rgba(23,26,43,0.6)",
          backdropFilter: "blur(24px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <Command size={16} style={{ color: C.indigo }} aria-hidden="true" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ga naar scherm…"
            aria-label="Zoeken naar scherm"
            className="w-full bg-transparent text-[14px] outline-none"
            style={{ color: C.ink }}
          />
          <kbd
            className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ ...mono, background: C.lineSoft, color: C.faint }}
          >
            esc
          </kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto p-2">
          {items.length === 0 ? (
            <li className="px-3 py-6 text-center text-[12.5px]" style={{ color: C.faint }}>
              Geen resultaten voor “{q}”.
            </li>
          ) : (
            items.map((s) => {
              const Icon = NAV_ICONS[s.key];
              return (
                <li key={s.key}>
                  <button
                    onClick={() => {
                      onGo(s.key);
                      onClose();
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-[rgba(84,87,230,0.08)] ${RING}`}
                    style={{ color: C.ink }}
                  >
                    <Icon size={15} style={{ color: C.indigo }} aria-hidden="true" />
                    {s.label}
                    <ArrowRight size={13} className="ml-auto" style={{ color: C.faint }} />
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}

/* ---------- Skeleton ---------- */

function ScreenSkeleton() {
  return (
    <div className="px-6 py-7" role="status" aria-live="polite">
      <span className="sr-only">Scherm wordt geladen…</span>
      <div
        className="h-8 w-52 rounded-2xl"
        style={{ background: C.glass, animation: "nv-pulse 1.3s infinite" }}
      />
      <div
        className="mt-6 h-44 rounded-3xl"
        style={{
          background: C.glass,
          border: `1px solid ${C.line}`,
          animation: "nv-pulse 1.3s infinite",
        }}
      />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-3xl"
            style={{
              background: C.glass,
              border: `1px solid ${C.line}`,
              animation: "nv-pulse 1.3s infinite",
            }}
          />
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
  const warn = ACTIES[0];
  const matchAvg = Math.round(OPDRACHTEN.reduce((s, o) => s + o.match, 0) / OPDRACHTEN.length);

  const retry = () => {
    setFeed("loading");
    window.setTimeout(() => setFeed("ok"), 700);
  };

  return (
    <div>
      <PageHead
        kicker="Vandaag"
        title={`Rustig overzicht, ${PROFIEL.naam.split(" ")[0]}`}
        sub="Alleen wat telt — de warmste kaart vraagt je aandacht, de rest ligt kalm op de achtergrond."
      />

      <div className="space-y-5 px-6 py-5">
        {/* Focus-hero met warmste gloed */}
        <Glass focus className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4 p-6">
            <div className="min-w-0">
              <p
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.indigo }}
              >
                <Sparkles size={13} aria-hidden="true" /> {hero.label}
              </p>
              <p
                className="mt-2 text-[44px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {hero.value}
              </p>
              <p className="mt-2 flex items-center gap-2 text-[12.5px]" style={{ color: C.sub }}>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                  style={{
                    background: hero.up ? C.okSoft : C.warnSoft,
                    color: hero.up ? C.ok : C.warn,
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
            <GlowMeter value={matchAvg} size={92} color={C.indigo} label="match" />
          </div>
          <div className="px-4 pb-4">
            <AreaSpark data={hero.spark} color={C.indigo} height={84} />
          </div>
          <div
            className="flex gap-1.5 overflow-x-auto p-3"
            style={{ borderTop: `1px solid ${C.line}` }}
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
                  className={`flex flex-1 shrink-0 flex-col items-start gap-1 rounded-2xl px-3 py-2 text-left transition-colors ${RING}`}
                  style={{
                    background: on ? C.indigoSoft : "transparent",
                    border: `1px solid ${on ? "rgba(84,87,230,0.2)" : "transparent"}`,
                  }}
                >
                  <span
                    className="whitespace-nowrap text-[10.5px] font-medium"
                    style={{ color: on ? C.indigo : C.sub }}
                  >
                    {k.label}
                  </span>
                  <span
                    className="text-[15px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {k.value}
                  </span>
                </button>
              );
            })}
          </div>
        </Glass>

        {/* KPI-tegels */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Glass key={k.label} className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium" style={{ color: C.sub }}>
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold tabular-nums"
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
                className="mt-1.5 text-[22px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {k.value}
              </p>
              <div className="mt-2.5">
                <MiniSpark data={k.spark} color={k.up ? C.indigo : C.roze} />
              </div>
            </Glass>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Volgende actie */}
          {warn && (
            <Glass className="p-5 lg:col-span-2" focus>
              <p
                className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.roze }}
              >
                <AlertTriangle size={13} aria-hidden="true" /> Vraagt je aandacht
              </p>
              <h2
                className="mt-2 text-[19px] font-semibold leading-snug"
                style={{ ...head, color: C.ink }}
              >
                {warn.titel}
              </h2>
              <p className="mt-1.5 max-w-md text-[13px]" style={{ color: C.sub }}>
                {warn.detail}
              </p>
              <button
                onClick={() => onGo("verificatie")}
                className={`mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-semibold text-white transition-transform active:scale-[0.98] ${RING}`}
                style={{ background: `linear-gradient(120deg, ${C.indigo}, ${C.roze})` }}
              >
                {warn.cta} <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </Glass>
          )}

          {/* Berichten met error→loading→ok */}
          <Glass className="p-5">
            <div className="flex items-center justify-between">
              <h3
                className="flex items-center gap-1.5 text-[13px] font-semibold"
                style={{ ...head, color: C.ink }}
              >
                <Bell size={15} style={{ color: C.indigo }} aria-hidden="true" /> Laatste bericht
              </h3>
              <button
                onClick={() => onGo("acties")}
                className={`text-[11px] font-semibold ${RING}`}
                style={{ color: C.indigo }}
              >
                Alles
              </button>
            </div>
            <div className="mt-4">
              {feed === "error" && (
                <div className="text-center" role="alert">
                  <XCircle
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
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-white/70 ${RING}`}
                    style={{ border: `1px solid ${C.line}`, color: C.ink }}
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
                      background: C.lineSoft,
                      width: "60%",
                      animation: "nv-pulse 1.3s infinite",
                    }}
                  />
                  <span
                    className="block h-3 rounded-full"
                    style={{
                      background: C.lineSoft,
                      width: "85%",
                      animation: "nv-pulse 1.3s infinite",
                    }}
                  />
                </div>
              )}
              {feed === "ok" && BERICHTEN[0] && (
                <div>
                  <p className="text-[12.5px] font-semibold" style={{ color: C.ink }}>
                    {BERICHTEN[0].van}
                  </p>
                  <p className="mt-0.5 text-[11.5px]" style={{ color: C.sub }}>
                    {BERICHTEN[0].preview}
                  </p>
                </div>
              )}
            </div>
          </Glass>
        </div>

        {/* Beste matches */}
        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2
              className="flex items-center gap-2 text-[16px] font-semibold"
              style={{ ...head, color: C.ink }}
            >
              <Sparkles size={16} style={{ color: C.indigo }} aria-hidden="true" /> Beste matches
            </h2>
            <button
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-1 text-[12.5px] font-semibold ${RING}`}
              style={{ color: C.indigo }}
            >
              Alles <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OPDRACHTEN.map((o, i) => (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className={`text-left ${RING} rounded-3xl`}
              >
                <Glass focus={i === 0} className="h-full p-4">
                  <div className="flex items-start justify-between">
                    <GlowMeter value={o.match} size={54} color={C.indigo} label="match" />
                    <span
                      className="text-[10px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.faint }}
                    >
                      {o.id}
                    </span>
                  </div>
                  <p
                    className="mt-3 text-[14.5px] font-semibold leading-snug"
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
                      className="text-[13px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.indigo }}
                    >
                      {o.tarief}
                    </span>
                    <span className="text-[11.5px]" style={{ color: C.faint }}>
                      {o.uren}
                    </span>
                  </div>
                </Glass>
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
  const filtered = useMemo(
    () =>
      OPDRACHTEN.filter(
        (o) =>
          o.titel.toLowerCase().includes(q.toLowerCase()) ||
          o.plaats.toLowerCase().includes(q.toLowerCase()) ||
          o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
      ).sort((a, b) => (sort === "match" ? b.match - a.match : euros(b.tarief) - euros(a.tarief))),
    [q, sort],
  );

  return (
    <div>
      <PageHead
        kicker="Kansen"
        title="Marktplaats"
        sub="Opdrachten die bij je passen, rustig gerangschikt — de beste kans krijgt de warmste kaart."
        right={
          <div
            className="inline-flex items-center gap-0.5 rounded-2xl p-0.5"
            style={{ background: C.glassAlt, border: `1px solid ${C.line}` }}
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
                  className={`rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-colors ${RING}`}
                  style={{
                    background: on ? C.glassSolid : "transparent",
                    color: on ? C.ink : C.sub,
                    border: `1px solid ${on ? C.line : "transparent"}`,
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
        <Glass className="mb-4 flex items-center gap-2.5 px-3.5 py-2.5">
          <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none"
            style={{ color: C.ink }}
          />
          <Filter size={15} style={{ color: C.faint }} aria-hidden="true" />
        </Glass>

        {filtered.length === 0 ? (
          <Glass className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: C.indigoSoft }}
              aria-hidden="true"
            >
              <Search size={20} style={{ color: C.indigo }} />
            </span>
            <p className="mt-4 text-[15px] font-semibold" style={{ ...head, color: C.ink }}>
              Niets gevonden in de nevel
            </p>
            <p className="mt-1 max-w-xs text-[12.5px]" style={{ color: C.sub }}>
              Niets komt overeen met “{q}”. Verbreed je zoekopdracht.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-4 rounded-2xl px-4 py-2 text-[12.5px] font-semibold transition-colors hover:bg-white/70 ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.ink }}
            >
              Zoekopdracht wissen
            </button>
          </Glass>
        ) : (
          <ul className="space-y-3">
            {filtered.map((o, i) => (
              <li key={o.id}>
                <Glass focus={i === 0} className="p-4">
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums"
                        style={{
                          ...mono,
                          background: i === 0 ? C.indigoSoft : C.lineSoft,
                          color: i === 0 ? C.indigo : C.faint,
                        }}
                      >
                        {i + 1}
                      </span>
                      <GlowMeter value={o.match} size={56} color={C.indigo} label="match" />
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
                            className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                            style={{ background: C.lineSoft, color: C.sub }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <p
                        className="mt-1 text-[15px] font-semibold"
                        style={{ ...head, color: C.ink }}
                      >
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 text-[12.5px]"
                        style={{ color: C.sub }}
                      >
                        <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
                        <span
                          className="font-semibold tabular-nums"
                          style={{ ...mono, color: C.indigo }}
                        >
                          {o.tarief}
                        </span>
                        <span style={{ color: C.sub }}>{o.uren}</span>
                        <span style={{ color: C.sub }}>{o.start}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onOpen(o.id)}
                      className={`inline-flex items-center gap-1.5 self-center rounded-2xl px-3.5 py-2 text-[12.5px] font-semibold text-white transition-transform active:scale-[0.98] ${RING}`}
                      style={{ background: `linear-gradient(120deg, ${C.indigo}, ${C.roze})` }}
                    >
                      Bekijk <ArrowRight size={14} strokeWidth={2.6} aria-hidden="true" />
                    </button>
                  </div>
                </Glass>
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
              className={`rounded-2xl px-3.5 py-2 text-[12.5px] font-semibold transition-colors hover:bg-white/70 ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.sub }}
            >
              Terug
            </button>
            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-[13px] font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-90 ${RING}`}
              style={{
                background:
                  state === "sent" ? C.ok : `linear-gradient(120deg, ${C.indigo}, ${C.roze})`,
              }}
            >
              {state === "idle" && (
                <>
                  <Send size={15} strokeWidth={2.4} aria-hidden="true" /> Reageer
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Tarief", v: opdracht.tarief },
              { l: "Omvang", v: opdracht.uren },
              { l: "Start", v: opdracht.start },
              { l: "Match", v: `${opdracht.match}%` },
            ].map((m) => (
              <Glass key={m.l} className="p-4">
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {m.l}
                </p>
                <p
                  className="mt-1.5 text-[17px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {m.v}
                </p>
              </Glass>
            ))}
          </div>

          <Glass className="p-5">
            <h3 className="text-[16px] font-semibold" style={{ ...head, color: C.ink }}>
              Waarom deze match
            </h3>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
              Transparant onderbouwd op basis van je geverifieerde profiel.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.ok }}
                >
                  <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.plus.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ color: C.ink }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        style={{ background: C.okSoft }}
                      >
                        <Check
                          size={11}
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
                  className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
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
                        style={{ background: C.warnSoft }}
                      >
                        <AlertTriangle
                          size={10}
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
          </Glass>
        </div>

        <div className="space-y-4">
          <Glass focus className="p-5">
            <div className="flex items-center gap-4">
              <GlowMeter value={opdracht.match} size={72} color={C.indigo} label="match" />
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.indigo }}
                >
                  Match-score
                </p>
                <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
                  Sterke koppeling met je profiel — reageer voor het beste resultaat.
                </p>
              </div>
            </div>
          </Glass>
          <Glass className="p-5">
            <p
              className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.indigo }}
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
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: t.soft }}
                    >
                      <Icon size={15} style={{ color: t.fg }} aria-hidden="true" />
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px]"
                      style={{ color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <StatusPill status={c.status} subtle />
                  </li>
                );
              })}
            </ul>
          </Glass>
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
        sub="Je vertrouwensniveau in één oogopslag — geverifieerde bewijsstukken maken je zichtbaarder."
      />
      <div className="space-y-5 px-6 py-5">
        <Glass focus className="flex flex-wrap items-center gap-5 p-6">
          <GlowMeter value={pct} size={92} color={C.indigo} label="verified" />
          <div className="min-w-[180px] flex-1">
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.indigo }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
            </p>
            <p
              className="mt-2 text-[24px] font-semibold tabular-nums"
              style={{ ...mono, color: C.ink }}
            >
              {verified}/{total} geverifieerd
            </p>
            <p className="mt-1 text-[12.5px]" style={{ color: C.sub }}>
              Nog {total - verified} bewijsstuk{total - verified === 1 ? "" : "ken"} te gaan voor
              een volledige score.
            </p>
          </div>
        </Glass>

        {expiring && (
          <Glass className="flex flex-wrap items-center gap-4 p-4">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: C.warnSoft }}
              aria-hidden="true"
            >
              <AlertTriangle size={20} style={{ color: C.warn }} />
            </span>
            <div className="min-w-[180px] flex-1">
              <p className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
                {expiring.naam} verloopt binnenkort
              </p>
              <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
                {expiring.detail}. Vernieuw op tijd om je vertrouwensniveau te behouden.
              </p>
            </div>
            <button
              onClick={() => onGo("acties")}
              className={`inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-[12.5px] font-semibold text-white transition-transform active:scale-[0.98] ${RING}`}
              style={{ background: C.warn }}
            >
              Vernieuwen <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </Glass>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            const Icon = t.Icon;
            return (
              <Glass key={c.naam} className="flex items-center gap-3.5 p-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: t.soft }}
                >
                  <Icon size={20} style={{ color: t.fg }} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
                    {c.naam}
                  </p>
                  <p className="text-[11.5px]" style={{ color: C.sub }}>
                    {c.detail}
                  </p>
                </div>
                <StatusPill status={c.status} subtle />
              </Glass>
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
        kicker="Te doen"
        title="Volgende acties"
        sub="Kalm geordend op urgentie — rond af en houd je werkruimte helder."
      />
      <div className="space-y-3 px-6 py-5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const fg = warn ? C.roze : C.info;
          const soft = warn ? C.rozeSoft : C.infoSoft;
          return (
            <Glass key={a.titel} focus={warn} className="flex flex-wrap items-start gap-4 p-4">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[15px] font-semibold tabular-nums"
                style={{ ...mono, background: soft, color: fg }}
              >
                {i + 1}
              </span>
              <div className="min-w-[180px] flex-1">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: fg }}
                >
                  {warn ? "Waarschuwing" : "Kans"}
                </p>
                <p className="mt-0.5 text-[14px] font-semibold" style={{ ...head, color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-[12.5px] font-semibold text-white transition-transform active:scale-[0.98] ${RING}`}
                style={{
                  background: warn ? `linear-gradient(120deg, ${C.indigo}, ${C.roze})` : C.info,
                }}
              >
                {a.cta} <ChevronRight size={14} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </Glass>
          );
        })}

        <Glass className="flex items-center gap-3 p-4">
          <Sparkles size={16} strokeWidth={2.4} style={{ color: C.indigo }} aria-hidden="true" />
          <p className="text-[12.5px]" style={{ color: C.sub }}>
            Verder is alles rustig. Nieuwe kansen verschijnen hier vanzelf.
          </p>
        </Glass>
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
        sub="Rustig overzicht van wat binnen is en wat nog onderweg is."
        right={
          <button
            className={`inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-[12.5px] font-semibold text-white transition-transform active:scale-[0.98] ${RING}`}
            style={{ background: `linear-gradient(120deg, ${C.indigo}, ${C.roze})` }}
          >
            <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />
      <div className="space-y-5 px-6 py-5">
        <Glass focus className="flex flex-wrap items-center gap-5 p-5">
          <GlowMeter value={pct} size={80} color={C.indigo} label="betaald" />
          <div className="flex flex-1 flex-wrap gap-6">
            <div>
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.ok }}
              >
                Ontvangen
              </p>
              <p
                className="mt-1 text-[24px] font-semibold tabular-nums"
                style={{ ...mono, color: C.ink }}
              >
                € {betaald.toLocaleString("nl-NL")}
              </p>
            </div>
            <div>
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.warn }}
              >
                Openstaand
              </p>
              <p
                className="mt-1 text-[24px] font-semibold tabular-nums"
                style={{ ...mono, color: C.ink }}
              >
                € {open.toLocaleString("nl-NL")}
              </p>
            </div>
          </div>
        </Glass>

        <Glass className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: C.faint, borderBottom: `1px solid ${C.line}` }}
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
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
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
                      className="px-4 py-3.5 text-right text-[13px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ color: t.fg, background: t.soft }}
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
        </Glass>
      </div>
    </div>
  );
}
