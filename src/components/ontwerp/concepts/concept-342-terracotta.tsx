"use client";

// Concept 342 — "Terracotta" · mediterraans aardewerk, warm-menselijk vertrouwen.
// Ontwerprichting: warm, kalm en handgemaakt-maar-modern. Kleuren van gebakken klei — terracotta/
// roest, olijfgroen, zandbeige, gebroken wit — met een diepe klei-bruine inkt voor tekst. Ronde
// vormen (rounded-2xl/3xl), gulle typografie en zachte, zelfgetekende SVG-accenten (bogen, organische
// sparklines, ring-meters). Géén 3D of claymorphism: vlak-editorieel-warm, krisp en strak. Vertrouwen
// wordt hier gedragen door warmte in plaats van kilte — verificatie voelt menselijk en betrouwbaar,
// met heldere statuschips (altijd label + icoon, nooit alleen kleur) en verklaarbare matching.
// Fonts: --font-lab-jakarta (koppen/tekst), --font-lab-newsreader (serif-accenten), --font-lab-mono (cijfers).

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  FileText,
  MessageCircle,
  Search,
  Bell,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Sparkles,
  Sun,
  Leaf,
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
  Command,
  CornerDownLeft,
  X,
  Calendar,
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

/* ---------- Palet (mediterraans aardewerk, warm-menselijk) ---------- */

const C = {
  canvas: "#f4ece0", // zandbeige achtergrond
  surface: "#faf5ec", // gebroken wit oppervlak
  surfaceAlt: "#f1e7d8", // zandtint voor accenten/inputs
  ink: "#3a2a20", // diepe klei-bruine inkt
  inkSoft: "#5b463a", // zachtere inkt
  sub: "#7a6552", // ondersteunende tekst
  faint: "#a08b76", // subtiele tekst
  line: "#e4d6c2", // warme divider
  lineSoft: "#eee3d3", // lichtere divider
  clay: "#b34a2c", // terracotta/roest — tekstveilig op licht
  clayBright: "#c85a3a", // fellere terracotta-fill
  claySoft: "#f6e2d7", // zachte terracotta-wash
  olive: "#5f6b34", // olijfgroen — tekstveilig
  oliveBright: "#7c8a44",
  oliveSoft: "#e9ecd6",
  sand: "#c99a5a", // warm zandgoud accent
  sandSoft: "#f4e7d0",
  ok: "#4f7a3f", // geverifieerd-groen (aards)
  okSoft: "#e5eed9",
  warn: "#a86a1e", // verloopt-amber
  warnSoft: "#f6e8cf",
  alert: "#b23a2c", // afgewezen-roodklei
  alertSoft: "#f6ddd6",
  info: "#4a6f7a", // in-beoordeling (aards blauwgroen)
  infoSoft: "#dde9ea",
  deep: "#2c1f18", // diepe hero-inkt
  deepAlt: "#3c2a20",
};

const head = { fontFamily: "var(--font-lab-jakarta), system-ui, sans-serif" };
const body = { fontFamily: "var(--font-lab-jakarta), system-ui, sans-serif" };
const serif = { fontFamily: "var(--font-lab-newsreader), Georgia, serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b34a2c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf5ec]";

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
  documenten: FileText,
  berichten: MessageCircle,
};

/* ---------- Bouwstenen ---------- */

function StatusPill({ status }: { status: CredStatus }) {
  const t = credTone(status);
  const Icon = t.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...body, color: t.fg, background: t.soft }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {t.label}
    </span>
  );
}

