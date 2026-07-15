"use client";

// Concept 322 — "Kwik" · Spatiale diepte met gelaagde translucentie (2026 spatial UI).
// Meerdere translucente glaslagen met verschillende blur/opacity suggereren fysieke diepte;
// licht valt langs de bovenranden en lagen verschuiven parallax-achtig bij hover. Voor gevoelige
// documenten schept die tastbare gelaagdheid rust en focus: het belangrijkste zweeft vooraan,
// de rest wijkt naar achteren. visionOS-energie, maar puur 2D-web/CSS.
// Fonts: --font-lab-sora (koppen) + --font-lab-inter (tekst & tabulaire cijfers).

import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Compass,
  FileText,
  ShieldCheck,
  ListChecks,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Check,
  Plus,
  MapPin,
  ChevronRight,
  Sparkles,
  ServerCrash,
  RefreshCw,
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

/* ---------- Palet & typografie ---------- */

const C = {
  ink: "#eef3fb",
  sub: "#a9b7ce",
  faint: "#71809a",
  accent: "#38d6ff",
  accentDeep: "#0ea5d6",
  jade: "#34d399",
  jadeDeep: "#0f9d6b",
  warn: "#fbbf24",
  warnDeep: "#d19112",
  alert: "#f87171",
  alertDeep: "#dc4c4c",
  glass: "rgba(255,255,255,0.055)",
  glassStrong: "rgba(255,255,255,0.10)",
  glassLine: "rgba(255,255,255,0.14)",
  glassLineSoft: "rgba(255,255,255,0.08)",
};

const head = { fontFamily: "var(--font-lab-sora), sans-serif" };
const body = { fontFamily: "var(--font-lab-inter), sans-serif" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38d6ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1122]";

/* ---------- Status → betekenis ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.jade, Icon: BadgeCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.accent, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", color: C.warn, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.alert, Icon: XCircle };
  }
}

function euros(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Glas-primitief: translucente laag met lichtrand ---------- */

