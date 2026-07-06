"use client";

// Concept 136 — "Loep" · pro-tool inspector / master-detail.
// Een verfijnd professioneel gereedschap in de geest van Figma/Linear: links een compacte,
// hoge-dichtheid lijst/tree, rechts een properties-INSPECTOR die het geselecteerde item ontleedt
// in secties met labels/waarden, chips en inline-acties. Licht, ultra-precies, hairline-scheidingen,
// subtiele hover-selectie, één ingetogen indigo/blauw accent. Onderscheidend van "index"
// (database-views), "revisie" (diff) en "kader" (fintech-ops): dit is een MASTER-DETAIL
// INSPECTOR-paradigma met een properties-paneel. Fonts: Inter (UI) + JetBrains Mono (waarden).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  ChevronRight,
  SlidersHorizontal,
  Layers,
  CircleDot,
  Copy,
  ExternalLink,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// Licht, precies palet — één ingetogen indigo als accent.
const C = {
  bg: "#f7f8fa", // canvas
  panel: "#ffffff", // paneel
  panelSoft: "#f2f4f7", // gedempt vlak / hover
  sel: "#eef1fd", // selectie (indigo-tint)
  fg: "#1a1d24", // primaire tekst
  fgSoft: "#5b6472", // secundaire tekst
  fgFaint: "#98a1b0", // labels
  indigo: "#4f5bd5", // accent
  indigoSoft: "#6b76e0",
  green: "#2f9e6a", // geverifieerd
  amber: "#c98a1e", // caution
  red: "#d3453f", // afgewezen
  line: "#e7eaef", // hairline
  lineStrong: "#dce0e7",
};

const ui = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tone: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.indigo };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red };
  }
}

function matchTone(v: number): string {
  return v >= 90 ? C.green : v >= 80 ? C.amber : C.indigo;
}

// ── Bouwstenen ────────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
      style={{ color: C.fgFaint }}
    >
      {children}
    </span>
  );
}

function Chip({
  children,
  tone,
  subtle = false,
}: {
  children: React.ReactNode;
  tone: string;
  subtle?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={
        subtle
          ? { background: C.panelSoft, color: C.fgSoft, border: `1px solid ${C.line}` }
          : { background: `${tone}14`, color: tone, border: `1px solid ${tone}33` }
      }
    >
      {children}
    </span>
  );
}

// Property-rij in de inspector: label links, mono-waarde rechts.
function Prop({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <Label>{label}</Label>
      <span
        className="text-[12.5px] font-medium tabular-nums"
        style={{ ...mono, color: tone ?? C.fg }}
      >
        {value}
      </span>
    </div>
  );
}

// Inspector-sectie met kop.
function Section({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="px-4 py-3.5" style={{ borderTop: `1px solid ${C.line}` }}>
      <div className="mb-2 flex items-center justify-between">
        <Label>{title}</Label>
        {right}
      </div>
      {children}
    </section>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 100;
    return `${x},${y}`;
  });
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-6 w-full" aria-hidden="true">
      <polyline
        points={`0,100 ${pts.join(" ")} 100,100`}
        fill={tone}
        opacity={0.08}
        stroke="none"
      />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={tone}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Kleine ring-meter voor de match.
function RingMeter({ value, size = 46 }: { value: number; size?: number }) {
  const tone = matchTone(value);
  const r = 16;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - value / 100);
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke={C.line} strokeWidth="3.2" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
        />
      </svg>
      <span
        className="absolute text-[12px] font-semibold tabular-nums"
        style={{ ...mono, color: tone }}
      >
        {value}
      </span>
    </span>
  );
}

