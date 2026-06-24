"use client";

// Concept 04 — "Glas": dark glassmorphism, digital luxury.
// Translucent chrome (nav, topbar, modals) with backdrop-blur and low-opacity white borders;
// data surfaces stay solid and legible (no blur on text/tables). Elevation communicates
// urgency — the most pressing actions sit "higher" with a stronger glow. Frontend only, mock data.

import { useState } from "react";
import {
  Bell,
  Search,
  Bookmark,
  Check,
  AlertTriangle,
  Clock,
  X,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import {
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  NAV,
  SCREENS,
  type ScreenKey,
  type CredStatus,
} from "./mock";

// --- Glas palette (deep indigo with violet light) ---
const C = {
  bg: "#10131c",
  text: "#eef0f7",
  sub: "#a6abc4",
  faint: "#6f7593",
  accent: "#a78bfa",
  accentDeep: "#7c5cff",
  success: "#34d399",
  warning: "#fbbf24",
  danger: "#f87171",
  // glass surfaces
  glass: "rgba(255,255,255,0.04)",
  glassStrong: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.10)",
  borderSoft: "rgba(255,255,255,0.06)",
} as const;

const sans = { fontFamily: "var(--font-lab-sora)" } as const;
const mono = { fontFamily: "var(--font-lab-mono)" } as const;

const NAV_TO_SCREEN: Partial<Record<(typeof NAV)[number], ScreenKey>> = {
  Dashboard: "dashboard",
  Marktplaats: "marktplaats",
  Reacties: "acties",
  Verificatie: "verificatie",
  Facturen: "facturen",
};

// Atmospheric background: deep base + radial violet glow.
const ATMOSPHERE: React.CSSProperties = {
  background: `radial-gradient(1100px 520px at 18% -10%, rgba(124,92,255,0.22), transparent 60%), radial-gradient(900px 480px at 100% 0%, rgba(52,211,153,0.08), transparent 55%), ${C.bg}`,
};

