"use client";

// Concept — "Atelier": editorial Swiss / cool redactioneel. Magazine-grade structuur:
// hairline rules + whitespace (geen schaduwen), oversized serif-koppen, mono kicker-labels,
// één diep-indigo accent. Self-contained mini-app op de zes kernschermen.

import { useState } from "react";
import { ArrowUpRight, Bookmark, Plus, Minus, Check, Clock, AlertTriangle, X } from "lucide-react";
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

const serif = { fontFamily: "var(--font-lab-instrument-serif)" } as const;
const body = { fontFamily: "var(--font-lab-inter)" } as const;
const mono = { fontFamily: "var(--font-lab-mono)" } as const;

const PAPER = "#f6f5f2";
const INK = "#1a1a1a";
const INDIGO = "#3a3a8c";
const RULE = "#d9d7d0";

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={mono}
      className="text-[10px] uppercase tabular-nums tracking-[0.22em] text-neutral-500"
    >
      {children}
    </span>
  );
}

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const w = 72;
  const h = 22;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      className="overflow-visible"
      aria-hidden
      preserveAspectRatio="none"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={up ? INDIGO : "#9a9a9a"}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function Concept01() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const current = SCREENS.find((s) => s.key === screen) ?? SCREENS[0];
  const issueNo = String(SCREENS.findIndex((s) => s.key === screen) + 1).padStart(2, "0");

  return (
    <div
      style={{ ...body, backgroundColor: PAPER, color: INK }}
      className="flex min-h-[640px] w-full flex-col antialiased [color-scheme:light]"
    >
      {/* Masthead */}
      <header
        className="flex flex-col gap-3 px-5 pt-5 sm:px-8 sm:pt-7"
        style={{ borderBottom: `1px solid ${INK}` }}
      >
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <Kicker>Het Atelier — Editie {issueNo}</Kicker>
            <h1 style={serif} className="mt-0.5 text-3xl leading-none tracking-tight sm:text-4xl">
              ZorgBemiddeling
            </h1>
          </div>
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <div className="text-right leading-tight">
              <div className="text-[12px] font-medium">{PROFIEL.naam}</div>
              <div className="text-[11px] text-neutral-500">{PROFIEL.rol}</div>
            </div>
            <span
              style={{ ...mono, backgroundColor: INK }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] tabular-nums text-white"
              aria-hidden
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>

        {/* Section navigation (tabs) */}
        <nav
          className="-mb-px flex gap-5 overflow-x-auto pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Schermen"
        >
          {SCREENS.map((s, i) => {
            const active = s.key === screen;
            return (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setScreen(s.key)}
                className={[
                  "relative shrink-0 pb-2.5 text-[12px] tracking-wide transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a3a8c]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f5f2]",
                  active ? "font-medium text-[#1a1a1a]" : "text-neutral-500 hover:text-[#1a1a1a]",
                ].join(" ")}
              >
                <span style={mono} className="mr-1.5 text-[10px] tabular-nums text-neutral-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.label}
                <span
                  aria-hidden
                  className="absolute inset-x-0 -bottom-px h-[2px] transition-colors duration-150"
                  style={{ backgroundColor: active ? INK : "transparent" }}
                />
              </button>
            );
          })}
        </nav>
      </header>

      {/* Standfirst */}
      <div
        className="flex items-baseline justify-between gap-4 px-5 py-3 sm:px-8"
        style={{ borderBottom: `1px solid ${RULE}` }}
      >
        <Kicker>{current?.label}</Kicker>
        <Kicker>Utrecht · {new Date().getFullYear()}</Kicker>
      </div>

      <main className="flex-1 px-5 py-7 sm:px-8 sm:py-9">
        {screen === "dashboard" && <DashboardScreen onOpen={() => setScreen("opdracht")} />}
        {screen === "marktplaats" && <MarktplaatsScreen onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && <OpdrachtScreen onBack={() => setScreen("marktplaats")} />}
        {screen === "verificatie" && <VerificatieScreen />}
        {screen === "acties" && <ActiesScreen />}
        {screen === "facturen" && <FacturenScreen />}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ Dashboard */

