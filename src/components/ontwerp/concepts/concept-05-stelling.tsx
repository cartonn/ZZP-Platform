"use client";

// Concept 05 — "Stelling": verfijnd neo-brutalisme (licht).
// Stellig en zelfbewust: 2px zwarte randen, harde offset-schaduwen, oversized koppen,
// blokvlakken op een warm crème canvas. Eén elektrisch accent (groen) voor status/CTA.
// Warm gehouden zodat het professioneel blijft voor de zorg — rauw maar leesbaar, strak grid.
// Self-contained mini-app: rail + topbar + interne schermtabs over de kernschermen.
// Frontend only, mock data.

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
  ArrowRight,
  Plus,
  Minus,
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

// --- Brutalist palette (warm, light) ---
const C = {
  canvas: "#fbf9f4",
  panel: "#ffffff",
  ink: "#101010",
  sub: "#5c594f",
  accent: "#16a34a",
  warn: "#b45309",
  reject: "#b91c1c",
} as const;

const display = { fontFamily: "var(--font-lab-space)" } as const;
const mono = { fontFamily: "var(--font-lab-mono)" } as const;

// Hard offset-shadow utility (pressed-look on hover via translate + kleinere schaduw).
const HARD =
  "border-2 border-[#101010] shadow-[4px_4px_0_0_#101010] transition-all duration-100 " +
  "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#101010] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-[#fbf9f4]";

const HARD_STATIC = "border-2 border-[#101010] shadow-[4px_4px_0_0_#101010]";

// Map de rail-labels naar interne schermen waar ze overlappen.
const NAV_TO_SCREEN: Partial<Record<(typeof NAV)[number], ScreenKey>> = {
  Dashboard: "dashboard",
  Marktplaats: "marktplaats",
  Reacties: "acties",
  Verificatie: "verificatie",
  Facturen: "facturen",
};

/* --------------------------------------------------------------- status helpers */

const STATUS_LABEL: Record<CredStatus, string> = {
  VERIFIED: "Geverifieerd",
  EXPIRING: "Verloopt binnenkort",
  SUBMITTED: "In beoordeling",
  REJECTED: "Afgewezen",
};

function statusVisual(status: CredStatus): { bg: string; fg: string; icon: React.ReactNode } {
  switch (status) {
    case "VERIFIED":
      return { bg: C.accent, fg: "#ffffff", icon: <Check className="h-3.5 w-3.5" aria-hidden /> };
    case "EXPIRING":
      return {
        bg: "#fde68a",
        fg: C.ink,
        icon: <AlertTriangle className="h-3.5 w-3.5" aria-hidden />,
      };
    case "SUBMITTED":
      return { bg: "#ffffff", fg: C.ink, icon: <Clock className="h-3.5 w-3.5" aria-hidden /> };
    case "REJECTED":
      return { bg: C.reject, fg: "#ffffff", icon: <X className="h-3.5 w-3.5" aria-hidden /> };
  }
}

