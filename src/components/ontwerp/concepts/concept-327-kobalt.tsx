"use client";

// Concept 327 — "Kobalt" · single-hue tonal immersion.
// Het hele systeem is opgebouwd uit één kleurfamilie: kobaltblauw in ~12 tonale trappen, van
// bijna-wit blauwzweem tot diep marine. Diepte ontstaat door tonale lagen (donker → licht naar
// voren) in plaats van slagschaduwen — rustig, premium, geconcentreerd. Eén warm koper-accent
// draagt álle acties en aandacht, zodat verificatie en matching visueel gefocust blijven en er
// nooit twijfel is waar te klikken. Gevoelige documenten voelen bewaakt en serieus in dit diepe blauw.
// Fonts: --font-lab-manrope (koppen/labels) + --font-lab-mono (alle cijfers, tarieven, percentages).

import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Compass,
  FileText,
  ShieldCheck,
  ListChecks,
  Receipt,
  Search,
  Bell,
  BadgeCheck,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronRight,
  Plus,
  MapPin,
  Bookmark,
  RefreshCw,
  Layers,
  Sparkle,
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

/* ---------- Tonale kobalt-schaal (één hue, vele trappen) ---------- */

const K = {
  abyss: "#0a1330", // diepste marine — canvas
  deep: "#0d1839", // basislaag
  l1: "#122150", // laag 1 (kaart achter)
  l2: "#182a63", // laag 2 (kaart)
  l3: "#20366f", // laag 3 (naar voren)
  l4: "#2a4382", // hover/actief
  edge: "rgba(150,178,240,0.14)", // tonale rand
  edgeSoft: "rgba(150,178,240,0.08)",
  ink: "#eef3ff", // bijna-wit blauwzweem
  sub: "#b3c4e8", // gedempt
  faint: "#8095c2", // subtiel
  ice: "#cfe0ff", // helder ijsblauw (positief in-hue)
  iceSoft: "rgba(120,160,240,0.16)",
  copper: "#e6a366", // hét contrast-accent (warm koper)
  copperBright: "#f2b985",
  copperDeep: "#c9793c",
  copperSoft: "rgba(230,163,102,0.14)",
  rust: "#e2825f", // koper-verwant voor afwijzing
  rustSoft: "rgba(226,130,95,0.15)",
};