function DashboardScreen({ onOpen }: { onOpen: () => void }) {
  const lead = OPDRACHTEN[0];
  return (
    <div className="space-y-10">
      {/* KPI ledger */}
      <section>
        <Kicker>De cijfers — deze maand</Kicker>
        <div
          className="mt-3 grid grid-cols-2 gap-px lg:grid-cols-4"
          style={{ backgroundColor: RULE }}
        >
          {KPIS.map((kpi) => (
            <div key={kpi.label} className="p-4" style={{ backgroundColor: PAPER }}>
              <div className="text-[11px] leading-tight text-neutral-500">{kpi.label}</div>
              <div style={serif} className="mt-1 text-4xl tabular-nums leading-none tracking-tight">
                {kpi.value}
              </div>
              <div className="mt-2.5 flex items-end justify-between gap-2">
                <span
                  style={{ ...mono, color: kpi.up ? INDIGO : "#8a8a8a" }}
                  className="text-[10px] tabular-nums"
                >
                  {kpi.up ? "▲" : "▾"} {kpi.trend}
                </span>
                <Sparkline data={kpi.spark} up={kpi.up} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lead match — editorial feature */}
      {lead && (
        <section className="grid gap-7 lg:grid-cols-[1.6fr_1fr]">
          <button
            type="button"
            onClick={onOpen}
            className="group block text-left focus-visible:outline-none"
          >
            <Kicker>Uitgelichte match</Kicker>
            <h2
              style={serif}
              className="mt-1 max-w-xl text-3xl leading-[1.05] tracking-tight transition-colors group-hover:text-[#3a3a8c] sm:text-4xl"
            >
              {lead.titel}
            </h2>
            <p style={mono} className="mt-2 text-[12px] tabular-nums text-neutral-500">
              {lead.opdrachtgever} · {lead.plaats} · {lead.tarief} · {lead.uren}
            </p>
            <p className="mt-3 max-w-md text-[13px] leading-relaxed text-neutral-600">
              {lead.redenen.plus[0]} en {lead.redenen.plus[1]?.toLowerCase()}. Een opdracht die past
              bij je geverifieerde profiel en beschikbaarheid.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium"
              style={{ color: INDIGO }}
            >
              Lees de opdracht
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" />
            </span>
          </button>

          <aside className="lg:border-l lg:pl-7" style={{ borderColor: RULE }}>
            <div className="flex items-baseline justify-between">
              <Kicker>Match</Kicker>
              <span
                style={{ ...serif, color: INDIGO }}
                className="text-5xl tabular-nums leading-none"
              >
                {lead.match}%
              </span>
            </div>
            <div className="mt-5 space-y-3 border-t pt-4" style={{ borderColor: RULE }}>
              <Kicker>Ook aanbevolen</Kicker>
              {OPDRACHTEN.slice(1, 3).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={onOpen}
                  className="group flex w-full items-baseline justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a3a8c]/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] group-hover:text-[#3a3a8c]">
                      {o.titel}
                    </span>
                    <span style={mono} className="text-[10px] tabular-nums text-neutral-400">
                      {o.plaats}
                    </span>
                  </span>
                  <span style={mono} className="shrink-0 text-[12px] tabular-nums text-neutral-500">
                    {o.match}%
                  </span>
                </button>
              ))}
            </div>
          </aside>
        </section>
      )}

      {/* Acties strip */}
      <section className="border-t pt-6" style={{ borderColor: RULE }}>
        <Kicker>Wat vraagt je aandacht</Kicker>
        <ul className="mt-3 grid gap-px sm:grid-cols-3" style={{ backgroundColor: RULE }}>
          {ACTIES.map((a) => (
            <li key={a.titel} className="p-4" style={{ backgroundColor: PAPER }}>
              <div className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: a.urgentie === "warning" ? "#b45309" : INDIGO }}
                />
                <Kicker>{a.urgentie === "warning" ? "Urgent" : "Tip"}</Kicker>
              </div>
              <h3 className="mt-2 text-[13px] font-medium leading-snug">{a.titel}</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">{a.detail}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------- Marktplaats */

function MarktplaatsScreen({ onOpen }: { onOpen: () => void }) {
  const filters = ["Alle", "≥ 85% match", "Utrecht", "Avond"];
  const [active, setActive] = useState(0);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {filters.map((f, i) => {
          const on = i === active;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={on}
              onClick={() => setActive(i)}
              className={[
                "pb-0.5 text-[12px] tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a3a8c]/40",
                on
                  ? "border-b font-medium text-[#1a1a1a]"
                  : "text-neutral-500 hover:text-[#1a1a1a]",
              ].join(" ")}
              style={on ? { borderColor: INK } : undefined}
            >
              {f}
            </button>
          );
        })}
        <span style={mono} className="ml-auto text-[10px] tabular-nums text-neutral-400">
          {OPDRACHTEN.length} opdrachten
        </span>
      </div>

      <ol className="divide-y" style={{ borderColor: RULE }}>
        {OPDRACHTEN.map((o, i) => (
          <li key={o.id} style={{ borderColor: RULE }} className={i === 0 ? "" : "pt-0"}>
            <button
              type="button"
              onClick={onOpen}
              className="group grid w-full grid-cols-[auto_1fr_auto] items-baseline gap-x-4 gap-y-1 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a3a8c]/40"
            >
              <span
                style={mono}
                className="row-span-2 self-center text-[11px] tabular-nums text-neutral-400"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3
                style={serif}
                className="text-xl leading-tight tracking-tight transition-colors group-hover:text-[#3a3a8c] sm:text-2xl"
              >
                {o.titel}
              </h3>
              <span
                style={{ ...mono, color: INDIGO }}
                className="self-center text-right text-[15px] tabular-nums"
              >
                {o.match}%
              </span>
              <p style={mono} className="col-start-2 text-[11px] tabular-nums text-neutral-500">
                {o.opdrachtgever} · {o.plaats} · {o.uren} · {o.tarief} · {o.start}
              </p>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* -------------------------------------------------------------------- Opdracht */

function OpdrachtScreen({ onBack }: { onBack: () => void }) {
  const o = OPDRACHTEN[0];
  if (!o) return null;
  return (
    <article className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={onBack}
        style={mono}
        className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 transition-colors hover:text-[#1a1a1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a3a8c]/40"
      >
        ← Terug naar marktplaats
      </button>

      <header className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <Kicker>{o.id}</Kicker>
          <h2 style={serif} className="mt-1 text-4xl leading-[1.02] tracking-tight sm:text-5xl">
            {o.titel}
          </h2>
        </div>
        <div className="text-left sm:text-right">
          <Kicker>Match</Kicker>
          <div style={{ ...serif, color: INDIGO }} className="text-6xl tabular-nums leading-none">
            {o.match}%
          </div>
        </div>
      </header>

      <p style={mono} className="mt-3 border-y py-3 text-[12px] tabular-nums text-neutral-600">
        {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren} · {o.start}
      </p>

      <div className="mt-2 flex flex-wrap gap-2 pt-3">
        {o.tags.map((t) => (
          <span
            key={t}
            style={{ ...mono, borderColor: RULE }}
            className="rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-neutral-600"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-7 grid gap-px sm:grid-cols-2" style={{ backgroundColor: RULE }}>
        <section className="p-5" style={{ backgroundColor: PAPER }}>
          <div className="flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" style={{ color: INDIGO }} aria-hidden />
            <Kicker>Waarom dit past</Kicker>
          </div>
          <ul className="mt-3 space-y-2.5">
            {o.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[13px] leading-snug">
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  style={{ color: INDIGO }}
                  aria-hidden
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="p-5" style={{ backgroundColor: PAPER }}>
          <div className="flex items-center gap-1.5">
            <Minus className="h-3.5 w-3.5 text-neutral-500" aria-hidden />
            <Kicker>Aandachtspunten</Kicker>
          </div>
          <ul className="mt-3 space-y-2.5">
            {o.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px] leading-snug text-neutral-700"
              >
                <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-sm px-5 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a3a8c]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f5f2]"
          style={{ backgroundColor: INDIGO }}
        >
          Reageer op opdracht
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-sm border px-5 py-2.5 text-[13px] font-medium transition-colors hover:border-[#1a1a1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a3a8c]/40"
          style={{ borderColor: RULE }}
        >
          <Bookmark className="h-3.5 w-3.5" aria-hidden />
          Bewaar
        </button>
      </div>
    </article>
  );
}

/* ----------------------------------------------------------------- Verificatie */

const STATUS_LABEL: Record<CredStatus, string> = {
  VERIFIED: "Geverifieerd",
  EXPIRING: "Verloopt binnenkort",
  SUBMITTED: "In beoordeling",
  REJECTED: "Afgewezen",
};

function statusColor(status: CredStatus): string {
  if (status === "VERIFIED") return INDIGO;
  if (status === "EXPIRING") return "#b45309";
  if (status === "REJECTED") return "#b91c1c";
  return "#8a8a8a";
}

function StatusIcon({ status }: { status: CredStatus }) {
  const cls = "h-4 w-4";
  const color = statusColor(status);
  if (status === "VERIFIED") return <Check className={cls} style={{ color }} aria-hidden />;
  if (status === "EXPIRING") return <AlertTriangle className={cls} style={{ color }} aria-hidden />;
  if (status === "REJECTED") return <X className={cls} style={{ color }} aria-hidden />;
  return <Clock className={cls} style={{ color }} aria-hidden />;
}

function VerificatieScreen() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
      <aside>
        <Kicker>Vertrouwensniveau</Kicker>
        <div style={serif} className="mt-1 text-5xl leading-none tracking-tight">
          Hoog
        </div>
        <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-neutral-600">
          {verified} van {CREDENTIALS.length} bewijsstukken geverifieerd. Opdrachtgevers zien een
          geverifieerd profiel.
        </p>
        <div
          className="mt-4 h-1.5 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: RULE }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${(verified / CREDENTIALS.length) * 100}%`, backgroundColor: INDIGO }}
          />
        </div>
      </aside>

      <section>
        <Kicker>Bewijsstukken</Kicker>
        <ul className="mt-3 divide-y" style={{ borderColor: RULE }}>
          {CREDENTIALS.map((c) => (
            <li key={c.naam} className="flex items-center gap-3 py-4" style={{ borderColor: RULE }}>
              <StatusIcon status={c.status} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium">{c.naam}</div>
                <div className="truncate text-[12px] text-neutral-500">{c.detail}</div>
              </div>
              <span
                style={{ ...mono, color: statusColor(c.status) }}
                className="shrink-0 text-[10px] uppercase tabular-nums tracking-wide"
              >
                {STATUS_LABEL[c.status]}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* --------------------------------------------------------------------- Acties */

function ActiesScreen() {
  const ordered = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <ol className="mx-auto max-w-2xl divide-y" style={{ borderColor: RULE }}>
      {ordered.map((a, i) => {
        const warning = a.urgentie === "warning";
        return (
          <li
            key={a.titel}
            className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 py-6 sm:grid-cols-[auto_1fr_auto] sm:items-baseline"
            style={{ borderColor: RULE }}
          >
            <span style={serif} className="text-3xl tabular-nums leading-none text-neutral-300">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: warning ? "#b45309" : INDIGO }}
                />
                <Kicker>{warning ? "Urgent" : "Aanbevolen"}</Kicker>
              </div>
              <h3 style={serif} className="mt-1 text-2xl leading-tight tracking-tight">
                {a.titel}
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">{a.detail}</p>
            </div>
            <button
              type="button"
              className="col-start-2 mt-1 inline-flex items-center gap-1 text-[12px] font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a3a8c]/40 sm:col-start-3 sm:mt-0 sm:justify-self-end"
              style={{ color: warning ? "#b45309" : INDIGO }}
            >
              {a.cta}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------- Facturen */

function FacturenScreen() {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left" style={body}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${INK}` }}>
              {["Nr", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                <th
                  key={h}
                  style={mono}
                  className={[
                    "py-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500",
                    i === 3 ? "text-right" : "",
                  ].join(" ")}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => (
              <tr key={f.nr} style={{ borderBottom: `1px solid ${RULE}` }}>
                <td style={mono} className="py-3.5 text-[12px] tabular-nums text-neutral-600">
                  {f.nr}
                </td>
                <td className="py-3.5 pr-4 text-[14px]">{f.klant}</td>
                <td style={mono} className="py-3.5 text-[12px] tabular-nums text-neutral-500">
                  {f.datum}
                </td>
                <td style={mono} className="py-3.5 text-right text-[14px] font-medium tabular-nums">
                  {f.bedrag}
                </td>
                <td className="py-3.5 pl-4">
                  <FactuurStatus status={f.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FactuurStatus({ status }: { status: string }) {
  const color = status === "Betaald" ? INDIGO : status === "Openstaand" ? "#b45309" : "#8a8a8a";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span style={{ ...mono, color }} className="text-[11px] uppercase tracking-wide">
        {status}
      </span>
    </span>
  );
}