export function Concept04() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      style={{ ...sans, ...ATMOSPHERE, color: C.text }}
      className="flex min-h-[640px] w-full antialiased [color-scheme:dark]"
    >
      {/* Glass sidebar */}
      <aside
        className="hidden w-[228px] shrink-0 flex-col p-3 md:flex"
        style={{ borderRight: `1px solid ${C.borderSoft}` }}
      >
        <div
          className="flex items-center gap-2 rounded-2xl px-3 py-3 backdrop-blur-xl"
          style={{ background: C.glass, border: `1px solid ${C.border}` }}
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-xl text-[13px] font-bold"
            style={{
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
              color: "#0b0e16",
            }}
            aria-hidden
          >
            Z
          </span>
          <span className="text-[13px] font-semibold tracking-tight">ZorgBemiddeling</span>
        </div>

        <nav className="mt-3 flex flex-1 flex-col gap-1" aria-label="Hoofdnavigatie">
          {NAV.map((item) => {
            const target = NAV_TO_SCREEN[item];
            const active = target !== undefined && target === screen;
            return (
              <button
                key={item}
                type="button"
                disabled={target === undefined}
                aria-current={active ? "page" : undefined}
                onClick={() => target && setScreen(target)}
                style={
                  active
                    ? {
                        background: C.glassStrong,
                        border: `1px solid ${C.border}`,
                        boxShadow: `0 8px 24px -12px ${C.accentDeep}80`,
                      }
                    : { border: "1px solid transparent" }
                }
                className={[
                  "flex items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] tracking-tight transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50",
                  active
                    ? "font-medium text-[#eef0f7] backdrop-blur-md"
                    : "text-[#a6abc4] hover:bg-white/[0.04] hover:text-[#eef0f7] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent",
                ].join(" ")}
              >
                <span>{item}</span>
                {active && (
                  <ChevronRight className="h-3.5 w-3.5" style={{ color: C.accent }} aria-hidden />
                )}
              </button>
            );
          })}
        </nav>

        {/* Elevated urgent card — sits "higher" via glow */}
        <div
          className="mt-3 rounded-2xl p-3 backdrop-blur-xl"
          style={{
            background: C.glassStrong,
            border: `1px solid ${C.warning}40`,
            boxShadow: `0 18px 40px -16px ${C.warning}55`,
          }}
        >
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" style={{ color: C.warning }} aria-hidden />
            <span
              style={{ ...mono, color: C.warning }}
              className="text-[10px] uppercase tracking-[0.2em]"
            >
              VOG verloopt
            </span>
          </div>
          <p className="mt-1.5 text-[12px] leading-snug" style={{ color: C.sub }}>
            Nog{" "}
            <span style={{ ...mono, color: C.text }} className="font-semibold tabular-nums">
              23
            </span>{" "}
            dagen geldig.
          </p>
          <button
            type="button"
            onClick={() => setScreen("acties")}
            className="mt-2 text-[12px] font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50"
            style={{ color: C.warning }}
          >
            Vernieuwen →
          </button>
        </div>
      </aside>

      {/* Right column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Glass top bar */}
        <header
          className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 backdrop-blur-xl"
          style={{ background: "rgba(16,19,28,0.55)", borderBottom: `1px solid ${C.borderSoft}` }}
        >
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] backdrop-blur-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50 sm:max-w-md"
            style={{ background: C.glass, border: `1px solid ${C.border}`, color: C.sub }}
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">Zoek of spring naar…</span>
            <span
              style={{ ...mono, color: C.faint, border: `1px solid ${C.border}` }}
              className="ml-auto hidden shrink-0 rounded-md px-1.5 py-0.5 text-[10px] tabular-nums sm:inline"
            >
              ⌘K
            </span>
          </button>

          <button
            type="button"
            aria-label="Meldingen"
            className="relative rounded-xl p-2 backdrop-blur-md transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50"
            style={{ border: `1px solid ${C.border}`, color: C.sub }}
          >
            <Bell className="h-4 w-4" aria-hidden />
            <span
              className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
              style={{ background: C.accent }}
              aria-hidden
            />
          </button>

          <div className="flex items-center gap-2">
            <span
              style={{ ...mono, background: C.glass, border: `1px solid ${C.border}` }}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-[11px] font-semibold tabular-nums backdrop-blur-md"
              aria-hidden
            >
              {PROFIEL.initialen}
            </span>
            <div className="hidden leading-tight sm:block">
              <div className="text-[12px] font-medium">{PROFIEL.naam}</div>
              <div className="text-[11px]" style={{ color: C.faint }}>
                {PROFIEL.plaats}
              </div>
            </div>
          </div>
        </header>

        {/* Screen tabs (glass) */}
        <div className="px-4 pt-3" role="tablist" aria-label="Schermen">
          <div
            className="flex gap-1 overflow-x-auto rounded-xl p-1 backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ background: C.glass, border: `1px solid ${C.borderSoft}` }}
          >
            {SCREENS.map((s) => {
              const active = s.key === screen;
              return (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-current={active ? "page" : undefined}
                  aria-selected={active}
                  onClick={() => setScreen(s.key)}
                  style={
                    active
                      ? {
                          background: C.glassStrong,
                          border: `1px solid ${C.border}`,
                          color: C.text,
                          boxShadow: `0 6px 18px -10px ${C.accentDeep}90`,
                        }
                      : { border: "1px solid transparent", color: C.sub }
                  }
                  className="shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] tracking-tight transition-all hover:text-[#eef0f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50"
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main */}
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
          {screen === "dashboard" && <DashboardScreen onOpen={() => setScreen("opdracht")} />}
          {screen === "marktplaats" && <MarktplaatsScreen onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && <OpdrachtScreen />}
          {screen === "verificatie" && <VerificatieScreen />}
          {screen === "acties" && <ActiesScreen />}
          {screen === "facturen" && <FacturenScreen />}
        </main>
      </div>
    </div>
  );
}

/* ----------------------------------------------------- shared solid data panel */

function Panel({
  children,
  className,
  glow,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
}) {
  // Data panels stay SOLID (no blur) for legibility; only chrome uses glass.
  return (
    <div
      className={["rounded-2xl", className ?? ""].join(" ")}
      style={{
        background: "rgba(20,24,36,0.7)",
        border: `1px solid ${C.borderSoft}`,
        boxShadow: glow ? `0 22px 50px -20px ${glow}` : undefined,
      }}
    >
      {children}
    </div>
  );
}

const CRED_TOKEN: Record<CredStatus, { color: string; label: string; icon: React.ReactNode }> = {
  VERIFIED: {
    color: C.success,
    label: "Geverifieerd",
    icon: <Check className="h-3.5 w-3.5" aria-hidden />,
  },
  EXPIRING: {
    color: C.warning,
    label: "Verloopt binnenkort",
    icon: <AlertTriangle className="h-3.5 w-3.5" aria-hidden />,
  },
  SUBMITTED: {
    color: C.accent,
    label: "In beoordeling",
    icon: <Clock className="h-3.5 w-3.5" aria-hidden />,
  },
  REJECTED: {
    color: C.danger,
    label: "Afgewezen",
    icon: <X className="h-3.5 w-3.5" aria-hidden />,
  },
};

/* ------------------------------------------------------------------ Dashboard */

function DashboardScreen({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((kpi) => (
          <Panel key={kpi.label} className="p-4">
            <span
              style={{ ...mono, color: C.faint }}
              className="text-[10px] uppercase tracking-[0.14em]"
            >
              {kpi.label}
            </span>
            <div
              style={{ ...mono }}
              className="mt-2 text-2xl font-semibold tabular-nums tracking-tight"
            >
              {kpi.value}
            </div>
            <div
              className="mt-1 flex items-center gap-1 text-[11px]"
              style={{ color: kpi.up ? C.success : C.sub }}
            >
              <ArrowUpRight
                className="h-3 w-3"
                style={{ transform: kpi.up ? undefined : "rotate(90deg)" }}
                aria-hidden
              />
              <span style={mono} className="tabular-nums">
                {kpi.trend}
              </span>
            </div>
          </Panel>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" style={{ color: C.accent }} aria-hidden />
            <h2 className="text-[14px] font-semibold tracking-tight">Aanbevolen opdrachten</h2>
          </div>
          <span
            style={{ ...mono, color: C.faint }}
            className="text-[10px] uppercase tracking-widest"
          >
            top 3
          </span>
        </div>
        <Panel className="overflow-hidden">
          {OPDRACHTEN.slice(0, 3).map((o, i) => (
            <button
              key={o.id}
              type="button"
              onClick={onOpen}
              className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#a78bfa]/50"
              style={i > 0 ? { borderTop: `1px solid ${C.borderSoft}` } : undefined}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium tracking-tight">{o.titel}</div>
                <div
                  style={{ ...mono, color: C.faint }}
                  className="mt-0.5 truncate text-[11px] tabular-nums"
                >
                  {o.opdrachtgever} · {o.plaats} · {o.tarief}
                </div>
              </div>
              <MatchOrb value={o.match} />
              <ArrowUpRight className="h-4 w-4 shrink-0" style={{ color: C.faint }} aria-hidden />
            </button>
          ))}
        </Panel>
      </section>

      <section>
        <h2 className="mb-3 text-[14px] font-semibold tracking-tight">Acties</h2>
        <div className="space-y-2">
          {ACTIES.map((a) => {
            const warn = a.urgentie === "warning";
            const color = warn ? C.warning : C.accent;
            return (
              <Panel
                key={a.titel}
                glow={warn ? `${C.warning}40` : undefined}
                className="flex items-start gap-3 p-3"
              >
                <span
                  aria-hidden
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${color}1f`, color }}
                >
                  {warn ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium tracking-tight">{a.titel}</div>
                  <p className="mt-0.5 text-[12px] leading-snug" style={{ color: C.sub }}>
                    {a.detail}
                  </p>
                </div>
              </Panel>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function MatchOrb({ value }: { value: number }) {
  const color = value >= 90 ? C.success : value >= 82 ? C.accent : C.warning;
  return (
    <span
      style={{
        ...mono,
        color,
        background: `${color}1a`,
        border: `1px solid ${color}40`,
        boxShadow: `0 6px 16px -8px ${color}80`,
      }}
      className="shrink-0 rounded-full px-2.5 py-1 text-[13px] font-semibold tabular-nums"
    >
      {value}%
    </span>
  );
}

/* ----------------------------------------------------------------- Marktplaats */

function MarktplaatsScreen({ onOpen }: { onOpen: () => void }) {
  const filters = ["Alle", "≥85% match", "Utrecht", "Avond"];
  const [active, setActive] = useState(0);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f, i) => (
          <button
            key={f}
            type="button"
            aria-pressed={i === active}
            onClick={() => setActive(i)}
            style={
              i === active
                ? {
                    background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
                    color: "#0b0e16",
                    boxShadow: `0 8px 22px -10px ${C.accentDeep}aa`,
                  }
                : { background: C.glass, border: `1px solid ${C.border}`, color: C.sub }
            }
            className="rounded-full px-3.5 py-1.5 text-[12px] font-medium backdrop-blur-md transition-all hover:text-[#eef0f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50"
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {OPDRACHTEN.map((o) => (
          <Panel key={o.id} className="overflow-hidden">
            <button
              type="button"
              onClick={onOpen}
              className="flex w-full flex-col gap-3 p-4 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#a78bfa]/50 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-medium tracking-tight">{o.titel}</div>
                <div
                  style={{ ...mono, color: C.faint }}
                  className="mt-0.5 truncate text-[11px] tabular-nums"
                >
                  {o.opdrachtgever} · {o.plaats} · {o.uren} · {o.tarief}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        ...mono,
                        background: C.glass,
                        border: `1px solid ${C.border}`,
                        color: C.sub,
                      }}
                      className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide backdrop-blur-md"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="self-start sm:self-center">
                <MatchOrb value={o.match} />
              </div>
            </button>
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- Opdracht */

function OpdrachtScreen() {
  const o = OPDRACHTEN[0];
  if (!o) return null;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Panel className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span
            style={{ ...mono, color: C.faint }}
            className="text-[10px] uppercase tracking-widest"
          >
            {o.id}
          </span>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{o.titel}</h2>
          <div style={{ ...mono, color: C.sub }} className="mt-1 text-[12px] tabular-nums">
            {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren} · {o.start}
          </div>
        </div>
        <div
          className="shrink-0 rounded-2xl px-5 py-4 text-center"
          style={{
            background: `${C.success}14`,
            border: `1px solid ${C.success}40`,
            boxShadow: `0 16px 40px -18px ${C.success}80`,
          }}
        >
          <span
            style={{ ...mono, color: C.faint }}
            className="text-[10px] uppercase tracking-widest"
          >
            Match-score
          </span>
          <div style={{ ...mono, color: C.success }} className="text-4xl font-bold tabular-nums">
            {o.match}%
          </div>
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        <ReasonPanel
          title="Waarom dit past"
          color={C.success}
          icon={<Check className="h-3.5 w-3.5" aria-hidden />}
          items={o.redenen.plus}
        />
        <ReasonPanel
          title="Let op"
          color={C.warning}
          icon={<AlertTriangle className="h-3.5 w-3.5" aria-hidden />}
          items={o.redenen.min}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#10131c]"
          style={{
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
            color: "#0b0e16",
            boxShadow: `0 12px 30px -12px ${C.accentDeep}cc`,
          }}
        >
          Reageer op opdracht
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-medium backdrop-blur-md transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50"
          style={{ background: C.glass, border: `1px solid ${C.border}`, color: C.sub }}
        >
          <Bookmark className="h-3.5 w-3.5" aria-hidden />
          Bewaar
        </button>
      </div>
    </div>
  );
}

function ReasonPanel({
  title,
  color,
  icon,
  items,
}: {
  title: string;
  color: string;
  icon: React.ReactNode;
  items: string[];
}) {
  return (
    <Panel className="overflow-hidden">
      <div
        className="flex items-center gap-1.5 px-4 py-2.5"
        style={{ borderBottom: `1px solid ${C.borderSoft}` }}
      >
        <span style={{ color }}>{icon}</span>
        <span style={{ ...mono, color: C.faint }} className="text-[10px] uppercase tracking-widest">
          {title}
        </span>
      </div>
      <ul className="space-y-2.5 p-4">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.sub }}>
            <span className="mt-0.5 shrink-0" style={{ color }}>
              {icon}
            </span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ----------------------------------------------------------------- Verificatie */

function VerificatieScreen() {
  return (
    <div className="space-y-5">
      <Panel glow={`${C.success}33`} className="flex items-center gap-3 p-4">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: `${C.success}1f`, color: C.success }}
          aria-hidden
        >
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold tracking-tight">Vertrouwensniveau: Hoog</div>
          <div className="text-[12px]" style={{ color: C.sub }}>
            Al je kerncredentials zijn geverifieerd.
          </div>
        </div>
        <span
          style={{ ...mono, color: C.success }}
          className="ml-auto hidden text-[11px] uppercase tracking-widest sm:inline"
        >
          {PROFIEL.trust}
        </span>
      </Panel>

      <div className="space-y-3">
        {CREDENTIALS.map((c) => {
          const t = CRED_TOKEN[c.status];
          return (
            <Panel
              key={c.naam}
              glow={c.status === "EXPIRING" ? `${C.warning}33` : undefined}
              className="flex items-center gap-3 p-4"
            >
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${t.color}1f`, color: t.color }}
              >
                {t.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium tracking-tight">{c.naam}</div>
                <div className="truncate text-[11.5px]" style={{ color: C.faint }}>
                  {c.detail}
                </div>
              </div>
              <span
                style={{
                  ...mono,
                  color: t.color,
                  background: `${t.color}1a`,
                  border: `1px solid ${t.color}40`,
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
              </span>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- Acties */

function ActiesScreen() {
  const ordered = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-3">
      {ordered.map((a) => {
        const warn = a.urgentie === "warning";
        const color = warn ? C.warning : C.accent;
        return (
          <Panel
            key={a.titel}
            glow={warn ? `${C.warning}50` : `${C.accent}26`}
            className="flex items-start gap-3 p-4"
          >
            <span
              aria-hidden
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `${color}1f`, color }}
            >
              {warn ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium tracking-tight">{a.titel}</div>
              <p className="mt-0.5 text-[12px] leading-snug" style={{ color: C.sub }}>
                {a.detail}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-xl px-3 py-1.5 text-[12px] font-medium backdrop-blur-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50"
              style={{ color, background: `${color}14`, border: `1px solid ${color}40` }}
            >
              {a.cta}
            </button>
          </Panel>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------- Facturen */

const FACTUUR_TOKEN: Record<string, { color: string }> = {
  Betaald: { color: C.success },
  Openstaand: { color: C.warning },
  Concept: { color: C.faint },
};

function FacturenScreen() {
  return (
    <Panel className="overflow-hidden">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
            <Th>Nr</Th>
            <Th>Klant</Th>
            <Th className="hidden sm:table-cell">Datum</Th>
            <Th className="text-right">Bedrag</Th>
            <Th className="text-right">Status</Th>
          </tr>
        </thead>
        <tbody>
          {FACTUREN.map((f, i) => {
            const token = FACTUUR_TOKEN[f.status] ?? { color: C.faint };
            return (
              <tr key={f.nr} style={i > 0 ? { borderTop: `1px solid ${C.borderSoft}` } : undefined}>
                <td className="px-4 py-3">
                  <span style={{ ...mono, color: C.text }} className="text-[12px] tabular-nums">
                    {f.nr}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px]">{f.klant}</td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span style={{ ...mono, color: C.faint }} className="text-[12px] tabular-nums">
                    {f.datum}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span style={{ ...mono }} className="text-[13px] font-medium tabular-nums">
                    {f.bedrag}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    style={{
                      ...mono,
                      color: token.color,
                      background: `${token.color}1a`,
                      border: `1px solid ${token.color}40`,
                    }}
                    className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                  >
                    {f.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      style={{ ...mono, color: C.faint }}
      className={[
        "px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em]",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </th>
  );
}