// ── Root ────────────────────────────────────────────────────────────────────
export function Concept136() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.bg, color: C.fg }}
    >
      {/* Chrome-balk */}
      <header
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 md:px-7"
        style={{ background: C.panel, borderBottom: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: C.indigo }}
          >
            <SlidersHorizontal
              size={16}
              strokeWidth={2.4}
              style={{ color: "#fff" }}
              aria-hidden="true"
            />
          </span>
          <div className="leading-none">
            <div
              className="flex items-center gap-2 text-[14px] font-semibold tracking-[-0.01em]"
              style={{ color: C.fg }}
            >
              Loep
              <span
                className="text-[10px] font-medium uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.fgFaint }}
              >
                inspector
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[12.5px] font-semibold" style={{ color: C.fg }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ color: C.fgSoft }}>
              {PROFIEL.rol}
            </div>
          </div>
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold"
            style={{ background: C.sel, color: C.indigo }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Tab-nav */}
      <nav
        className="flex items-center gap-0.5 overflow-x-auto px-4 md:px-6"
        style={{ background: C.panel, borderBottom: `1px solid ${C.line}` }}
        aria-label="Hoofdnavigatie"
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-3 py-2.5 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={
                {
                  color: on ? C.indigo : C.fgSoft,
                  "--tw-ring-color": C.indigo,
                } as React.CSSProperties
              }
            >
              {s.label}
              {on && (
                <span
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                  style={{ background: C.indigo }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        {screen === "dashboard" && (
          <Dashboard onOpen={() => setScreen("opdracht")} onActies={() => setScreen("acties")} />
        )}
        {screen === "marktplaats" && <Marktplaats />}
        {screen === "opdracht" && <Marktplaats initialId={OPDRACHTEN[0]?.id} />}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const tones = [C.indigo, C.green, C.amber, C.indigoSoft];
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Layers size={15} style={{ color: C.indigo }} aria-hidden="true" />
        <h1 className="text-[16px] font-semibold tracking-[-0.01em]" style={{ color: C.fg }}>
          Overzicht
        </h1>
        <span className="text-[12px]" style={{ color: C.fgSoft }}>
          · {PROFIEL.plaats}
        </span>
      </div>

      {/* Prioriteit-banner */}
      <div
        className="overflow-hidden rounded-xl"
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          boxShadow: `0 1px 2px rgba(20,25,40,0.04)`,
        }}
      >
        <div className="flex items-stretch">
          <span className="w-1 shrink-0" style={{ background: C.amber }} aria-hidden="true" />
          <div className="flex flex-1 flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <AlertTriangle
                size={18}
                strokeWidth={2.2}
                className="mt-0.5 shrink-0"
                style={{ color: C.amber }}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Label>Prioriteit</Label>
                  <span className="sr-only">Waarschuwing</span>
                </div>
                <h2
                  className="mt-0.5 text-[15px] font-semibold leading-tight"
                  style={{ color: C.fg }}
                >
                  {primair.titel}
                </h2>
                <p
                  className="mt-0.5 max-w-md text-[12.5px] leading-relaxed"
                  style={{ color: C.fgSoft }}
                >
                  {primair.detail}
                </p>
              </div>
            </div>
            <button
              onClick={onActies}
              className="group inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-semibold transition-all hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={
                {
                  background: C.indigo,
                  color: "#fff",
                  "--tw-ring-color": C.indigo,
                } as React.CSSProperties
              }
            >
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI-grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const tone = tones[i % tones.length] as string;
          return (
            <div
              key={k.label}
              className="rounded-xl p-4 transition-shadow hover:shadow-sm"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <div className="flex items-center justify-between">
                <Label>{k.label}</Label>
                <span
                  className="text-[10.5px] font-semibold tabular-nums"
                  style={{ ...mono, color: k.up ? C.green : C.amber }}
                >
                  {k.up ? "▲" : "▼"} {k.trend}
                </span>
              </div>
              <div
                className="mt-2 text-[24px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
                style={{ color: C.fg }}
              >
                {k.value}
              </div>
              <div className="mt-3">
                <Spark data={k.spark} tone={tone} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Split: top-match inspector-preview + credentials */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <button
          onClick={onOpen}
          className="group block rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ "--tw-ring-color": C.indigo } as React.CSSProperties}
        >
          <div
            className="h-full rounded-xl transition-shadow hover:shadow-sm"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <Label>Beste match</Label>
              <ChevronRight
                size={15}
                className="transition-transform group-hover:translate-x-0.5"
                style={{ color: C.fgFaint }}
                aria-hidden="true"
              />
            </div>
            <div className="flex items-center gap-3 px-4 py-4">
              <RingMeter value={top.match} size={52} />
              <div className="min-w-0">
                <div
                  className="truncate text-[14px] font-semibold leading-tight"
                  style={{ color: C.fg }}
                >
                  {top.titel}
                </div>
                <div className="mt-0.5 truncate text-[12px]" style={{ ...mono, color: C.fgSoft }}>
                  {top.opdrachtgever} · {top.plaats}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 px-4 pb-4">
              {top.tags.map((t) => (
                <Chip key={t} tone={C.indigo} subtle>
                  {t}
                </Chip>
              ))}
            </div>
          </div>
        </button>

        <div className="rounded-xl" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <Label>Credentials</Label>
            <ShieldCheck size={14} style={{ color: C.indigo }} aria-hidden="true" />
          </div>
          <ul>
            {CREDENTIALS.map((c) => {
              const st = statusMeta(c.status);
              return (
                <li
                  key={c.naam}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{ borderTop: `1px solid ${C.line}` }}
                >
                  <st.Icon
                    size={14}
                    strokeWidth={2.2}
                    style={{ color: st.tone }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-[12.5px]" style={{ color: C.fg }}>
                    {c.naam}
                  </span>
                  <Chip tone={st.tone}>{st.label}</Chip>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Marktplaats (master-detail inspector) ─────────────────────────────────────
function Marktplaats({ initialId }: { initialId?: string }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () =>
      OPDRACHTEN.filter(
        (o) =>
          o.titel.toLowerCase().includes(q.toLowerCase()) ||
          o.plaats.toLowerCase().includes(q.toLowerCase()) ||
          o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
      ),
    [q],
  );
  const [selId, setSelId] = useState<string | undefined>(initialId ?? OPDRACHTEN[0]?.id);
  const selected = filtered.find((o) => o.id === selId) ?? filtered[0];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* Master: lijst */}
      <div
        className="flex flex-col overflow-hidden rounded-xl"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2.5"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <Search size={15} style={{ color: C.fgFaint }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter opdrachten…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent py-1 text-[12.5px] outline-none placeholder:opacity-50"
            style={{ color: C.fg }}
          />
          <span
            className="shrink-0 text-[11px] font-medium tabular-nums"
            style={{ ...mono, color: C.fgFaint }}
          >
            {filtered.length}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
            <Search size={28} style={{ color: C.fgFaint }} aria-hidden="true" />
            <p className="text-[13px] font-semibold" style={{ color: C.fg }}>
              Geen resultaten
            </p>
            <p className="max-w-[16rem] text-[12px]" style={{ color: C.fgSoft }}>
              Niets past bij “{q}”.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-1 rounded-md px-3 py-1.5 text-[11.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.sel, color: C.indigo }}
            >
              Filter wissen
            </button>
          </div>
        ) : (
          <ul className="max-h-[560px] overflow-y-auto">
            {filtered.map((o) => {
              const on = selected?.id === o.id;
              return (
                <li key={o.id}>
                  <button
                    onClick={() => setSelId(o.id)}
                    aria-current={on ? "true" : undefined}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={
                      {
                        background: on ? C.sel : "transparent",
                        borderTop: `1px solid ${C.line}`,
                        boxShadow: on ? `inset 2px 0 0 ${C.indigo}` : "none",
                        "--tw-ring-color": C.indigo,
                      } as React.CSSProperties
                    }
                  >
                    <RingMeter value={o.match} size={38} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[12.5px] font-semibold leading-tight"
                        style={{ color: on ? C.indigo : C.fg }}
                      >
                        {o.titel}
                      </div>
                      <div className="truncate text-[11px]" style={{ ...mono, color: C.fgSoft }}>
                        {o.opdrachtgever} · {o.plaats}
                      </div>
                    </div>
                    <ChevronRight
                      size={14}
                      className="shrink-0"
                      style={{ color: on ? C.indigo : C.fgFaint }}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Detail: inspector */}
      {selected ? (
        <div
          className="overflow-hidden rounded-xl"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <div className="flex items-start justify-between gap-3 px-4 pt-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10.5px] font-medium uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.fgFaint }}
                >
                  {selected.id}
                </span>
                <Chip tone={matchTone(selected.match)}>{selected.match}% match</Chip>
              </div>
              <h2
                className="mt-1.5 text-[19px] font-semibold leading-tight tracking-[-0.01em]"
                style={{ color: C.fg }}
              >
                {selected.titel}
              </h2>
              <p className="mt-0.5 text-[12.5px]" style={{ ...mono, color: C.fgSoft }}>
                {selected.opdrachtgever} · {selected.plaats}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <IconBtn label="Kopieer referentie">
                <Copy size={14} aria-hidden="true" />
              </IconBtn>
              <IconBtn label="Open extern">
                <ExternalLink size={14} aria-hidden="true" />
              </IconBtn>
            </div>
          </div>

          <div className="mt-3">
            <Section title="Eigenschappen">
              <div className="divide-y" style={{ borderColor: C.line }}>
                <Prop label="Tarief" value={selected.tarief} tone={C.fg} />
                <Prop label="Omvang" value={selected.uren} />
                <Prop label="Start" value={selected.start} />
                <Prop label="Plaats" value={selected.plaats} />
              </div>
            </Section>

            <Section title="Labels">
              <div className="flex flex-wrap gap-1.5">
                {selected.tags.map((t) => (
                  <Chip key={t} tone={C.indigo} subtle>
                    {t}
                  </Chip>
                ))}
              </div>
            </Section>

            <Section
              title={`Match-redenen · ${selected.match}%`}
              right={<RingMeter value={selected.match} size={34} />}
            >
              <ul className="space-y-2">
                {selected.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[12.5px] leading-snug"
                    style={{ color: C.fg }}
                  >
                    <Check
                      size={14}
                      strokeWidth={2.4}
                      className="mt-0.5 shrink-0"
                      style={{ color: C.green }}
                      aria-hidden="true"
                    />
                    {r}
                  </li>
                ))}
                {selected.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[12.5px] leading-snug"
                    style={{ color: C.fgSoft }}
                  >
                    <AlertTriangle
                      size={14}
                      strokeWidth={2.2}
                      className="mt-0.5 shrink-0"
                      style={{ color: C.amber }}
                      aria-hidden="true"
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Volgende actie">
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  className="group inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[12.5px] font-semibold transition-all hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={
                    {
                      background: C.indigo,
                      color: "#fff",
                      "--tw-ring-color": C.indigo,
                    } as React.CSSProperties
                  }
                >
                  Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-[12.5px] font-semibold transition-colors hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ border: `1px solid ${C.lineStrong}`, color: C.fg }}
                >
                  Bewaar
                </button>
              </div>
            </Section>
          </div>
        </div>
      ) : (
        <div
          className="flex items-center justify-center rounded-xl p-10 text-center"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <p className="text-[13px]" style={{ color: C.fgSoft }}>
            Selecteer een opdracht om de inspector te tonen.
          </p>
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{ color: C.fgSoft, "--tw-ring-color": C.indigo } as React.CSSProperties}
      aria-label={label}
    >
      {children}
    </button>
  );
}

// ── Verificatie (master-detail) ──────────────────────────────────────────────
function Verificatie() {
  const [selNaam, setSelNaam] = useState<string>(CREDENTIALS[0]?.naam ?? "");
  const selected = CREDENTIALS.find((c) => c.naam === selNaam) ?? CREDENTIALS[0];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div
        className="overflow-hidden rounded-xl"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} style={{ color: C.indigo }} aria-hidden="true" />
            <Label>Credentials</Label>
          </div>
          <span
            className="text-[11px] font-semibold tabular-nums"
            style={{ ...mono, color: C.green }}
          >
            {pct}% gedekt
          </span>
        </div>
        <ul>
          {CREDENTIALS.map((c) => {
            const st = statusMeta(c.status);
            const on = selected?.naam === c.naam;
            return (
              <li key={c.naam}>
                <button
                  onClick={() => setSelNaam(c.naam)}
                  aria-current={on ? "true" : undefined}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={
                    {
                      background: on ? C.sel : "transparent",
                      borderTop: `1px solid ${C.line}`,
                      boxShadow: on ? `inset 2px 0 0 ${C.indigo}` : "none",
                      "--tw-ring-color": C.indigo,
                    } as React.CSSProperties
                  }
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                    style={{ background: `${st.tone}14`, color: st.tone }}
                    aria-hidden="true"
                  >
                    <st.Icon size={15} strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12.5px] font-semibold"
                      style={{ color: on ? C.indigo : C.fg }}
                    >
                      {c.naam}
                    </div>
                    <div className="truncate text-[11px]" style={{ color: C.fgSoft }}>
                      {c.detail}
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    className="shrink-0"
                    style={{ color: on ? C.indigo : C.fgFaint }}
                    aria-hidden="true"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {selected && (
        <div
          className="overflow-hidden rounded-xl"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <div className="px-4 pt-4">
            {(() => {
              const st = statusMeta(selected.status);
              return (
                <>
                  <div className="flex items-center gap-2">
                    <Chip tone={st.tone}>
                      <st.Icon size={12} strokeWidth={2.4} aria-hidden="true" /> {st.label}
                    </Chip>
                  </div>
                  <h2
                    className="mt-2 text-[19px] font-semibold leading-tight tracking-[-0.01em]"
                    style={{ color: C.fg }}
                  >
                    {selected.naam}
                  </h2>
                  <p className="mt-0.5 text-[12.5px]" style={{ ...mono, color: C.fgSoft }}>
                    {selected.detail}
                  </p>
                </>
              );
            })()}
          </div>

          <div className="mt-3">
            <Section title="Status">
              <div className="divide-y" style={{ borderColor: C.line }}>
                <Prop label="Type" value="Certificaat" />
                <Prop
                  label="Toestand"
                  value={statusMeta(selected.status).label}
                  tone={statusMeta(selected.status).tone}
                />
                <Prop label="Zichtbaarheid" value="Privé" />
              </div>
            </Section>
            <Section title="Vertrouwen">
              <div
                className="flex items-center gap-3 rounded-lg px-3 py-3"
                style={{ background: C.panelSoft }}
              >
                <ShieldCheck size={18} style={{ color: C.green }} aria-hidden="true" />
                <div>
                  <div className="text-[12.5px] font-semibold" style={{ color: C.fg }}>
                    {PROFIEL.trust}
                  </div>
                  <div className="text-[11.5px]" style={{ color: C.fgSoft }}>
                    {verified} van {CREDENTIALS.length} credentials geverifieerd.
                  </div>
                </div>
              </div>
            </Section>
            <Section title="Volgende actie">
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  {
                    background: selected.status === "VERIFIED" ? C.panelSoft : C.indigo,
                    color: selected.status === "VERIFIED" ? C.fgSoft : "#fff",
                    border: selected.status === "VERIFIED" ? `1px solid ${C.line}` : "none",
                    "--tw-ring-color": C.indigo,
                  } as React.CSSProperties
                }
              >
                {selected.status === "VERIFIED"
                  ? "Geen actie nodig"
                  : selected.status === "EXPIRING"
                    ? "Vernieuwen"
                    : "Bekijk beoordeling"}
              </button>
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Acties ───────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CircleDot size={15} style={{ color: C.indigo }} aria-hidden="true" />
        <h1 className="text-[16px] font-semibold tracking-[-0.01em]" style={{ color: C.fg }}>
          Volgende acties
        </h1>
      </div>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.indigo;
          return (
            <li key={a.titel}>
              <div
                className="overflow-hidden rounded-xl"
                style={{ background: C.panel, border: `1px solid ${C.line}` }}
              >
                <div className="flex items-stretch">
                  <span className="w-1 shrink-0" style={{ background: tone }} aria-hidden="true" />
                  <div className="flex flex-1 flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold tabular-nums"
                      style={{ ...mono, background: `${tone}14`, color: tone }}
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {warn ? (
                          <AlertTriangle
                            size={13}
                            strokeWidth={2.4}
                            style={{ color: tone }}
                            aria-hidden="true"
                          />
                        ) : (
                          <CircleDot
                            size={13}
                            strokeWidth={2.4}
                            style={{ color: tone }}
                            aria-hidden="true"
                          />
                        )}
                        <Label>{warn ? "Urgent" : "Informatief"}</Label>
                      </div>
                      <h3
                        className="mt-0.5 text-[14px] font-semibold leading-tight"
                        style={{ color: C.fg }}
                      >
                        {a.titel}
                      </h3>
                      <p
                        className="mt-0.5 text-[12.5px] leading-relaxed"
                        style={{ color: C.fgSoft }}
                      >
                        {a.detail}
                      </p>
                    </div>
                    <button
                      className="shrink-0 self-start rounded-lg px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:self-center"
                      style={
                        {
                          background: tone,
                          color: "#fff",
                          "--tw-ring-color": tone,
                        } as React.CSSProperties
                      }
                    >
                      {a.cta}
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────
function Facturen() {
  const total = "€ 8.622";
  const badge = (status: string): string => {
    if (status === "Betaald") return C.green;
    if (status === "Openstaand") return C.amber;
    if (status === "Concept") return C.fgFaint;
    return C.indigo;
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[16px] font-semibold tracking-[-0.01em]" style={{ color: C.fg }}>
          Facturen
        </h1>
        <button
          className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={
            {
              background: C.indigo,
              color: "#fff",
              "--tw-ring-color": C.indigo,
            } as React.CSSProperties
          }
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div
        className="overflow-x-auto rounded-xl"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] ${i === 4 ? "text-right" : ""}`}
                  style={{ color: C.fgFaint }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const tone = badge(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-black/[0.015]"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <td
                    className="px-4 py-3 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.fgSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-medium" style={{ color: C.fg }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.fgSoft }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-3">
                    <Chip tone={tone}>
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: tone }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </Chip>
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[13.5px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.fg }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `1px solid ${C.lineStrong}` }}>
              <td
                colSpan={4}
                className="px-4 py-3.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.fgFaint }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-3.5 text-right text-[16px] font-semibold tabular-nums"
                style={{ ...mono, color: C.green }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