function Glass({
  children,
  className,
  strong,
  interactive,
  style,
  role,
}: {
  children: React.ReactNode;
  className?: string;
  strong?: boolean;
  interactive?: boolean;
  style?: React.CSSProperties;
  role?: string;
}) {
  return (
    <div
      role={role}
      className={`relative overflow-hidden rounded-3xl backdrop-blur-2xl transition-all duration-300 ${
        interactive ? "hover:-translate-y-1" : ""
      } ${className ?? ""}`}
      style={{
        background: strong ? C.glassStrong : C.glass,
        border: `1px solid ${C.glassLine}`,
        boxShadow: interactive
          ? "0 24px 60px -30px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.14)"
          : "0 18px 44px -28px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)",
        ...style,
      }}
    >
      {/* Licht dat langs de bovenrand valt */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

/* ---------- Sparkline ---------- */

function Spark({ data, color }: { data: number[]; color: string }) {
  const w = 82;
  const h = 26;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const id = color.replace("#", "");
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
        <linearGradient id={`kw-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.34" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#kw-${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.2" fill={color} />}
    </svg>
  );
}

/* ---------- Statusbadge ---------- */

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: m.color, background: `${m.color}1f`, border: `1px solid ${m.color}44` }}
    >
      <Icon size={12} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

/* ---------- Match-ring ---------- */

function MatchRing({ value, size = 58 }: { value: number; size?: number }) {
  const r = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="4"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.accent}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span className="text-[14px] font-bold tabular-nums" style={{ ...head, color: C.ink }}>
        {value}
      </span>
    </span>
  );
}

/* ---------- Navigatie ---------- */

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Compass,
  opdracht: FileText,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: FileText,
};

/* ---------- Hoofdcomponent ---------- */

export function Concept322() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const openDetail = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{
        ...body,
        color: C.ink,
        background: "radial-gradient(120% 90% at 15% 0%, #1c2b4a 0%, #101a30 42%, #0a1020 100%)",
      }}
    >
      <style>{`
        @keyframes kw-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes kw-float { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(0,-10px,0); } }
        @keyframes kw-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>

      {/* Diepte-orbs op de achtergrond */}
      <span
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{
          background: "radial-gradient(circle, #2f8fff, transparent 68%)",
          animation: "kw-float 9s ease-in-out infinite",
        }}
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute -right-16 bottom-8 h-80 w-80 rounded-full opacity-25 blur-3xl"
        style={{
          background: "radial-gradient(circle, #38d6ff, transparent 70%)",
          animation: "kw-float 11s ease-in-out infinite reverse",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[680px] max-w-[1200px] gap-4 p-4 sm:p-6">
        {/* Zwevende glas-rail */}
        <aside className="hidden w-[212px] shrink-0 md:block">
          <Glass className="sticky top-6 p-3" strong>
            <div className="flex items-center gap-2.5 px-2 py-2">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[13px] font-bold text-white"
                style={{
                  ...head,
                  background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
                }}
                aria-hidden="true"
              >
                Z
              </span>
              <div className="leading-tight">
                <p className="text-[13px] font-bold" style={head}>
                  Kwik
                </p>
                <p className="text-[10.5px]" style={{ color: C.faint }}>
                  Spatial workspace
                </p>
              </div>
            </div>

            <nav className="mt-2 flex flex-col gap-1" aria-label="Schermen">
              {SCREENS.map((s) => {
                const Icon = NAV_ICONS[s.key];
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[13px] transition-all ${RING}`}
                    style={{
                      color: on ? C.ink : C.sub,
                      background: on ? C.glassStrong : "transparent",
                      border: `1px solid ${on ? C.glassLine : "transparent"}`,
                      fontWeight: on ? 700 : 500,
                    }}
                  >
                    <Icon
                      size={17}
                      strokeWidth={2.2}
                      aria-hidden="true"
                      style={{ color: on ? C.accent : C.faint }}
                    />
                    {s.label}
                    {on && (
                      <span
                        className="absolute right-3 h-1.5 w-1.5 rounded-full"
                        style={{ background: C.accent }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-3 border-t pt-3" style={{ borderColor: C.glassLineSoft }}>
              <div className="flex items-center gap-2.5 px-2">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ ...head, background: "rgba(255,255,255,0.14)" }}
                  aria-hidden="true"
                >
                  {PROFIEL.initialen}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-bold" style={head}>
                    {PROFIEL.naam}
                  </p>
                  <p className="flex items-center gap-1 text-[10.5px]" style={{ color: C.jade }}>
                    <ShieldCheck size={10} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
                  </p>
                </div>
              </div>
            </div>
          </Glass>
        </aside>

        {/* Hoofdkolom */}
        <main className="min-w-0 flex-1">
          {/* Mobiele scherm-switcher */}
          <div className="mb-4 md:hidden">
            <Glass className="flex gap-1 overflow-x-auto p-1.5" strong>
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    className={`shrink-0 rounded-xl px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
                    style={{
                      color: on ? C.ink : C.sub,
                      background: on ? C.glassStrong : "transparent",
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </Glass>
          </div>

          <div key={screen} style={{ animation: "kw-rise 0.36s ease" }}>
            {screen === "dashboard" && <Dashboard onOpen={openDetail} onGo={setScreen} />}
            {screen === "marktplaats" && <Marktplaats onOpen={openDetail} />}
            {screen === "opdracht" && (
              <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
            )}
            {screen === "verificatie" && <Verificatie onGo={setScreen} />}
            {screen === "acties" && <Acties onGo={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Sectiekop ---------- */

function ScreenHead({ titel, sub }: { titel: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h1 className="text-[24px] font-bold leading-tight sm:text-[28px]" style={head}>
        {titel}
      </h1>
      {sub && (
        <p className="mt-0.5 text-[13px]" style={{ color: C.sub }}>
          {sub}
        </p>
      )}
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
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 800);
    return () => window.clearTimeout(t);
  }, []);

  const warn = ACTIES[0];

  return (
    <div>
      <ScreenHead titel="Goedenavond, Sanne" sub={`${PROFIEL.rol} · ${PROFIEL.plaats}`} />

      {/* KPI-lagen */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading
          ? [0, 1, 2, 3].map((i) => (
              <Glass key={i} className="p-4">
                <div className="space-y-3" role="status" aria-live="polite">
                  <span className="sr-only">Cijfers laden…</span>
                  <span
                    className="block h-3 w-2/3 rounded-full"
                    style={{ background: "rgba(255,255,255,0.09)" }}
                  />
                  <span
                    className="block h-7 w-1/2 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.12)" }}
                  />
                  <span
                    className="block h-5 w-full rounded-lg"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.14) 37%, rgba(255,255,255,0.06) 63%)",
                      backgroundSize: "200% 100%",
                      animation: "kw-shimmer 1.4s ease infinite",
                    }}
                  />
                </div>
              </Glass>
            ))
          : KPIS.map((k) => (
              <Glass key={k.label} interactive className="group p-4">
                <div className="flex items-start justify-between">
                  <p className="text-[11.5px] font-medium" style={{ color: C.sub }}>
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                    style={{ color: k.up ? C.jade : C.warn }}
                  >
                    {k.up ? (
                      <ArrowUpRight size={12} strokeWidth={3} aria-hidden="true" />
                    ) : (
                      <ArrowDownRight size={12} strokeWidth={3} aria-hidden="true" />
                    )}
                    {k.trend}
                  </span>
                </div>
                <p className="mt-1.5 text-[26px] font-bold tabular-nums leading-none" style={head}>
                  {k.value}
                </p>
                <div className="mt-2">
                  <Spark data={k.spark} color={k.up ? C.accent : C.warn} />
                </div>
              </Glass>
            ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        {/* Next action — vooraan zwevend */}
        {warn && (
          <Glass strong className="group p-5">
            <span
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-50 blur-2xl transition-transform duration-500 group-hover:translate-x-3 group-hover:translate-y-2"
              style={{
                background: "radial-gradient(circle, rgba(56,214,255,0.5), transparent 70%)",
              }}
              aria-hidden="true"
            />
            <div className="relative">
              <p
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ color: C.accent }}
              >
                <Sparkles size={13} strokeWidth={2.6} aria-hidden="true" /> Volgende beste actie
              </p>
              <p className="mt-2 text-[20px] font-bold leading-tight" style={head}>
                {warn.titel}
              </p>
              <p className="mt-1 max-w-md text-[13.5px] leading-snug" style={{ color: C.sub }}>
                {warn.detail}
              </p>
              <button
                onClick={() => onGo("verificatie")}
                className={`mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold transition-transform active:scale-[0.98] ${RING}`}
                style={{
                  background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
                  color: "#04121c",
                }}
              >
                {warn.cta} <ArrowRight size={15} strokeWidth={2.8} aria-hidden="true" />
              </button>
            </div>
          </Glass>
        )}

        {/* Vertrouwensniveau */}
        <Glass className="flex flex-col justify-between p-5">
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.faint }}
            >
              Vertrouwensniveau
            </p>
            <p className="mt-2 flex items-center gap-2 text-[22px] font-bold" style={head}>
              <ShieldCheck size={22} strokeWidth={2.2} color={C.jade} aria-hidden="true" />{" "}
              {PROFIEL.trust}
            </p>
          </div>
          <div className="mt-4 space-y-2">
            {CREDENTIALS.slice(0, 3).map((c) => {
              const m = credMeta(c.status);
              const Icon = m.Icon;
              return (
                <div key={c.naam} className="flex items-center gap-2 text-[12.5px]">
                  <Icon size={14} strokeWidth={2.4} color={m.color} aria-hidden="true" />
                  <span className="truncate" style={{ color: C.sub }}>
                    {c.naam}
                  </span>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => onGo("verificatie")}
            className={`mt-4 inline-flex items-center gap-1 self-start rounded-full px-3 py-1.5 text-[12px] font-bold ${RING}`}
            style={{ color: C.accent, background: `${C.accent}18` }}
          >
            Alle bewijsstukken <ChevronRight size={13} strokeWidth={2.8} aria-hidden="true" />
          </button>
        </Glass>
      </div>

      {/* Beste matches */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[15px] font-bold" style={head}>
            Beste matches
          </h2>
          <button
            onClick={() => onGo("marktplaats")}
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 text-[12px] font-bold ${RING}`}
            style={{ color: C.accent }}
          >
            Alles <ChevronRight size={14} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {OPDRACHTEN.map((o) => (
            <button
              key={o.id}
              onClick={() => onOpen(o.id)}
              className={`text-left ${RING} rounded-3xl`}
            >
              <Glass interactive className="h-full p-4">
                <div className="flex items-center justify-between">
                  <MatchRing value={o.match} size={50} />
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ color: C.accent, background: `${C.accent}18` }}
                  >
                    {o.tarief.replace(" / uur", "/u")}
                  </span>
                </div>
                <p className="mt-3 text-[14px] font-bold leading-tight" style={head}>
                  {o.titel}
                </p>
                <p
                  className="mt-0.5 flex items-center gap-1 text-[11.5px]"
                  style={{ color: C.sub }}
                >
                  <MapPin size={11} strokeWidth={2.2} aria-hidden="true" /> {o.plaats}
                </p>
              </Glass>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({ onOpen }: { onOpen: (id?: string) => void }) {
  const [q, setQ] = useState("");
  const [hover, setHover] = useState<string>("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <ScreenHead titel="Marktplaats" sub="Opdrachten gerangschikt op match" />

      <Glass strong className="mb-4 flex items-center gap-2.5 px-4 py-3">
        <Search size={17} strokeWidth={2.2} color={C.faint} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#71809a]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[12px] tabular-nums" style={{ color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Glass>

      {filtered.length === 0 ? (
        <Glass className="flex flex-col items-center justify-center py-16 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <Search size={24} strokeWidth={2} color={C.faint} aria-hidden="true" />
          </span>
          <p className="mt-4 text-[17px] font-bold" style={head}>
            Niets gevonden
          </p>
          <p className="mt-1 max-w-[280px] text-[13px]" style={{ color: C.sub }}>
            Geen opdracht past bij &ldquo;{q}&rdquo;. Wis je zoekopdracht en probeer opnieuw.
          </p>
          <button
            onClick={() => setQ("")}
            className={`mt-4 rounded-full px-5 py-2.5 text-[13px] font-bold ${RING}`}
            style={{ background: `${C.accent}22`, color: C.accent }}
          >
            Zoekopdracht wissen
          </button>
        </Glass>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => {
            const on = o.id === hover;
            return (
              <li key={o.id}>
                <button
                  onClick={() => onOpen(o.id)}
                  onMouseEnter={() => setHover(o.id)}
                  onMouseLeave={() => setHover("")}
                  onFocus={() => setHover(o.id)}
                  onBlur={() => setHover("")}
                  className={`block w-full text-left ${RING} rounded-3xl`}
                >
                  <Glass interactive className="group p-4">
                    <div className="flex items-start gap-4">
                      <MatchRing value={o.match} size={58} />
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[10px] font-bold uppercase tracking-[0.12em]"
                          style={{ color: C.faint }}
                        >
                          {o.id} · {o.opdrachtgever}
                        </p>
                        <p className="truncate text-[16px] font-bold leading-tight" style={head}>
                          {o.titel}
                        </p>
                        <p
                          className="mt-0.5 flex items-center gap-1 text-[12.5px]"
                          style={{ color: C.sub }}
                        >
                          <MapPin size={12} strokeWidth={2.2} aria-hidden="true" /> {o.plaats} ·{" "}
                          {o.tarief} · {o.uren}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {o.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                              style={{ background: "rgba(255,255,255,0.07)", color: C.sub }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Parallax-detail: verklaring schuift naar voren bij hover/focus */}
                    <div
                      className="grid grid-rows-[0fr] transition-all duration-300 group-focus-within:grid-rows-[1fr] group-hover:grid-rows-[1fr]"
                      style={{ gridTemplateRows: on ? "1fr" : "0fr" }}
                    >
                      <div className="overflow-hidden">
                        <div
                          className="mt-3 grid gap-3 border-t pt-3 sm:grid-cols-2"
                          style={{ borderColor: C.glassLineSoft }}
                        >
                          <div>
                            <p
                              className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em]"
                              style={{ color: C.jade }}
                            >
                              <Check size={12} strokeWidth={3} aria-hidden="true" /> Pluspunten
                            </p>
                            <ul className="mt-1.5 space-y-1">
                              {o.redenen.plus.map((r) => (
                                <li key={r} className="flex items-start gap-1.5 text-[12.5px]">
                                  <Check
                                    size={13}
                                    strokeWidth={2.6}
                                    color={C.jade}
                                    className="mt-0.5 shrink-0"
                                    aria-hidden="true"
                                  />
                                  {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p
                              className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em]"
                              style={{ color: C.warn }}
                            >
                              <AlertTriangle size={12} strokeWidth={2.6} aria-hidden="true" />{" "}
                              Aandacht
                            </p>
                            <ul className="mt-1.5 space-y-1">
                              {o.redenen.min.map((r) => (
                                <li
                                  key={r}
                                  className="flex items-start gap-1.5 text-[12.5px]"
                                  style={{ color: C.sub }}
                                >
                                  <AlertTriangle
                                    size={13}
                                    strokeWidth={2.4}
                                    color={C.warn}
                                    className="mt-0.5 shrink-0"
                                    aria-hidden="true"
                                  />
                                  {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Glass>
                </button>
              </li>
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
        className={`mb-3 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12.5px] font-bold ${RING}`}
        style={{ color: C.accent }}
      >
        <ChevronRight size={14} strokeWidth={2.6} className="rotate-180" aria-hidden="true" /> Terug
      </button>

      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3">
          <Glass strong className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: C.accent }}
                >
                  {opdracht.id} · {opdracht.opdrachtgever}
                </p>
                <h1 className="mt-1 text-[24px] font-bold leading-tight" style={head}>
                  {opdracht.titel}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-[13px]" style={{ color: C.sub }}>
                  <MapPin size={13} strokeWidth={2.2} aria-hidden="true" /> {opdracht.plaats}
                </p>
              </div>
              <MatchRing value={opdracht.match} size={68} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { l: "Tarief", v: opdracht.tarief.replace(" / uur", "") },
                { l: "Omvang", v: opdracht.uren.replace(" u/week", " u/w") },
                { l: "Start", v: opdracht.start.replace("Per ", "") },
                { l: "Match", v: `${opdracht.match}%` },
              ].map((m) => (
                <div
                  key={m.l}
                  className="rounded-2xl p-3"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${C.glassLineSoft}`,
                  }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.08em]"
                    style={{ color: C.faint }}
                  >
                    {m.l}
                  </p>
                  <p className="mt-1 text-[16px] font-bold tabular-nums" style={head}>
                    {m.v}
                  </p>
                </div>
              ))}
            </div>
          </Glass>

          <Glass className="p-5">
            <h2 className="text-[14px] font-bold" style={head}>
              Waarom deze match
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em]"
                  style={{ color: C.jade }}
                >
                  <Check size={12} strokeWidth={3} aria-hidden="true" /> Pluspunten
                </p>
                <ul className="mt-2 space-y-2">
                  {opdracht.redenen.plus.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-[13px]">
                      <Check
                        size={15}
                        strokeWidth={2.6}
                        color={C.jade}
                        className="mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em]"
                  style={{ color: C.warn }}
                >
                  <AlertTriangle size={12} strokeWidth={2.6} aria-hidden="true" /> Aandachtspunten
                </p>
                <ul className="mt-2 space-y-2">
                  {opdracht.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ color: C.sub }}
                    >
                      <AlertTriangle
                        size={15}
                        strokeWidth={2.4}
                        color={C.warn}
                        className="mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Glass>
        </div>

        <aside className="space-y-3">
          <Glass strong className="p-5">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.accent }}
            >
              Compliance-eis
            </p>
            <p className="mt-2 text-[15px] font-bold leading-snug" style={head}>
              BIG-registratie geverifieerd vereist
            </p>
            <div
              className="mt-3 flex items-center gap-2 rounded-2xl px-3 py-2.5"
              style={{ background: `${C.jade}16`, border: `1px solid ${C.jade}44` }}
            >
              <BadgeCheck size={18} strokeWidth={2.4} color={C.jade} aria-hidden="true" />
              <span className="text-[13px] font-semibold" style={{ color: C.ink }}>
                Jouw BIG-registratie is geverifieerd
              </span>
            </div>
          </Glass>

          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className={`flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-bold transition-transform active:scale-[0.99] disabled:opacity-90 ${RING}`}
            style={{
              background:
                state === "sent"
                  ? `linear-gradient(135deg, ${C.jade}, ${C.jadeDeep})`
                  : `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
              color: "#04121c",
            }}
          >
            {state === "idle" && (
              <>
                <ArrowRight size={16} strokeWidth={2.8} aria-hidden="true" /> Reageer op opdracht
              </>
            )}
            {state === "sending" && "Reactie versturen…"}
            {state === "sent" && (
              <>
                <Check size={16} strokeWidth={3} aria-hidden="true" /> Reactie verstuurd
              </>
            )}
          </button>
        </aside>
      </div>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const pct = Math.round((verified / total) * 100);
  const expiring = CREDENTIALS.find((c) => c.status === "EXPIRING");

  return (
    <div>
      <ScreenHead titel="Verificatie" sub="Bewijsstukken veilig en privé bewaard" />

      <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
        <Glass strong className="p-5">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.faint }}
          >
            Verificatiegraad
          </p>
          <p className="mt-2 text-[44px] font-bold tabular-nums leading-none" style={head}>
            {pct}%
          </p>
          <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
            {verified} van {total} geverifieerd
          </p>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${C.accent}, ${C.jade})`,
              }}
            />
          </div>
        </Glass>

        {expiring && (
          <Glass
            className="flex flex-col justify-center p-5"
            style={{ border: `1px solid ${C.warn}55` }}
            role="alert"
          >
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.warn }}
            >
              <AlertTriangle size={14} strokeWidth={2.6} aria-hidden="true" /> Verloop-waarschuwing
            </p>
            <p className="mt-2 text-[18px] font-bold leading-tight" style={head}>
              {expiring.naam} verloopt binnenkort
            </p>
            <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
              {expiring.detail}. Vernieuw op tijd om verifieerbaar te blijven.
            </p>
            <button
              onClick={() => onGo("acties")}
              className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-bold ${RING}`}
              style={{ background: `${C.warn}22`, color: C.warn }}
            >
              Herstelactie starten <ArrowRight size={13} strokeWidth={2.8} aria-hidden="true" />
            </button>
          </Glass>
        )}
      </div>

      <ul className="mt-3 space-y-2.5">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const Icon = m.Icon;
          return (
            <li key={c.naam}>
              <Glass className="flex items-center gap-3.5 p-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: `${m.color}18`, border: `1px solid ${m.color}44` }}
                >
                  <Icon size={20} strokeWidth={2.2} color={m.color} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold" style={head}>
                    {c.naam}
                  </p>
                  <p className="truncate text-[12px]" style={{ color: C.sub }}>
                    {c.detail}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </Glass>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const [failed, setFailed] = useState(true);

  return (
    <div>
      <ScreenHead titel="Acties" sub="De next-action-engine, op urgentie" />

      {/* Error-state met retry als eerste, tastbaar zwevend blok */}
      {failed ? (
        <Glass
          className="flex flex-col items-center justify-center py-12 text-center"
          style={{ border: `1px solid ${C.alert}44` }}
        >
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: `${C.alert}18` }}
          >
            <ServerCrash size={22} strokeWidth={2.2} color={C.alert} aria-hidden="true" />
          </span>
          <p className="mt-3 text-[16px] font-bold" style={head}>
            Acties konden niet laden
          </p>
          <p className="mt-1 max-w-[300px] text-[13px]" style={{ color: C.sub }}>
            Er ging iets mis bij het ophalen van je prioriteiten. Probeer het opnieuw.
          </p>
          <button
            onClick={() => setFailed(false)}
            className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-bold ${RING}`}
            style={{ background: `${C.accent}22`, color: C.accent }}
          >
            <RefreshCw size={14} strokeWidth={2.6} aria-hidden="true" /> Opnieuw proberen
          </button>
        </Glass>
      ) : (
        <ul className="space-y-3">
          {ACTIES.map((a, i) => {
            const warn = a.urgentie === "warning";
            const color = warn ? C.warn : C.accent;
            return (
              <li key={a.titel}>
                <Glass
                  interactive
                  className="group flex items-start gap-4 p-4"
                  style={{ border: `1px solid ${color}33` }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[15px] font-bold tabular-nums"
                    style={{ ...head, background: `${color}18`, color }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{ color }}
                    >
                      {warn ? (
                        <AlertTriangle size={11} strokeWidth={2.8} aria-hidden="true" />
                      ) : (
                        <Sparkles size={11} strokeWidth={2.8} aria-hidden="true" />
                      )}
                      {warn ? "Waarschuwing" : "Kans"}
                    </span>
                    <p className="mt-0.5 text-[15px] font-bold leading-tight" style={head}>
                      {a.titel}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-snug" style={{ color: C.sub }}>
                      {a.detail}
                    </p>
                  </div>
                  <button
                    onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                    className={`shrink-0 self-center rounded-full px-4 py-2 text-[12.5px] font-bold ${RING}`}
                    style={{ background: `${color}22`, color }}
                  >
                    {a.cta}
                  </button>
                </Glass>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const tone: Record<string, string> = {
    Betaald: C.jade,
    Openstaand: C.warn,
    Concept: C.faint,
  };
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-4">
        <ScreenHead titel="Facturen" sub="Overzicht van je omzet" />
        <button
          className={`mb-1 inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-bold ${RING}`}
          style={{
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
            color: "#04121c",
          }}
        >
          <Plus size={15} strokeWidth={2.8} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <Glass className="p-4" style={{ border: `1px solid ${C.jade}33` }}>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: C.jade }}>
            Ontvangen
          </p>
          <p
            className="mt-1 text-[26px] font-bold tabular-nums leading-none"
            style={{ ...head, color: C.jade }}
          >
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Glass>
        <Glass className="p-4" style={{ border: `1px solid ${C.warn}33` }}>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: C.warn }}>
            Openstaand
          </p>
          <p
            className="mt-1 text-[26px] font-bold tabular-nums leading-none"
            style={{ ...head, color: C.warn }}
          >
            € {open.toLocaleString("nl-NL")}
          </p>
        </Glass>
      </div>

      <Glass className="overflow-hidden">
        <table className="w-full text-left">
          <caption className="sr-only">Facturen met status en bedrag</caption>
          <thead>
            <tr
              className="text-[10px] uppercase tracking-[0.1em]"
              style={{ color: C.faint, borderBottom: `1px solid ${C.glassLineSoft}` }}
            >
              <th scope="col" className="px-4 py-3 font-bold">
                Nummer
              </th>
              <th scope="col" className="px-4 py-3 font-bold">
                Klant
              </th>
              <th scope="col" className="hidden px-4 py-3 font-bold sm:table-cell">
                Datum
              </th>
              <th scope="col" className="px-4 py-3 text-right font-bold">
                Bedrag
              </th>
              <th scope="col" className="px-4 py-3 text-right font-bold">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const color = tone[f.status] ?? C.faint;
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                  style={{ borderBottom: `1px solid ${C.glassLineSoft}` }}
                >
                  <td
                    className="px-4 py-3 text-[12.5px] font-bold tabular-nums"
                    style={{ color: C.ink }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-semibold">{f.klant}</td>
                  <td
                    className="hidden px-4 py-3 text-[12.5px] tabular-nums sm:table-cell"
                    style={{ color: C.sub }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[14px] font-bold tabular-nums"
                    style={head}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                      style={{ color, background: `${color}1f`, border: `1px solid ${color}44` }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: color }}
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
  );
}
