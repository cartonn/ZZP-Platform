"use client";

// Concept 10 — "Nocturne" · Verfijnd minimaal / quiet luxury dark.
// Palet: canvas #0a0a0b, paneel #111113, hairline-randen #1e1e22, tekst #e6e7ec, muted #8a8b93,
// één zacht accent per context (basis soft-indigo #818cf8). Fonts: Geist + Geist Mono.
// Filosofie: vlakke low-chroma-oppervlakken, hairlines (geen schaduwen), veel negatieve ruimte,
// tabular cijfers, subtiele tab-onderstreping. Minimalisme in het donker — niets schreeuwt.

import { useState } from "react";
import {
  LayoutGrid,
  Compass,
  FileSearch,
  ShieldCheck,
  CircleDot,
  ScrollText,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Minus,
  AlertTriangle,
  Plus,
  type LucideIcon,
} from "lucide-react";
import {
  SCREENS,
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  canvas: "#0a0a0b",
  panel: "#111113",
  panelSoft: "#151517",
  line: "#1e1e22",
  lineSoft: "#171719",
  text: "#e6e7ec",
  muted: "#8a8b93",
  faint: "#5c5d65",
  accent: "#818cf8",
};

// Eén rustig accent per scherm-context.
const ACCENT: Record<ScreenKey, string> = {
  dashboard: "#818cf8", // soft-indigo
  marktplaats: "#7dd3c0", // gedempt teal
  opdracht: "#c4b5fd", // zacht violet
  verificatie: "#86c19a", // ingetogen groen
  acties: "#e0b88a", // warm zand
  facturen: "#9db4d6", // koel staalblauw
  documenten: "#a9b0c0",
  berichten: "#b3a7d6",
};

const ui = { fontFamily: "var(--font-lab-geist)" };
const mono = {
  fontFamily: "var(--font-lab-geist-mono)",
  fontVariantNumeric: "tabular-nums" as const,
};

const NAV: { key: ScreenKey; label: string; icon: LucideIcon }[] = [
  { key: "dashboard", label: "Overzicht", icon: LayoutGrid },
  { key: "marktplaats", label: "Marktplaats", icon: Compass },
  { key: "opdracht", label: "Opdracht", icon: FileSearch },
  { key: "verificatie", label: "Verificatie", icon: ShieldCheck },
  { key: "acties", label: "Acties", icon: CircleDot },
  { key: "facturen", label: "Facturen", icon: ScrollText },
];

