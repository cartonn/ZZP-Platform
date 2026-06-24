"use client";

// Concept 04 — "Tij": ambient aurora-light, Family-app calm.
// Self-contained mini-app: glassy translucent cards over a soft aurora gradient-mesh wash.
// Light, airy, soothing — designed to lower anxiety around documents/verification.

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
  Sparkles,
  Receipt,
  MapPin,
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

const head = { fontFamily: "var(--font-lab-sora)" } as const;
const body = { fontFamily: "var(--font-lab-manrope)" } as const;
const num = { fontFamily: "var(--font-lab-mono)" } as const;

const SKY = "#0ea5e9";

const NAV_ICON: Record<ScreenKey, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: FileText,
  verificatie: ShieldCheck,
  acties: Sparkles,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

/* ------------------------------------------------------------------ Sparkline */

function Sparkline({ data, stroke }: { data: number[]; stroke: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 72;
  const h = 24;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      aria-hidden
      className="overflow-visible"
    >
      <polyline
        points={pts}
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />
    </svg>
  );
}

export function Concept04() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      style={body}
      className="relative min-h-[640px] w-full overflow-hidden bg-[#f6fafe] text-[#0f2740] antialiased [color-scheme:light]"
    >
      {/* Aurora mesh wash */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-[#38bdf8] opacity-[0.18] blur-[110px]" />
        <div className="absolute right-[-10%] top-[10%] h-[380px] w-[380px] rounded-full bg-[#a78bfa] opacity-[0.16] blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[30%] h-[440px] w-[440px] rounded-full bg-[#67e8f9] opacity-[0.15] blur-[120px]" />
      </div>

      <div className="relative flex min-h-[640px] w-full flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="hidden w-[232px] shrink-0 flex-col p-4 md:flex">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <span
              style={head}
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0ea5e9] to-[#38bdf8] text-sm font-bold text-white shadow-lg shadow-sky-500/30"
              aria-hidden
            >
              Z
            </span>
            <div className="leading-tight">
              <div style={head} className="text-[14px] font-semibold tracking-tight">
                Tij
              </div>
              <div className="text-[11px] text-[#5b7a93]">Zorgbemiddeling</div>
            </div>
          </div>

          <nav className="mt-4 flex flex-1 flex-col gap-1" aria-label="Hoofdnavigatie">
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
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[13px] transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50",
                    active
                      ? "bg-white/70 font-semibold text-[#0f2740] shadow-sm shadow-sky-900/5 backdrop-blur"
                      : "text-[#5b7a93] hover:bg-white/50 hover:text-[#0f2740]",
                  ].join(" ")}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-4 rounded-3xl border border-white/60 bg-white/60 p-4 shadow-sm shadow-sky-900/5 backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span style={head} className="text-[12px] font-semibold text-[#0f2740]">
                VOG verloopt
              </span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-[#5b7a93]">
              Nog <span style={num}>23</span> dagen geldig. Vernieuw rustig op tijd.
            </p>
            <button
              type="button"
              onClick={() => setScreen("acties")}
              className="mt-3 w-full rounded-xl bg-amber-500 px-3 py-2 text-[12px] font-semibold text-white transition-colors duration-200 hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
            >
              Vernieuwen
            </button>
          </div>
        </aside>

        {/* Right column */}
        <div className="flex min-w-0 flex-1 flex-col p-4 md:py-5 md:pr-5">
          {/* Top bar */}
          <header className="flex items-center gap-3 rounded-3xl border border-white/60 bg-white/60 px-4 py-2.5 shadow-sm shadow-sky-900/5 backdrop-blur">
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl bg-white/70 px-3.5 py-2.5 text-left text-[13px] text-[#5b7a93] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 sm:max-w-sm"
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">Zoek rustig naar opdrachten…</span>
            </button>

            {/* Mobile tabs scroller lives below; show profile + bell here */}
            <button
              type="button"
              aria-label="Meldingen"
              className="relative rounded-2xl p-2.5 text-[#5b7a93] transition-colors hover:bg-white/70 hover:text-[#0f2740] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
            >
              <Bell className="h-[18px] w-[18px]" aria-hidden />
              <span
                className="absolute right-2 top-2 h-2 w-2 rounded-full bg-sky-500 ring-2 ring-white"
                aria-hidden
              />
            </button>

            <div className="flex items-center gap-2.5">
              <span
                style={head}
                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-300 text-[11px] font-bold text-white shadow-sm"
                aria-hidden
              >
                {PROFIEL.initialen}
              </span>
              <div className="hidden leading-tight sm:block">
                <div style={head} className="text-[12px] font-semibold">
                  {PROFIEL.naam}
                </div>
                <div className="text-[11px] text-[#5b7a93]">{PROFIEL.plaats}</div>
              </div>
            </div>
          </header>

          {/* Mobile tabs */}
          <div
            className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
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
                    "shrink-0 rounded-full px-3.5 py-1.5 text-[12px] transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50",
                    active
                      ? "bg-white font-semibold text-[#0f2740] shadow-sm"
                      : "bg-white/50 text-[#5b7a93]",
                  ].join(" ")}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Main */}
          <main className="mt-4 flex-1">
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

