"use client";

// Concept — "Spectraal": premium spatial dark. Bijna-zwart canvas met gelaagde elevatie-vlakken
// voor diepte, lichtgevend violet accent met subtiele glow. Glas alleen op de chrome (topbar,
// sidebar, ⌘K-balk); data blijft solide en leesbaar. Elevatie = urgentie.

import { useState } from "react";
import {
  Command,
  Search,
  Bell,
  Bookmark,
  Check,
  Clock,
  AlertTriangle,
  X,
  ArrowUpRight,
  ShieldCheck,
  LayoutDashboard,
  Store,
  FileText,
  BadgeCheck,
  Zap,
  Receipt,
  ChevronRight,
} from "lucide-react";
import {
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  SCREENS,
  type ScreenKey,
  type CredStatus,
} from "./mock";

const sans = { fontFamily: "var(--font-lab-geist)" } as const;
const mono = { fontFamily: "var(--font-lab-geist-mono)" } as const;

const VIOLET = "#a78bfa";
const GLOW = "0 0 0 1px rgba(167,139,250,0.18), 0 14px 40px -12px rgba(167,139,250,0.35)";

const NAV_ICON: Record<ScreenKey, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: FileText,
  verificatie: BadgeCheck,
  acties: Zap,
  facturen: Receipt,
  documenten: FileText,
  berichten: FileText,
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={mono}
      className="text-[10px] uppercase tabular-nums tracking-[0.18em] text-white/40"
    >
      {children}
    </span>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const w = 80;
  const h = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * h;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden preserveAspectRatio="none">
      <polygon points={area} fill="rgba(167,139,250,0.12)" />
      <polyline
        points={line}
        fill="none"
        stroke={VIOLET}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function Concept02() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      style={{ ...sans, backgroundColor: "#0b0b10", color: "#e8e8ef" }}
      className="relative flex min-h-[640px] w-full overflow-hidden antialiased [color-scheme:dark]"
    >
      {/* Ambient radial wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        style={{
          background:
            "radial-gradient(60% 120% at 50% -10%, rgba(167,139,250,0.16), transparent 70%)",
        }}
      />

      {/* Sidebar (glass chrome) */}
      <aside className="relative z-10 hidden w-[230px] shrink-0 flex-col border-r border-white/10 bg-[#14141c]/70 backdrop-blur-xl md:flex">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-4">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold text-[#0b0b10]"
            style={{ backgroundColor: VIOLET, boxShadow: "0 0 18px -2px rgba(167,139,250,0.55)" }}
            aria-hidden
          >
            Z
          </span>
          <span className="text-[13px] font-medium tracking-tight">ZorgBemiddeling</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const Icon = NAV_ICON[s.key];
            const active = s.key === screen;
            return (
              <button
                key={s.key}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => setScreen(s.key)}
                className={[
                  "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50",
                  active
                    ? "bg-white/[0.06] font-medium text-white"
                    : "text-white/55 hover:bg-white/[0.04] hover:text-white",
                ].join(" ")}
              >
                <Icon
                  className="h-4 w-4 shrink-0 transition-colors"
                  style={active ? { color: VIOLET } : undefined}
                  aria-hidden
                />
                <span className="flex-1">{s.label}</span>
                {active && (
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: VIOLET, boxShadow: "0 0 8px rgba(167,139,250,0.8)" }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] px-3 py-2.5">
            <span
              style={mono}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-[11px] tabular-nums"
              aria-hidden
            >
              {PROFIEL.initialen}
            </span>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[12px] font-medium">{PROFIEL.naam}</div>
              <div className="flex items-center gap-1 text-[11px] text-white/45">
                <ShieldCheck className="h-3 w-3" style={{ color: VIOLET }} aria-hidden />
                {PROFIEL.trust}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Right column */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* Topbar (glass) */}
        <header className="flex items-center gap-3 border-b border-white/10 bg-[#14141c]/60 px-4 py-3 backdrop-blur-xl">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-[13px] text-white/50 transition-colors hover:border-white/20 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50 sm:max-w-md"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">Zoek opdrachten, documenten…</span>
            <kbd
              style={mono}
              className="ml-auto hidden shrink-0 items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] tabular-nums text-white/50 sm:inline-flex"
            >
              <Command className="h-3 w-3" aria-hidden />K
            </kbd>
          </button>

          <button
            type="button"
            aria-label="Meldingen"
            className="relative rounded-lg p-2 text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50"
          >
            <Bell className="h-4 w-4" aria-hidden />
            <span
              className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: VIOLET, boxShadow: "0 0 6px rgba(167,139,250,0.9)" }}
              aria-hidden
            />
          </button>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
          {screen === "dashboard" && <DashboardScreen onOpen={() => setScreen("opdracht")} />}
          {screen === "marktplaats" && <MarktplaatsScreen onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && <OpdrachtScreen onBack={() => setScreen("marktplaats")} />}
          {screen === "verificatie" && <VerificatieScreen />}
          {screen === "acties" && <ActiesScreen />}
          {screen === "facturen" && <FacturenScreen />}
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Dashboard */