function StatusBlock({ status }: { status: CredStatus }) {
  const v = statusVisual(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 border-2 border-[#101010] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      style={{ ...mono, background: v.bg, color: v.fg }}
    >
      {v.icon}
      {STATUS_LABEL[status]}
    </span>
  );
}

/* ---------------------------------------------------------------------- shell */

export function Concept05() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      style={{ ...display, background: C.canvas, color: C.ink }}
      className="flex min-h-[640px] w-full antialiased [color-scheme:light]"
    >
      {/* Rail */}
      <aside
        className="hidden w-[232px] shrink-0 flex-col border-r-2 border-[#101010] md:flex"
        style={{ background: C.canvas }}
      >
        <div className="flex items-center gap-2.5 border-b-2 border-[#101010] px-4 py-5">
          <span
            className="flex h-9 w-9 items-center justify-center border-2 border-[#101010] text-base font-bold"
            style={{ background: C.accent, color: "#fff" }}
            aria-hidden
          >
            Z
          </span>
          <span className="text-[15px] font-bold tracking-tight">ZORGBEMIDDELING</span>
        </div>

        <nav className="flex flex-1 flex-col gap-2 p-3" aria-label="Hoofdnavigatie">
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
                className={[
                  "flex items-center justify-between px-3 py-2 text-left text-[13px] font-bold uppercase tracking-wide",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf9f4]",
                  active
                    ? "border-2 border-[#101010] bg-[#101010] text-white shadow-[3px_3px_0_0_#16a34a]"
                    : target === undefined
                      ? "cursor-default text-[#b6b2a6]"
                      : "border-2 border-transparent text-[#5c594f] hover:border-[#101010] hover:bg-white",
                ].join(" ")}
              >
                <span>{item}</span>
                {active && <ArrowRight className="h-3.5 w-3.5" aria-hidden />}
              </button>
            );
          })}
        </nav>

        <div className="m-3 border-2 border-[#101010] bg-[#fde68a] p-3 shadow-[4px_4px_0_0_#101010]">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            <span style={mono} className="text-[10px] font-bold uppercase tracking-wide">
              VOG verloopt
            </span>
          </div>
          <p className="mt-1.5 text-[12px] font-medium leading-snug">
            Nog <span style={mono}>23</span> dagen geldig.
          </p>
          <button
            type="button"
            onClick={() => setScreen("acties")}
            className="mt-2.5 w-full border-2 border-[#101010] bg-white px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide shadow-[3px_3px_0_0_#101010] transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#101010] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fde68a]"
          >
            Vernieuwen
          </button>
        </div>
      </aside>

      {/* Right column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header
          className="flex items-center gap-3 border-b-2 border-[#101010] px-4 py-3"
          style={{ background: C.canvas }}
        >
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 border-2 border-[#101010] bg-white px-3 py-2 text-left text-[13px] font-medium text-[#5c594f] shadow-[3px_3px_0_0_#101010] transition-all duration-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#101010] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf9f4] sm:max-w-sm"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">Zoek of spring naar…</span>
          </button>

          <button
            type="button"
            aria-label="Meldingen"
            className="relative border-2 border-[#101010] bg-white p-2 shadow-[3px_3px_0_0_#101010] transition-all duration-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#101010] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf9f4]"
          >
            <Bell className="h-4 w-4" aria-hidden />
            <span
              className="absolute -right-1.5 -top-1.5 h-3 w-3 border-2 border-[#101010]"
              style={{ background: C.accent }}
              aria-hidden
            />
          </button>

          <div className="flex items-center gap-2">
            <span
              className="flex h-9 w-9 items-center justify-center border-2 border-[#101010] text-[11px] font-bold"
              style={{ ...mono, background: C.accent, color: "#fff" }}
              aria-hidden
            >
              {PROFIEL.initialen}
            </span>
            <div className="hidden leading-tight sm:block">
              <div className="text-[12px] font-bold">{PROFIEL.naam}</div>
              <div className="text-[11px] font-medium text-[#5c594f]">{PROFIEL.plaats}</div>
            </div>
          </div>
        </header>

        {/* Screen tabs */}
        <div className="border-b-2 border-[#101010]" style={{ background: C.canvas }}>
          <div
            className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                  aria-current={active ? "page" : undefined}
                  onClick={() => setScreen(s.key)}
                  className={[
                    "shrink-0 border-2 border-[#101010] px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide transition-all duration-100",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf9f4]",
                    active
                      ? "bg-[#101010] text-white shadow-[3px_3px_0_0_#16a34a]"
                      : "bg-white text-[#5c594f] shadow-[3px_3px_0_0_#101010] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#101010]",
                  ].join(" ")}
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

/* ------------------------------------------------------------------ Dashboard */