/* ------------------------------------------------------------------------- Card */

function Glass({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={[
        "rounded-3xl border border-white/60 bg-white/60 shadow-sm shadow-sky-900/5 backdrop-blur",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ Dashboard */

function Dashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((kpi) => (
          <Glass key={kpi.label} className="p-4">
            <div className="text-[11px] font-medium text-[#5b7a93]">{kpi.label}</div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div style={num} className="text-2xl font-semibold tracking-tight text-[#0f2740]">
                {kpi.value}
              </div>
              <Sparkline data={kpi.spark} stroke={kpi.up ? "#0ea5e9" : "#94a3b8"} />
            </div>
            <div
              style={num}
              className={["mt-1 text-[11px]", kpi.up ? "text-emerald-600" : "text-[#5b7a93]"].join(
                " ",
              )}
            >
              {kpi.up ? "↑ " : "· "}
              {kpi.trend}
            </div>
          </Glass>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-baseline justify-between px-1">
          <h2 style={head} className="text-[14px] font-semibold">
            Opdrachten die bij je passen
          </h2>
          <span className="text-[11px] text-[#5b7a93]">Top 3</span>
        </div>
        <div className="space-y-3">
          {OPDRACHTEN.slice(0, 3).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={onOpen}
              className="group flex w-full items-center gap-4 rounded-3xl border border-white/60 bg-white/60 p-4 text-left shadow-sm shadow-sky-900/5 backdrop-blur transition-all duration-200 hover:bg-white/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
            >
              <div className="min-w-0 flex-1">
                <div style={head} className="truncate text-[13px] font-semibold">
                  {o.titel}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[#5b7a93]">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </div>
              </div>
              <MatchRing match={o.match} />
              <ArrowUpRight
                className="h-4 w-4 shrink-0 text-sky-300 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:text-sky-500 motion-reduce:transition-none"
                aria-hidden
              />
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 style={head} className="mb-3 px-1 text-[14px] font-semibold">
          Wat je vandaag rustig kunt oppakken
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {ACTIES.map((a) => (
            <Glass key={a.titel} className="p-4">
              <span
                className={[
                  "inline-flex h-7 w-7 items-center justify-center rounded-full",
                  a.urgentie === "warning"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-sky-100 text-sky-600",
                ].join(" ")}
              >
                {a.urgentie === "warning" ? (
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                )}
              </span>
              <div style={head} className="mt-2.5 text-[12px] font-semibold leading-snug">
                {a.titel}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-[#5b7a93]">{a.detail}</p>
            </Glass>
          ))}
        </div>
      </section>
    </div>
  );
}

function MatchRing({ match }: { match: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const off = c - (match / 100) * c;
  return (
    <div className="relative h-10 w-10 shrink-0">
      <svg viewBox="0 0 40 40" className="h-10 w-10 -rotate-90" aria-hidden>
        <circle cx="20" cy="20" r={r} fill="none" stroke="#e0f2fe" strokeWidth="4" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={SKY}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <span
        style={num}
        className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-sky-700"
      >
        {match}
      </span>
    </div>
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
              "rounded-full px-3.5 py-1.5 text-[12px] transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50",
              i === active
                ? "bg-sky-500 font-semibold text-white shadow-sm shadow-sky-500/30"
                : "border border-white/60 bg-white/60 text-[#5b7a93] backdrop-blur hover:bg-white/80",
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
            className="flex w-full flex-col gap-3 rounded-3xl border border-white/60 bg-white/60 p-4 text-left shadow-sm shadow-sky-900/5 backdrop-blur transition-all duration-200 hover:bg-white/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <div style={head} className="truncate text-[13px] font-semibold">
                {o.titel}
              </div>
              <div className="mt-1 truncate text-[12px] text-[#5b7a93]">
                {o.opdrachtgever} · {o.plaats} · {o.uren} · {o.tarief}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-medium text-sky-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-center">
              <MatchRing match={o.match} />
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
        className="text-[12px] font-medium text-[#5b7a93] transition-colors hover:text-[#0f2740] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
      >
        ← Terug naar marktplaats
      </button>

      <Glass className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span style={num} className="text-[11px] text-[#5b7a93]">
              {o.id}
            </span>
            <h2 style={head} className="mt-1 text-lg font-semibold tracking-tight">
              {o.titel}
            </h2>
            <div className="mt-1 text-[12px] text-[#5b7a93]">
              {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren} · {o.start}
            </div>
          </div>
          <MatchRing match={o.match} />
        </div>
      </Glass>

      <div className="grid gap-3 sm:grid-cols-2">
        <Glass className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span style={head} className="text-[12px] font-semibold">
              Waarom dit past
            </span>
          </div>
          <ul className="space-y-2.5">
            {o.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[12px] text-[#33536b]">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Glass>
        <Glass className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span style={head} className="text-[12px] font-semibold">
              Goed om te weten
            </span>
          </div>
          <ul className="space-y-2.5">
            {o.redenen.min.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[12px] text-[#33536b]">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Glass>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => setApplied(true)}
          className={[
            "flex items-center gap-2 rounded-2xl px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50",
            applied
              ? "bg-emerald-500"
              : "bg-gradient-to-br from-sky-500 to-cyan-500 shadow-sm shadow-sky-500/30 hover:shadow-md",
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
          className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/60 px-5 py-2.5 text-[13px] font-semibold text-[#33536b] backdrop-blur transition-colors hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
        >
          <Bookmark
            className={["h-4 w-4", saved ? "fill-sky-500 text-sky-500" : ""].join(" ")}
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
    wrap: "bg-emerald-100 text-emerald-600",
    icon: <Check className="h-4 w-4" aria-hidden />,
    label: "Geverifieerd",
  },
  EXPIRING: {
    wrap: "bg-amber-100 text-amber-600",
    icon: <AlertTriangle className="h-4 w-4" aria-hidden />,
    label: "Verloopt binnenkort",
  },
  SUBMITTED: {
    wrap: "bg-sky-100 text-sky-600",
    icon: <Clock className="h-4 w-4" aria-hidden />,
    label: "In beoordeling",
  },
  REJECTED: {
    wrap: "bg-rose-100 text-rose-600",
    icon: <X className="h-4 w-4" aria-hidden />,
    label: "Afgewezen",
  },
};

function Verificatie() {
  return (
    <div className="space-y-4">
      <Glass className="overflow-hidden p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 text-white shadow-sm">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </span>
          <div className="flex-1">
            <div style={head} className="text-[14px] font-semibold">
              {PROFIEL.trust}
            </div>
            <div className="text-[12px] text-[#5b7a93]">
              3 van 4 documenten geverifieerd — je bent goed op weg.
            </div>
          </div>
          <span style={num} className="hidden text-[13px] font-semibold text-emerald-600 sm:block">
            75%
          </span>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-sky-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
            style={{ width: "75%" }}
          />
        </div>
      </Glass>

      <div className="space-y-3">
        {CREDENTIALS.map((c) => {
          const s = SEAL[c.status];
          return (
            <Glass key={c.naam} className="flex items-center gap-3.5 p-4">
              <span
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                  s.wrap,
                ].join(" ")}
              >
                {s.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div style={head} className="truncate text-[13px] font-semibold">
                  {c.naam}
                </div>
                <div className="truncate text-[11px] text-[#5b7a93]">{c.detail}</div>
              </div>
              <span className="shrink-0 text-[11px] font-medium text-[#5b7a93]">{s.label}</span>
            </Glass>
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
          <Glass key={a.titel} className="flex flex-col p-5">
            <span
              className={[
                "flex h-9 w-9 items-center justify-center rounded-2xl",
                warning ? "bg-amber-100 text-amber-600" : "bg-sky-100 text-sky-600",
              ].join(" ")}
            >
              {warning ? (
                <AlertTriangle className="h-4 w-4" aria-hidden />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden />
              )}
            </span>
            <div style={head} className="mt-3 text-[13px] font-semibold">
              {a.titel}
            </div>
            <p className="mt-1 flex-1 text-[12px] leading-relaxed text-[#5b7a93]">{a.detail}</p>
            <button
              type="button"
              className={[
                "mt-4 w-full rounded-2xl px-4 py-2.5 text-[12px] font-semibold transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50",
                warning
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-sky-500 text-white hover:bg-sky-600",
              ].join(" ")}
            >
              {a.cta}
            </button>
          </Glass>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------- Facturen */

function FactuurChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    Betaald: "bg-emerald-100 text-emerald-700",
    Openstaand: "bg-amber-100 text-amber-700",
    Concept: "bg-slate-100 text-slate-500",
  };
  return (
    <span
      className={[
        "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        map[status] ?? "bg-slate-100 text-slate-500",
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function Facturen() {
  return (
    <Glass className="overflow-hidden">
      <div className="border-b border-white/60 px-5 py-4">
        <h2 style={head} className="text-[14px] font-semibold">
          Facturen
        </h2>
        <p className="text-[12px] text-[#5b7a93]">
          Een rustig overzicht van je verzonden facturen.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="text-[11px] text-[#5b7a93]">
              <th className="px-5 py-2.5 font-medium">Nummer</th>
              <th className="px-5 py-2.5 font-medium">Klant</th>
              <th className="px-5 py-2.5 font-medium">Datum</th>
              <th className="px-5 py-2.5 text-right font-medium">Bedrag</th>
              <th className="px-5 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => (
              <tr key={f.nr} className={i > 0 ? "border-t border-white/50" : ""}>
                <td style={num} className="px-5 py-3.5 text-[12px] text-[#33536b]">
                  {f.nr}
                </td>
                <td className="px-5 py-3.5 text-[13px]">{f.klant}</td>
                <td style={num} className="px-5 py-3.5 text-[12px] text-[#5b7a93]">
                  {f.datum}
                </td>
                <td style={num} className="px-5 py-3.5 text-right text-[13px] font-semibold">
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
    </Glass>
  );
}
