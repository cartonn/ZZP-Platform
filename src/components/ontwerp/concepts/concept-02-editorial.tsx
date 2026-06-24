"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Bookmark,
  Check,
  Clock,
  AlertTriangle,
  X,
  ShieldCheck,
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

// --- Editorial palette (warm, magazine-grade) ---
const C = {
  bg: "#f3ece1",
  paper: "#fbf7ef",
  ink: "#24201b",
  sub: "#6b6256",
  line: "#e0d6c6",
  accent: "#b4532a",
  verified: "#3f6f4a",
  expiring: "#9a6b1e",
  rejected: "#9b3a2e",
};

const serif = { fontFamily: "var(--font-lab-fraunces)" } as const;
const mono = { fontFamily: "var(--font-lab-mono)" } as const;

// --- Small building blocks ---

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{ ...mono, color: C.sub }}
      className="text-[11px] uppercase tabular-nums tracking-[0.22em]"
    >
      {children}
    </p>
  );
}

function Rule() {
  return <div className="h-px w-full" style={{ background: C.line }} />;
}

const credMeta: Record<CredStatus, { ring: string; icon: typeof Check; label: string }> = {
  VERIFIED: { ring: C.verified, icon: Check, label: "Geverifieerd" },
  EXPIRING: { ring: C.expiring, icon: AlertTriangle, label: "Verloopt binnenkort" },
  SUBMITTED: { ring: C.sub, icon: Clock, label: "In beoordeling" },
  REJECTED: { ring: C.rejected, icon: X, label: "Afgewezen" },
};

function Seal({ status }: { status: CredStatus }) {
  const m = credMeta[status];
  const Icon = m.icon;
  return (
    <span
      aria-hidden
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      style={{ border: `2px solid ${m.ring}`, color: m.ring }}
    >
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full"
        style={{ border: `1px solid ${m.ring}` }}
      >
        <Icon size={14} strokeWidth={2.5} />
      </span>
    </span>
  );
}

const factuurStatus: Record<string, string> = {
  Betaald: C.verified,
  Openstaand: C.expiring,
  Concept: C.sub,
};

function StatusChip({ status }: { status: string }) {
  const color = factuurStatus[status] ?? C.sub;
  const Icon = status === "Betaald" ? Check : status === "Openstaand" ? Clock : ChevronRight;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] tracking-wide"
      style={{ ...mono, color, border: `1px solid ${color}40` }}
    >
      <Icon size={11} strokeWidth={2.5} aria-hidden />
      {status}
    </span>
  );
}

// --- Screens ---

