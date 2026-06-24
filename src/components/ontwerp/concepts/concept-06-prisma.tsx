"use client";

// Concept 06 — "Prisma": confident color system (Stripe-grade). White canvas,
// controlled vivid palette (indigo base + semantic green/amber/red), bento KPI grid,
// gradient pills and simple SVG charts. Bright, rounded, chart-forward, data-positive.

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
  LayoutGrid,
  Store,
  FileText,
  Receipt,
  Zap,
  TrendingUp,
  ArrowLeft,
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

const sans = { fontFamily: "var(--font-lab-inter)" } as const;
const num = { fontFamily: "var(--font-lab-mono)" } as const;

const INDIGO = "#6366f1";

const NAV_ICON: Record<ScreenKey, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: FileText,
  verificatie: ShieldCheck,
  acties: Zap,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

/* -------------------------------------------------------------- Mini bar chart */

function BarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data) || 1;
  return (
    <div className="flex h-9 items-end gap-1" aria-hidden>
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${Math.max(12, (v / max) * 100)}%`,
            backgroundColor: color,
            opacity: 0.35 + (i / data.length) * 0.65,
          }}
        />
      ))}
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 88;
  const h = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} ${w},${h} 0,${h}`;
  const gid = `pf-${color.replace("#", "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline
        points={line}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Concept06() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      style={sans}
      className="min-h-[640px] w-full bg-[#f8fafc] text-[#0f172a] antialiased [color-scheme:light]"
    >
      <div className="flex min-h-[640px] w-full flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="hidden w-[228px] shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex">
          <div className="flex items-center gap-2.5 px-1">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-sm shadow-indigo-500/30"
              aria-hidden
            >
              Z
            </span>
            <span className="text-[15px] font-bold tracking-tight">Prisma</span>
          </div>

          <nav className="mt-5 flex flex-1 flex-col gap-1" aria-label="Hoofdnavigatie">
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
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
                    active
                      ? "bg-indigo-50 font-semibold text-indigo-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 ring-1 ring-amber-200/70">
            <div className="flex items-center gap-1.5 text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                VOG verloopt
              </span>
            </div>
            <p className="mt-1.5 text-[12px] leading-snug text-amber-900/80">
              Nog <span style={num}>23</span> dagen geldig.
            </p>
            <button
              type="button"
              onClick={() => setScreen("acties")}
              className="mt-3 w-full rounded-lg bg-amber-500 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
            >
              Vernieuwen
            </button>
          </div>
        </aside>

        {/* Right column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5 text-left text-[13px] text-slate-400 ring-1 ring-transparent transition hover:bg-white hover:ring-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 sm:max-w-sm"
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">Zoek opdrachten, documenten…</span>
            </button>

            <button
              type="button"
              aria-label="Meldingen"
              className="relative rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            >
              <Bell className="h-[18px] w-[18px]" aria-hidden />
              <span
                className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white"
                aria-hidden
              />
            </button>

            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-[11px] font-bold text-white"
                aria-hidden
              >
                {PROFIEL.initialen}
              </span>
              <div className="hidden leading-tight sm:block">
                <div className="text-[12px] font-semibold">{PROFIEL.naam}</div>
                <div className="text-[11px] text-slate-500">{PROFIEL.plaats}</div>
              </div>
            </div>
          </header>

          {/* Mobile tabs */}
          <div
            className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const active = s.key === screen;
              return (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setScreen(s.key)}
                  className={[
                    "shrink-0 rounded-full px-3.5 py-1.5 text-[12px] transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
                    active
                      ? "bg-indigo-600 font-semibold text-white"
                      : "bg-slate-100 text-slate-500",
                  ].join(" ")}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Main */}
          <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
            {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && <Opdracht onBack={() => setScreen("marktplaats")} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Dashboard */

const KPI_TONE = [
  { from: "from-indigo-500", to: "to-violet-500", text: "text-indigo-600", color: INDIGO },
  { from: "from-emerald-500", to: "to-teal-500", text: "text-emerald-600", color: "#10b981" },
  { from: "from-sky-500", to: "to-cyan-500", text: "text-sky-600", color: "#0ea5e9" },
  { from: "from-amber-500", to: "to-orange-500", text: "text-amber-600", color: "#f59e0b" },
];

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const hero = KPIS[2];
  const heroTone = KPI_TONE[2];
  const sats = KPIS.filter((_, i) => i !== 2);
  return (
    <div className="space-y-6">
      {/* Bento KPI grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {hero && heroTone && (
          <div
            className={[
              "relative col-span-2 row-span-2 flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-white shadow-lg shadow-indigo-500/10",
              heroTone.from,
              heroTone.to,
            ].join(" ")}
          >
            <div>
              <div className="text-[12px] font-medium text-white/80">{hero.label}</div>
              <div style={num} className="mt-1 text-4xl font-bold tracking-tight">
                {hero.value}
              </div>
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
                <TrendingUp className="h-3 w-3" aria-hidden />
                {hero.trend} deze maand
              </div>
            </div>
            <div className="mt-4 [&_polygon]:!fill-white/20 [&_polyline]:!stroke-white">
              <Sparkline data={hero.spark} color="#ffffff" />
            </div>
          </div>
        )}

        {sats.map((kpi, i) => {
          const tone = KPI_TONE[i === 0 ? 0 : i === 1 ? 1 : 3];
          return (
            <div
              key={kpi.label}
              className="flex flex-col justify-between rounded-3xl bg-white p-4 ring-1 ring-slate-200"
            >
              <div className="flex items-start justify-between">
                <div className="text-[11px] font-medium text-slate-500">{kpi.label}</div>
                <span
                  className={[
                    "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    kpi.up ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500",
                  ].join(" ")}
                >
                  {kpi.trend}
                </span>
              </div>
              <div style={num} className="mt-2 text-2xl font-bold tracking-tight">
                {kpi.value}
              </div>
              <div className="mt-2">
                <BarChart data={kpi.spark} color={tone?.color ?? INDIGO} />
              </div>
            </div>
          );
        })}
      </div>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[15px] font-bold tracking-tight">Beste matches</h2>
          <span className="text-[12px] text-slate-400">Top 3</span>
        </div>
        <div className="space-y-2.5">
          {OPDRACHTEN.slice(0, 3).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={onOpen}
              className="group flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left ring-1 ring-slate-200 transition-all duration-150 hover:shadow-sm hover:ring-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold">{o.titel}</div>
                <div className="mt-0.5 truncate text-[12px] text-slate-500">
                  {o.opdrachtgever} · {o.plaats} · {o.tarief}
                </div>
              </div>
              <MatchBadge match={o.match} />
              <ArrowUpRight
                className="h-4 w-4 shrink-0 text-slate-300 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:text-indigo-500 motion-reduce:transition-none"
                aria-hidden
              />
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[15px] font-bold tracking-tight">Acties</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {ACTIES.map((a) => {
            const warning = a.urgentie === "warning";
            return (
              <div key={a.titel} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <span
                  className={[
                    "inline-flex h-7 w-7 items-center justify-center rounded-lg",
                    warning ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600",
                  ].join(" ")}
                >
                  {warning ? (
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Zap className="h-3.5 w-3.5" aria-hidden />
                  )}
                </span>
                <div className="mt-2.5 text-[12px] font-semibold leading-snug">{a.titel}</div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{a.detail}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function MatchBadge({ match }: { match: number }) {
  const tone =
    match >= 90
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : match >= 80
        ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
        : "bg-amber-50 text-amber-700 ring-amber-200";
  return (
    <span
      style={num}
      className={["shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold ring-1", tone].join(" ")}
    >
      {match}%
    </span>
  );
}

/* ----------------------------------------------------------------- Marktplaats */

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const filters = ["Alle", "≥ 85% match", "Utrecht", "Avond"];
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
            className={[
              "rounded-full px-3.5 py-1.5 text-[12px] transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
              i === active
                ? "bg-indigo-600 font-semibold text-white shadow-sm shadow-indigo-500/30"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300",
            ].join(" ")}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {OPDRACHTEN.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={onOpen}
            className="flex w-full flex-col gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-slate-200 transition-all duration-150 hover:shadow-sm hover:ring-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{o.titel}</div>
              <div className="mt-0.5 truncate text-[12px] text-slate-500">
                {o.opdrachtgever} · {o.plaats} · {o.uren} · {o.tarief}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="self-start sm:self-center">
              <MatchBadge match={o.match} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- Opdracht */

function Opdracht({ onBack }: { onBack: () => void }) {
  const o = OPDRACHTEN[0];
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  if (!o) return null;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Terug naar marktplaats
      </button>

      <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span style={num} className="text-[11px] text-slate-400">
              {o.id}
            </span>
            <h2 className="mt-1 text-lg font-bold tracking-tight">{o.titel}</h2>
            <div className="mt-1 text-[12px] text-slate-500">
              {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren} · {o.start}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[11px] font-medium text-slate-400">Match</div>
            <div style={num} className="text-3xl font-bold tracking-tight text-indigo-600">
              {o.match}%
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl bg-white p-4 ring-1 ring-emerald-200/70">
          <div className="mb-3 flex items-center gap-2 text-emerald-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50">
              <Check className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="text-[12px] font-semibold">Waarom dit past</span>
          </div>
          <ul className="space-y-2.5">
            {o.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[12px] text-slate-600">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl bg-white p-4 ring-1 ring-amber-200/70">
          <div className="mb-3 flex items-center gap-2 text-amber-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="text-[12px] font-semibold">Let op</span>
          </div>
          <ul className="space-y-2.5">
            {o.redenen.min.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[12px] text-slate-600">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => setApplied(true)}
          className={[
            "flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2",
            applied
              ? "bg-emerald-600"
              : "bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm shadow-indigo-500/30 hover:from-indigo-700 hover:to-violet-700",
          ].join(" ")}
        >
          {applied ? (
            <>
              <Check className="h-4 w-4" aria-hidden /> Reactie verstuurd
            </>
          ) : (
            "Reageer op opdracht"
          )}
        </button>
        <button
          type="button"
          onClick={() => setSaved((s) => !s)}
          className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-700 ring-1 ring-slate-200 transition-colors hover:ring-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
        >
          <Bookmark
            className={["h-4 w-4", saved ? "fill-indigo-500 text-indigo-500" : ""].join(" ")}
            aria-hidden
          />
          {saved ? "Bewaard" : "Bewaar"}
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Verificatie */

const SEAL: Record<CredStatus, { wrap: string; icon: React.ReactNode; label: string }> = {
  VERIFIED: {
    wrap: "bg-emerald-50 text-emerald-600 ring-emerald-200",
    icon: <Check className="h-4 w-4" aria-hidden />,
    label: "Geverifieerd",
  },
  EXPIRING: {
    wrap: "bg-amber-50 text-amber-600 ring-amber-200",
    icon: <AlertTriangle className="h-4 w-4" aria-hidden />,
    label: "Verloopt binnenkort",
  },
  SUBMITTED: {
    wrap: "bg-indigo-50 text-indigo-600 ring-indigo-200",
    icon: <Clock className="h-4 w-4" aria-hidden />,
    label: "In beoordeling",
  },
  REJECTED: {
    wrap: "bg-rose-50 text-rose-600 ring-rose-200",
    icon: <X className="h-4 w-4" aria-hidden />,
    label: "Afgewezen",
  },
};

function Verificatie() {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white shadow-lg shadow-indigo-500/10">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </span>
          <div className="flex-1">
            <div className="text-[15px] font-bold tracking-tight">{PROFIEL.trust}</div>
            <div className="text-[12px] text-white/80">3 van 4 documenten geverifieerd.</div>
          </div>
          <span style={num} className="hidden text-[15px] font-bold sm:block">
            75%
          </span>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white" style={{ width: "75%" }} />
        </div>
      </div>

      <div className="space-y-3">
        {CREDENTIALS.map((c) => {
          const s = SEAL[c.status];
          return (
            <div
              key={c.naam}
              className="flex items-center gap-3.5 rounded-2xl bg-white p-4 ring-1 ring-slate-200"
            >
              <span
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
                  s.wrap,
                ].join(" ")}
              >
                {s.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold">{c.naam}</div>
                <div className="truncate text-[11px] text-slate-500">{c.detail}</div>
              </div>
              <span className="shrink-0 text-[11px] font-medium text-slate-500">{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- Acties */

function Acties() {
  const ordered = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ordered.map((a) => {
        const warning = a.urgentie === "warning";
        return (
          <div
            key={a.titel}
            className={[
              "flex flex-col rounded-3xl bg-white p-5 ring-1",
              warning ? "ring-amber-200/70" : "ring-slate-200",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-9 w-9 items-center justify-center rounded-xl",
                warning ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600",
              ].join(" ")}
            >
              {warning ? (
                <AlertTriangle className="h-4 w-4" aria-hidden />
              ) : (
                <Zap className="h-4 w-4" aria-hidden />
              )}
            </span>
            <div className="mt-3 text-[13px] font-semibold">{a.titel}</div>
            <p className="mt-1 flex-1 text-[12px] leading-relaxed text-slate-500">{a.detail}</p>
            <button
              type="button"
              className={[
                "mt-4 w-full rounded-xl px-4 py-2.5 text-[12px] font-semibold text-white transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                warning
                  ? "bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-400/50"
                  : "bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-indigo-500/40",
              ].join(" ")}
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

function FactuurChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    Betaald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Openstaand: "bg-amber-50 text-amber-700 ring-amber-200",
    Concept: "bg-slate-100 text-slate-500 ring-slate-200",
  };
  return (
    <span
      className={[
        "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
        map[status] ?? "bg-slate-100 text-slate-500 ring-slate-200",
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function Facturen() {
  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-[15px] font-bold tracking-tight">Facturen</h2>
        <p className="text-[12px] text-slate-500">Overzicht van je verzonden facturen.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="text-[11px] text-slate-400">
              <th className="px-5 py-2.5 font-medium">Nummer</th>
              <th className="px-5 py-2.5 font-medium">Klant</th>
              <th className="px-5 py-2.5 font-medium">Datum</th>
              <th className="px-5 py-2.5 text-right font-medium">Bedrag</th>
              <th className="px-5 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => (
              <tr key={f.nr} className={i > 0 ? "border-t border-slate-100" : ""}>
                <td style={num} className="px-5 py-3.5 text-[12px] text-slate-600">
                  {f.nr}
                </td>
                <td className="px-5 py-3.5 text-[13px] font-medium">{f.klant}</td>
                <td style={num} className="px-5 py-3.5 text-[12px] text-slate-500">
                  {f.datum}
                </td>
                <td style={num} className="px-5 py-3.5 text-right text-[13px] font-bold">
                  {f.bedrag}
                </td>
                <td className="px-5 py-3.5">
                  <FactuurChip status={f.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
