"use client";

// Concept 05 — "Krijt": refined neo-brutalism. Paper + ink, 2px black borders,
// hard offset shadows, oversized confident type, one electric lime accent.
// Bold but kept professional & legible for the care sector.

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

const display = { fontFamily: "var(--font-lab-space)" } as const;
const mono = { fontFamily: "var(--font-lab-mono)" } as const;

const PAPER = "#fbfaf6";
const INK = "#111111";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={mono}
      className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-500"
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ Sparkline */

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 64;
  const h = 22;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" aria-hidden>
      <polyline points={pts} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

export function Concept05() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      style={{ backgroundColor: PAPER, color: INK }}
      className="min-h-[640px] w-full antialiased [color-scheme:light]"
    >
      <div className="flex min-h-[640px] w-full flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="hidden w-[236px] shrink-0 flex-col border-r-2 border-[#111] p-4 md:flex">
          <div className="flex items-center gap-2.5">
            <span
              style={display}
              className="flex h-10 w-10 items-center justify-center border-2 border-[#111] bg-[#84cc16] text-lg font-bold text-[#111] shadow-[3px_3px_0_#111]"
              aria-hidden
            >
              Z
            </span>
            <span style={display} className="text-[16px] font-bold tracking-tight">
              KRIJT
            </span>
          </div>

          <nav className="mt-6 flex flex-1 flex-col gap-2" aria-label="Hoofdnavigatie">
            {SCREENS.map((s) => {
              const active = s.key === screen;
              return (
                <button
                  key={s.key}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => setScreen(s.key)}
                  className={[
                    "border-2 px-3 py-2 text-left text-[13px] font-semibold transition-all duration-150 motion-reduce:transition-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfaf6]",
                    active
                      ? "border-[#111] bg-[#84cc16] text-[#111] shadow-[3px_3px_0_#111]"
                      : "border-transparent text-neutral-600 hover:border-[#111] hover:bg-white",
                  ].join(" ")}
                >
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-6 border-2 border-[#111] bg-white p-3 shadow-[4px_4px_0_#111]">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" aria-hidden />
              <Label>VOG verloopt</Label>
            </div>
            <p className="mt-2 text-[12px] font-medium leading-snug">
              Nog{" "}
              <span style={mono} className="text-[#111]">
                23
              </span>{" "}
              dagen geldig.
            </p>
            <button
              type="button"
              onClick={() => setScreen("acties")}
              className="mt-3 w-full border-2 border-[#111] bg-[#84cc16] px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide text-[#111] shadow-[2px_2px_0_#111] transition-all duration-150 hover:shadow-[3px_3px_0_#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none motion-reduce:transition-none motion-reduce:active:translate-x-0 motion-reduce:active:translate-y-0"
            >
              Vernieuwen
            </button>
          </div>
        </aside>

        {/* Right column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="flex items-center gap-3 border-b-2 border-[#111] px-4 py-3">
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 border-2 border-[#111] bg-white px-3 py-2 text-left text-[13px] font-medium text-neutral-500 transition-shadow hover:shadow-[2px_2px_0_#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 sm:max-w-sm"
            >
              <Search className="h-4 w-4 shrink-0 text-[#111]" aria-hidden />
              <span className="truncate">Zoek opdrachten…</span>
            </button>

            <button
              type="button"
              aria-label="Meldingen"
              className="relative border-2 border-[#111] bg-white p-2 transition-shadow hover:shadow-[2px_2px_0_#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2"
            >
              <Bell className="h-4 w-4" aria-hidden />
              <span
                className="absolute -right-1.5 -top-1.5 h-3 w-3 border-2 border-[#111] bg-[#84cc16]"
                aria-hidden
              />
            </button>

            <div className="flex items-center gap-2">
              <span
                style={mono}
                className="flex h-9 w-9 items-center justify-center border-2 border-[#111] bg-[#84cc16] text-[11px] font-bold text-[#111]"
                aria-hidden
              >
                {PROFIEL.initialen}
              </span>
              <div className="hidden leading-tight sm:block">
                <div style={display} className="text-[12px] font-bold">
                  {PROFIEL.naam}
                </div>
                <div className="text-[11px] text-neutral-500">{PROFIEL.plaats}</div>
              </div>
            </div>
          </header>

          {/* Mobile tabs */}
          <div
            className="flex gap-2 overflow-x-auto border-b-2 border-[#111] px-4 py-2 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
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
                    "shrink-0 border-2 border-[#111] px-3 py-1 text-[12px] font-semibold transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-1",
                    active ? "bg-[#84cc16] text-[#111]" : "bg-white text-neutral-600",
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

function Dashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((kpi) => (
          <div
            key={kpi.label}
            className="border-2 border-[#111] bg-white p-4 shadow-[4px_4px_0_#111]"
          >
            <Label>{kpi.label}</Label>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div style={display} className="text-2xl font-bold tracking-tight">
                {kpi.value}
              </div>
              <Sparkline data={kpi.spark} />
            </div>
            <div
              style={mono}
              className={[
                "mt-1.5 inline-block border-2 border-[#111] px-1.5 py-0.5 text-[10px] font-bold",
                kpi.up ? "bg-[#84cc16]" : "bg-white",
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
          <h2 style={display} className="text-[16px] font-bold tracking-tight">
            Aanbevolen opdrachten
          </h2>
          <Label>Top 3</Label>
        </div>
        <div className="space-y-3">
          {OPDRACHTEN.slice(0, 3).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={onOpen}
              className="group flex w-full items-center gap-4 border-2 border-[#111] bg-white p-4 text-left transition-all duration-150 hover:shadow-[4px_4px_0_#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              <div className="min-w-0 flex-1">
                <div style={display} className="truncate text-[14px] font-bold">
                  {o.titel}
                </div>
                <div style={mono} className="mt-0.5 truncate text-[11px] text-neutral-500">
                  {o.opdrachtgever} · {o.plaats} · {o.tarief}
                </div>
              </div>
              <span
                style={mono}
                className="shrink-0 border-2 border-[#111] bg-[#84cc16] px-2 py-1 text-[13px] font-bold"
              >
                {o.match}%
              </span>
              <ArrowUpRight
                className="h-5 w-5 shrink-0 transition-transform duration-150 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                aria-hidden
              />
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 style={display} className="mb-3 text-[16px] font-bold tracking-tight">
          Acties
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {ACTIES.map((a) => (
            <div key={a.titel} className="border-2 border-[#111] bg-white p-4">
              <div className="flex items-center gap-1.5">
                {a.urgentie === "warning" ? (
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                ) : (
                  <Clock className="h-4 w-4" aria-hidden />
                )}
                <Label>{a.urgentie === "warning" ? "Urgent" : "Tip"}</Label>
              </div>
              <div style={display} className="mt-2 text-[13px] font-bold leading-snug">
                {a.titel}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">{a.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------- Marktplaats */

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const filters = ["Alle", "≥ 85% match", "Utrecht", "Avond"];
  const [active, setActive] = useState(0);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2.5">
        {filters.map((f, i) => (
          <button
            key={f}
            type="button"
            aria-pressed={i === active}
            onClick={() => setActive(i)}
            className={[
              "border-2 border-[#111] px-3 py-1.5 text-[12px] font-bold transition-all duration-150 motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2",
              i === active
                ? "bg-[#84cc16] text-[#111] shadow-[3px_3px_0_#111]"
                : "bg-white text-neutral-600 hover:shadow-[2px_2px_0_#111]",
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
            className="flex w-full flex-col gap-3 border-2 border-[#111] bg-white p-4 text-left transition-all duration-150 hover:shadow-[4px_4px_0_#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 motion-reduce:transition-none sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <div style={display} className="truncate text-[14px] font-bold">
                {o.titel}
              </div>
              <div style={mono} className="mt-0.5 truncate text-[11px] text-neutral-500">
                {o.opdrachtgever} · {o.plaats} · {o.uren} · {o.tarief}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    style={mono}
                    className="border-2 border-[#111] bg-[#fbfaf6] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <span
              style={mono}
              className="shrink-0 self-start border-2 border-[#111] bg-[#84cc16] px-2.5 py-1 text-[14px] font-bold sm:self-center"
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
        className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-neutral-600 transition-colors hover:text-[#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Terug
      </button>

      <div className="border-2 border-[#111] bg-white p-5 shadow-[4px_4px_0_#111]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Label>{o.id}</Label>
            <h2 style={display} className="mt-1 text-xl font-bold tracking-tight">
              {o.titel}
            </h2>
            <div style={mono} className="mt-1 text-[12px] text-neutral-500">
              {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren} · {o.start}
            </div>
          </div>
          <div className="shrink-0 border-2 border-[#111] bg-[#84cc16] px-3 py-2 text-center">
            <Label>Match</Label>
            <div style={display} className="text-2xl font-bold leading-none">
              {o.match}%
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border-2 border-[#111] bg-white p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <Check className="h-4 w-4" aria-hidden />
            <Label>Waarom dit past</Label>
          </div>
          <ul className="space-y-2.5">
            {o.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[12px] font-medium">
                <span
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border-2 border-[#111] bg-[#84cc16]"
                  aria-hidden
                >
                  <Check className="h-2.5 w-2.5" />
                </span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-2 border-[#111] bg-white p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            <Label>Let op</Label>
          </div>
          <ul className="space-y-2.5">
            {o.redenen.min.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[12px] font-medium">
                <span
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border-2 border-[#111] bg-white"
                  aria-hidden
                >
                  <X className="h-2.5 w-2.5" />
                </span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setApplied(true)}
          className={[
            "flex items-center gap-2 border-2 border-[#111] px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide shadow-[4px_4px_0_#111] transition-all duration-150",
            "hover:shadow-[5px_5px_0_#111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#111]",
            "motion-reduce:transition-none motion-reduce:active:translate-x-0 motion-reduce:active:translate-y-0",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2",
            applied ? "bg-[#111] text-[#84cc16]" : "bg-[#84cc16] text-[#111]",
          ].join(" ")}
        >
          {applied ? (
            <>
              <Check className="h-4 w-4" aria-hidden /> Verstuurd
            </>
          ) : (
            "Reageer op opdracht"
          )}
        </button>
        <button
          type="button"
          onClick={() => setSaved((s) => !s)}
          className="flex items-center gap-2 border-2 border-[#111] bg-white px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide transition-all duration-150 hover:shadow-[3px_3px_0_#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none motion-reduce:transition-none motion-reduce:active:translate-x-0 motion-reduce:active:translate-y-0"
        >
          <Bookmark className={["h-4 w-4", saved ? "fill-[#84cc16]" : ""].join(" ")} aria-hidden />
          {saved ? "Bewaard" : "Bewaar"}
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Verificatie */

const SEAL: Record<CredStatus, { bg: string; icon: React.ReactNode; label: string }> = {
  VERIFIED: {
    bg: "bg-[#84cc16]",
    icon: <Check className="h-4 w-4" aria-hidden />,
    label: "Geverifieerd",
  },
  EXPIRING: {
    bg: "bg-amber-300",
    icon: <AlertTriangle className="h-4 w-4" aria-hidden />,
    label: "Verloopt binnenkort",
  },
  SUBMITTED: {
    bg: "bg-white",
    icon: <Clock className="h-4 w-4" aria-hidden />,
    label: "In beoordeling",
  },
  REJECTED: {
    bg: "bg-rose-300",
    icon: <X className="h-4 w-4" aria-hidden />,
    label: "Afgewezen",
  },
};

function Verificatie() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 border-2 border-[#111] bg-white p-4 shadow-[4px_4px_0_#111]">
        <span className="flex h-12 w-12 items-center justify-center border-2 border-[#111] bg-[#84cc16]">
          <ShieldCheck className="h-6 w-6" aria-hidden />
        </span>
        <div className="flex-1">
          <div style={display} className="text-[16px] font-bold tracking-tight">
            {PROFIEL.trust}
          </div>
          <div className="text-[12px] text-neutral-600">3 van 4 documenten geverifieerd.</div>
        </div>
        <span style={mono} className="hidden text-[18px] font-bold sm:block">
          75%
        </span>
      </div>

      <div className="space-y-3">
        {CREDENTIALS.map((c) => {
          const s = SEAL[c.status];
          return (
            <div
              key={c.naam}
              className="flex items-center gap-3.5 border-2 border-[#111] bg-white p-4"
            >
              <span
                className={[
                  "flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#111]",
                  s.bg,
                ].join(" ")}
              >
                {s.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div style={display} className="truncate text-[13px] font-bold">
                  {c.naam}
                </div>
                <div className="truncate text-[11px] text-neutral-500">{c.detail}</div>
              </div>
              <span
                style={mono}
                className="shrink-0 border-2 border-[#111] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
              >
                {s.label}
              </span>
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
    <div className="grid gap-4 sm:grid-cols-2">
      {ordered.map((a) => {
        const warning = a.urgentie === "warning";
        return (
          <div
            key={a.titel}
            className="flex flex-col border-2 border-[#111] bg-white p-5 shadow-[4px_4px_0_#111]"
          >
            <div className="flex items-center gap-1.5">
              {warning ? (
                <AlertTriangle className="h-4 w-4" aria-hidden />
              ) : (
                <Clock className="h-4 w-4" aria-hidden />
              )}
              <Label>{warning ? "Urgent" : "Tip"}</Label>
            </div>
            <div style={display} className="mt-2 text-[15px] font-bold leading-snug">
              {a.titel}
            </div>
            <p className="mt-1.5 flex-1 text-[12px] leading-relaxed text-neutral-600">{a.detail}</p>
            <button
              type="button"
              className={[
                "mt-4 border-2 border-[#111] px-4 py-2 text-[12px] font-bold uppercase tracking-wide shadow-[3px_3px_0_#111] transition-all duration-150",
                "hover:shadow-[4px_4px_0_#111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
                "motion-reduce:transition-none motion-reduce:active:translate-x-0 motion-reduce:active:translate-y-0",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2",
                warning ? "bg-amber-300 text-[#111]" : "bg-[#84cc16] text-[#111]",
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
    Betaald: "bg-[#84cc16]",
    Openstaand: "bg-amber-300",
    Concept: "bg-white",
  };
  return (
    <span
      style={mono}
      className={[
        "inline-block border-2 border-[#111] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        map[status] ?? "bg-white",
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function Facturen() {
  return (
    <div className="border-2 border-[#111] bg-white shadow-[4px_4px_0_#111]">
      <div className="border-b-2 border-[#111] px-5 py-3.5">
        <h2 style={display} className="text-[16px] font-bold tracking-tight">
          Facturen
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-[#111]">
              <th className="px-5 py-2.5">
                <Label>Nr</Label>
              </th>
              <th className="px-5 py-2.5">
                <Label>Klant</Label>
              </th>
              <th className="px-5 py-2.5">
                <Label>Datum</Label>
              </th>
              <th className="px-5 py-2.5 text-right">
                <Label>Bedrag</Label>
              </th>
              <th className="px-5 py-2.5">
                <Label>Status</Label>
              </th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => (
              <tr key={f.nr} className={i > 0 ? "border-t-2 border-[#111]" : ""}>
                <td style={mono} className="px-5 py-3.5 text-[12px] font-medium">
                  {f.nr}
                </td>
                <td className="px-5 py-3.5 text-[13px] font-semibold">{f.klant}</td>
                <td style={mono} className="px-5 py-3.5 text-[12px] text-neutral-500">
                  {f.datum}
                </td>
                <td style={mono} className="px-5 py-3.5 text-right text-[13px] font-bold">
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