function credLabel(s: CredStatus): { label: string; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", tone: "#86c19a" };
    case "SUBMITTED":
      return { label: "In beoordeling", tone: "#818cf8" };
    case "EXPIRING":
      return { label: "Verloopt bijna", tone: "#e0b88a" };
    case "REJECTED":
      return { label: "Afgewezen", tone: "#d68a8a" };
  }
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 72;
  const h = 22;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.25}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Concept10() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const accent = ACCENT[screen];
  const active: Opdracht = OPDRACHTEN[0]!;
  const titel = SCREENS.find((s) => s.key === screen)?.label ?? "";

  return (
    <div
      className="flex min-h-[640px] w-full antialiased"
      style={{ ...ui, background: C.canvas, color: C.text }}
    >
      {/* Sidebar */}
      <aside
        className="hidden w-56 shrink-0 flex-col px-3 py-6 md:flex"
        style={{ borderRight: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-2.5 px-2.5">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-medium"
            style={{ background: C.panel, border: `1px solid ${C.line}`, color: accent }}
            aria-hidden="true"
          >
            ⬡
          </span>
          <span className="text-[13px] font-medium tracking-tight">Atelier</span>
        </div>

        <nav className="mt-8 flex flex-col gap-0.5" aria-label="Hoofdnavigatie">
          {NAV.map((n) => {
            const on = screen === n.key;
            const Icon = n.icon;
            return (
              <button
                key={n.key}
                type="button"
                onClick={() => setScreen(n.key)}
                aria-current={on ? "page" : undefined}
                className="group flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] transition focus-visible:outline-none focus-visible:ring-1"
                style={{
                  color: on ? C.text : C.muted,
                  background: on ? C.panel : "transparent",
                }}
              >
                <Icon
                  size={16}
                  aria-hidden="true"
                  style={{ color: on ? ACCENT[n.key] : C.faint }}
                  className="transition"
                />
                {n.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto px-1 pt-6">
          <div
            className="flex items-center gap-2.5 rounded-xl p-2.5"
            style={{ border: `1px solid ${C.line}` }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-medium"
              style={{ background: C.panel, color: accent }}
            >
              {PROFIEL.initialen}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[12px] font-medium">{PROFIEL.naam}</p>
              <p className="truncate text-[10px]" style={{ color: C.faint }}>
                {PROFIEL.trust}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Hoofdkolom */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header
          className="flex items-center justify-between px-6 py-4 md:px-10"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <div>
            <p className="text-[11px]" style={{ color: C.faint }}>
              {PROFIEL.rol}
            </p>
            <h1 className="text-[15px] font-medium tracking-tight">{titel}</h1>
          </div>
          {/* Mobiele nav-tabs met subtiele onderstreping */}
          <div className="flex gap-1 md:hidden" role="tablist" aria-label="Schermen">
            {NAV.slice(0, 4).map((n) => (
              <button
                key={n.key}
                type="button"
                role="tab"
                aria-selected={screen === n.key}
                onClick={() => setScreen(n.key)}
                className="rounded-md px-2 py-1 text-[11px] focus-visible:outline-none focus-visible:ring-1"
                style={{ color: screen === n.key ? C.text : C.faint }}
              >
                {n.label}
              </button>
            ))}
          </div>
          <span
            className="hidden items-center gap-2 rounded-full px-3 py-1.5 text-[11px] md:inline-flex"
            style={{ border: `1px solid ${C.line}`, color: C.muted }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: accent }}
              aria-hidden="true"
            />
            Synchroon
          </span>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-12">
          <div className="mx-auto max-w-3xl">
            {screen === "dashboard" && <DashboardScreen accent={accent} />}
            {screen === "marktplaats" && <MarktplaatsScreen accent={accent} />}
            {screen === "opdracht" && <OpdrachtScreen opdracht={active} accent={accent} />}
            {screen === "verificatie" && <VerificatieScreen accent={accent} />}
            {screen === "acties" && <ActiesScreen accent={accent} />}
            {screen === "facturen" && <FacturenScreen accent={accent} />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------------- Schermen ---------------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-5 text-[11px] font-medium uppercase tracking-[0.14em]"
      style={{ color: C.faint }}
    >
      {children}
    </p>
  );
}

function DashboardScreen({ accent }: { accent: string }) {
  const warn = ACTIES.find((a) => a.urgentie === "warning");
  return (
    <div className="space-y-12">
      {warn && (
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
          role="status"
        >
          <AlertTriangle
            size={16}
            style={{ color: "#e0b88a" }}
            aria-hidden="true"
            className="mt-0.5 shrink-0"
          />
          <div>
            <p className="text-[13px]">{warn.titel}</p>
            <button
              type="button"
              className="mt-1 text-[12px] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-1"
              style={{ color: "#e0b88a" }}
            >
              {warn.cta}
            </button>
          </div>
        </div>
      )}

      {/* KPI's — vlak, hairline, veel ruimte */}
      <section>
        <SectionLabel>Deze maand</SectionLabel>
        <div
          className="grid grid-cols-2 gap-px overflow-hidden rounded-xl md:grid-cols-4"
          style={{ background: C.line }}
        >
          {KPIS.map((k) => (
            <div key={k.label} className="px-5 py-6" style={{ background: C.canvas }}>
              <p className="text-[11px]" style={{ color: C.muted }}>
                {k.label}
              </p>
              <p className="mt-3 text-2xl font-medium tracking-tight" style={mono}>
                {k.value}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-1 text-[11px]"
                  style={{ ...mono, color: k.up ? "#86c19a" : C.muted }}
                >
                  {k.up ? (
                    <ArrowUpRight size={11} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={11} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
                <Sparkline data={k.spark} color={k.up ? accent : C.faint} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Aanbevolen */}
      <section>
        <div className="mb-5 flex items-baseline justify-between">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.14em]"
            style={{ color: C.faint }}
          >
            Aanbevolen
          </p>
          <span className="text-[11px]" style={{ ...mono, color: C.muted }}>
            {OPDRACHTEN.length} matches
          </span>
        </div>
        <div className="divide-y" style={{ borderColor: C.line }}>
          {OPDRACHTEN.map((o) => (
            <div
              key={o.id}
              className="group flex items-center gap-4 py-4 transition"
              style={{ borderColor: C.line }}
            >
              <span
                className="text-[13px] tabular-nums"
                style={{ ...mono, color: accent, minWidth: 32 }}
              >
                {o.match}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px]">{o.titel}</p>
                <p className="mt-0.5 truncate text-[11px]" style={{ color: C.muted }}>
                  {o.opdrachtgever} · {o.plaats}
                </p>
              </div>
              <span className="hidden text-[12px] sm:block" style={{ ...mono, color: C.text }}>
                {o.tarief}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MatchBar({ value, accent }: { value: number; accent: string }) {
  return (
    <div
      className="h-1 w-full overflow-hidden rounded-full"
      style={{ background: C.line }}
      aria-hidden="true"
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${value}%`,
          background: accent,
          transition: "width .6s cubic-bezier(.22,1,.36,1)",
        }}
      />
    </div>
  );
}

function MarktplaatsScreen({ accent }: { accent: string }) {
  const [sel, setSel] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  return (
    <div className="space-y-8">
      <SectionLabel>Open diensten</SectionLabel>
      <div className="space-y-px overflow-hidden rounded-xl" style={{ background: C.line }}>
        {OPDRACHTEN.map((o) => {
          const on = sel === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setSel(o.id)}
              aria-pressed={on}
              className="block w-full px-6 py-5 text-left transition focus-visible:outline-none focus-visible:ring-1"
              style={{ background: on ? C.panel : C.canvas }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-[14px] font-medium tracking-tight">{o.titel}</h3>
                  <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.uren}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[14px]" style={{ ...mono, color: C.text }}>
                    {o.tarief}
                  </p>
                  <p className="mt-0.5 text-[11px]" style={{ ...mono, color: accent }}>
                    {o.match} match
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex-1">
                  <MatchBar value={o.match} accent={accent} />
                </div>
                <div className="flex gap-1.5">
                  {o.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="rounded-md px-2 py-0.5 text-[10px]"
                      style={{ border: `1px solid ${C.line}`, color: C.muted }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OpdrachtScreen({ opdracht, accent }: { opdracht: Opdracht; accent: string }) {
  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-xl font-medium tracking-tight">{opdracht.titel}</h2>
            <p className="mt-1.5 text-[13px]" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <span
            className="rounded-full px-3 py-1 text-[12px]"
            style={{ ...mono, border: `1px solid ${C.line}`, color: accent }}
          >
            {opdracht.match} match
          </span>
        </div>
        <div
          className="grid grid-cols-3 gap-px overflow-hidden rounded-xl"
          style={{ background: C.line }}
        >
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Inzet", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
          ].map((m) => (
            <div key={m.l} className="px-5 py-4" style={{ background: C.canvas }}>
              <p className="text-[11px]" style={{ color: C.muted }}>
                {m.l}
              </p>
              <p className="mt-1.5 text-[14px]" style={mono}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </header>

      <section>
        <SectionLabel>Waarom dit past</SectionLabel>
        <ul className="space-y-3">
          {opdracht.redenen.plus.map((r) => (
            <li key={r} className="flex items-start gap-3 text-[13px]">
              <Check
                size={15}
                style={{ color: "#86c19a" }}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
              />
              {r}
            </li>
          ))}
          {opdracht.redenen.min.map((r) => (
            <li key={r} className="flex items-start gap-3 text-[13px]" style={{ color: C.muted }}>
              <Minus
                size={15}
                style={{ color: C.faint }}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
              />
              {r}
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        className="rounded-lg px-5 py-2.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-1"
        style={{ background: accent, color: C.canvas }}
      >
        Reageren op opdracht
      </button>
    </div>
  );
}

function VerificatieScreen({ accent }: { accent: string }) {
  return (
    <div className="space-y-12">
      <header className="flex items-end justify-between">
        <div>
          <SectionLabel>Vertrouwen</SectionLabel>
          <p className="text-2xl font-medium tracking-tight">{PROFIEL.trust}</p>
          <p className="mt-1.5 text-[12px]" style={{ color: C.muted }}>
            2 van 4 documenten geverifieerd · 1 in beoordeling
          </p>
        </div>
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ border: `1px solid ${C.line}` }}
        >
          <ShieldCheck size={22} style={{ color: accent }} aria-hidden="true" />
        </span>
      </header>

      <div className="divide-y" style={{ borderColor: C.line }}>
        {CREDENTIALS.map((c) => {
          const s = credLabel(c.status);
          return (
            <div key={c.naam} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="truncate text-[13px]">{c.naam}</p>
                <p className="mt-0.5 truncate text-[11px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="inline-flex shrink-0 items-center gap-1.5 text-[11px]"
                style={{ color: s.tone }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: s.tone }}
                  aria-hidden="true"
                />
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <section>
        <SectionLabel>Documenten</SectionLabel>
        <div className="space-y-px overflow-hidden rounded-xl" style={{ background: C.line }}>
          {DOCUMENTEN.map((d) => {
            const s = credLabel(d.status);
            return (
              <div
                key={d.naam}
                className="flex items-center justify-between gap-4 px-5 py-3.5"
                style={{ background: C.canvas }}
              >
                <div className="min-w-0">
                  <p className="truncate text-[12px]">{d.naam}</p>
                  <p className="text-[10px]" style={{ ...mono, color: C.faint }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </p>
                </div>
                <span className="text-[11px]" style={{ color: s.tone }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] transition focus-visible:outline-none focus-visible:ring-1"
          style={{ border: `1px solid ${C.line}`, color: C.text }}
        >
          <Plus size={14} aria-hidden="true" />
          Document toevoegen
        </button>
      </section>
    </div>
  );
}

function ActiesScreen({ accent }: { accent: string }) {
  return (
    <div className="space-y-8">
      <SectionLabel>Te doen</SectionLabel>
      <div className="space-y-px overflow-hidden rounded-xl" style={{ background: C.line }}>
        {ACTIES.map((a) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? "#e0b88a" : accent;
          return (
            <div
              key={a.titel}
              className="flex items-start gap-4 px-6 py-5"
              style={{ background: C.canvas }}
            >
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ border: `1px solid ${C.line}` }}
              >
                {warn ? (
                  <AlertTriangle size={14} style={{ color: tone }} aria-hidden="true" />
                ) : (
                  <CircleDot size={14} style={{ color: tone }} aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px]">{a.titel}</p>
                <p className="mt-1 text-[12px] leading-relaxed" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] transition focus-visible:outline-none focus-visible:ring-1"
                style={{ border: `1px solid ${C.line}`, color: tone }}
              >
                {a.cta}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FacturenScreen({ accent }: { accent: string }) {
  function tone(status: string) {
    if (status === "Betaald") return "#86c19a";
    if (status === "Openstaand") return accent;
    return C.faint;
  }
  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <SectionLabel>Facturen</SectionLabel>
        <span className="text-[11px]" style={{ ...mono, color: C.muted }}>
          {FACTUREN.length} totaal
        </span>
      </div>

      <div
        className="grid grid-cols-2 gap-px overflow-hidden rounded-xl"
        style={{ background: C.line }}
      >
        <div className="px-5 py-5" style={{ background: C.canvas }}>
          <p className="text-[11px]" style={{ color: C.muted }}>
            Betaald (mnd)
          </p>
          <p className="mt-2 text-xl font-medium" style={{ ...mono, color: "#86c19a" }}>
            € 5.552
          </p>
        </div>
        <div className="px-5 py-5" style={{ background: C.canvas }}>
          <p className="text-[11px]" style={{ color: C.muted }}>
            Openstaand
          </p>
          <p className="mt-2 text-xl font-medium" style={{ ...mono, color: accent }}>
            € 1.350
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${C.line}` }}>
        <table className="w-full text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-[10px] font-medium uppercase tracking-[0.1em]"
                  style={{ color: C.faint }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => (
              <tr
                key={f.nr}
                className="transition hover:bg-[#111113]"
                style={{ borderBottom: `1px solid ${C.lineSoft}` }}
              >
                <td className="px-5 py-3.5 text-[12px]" style={mono}>
                  {f.nr}
                </td>
                <td className="px-5 py-3.5 text-[12px]" style={{ color: C.muted }}>
                  {f.klant}
                </td>
                <td className="px-5 py-3.5 text-[12px]" style={{ ...mono, color: C.muted }}>
                  {f.datum}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px]"
                    style={{ color: tone(f.status) }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: tone(f.status) }}
                      aria-hidden="true"
                    />
                    {f.status}
                  </span>
                </td>
                <td
                  className="px-5 py-3.5 text-right text-[12px]"
                  style={{ ...mono, color: C.text }}
                >
                  {f.bedrag}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
