"use client";

// Concept 16 — "Aurora" · Levendig mesh-verloop & gloed (DARK, premium-consumer).
// Een diep-donker canvas waarover zachte aurora-blobs drijven — magenta/violet met cyaan/blauw —
// als sfeer achter strakke frosted-glass kaarten die de data helder en scanbaar houden.
// Kleur schept emotie, inhoud blijft rustig. Geen raster, geen cyber; zacht, kleurrijk, diep.
// Palet: canvas #0f1020, fg #f2ecff, accent #d946ef (magenta) + violet + cyaan/blauw.
// Fonts: Sora (display) + Inter (body).

import { useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Bell,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  MapPin,
  Plus,
  Loader2,
  Send,
  Star,
  TrendingUp,
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

const C = {
  canvas: "#0f1020",
  canvasDeep: "#0a0a18",
  ink: "#f2ecff",
  inkSoft: "#cbc3e6",
  muted: "#948bb4",
  faint: "#6a6390",
  magenta: "#d946ef",
  violet: "#a78bfa",
  cyan: "#22d3ee",
  blue: "#60a5fa",
  green: "#34e5b0",
  amber: "#fbbf24",
  red: "#fb7185",
  glass: "rgba(28,24,54,0.55)",
  glassHi: "rgba(40,34,74,0.72)",
  glassAlt: "rgba(22,18,44,0.6)",
  border: "rgba(180,150,255,0.14)",
  borderHi: "rgba(217,70,239,0.4)",
};

const display = { fontFamily: "var(--font-lab-sora)" };
const body = { fontFamily: "var(--font-lab-inter)" };

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

type Tone = { label: string; fg: string; glow: string; bg: string };

function statusStyle(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        fg: C.green,
        glow: "rgba(52,229,176,0.5)",
        bg: "rgba(52,229,176,0.1)",
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        fg: C.cyan,
        glow: "rgba(34,211,238,0.5)",
        bg: "rgba(34,211,238,0.1)",
      };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        fg: C.amber,
        glow: "rgba(251,191,36,0.5)",
        bg: "rgba(251,191,36,0.1)",
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        fg: C.red,
        glow: "rgba(251,113,133,0.5)",
        bg: "rgba(251,113,133,0.1)",
      };
  }
}

