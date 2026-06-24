"use client";

// Concept 03 — "Cockpit": data-dense pro console (Datadog school), dark theme.
// For the power user who lives in the queue: compact rows, sticky headers, tabular numbers
// everywhere, keyboard hints (J/K), bulk-select checkboxes. No glass, no decoration —
// pure scannable data density. Frontend only, mock data.

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
  ArrowDownRight,
  Command,
  Activity,
  Loader2,
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

// --- Cockpit palette (deep slate) ---
const C = {
  bg: "#0f1729",
  panel: "#131c30",
  panelAlt: "#0c1322",
  line: "#1f2a44",
  lineSoft: "#1a2438",
  text: "#e2e8f0",
  sub: "#7c8aa5",
  faint: "#56627c",
  accent: "#0ea5e9",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
} as const;

const sans = { fontFamily: "var(--font-lab-inter)" } as const;
const mono = { fontFamily: "var(--font-lab-geist-mono)" } as const;

// Map sidebar nav labels onto internal screens where they overlap.
const NAV_TO_SCREEN: Partial<Record<(typeof NAV)[number], ScreenKey>> = {
  Dashboard: "dashboard",
  Marktplaats: "marktplaats",
  Reacties: "acties",
  Verificatie: "verificatie",
  Facturen: "facturen",
};

function Mono({
  children,
  className,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span style={mono} className={["tabular-nums", className ?? ""].join(" ")} {...rest}>
      {children}
    </span>
  );
}

export function Concept03() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      style={{ ...sans, background: C.bg, color: C.text }}
      className="flex min-h-[640px] w-full antialiased [color-scheme:dark]"
    >
      {/* Sidebar rail */}
      <aside
        className="hidden w-[210px] shrink-0 flex-col md:flex"
        style={{ background: C.panelAlt, borderRight: `1px solid ${C.line}` }}
      >
        <div
          className="flex items-center gap-2 px-4 py-3.5"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <span
            className="flex h-6 w-6 items-center justify-center rounded text-[12px] font-bold"
            style={{ background: C.accent, color: C.bg }}
            aria-hidden
          >
            Z
          </span>
          <span className="text-[12px] font-semibold tracking-tight">ZorgBemiddeling</span>
          <Mono
            className="ml-auto rounded px-1 text-[9px] uppercase"
            style={{ color: C.faint, border: `1px solid ${C.line}` }}
          >
            cockpit
          </Mono>
        </div>

        <nav className="flex flex-1 flex-col gap-px p-1.5" aria-label="Hoofdnavigatie">
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
                style={active ? { background: C.panel, color: C.text } : undefined}
                className={[
                  "flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-[12px] tracking-tight transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2",
                  active
                    ? "font-medium"
                    : "text-[#7c8aa5] hover:text-[#e2e8f0] disabled:cursor-default disabled:opacity-40 disabled:hover:text-[#7c8aa5]",
                ].join(" ")}
              >
                <span
                  aria-hidden
                  className="h-1 w-1 shrink-0 rounded-full"
                  style={{ background: active ? C.accent : "transparent" }}
                />
                {item}
              </button>
            );
          })}
        </nav>

        <div
          className="m-1.5 rounded p-2.5"
          style={{ background: C.panel, border: `1px solid ${C.warning}33` }}
        >
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" style={{ color: C.warning }} aria-hidden />
            <Mono className="text-[9px] uppercase tracking-widest" style={{ color: C.warning }}>
              VOG verloopt
            </Mono>
          </div>
          <p className="mt-1 text-[11px] leading-snug" style={{ color: C.sub }}>
            Nog{" "}
            <Mono className="font-semibold" style={{ color: C.text }}>
              23
            </Mono>{" "}
            dagen geldig.
          </p>
          <button
            type="button"
            onClick={() => setScreen("acties")}
            className="mt-1.5 text-[11px] font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2"
            style={{ color: C.warning }}
          >
            Vernieuwen →
          </button>
        </div>
      </aside>

      {/* Right column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header
          className="flex items-center gap-2.5 px-3 py-2"
          style={{ background: C.panelAlt, borderBottom: `1px solid ${C.line}` }}
        >
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 rounded px-2.5 py-1.5 text-left text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 sm:max-w-sm"
            style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.sub }}
          >
            <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">Zoek of spring naar…</span>
            <Mono
              className="ml-auto hidden shrink-0 rounded px-1 text-[9px] sm:inline"
              style={{ border: `1px solid ${C.line}`, color: C.faint }}
            >
              ⌘K
            </Mono>
          </button>

          <Mono
            className="hidden items-center gap-1 text-[10px] sm:flex"
            style={{ color: C.faint }}
            aria-hidden
          >
            <Command className="h-3 w-3" /> J/K navigeren · X selecteren
          </Mono>

          <button
            type="button"
            aria-label="Meldingen"
            className="relative rounded p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ color: C.sub }}
          >
            <Bell className="h-4 w-4" aria-hidden />
            <span
              className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full"
              style={{ background: C.accent }}
              aria-hidden
            />
          </button>

          <div className="flex items-center gap-2">
            <Mono
              className="flex h-7 w-7 items-center justify-center rounded text-[10px] font-semibold"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
              aria-hidden
            >
              {PROFIEL.initialen}
            </Mono>
            <div className="hidden leading-tight sm:block">
              <div className="text-[11px] font-medium">{PROFIEL.naam}</div>
              <div className="text-[10px]" style={{ color: C.faint }}>
                {PROFIEL.plaats}
              </div>
            </div>
          </div>
        </header>

        {/* Screen tabs */}
        <div style={{ borderBottom: `1px solid ${C.line}`, background: C.panelAlt }}>
          <div
            className="flex gap-0.5 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                  style={active ? { color: C.text } : { color: C.sub }}
                  className="relative shrink-0 px-3 py-2 text-[12px] tracking-tight transition-colors hover:text-[#e2e8f0] focus-visible:outline-none focus-visible:ring-2"
                >
                  {s.label}
                  <span
                    aria-hidden
                    className="absolute inset-x-2 bottom-0 h-0.5"
                    style={{ background: active ? C.accent : "transparent" }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Main */}
        <main className="flex-1 overflow-x-hidden p-3 sm:p-4">
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

