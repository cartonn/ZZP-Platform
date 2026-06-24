"use client";

// Concept 09 — "Stroom": Linear-grade product, licht.
// Richting: kalm, snel, toetsenbord-eerst, nul visuele ruis. Bijna-wit canvas, inkt-tekst,
// indigo accent. Progressieve onthulling — lijsten tonen status/prioriteit/eigenaar eerst,
// details verschijnen pas bij klik (uitklapbare rij + detail-paneel). Strak 8px-grid,
// hairline borders, subtiele hover, snelle transitions, kbd-hints en een ⌘K-hint.
// Design dat verdwijnt. Self-contained mini-app, frontend only, mock data.

import { useState } from "react";
import {
  Search,
  Check,
  AlertTriangle,
  Clock,
  X,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Circle,
  ArrowRight,
  Bookmark,
  Inbox,
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

// --- Palet (Linear-school, licht) ---
const C = {
  bg: "#fbfbfd",
  panel: "#ffffff",
  ink: "#1c1c1f",
  sub: "#6b6b73",
  faint: "#9a9aa3",
  line: "#ececf0",
  accent: "#5b5bd6",
  accentSoft: "#5b5bd614",
  verified: "#2f8a5b",
  expiring: "#b06a14",
  rejected: "#c0392b",
};

const sans = { fontFamily: "var(--font-lab-inter)" } as const;
const mono = { fontFamily: "var(--font-lab-geist-mono)" } as const;

const NAV_TO_SCREEN: Partial<Record<(typeof NAV)[number], ScreenKey>> = {
  Dashboard: "dashboard",
  Marktplaats: "marktplaats",
  Reacties: "acties",
  Verificatie: "verificatie",
  Facturen: "facturen",
};

const NAV_SHORTCUT: Partial<Record<(typeof NAV)[number], string>> = {
  Dashboard: "D",
  Marktplaats: "M",
  Reacties: "R",
  Verificatie: "V",
  Facturen: "F",
};

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      style={{ ...mono, borderColor: C.line, color: C.faint }}
      className="rounded border bg-white px-1.5 py-0.5 text-[10px] tabular-nums leading-none"
    >
      {children}
    </kbd>
  );
}

const STATUS_LABEL: Record<CredStatus, string> = {
  VERIFIED: "Geverifieerd",
  EXPIRING: "Verloopt binnenkort",
  SUBMITTED: "In beoordeling",
  REJECTED: "Afgewezen",
};

const STATUS_COLOR: Record<CredStatus, string> = {
  VERIFIED: C.verified,
  EXPIRING: C.expiring,
  SUBMITTED: C.sub,
  REJECTED: C.rejected,
};

function CredIcon({ status, className }: { status: CredStatus; className?: string }) {
  if (status === "VERIFIED") return <Check className={className} aria-hidden />;
  if (status === "EXPIRING") return <AlertTriangle className={className} aria-hidden />;
  if (status === "REJECTED") return <X className={className} aria-hidden />;
  return <Clock className={className} aria-hidden />;
}