/* ---------- Achtergrond: aurora-mesh met zachte drijvende blobs ---------- */
function AuroraBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(1100px 620px at 12% -6%, rgba(217,70,239,0.28), transparent 60%),
            radial-gradient(900px 560px at 92% 6%, rgba(96,165,250,0.22), transparent 62%),
            radial-gradient(820px 620px at 74% 108%, rgba(34,211,238,0.18), transparent 60%),
            radial-gradient(760px 520px at 8% 96%, rgba(167,139,250,0.2), transparent 60%)`,
        }}
      />
      <div
        className="absolute -left-24 top-[-10%] h-[46vh] w-[46vh] rounded-full opacity-60 motion-safe:animate-[aurora_18s_ease-in-out_infinite]"
        style={{ background: C.magenta, filter: "blur(90px)", mixBlendMode: "screen" }}
      />
      <div
        className="absolute right-[-8%] top-[8%] h-[40vh] w-[40vh] rounded-full opacity-50 motion-safe:animate-[aurora_22s_ease-in-out_infinite_reverse]"
        style={{ background: C.blue, filter: "blur(96px)", mixBlendMode: "screen" }}
      />
      <div
        className="absolute bottom-[-14%] left-[38%] h-[42vh] w-[42vh] rounded-full opacity-40 motion-safe:animate-[aurora_26s_ease-in-out_infinite]"
        style={{ background: C.cyan, filter: "blur(100px)", mixBlendMode: "screen" }}
      />
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          background: `radial-gradient(120% 90% at 50% 0%, transparent 40%, ${C.canvasDeep} 100%)`,
        }}
      />
      <style>{`@keyframes aurora {
        0%,100% { transform: translate3d(0,0,0) scale(1); }
        33% { transform: translate3d(6%,4%,0) scale(1.08); }
        66% { transform: translate3d(-5%,-3%,0) scale(0.96); }
      }`}</style>
    </div>
  );
}

function Glass({
  children,
  className = "",
  glow,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
  as?: "div" | "section";
}) {
  const Tag = as;
  return (
    <Tag
      className={`rounded-2xl ${className}`}
      style={{
        background: C.glass,
        border: `1px solid ${C.border}`,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: glow
          ? `0 1px 0 rgba(255,255,255,0.04) inset, 0 18px 50px -30px ${glow}`
          : "0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 44px -34px rgba(0,0,0,0.8)",
      }}
    >
      {children}
    </Tag>
  );
}

function Kicker({ children, color = C.magenta }: { children: React.ReactNode; color?: string }) {
  return (
    <p
      className="text-[10.5px] font-semibold uppercase tracking-[0.24em]"
      style={{ color, ...body }}
    >
      {children}
    </p>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 96;
  const h = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 5) - 2.5;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const gid = `au${color.replace("#", "")}`;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}

function MatchOrb({ value, color = C.magenta }: { value: number; color?: string }) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  return (
    <span className="relative inline-flex h-9 w-9 items-center justify-center" aria-hidden="true">
      <svg width={36} height={36} viewBox="0 0 36 36" className="-rotate-90">
        <circle cx={18} cy={18} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
        <circle
          cx={18}
          cy={18}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          style={{ filter: `drop-shadow(0 0 3px ${color})` }}
        />
      </svg>
      <span className="absolute text-[10px] font-semibold tabular-nums" style={{ color, ...body }}>
        {value}
      </span>
    </span>
  );
}

export function Concept16() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, background: C.canvas, color: C.ink }}
    >
      <AuroraBackdrop />

      <div className="relative flex min-h-[680px]">
        {/* Glass rail */}
        <aside className="hidden w-[236px] shrink-0 flex-col p-4 md:flex">
          <div className="flex items-center gap-3 px-2 pb-7 pt-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[15px] font-bold"
              style={{
                color: "#fff",
                background: `linear-gradient(135deg, ${C.magenta}, ${C.blue})`,
                boxShadow: `0 8px 24px -8px ${C.magenta}`,
                ...display,
              }}
            >
              Z
            </div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold tracking-tight" style={display}>
                Aurora
              </div>
              <div className="text-[10.5px]" style={{ color: C.faint }}>
                ZZP Platform
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d946ef]/70"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on
                      ? "linear-gradient(100deg, rgba(217,70,239,0.2), rgba(96,165,250,0.12))"
                      : "transparent",
                    border: `1px solid ${on ? C.borderHi : "transparent"}`,
                    boxShadow: on ? `0 12px 30px -20px ${C.magenta}` : "none",
                  }}
                >
                  <Icon
                    size={17}
                    aria-hidden="true"
                    className="transition-colors"
                    style={{ color: on ? C.magenta : C.faint }}
                  />
                  <span className="flex-1 font-medium">{s.label}</span>
                  {on && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.magenta, boxShadow: `0 0 8px ${C.magenta}` }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <Glass className="p-3.5" glow="rgba(167,139,250,0.5)">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold"
                  style={{
                    color: "#fff",
                    background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})`,
                    ...display,
                  }}
                >
                  {PROFIEL.initialen}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</div>
                  <div className="flex items-center gap-1 text-[11px]" style={{ color: C.green }}>
                    <Star size={10} aria-hidden="true" /> {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </Glass>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header className="flex h-16 shrink-0 items-center gap-3 px-5 sm:px-7">
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-semibold tracking-tight" style={display}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </h2>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="hidden items-center gap-2.5 rounded-full px-3.5 py-2 text-[12.5px] transition-all hover:border-[rgba(217,70,239,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d946ef]/70 sm:flex"
                style={{ border: `1px solid ${C.border}`, color: C.muted, background: C.glassAlt }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoek opdrachten…</span>
              </button>
              <button
                className="relative rounded-full p-2.5 transition-all hover:border-[rgba(217,70,239,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d946ef]/70"
                style={{
                  border: `1px solid ${C.border}`,
                  color: C.inkSoft,
                  background: C.glassAlt,
                }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.magenta, boxShadow: `0 0 8px ${C.magenta}` }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div className="flex gap-1.5 overflow-x-auto px-4 pb-1 md:hidden">
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d946ef]/70"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on
                      ? "linear-gradient(100deg, rgba(217,70,239,0.24), rgba(96,165,250,0.16))"
                      : "transparent",
                    border: `1px solid ${on ? C.borderHi : C.border}`,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const kpiColors = [C.magenta, C.blue, C.green, C.amber];
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Hero */}
      <Glass className="relative overflow-hidden p-7" glow="rgba(217,70,239,0.6)">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-50"
          style={{ background: C.magenta, filter: "blur(70px)" }}
          aria-hidden="true"
        />
        <div className="relative">
          <Kicker>Vandaag · {PROFIEL.plaats}</Kicker>
          <h1
            className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-tight"
            style={display}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-2.5 max-w-lg text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Drie matches boven 80%, je vertrouwensniveau is hoog. Eén credential vraagt binnenkort
            aandacht — verder loopt alles op rolletjes.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5 text-[12px]">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium"
              style={{
                color: C.green,
                background: "rgba(52,229,176,0.12)",
                border: `1px solid rgba(52,229,176,0.28)`,
              }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> 2 credentials geverifieerd
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium"
              style={{
                color: C.amber,
                background: "rgba(251,191,36,0.12)",
                border: `1px solid rgba(251,191,36,0.28)`,
              }}
            >
              <Clock size={13} aria-hidden="true" /> VOG verloopt over 23 dagen
            </span>
          </div>
        </div>
      </Glass>

      {/* KPI's */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const col = kpiColors[i % kpiColors.length] ?? C.magenta;
          return (
            <Glass
              key={k.label}
              className="p-4 transition-transform hover:-translate-y-0.5"
              glow={`${col}55`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium" style={{ color: C.muted }}>
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.green : C.amber }}
                >
                  {k.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
              </div>
              <p
                className="mt-2.5 text-[26px] font-semibold tabular-nums leading-none tracking-tight"
                style={display}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <Sparkline data={k.spark} color={col} />
              </div>
            </Glass>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2
              className="flex items-center gap-2 text-[14px] font-semibold tracking-tight"
              style={display}
            >
              <Sparkles size={15} aria-hidden="true" style={{ color: C.magenta }} /> Beste matches
            </h2>
            <span className="text-[11.5px]" style={{ color: C.faint }}>
              Verklaarbaar gesorteerd
            </span>
          </div>
          <Glass className="overflow-hidden">
            <div className="divide-y" style={{ borderColor: C.border }}>
              {OPDRACHTEN.map((o, i) => {
                const col = [C.magenta, C.blue, C.violet][i % 3] ?? C.magenta;
                return (
                  <button
                    key={o.id}
                    onClick={onOpen}
                    className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[rgba(217,70,239,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d946ef]/70"
                  >
                    <MatchOrb value={o.match} color={col} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium">{o.titel}</p>
                      <p
                        className="mt-0.5 flex items-center gap-1.5 truncate text-[12px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <span
                      className="hidden text-[12.5px] font-medium tabular-nums sm:inline"
                      style={{ color: C.inkSoft }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
                  </button>
                );
              })}
            </div>
          </Glass>
        </div>

        {/* Credentials */}
        <div>
          <h2
            className="mb-3 flex items-center gap-2 text-[14px] font-semibold tracking-tight"
            style={display}
          >
            <ShieldCheck size={15} aria-hidden="true" style={{ color: C.cyan }} /> Credentials
          </h2>
          <Glass className="p-4">
            <div className="space-y-3">
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div key={c.naam} className="flex items-start gap-3">
                    <span
                      className="relative mt-1 inline-flex h-2.5 w-2.5 shrink-0"
                      aria-hidden="true"
                    >
                      {c.status === "SUBMITTED" && (
                        <span
                          className="absolute inset-0 rounded-full motion-safe:animate-ping"
                          style={{ background: st.fg, opacity: 0.6 }}
                        />
                      )}
                      <span
                        className="relative h-2.5 w-2.5 rounded-full"
                        style={{ background: st.fg, boxShadow: `0 0 8px ${st.glow}` }}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium">{c.naam}</p>
                      <p className="truncate text-[11px]" style={{ color: C.muted }}>
                        {c.detail}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: st.fg }}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Glass>
        </div>
      </div>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Kicker color={C.blue}>Marktplaats</Kicker>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight" style={display}>
          Open opdrachten
        </h1>
      </div>

      <Glass className="flex items-center gap-3 px-4 py-2.5 transition-colors focus-within:border-[rgba(217,70,239,0.4)]">
        <Search size={16} aria-hidden="true" style={{ color: C.magenta }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#6a6390]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Glass>

      {filtered.length === 0 ? (
        <Glass className="px-6 py-16 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(217,70,239,0.1)", border: `1px solid ${C.borderHi}` }}
            aria-hidden="true"
          >
            <Search size={22} style={{ color: C.magenta }} />
          </div>
          <p className="mt-4 text-[15px] font-semibold" style={display}>
            Geen opdrachten gevonden
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen resultaat voor &quot;{q}&quot;. Verbreed je zoekopdracht of pas je beschikbaarheid
            aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d946ef]/70"
            style={{
              color: "#fff",
              background: `linear-gradient(135deg, ${C.magenta}, ${C.blue})`,
            }}
          >
            Zoekopdracht wissen
          </button>
        </Glass>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o, i) => {
            const col = [C.magenta, C.blue, C.violet][i % 3] ?? C.magenta;
            return (
              <button
                key={o.id}
                onClick={onOpen}
                className="group text-left transition-transform hover:-translate-y-1 focus-visible:outline-none"
              >
                <Glass
                  className="relative h-full overflow-hidden p-5 transition-colors group-hover:border-[rgba(217,70,239,0.4)] group-focus-visible:ring-2 group-focus-visible:ring-[#d946ef]/70"
                  glow={`${col}55`}
                >
                  <div
                    className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full opacity-40 transition-opacity group-hover:opacity-70"
                    style={{ background: col, filter: "blur(48px)" }}
                    aria-hidden="true"
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <span className="text-[10.5px] tracking-wide" style={{ color: C.faint }}>
                      {o.id}
                    </span>
                    <MatchOrb value={o.match} color={col} />
                  </div>
                  <p
                    className="relative mt-2 text-[15.5px] font-semibold leading-snug"
                    style={display}
                  >
                    {o.titel}
                  </p>
                  <p
                    className="relative mt-1.5 flex items-center gap-1.5 text-[12px]"
                    style={{ color: C.muted }}
                  >
                    <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                  </p>
                  <div className="relative mt-4 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full px-2.5 py-0.5 text-[10.5px]"
                        style={{
                          color: C.inkSoft,
                          background: "rgba(255,255,255,0.05)",
                          border: `1px solid ${C.border}`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div
                    className="relative mt-4 flex items-center justify-between border-t pt-3.5 text-[12.5px]"
                    style={{ borderColor: C.border }}
                  >
                    <span className="font-semibold tabular-nums" style={{ color: C.ink }}>
                      {o.tarief}
                    </span>
                    <span className="tabular-nums" style={{ color: C.muted }}>
                      {o.uren}
                    </span>
                  </div>
                </Glass>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 900);
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Glass className="relative overflow-hidden p-7" glow="rgba(217,70,239,0.6)">
        <div
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full opacity-50"
          style={{ background: C.magenta, filter: "blur(64px)" }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Kicker>{opdracht.id}</Kicker>
            <h1
              className="mt-2 text-[26px] font-semibold leading-tight tracking-tight"
              style={display}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-[13px]" style={{ color: C.inkSoft }}>
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d946ef]/70 disabled:opacity-90"
            style={{
              color: "#fff",
              background:
                state === "sent"
                  ? `linear-gradient(135deg, ${C.green}, ${C.cyan})`
                  : `linear-gradient(135deg, ${C.magenta}, ${C.blue})`,
              boxShadow: `0 14px 34px -14px ${C.magenta}`,
            }}
          >
            {state === "sending" && (
              <Loader2 size={15} aria-hidden="true" className="animate-spin" />
            )}
            {state === "sent" && <Check size={15} aria-hidden="true" />}
            {state === "idle" && <Send size={14} aria-hidden="true" />}
            {state === "idle"
              ? "Reageer op opdracht"
              : state === "sending"
                ? "Versturen…"
                : "Reactie verstuurd"}
          </button>
        </div>
      </Glass>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, c: C.magenta },
          { l: "Omvang", v: opdracht.uren, c: C.blue },
          { l: "Start", v: opdracht.start, c: C.violet },
          { l: "Match", v: `${opdracht.match}%`, c: C.green },
        ].map((m) => (
          <Glass key={m.l} className="p-4">
            <p
              className="text-[10.5px] font-medium uppercase tracking-[0.12em]"
              style={{ color: C.muted }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[16px] font-semibold tabular-nums tracking-tight"
              style={{ color: m.c, ...display }}
            >
              {m.v}
            </p>
          </Glass>
        ))}
      </div>

      <Glass className="p-6">
        <h3 className="flex items-center gap-2 text-[14.5px] font-semibold" style={display}>
          <Sparkles size={15} aria-hidden="true" style={{ color: C.magenta }} /> Waarom deze match
        </h3>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je geverifieerde profiel.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.green }}
            >
              Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(52,229,176,0.14)" }}
                  >
                    <Check size={12} aria-hidden="true" style={{ color: C.green }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.amber }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(251,191,36,0.14)" }}
                  >
                    <Minus size={12} aria-hidden="true" style={{ color: C.amber }} />
                  </span>
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

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const attention = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker color={C.cyan}>Vertrouwen</Kicker>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight" style={display}>
          Verificatie
        </h1>
      </div>

      <Glass
        className="relative flex flex-col gap-5 overflow-hidden p-6 sm:flex-row sm:items-center"
        glow="rgba(52,229,176,0.5)"
      >
        <div
          className="pointer-events-none absolute -left-10 -top-12 h-40 w-40 rounded-full opacity-40"
          style={{ background: C.green, filter: "blur(56px)" }}
          aria-hidden="true"
        />
        <div
          className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: "rgba(52,229,176,0.12)", border: `1px solid rgba(52,229,176,0.32)` }}
        >
          <ShieldCheck size={30} aria-hidden="true" style={{ color: C.green }} />
        </div>
        <div className="relative flex-1">
          <p className="text-[18px] font-semibold" style={display}>
            {PROFIEL.trust}
          </p>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
            <span className="font-semibold tabular-nums">{verified}</span> van{" "}
            <span className="font-semibold tabular-nums">{CREDENTIALS.length}</span> credentials
            geverifieerd · <span style={{ color: C.amber }}>{attention} vraagt actie</span>
          </p>
        </div>
        <div className="relative flex items-end gap-1.5" aria-hidden="true">
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            return (
              <span
                key={c.naam}
                className="w-2.5 rounded-full"
                style={{
                  height: c.status === "VERIFIED" ? 40 : 22,
                  background: st.fg,
                  boxShadow: `0 0 10px ${st.glow}`,
                }}
              />
            );
          })}
        </div>
      </Glass>

      <Glass className="overflow-hidden">
        <div className="divide-y" style={{ borderColor: C.border }}>
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            const Icon =
              c.status === "VERIFIED" ? Check : c.status === "SUBMITTED" ? Clock : AlertTriangle;
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[rgba(255,255,255,0.03)]"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: st.bg, border: `1px solid ${st.fg}44` }}
                >
                  {c.status === "SUBMITTED" ? (
                    <Loader2
                      size={17}
                      aria-hidden="true"
                      className="motion-safe:animate-spin"
                      style={{ color: st.fg }}
                    />
                  ) : (
                    <Icon size={17} aria-hidden="true" style={{ color: st.fg }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium">{c.naam}</p>
                  <p className="text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
                  style={{ color: st.fg, background: st.bg, border: `1px solid ${st.fg}33` }}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </Glass>
    </div>
  );
}

function Acties() {
  const tone: Record<
    "warning" | "info",
    { fg: string; glow: string; bg: string; Icon: LucideIcon }
  > = {
    warning: {
      fg: C.amber,
      glow: "rgba(251,191,36,0.5)",
      bg: "rgba(251,191,36,0.1)",
      Icon: AlertTriangle,
    },
    info: {
      fg: C.blue,
      glow: "rgba(96,165,250,0.5)",
      bg: "rgba(96,165,250,0.1)",
      Icon: TrendingUp,
    },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Kicker color={C.violet}>Aandacht</Kicker>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight" style={display}>
          Volgende acties
        </h1>
        <p className="mt-1.5 text-[13px]" style={{ color: C.muted }}>
          Wat nu telt — op volgorde van urgentie.
        </p>
      </div>
      <div className="space-y-3">
        {ACTIES.map((a) => {
          const t = tone[a.urgentie];
          return (
            <Glass
              key={a.titel}
              className="flex items-start gap-4 p-5 transition-transform hover:-translate-y-0.5"
              glow={t.glow}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: t.bg, border: `1px solid ${t.fg}44` }}
              >
                <t.Icon size={19} aria-hidden="true" style={{ color: t.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d946ef]/70"
                style={{ color: t.fg, background: t.bg, border: `1px solid ${t.fg}44` }}
              >
                {a.cta}
              </button>
            </Glass>
          );
        })}
      </div>
    </div>
  );
}