/* --------------------------------------------------------- shared status tokens */

const CRED_TOKEN: Record<CredStatus, { color: string; label: string; icon: React.ReactNode }> = {
  VERIFIED: {
    color: C.success,
    label: "Geverifieerd",
    icon: <Check className="h-3 w-3" aria-hidden />,
  },
  EXPIRING: {
    color: C.warning,
    label: "Verloopt binnenkort",
    icon: <AlertTriangle className="h-3 w-3" aria-hidden />,
  },
  SUBMITTED: {
    color: C.accent,
    label: "In beoordeling",
    icon: <Clock className="h-3 w-3" aria-hidden />,
  },
  REJECTED: { color: C.danger, label: "Afgewezen", icon: <X className="h-3 w-3" aria-hidden /> },
};

/* ------------------------------------------------------------------ Dashboard */

function DashboardScreen({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div
        className="grid grid-cols-2 overflow-hidden rounded-lg lg:grid-cols-4"
        style={{ border: `1px solid ${C.line}`, background: C.panel }}
      >
        {KPIS.map((kpi, i) => (
          <div
            key={kpi.label}
            className="p-3"
            style={{
              borderLeft: i % 2 === 1 ? `1px solid ${C.lineSoft}` : undefined,
              borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : undefined,
            }}
          >
            <Mono className="text-[9px] uppercase tracking-[0.14em]" style={{ color: C.faint }}>
              {kpi.label}
            </Mono>
            <div className="mt-1.5 flex items-baseline gap-2">
              <Mono className="text-[22px] font-semibold leading-none tracking-tight">
                {kpi.value}
              </Mono>
              <span
                className="flex items-center gap-0.5 text-[10px]"
                style={{ color: kpi.up ? C.success : C.sub }}
              >
                {kpi.up ? (
                  <ArrowUpRight className="h-3 w-3" aria-hidden />
                ) : (
                  <ArrowDownRight className="h-3 w-3" aria-hidden />
                )}
                <Mono>{kpi.trend}</Mono>
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Recommended */}
        <section
          className="overflow-hidden rounded-lg"
          style={{ border: `1px solid ${C.line}`, background: C.panel }}
        >
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ borderBottom: `1px solid ${C.lineSoft}`, background: C.panelAlt }}
          >
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" style={{ color: C.accent }} aria-hidden />
              <h2 className="text-[12px] font-medium tracking-tight">Aanbevolen opdrachten</h2>
            </div>
            <Mono className="text-[9px] uppercase tracking-widest" style={{ color: C.faint }}>
              top 3
            </Mono>
          </div>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                <ThCell>Opdracht</ThCell>
                <ThCell className="hidden sm:table-cell">Tarief</ThCell>
                <ThCell className="text-right">Match</ThCell>
              </tr>
            </thead>
            <tbody>
              {OPDRACHTEN.slice(0, 3).map((o) => (
                <tr
                  key={o.id}
                  onClick={onOpen}
                  className="group cursor-pointer transition-colors focus-within:bg-[#0ea5e9]/[0.06] hover:bg-[#0ea5e9]/[0.06]"
                  style={{ borderTop: `1px solid ${C.lineSoft}` }}
                >
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={onOpen}
                      className="text-left focus-visible:outline-none focus-visible:ring-2"
                    >
                      <div className="text-[12px] font-medium tracking-tight">{o.titel}</div>
                      <Mono className="mt-0.5 block text-[10px]" style={{ color: C.faint }}>
                        {o.opdrachtgever} · {o.plaats}
                      </Mono>
                    </button>
                  </td>
                  <td className="hidden px-3 py-2 sm:table-cell">
                    <Mono className="text-[11px]" style={{ color: C.sub }}>
                      {o.tarief}
                    </Mono>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <MatchPill value={o.match} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Action feed */}
        <section
          className="overflow-hidden rounded-lg"
          style={{ border: `1px solid ${C.line}`, background: C.panel }}
        >
          <div
            className="px-3 py-2"
            style={{ borderBottom: `1px solid ${C.lineSoft}`, background: C.panelAlt }}
          >
            <h2 className="text-[12px] font-medium tracking-tight">Acties</h2>
          </div>
          <ul className="divide-y" style={{ borderColor: C.lineSoft }}>
            {ACTIES.map((a) => {
              const warn = a.urgentie === "warning";
              return (
                <li key={a.titel} className="flex items-start gap-2 px-3 py-2.5">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded"
                    style={{
                      background: `${warn ? C.warning : C.accent}1a`,
                      color: warn ? C.warning : C.accent,
                    }}
                  >
                    {warn ? (
                      <AlertTriangle className="h-2.5 w-2.5" />
                    ) : (
                      <Clock className="h-2.5 w-2.5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12px] font-medium leading-tight tracking-tight">
                      {a.titel}
                    </div>
                    <p className="mt-0.5 text-[11px] leading-snug" style={{ color: C.sub }}>
                      {a.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

function ThCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      style={{ ...mono, color: C.faint }}
      className={[
        "px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.12em]",
        className ?? "",
      ].join(" ")}
      scope="col"
    >
      {children}
    </th>
  );
}

function MatchPill({ value }: { value: number }) {
  const color = value >= 90 ? C.success : value >= 82 ? C.accent : C.warning;
  return (
    <Mono
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold"
      style={{ color, background: `${color}1a` }}
    >
      {value}%
    </Mono>
  );
}

/* ----------------------------------------------------------------- Marktplaats */

function MarktplaatsScreen({ onOpen }: { onOpen: () => void }) {
  const filters = ["Alle", "≥85% match", "Utrecht", "Avond"];
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f, i) => (
          <button
            key={f}
            type="button"
            aria-pressed={i === active}
            onClick={() => setActive(i)}
            style={
              i === active
                ? { background: C.accent, color: C.bg, borderColor: C.accent }
                : { color: C.sub, borderColor: C.line }
            }
            className="rounded border px-2.5 py-1 text-[11px] font-medium transition-colors hover:text-[#e2e8f0] focus-visible:outline-none focus-visible:ring-2"
          >
            {f}
          </button>
        ))}
        <Mono className="ml-auto text-[10px]" style={{ color: C.faint }}>
          {selected.size > 0
            ? `${selected.size} geselecteerd · bulk reageren`
            : `${OPDRACHTEN.length} resultaten`}
        </Mono>
      </div>

      <div
        className="overflow-hidden rounded-lg"
        style={{ border: `1px solid ${C.line}`, background: C.panel }}
      >
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10" style={{ background: C.panelAlt }}>
            <tr style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
              <th className="w-8 px-3 py-1.5" scope="col">
                <span className="sr-only">Selecteer</span>
              </th>
              <ThCell>Opdracht</ThCell>
              <ThCell className="hidden md:table-cell">Uren</ThCell>
              <ThCell className="hidden sm:table-cell">Tarief</ThCell>
              <ThCell className="text-right">Match</ThCell>
            </tr>
          </thead>
          <tbody>
            {OPDRACHTEN.map((o) => {
              const checked = selected.has(o.id);
              return (
                <tr
                  key={o.id}
                  className="transition-colors hover:bg-[#0ea5e9]/[0.06]"
                  style={{
                    borderTop: `1px solid ${C.lineSoft}`,
                    background: checked ? `${C.accent}0d` : undefined,
                  }}
                >
                  <td className="px-3 py-2 align-top">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(o.id)}
                      aria-label={`Selecteer ${o.titel}`}
                      className="h-3.5 w-3.5 cursor-pointer accent-[#0ea5e9] focus-visible:outline-none focus-visible:ring-2"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={onOpen}
                      className="text-left focus-visible:outline-none focus-visible:ring-2"
                    >
                      <div className="text-[12px] font-medium tracking-tight">{o.titel}</div>
                      <Mono className="mt-0.5 block text-[10px]" style={{ color: C.faint }}>
                        {o.id} · {o.opdrachtgever} · {o.plaats}
                      </Mono>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {o.tags.map((t) => (
                          <Mono
                            key={t}
                            className="rounded px-1 py-px text-[9px] uppercase tracking-wide"
                            style={{ border: `1px solid ${C.line}`, color: C.sub }}
                          >
                            {t}
                          </Mono>
                        ))}
                      </div>
                    </button>
                  </td>
                  <td className="hidden px-3 py-2 align-top md:table-cell">
                    <Mono className="text-[11px]" style={{ color: C.sub }}>
                      {o.uren}
                    </Mono>
                  </td>
                  <td className="hidden px-3 py-2 align-top sm:table-cell">
                    <Mono className="text-[11px]" style={{ color: C.sub }}>
                      {o.tarief}
                    </Mono>
                  </td>
                  <td className="px-3 py-2 text-right align-top">
                    <MatchPill value={o.match} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- Opdracht */

function OpdrachtScreen() {
  const o = OPDRACHTEN[0];
  if (!o) return null;
  return (
    <div className="space-y-4">
      <div
        className="flex flex-col gap-4 rounded-lg p-4 sm:flex-row sm:items-start sm:justify-between"
        style={{ border: `1px solid ${C.line}`, background: C.panel }}
      >
        <div className="min-w-0">
          <Mono className="text-[10px] uppercase tracking-widest" style={{ color: C.faint }}>
            {o.id}
          </Mono>
          <h2 className="mt-1 text-[18px] font-semibold tracking-tight">{o.titel}</h2>
          <Mono className="mt-1 block text-[11px]" style={{ color: C.sub }}>
            {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren} · {o.start}
          </Mono>
          <div className="mt-2 flex flex-wrap gap-1">
            {o.tags.map((t) => (
              <Mono
                key={t}
                className="rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wide"
                style={{ border: `1px solid ${C.line}`, color: C.sub }}
              >
                {t}
              </Mono>
            ))}
          </div>
        </div>
        <div
          className="shrink-0 rounded-lg px-4 py-3 text-center"
          style={{ background: `${C.success}14`, border: `1px solid ${C.success}33` }}
        >
          <Mono className="text-[9px] uppercase tracking-widest" style={{ color: C.faint }}>
            Match-score
          </Mono>
          <Mono
            className="mt-1 block text-[34px] font-bold leading-none"
            style={{ color: C.success }}
          >
            {o.match}%
          </Mono>
        </div>
      </div>

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
          className="rounded px-4 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.accent, color: C.bg }}
        >
          Reageer op opdracht
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded px-4 py-2 text-[12px] font-medium transition-colors hover:text-[#e2e8f0] focus-visible:outline-none focus-visible:ring-2"
          style={{ border: `1px solid ${C.line}`, color: C.sub }}
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
    <div
      className="overflow-hidden rounded-lg"
      style={{ border: `1px solid ${C.line}`, background: C.panel }}
    >
      <div
        className="flex items-center gap-1.5 px-3 py-2"
        style={{ borderBottom: `1px solid ${C.lineSoft}`, background: C.panelAlt }}
      >
        <span style={{ color }}>{icon}</span>
        <Mono className="text-[9px] uppercase tracking-widest" style={{ color: C.faint }}>
          {title}
        </Mono>
      </div>
      <ul className="space-y-2 p-3">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12px]" style={{ color: C.sub }}>
            <span className="mt-0.5 shrink-0" style={{ color }}>
              {icon}
            </span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ----------------------------------------------------------------- Verificatie */

function VerificatieScreen() {
  return (
    <div className="space-y-3">
      <div
        className="flex items-center gap-2 rounded-lg px-4 py-3"
        style={{ border: `1px solid ${C.success}33`, background: `${C.success}10` }}
      >
        <ShieldCheck className="h-4 w-4" style={{ color: C.success }} aria-hidden />
        <span className="text-[13px] font-medium">Vertrouwensniveau: Hoog</span>
        <Mono
          className="ml-auto text-[10px] uppercase tracking-widest"
          style={{ color: C.success }}
        >
          {PROFIEL.trust}
        </Mono>
      </div>

      <div
        className="overflow-hidden rounded-lg"
        style={{ border: `1px solid ${C.line}`, background: C.panel }}
      >
        <table className="w-full border-collapse text-left">
          <thead style={{ background: C.panelAlt }}>
            <tr style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
              <ThCell>Credential</ThCell>
              <ThCell className="hidden sm:table-cell">Detail</ThCell>
              <ThCell className="text-right">Status</ThCell>
            </tr>
          </thead>
          <tbody>
            {CREDENTIALS.map((c) => {
              const t = CRED_TOKEN[c.status];
              return (
                <tr key={c.naam} style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{ background: `${t.color}1f`, color: t.color }}
                      >
                        {t.icon}
                      </span>
                      <span className="text-[12px] font-medium tracking-tight">{c.naam}</span>
                    </div>
                  </td>
                  <td className="hidden px-3 py-2.5 sm:table-cell">
                    <Mono className="text-[11px]" style={{ color: C.sub }}>
                      {c.detail}
                    </Mono>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Mono
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                      style={{ color: t.color, background: `${t.color}1a` }}
                    >
                      {t.icon}
                      {t.label}
                    </Mono>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
    <div className="space-y-2">
      {ordered.map((a) => {
        const warn = a.urgentie === "warning";
        const color = warn ? C.warning : C.accent;
        return (
          <div
            key={a.titel}
            className="flex items-start gap-3 rounded-lg p-3"
            style={{
              border: `1px solid ${C.line}`,
              background: C.panel,
              borderLeft: `2px solid ${color}`,
            }}
          >
            <span
              aria-hidden
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded"
              style={{ background: `${color}1a`, color }}
            >
              {warn ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-medium tracking-tight">{a.titel}</div>
              <p className="mt-0.5 text-[11px] leading-snug" style={{ color: C.sub }}>
                {a.detail}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{ color, border: `1px solid ${color}40` }}
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

const FACTUUR_TOKEN: Record<string, { color: string }> = {
  Betaald: { color: C.success },
  Openstaand: { color: C.warning },
  Concept: { color: C.faint },
};

function FacturenScreen() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  function toggle(nr: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(nr)) next.delete(nr);
      else next.add(nr);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-[12px] font-medium tracking-tight">Facturen</h2>
        <Mono className="ml-auto text-[10px]" style={{ color: C.faint }}>
          {selected.size > 0
            ? `${selected.size} geselecteerd · bulk herinneren`
            : `${FACTUREN.length} facturen`}
        </Mono>
      </div>

      {/* One-time loading hint row to show empty/loading affordance */}
      <div
        className="flex items-center gap-2 rounded px-3 py-1.5 text-[10px]"
        style={{ background: C.panel, border: `1px solid ${C.lineSoft}`, color: C.faint }}
      >
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        <Mono>Synchroniseren met boekhouding…</Mono>
      </div>

      <div
        className="overflow-hidden rounded-lg"
        style={{ border: `1px solid ${C.line}`, background: C.panel }}
      >
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10" style={{ background: C.panelAlt }}>
            <tr style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
              <th className="w-8 px-3 py-1.5" scope="col">
                <span className="sr-only">Selecteer</span>
              </th>
              <ThCell>Nr</ThCell>
              <ThCell>Klant</ThCell>
              <ThCell className="hidden sm:table-cell">Datum</ThCell>
              <ThCell className="text-right">Bedrag</ThCell>
              <ThCell className="text-right">Status</ThCell>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const checked = selected.has(f.nr);
              const token = FACTUUR_TOKEN[f.status] ?? { color: C.faint };
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[#0ea5e9]/[0.06]"
                  style={{
                    borderTop: `1px solid ${C.lineSoft}`,
                    background: checked ? `${C.accent}0d` : undefined,
                  }}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(f.nr)}
                      aria-label={`Selecteer ${f.nr}`}
                      className="h-3.5 w-3.5 cursor-pointer accent-[#0ea5e9] focus-visible:outline-none focus-visible:ring-2"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Mono className="text-[11px]" style={{ color: C.text }}>
                      {f.nr}
                    </Mono>
                  </td>
                  <td className="px-3 py-2 text-[12px]">{f.klant}</td>
                  <td className="hidden px-3 py-2 sm:table-cell">
                    <Mono className="text-[11px]" style={{ color: C.sub }}>
                      {f.datum}
                    </Mono>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Mono className="text-[12px] font-medium">{f.bedrag}</Mono>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Mono
                      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                      style={{ color: token.color, background: `${token.color}1a` }}
                    >
                      {f.status}
                    </Mono>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