export function Concept09() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      style={{ ...sans, background: C.bg, color: C.ink }}
      className="flex min-h-[640px] w-full antialiased [color-scheme:light]"
    >
      {/* Sidebar */}
      <aside
        className="hidden w-[228px] shrink-0 flex-col md:flex"
        style={{ borderRight: `1px solid ${C.line}`, background: C.bg }}
      >
        <div
          className="flex items-center gap-2.5 px-4 py-4"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <span
            aria-hidden
            className="flex h-6 w-6 items-center justify-center rounded-md text-[12px] font-semibold text-white"
            style={{ background: C.accent }}
          >
            Z
          </span>
          <span className="text-[13px] font-semibold tracking-tight">Stroom</span>
        </div>

        <nav className="flex flex-1 flex-col gap-px p-2" aria-label="Hoofdnavigatie">
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
                style={active ? { background: C.accentSoft, color: C.accent } : undefined}
                className={[
                  "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors duration-100",
                  "focus-visible:outline-none focus-visible:ring-2",
                  active
                    ? "font-medium"
                    : "text-[#6b6b73] enabled:hover:bg-[#1c1c1f08] enabled:hover:text-[#1c1c1f] disabled:opacity-40",
                ].join(" ")}
              >
                <Circle
                  className="h-2 w-2 shrink-0"
                  style={{ color: active ? C.accent : C.faint }}
                  fill={active ? "currentColor" : "none"}
                  aria-hidden
                />
                <span className="flex-1 truncate">{item}</span>
                {NAV_SHORTCUT[item] && (
                  <span className="opacity-0 transition-opacity group-hover:opacity-100">
                    <Kbd>{NAV_SHORTCUT[item]}</Kbd>
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-2">
          <button
            type="button"
            onClick={() => setScreen("verificatie")}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-[#1c1c1f08] focus-visible:outline-none focus-visible:ring-2"
            style={{ border: `1px solid ${C.line}` }}
          >
            <span
              aria-hidden
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold"
              style={{ background: C.accentSoft, color: C.accent }}
            >
              {PROFIEL.initialen}
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[12px] font-medium">{PROFIEL.naam}</span>
              <span className="block truncate text-[11px]" style={{ color: C.sub }}>
                {PROFIEL.trust}
              </span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: C.faint }} aria-hidden />
          </button>
        </div>
      </aside>

      {/* Right column */}
      <div className="flex min-w-0 flex-1 flex-col" style={{ background: C.bg }}>
        {/* Top bar */}
        <header
          className="flex items-center gap-3 px-4 py-2.5"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors hover:bg-[#1c1c1f06] focus-visible:outline-none focus-visible:ring-2 sm:max-w-sm"
            style={{ border: `1px solid ${C.line}`, color: C.sub }}
          >
            <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">Zoek of spring naar…</span>
            <span className="ml-auto hidden shrink-0 sm:inline">
              <Kbd>⌘K</Kbd>
            </span>
          </button>
          <div
            className="hidden items-center gap-1.5 text-[11px] sm:flex"
            style={{ color: C.faint }}
          >
            <span>Navigeer</span>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            <span>· Open</span>
            <Kbd>↵</Kbd>
          </div>
        </header>

        {/* Screen tabs */}
        <div style={{ borderBottom: `1px solid ${C.line}` }}>
          <div
            className="flex gap-1 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                  style={{ color: active ? C.ink : C.sub }}
                  className={[
                    "relative shrink-0 px-2.5 py-2.5 text-[12.5px] transition-colors duration-100",
                    "focus-visible:outline-none focus-visible:ring-2",
                    active ? "font-medium" : "hover:text-[#1c1c1f]",
                  ].join(" ")}
                >
                  {s.label}
                  <span
                    aria-hidden
                    className="absolute inset-x-2.5 bottom-0 h-[2px] rounded-full"
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
  return (
    <div className="mx-auto max-w-3xl space-y-7">
      {/* KPI rij — compact, lijn-gescheiden, geen kaarten */}
      <section
        className="grid grid-cols-2 overflow-hidden rounded-lg lg:grid-cols-4"
        style={{ border: `1px solid ${C.line}`, background: C.panel }}
      >
        {KPIS.map((kpi, i) => (
          <div
            key={kpi.label}
            className="p-3.5"
            style={{
              borderLeft: i % 2 === 1 ? `1px solid ${C.line}` : undefined,
              borderTop: i >= 2 ? `1px solid ${C.line}` : undefined,
            }}
          >
            <div className="text-[11px]" style={{ color: C.sub }}>
              {kpi.label}
            </div>
            <div
              style={{ ...mono }}
              className="mt-1.5 text-xl font-semibold tabular-nums tracking-tight"
            >
              {kpi.value}
            </div>
            <div
              style={{ ...mono, color: kpi.up ? C.verified : C.sub }}
              className="mt-0.5 text-[11px] tabular-nums"
            >
              {kpi.up ? "↑ " : "· "}
              {kpi.trend}
            </div>
          </div>
        ))}
      </section>

      {/* Aanbevolen opdrachten — lijst, status eerst */}
      <section>
        <div className="mb-2 flex items-baseline justify-between px-0.5">
          <h2 className="text-[13px] font-semibold">Aanbevolen opdrachten</h2>
          <span className="text-[11px]" style={{ color: C.faint }}>
            3 boven 80%
          </span>
        </div>
        <ol
          className="overflow-hidden rounded-lg"
          style={{ border: `1px solid ${C.line}`, background: C.panel }}
        >
          {OPDRACHTEN.slice(0, 3).map((o, i) => (
            <li key={o.id} style={{ borderTop: i > 0 ? `1px solid ${C.line}` : undefined }}>
              <button
                type="button"
                onClick={onOpen}
                className="group flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[#1c1c1f04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
              >
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: o.match >= 90 ? C.accent : C.faint }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{o.titel}</span>
                  <span className="block truncate text-[11px]" style={{ color: C.sub }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </span>
                <span
                  style={{ ...mono, color: o.match >= 90 ? C.accent : C.sub }}
                  className="shrink-0 text-[12px] font-semibold tabular-nums"
                >
                  {o.match}%
                </span>
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                  style={{ color: C.faint }}
                  aria-hidden
                />
              </button>
            </li>
          ))}
        </ol>
      </section>

      {/* Acties — minimale stroom */}
      <section>
        <h2 className="mb-2 px-0.5 text-[13px] font-semibold">Vereist actie</h2>
        <ul className="space-y-1.5">
          {ACTIES.map((a) => (
            <li key={a.titel} className="flex items-start gap-2.5 text-[12px]">
              <span
                aria-hidden
                className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: a.urgentie === "warning" ? C.expiring : C.faint }}
              />
              <span>
                <span className="font-medium">{a.titel}</span>
                <span style={{ color: C.sub }}> — {a.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------- Marktplaats */

function MarktplaatsScreen({ onOpen }: { onOpen: () => void }) {
  const filters = ["Alle", "≥85% match", "Utrecht", "Avond"];
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<string | null>(OPDRACHTEN[0]?.id ?? null);

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {/* Filterchips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {filters.map((f, i) => {
          const on = i === active;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={on}
              onClick={() => setActive(i)}
              style={
                on
                  ? { background: C.ink, color: "#fff", borderColor: C.ink }
                  : { borderColor: C.line, color: C.sub }
              }
              className="rounded-md border px-2.5 py-1 text-[12px] transition-colors hover:border-[#dededf] focus-visible:outline-none focus-visible:ring-2"
            >
              {f}
            </button>
          );
        })}
        <span className="ml-auto text-[11px]" style={{ color: C.faint }}>
          {OPDRACHTEN.length} opdrachten · sorteer op match
        </span>
      </div>

      {/* Lijst met uitklapbare rij (progressieve onthulling) */}
      <ol
        className="overflow-hidden rounded-lg"
        style={{ border: `1px solid ${C.line}`, background: C.panel }}
      >
        {OPDRACHTEN.map((o, i) => {
          const expanded = open === o.id;
          return (
            <li key={o.id} style={{ borderTop: i > 0 ? `1px solid ${C.line}` : undefined }}>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : o.id)}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-[#1c1c1f04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
              >
                <ChevronDown
                  className="h-3.5 w-3.5 shrink-0 transition-transform"
                  style={{ color: C.faint, transform: expanded ? "none" : "rotate(-90deg)" }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{o.titel}</span>
                  <span className="block truncate text-[11px]" style={{ color: C.sub }}>
                    {o.opdrachtgever} · {o.plaats} · {o.uren}
                  </span>
                </span>
                <span
                  style={{ ...mono }}
                  className="hidden shrink-0 text-[12px] tabular-nums sm:block"
                >
                  {o.tarief}
                </span>
                <span
                  style={{ ...mono, color: o.match >= 90 ? C.accent : C.sub }}
                  className="shrink-0 text-[12px] font-semibold tabular-nums"
                >
                  {o.match}%
                </span>
              </button>

              {expanded && (
                <div className="px-10 pb-3.5" style={{ background: C.bg }}>
                  <div className="mb-3 flex flex-wrap gap-1 pt-1">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
                        style={{ ...mono, borderColor: C.line, color: C.sub }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <ul className="space-y-1">
                    {o.redenen.plus.slice(0, 2).map((r) => (
                      <li
                        key={r}
                        className="flex items-start gap-1.5 text-[12px]"
                        style={{ color: C.sub }}
                      >
                        <Check
                          className="mt-0.5 h-3 w-3 shrink-0"
                          style={{ color: C.verified }}
                          aria-hidden
                        />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-medium transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2"
                    style={{ color: C.accent }}
                  >
                    Open opdracht
                    <ArrowRight className="h-3 w-3" aria-hidden />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* -------------------------------------------------------------------- Opdracht */

function OpdrachtScreen({ onBack }: { onBack: () => void }) {
  const o = OPDRACHTEN[0];
  if (!o) return null;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-[12px] transition-colors hover:text-[#1c1c1f] focus-visible:outline-none focus-visible:ring-2"
        style={{ color: C.sub }}
      >
        <ChevronRight className="h-3.5 w-3.5 rotate-180" aria-hidden />
        Marktplaats
      </button>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div style={{ ...mono, color: C.faint }} className="text-[11px] tabular-nums">
            {o.id}
          </div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">{o.titel}</h2>
          <div style={{ ...mono, color: C.sub }} className="mt-1 text-[12px] tabular-nums">
            {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren} · {o.start}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[11px]" style={{ color: C.sub }}>
            Match
          </div>
          <div style={{ ...mono, color: C.accent }} className="text-3xl font-semibold tabular-nums">
            {o.match}%
          </div>
        </div>
      </div>

      <div
        className="grid gap-px overflow-hidden rounded-lg sm:grid-cols-2"
        style={{ border: `1px solid ${C.line}`, background: C.line }}
      >
        <div className="p-4" style={{ background: C.panel }}>
          <div className="mb-2.5 flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" style={{ color: C.verified }} aria-hidden />
            <span className="text-[12px] font-semibold">Waarom dit past</span>
          </div>
          <ul className="space-y-2">
            {o.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[12px]" style={{ color: C.sub }}>
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  style={{ color: C.verified }}
                  aria-hidden
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4" style={{ background: C.panel }}>
          <div className="mb-2.5 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" style={{ color: C.expiring }} aria-hidden />
            <span className="text-[12px] font-semibold">Let op</span>
          </div>
          <ul className="space-y-2">
            {o.redenen.min.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[12px]" style={{ color: C.sub }}>
                <AlertTriangle
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  style={{ color: C.expiring }}
                  aria-hidden
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.accent }}
        >
          Reageer op opdracht
          <Kbd>↵</Kbd>
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-[#1c1c1f04] focus-visible:outline-none focus-visible:ring-2"
          style={{ borderColor: C.line, color: C.ink }}
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
    <div className="mx-auto max-w-2xl space-y-4">
      <div
        className="flex items-center gap-2.5 rounded-lg px-4 py-3"
        style={{ border: `1px solid ${C.line}`, background: C.panel }}
      >
        <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: C.verified }} aria-hidden />
        <span className="text-[13px] font-medium">Vertrouwensniveau: Hoog</span>
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ background: `${C.verified}14`, color: C.verified }}
        >
          {PROFIEL.trust}
        </span>
      </div>

      <ol
        className="overflow-hidden rounded-lg"
        style={{ border: `1px solid ${C.line}`, background: C.panel }}
      >
        {CREDENTIALS.map((c, i) => (
          <li
            key={c.naam}
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderTop: i > 0 ? `1px solid ${C.line}` : undefined }}
          >
            <span
              aria-hidden
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{ background: `${STATUS_COLOR[c.status]}14`, color: STATUS_COLOR[c.status] }}
            >
              <CredIcon status={c.status} className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{c.naam}</div>
              <div className="truncate text-[11px]" style={{ color: C.sub }}>
                {c.detail}
              </div>
            </div>
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium"
              style={{ borderColor: `${STATUS_COLOR[c.status]}33`, color: STATUS_COLOR[c.status] }}
            >
              <CredIcon status={c.status} className="h-3 w-3" />
              {STATUS_LABEL[c.status]}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* --------------------------------------------------------------------- Acties */

function ActiesScreen() {
  const ordered = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="mx-auto max-w-2xl space-y-2">
      {ordered.map((a) => {
        const warning = a.urgentie === "warning";
        const color = warning ? C.expiring : C.accent;
        return (
          <div
            key={a.titel}
            className="flex items-start gap-3 rounded-lg px-4 py-3"
            style={{ border: `1px solid ${C.line}`, background: C.panel }}
          >
            <span
              aria-hidden
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{ background: `${color}14`, color }}
            >
              {warning ? (
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Clock className="h-3.5 w-3.5" aria-hidden />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium">{a.titel}</div>
              <p className="mt-0.5 text-[12px] leading-snug" style={{ color: C.sub }}>
                {a.detail}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 self-center rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors hover:bg-[#1c1c1f04] focus-visible:outline-none focus-visible:ring-2"
              style={{ borderColor: C.line, color }}
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
  const map: Record<string, { color: string; icon: React.ReactNode }> = {
    Betaald: { color: C.verified, icon: <Check className="h-3 w-3" aria-hidden /> },
    Openstaand: { color: C.expiring, icon: <Clock className="h-3 w-3" aria-hidden /> },
    Concept: { color: C.faint, icon: <Circle className="h-3 w-3" aria-hidden /> },
  };
  const c = map[status] ?? { color: C.sub, icon: null };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium"
      style={{ borderColor: `${c.color}33`, color: c.color }}
    >
      {c.icon}
      {status}
    </span>
  );
}

function FacturenScreen() {
  const hasData = FACTUREN.length > 0;
  if (!hasData) {
    return (
      <div
        className="mx-auto flex max-w-2xl flex-col items-center gap-2 rounded-lg px-6 py-12 text-center"
        style={{ border: `1px solid ${C.line}`, background: C.panel }}
      >
        <Inbox className="h-6 w-6" style={{ color: C.faint }} aria-hidden />
        <p className="text-[13px] font-medium">Nog geen facturen</p>
        <p className="text-[12px]" style={{ color: C.sub }}>
          Zodra je een opdracht afrondt verschijnt hier je eerste factuur.
        </p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl">
      <div
        className="overflow-hidden rounded-lg"
        style={{ border: `1px solid ${C.line}`, background: C.panel }}
      >
        <table className="w-full border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              {["Nr", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                <th
                  key={h}
                  className={[
                    "px-4 py-2.5 text-[10.5px] font-medium uppercase tracking-[0.1em]",
                    i === 3 ? "text-right" : "",
                  ].join(" ")}
                  style={{ color: C.faint }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => (
              <tr
                key={f.nr}
                style={{ borderTop: i > 0 ? `1px solid ${C.line}` : undefined }}
                className="transition-colors hover:bg-[#1c1c1f04]"
              >
                <td
                  style={{ ...mono, color: C.sub }}
                  className="px-4 py-3 text-[12px] tabular-nums"
                >
                  {f.nr}
                </td>
                <td className="px-4 py-3 text-[13px]">{f.klant}</td>
                <td
                  style={{ ...mono, color: C.sub }}
                  className="px-4 py-3 text-[12px] tabular-nums"
                >
                  {f.datum}
                </td>
                <td
                  style={{ ...mono }}
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
      </div>
    </div>
  );
}