function Dashboard() {
  const hero = OPDRACHTEN[0];
  if (!hero) return null;
  return (
    <div className="space-y-12">
      <section>
        <Kicker>Voor jou — week 26</Kicker>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-8">
          <p
            style={{ ...serif, color: C.accent }}
            className="text-[5.5rem] tabular-nums leading-[0.85] tracking-tight sm:text-[8rem]"
          >
            {hero.match}%
          </p>
          <p
            style={{ ...serif, color: C.ink }}
            className="max-w-sm text-2xl leading-snug sm:text-3xl"
          >
            Je past op 12 nieuwe opdrachten deze week.
          </p>
        </div>
      </section>

      <Rule />

      <section className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <div
            key={k.label}
            className={i > 0 ? "lg:border-l lg:pl-6" : ""}
            style={i > 0 ? { borderColor: C.line } : undefined}
          >
            <Kicker>{k.label}</Kicker>
            <p style={{ ...serif, color: C.ink }} className="mt-2 text-3xl tabular-nums">
              {k.value}
            </p>
            <p
              className="mt-1 inline-flex items-center gap-1 text-xs tabular-nums"
              style={{ ...mono, color: k.up ? C.verified : C.sub }}
            >
              {k.up ? (
                <ArrowUpRight size={12} aria-hidden />
              ) : (
                <ArrowDownRight size={12} aria-hidden />
              )}
              {k.trend}
            </p>
          </div>
        ))}
      </section>

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <section>
          <Kicker>Voorgesteld</Kicker>
          <div className="mt-4">
            {OPDRACHTEN.slice(0, 3).map((o, i) => (
              <div key={o.id}>
                {i > 0 && <Rule />}
                <article className="flex items-baseline justify-between gap-4 py-4">
                  <div>
                    <h3 style={{ ...serif, color: C.ink }} className="text-xl leading-snug">
                      {o.titel}
                    </h3>
                    <p style={{ ...mono, color: C.sub }} className="mt-1 text-xs tabular-nums">
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </p>
                  </div>
                  <span
                    style={{ ...mono, color: C.accent }}
                    className="shrink-0 text-sm tabular-nums"
                  >
                    {o.match}%
                  </span>
                </article>
              </div>
            ))}
          </div>
        </section>

        <section>
          <Kicker>Wat vraagt je aandacht</Kicker>
          <ul className="mt-4 space-y-4">
            {ACTIES.map((a) => (
              <li key={a.titel} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: a.urgentie === "warning" ? C.expiring : C.accent }}
                />
                <div>
                  <p style={{ color: C.ink }} className="text-sm font-medium">
                    {a.titel}
                  </p>
                  <p style={{ color: C.sub }} className="text-xs leading-relaxed">
                    {a.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Marktplaats() {
  const filters = ["Alle opdrachten", "Boven 85%", "Eigen vervoer", "Dagdienst"];
  return (
    <div className="space-y-8">
      <div>
        <Kicker>Marktplaats — 12 open opdrachten</Kicker>
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((f, i) => (
            <span
              key={f}
              style={{
                ...mono,
                color: i === 0 ? C.paper : C.sub,
                background: i === 0 ? C.ink : "transparent",
                border: `1px solid ${i === 0 ? C.ink : C.line}`,
              }}
              className="rounded-full px-3 py-1 text-[11px] tracking-wide"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      <div>
        {OPDRACHTEN.map((o, i) => (
          <div key={o.id}>
            {i > 0 && <Rule />}
            <article className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <h3 style={{ ...serif, color: C.ink }} className="text-2xl leading-snug">
                  {o.titel}
                </h3>
                <p style={{ ...mono, color: C.sub }} className="mt-1.5 text-xs tabular-nums">
                  {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      style={{ color: C.sub, border: `1px solid ${C.line}` }}
                      className="rounded-full px-2.5 py-0.5 text-[11px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <span style={{ ...mono, color: C.accent }} className="shrink-0 text-lg tabular-nums">
                {o.match}%
              </span>
            </article>
          </div>
        ))}
      </div>
    </div>
  );
}

function OpdrachtDetail() {
  const o = OPDRACHTEN[0];
  if (!o) return null;
  return (
    <article className="space-y-10">
      <header className="space-y-4">
        <Kicker>Opdracht · {o.id}</Kicker>
        <h2 style={{ ...serif, color: C.ink }} className="text-4xl leading-[1.05] sm:text-5xl">
          {o.titel}
        </h2>
        <p style={{ ...mono, color: C.sub }} className="text-xs tabular-nums">
          {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.start}
        </p>
      </header>

      <div className="flex items-end gap-5">
        <p
          style={{ ...serif, color: C.accent }}
          className="text-6xl tabular-nums leading-none sm:text-7xl"
        >
          {o.match}%
        </p>
        <p style={{ ...serif, color: C.ink }} className="pb-1 text-lg">
          match met jouw profiel
        </p>
      </div>

      <Rule />

      <div className="grid gap-10 sm:grid-cols-2">
        <section>
          <Kicker>Waarom dit past</Kicker>
          <ul className="mt-4 space-y-3">
            {o.redenen.plus.map((r) => (
              <li key={r} className="flex gap-3 text-sm" style={{ color: C.ink }}>
                <Check size={16} strokeWidth={2.5} style={{ color: C.verified }} aria-hidden />
                {r}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <Kicker>Let op</Kicker>
          <ul className="mt-4 space-y-3">
            {o.redenen.min.map((r) => (
              <li key={r} className="flex gap-3 text-sm" style={{ color: C.ink }}>
                <AlertTriangle
                  size={16}
                  strokeWidth={2.5}
                  style={{ color: C.expiring }}
                  aria-hidden
                />
                {r}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          style={{ background: C.accent, color: C.paper }}
          className="rounded-full px-6 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          Reageer op opdracht
        </button>
        <button
          type="button"
          style={{ color: C.ink, border: `1px solid ${C.ink}` }}
          className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          <Bookmark size={15} aria-hidden />
          Bewaar
        </button>
      </div>
    </article>
  );
}

function Verificatie() {
  return (
    <div className="space-y-10">
      <header className="flex items-center gap-4">
        <span
          aria-hidden
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ border: `2px solid ${C.accent}`, color: C.accent }}
        >
          <ShieldCheck size={24} />
        </span>
        <div>
          <Kicker>Vertrouwensniveau</Kicker>
          <p style={{ ...serif, color: C.ink }} className="text-3xl">
            {PROFIEL.trust}
          </p>
        </div>
      </header>

      <Rule />

      <div>
        {CREDENTIALS.map((c, i) => {
          const m = credMeta[c.status];
          return (
            <div key={c.naam}>
              {i > 0 && <Rule />}
              <div className="flex items-center gap-4 py-5">
                <Seal status={c.status} />
                <div className="min-w-0 flex-1">
                  <h3 style={{ ...serif, color: C.ink }} className="text-xl leading-snug">
                    {c.naam}
                  </h3>
                  <p style={{ ...mono, color: C.sub }} className="mt-0.5 text-xs tabular-nums">
                    {c.detail}
                  </p>
                </div>
                <span
                  style={{ ...mono, color: m.ring }}
                  className="hidden shrink-0 text-[11px] uppercase tracking-[0.18em] sm:inline"
                >
                  {m.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === "warning" ? -1 : b.urgentie === "warning" ? 1 : 0,
  );
  return (
    <div className="space-y-6">
      <Kicker>Acties — {ACTIES.length} openstaand</Kicker>
      <div className="space-y-5">
        {sorted.map((a) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.expiring : C.accent;
          return (
            <article
              key={a.titel}
              className="rounded-lg p-5"
              style={{
                background: C.paper,
                border: `1px solid ${C.line}`,
                borderLeft: `3px solid ${color}`,
              }}
            >
              <div className="flex items-center gap-2">
                {warn ? (
                  <AlertTriangle size={13} style={{ color }} aria-hidden />
                ) : (
                  <ChevronRight size={13} style={{ color }} aria-hidden />
                )}
                <p style={{ ...mono, color }} className="text-[11px] uppercase tracking-[0.2em]">
                  {warn ? "Urgent" : "Aanbevolen"}
                </p>
              </div>
              <h3 style={{ ...serif, color: C.ink }} className="mt-2 text-xl leading-snug">
                {a.titel}
              </h3>
              <p style={{ color: C.sub }} className="mt-1 text-sm leading-relaxed">
                {a.detail}
              </p>
              <button
                type="button"
                style={{ color: C.accent }}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
              >
                {a.cta}
                <ArrowUpRight size={14} aria-hidden />
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Facturen() {
  return (
    <div className="space-y-6">
      <Kicker>Facturen — grootboek</Kicker>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.ink}` }}>
              {["Nr", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  style={{ ...mono, color: C.sub }}
                  className={`pb-2 text-[11px] uppercase tracking-[0.18em] ${
                    h === "Bedrag" ? "text-right" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => (
              <tr key={f.nr} style={{ borderBottom: `1px solid ${C.line}` }}>
                <td style={{ ...mono, color: C.sub }} className="py-3 text-xs tabular-nums">
                  {f.nr}
                </td>
                <td style={{ ...serif, color: C.ink }} className="py-3 pr-4 text-base">
                  {f.klant}
                </td>
                <td style={{ ...mono, color: C.sub }} className="py-3 text-xs tabular-nums">
                  {f.datum}
                </td>
                <td
                  style={{ ...mono, color: C.ink }}
                  className="py-3 text-right text-sm tabular-nums"
                >
                  {f.bedrag}
                </td>
                <td className="py-3 pl-4">
                  <StatusChip status={f.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Shell ---

export function Concept02() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      style={{
        fontFamily: "var(--font-lab-inter)",
        color: C.ink,
        background: `radial-gradient(120% 80% at 50% -10%, #f7f1e7 0%, ${C.bg} 55%)`,
      }}
      className="min-h-screen"
    >
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        {/* Masthead */}
        <header>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p
                style={{ ...serif, color: C.ink }}
                className="text-2xl leading-none tracking-tight sm:text-3xl"
              >
                ZorgBemiddeling
              </p>
              <p
                style={{ ...mono, color: C.sub }}
                className="mt-1.5 text-[10px] uppercase tabular-nums tracking-[0.28em]"
              >
                Editie 26 · Dinsdag 24 juni 2026 · Voor zelfstandigen
              </p>
            </div>
            <span
              aria-hidden
              style={{ ...serif, background: C.accent, color: C.paper }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm"
              title={PROFIEL.naam}
            >
              {PROFIEL.initialen}
            </span>
          </div>
          <div className="mt-5 h-px w-full" style={{ background: C.ink }} />
        </header>

        {/* Account nav */}
        <nav aria-label="Hoofdmenu" className="mt-4">
          <ul className="flex gap-5 overflow-x-auto pb-1" style={{ ...serif }}>
            {NAV.map((item, i) => (
              <li key={item}>
                <span
                  aria-current={i === 0 ? "page" : undefined}
                  className="whitespace-nowrap text-sm"
                  style={{ color: i === 0 ? C.ink : C.sub }}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </nav>

        <Rule />

        {/* Screen tabs — magazine section nav */}
        <nav aria-label="Schermen" className="mt-5">
          <ul className="flex gap-1 overflow-x-auto">
            {SCREENS.map((s) => {
              const active = s.key === screen;
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => setScreen(s.key)}
                    aria-current={active ? "page" : undefined}
                    style={{
                      ...mono,
                      color: active ? C.accent : C.sub,
                      borderBottom: `2px solid ${active ? C.accent : "transparent"}`,
                    }}
                    className="whitespace-nowrap px-2 pb-2 pt-1 text-[11px] uppercase tracking-[0.18em] transition-colors duration-150 hover:text-[#24201b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                  >
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <main className="mt-10 transition-opacity duration-150">
          {screen === "dashboard" && <Dashboard />}
          {screen === "marktplaats" && <Marktplaats />}
          {screen === "opdracht" && <OpdrachtDetail />}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>
    </div>
  );
}