function Facturen() {
  const statusTone: Record<string, string> = {
    Betaald: C.green,
    Openstaand: C.amber,
    Concept: C.muted,
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Kicker color={C.green}>Omzet</Kicker>
          <h1
            className="mt-2 text-[26px] font-semibold leading-tight tracking-tight"
            style={display}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d946ef]/70"
          style={{
            color: "#fff",
            background: `linear-gradient(135deg, ${C.magenta}, ${C.blue})`,
            boxShadow: `0 12px 30px -14px ${C.magenta}`,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Glass className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.faint, borderBottom: `1px solid ${C.border}` }}
              >
                <th className="px-5 py-3 font-semibold">Nummer</th>
                <th className="px-5 py-3 font-semibold">Klant</th>
                <th className="hidden px-5 py-3 font-semibold sm:table-cell">Datum</th>
                <th className="px-5 py-3 text-right font-semibold">Bedrag</th>
                <th className="px-5 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[rgba(255,255,255,0.03)]"
                  style={{ borderBottom: `1px solid ${C.border}` }}
                >
                  <td
                    className="px-5 py-3.5 text-[12.5px] tabular-nums"
                    style={{ color: C.inkSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-5 py-3.5 text-[13px]">{f.klant}</td>
                  <td
                    className="hidden px-5 py-3.5 text-[12.5px] tabular-nums sm:table-cell"
                    style={{ color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-5 py-3.5 text-right text-[13px] font-semibold tabular-nums">
                    {f.bedrag}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{
                        color: statusTone[f.status] ?? C.muted,
                        background: `${statusTone[f.status] ?? C.muted}1f`,
                        border: `1px solid ${statusTone[f.status] ?? C.muted}33`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: statusTone[f.status] ?? C.muted }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Glass>
    </div>
  );
}