const head = { fontFamily: "var(--font-lab-manrope)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6a366] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1330]";

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Compass,
  opdracht: FileText,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

/* ---------- Status → betekenis (label + icoon + tonale kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; fg: string; bg: string; Icon: LucideIcon };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: K.ice, bg: K.iceSoft, Icon: BadgeCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: K.sub, bg: K.edgeSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", fg: K.copper, bg: K.copperSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: K.rust, bg: K.rustSoft, Icon: XCircle };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Bouwstenen ---------- */

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ ...head, color: m.fg, background: m.bg }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function Spark({ data, color = K.copper }: { data: number[]; color?: string }) {
  const w = 76;
  const h = 26;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const id = color.replace(/[^a-z0-9]/gi, "");
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={`kb-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.34" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#kb-${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.1" fill={color} />}
    </svg>
  );
}

// Match-meter opgebouwd uit tonale ringen; koper vult de voortgang.
function MatchRing({ value, size = 52 }: { value: number; size?: number }) {
  const r = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(150,178,240,0.16)"
          strokeWidth="3.5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={K.copper}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span
        className="text-[13px] font-bold tabular-nums"
        style={{ ...mono, color: K.copperBright }}
      >
        {value}
      </span>
      <span className="sr-only">procent match</span>
    </span>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-bold uppercase tracking-[0.2em]"
      style={{ ...mono, color: K.copper }}
    >
      {children}
    </p>
  );
}

function ScreenHead({
  kicker,
  titel,
  sub,
  right,
}: {
  kicker: string;
  titel: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 pb-5">
      <div className="min-w-0">
        <Kicker>{kicker}</Kicker>
        <h1
          className="mt-1.5 text-[26px] font-extrabold leading-tight tracking-tight"
          style={{ ...head, color: K.ink }}
        >
          {titel}
        </h1>
        {sub && (
          <p className="mt-1 text-[13px]" style={{ color: K.sub }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

// Tonale kaart: kies een laag; diepte komt van de toon, niet van schaduw.
function Panel({
  level = 2,
  className = "",
  children,
  as = "div",
}: {
  level?: 1 | 2 | 3;
  className?: string;
  children: React.ReactNode;
  as?: "div" | "li";
}) {
  const bg = level === 1 ? K.l1 : level === 2 ? K.l2 : K.l3;
  const Tag = as;
  return (
    <Tag
      className={`rounded-2xl ${className}`}
      style={{ background: bg, border: `1px solid ${K.edge}` }}
    >
      {children}
    </Tag>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept327() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  // Tonale "diepte-transitie": bij scherm-wissel kort een skeleton tonen.
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 460);
    return () => window.clearTimeout(t);
  }, [screen]);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{
        ...head,
        color: K.ink,
        background: `radial-gradient(130% 100% at 15% -10%, ${K.deep}, ${K.abyss} 62%)`,
      }}
    >
      <style>{`
        @keyframes kb-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes kb-pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>

      <div className="mx-auto flex min-h-[680px] max-w-[1240px]">
        {/* Sidebar — tonale rail */}
        <aside
          className="hidden w-[228px] shrink-0 flex-col md:flex"
          style={{ background: K.deep, borderRight: `1px solid ${K.edge}` }}
        >
          <div className="flex items-center gap-2.5 px-5 py-5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[15px] font-black"
              style={{ background: K.copper, color: K.abyss }}
              aria-hidden="true"
            >
              Z
            </span>
            <div className="leading-tight">
              <p className="text-[14px] font-extrabold tracking-tight" style={{ color: K.ink }}>
                Kobalt
              </p>
              <p className="text-[10.5px]" style={{ color: K.faint }}>
                ZZP-werkruimte
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-0.5 px-3 pt-2" aria-label="Hoofdnavigatie">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-colors ${RING}`}
                  style={{
                    color: on ? K.ink : K.sub,
                    background: on ? K.l3 : "transparent",
                  }}
                >
                  {on && (
                    <span
                      className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
                      style={{ background: K.copper }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon
                    size={17}
                    strokeWidth={on ? 2.5 : 2}
                    aria-hidden="true"
                    style={{ color: on ? K.copperBright : K.faint }}
                  />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto p-3">
            <Panel level={1} className="p-3.5">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-[12px] font-bold"
                  style={{ ...mono, background: K.l4, color: K.ice }}
                  aria-hidden="true"
                >
                  {PROFIEL.initialen}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold" style={{ color: K.ink }}>
                    {PROFIEL.naam}
                  </p>
                  <p
                    className="flex items-center gap-1 text-[11px] font-semibold"
                    style={{ color: K.ice }}
                  >
                    <ShieldCheck size={11} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header
            className="flex items-center gap-3 px-5 py-4 md:px-8"
            style={{ borderBottom: `1px solid ${K.edge}` }}
          >
            <div className="md:hidden">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-black"
                style={{ background: K.copper, color: K.abyss }}
                aria-hidden="true"
              >
                Z
              </span>
            </div>
            <div
              className="hidden items-center gap-2 rounded-xl px-3 py-2 md:flex"
              style={{ background: K.l1, border: `1px solid ${K.edge}` }}
            >
              <Search size={15} strokeWidth={2.2} aria-hidden="true" style={{ color: K.faint }} />
              <input
                placeholder="Zoek opdracht, document of factuur…"
                aria-label="Zoeken"
                className="w-[280px] bg-transparent text-[13px] outline-none placeholder:text-[#8095c2]"
                style={{ color: K.ink }}
              />
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold sm:inline-flex"
                style={{ background: K.copperSoft, color: K.copperBright }}
              >
                <Layers size={13} strokeWidth={2.4} aria-hidden="true" /> Tonaal systeem
              </span>
              <button
                aria-label="Meldingen"
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${RING}`}
                style={{ background: K.l1, border: `1px solid ${K.edge}` }}
              >
                <Bell size={17} strokeWidth={2.1} aria-hidden="true" style={{ color: K.sub }} />
                <span
                  className="absolute right-2 top-2 h-2 w-2 rounded-full"
                  style={{ background: K.copper }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele scherm-switcher */}
          <div
            className="flex gap-1.5 overflow-x-auto px-5 py-2.5 md:hidden"
            style={{ borderBottom: `1px solid ${K.edge}` }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
                  style={{
                    color: on ? K.abyss : K.sub,
                    background: on ? K.copper : K.l1,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div key={screen} className="flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-8">
            {loading ? (
              <ScreenSkeleton />
            ) : (
              <div style={{ animation: "kb-rise 0.4s ease" }}>
                {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
                {screen === "marktplaats" && (
                  <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
                )}
                {screen === "opdracht" && (
                  <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
                )}
                {screen === "verificatie" && <Verificatie />}
                {screen === "acties" && <Acties onGo={setScreen} />}
                {screen === "facturen" && <Facturen />}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Skeleton (laadstaat) ---------- */

function ScreenSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">Scherm wordt geladen…</span>
      <div
        className="h-8 w-52 rounded-lg"
        style={{ background: K.l2, animation: "kb-pulse 1.2s ease-in-out infinite" }}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl"
            style={{ background: K.l1, animation: "kb-pulse 1.2s ease-in-out infinite" }}
          />
        ))}
      </div>
      <div
        className="h-52 rounded-2xl"
        style={{ background: K.l1, animation: "kb-pulse 1.2s ease-in-out infinite" }}
      />
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
  // Berichtenfeed met loading → error → retry (deterministisch getoond als "error"-staat).
  const [feed, setFeed] = useState<"loading" | "error">("loading");
  useEffect(() => {
    setFeed("loading");
    const t = window.setTimeout(() => setFeed("error"), 900);
    return () => window.clearTimeout(t);
  }, []);
  const retry = () => {
    setFeed("loading");
    window.setTimeout(() => setFeed("error"), 900);
  };

  const warn = ACTIES[0];

  return (
    <div>
      <ScreenHead
        kicker="Overzicht"
        titel="Goedemiddag, Sanne"
        sub={`${PROFIEL.rol} · ${PROFIEL.plaats}`}
      />

      {/* KPI-tegels — tonale laag 2, koperen sparkline */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} level={2} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11.5px] font-semibold" style={{ color: K.sub }}>
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                style={{ ...mono, color: k.up ? K.ice : K.copper }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} strokeWidth={2.8} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} strokeWidth={2.8} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <p
              className="mt-2 text-[24px] font-extrabold tabular-nums leading-none"
              style={{ ...mono, color: K.ink }}
            >
              {k.value}
            </p>
            <div className="mt-2.5">
              <Spark data={k.spark} color={k.up ? K.copper : K.ice} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Beste matches */}
        <div>
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-[15px] font-extrabold" style={{ color: K.ink }}>
              Beste matches
            </h2>
            <button
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12.5px] font-bold ${RING}`}
              style={{ color: K.copperBright }}
            >
              Naar marktplaats <ChevronRight size={14} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Panel as="li" key={o.id} level={2}>
                <button
                  onClick={() => onOpen(o.id)}
                  className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors hover:bg-[#20366f] ${RING}`}
                >
                  <MatchRing value={o.match} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-bold" style={{ color: K.ink }}>
                      {o.titel}
                    </p>
                    <p
                      className="mt-0.5 flex items-center gap-1 truncate text-[12px]"
                      style={{ color: K.sub }}
                    >
                      <MapPin size={12} strokeWidth={2.2} aria-hidden="true" /> {o.opdrachtgever} ·{" "}
                      {o.plaats}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                          style={{ background: K.iceSoft, color: K.ice }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span
                    className="shrink-0 text-[14px] font-bold tabular-nums"
                    style={{ ...mono, color: K.copperBright }}
                  >
                    {o.tarief.replace(" / uur", "")}
                  </span>
                </button>
              </Panel>
            ))}
          </ul>
        </div>

        {/* Rechterkolom: volgende actie + vertrouwen + berichten (met error-state) */}
        <div className="space-y-5">
          {warn && (
            <Panel level={3} className="overflow-hidden p-4">
              <Kicker>Volgende actie</Kicker>
              <p className="mt-1.5 text-[15px] font-bold" style={{ color: K.ink }}>
                {warn.titel}
              </p>
              <p className="mt-1 text-[12.5px] leading-snug" style={{ color: K.sub }}>
                {warn.detail}
              </p>
              <button
                onClick={() => onGo("verificatie")}
                className={`mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold transition-transform active:scale-[0.98] ${RING}`}
                style={{ background: K.copper, color: K.abyss }}
              >
                {warn.cta} <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </Panel>
          )}

          <Panel level={2} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold" style={{ color: K.sub }}>
                Vertrouwensniveau
              </p>
              <ShieldCheck
                size={16}
                strokeWidth={2.4}
                aria-hidden="true"
                style={{ color: K.ice }}
              />
            </div>
            <p className="mt-1.5 text-[20px] font-extrabold" style={{ color: K.ink }}>
              {PROFIEL.trust}
            </p>
            <div
              className="mt-3 h-2.5 overflow-hidden rounded-full"
              style={{ background: K.edgeSoft }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: "82%",
                  background: `linear-gradient(90deg, ${K.ice}, ${K.copper})`,
                }}
              />
            </div>
            <p className="mt-2 text-[11.5px]" style={{ color: K.faint }}>
              2 van 4 bewijsstukken geverifieerd · 1 verloopt binnenkort
            </p>
          </Panel>

          {/* Berichten — laadt en faalt (error + retry) */}
          <Panel level={2} className="p-4">
            <p className="pb-2 text-[13px] font-bold" style={{ color: K.ink }}>
              Berichten
            </p>
            {feed === "loading" ? (
              <div role="status" aria-live="polite" className="space-y-2.5">
                <span className="sr-only">Berichten laden…</span>
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span
                      className="h-9 w-9 rounded-full"
                      style={{ background: K.l3, animation: "kb-pulse 1.2s ease-in-out infinite" }}
                    />
                    <span
                      className="h-3 flex-1 rounded-full"
                      style={{ background: K.l3, animation: "kb-pulse 1.2s ease-in-out infinite" }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-3 text-center" role="alert">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ background: K.copperSoft }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={18} strokeWidth={2.4} style={{ color: K.copper }} />
                </span>
                <p className="mt-2 text-[13px] font-bold" style={{ color: K.ink }}>
                  Berichten niet geladen
                </p>
                <p className="mt-0.5 text-[11.5px]" style={{ color: K.sub }}>
                  De verbinding werd onderbroken.
                </p>
                <button
                  onClick={retry}
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold ${RING}`}
                  style={{ background: K.l4, color: K.ink }}
                >
                  <RefreshCw size={13} strokeWidth={2.4} aria-hidden="true" /> Opnieuw proberen
                </button>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({
  activeId,
  onSelect,
  onOpen,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onOpen: (id?: string) => void;
}) {
  const [q, setQ] = useState("");
  const [chip, setChip] = useState("Alle");
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const chips = ["Alle", "BIG", "Avond", "GGZ", "Dagdienst"];

  const filtered = OPDRACHTEN.filter((o) => {
    const mQ =
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase());
    const mC = chip === "Alle" || o.tags.some((t) => t.toLowerCase().includes(chip.toLowerCase()));
    return mQ && mC;
  });

  return (
    <div>
      <ScreenHead
        kicker="De markt"
        titel="Opdrachten"
        sub="Verklaarbaar gematcht op jouw profiel en beschikbaarheid."
      />

      {/* Zoek + filterchips */}
      <div className="space-y-3">
        <div
          className="flex items-center gap-2.5 rounded-xl px-4 py-3"
          style={{ background: K.l1, border: `1px solid ${K.edge}` }}
        >
          <Search size={17} strokeWidth={2.2} aria-hidden="true" style={{ color: K.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#8095c2]"
            style={{ color: K.ink }}
          />
          <span className="text-[11px] tabular-nums" style={{ ...mono, color: K.faint }}>
            {filtered.length}/{OPDRACHTEN.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => {
            const on = c === chip;
            return (
              <button
                key={c}
                onClick={() => setChip(c)}
                aria-pressed={on}
                className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
                style={{
                  color: on ? K.abyss : K.sub,
                  background: on ? K.copper : K.l2,
                  border: `1px solid ${on ? K.copper : K.edge}`,
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: K.l2, border: `1px solid ${K.edge}` }}
            aria-hidden="true"
          >
            <Search size={24} strokeWidth={2} style={{ color: K.faint }} />
          </span>
          <p className="mt-4 text-[17px] font-extrabold" style={{ color: K.ink }}>
            Niets gevonden
          </p>
          <p className="mt-1 max-w-[300px] text-[13px]" style={{ color: K.sub }}>
            Geen opdracht past bij deze filters. Wis het filter en probeer opnieuw.
          </p>
          <button
            onClick={() => {
              setQ("");
              setChip("Alle");
            }}
            className={`mt-4 rounded-xl px-4 py-2.5 text-[13px] font-bold ${RING}`}
            style={{ background: K.copper, color: K.abyss }}
          >
            Filters wissen
          </button>
        </div>
      ) : (
        <ul className="mt-5 space-y-3.5">
          {filtered.map((o) => {
            const on = o.id === activeId;
            const isSaved = !!saved[o.id];
            return (
              <Panel as="li" key={o.id} level={on ? 3 : 2}>
                <div
                  className="rounded-2xl p-4"
                  style={{ boxShadow: on ? `inset 0 0 0 1px ${K.copper}` : "none" }}
                >
                  <div className="flex items-start gap-4">
                    <MatchRing value={o.match} size={58} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className="text-[10px] font-bold uppercase tracking-[0.14em]"
                            style={{ ...mono, color: K.faint }}
                          >
                            {o.id}
                          </p>
                          <p
                            className="truncate text-[16px] font-extrabold"
                            style={{ color: K.ink }}
                          >
                            {o.titel}
                          </p>
                          <p
                            className="mt-0.5 flex items-center gap-1 truncate text-[12.5px]"
                            style={{ color: K.sub }}
                          >
                            <MapPin size={12} strokeWidth={2.2} aria-hidden="true" />{" "}
                            {o.opdrachtgever} · {o.plaats}
                          </p>
                        </div>
                        <button
                          onClick={() => setSaved((s) => ({ ...s, [o.id]: !s[o.id] }))}
                          aria-pressed={isSaved}
                          aria-label={isSaved ? "Verwijder uit opgeslagen" : "Sla opdracht op"}
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${RING}`}
                          style={{
                            background: isSaved ? K.copperSoft : K.l1,
                            border: `1px solid ${isSaved ? K.copper : K.edge}`,
                          }}
                        >
                          <Bookmark
                            size={16}
                            strokeWidth={2.2}
                            aria-hidden="true"
                            style={{ color: isSaved ? K.copperBright : K.faint }}
                            fill={isSaved ? K.copper : "none"}
                          />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-lg px-2.5 py-1 text-[12px] font-bold tabular-nums"
                          style={{ ...mono, background: K.copperSoft, color: K.copperBright }}
                        >
                          {o.tarief}
                        </span>
                        <span className="text-[12px]" style={{ color: K.sub }}>
                          {o.uren} · {o.start}
                        </span>
                      </div>

                      {/* Verklaarbare matching — plus/min */}
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <ul className="space-y-1">
                          {o.redenen.plus.slice(0, 2).map((r) => (
                            <li
                              key={r}
                              className="flex items-start gap-1.5 text-[12px]"
                              style={{ color: K.sub }}
                            >
                              <Check
                                size={13}
                                strokeWidth={2.8}
                                className="mt-0.5 shrink-0"
                                aria-hidden="true"
                                style={{ color: K.ice }}
                              />
                              {r}
                            </li>
                          ))}
                        </ul>
                        <ul className="space-y-1">
                          {o.redenen.min.slice(0, 2).map((r) => (
                            <li
                              key={r}
                              className="flex items-start gap-1.5 text-[12px]"
                              style={{ color: K.sub }}
                            >
                              <AlertTriangle
                                size={13}
                                strokeWidth={2.6}
                                className="mt-0.5 shrink-0"
                                aria-hidden="true"
                                style={{ color: K.copper }}
                              />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-3.5 flex items-center gap-2.5">
                        <button
                          onClick={() => {
                            onSelect(o.id);
                            onOpen(o.id);
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-bold transition-transform active:scale-[0.98] ${RING}`}
                          style={{ background: K.copper, color: K.abyss }}
                        >
                          Bekijk opdracht{" "}
                          <ArrowRight size={14} strokeWidth={2.6} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => onSelect(o.id)}
                          className={`rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors ${RING}`}
                          style={{ background: K.l1, color: K.sub, border: `1px solid ${K.edge}` }}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            );
          })}
        </ul>
      )}
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
      <button
        onClick={onBack}
        className={`mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] font-semibold ${RING}`}
        style={{ color: K.sub }}
      >
        <ChevronRight size={14} strokeWidth={2.6} className="rotate-180" aria-hidden="true" /> Terug
        naar marktplaats
      </button>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <Panel level={2} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Kicker>{opdracht.id}</Kicker>
                <h1
                  className="mt-2 text-[24px] font-extrabold leading-tight tracking-tight"
                  style={{ color: K.ink }}
                >
                  {opdracht.titel}
                </h1>
                <p className="mt-1.5 text-[13.5px]" style={{ color: K.sub }}>
                  {opdracht.opdrachtgever} · {opdracht.plaats}
                </p>
              </div>
              <MatchRing value={opdracht.match} size={64} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
                  style={{ background: K.iceSoft, color: K.ice }}
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { l: "Tarief", v: opdracht.tarief.replace(" / uur", "") },
                { l: "Omvang", v: opdracht.uren },
                { l: "Start", v: opdracht.start },
                { l: "Match", v: `${opdracht.match}%` },
              ].map((m) => (
                <div
                  key={m.l}
                  className="rounded-xl p-3"
                  style={{ background: K.l3, border: `1px solid ${K.edge}` }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.1em]"
                    style={{ ...mono, color: K.faint }}
                  >
                    {m.l}
                  </p>
                  <p
                    className="mt-1 text-[15px] font-extrabold tabular-nums"
                    style={{ ...mono, color: K.ink }}
                  >
                    {m.v}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          {/* Verklaarbare match */}
          <Panel level={2} className="p-6">
            <h2 className="text-[15px] font-extrabold" style={{ color: K.ink }}>
              Waarom deze match
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p
                  className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: K.ice }}
                >
                  <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.plus.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ color: K.ink }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        style={{ background: K.iceSoft }}
                        aria-hidden="true"
                      >
                        <Check size={11} strokeWidth={3} style={{ color: K.ice }} />
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p
                  className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: K.copper }}
                >
                  <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Aandachtspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ color: K.sub }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        style={{ background: K.copperSoft }}
                        aria-hidden="true"
                      >
                        <AlertTriangle size={10} strokeWidth={2.8} style={{ color: K.copper }} />
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>
        </div>

        {/* Zij-paneel: compliance + reageren */}
        <div className="space-y-5">
          <Panel level={3} className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck
                size={16}
                strokeWidth={2.4}
                aria-hidden="true"
                style={{ color: K.ice }}
              />
              <p className="text-[13px] font-bold" style={{ color: K.ink }}>
                Compliance-eis
              </p>
            </div>
            <p className="mt-2 text-[12.5px] leading-snug" style={{ color: K.sub }}>
              Deze opdracht vereist een geldige BIG-registratie en VOG (zorg). Jouw BIG-registratie
              is geverifieerd; je VOG verloopt binnenkort.
            </p>
            <div className="mt-3 space-y-2">
              <ComplianceRow label="BIG-registratie" status="VERIFIED" />
              <ComplianceRow label="VOG (zorg)" status="EXPIRING" />
            </div>
          </Panel>

          <Panel level={2} className="p-5">
            <p className="text-[13px] font-bold" style={{ color: K.ink }}>
              Reageren op deze opdracht
            </p>
            <p className="mt-1 text-[12px]" style={{ color: K.sub }}>
              Gemiddelde reactietijd van {opdracht.opdrachtgever} is 6 uur.
            </p>
            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className={`mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold transition-transform active:scale-[0.98] disabled:opacity-90 ${RING}`}
              style={{
                background: state === "sent" ? K.ice : K.copper,
                color: K.abyss,
              }}
            >
              {state === "idle" && (
                <>
                  <Sparkle size={16} strokeWidth={2.6} aria-hidden="true" /> Reageer nu
                </>
              )}
              {state === "sending" && "Versturen…"}
              {state === "sent" && (
                <>
                  <Check size={16} strokeWidth={3} aria-hidden="true" /> Reactie verstuurd
                </>
              )}
            </button>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function ComplianceRow({ label, status }: { label: string; status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <div
      className="flex items-center justify-between rounded-lg px-3 py-2"
      style={{ background: K.l1, border: `1px solid ${K.edge}` }}
    >
      <span
        className="flex items-center gap-2 text-[12.5px] font-semibold"
        style={{ color: K.ink }}
      >
        <Icon size={14} strokeWidth={2.4} aria-hidden="true" style={{ color: m.fg }} />
        {label}
      </span>
      <StatusBadge status={status} />
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const expiring = CREDENTIALS.find((c) => c.status === "EXPIRING");
  const pct = Math.round((verified / total) * 100);

  return (
    <div>
      <ScreenHead
        kicker="Vertrouwen"
        titel="Bewijsstukken"
        sub="Veilig en privé bewaard · alleen jij en geverifieerde opdrachtgevers zien de status."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.6fr]">
        <Panel level={2} className="p-5">
          <p className="text-[12.5px] font-semibold" style={{ color: K.sub }}>
            Verificatiegraad
          </p>
          <div className="mt-2 flex items-end gap-2">
            <span
              className="text-[34px] font-extrabold tabular-nums leading-none"
              style={{ ...mono, color: K.ink }}
            >
              {pct}%
            </span>
            <span
              className="pb-1 text-[13px] font-semibold tabular-nums"
              style={{ ...mono, color: K.sub }}
            >
              {verified}/{total}
            </span>
          </div>
          <div
            className="mt-4 h-2.5 overflow-hidden rounded-full"
            style={{ background: K.edgeSoft }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${K.ice}, ${K.copper})`,
              }}
            />
          </div>

          {expiring && (
            <div
              className="mt-4 rounded-xl p-3.5"
              style={{ background: K.copperSoft, border: `1px solid ${K.copper}55` }}
              role="alert"
            >
              <p
                className="flex items-center gap-1.5 text-[12.5px] font-bold"
                style={{ color: K.copperBright }}
              >
                <AlertTriangle size={14} strokeWidth={2.6} aria-hidden="true" />
                {expiring.naam} verloopt
              </p>
              <p className="mt-1 text-[12px]" style={{ color: K.sub }}>
                {expiring.detail}. Vernieuw op tijd om verifieerbaar te blijven.
              </p>
              <button
                className={`mt-2.5 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold ${RING}`}
                style={{ background: K.copper, color: K.abyss }}
              >
                Vernieuwen <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          )}
        </Panel>

        <div className="space-y-3">
          {CREDENTIALS.map((c) => {
            const m = credMeta(c.status);
            const Icon = m.Icon;
            return (
              <Panel key={c.naam} level={2}>
                <div className="flex items-center gap-3.5 p-4">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: m.bg }}
                    aria-hidden="true"
                  >
                    <Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold" style={{ color: K.ink }}>
                      {c.naam}
                    </p>
                    <p className="truncate text-[12px]" style={{ color: K.sub }}>
                      {c.detail}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              </Panel>
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
      <ScreenHead
        kicker="Prioriteiten"
        titel="Volgende acties"
        sub="Gerangschikt op urgentie — koper markeert wat aandacht vraagt."
      />
      <ul className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const accent = warn ? K.copper : K.ice;
          const accentSoft = warn ? K.copperSoft : K.iceSoft;
          return (
            <Panel as="li" key={a.titel} level={warn ? 3 : 2}>
              <div className="flex items-start gap-4 p-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[14px] font-extrabold tabular-nums"
                  style={{ ...mono, background: accentSoft, color: accent }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ ...mono, color: accent }}
                  >
                    {warn ? "Waarschuwing" : "Melding"}
                  </span>
                  <p className="mt-0.5 text-[14.5px] font-bold" style={{ color: K.ink }}>
                    {a.titel}
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-snug" style={{ color: K.sub }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                  className={`shrink-0 self-center rounded-xl px-4 py-2 text-[13px] font-bold transition-transform active:scale-[0.98] ${RING}`}
                  style={{
                    background: warn ? K.copper : K.l4,
                    color: warn ? K.abyss : K.ink,
                  }}
                >
                  {a.cta}
                </button>
              </div>
            </Panel>
          );
        })}
      </ul>

      <Panel level={1} className="mt-4 p-4">
        <p className="flex items-center gap-2 text-[12.5px]" style={{ color: K.sub }}>
          <Check size={15} strokeWidth={2.6} aria-hidden="true" style={{ color: K.ice }} />
          Verder is alles bijgewerkt. Nieuwe kansen verschijnen hier vanzelf.
        </p>
      </Panel>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const tone: Record<string, { fg: string; bg: string }> = {
    Betaald: { fg: K.ice, bg: K.iceSoft },
    Openstaand: { fg: K.copper, bg: K.copperSoft },
    Concept: { fg: K.faint, bg: K.edgeSoft },
  };
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );

  return (
    <div>
      <ScreenHead
        kicker="Kassa"
        titel="Facturen"
        right={
          <button
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-bold ${RING}`}
            style={{ background: K.copper, color: K.abyss }}
          >
            <Plus size={16} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Panel level={2} className="p-4">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.1em]"
            style={{ ...mono, color: K.ice }}
          >
            Ontvangen
          </p>
          <p
            className="mt-1.5 text-[22px] font-extrabold tabular-nums"
            style={{ ...mono, color: K.ink }}
          >
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Panel>
        <Panel level={2} className="p-4">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.1em]"
            style={{ ...mono, color: K.copper }}
          >
            Openstaand
          </p>
          <p
            className="mt-1.5 text-[22px] font-extrabold tabular-nums"
            style={{ ...mono, color: K.ink }}
          >
            € {open.toLocaleString("nl-NL")}
          </p>
        </Panel>
        <Panel level={2} className="col-span-2 p-4 sm:col-span-1">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.1em]"
            style={{ ...mono, color: K.faint }}
          >
            Facturen
          </p>
          <p
            className="mt-1.5 text-[22px] font-extrabold tabular-nums"
            style={{ ...mono, color: K.ink }}
          >
            {FACTUREN.length}
          </p>
        </Panel>
      </div>

      <Panel level={2} className="mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10px] uppercase tracking-[0.12em]"
                style={{ color: K.faint, borderBottom: `1px solid ${K.edge}` }}
              >
                <th className="px-4 py-3 font-semibold">Nummer</th>
                <th className="px-4 py-3 font-semibold">Klant</th>
                <th className="px-4 py-3 font-semibold">Datum</th>
                <th className="px-4 py-3 text-right font-semibold">Bedrag</th>
                <th className="px-4 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = tone[f.status] ?? { fg: K.faint, bg: K.edgeSoft };
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#20366f]"
                    style={{ borderBottom: `1px solid ${K.edgeSoft}` }}
                  >
                    <td
                      className="px-4 py-3 text-[12.5px] tabular-nums"
                      style={{ ...mono, color: K.sub }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: K.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12.5px] tabular-nums"
                      style={{ ...mono, color: K.sub }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: K.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{ color: t.fg, background: t.bg }}
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
      </Panel>
    </div>
  );
}