// Organische sparkline — zachte kromme met area-fill, gebakken-klei warmte.
function OrganicSpark({
  data,
  color,
  height = 90,
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
  const id = `tc-${color.replace("#", "")}-${height}`;
  const pts: [number, number][] = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 16) - 9;
    return [x, y];
  });
  const at = (i: number): [number, number] =>
    pts[Math.max(0, Math.min(pts.length - 1, i))] ?? [0, 0];
  // Gladde kubieke curve door de punten (Catmull-Rom → Bézier) voor een handgemaakt gevoel.
  const first = at(0);
  let line = `M${first[0].toFixed(1)} ${first[1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    line += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const last = at(pts.length - 1);
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
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && (
        <>
          <circle cx={last[0]} cy={last[1]} r="8" fill={color} fillOpacity="0.16" />
          <circle cx={last[0]} cy={last[1]} r="4" fill={color} />
        </>
      )}
    </svg>
  );
}

function MiniSpark({ data, color }: { data: number[]; color: string }) {
  const w = 84;
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

// Boog-meter (270°) — de kerntaal: een warme, open kleiring i.p.v. een volle cirkel.
function ArcGauge({
  value,
  size = 72,
  color = C.clay,
  track = C.line,
  label,
  onDark = false,
}: {
  value: number;
  size?: number;
  color?: string;
  track?: string;
  label?: string;
  onDark?: boolean;
}) {
  const stroke = size >= 96 ? 9 : 7;
  const r = size / 2 - stroke;
  const circ = 2 * Math.PI * r;
  const sweep = 0.75; // 270° open boog onderaan
  const dash = circ * sweep;
  const offset = dash * (1 - value / 100);
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        className="absolute inset-0"
        style={{ transform: "rotate(135deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="flex flex-col items-center leading-none">
        <span
          className="font-bold tabular-nums"
          style={{ ...mono, color: onDark ? "#faf5ec" : C.ink, fontSize: size >= 96 ? 23 : 15 }}
        >
          {value}
        </span>
        {label && (
          <span
            className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.12em]"
            style={{ color: onDark ? "rgba(250,245,236,0.55)" : C.faint }}
          >
            {label}
          </span>
        )}
      </span>
    </span>
  );
}

// Decoratieve zachte boog — vlak, geen 3D — als warm accent boven cards.
function SoftArc({ color, className = "" }: { color: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 200 40"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M0 38 C 40 6, 160 6, 200 38"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
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
    <div className="flex flex-wrap items-end justify-between gap-4 px-5 pb-1 pt-7 sm:px-7">
      <div className="min-w-0">
        <p
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.22em]"
          style={{ ...mono, color: C.clay }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: C.clay }}
            aria-hidden="true"
          />
          {kicker}
        </p>
        <h1
          className="mt-2 text-[30px] font-semibold leading-none tracking-tight"
          style={{ ...serif, color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.sub }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

/* ---------- Command-menu (drawer) ---------- */

function CommandMenu({
  open,
  onClose,
  onGo,
}: {
  open: boolean;
  onClose: () => void;
  onGo: (k: ScreenKey) => void;
}) {
  const [q, setQ] = useState("");
  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  if (!open) return null;
  const items = SCREENS.filter((s) => s.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Snelmenu"
    >
      <button
        className="absolute inset-0 cursor-default"
        style={{ background: "rgba(44,31,24,0.42)" }}
        aria-label="Snelmenu sluiten"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl shadow-2xl"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          <Search size={17} style={{ color: C.faint }} aria-hidden="true" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ga naar scherm of zoek een actie…"
            aria-label="Snelmenu zoeken"
            className="w-full bg-transparent text-[14px] outline-none"
            style={{ color: C.ink }}
          />
          <kbd
            className="hidden rounded-md px-1.5 py-0.5 text-[10px] font-semibold sm:inline"
            style={{
              ...mono,
              background: C.surfaceAlt,
              color: C.sub,
              border: `1px solid ${C.line}`,
            }}
          >
            esc
          </kbd>
        </div>
        <div className="max-h-[46vh] overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px]" style={{ color: C.sub }}>
              Niets gevonden voor “{q}”.
            </p>
          ) : (
            <ul>
              {items.map((s) => {
                const Icon = NAV_ICONS[s.key];
                return (
                  <li key={s.key}>
                    <button
                      onClick={() => {
                        onGo(s.key);
                        onClose();
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[#f1e7d8] ${RING}`}
                    >
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ background: C.claySoft }}
                      >
                        <Icon size={15} style={{ color: C.clay }} aria-hidden="true" />
                      </span>
                      <span className="flex-1 text-[13.5px] font-medium" style={{ color: C.ink }}>
                        {s.label}
                      </span>
                      <CornerDownLeft size={14} style={{ color: C.faint }} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept342() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const [cmdOpen, setCmdOpen] = useState(false);
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
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
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: C.canvas, color: C.ink }}
    >
      <style>{`@keyframes tc-fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes tc-pulse{0%,100%{opacity:.55}50%{opacity:.9}}`}</style>

      <CommandMenu open={cmdOpen} onClose={() => setCmdOpen(false)} onGo={setScreen} />

      {/* Top-bar — warm, serif-wordmerk */}
      <header style={{ borderBottom: `1px solid ${C.line}`, background: C.surface }}>
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-2xl text-[15px] font-bold"
            style={{ ...head, color: C.surface, background: C.clay }}
            aria-hidden="true"
          >
            Z
          </div>
          <div className="leading-none">
            <span className="text-[17px] font-semibold tracking-tight" style={serif}>
              Terracotta
            </span>
            <span
              className="ml-2 hidden rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline"
              style={{ ...mono, background: C.claySoft, color: C.clay }}
            >
              ZZP
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setCmdOpen(true)}
              className={`hidden items-center gap-2 rounded-full px-3 py-2 text-[12px] font-medium transition-colors hover:bg-[#f1e7d8] sm:inline-flex ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.sub }}
            >
              <Search size={14} aria-hidden="true" /> Zoeken
              <kbd
                className="ml-1 flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ ...mono, background: C.surfaceAlt, color: C.faint }}
              >
                <Command size={9} aria-hidden="true" />K
              </kbd>
            </button>
            <button
              onClick={() => setCmdOpen(true)}
              aria-label="Zoeken"
              className={`rounded-full p-2.5 transition-colors hover:bg-[#f1e7d8] sm:hidden ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.sub }}
            >
              <Search size={15} aria-hidden="true" />
            </button>
            <button
              aria-label="Meldingen"
              className={`relative rounded-full p-2.5 transition-colors hover:bg-[#f1e7d8] ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.sub }}
            >
              <Bell size={15} aria-hidden="true" />
              <span
                className="absolute right-2 top-2 h-2 w-2 rounded-full"
                style={{ background: C.clayBright, border: `1.5px solid ${C.surface}` }}
                aria-hidden="true"
              />
            </button>
            <div className="ml-1 flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold"
                style={{ ...mono, background: C.olive, color: C.surface }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-[12.5px] font-semibold">{PROFIEL.naam}</p>
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

        {/* Scherm-tabs — ronde pillen, warme rand */}
        <nav className="flex gap-1.5 overflow-x-auto px-3 pb-3 sm:px-5" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const Icon = NAV_ICONS[s.key];
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] transition-colors ${RING}`}
                style={{
                  color: on ? C.surface : C.sub,
                  background: on ? C.clay : "transparent",
                  border: `1px solid ${on ? C.clay : C.line}`,
                  fontWeight: on ? 600 : 500,
                }}
              >
                <Icon size={15} aria-hidden="true" style={{ color: on ? C.surface : C.faint }} />
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Content */}
      <div
        key={screen}
        className="mx-auto max-w-6xl pb-10"
        style={{ animation: "tc-fade 0.34s ease" }}
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
            {screen === "berichten" && <Dashboard onOpen={open} onGo={setScreen} />}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Skeleton ---------- */

function ScreenSkeleton() {
  return (
    <div className="px-5 py-7 sm:px-7" role="status" aria-live="polite">
      <span className="sr-only">Scherm wordt geladen…</span>
      <div
        className="h-8 w-56 rounded-2xl"
        style={{ background: C.surface, animation: "tc-pulse 1.3s infinite" }}
      />
      <div
        className="mt-6 h-48 rounded-3xl"
        style={{
          background: C.surface,
          border: `1px solid ${C.line}`,
          animation: "tc-pulse 1.3s infinite",
        }}
      />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl"
            style={{
              background: C.surface,
              border: `1px solid ${C.line}`,
              animation: "tc-pulse 1.3s infinite",
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
  const eersteBericht = BERICHTEN[0];

  const retry = () => {
    setFeed("loading");
    window.setTimeout(() => setFeed("ok"), 720);
  };

  return (
    <div>
      <PageHead
        kicker="Je atelier"
        title={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}`}
        sub="Een warm overzicht van je praktijk — wat er goed loopt, en wat vandaag je aandacht vraagt."
      />

      <div className="space-y-5 px-5 py-5 sm:px-7">
        {/* Hero — diepe klei-inkt met boog-meter en organische curve */}
        <div className="relative overflow-hidden rounded-[28px]" style={{ background: C.deep }}>
          {/* zachte decoratieve boog rechtsboven */}
          <svg
            className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 opacity-[0.14]"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle cx="50" cy="50" r="46" fill="none" stroke={C.clayBright} strokeWidth="2" />
            <circle cx="50" cy="50" r="32" fill="none" stroke={C.sand} strokeWidth="2" />
            <circle cx="50" cy="50" r="18" fill="none" stroke={C.oliveBright} strokeWidth="2" />
          </svg>

          <div className="flex flex-wrap items-start justify-between gap-5 p-6">
            <div className="min-w-0">
              <p
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ ...mono, color: C.sand }}
              >
                <Sun size={13} aria-hidden="true" /> {hero.label}
              </p>
              <p
                className="mt-2.5 text-[46px] font-semibold leading-none tracking-tight"
                style={{ ...serif, color: "#faf5ec" }}
              >
                {hero.value}
              </p>
              <p
                className="mt-3 flex items-center gap-2 text-[12.5px]"
                style={{ color: "rgba(250,245,236,0.72)" }}
              >
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
                  style={{
                    ...mono,
                    background: hero.up ? "rgba(124,138,68,0.28)" : "rgba(200,90,58,0.28)",
                    color: hero.up ? "#c4d38a" : "#f0a988",
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
            <div className="flex flex-col items-center gap-1.5">
              <ArcGauge
                value={matchAvg}
                size={98}
                color={C.sand}
                track="rgba(250,245,236,0.14)"
                label="match"
                onDark
              />
              <span className="text-[10.5px]" style={{ color: "rgba(250,245,236,0.5)" }}>
                gemiddelde
              </span>
            </div>
          </div>

          <div className="px-3 pb-3">
            <OrganicSpark data={hero.spark} color={C.sand} height={88} />
          </div>

          {/* KPI-kiezer */}
          <div
            className="flex gap-1.5 overflow-x-auto p-2.5"
            style={{ borderTop: "1px solid rgba(250,245,236,0.08)" }}
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
                  className={`flex flex-1 shrink-0 flex-col items-start gap-1 rounded-2xl px-3.5 py-2.5 text-left transition-colors ${RING}`}
                  style={{ background: on ? "rgba(201,154,90,0.16)" : "transparent" }}
                >
                  <span
                    className="text-[10.5px] font-semibold"
                    style={{ color: on ? C.sand : "rgba(250,245,236,0.5)" }}
                  >
                    {k.label}
                  </span>
                  <span
                    className="text-[15px] font-bold tabular-nums"
                    style={{ ...mono, color: on ? "#faf5ec" : "rgba(250,245,236,0.72)" }}
                  >
                    {k.value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Kerncijfer-tegels */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k) => (
            <div
              key={k.label}
              className="rounded-2xl p-4"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium" style={{ color: C.sub }}>
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[10.5px] font-bold tabular-nums"
                  style={{ ...mono, color: k.up ? C.olive : C.clay }}
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
                <MiniSpark data={k.spark} color={k.up ? C.olive : C.clay} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Volgende actie */}
          {warn && (
            <div
              className="relative overflow-hidden rounded-3xl p-5 lg:col-span-2"
              style={{ background: C.claySoft, border: `1px solid ${C.clay}2e` }}
              role="alert"
            >
              <SoftArc color={`${C.clay}44`} className="absolute inset-x-0 top-0 h-6 w-full" />
              <p
                className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.clay }}
              >
                <Sparkles size={13} aria-hidden="true" /> Vandaag belangrijk
              </p>
              <h2
                className="mt-2 text-[21px] font-semibold leading-snug"
                style={{ ...serif, color: C.ink }}
              >
                {warn.titel}
              </h2>
              <p className="mt-1.5 max-w-md text-[13px] leading-relaxed" style={{ color: C.sub }}>
                {warn.detail}
              </p>
              <button
                onClick={() => onGo("verificatie")}
                className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
                style={{ background: C.clay, color: C.surface }}
              >
                {warn.cta} <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Berichten met error → loading → ok */}
          <div
            className="rounded-3xl p-5"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <div className="flex items-center justify-between">
              <h3
                className="flex items-center gap-1.5 text-[13px] font-semibold"
                style={{ ...head, color: C.ink }}
              >
                <MessageCircle size={15} style={{ color: C.olive }} aria-hidden="true" /> Postvak
              </h3>
              <span
                className="rounded-full px-2 py-0.5 text-[10.5px] font-bold tabular-nums"
                style={{ ...mono, background: C.oliveSoft, color: C.olive }}
              >
                2 nieuw
              </span>
            </div>
            <div className="mt-4 border-t pt-3" style={{ borderColor: C.lineSoft }}>
              <p
                className="mb-2 text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: C.faint }}
              >
                Nieuwste bericht
              </p>
              {feed === "error" && (
                <div className="text-center" role="alert">
                  <CircleAlert
                    size={22}
                    className="mx-auto"
                    style={{ color: C.alert }}
                    aria-hidden="true"
                  />
                  <p className="mt-1.5 text-[12px]" style={{ color: C.sub }}>
                    Berichten konden niet laden.
                  </p>
                  <button
                    onClick={retry}
                    className={`mt-2.5 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[#f1e7d8] ${RING}`}
                    style={{ border: `1px solid ${C.line}`, color: C.ink }}
                  >
                    <RotateCcw size={12} aria-hidden="true" /> Opnieuw
                  </button>
                </div>
              )}
              {feed === "loading" && (
                <div className="space-y-2.5" role="status" aria-live="polite">
                  <span className="sr-only">Laden…</span>
                  <span
                    className="block h-3 rounded-full"
                    style={{
                      background: C.lineSoft,
                      width: "58%",
                      animation: "tc-pulse 1.3s infinite",
                    }}
                  />
                  <span
                    className="block h-3 rounded-full"
                    style={{
                      background: C.lineSoft,
                      width: "88%",
                      animation: "tc-pulse 1.3s infinite",
                    }}
                  />
                </div>
              )}
              {feed === "ok" && eersteBericht && (
                <div className="flex items-start gap-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ ...mono, background: C.claySoft, color: C.clay }}
                    aria-hidden="true"
                  >
                    {eersteBericht.initialen}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold" style={{ color: C.ink }}>
                      {eersteBericht.van}
                    </p>
                    <p className="mt-0.5 text-[11.5px] leading-snug" style={{ color: C.sub }}>
                      {eersteBericht.preview}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Beste matches */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2
              className="flex items-center gap-2 text-[17px] font-semibold"
              style={{ ...serif, color: C.ink }}
            >
              <TrendingUp size={17} style={{ color: C.clay }} aria-hidden="true" /> Beste matches
            </h2>
            <button
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-semibold ${RING}`}
              style={{ color: C.clay }}
            >
              Naar marktplaats <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className={`group rounded-3xl p-4 text-left transition-colors hover:border-[#b34a2c66] ${RING}`}
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <div className="flex items-start justify-between">
                  <ArcGauge value={o.match} size={56} color={C.clay} label="match" />
                  <span
                    className="text-[10px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.faint }}
                  >
                    {o.id}
                  </span>
                </div>
                <p
                  className="mt-3 text-[15px] font-semibold leading-snug"
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
                <div
                  className="mt-3 flex items-center justify-between border-t pt-3"
                  style={{ borderColor: C.lineSoft }}
                >
                  <span
                    className="text-[13px] font-bold tabular-nums"
                    style={{ ...mono, color: C.clay }}
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
        kicker="Marktplaats"
        title="Opdrachten die bij je passen"
        sub="Gerangschikt op hoe goed ze aansluiten bij je geverifieerde profiel — de sterkste kansen bovenaan."
        right={
          <div
            className="inline-flex items-center gap-0.5 rounded-full p-1"
            style={{ background: C.surfaceAlt, border: `1px solid ${C.line}` }}
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
                  className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${RING}`}
                  style={{
                    background: on ? C.surface : "transparent",
                    color: on ? C.ink : C.sub,
                    boxShadow: on ? "0 1px 2px rgba(44,31,24,0.08)" : "none",
                  }}
                >
                  {s === "match" ? "Match" : "Tarief"}
                </button>
              );
            })}
          </div>
        }
      />
      <div className="px-5 py-5 sm:px-7">
        <div
          className="mb-4 flex items-center gap-2.5 rounded-full px-4 py-3"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Zoekopdracht wissen"
              className={`rounded-full p-1 transition-colors hover:bg-[#f1e7d8] ${RING}`}
              style={{ color: C.faint }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-3xl px-6 py-16 text-center"
            style={{ border: `1px dashed ${C.line}`, background: C.surfaceAlt }}
          >
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
              aria-hidden="true"
            >
              <Leaf size={22} style={{ color: C.faint }} />
            </span>
            <p className="mt-4 text-[16px] font-semibold" style={{ ...serif, color: C.ink }}>
              Niets gevonden
            </p>
            <p className="mt-1 max-w-xs text-[12.5px]" style={{ color: C.sub }}>
              Geen opdracht komt overeen met “{q}”. Verbreed je zoekopdracht of wis het filter.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-4 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[#f1e7d8] ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.ink }}
            >
              Zoekopdracht wissen
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((o, i) => (
              <li
                key={o.id}
                className="rounded-3xl p-4"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold tabular-nums"
                      style={{
                        ...mono,
                        background: i === 0 ? C.claySoft : C.surfaceAlt,
                        color: i === 0 ? C.clay : C.faint,
                      }}
                    >
                      {i + 1}
                    </span>
                    <ArcGauge value={o.match} size={58} color={C.clay} label="match" />
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
                          style={{ background: C.oliveSoft, color: C.olive }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1 text-[16px] font-semibold" style={{ ...head, color: C.ink }}>
                      {o.titel}
                    </p>
                    <p
                      className="mt-0.5 flex items-center gap-1 text-[12.5px]"
                      style={{ color: C.sub }}
                    >
                      <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
                      <span className="font-bold tabular-nums" style={{ ...mono, color: C.clay }}>
                        {o.tarief}
                      </span>
                      <span className="flex items-center gap-1" style={{ color: C.sub }}>
                        <Clock size={12} aria-hidden="true" /> {o.uren}
                      </span>
                      <span className="flex items-center gap-1" style={{ color: C.sub }}>
                        <Calendar size={12} aria-hidden="true" /> {o.start}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpen(o.id)}
                    className={`inline-flex items-center gap-1.5 self-center rounded-full px-4 py-2 text-[12.5px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
                    style={{ background: C.clay, color: C.surface }}
                  >
                    Bekijk <ArrowRight size={14} strokeWidth={2.6} aria-hidden="true" />
                  </button>
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
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[#f1e7d8] ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.sub }}
            >
              <ArrowLeft size={14} aria-hidden="true" /> Terug
            </button>
            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-transform active:scale-[0.98] disabled:opacity-90 ${RING}`}
              style={{
                background: state === "sent" ? C.ok : C.clay,
                color: C.surface,
              }}
            >
              {state === "idle" && (
                <>
                  <Send size={15} strokeWidth={2.4} aria-hidden="true" /> Reageer op opdracht
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

      <div className="grid grid-cols-1 gap-5 px-5 py-5 sm:px-7 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Kerncijfers */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Tarief", v: opdracht.tarief },
              { l: "Omvang", v: opdracht.uren },
              { l: "Start", v: opdracht.start },
              { l: "Match", v: `${opdracht.match}%` },
            ].map((m) => (
              <div
                key={m.l}
                className="rounded-2xl p-4"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <p
                  className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
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
              </div>
            ))}
          </div>

          {/* Verklaarbare match */}
          <div
            className="rounded-3xl p-5"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <h3 className="text-[18px] font-semibold" style={{ ...serif, color: C.ink }}>
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
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl p-5" style={{ background: C.deep }}>
            <div className="flex items-center gap-4">
              <ArcGauge
                value={opdracht.match}
                size={74}
                color={C.sand}
                track="rgba(250,245,236,0.14)"
                label="match"
                onDark
              />
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.sand }}
                >
                  Match-score
                </p>
                <p
                  className="mt-1 text-[13px] leading-relaxed"
                  style={{ color: "rgba(250,245,236,0.72)" }}
                >
                  Sterke koppeling met je profiel — reageer op tijd voor de beste kans.
                </p>
              </div>
            </div>
          </div>
          <div
            className="rounded-3xl p-5"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <p
              className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.olive }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> Compliance-eisen
            </p>
            <p className="mt-2 text-[12.5px]" style={{ color: C.sub }}>
              Vereiste certificaten voor deze opdracht. Je voldoet aan de kern-eisen.
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
        title="Verificatie & certificaten"
        sub="Elk geverifieerd bewijsstuk versterkt het vertrouwen dat opdrachtgevers in je stellen."
      />
      <div className="space-y-5 px-5 py-5 sm:px-7">
        {/* Vertrouwens-meter */}
        <div
          className="relative flex flex-wrap items-center gap-6 overflow-hidden rounded-[28px] p-6"
          style={{ background: C.deep }}
        >
          <svg
            className="pointer-events-none absolute -bottom-14 -right-8 h-48 w-48 opacity-[0.12]"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle cx="50" cy="50" r="44" fill="none" stroke={C.sand} strokeWidth="2" />
            <circle cx="50" cy="50" r="28" fill="none" stroke={C.oliveBright} strokeWidth="2" />
          </svg>
          <ArcGauge
            value={pct}
            size={100}
            color={C.sand}
            track="rgba(250,245,236,0.14)"
            label="verified"
            onDark
          />
          <div className="min-w-[180px] flex-1">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.sand }}
            >
              <BadgeCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
            </p>
            <p
              className="mt-2 text-[26px] font-semibold tabular-nums"
              style={{ ...serif, color: "#faf5ec" }}
            >
              {verified} van {total} geverifieerd
            </p>
            <p
              className="mt-1 text-[12.5px] leading-relaxed"
              style={{ color: "rgba(250,245,236,0.72)" }}
            >
              Nog {total - verified} bewijsstuk{total - verified === 1 ? "" : "ken"} te gaan voor
              een volledig profiel.
            </p>
          </div>
        </div>

        {/* Verloop-waarschuwing + herstelactie */}
        {expiring && (
          <div
            className="flex flex-wrap items-center gap-4 rounded-3xl p-4"
            style={{ background: C.warnSoft, border: `1px solid ${C.warn}33` }}
            role="alert"
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: C.surface }}
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
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
              style={{ background: C.warn, color: C.surface }}
            >
              Vernieuwen <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Certificaat-lijst */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            const Icon = t.Icon;
            return (
              <div
                key={c.naam}
                className="flex items-center gap-3.5 rounded-3xl p-4"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: t.soft }}
                >
                  <Icon size={21} style={{ color: t.fg }} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
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
        kicker="Werklijst"
        title="Volgende acties"
        sub="Op volgorde van urgentie — pak ze één voor één op en houd je praktijk in balans."
      />
      <div className="space-y-3 px-5 py-5 sm:px-7">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const fg = warn ? C.clay : C.olive;
          const soft = warn ? C.claySoft : C.oliveSoft;
          return (
            <div
              key={a.titel}
              className="flex flex-wrap items-start gap-4 rounded-3xl p-4"
              style={{
                background: C.surface,
                border: `1px solid ${warn ? `${C.clay}33` : C.line}`,
              }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[15px] font-bold tabular-nums"
                style={{ ...mono, background: soft, color: fg }}
              >
                {i + 1}
              </span>
              <div className="min-w-[180px] flex-1">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: fg }}
                >
                  {warn ? "Aandacht nodig" : "Kans"}
                </p>
                <p className="mt-0.5 text-[14.5px] font-semibold" style={{ ...head, color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed" style={{ color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`inline-flex items-center gap-1.5 self-center rounded-full px-4 py-2 text-[12.5px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
                style={{ background: warn ? C.clay : C.olive, color: C.surface }}
              >
                {a.cta} <ChevronRight size={14} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          );
        })}

        <div
          className="flex items-center gap-3 rounded-3xl p-4"
          style={{ background: C.oliveSoft, border: `1px solid ${C.olive}33` }}
        >
          <Leaf size={17} strokeWidth={2.2} style={{ color: C.olive }} aria-hidden="true" />
          <p className="text-[12.5px]" style={{ color: C.sub }}>
            Verder is alles in balans. Nieuwe kansen verschijnen hier vanzelf.
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
        kicker="Administratie"
        title="Facturen"
        sub="Wat er binnen is en wat nog onderweg is — rustig en overzichtelijk bij elkaar."
        right={
          <button
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
            style={{ background: C.clay, color: C.surface }}
          >
            <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />
      <div className="space-y-5 px-5 py-5 sm:px-7">
        <div
          className="relative flex flex-wrap items-center gap-6 overflow-hidden rounded-[28px] p-6"
          style={{ background: C.deep }}
        >
          <ArcGauge
            value={pct}
            size={84}
            color={C.sand}
            track="rgba(250,245,236,0.14)"
            label="betaald"
            onDark
          />
          <div className="flex flex-1 flex-wrap gap-8">
            <div>
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.sand }}
              >
                Ontvangen
              </p>
              <p
                className="mt-1.5 text-[26px] font-semibold tabular-nums"
                style={{ ...serif, color: "#faf5ec" }}
              >
                € {betaald.toLocaleString("nl-NL")}
              </p>
            </div>
            <div>
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
                style={{ ...mono, color: "#f0a988" }}
              >
                Openstaand
              </p>
              <p
                className="mt-1.5 text-[26px] font-semibold tabular-nums"
                style={{ ...serif, color: "#faf5ec" }}
              >
                € {open.toLocaleString("nl-NL")}
              </p>
            </div>
          </div>
        </div>

        <div
          className="overflow-x-auto rounded-3xl"
          style={{ border: `1px solid ${C.line}`, background: C.surface }}
        >
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
                style={{ background: C.surfaceAlt, color: C.faint }}
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
                      className="px-4 py-3.5 text-right text-[13px] font-bold tabular-nums"
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
        </div>
      </div>
    </div>
  );
}