function DashboardScreen({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className={`bg-white p-4 ${HARD_STATIC}`}>
            <div
              style={mono}
              className="text-[10px] font-bold uppercase tracking-wide text-[#5c594f]"
            >
              {kpi.label}
            </div>
            <div style={display} className="mt-2 text-3xl font-bold tabular-nums tracking-tight">
              {kpi.value}
            </div>
            <div
              style={mono}
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold tabular-nums"
            >
              {kpi.up ? (
                <Plus className="h-3 w-3" style={{ color: C.accent }} aria-hidden />
              ) : (
                <Minus className="h-3 w-3 text-[#5c594f]" aria-hidden />
              )}
              <span style={{ color: kpi.up ? C.accent : C.sub }}>{kpi.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 style={display} className="text-2xl font-bold tracking-tight">
            Aanbevolen opdrachten
          </h2>
          <span
            style={mono}
            className="text-[11px] font-bold uppercase tracking-wide text-[#5c594f]"
          >
            Top 3
          </span>
        </div>
        <div className="space-y-3">
          {OPDRACHTEN.slice(0, 3).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={onOpen}
              className={`flex w-full items-center gap-4 bg-white px-4 py-3.5 text-left ${HARD}`}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold">{o.titel}</div>
                <div
                  style={mono}
                  className="mt-0.5 truncate text-[11px] font-medium text-[#5c594f]"
                >
                  {o.opdrachtgever} · {o.plaats} · {o.tarief}
                </div>
              </div>
              <span
                className="flex h-11 w-12 shrink-0 items-center justify-center border-2 border-[#101010] text-[14px] font-bold tabular-nums"
                style={{ ...mono, background: C.accent, color: "#fff" }}
              >
                {o.match}
              </span>
              <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 style={display} className="mb-4 text-2xl font-bold tracking-tight">
          Acties
        </h2>
        <div className="space-y-3">
          {ACTIES.map((a) => {
            const warning = a.urgentie === "warning";
            return (
              <div
                key={a.titel}
                className={`flex items-start gap-3 bg-white p-4 ${HARD_STATIC}`}
                style={warning ? { background: "#fde68a" } : undefined}
              >
                {warning ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                ) : (
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#5c594f]" aria-hidden />
                )}
                <div className="min-w-0">
                  <div className="text-[13px] font-bold">{a.titel}</div>
                  <p className="mt-0.5 text-[12px] font-medium leading-snug text-[#5c594f]">
                    {a.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------- Marktplaats */

function MarktplaatsScreen({ onOpen }: { onOpen: () => void }) {
  const filters = ["Alle", "≥85% match", "Utrecht", "Avond"];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2.5">
        {filters.map((f, i) => (
          <button
            key={f}
            type="button"
            aria-pressed={i === 0}
            className={[
              "border-2 border-[#101010] px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf9f4]",
              i === 0
                ? "bg-[#101010] text-white shadow-[3px_3px_0_0_#16a34a]"
                : "bg-white text-[#5c594f] shadow-[3px_3px_0_0_#101010] transition-all duration-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#101010]",
            ].join(" ")}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {OPDRACHTEN.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={onOpen}
            className={`flex w-full flex-col gap-3 bg-white px-4 py-4 text-left sm:flex-row sm:items-center ${HARD}`}
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-bold">{o.titel}</div>
              <div style={mono} className="mt-1 truncate text-[11px] font-medium text-[#5c594f]">
                {o.opdrachtgever} · {o.plaats} · {o.uren} · {o.tarief}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    style={mono}
                    className="border-2 border-[#101010] bg-[#fbf9f4] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <span
              className="flex h-12 w-14 shrink-0 items-center justify-center self-start border-2 border-[#101010] text-[15px] font-bold tabular-nums sm:self-center"
              style={{ ...mono, background: C.accent, color: "#fff" }}
            >
              {o.match}
            </span>
          </button>
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
      <div className={`bg-white p-5 ${HARD_STATIC}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span
              style={mono}
              className="text-[11px] font-bold uppercase tracking-wide text-[#5c594f]"
            >
              {o.id}
            </span>
            <h2 style={display} className="mt-1 text-2xl font-bold leading-tight tracking-tight">
              {o.titel}
            </h2>
            <div style={mono} className="mt-2 text-[12px] font-medium text-[#5c594f]">
              {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren} · {o.start}
            </div>
          </div>
          <div
            className="flex shrink-0 flex-col items-center border-2 border-[#101010] px-4 py-3"
            style={{ background: C.accent, color: "#fff" }}
          >
            <span style={mono} className="text-[10px] font-bold uppercase tracking-wide">
              Match
            </span>
            <span style={display} className="text-4xl font-bold tabular-nums leading-none">
              {o.match}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className={`bg-white p-4 ${HARD_STATIC}`}>
          <div
            className="mb-3 inline-flex items-center gap-1.5 border-2 border-[#101010] px-2 py-0.5"
            style={{ background: C.accent, color: "#fff" }}
          >
            <Check className="h-3.5 w-3.5" aria-hidden />
            <span style={mono} className="text-[10px] font-bold uppercase tracking-wide">
              Waarom dit past
            </span>
          </div>
          <ul className="space-y-2.5">
            {o.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[13px] font-medium">
                <Plus className="mt-0.5 h-4 w-4 shrink-0" style={{ color: C.accent }} aria-hidden />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={`bg-white p-4 ${HARD_STATIC}`}>
          <div className="mb-3 inline-flex items-center gap-1.5 border-2 border-[#101010] bg-[#fde68a] px-2 py-0.5">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            <span style={mono} className="text-[10px] font-bold uppercase tracking-wide">
              Let op
            </span>
          </div>
          <ul className="space-y-2.5">
            {o.redenen.min.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[13px] font-medium">
                <Minus className="mt-0.5 h-4 w-4 shrink-0" style={{ color: C.warn }} aria-hidden />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 border-2 border-[#101010] px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_#101010] transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#101010] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf9f4]"
          style={{ background: C.accent }}
        >
          Reageer op opdracht
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          className={`inline-flex items-center gap-2 bg-white px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide ${HARD}`}
        >
          <Bookmark className="h-4 w-4" aria-hidden />
          Bewaar
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Verificatie */

function VerificatieScreen() {
  return (
    <div className="space-y-5">
      <div
        className="flex items-center gap-3 border-2 border-[#101010] p-4 shadow-[4px_4px_0_0_#16a34a]"
        style={{ background: "#fff" }}
      >
        <span
          className="flex h-10 w-10 items-center justify-center border-2 border-[#101010]"
          style={{ background: C.accent, color: "#fff" }}
          aria-hidden
        >
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <div
            style={mono}
            className="text-[10px] font-bold uppercase tracking-wide text-[#5c594f]"
          >
            Vertrouwensniveau
          </div>
          <div style={display} className="text-xl font-bold tracking-tight">
            {PROFIEL.trust}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {CREDENTIALS.map((c) => {
          const v = statusVisual(c.status);
          return (
            <div key={c.naam} className={`flex items-center gap-3 bg-white p-4 ${HARD_STATIC}`}>
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#101010]"
                style={{ background: v.bg, color: v.fg }}
                aria-hidden
              >
                {v.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold">{c.naam}</div>
                <div className="truncate text-[11px] font-medium text-[#5c594f]">{c.detail}</div>
              </div>
              <StatusBlock status={c.status} />
            </div>
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
    <div className="space-y-4">
      {ordered.map((a) => {
        const warning = a.urgentie === "warning";
        return (
          <div
            key={a.titel}
            className={`flex items-start gap-3.5 p-4 ${HARD_STATIC}`}
            style={{ background: warning ? "#fde68a" : "#fff" }}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-[#101010]"
              style={{ background: warning ? C.warn : "#fff", color: warning ? "#fff" : C.ink }}
              aria-hidden
            >
              {warning ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-bold">{a.titel}</div>
              <p className="mt-0.5 text-[12px] font-medium leading-snug text-[#5c594f]">
                {a.detail}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 self-center border-2 border-[#101010] bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide shadow-[3px_3px_0_0_#101010] transition-all duration-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#101010] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf9f4]"
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
  const map: Record<string, { bg: string; fg: string }> = {
    Betaald: { bg: C.accent, fg: "#fff" },
    Openstaand: { bg: "#fde68a", fg: C.ink },
    Concept: { bg: "#fff", fg: C.sub },
  };
  const v = map[status] ?? { bg: "#fff", fg: C.sub };
  return (
    <span
      className="inline-block border-2 border-[#101010] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      style={{ ...mono, background: v.bg, color: v.fg }}
    >
      {status}
    </span>
  );
}

function FacturenScreen() {
  return (
    <div className={`overflow-x-auto bg-white ${HARD_STATIC}`}>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-[#101010]">
            {["Nr", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
              <th
                key={h}
                style={mono}
                className={[
                  "px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-[#5c594f]",
                  i === 3 ? "text-right" : "",
                ].join(" ")}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FACTUREN.map((f, i) => (
            <tr key={f.nr} className={i > 0 ? "border-t-2 border-[#101010]" : ""}>
              <td style={mono} className="px-4 py-3 text-[12px] font-bold tabular-nums">
                {f.nr}
              </td>
              <td className="px-4 py-3 text-[13px] font-medium">{f.klant}</td>
              <td
                style={mono}
                className="px-4 py-3 text-[12px] font-medium tabular-nums text-[#5c594f]"
              >
                {f.datum}
              </td>
              <td style={mono} className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">
                {f.bedrag}
              </td>
              <td className="px-4 py-3">
                <FactuurChip status={f.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
