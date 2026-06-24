"use client";

// Concept 06 — "Nacht": premium-dark cockpit (Linear/Raycast school).
// Donker oppervlak met fijne elevatieschaal, hairline borders op lage opacity en
// een low-chroma indigo-accent. Het ⌘K command-palet is de navigatieruggengraat:
// een vaste knop in de topbar plus een gestileerde overlay die schermen/acties bevat.
// Kalm, snel-aanvoelend, nul ruis. Self-contained mini-app, frontend only, mock data.

import { useState } from "react";
import {
  Bell,
  Command,
  Bookmark,
  Check,
  AlertTriangle,
  Clock,
  X,
  ShieldCheck,
  ArrowUpRight,
  CornerDownLeft,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
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

// --- Dark palette (low-chroma, layered elevation) ---
const C = {
  base: "#15171f",
  surface: "#1b1e28",
  raised: "#222533",
  hairline: "rgba(255,255,255,0.08)",
  hairlineStrong: "rgba(255,255,255,0.14)",
  text: "#e7e9f0",
  sub: "#9296a8",
  faint: "#6a6e80",
  accent: "#7c93ff",
  accentSoft: "rgba(124,147,255,0.14)",
  good: "#4ade80",
  warn: "#fbbf24",
  bad: "#f87171",
} as const;

const sans = { fontFamily: "var(--font-lab-geist)" } as const;
const mono = { fontFamily: "var(--font-lab-geist-mono)" } as const;

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

function statusVisual(status: CredStatus): { color: string; icon: React.ReactNode } {
  switch (status) {
    case "VERIFIED":
      return { color: C.good, icon: <Check className="h-3.5 w-3.5" aria-hidden /> };
    case "EXPIRING":
      return { color: C.warn, icon: <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> };
    case "SUBMITTED":
      return { color: C.sub, icon: <Clock className="h-3.5 w-3.5" aria-hidden /> };
    case "REJECTED":
      return { color: C.bad, icon: <X className="h-3.5 w-3.5" aria-hidden /> };
  }
}

function hexToRgba(hex: string, alpha: number) {
  const v = hex.replace("#", "");
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function StatusPill({ status }: { status: CredStatus }) {
  const v = statusVisual(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
      style={{
        ...mono,
        color: v.color,
        borderColor: hexToRgba(v.color, 0.35),
        background: hexToRgba(v.color, 0.1),
      }}
    >
      {v.icon}
      {STATUS_LABEL[status]}
    </span>
  );
}

/* ---------------------------------------------------------------------- shell */

export function Concept06() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <div
      style={{ ...sans, background: C.base, color: C.text }}
      className="relative flex min-h-[640px] w-full antialiased [color-scheme:dark]"
    >
      {/* Sidebar */}
      <aside
        className="hidden w-[224px] shrink-0 flex-col border-r md:flex"
        style={{ borderColor: C.hairline, background: C.surface }}
      >
        <div
          className="flex items-center gap-2.5 border-b px-4 py-4"
          style={{ borderColor: C.hairline }}
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-semibold"
            style={{ background: C.accent, color: C.base }}
            aria-hidden
          >
            Z
          </span>
          <span className="text-[13px] font-medium tracking-tight">ZorgBemiddeling</span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-2.5" aria-label="Hoofdnavigatie">
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
                className="flex items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  color: active ? C.text : target === undefined ? C.faint : C.sub,
                  background: active ? C.accentSoft : "transparent",
                  fontWeight: active ? 500 : 400,
                  boxShadow: active ? `inset 0 0 0 1px ${hexToRgba(C.accent, 0.3)}` : undefined,
                  // @ts-expect-error CSS custom prop for ring color
                  "--tw-ring-color": hexToRgba(C.accent, 0.5),
                  cursor: target === undefined ? "default" : undefined,
                }}
              >
                <span>{item}</span>
                {active && (
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: C.accent }}
                    aria-hidden
                  />
                )}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="m-2.5 flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{
            borderColor: C.hairline,
            color: C.sub,
            background: C.raised,
            // @ts-expect-error CSS custom prop for ring color
            "--tw-ring-color": hexToRgba(C.accent, 0.5),
          }}
        >
          <Command className="h-3.5 w-3.5" aria-hidden />
          <span>Snel navigeren</span>
          <kbd style={mono} className="ml-auto rounded border px-1 py-0.5 text-[10px]">
            ⌘K
          </kbd>
        </button>
      </aside>

      {/* Right column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header
          className="flex items-center gap-3 border-b px-4 py-3"
          style={{ borderColor: C.hairline, background: C.surface }}
        >
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13px] transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 sm:max-w-md"
            style={{
              borderColor: C.hairline,
              color: C.sub,
              background: C.raised,
              // @ts-expect-error CSS custom prop for ring color
              "--tw-ring-color": hexToRgba(C.accent, 0.5),
            }}
          >
            <Command className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">Spring naar scherm of actie…</span>
            <kbd
              style={mono}
              className="ml-auto hidden shrink-0 rounded border px-1.5 py-0.5 text-[10px] sm:inline"
            >
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            aria-label="Meldingen"
            className="relative rounded-lg p-2 transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2"
            style={{
              color: C.sub,
              background: C.raised,
              // @ts-expect-error CSS custom prop for ring color
              "--tw-ring-color": hexToRgba(C.accent, 0.5),
            }}
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
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-medium"
              style={{
                ...mono,
                background: C.raised,
                color: C.text,
                border: `1px solid ${C.hairline}`,
              }}
              aria-hidden
            >
              {PROFIEL.initialen}
            </span>
            <div className="hidden leading-tight sm:block">
              <div className="text-[12px] font-medium">{PROFIEL.naam}</div>
              <div className="text-[11px]" style={{ color: C.sub }}>
                {PROFIEL.plaats}
              </div>
            </div>
          </div>
        </header>

        {/* Screen tabs */}
        <div className="border-b" style={{ borderColor: C.hairline, background: C.surface }}>
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
                  aria-selected={active}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setScreen(s.key)}
                  className="relative shrink-0 px-3 py-3 text-[13px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: active ? C.text : C.sub,
                    fontWeight: active ? 500 : 400,
                    // @ts-expect-error CSS custom prop for ring color
                    "--tw-ring-color": hexToRgba(C.accent, 0.5),
                  }}
                >
                  {s.label}
                  <span
                    aria-hidden
                    className="absolute inset-x-3 bottom-0 h-0.5 rounded-full"
                    style={{ background: active ? C.accent : "transparent" }}
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

      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          onSelect={(key) => {
            setScreen(key);
            setPaletteOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* --------------------------------------------------------------- command palette */

function CommandPalette({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (key: ScreenKey) => void;
}) {
  const [query, setQuery] = useState("");
  const results = SCREENS.filter((s) => s.label.toLowerCase().includes(query.toLowerCase()));
  return (
    <div
      className="absolute inset-0 z-20 flex items-start justify-center px-4 pt-16 sm:pt-24"
      style={{ background: "rgba(8,9,13,0.62)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palet"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border shadow-2xl"
        style={{ background: C.surface, borderColor: C.hairlineStrong }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-2.5 border-b px-4 py-3"
          style={{ borderColor: C.hairline }}
        >
          <Command className="h-4 w-4 shrink-0" style={{ color: C.sub }} aria-hidden />
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Typ een scherm of actie…"
            aria-label="Zoek in command palet"
            className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#6a6e80]"
            style={{ color: C.text }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="rounded-md p-1 transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2"
            style={{
              color: C.sub,
              // @ts-expect-error CSS custom prop for ring color
              "--tw-ring-color": hexToRgba(C.accent, 0.5),
            }}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <ul className="max-h-72 overflow-y-auto p-2" role="listbox" aria-label="Resultaten">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-[13px]" style={{ color: C.faint }}>
              Geen resultaat voor &ldquo;{query}&rdquo;.
            </li>
          )}
          {results.map((s, i) => (
            <li key={s.key} role="option" aria-selected={i === 0}>
              <button
                type="button"
                onClick={() => onSelect(s.key)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: i === 0 ? C.accentSoft : "transparent",
                  // @ts-expect-error CSS custom prop for ring color
                  "--tw-ring-color": hexToRgba(C.accent, 0.5),
                }}
              >
                <LayoutGrid className="h-4 w-4 shrink-0" style={{ color: C.sub }} aria-hidden />
                <span>Ga naar {s.label}</span>
                {i === 0 && (
                  <span
                    className="ml-auto inline-flex items-center gap-1 text-[10px]"
                    style={{ ...mono, color: C.faint }}
                  >
                    <CornerDownLeft className="h-3 w-3" aria-hidden /> Enter
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div
          className="flex items-center gap-3 border-t px-4 py-2 text-[10px]"
          style={{ ...mono, borderColor: C.hairline, color: C.faint }}
        >
          <span>↑↓ navigeer</span>
          <span>↵ kies</span>
          <span>esc sluit</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Dashboard */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border ${className}`}
      style={{ background: C.surface, borderColor: C.hairline }}
    >
      {children}
    </div>
  );
}

function DashboardScreen({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div style={{ color: C.sub }} className="text-[11px]">
              {kpi.label}
            </div>
            <div style={mono} className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
              {kpi.value}
            </div>
            <div
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] tabular-nums"
              style={{ ...mono, color: kpi.up ? C.good : C.sub }}
            >
              {kpi.up ? (
                <TrendingUp className="h-3 w-3" aria-hidden />
              ) : (
                <TrendingDown className="h-3 w-3" aria-hidden />
              )}
              {kpi.trend}
            </div>
          </Card>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[14px] font-medium">Aanbevolen opdrachten</h2>
          <span style={{ ...mono, color: C.faint }} className="text-[11px] uppercase tracking-wide">
            Top 3
          </span>
        </div>
        <Card>
          {OPDRACHTEN.slice(0, 3).map((o, i) => (
            <button
              key={o.id}
              type="button"
              onClick={onOpen}
              className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
              style={{
                borderTop: i > 0 ? `1px solid ${C.hairline}` : undefined,
                // @ts-expect-error CSS custom prop for ring color
                "--tw-ring-color": hexToRgba(C.accent, 0.5),
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{o.titel}</div>
                <div
                  style={{ ...mono, color: C.sub }}
                  className="mt-0.5 truncate text-[11px] tabular-nums"
                >
                  {o.opdrachtgever} · {o.plaats} · {o.tarief}
                </div>
              </div>
              <span
                style={{ ...mono, color: C.accent }}
                className="shrink-0 text-[13px] font-semibold tabular-nums"
              >
                {o.match}%
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0" style={{ color: C.faint }} aria-hidden />
            </button>
          ))}
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-[14px] font-medium">Acties</h2>
        <div className="space-y-2">
          {ACTIES.map((a) => {
            const warning = a.urgentie === "warning";
            return (
              <div key={a.titel} className="flex items-start gap-2.5 text-[12px]">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: warning ? C.warn : C.faint }}
                />
                <div>
                  <span className="font-medium">{a.titel}</span>
                  <span style={{ color: C.sub }}> — {a.detail}</span>
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f, i) => (
          <button
            key={f}
            type="button"
            aria-pressed={i === 0}
            className="rounded-full border px-3 py-1 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              borderColor: i === 0 ? hexToRgba(C.accent, 0.4) : C.hairline,
              background: i === 0 ? C.accentSoft : "transparent",
              color: i === 0 ? C.text : C.sub,
              // @ts-expect-error CSS custom prop for ring color
              "--tw-ring-color": hexToRgba(C.accent, 0.5),
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <Card>
        {OPDRACHTEN.map((o, i) => (
          <button
            key={o.id}
            type="button"
            onClick={onOpen}
            className="flex w-full flex-col gap-2 px-4 py-3.5 text-left transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset sm:flex-row sm:items-center"
            style={{
              borderTop: i > 0 ? `1px solid ${C.hairline}` : undefined,
              // @ts-expect-error CSS custom prop for ring color
              "--tw-ring-color": hexToRgba(C.accent, 0.5),
            }}
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{o.titel}</div>
              <div
                style={{ ...mono, color: C.sub }}
                className="mt-0.5 truncate text-[11px] tabular-nums"
              >
                {o.opdrachtgever} · {o.plaats} · {o.uren} · {o.tarief}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    style={{ ...mono, color: C.sub, borderColor: C.hairline }}
                    className="rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <span
              style={{ ...mono, color: C.accent }}
              className="shrink-0 self-start text-[13px] font-semibold tabular-nums sm:self-center"
            >
              {o.match}%
            </span>
          </button>
        ))}
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------- Opdracht */

function OpdrachtScreen() {
  const o = OPDRACHTEN[0];
  if (!o) return null;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span
              style={{ ...mono, color: C.faint }}
              className="text-[11px] uppercase tracking-wide"
            >
              {o.id}
            </span>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">{o.titel}</h2>
            <div style={{ ...mono, color: C.sub }} className="mt-1 text-[12px] tabular-nums">
              {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren} · {o.start}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div
              style={{ ...mono, color: C.faint }}
              className="text-[10px] uppercase tracking-wide"
            >
              Match
            </div>
            <div
              style={{ ...mono, color: C.accent }}
              className="text-3xl font-semibold tabular-nums"
            >
              {o.match}%
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" style={{ color: C.good }} aria-hidden />
            <span style={{ ...mono, color: C.sub }} className="text-[10px] uppercase tracking-wide">
              Waarom dit past
            </span>
          </div>
          <ul className="space-y-2.5">
            {o.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[12px]" style={{ color: C.text }}>
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  style={{ color: C.good }}
                  aria-hidden
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" style={{ color: C.warn }} aria-hidden />
            <span style={{ ...mono, color: C.sub }} className="text-[10px] uppercase tracking-wide">
              Let op
            </span>
          </div>
          <ul className="space-y-2.5">
            {o.redenen.min.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[12px]" style={{ color: C.text }}>
                <AlertTriangle
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  style={{ color: C.warn }}
                  aria-hidden
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-lg px-4 py-2 text-[13px] font-medium transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: C.accent,
            color: C.base,
            // @ts-expect-error CSS custom props for ring
            "--tw-ring-color": hexToRgba(C.accent, 0.5),
            "--tw-ring-offset-color": C.base,
          }}
        >
          Reageer op opdracht
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-[13px] font-medium transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2"
          style={{
            borderColor: C.hairlineStrong,
            color: C.text,
            // @ts-expect-error CSS custom prop for ring color
            "--tw-ring-color": hexToRgba(C.accent, 0.5),
          }}
        >
          <Bookmark className="h-3.5 w-3.5" aria-hidden />
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
      <Card className="flex items-center gap-3 p-4">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: hexToRgba(C.good, 0.14), color: C.good }}
          aria-hidden
        >
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <div style={{ ...mono, color: C.sub }} className="text-[10px] uppercase tracking-wide">
            Vertrouwensniveau
          </div>
          <div className="text-[15px] font-medium">{PROFIEL.trust}</div>
        </div>
        <ShieldCheck className="ml-auto h-4 w-4" style={{ color: C.good }} aria-hidden />
      </Card>

      <Card>
        {CREDENTIALS.map((c, i) => {
          const v = statusVisual(c.status);
          return (
            <div
              key={c.naam}
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderTop: i > 0 ? `1px solid ${C.hairline}` : undefined }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: hexToRgba(v.color, 0.12), color: v.color }}
                aria-hidden
              >
                {v.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{c.naam}</div>
                <div className="truncate text-[11px]" style={{ color: C.sub }}>
                  {c.detail}
                </div>
              </div>
              <StatusPill status={c.status} />
            </div>
          );
        })}
      </Card>
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
        const tone = warning ? C.warn : C.accent;
        return (
          <Card key={a.titel} className="flex items-stretch overflow-hidden">
            <span aria-hidden className="w-1 shrink-0" style={{ background: tone }} />
            <div className="flex flex-1 items-start gap-3 p-4">
              {warning ? (
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: C.warn }}
                  aria-hidden
                />
              ) : (
                <Clock className="mt-0.5 h-4 w-4 shrink-0" style={{ color: C.sub }} aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium">{a.titel}</div>
                <p className="mt-0.5 text-[12px] leading-snug" style={{ color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 self-center rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  color: tone,
                  background: hexToRgba(tone, 0.12),
                  // @ts-expect-error CSS custom prop for ring color
                  "--tw-ring-color": hexToRgba(C.accent, 0.5),
                }}
              >
                {a.cta}
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------- Facturen */

function FactuurChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    Betaald: C.good,
    Openstaand: C.warn,
    Concept: C.sub,
  };
  const color = map[status] ?? C.sub;
  return (
    <span
      className="inline-block rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide"
      style={{
        ...mono,
        color,
        borderColor: hexToRgba(color, 0.35),
        background: hexToRgba(color, 0.1),
      }}
    >
      {status}
    </span>
  );
}

function FacturenScreen() {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.hairline}` }}>
            {["Nr", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
              <th
                key={h}
                style={{ ...mono, color: C.faint }}
                className={[
                  "px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em]",
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
            <tr key={f.nr} style={{ borderTop: i > 0 ? `1px solid ${C.hairline}` : undefined }}>
              <td style={{ ...mono, color: C.sub }} className="px-4 py-3 text-[12px] tabular-nums">
                {f.nr}
              </td>
              <td className="px-4 py-3 text-[13px]">{f.klant}</td>
              <td style={{ ...mono, color: C.sub }} className="px-4 py-3 text-[12px] tabular-nums">
                {f.datum}
              </td>
              <td
                style={mono}
                className="px-4 py-3 text-right text-[13px] font-medium tabular-nums"
              >
                {f.bedrag}
              </td>
              <td className="px-4 py-3">
                <FactuurChip status={f.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
