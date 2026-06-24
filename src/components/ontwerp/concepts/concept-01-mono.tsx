"use client";

// Concept 01 — "Stille Precisie": ultra-minimal mono (Vercel/Geist school).
// Self-contained mini-app: app shell + internal screen tabs over the platform's core screens.
// Frontend only, mock data. Color appears only where status demands it.

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

const mono = { fontFamily: "var(--font-lab-geist-mono)" } as const;
const sans = { fontFamily: "var(--font-lab-geist)" } as const;

// Map the sidebar nav labels onto the internal screens where they overlap.
const NAV_TO_SCREEN: Partial<Record<(typeof NAV)[number], ScreenKey>> = {
  Dashboard: "dashboard",
  Marktplaats: "marktplaats",
  Reacties: "acties",
  Verificatie: "verificatie",
  Facturen: "facturen",
};

function MonoLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={mono}
      className="text-[10px] uppercase tabular-nums tracking-[0.12em] text-neutral-500"
    >
      {children}
    </span>
  );
}

export function Concept01() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      style={sans}
      className="flex min-h-[640px] w-full bg-white text-[#171717] antialiased [color-scheme:light]"
    >
      {/* Sidebar */}
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-neutral-200 md:flex">
        <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-4">
          <span
            style={mono}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-[#171717] text-sm font-semibold text-white"
            aria-hidden
          >
            Z
          </span>
          <span className="text-[13px] font-medium tracking-tight">ZorgBemiddeling</span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Hoofdnavigatie">
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
                  "flex items-center justify-between rounded-md px-3 py-2 text-left text-[13px] transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b6cf6]/40",
                  active
                    ? "bg-neutral-100 font-medium text-[#171717]"
                    : "text-neutral-500 hover:bg-neutral-50 hover:text-[#171717] disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-neutral-400",
                ].join(" ")}
              >
                <span>{item}</span>
                {active && <ChevronRight className="h-3.5 w-3.5 text-neutral-400" aria-hidden />}
              </button>
            );
          })}
        </nav>

        <div className="m-2 rounded-md border border-[#b45309]/30 bg-[#b45309]/[0.04] p-3">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-[#b45309]" aria-hidden />
            <MonoLabel>VOG verloopt</MonoLabel>
          </div>
          <p className="mt-1.5 text-[12px] leading-snug text-neutral-600">
            Nog{" "}
            <span style={mono} className="font-medium tabular-nums text-[#171717]">
              23
            </span>{" "}
            dagen geldig.
          </p>
          <button
            type="button"
            onClick={() => setScreen("acties")}
            className="mt-2 text-[12px] font-medium text-[#b45309] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b45309]/40"
          >
            Vernieuwen
          </button>
        </div>
      </aside>

      {/* Right column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-left text-[13px] text-neutral-500 transition-colors hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b6cf6]/40 sm:max-w-md"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">Zoek of spring naar…</span>
            <kbd
              style={mono}
              className="ml-auto hidden shrink-0 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] tabular-nums text-neutral-500 sm:inline"
            >
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            aria-label="Meldingen"
            className="relative rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-[#171717] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b6cf6]/40"
          >
            <Bell className="h-4 w-4" aria-hidden />
            <span
              className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#2b6cf6]"
              aria-hidden
            />
          </button>

          <div className="flex items-center gap-2">
            <span
              style={mono}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-[11px] font-medium tabular-nums text-[#171717]"
              aria-hidden
            >
              {PROFIEL.initialen}
            </span>
            <div className="hidden leading-tight sm:block">
              <div className="text-[12px] font-medium">{PROFIEL.naam}</div>
              <div className="text-[11px] text-neutral-500">{PROFIEL.plaats}</div>
            </div>
          </div>
        </header>

        {/* Screen tabs */}
        <div className="border-b border-neutral-200">
          <div
            className="flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                  aria-current={active ? "page" : undefined}
                  aria-selected={active}
                  onClick={() => setScreen(s.key)}
                  className={[
                    "relative shrink-0 px-3 py-3 text-[13px] transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b6cf6]/40",
                    active ? "font-medium text-[#171717]" : "text-neutral-500 hover:text-[#171717]",
                  ].join(" ")}
                >
                  {s.label}
                  <span
                    aria-hidden
                    className={[
                      "absolute inset-x-3 bottom-0 h-px transition-colors duration-150",
                      active ? "bg-[#171717]" : "bg-transparent",
                    ].join(" ")}
                  />
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
      <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-neutral-200 lg:grid-cols-4">
        {KPIS.map((kpi, i) => (
          <div
            key={kpi.label}
            className={[
              "p-4",
              i % 2 === 1 ? "border-l border-neutral-200" : "",
              "lg:border-l lg:[&:first-child]:border-l-0",
              i >= 2 ? "border-t border-neutral-200 lg:border-t-0" : "",
            ].join(" ")}
          >
            <MonoLabel>{kpi.label}</MonoLabel>
            <div style={mono} className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
              {kpi.value}
            </div>
            <div
              style={mono}
              className={[
                "mt-1 text-[11px] tabular-nums",
                kpi.up ? "text-[#15803d]" : "text-neutral-500",
              ].join(" ")}
            >
              {kpi.up ? "▲ " : "• "}
              {kpi.trend}
            </div>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[13px] font-medium">Aanbevolen opdrachten</h2>
          <MonoLabel>Top 3</MonoLabel>
        </div>
        <div className="overflow-hidden rounded-lg border border-neutral-200">
          {OPDRACHTEN.slice(0, 3).map((o, i) => (
            <button
              key={o.id}
              type="button"
              onClick={onOpen}
              className={[
                "flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-neutral-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2b6cf6]/40",
                i > 0 ? "border-t border-neutral-200" : "",
              ].join(" ")}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{o.titel}</div>
                <div
                  style={mono}
                  className="mt-0.5 truncate text-[11px] tabular-nums text-neutral-500"
                >
                  {o.opdrachtgever} · {o.plaats} · {o.tarief}
                </div>
              </div>
              <span
                style={mono}
                className="shrink-0 text-[13px] font-semibold tabular-nums text-[#2b6cf6]"
              >
                {o.match}%
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[13px] font-medium">Acties</h2>
        <div className="space-y-2">
          {ACTIES.map((a) => (
            <div key={a.titel} className="flex items-start gap-2.5 text-[12px]">
              <span
                aria-hidden
                className={[
                  "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                  a.urgentie === "warning" ? "bg-[#b45309]" : "bg-neutral-300",
                ].join(" ")}
              />
              <div>
                <span className="font-medium">{a.titel}</span>
                <span className="text-neutral-500"> — {a.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------- Marktplaats */

function MarktplaatsScreen({ onOpen }: { onOpen: () => void }) {
  const filters = ["Alle", "≥85% match", "Utrecht", "Avond"];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f, i) => (
          <button
            key={f}
            type="button"
            aria-pressed={i === 0}
            className={[
              "rounded-full px-3 py-1 text-[12px] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b6cf6]/40",
              i === 0
                ? "border border-[#171717] bg-[#171717] text-white"
                : "border border-neutral-200 text-neutral-600 hover:border-neutral-300",
            ].join(" ")}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200">
        {OPDRACHTEN.map((o, i) => (
          <button
            key={o.id}
            type="button"
            onClick={onOpen}
            className={[
              "flex w-full flex-col gap-2 px-4 py-3.5 text-left transition-colors hover:bg-neutral-50 sm:flex-row sm:items-center",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2b6cf6]/40",
              i > 0 ? "border-t border-neutral-200" : "",
            ].join(" ")}
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{o.titel}</div>
              <div
                style={mono}
                className="mt-0.5 truncate text-[11px] tabular-nums text-neutral-500"
              >
                {o.opdrachtgever} · {o.plaats} · {o.uren} · {o.tarief}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    style={mono}
                    className="rounded border border-neutral-200 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-neutral-500"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <span
              style={mono}
              className="shrink-0 self-start text-[13px] font-semibold tabular-nums text-[#2b6cf6] sm:self-center"
            >
              {o.match}%
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
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <MonoLabel>{o.id}</MonoLabel>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">{o.titel}</h2>
          <div style={mono} className="mt-1 text-[12px] tabular-nums text-neutral-500">
            {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren} · {o.start}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <MonoLabel>Match</MonoLabel>
          <div style={mono} className="text-3xl font-semibold tabular-nums text-[#2b6cf6]">
            {o.match}%
          </div>
        </div>
      </div>

      <div className="grid gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 sm:grid-cols-2">
        <div className="bg-white p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-[#15803d]" aria-hidden />
            <MonoLabel>Waarom dit past</MonoLabel>
          </div>
          <ul className="space-y-2">
            {o.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[12px] text-neutral-700">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#15803d]" aria-hidden />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-[#b45309]" aria-hidden />
            <MonoLabel>Let op</MonoLabel>
          </div>
          <ul className="space-y-2">
            {o.redenen.min.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[12px] text-neutral-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b45309]" aria-hidden />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md bg-[#2b6cf6] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#1f5ce0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b6cf6]/40 focus-visible:ring-offset-2"
        >
          Reageer op opdracht
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-4 py-2 text-[13px] font-medium text-neutral-700 transition-colors hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b6cf6]/40"
        >
          <Bookmark className="h-3.5 w-3.5" aria-hidden />
          Bewaar
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Verificatie */

function StatusSeal({ status }: { status: CredStatus }) {
  const config: Record<CredStatus, { ring: string; icon: React.ReactNode }> = {
    VERIFIED: {
      ring: "border-[#15803d]/30 text-[#15803d]",
      icon: <Check className="h-3.5 w-3.5" aria-hidden />,
    },
    EXPIRING: {
      ring: "border-[#b45309]/30 text-[#b45309]",
      icon: <AlertTriangle className="h-3.5 w-3.5" aria-hidden />,
    },
    SUBMITTED: {
      ring: "border-neutral-300 text-neutral-500",
      icon: <Clock className="h-3.5 w-3.5" aria-hidden />,
    },
    REJECTED: {
      ring: "border-[#b91c1c]/30 text-[#b91c1c]",
      icon: <X className="h-3.5 w-3.5" aria-hidden />,
    },
  };
  const c = config[status];
  return (
    <span
      className={[
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ring-2 ring-inset ring-white",
        c.ring,
      ].join(" ")}
    >
      {c.icon}
    </span>
  );
}

const STATUS_LABEL: Record<CredStatus, string> = {
  VERIFIED: "Geverifieerd",
  EXPIRING: "Verloopt binnenkort",
  SUBMITTED: "In beoordeling",
  REJECTED: "Afgewezen",
};

function VerificatieScreen() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-3">
        <ShieldCheck className="h-4 w-4 text-[#15803d]" aria-hidden />
        <span className="text-[13px] font-medium">Vertrouwensniveau: Hoog</span>
        <span
          style={mono}
          className="ml-auto text-[11px] uppercase tabular-nums tracking-wide text-neutral-500"
        >
          {PROFIEL.trust}
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200">
        {CREDENTIALS.map((c, i) => (
          <div
            key={c.naam}
            className={[
              "flex items-center gap-3 px-4 py-3",
              i > 0 ? "border-t border-neutral-200" : "",
            ].join(" ")}
          >
            <StatusSeal status={c.status} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{c.naam}</div>
              <div className="truncate text-[11px] text-neutral-500">{c.detail}</div>
            </div>
            <span
              style={mono}
              className="shrink-0 text-[10px] uppercase tabular-nums tracking-wide text-neutral-500"
            >
              {STATUS_LABEL[c.status]}
            </span>
          </div>
        ))}
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
        const warning = a.urgentie === "warning";
        return (
          <div key={a.titel} className="flex overflow-hidden rounded-lg border border-neutral-200">
            <span
              aria-hidden
              className={["w-1 shrink-0", warning ? "bg-[#b45309]" : "bg-neutral-200"].join(" ")}
            />
            <div className="flex flex-1 items-start gap-3 p-4">
              {warning ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#b45309]" aria-hidden />
              ) : (
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium">{a.titel}</div>
                <p className="mt-0.5 text-[12px] leading-snug text-neutral-500">{a.detail}</p>
              </div>
              <button
                type="button"
                className={[
                  "shrink-0 text-[12px] font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b6cf6]/40",
                  warning ? "text-[#b45309]" : "text-[#2b6cf6]",
                ].join(" ")}
              >
                {a.cta}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------- Facturen */

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    Betaald: "border-[#15803d]/30 bg-[#15803d]/[0.06] text-[#15803d]",
    Openstaand: "border-[#b45309]/30 bg-[#b45309]/[0.06] text-[#b45309]",
    Concept: "border-neutral-200 bg-neutral-50 text-neutral-500",
  };
  return (
    <span
      style={mono}
      className={[
        "inline-block rounded-full border px-2 py-0.5 text-[10px] uppercase tabular-nums tracking-wide",
        map[status] ?? "border-neutral-200 text-neutral-500",
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function FacturenScreen() {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-neutral-200">
            <th
              style={mono}
              className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-500"
            >
              Nr
            </th>
            <th
              className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-500"
              style={mono}
            >
              Klant
            </th>
            <th
              className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-500"
              style={mono}
            >
              Datum
            </th>
            <th
              style={mono}
              className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-500"
            >
              Bedrag
            </th>
            <th
              className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-500"
              style={mono}
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {FACTUREN.map((f, i) => (
            <tr key={f.nr} className={i > 0 ? "border-t border-neutral-200" : ""}>
              <td style={mono} className="px-4 py-3 text-[12px] tabular-nums text-neutral-700">
                {f.nr}
              </td>
              <td className="px-4 py-3 text-[13px]">{f.klant}</td>
              <td style={mono} className="px-4 py-3 text-[12px] tabular-nums text-neutral-500">
                {f.datum}
              </td>
              <td
                style={mono}
                className="px-4 py-3 text-right text-[13px] font-medium tabular-nums"
              >
                {f.bedrag}
              </td>
              <td className="px-4 py-3">
                <StatusChip status={f.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