function DashboardScreen({ onOpen }: { onOpen: () => void }) {
  const top = ACTIES[0];
  return (
    <div className="space-y-6">
      {/* Highest-elevation next action — glow = urgency */}
      {top && (
        <section
          className="relative overflow-hidden rounded-2xl border border-[#a78bfa]/25 bg-[#1b1b26] p-5"
          style={{ boxShadow: GLOW }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(167,139,250,0.22), transparent 70%)",
            }}
          />
          <Eyebrow>Volgende beste actie</Eyebrow>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-[17px] font-semibold tracking-tight">{top.titel}</h2>
              <p className="mt-1 max-w-md text-[13px] leading-relaxed text-white/60">
                {top.detail}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2.5 text-[13px] font-medium text-[#0b0b10] transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b10] motion-reduce:hover:scale-100"
              style={{ backgroundColor: VIOLET }}
            >
              {top.cta}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </section>
      )}

      {/* KPI grid */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-white/10 bg-[#14141c] p-4 transition-colors hover:border-white/20"
          >
            <div className="text-[11px] text-white/45">{kpi.label}</div>
            <div
              style={mono}
              className="mt-1.5 text-[22px] font-semibold tabular-nums tracking-tight"
            >
              {kpi.value}
            </div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <span
                style={{ ...mono, color: kpi.up ? VIOLET : "rgba(255,255,255,0.45)" }}
                className="text-[11px] tabular-nums"
              >
                {kpi.up ? "▲" : "▾"} {kpi.trend}
              </span>
              <Sparkline data={kpi.spark} />
            </div>
          </div>
        ))}
      </section>

      {/* Top matches */}
      <section className="rounded-xl border border-white/10 bg-[#14141c]">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-[13px] font-medium">Beste matches</h2>
          <Eyebrow>Top 3</Eyebrow>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {OPDRACHTEN.slice(0, 3).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={onOpen}
              className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#a78bfa]/50"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{o.titel}</div>
                <div
                  style={mono}
                  className="mt-0.5 truncate text-[11px] tabular-nums text-white/45"
                >
                  {o.opdrachtgever} · {o.plaats} · {o.tarief}
                </div>
              </div>
              <MatchPill value={o.match} />
              <ChevronRight className="h-4 w-4 shrink-0 text-white/25" aria-hidden />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function MatchPill({ value }: { value: number }) {
  return (
    <span
      style={{ ...mono, color: VIOLET, borderColor: "rgba(167,139,250,0.3)" }}
      className="shrink-0 rounded-full border bg-[#a78bfa]/10 px-2 py-0.5 text-[12px] font-medium tabular-nums"
    >
      {value}%
    </span>
  );
}

/* ----------------------------------------------------------------- Marktplaats */

function MarktplaatsScreen({ onOpen }: { onOpen: () => void }) {
  const filters = ["Alle", "≥ 85% match", "Utrecht", "Avond"];
  const [active, setActive] = useState(0);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f, i) => {
          const on = i === active;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={on}
              onClick={() => setActive(i)}
              className={[
                "rounded-full border px-3 py-1 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50",
                on
                  ? "border-[#a78bfa]/40 bg-[#a78bfa]/15 text-white"
                  : "border-white/10 text-white/55 hover:border-white/25 hover:text-white",
              ].join(" ")}
            >
              {f}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {OPDRACHTEN.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={onOpen}
            className="group flex flex-col gap-3 rounded-xl border border-white/10 bg-[#14141c] p-4 text-left transition-all duration-150 hover:border-[#a78bfa]/30 hover:bg-[#1b1b26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[14px] font-medium leading-snug">{o.titel}</h3>
              <MatchPill value={o.match} />
            </div>
            <div style={mono} className="text-[11px] tabular-nums text-white/45">
              {o.opdrachtgever} · {o.plaats} · {o.uren} · {o.tarief}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {o.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/55"
                >
                  {t}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- Opdracht */

function OpdrachtScreen({ onBack }: { onBack: () => void }) {
  const o = OPDRACHTEN[0];
  if (!o) return null;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        type="button"
        onClick={onBack}
        style={mono}
        className="text-[11px] uppercase tracking-[0.16em] text-white/45 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50"
      >
        ← Terug
      </button>

      <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-[#14141c] p-5">
        <div className="min-w-0">
          <Eyebrow>{o.id}</Eyebrow>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight">{o.titel}</h2>
          <p style={mono} className="mt-1.5 text-[12px] tabular-nums text-white/50">
            {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren} · {o.start}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <Eyebrow>Match</Eyebrow>
          <div
            style={{ ...mono, color: VIOLET }}
            className="text-[34px] font-semibold tabular-nums leading-none"
          >
            {o.match}%
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-xl border border-[#a78bfa]/20 bg-[#14141c] p-4">
          <div className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" style={{ color: VIOLET }} aria-hidden />
            <Eyebrow>Waarom dit past</Eyebrow>
          </div>
          <ul className="mt-3 space-y-2.5">
            {o.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[13px] leading-snug text-white/80">
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  style={{ color: VIOLET }}
                  aria-hidden
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-white/10 bg-[#14141c] p-4">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400/80" aria-hidden />
            <Eyebrow>Aandachtspunten</Eyebrow>
          </div>
          <ul className="mt-3 space-y-2.5">
            {o.redenen.min.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[13px] leading-snug text-white/70">
                <AlertTriangle
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/70"
                  aria-hidden
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-lg px-5 py-2.5 text-[13px] font-medium text-[#0b0b10] transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b10] motion-reduce:hover:scale-100"
          style={{ backgroundColor: VIOLET }}
        >
          Reageer op opdracht
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-5 py-2.5 text-[13px] font-medium text-white/80 transition-colors hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50"
        >
          <Bookmark className="h-3.5 w-3.5" aria-hidden />
          Bewaar
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Verificatie */

const STATUS_LABEL: Record<CredStatus, string> = {
  VERIFIED: "Geverifieerd",
  EXPIRING: "Verloopt binnenkort",
  SUBMITTED: "In beoordeling",
  REJECTED: "Afgewezen",
};

function StatusSeal({ status }: { status: CredStatus }) {
  const map: Record<CredStatus, { color: string; icon: React.ReactNode }> = {
    VERIFIED: { color: VIOLET, icon: <Check className="h-4 w-4" aria-hidden /> },
    EXPIRING: { color: "#fbbf24", icon: <AlertTriangle className="h-4 w-4" aria-hidden /> },
    SUBMITTED: { color: "#94a3b8", icon: <Clock className="h-4 w-4" aria-hidden /> },
    REJECTED: { color: "#f87171", icon: <X className="h-4 w-4" aria-hidden /> },
  };
  const c = map[status];
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
      style={{
        color: c.color,
        borderColor: `${c.color}40`,
        backgroundColor: `${c.color}14`,
      }}
    >
      {c.icon}
    </span>
  );
}

function VerificatieScreen() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-5">
      <div
        className="flex items-center gap-3 rounded-2xl border border-[#a78bfa]/25 bg-[#1b1b26] p-5"
        style={{ boxShadow: GLOW }}
      >
        <ShieldCheck className="h-7 w-7" style={{ color: VIOLET }} aria-hidden />
        <div className="flex-1">
          <div className="text-[15px] font-semibold">Vertrouwensniveau: Hoog</div>
          <div className="text-[12px] text-white/55">
            {verified} van {CREDENTIALS.length} bewijsstukken geverifieerd
          </div>
        </div>
        <div style={{ ...mono, color: VIOLET }} className="text-[24px] font-semibold tabular-nums">
          {Math.round((verified / CREDENTIALS.length) * 100)}%
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#14141c]">
        <div className="divide-y divide-white/[0.06]">
          {CREDENTIALS.map((c) => (
            <div key={c.naam} className="flex items-center gap-3 px-4 py-3">
              <StatusSeal status={c.status} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{c.naam}</div>
                <div className="truncate text-[11px] text-white/45">{c.detail}</div>
              </div>
              <span
                style={mono}
                className="shrink-0 text-[10px] uppercase tabular-nums tracking-wide text-white/55"
              >
                {STATUS_LABEL[c.status]}
              </span>
            </div>
          ))}
        </div>
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
      {ordered.map((a, i) => {
        const warning = a.urgentie === "warning";
        const elevated = i === 0;
        return (
          <div
            key={a.titel}
            className={[
              "flex items-start gap-3 rounded-xl border p-4 transition-colors",
              elevated ? "border-[#a78bfa]/25 bg-[#1b1b26]" : "border-white/10 bg-[#14141c]",
            ].join(" ")}
            style={elevated ? { boxShadow: GLOW } : undefined}
          >
            <span
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor: warning ? "rgba(251,191,36,0.12)" : "rgba(167,139,250,0.12)",
              }}
            >
              {warning ? (
                <AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden />
              ) : (
                <Zap className="h-4 w-4" style={{ color: VIOLET }} aria-hidden />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-medium">{a.titel}</div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-white/55">{a.detail}</p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-[12px] font-medium text-white/80 transition-colors hover:border-[#a78bfa]/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50"
            >
              {a.cta}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------- Facturen */

function FacturenChip({ status }: { status: string }) {
  const map: Record<string, { color: string }> = {
    Betaald: { color: VIOLET },
    Openstaand: { color: "#fbbf24" },
    Concept: { color: "#94a3b8" },
  };
  const c = map[status] ?? { color: "#94a3b8" };
  return (
    <span
      style={{
        ...mono,
        color: c.color,
        borderColor: `${c.color}40`,
        backgroundColor: `${c.color}14`,
      }}
      className="inline-block rounded-full border px-2 py-0.5 text-[10px] uppercase tabular-nums tracking-wide"
    >
      {status}
    </span>
  );
}

function FacturenScreen() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#14141c]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10">
              {["Nr", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                <th
                  key={h}
                  style={mono}
                  className={[
                    "px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/40",
                    i === 3 ? "text-right" : "",
                  ].join(" ")}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {FACTUREN.map((f) => (
              <tr key={f.nr} className="transition-colors hover:bg-white/[0.03]">
                <td style={mono} className="px-4 py-3 text-[12px] tabular-nums text-white/60">
                  {f.nr}
                </td>
                <td className="px-4 py-3 text-[13px]">{f.klant}</td>
                <td style={mono} className="px-4 py-3 text-[12px] tabular-nums text-white/45">
                  {f.datum}
                </td>
                <td
                  style={mono}
                  className="px-4 py-3 text-right text-[13px] font-medium tabular-nums"
                >
                  {f.bedrag}
                </td>
                <td className="px-4 py-3">
                  <FacturenChip status={f.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
